import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { hashPassword, normalizePhoneNumber, parseDateOfBirth } from './studentProvisioning.js';

export interface RawAdminCSVRow {
  admin_id: string;
  full_name: string;
  phone_number: string;
  email: string;
  date_of_birth: string;
}

export interface AdminImportSummary {
  totalRows: number;
  imported: number;
  created: number;
  updated: number;
  skipped: number;
  conflicts: Array<{ admin_id: string; reason: string }>;
  failed: Array<{ rowNumber: number; reason: string; data?: any }>;
}

/**
 * Parses raw Admin CSV content into typed rows
 */
export function parseAdminCSV(csvContent: string): { rows: RawAdminCSVRow[]; error?: string } {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return { rows: [], error: 'Admin CSV file is empty or missing data rows' };
  }

  const headerLine = lines[0];
  const headers = headerLine.split(',').map((h) => h.trim().toLowerCase());
  const expectedHeaders = ['admin_id', 'full_name', 'phone_number', 'email', 'date_of_birth'];

  for (const expected of expectedHeaders) {
    if (!headers.includes(expected)) {
      return { rows: [], error: `Missing required Admin CSV column: '${expected}'` };
    }
  }

  const rows: RawAdminCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const values = rawLine.split(',').map((v) => v.trim());
    if (values.length < headers.length) {
      continue;
    }

    const rowObj: any = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });

    if (rowObj.admin_id && rowObj.full_name) {
      rows.push(rowObj as RawAdminCSVRow);
    }
  }

  return { rows };
}

/**
 * Provision administrators from authoritative Admin_data.csv into database profiles.
 * Re-import safe: Updates existing admin records without wiping or regenerating credentials.
 */
export function provisionAdminsFromCSV(
  csvContent: string,
  existingProfiles: any[]
): {
  updatedAdmins: any[];
  allProfiles: any[];
  summary: AdminImportSummary;
} {
  const { rows, error } = parseAdminCSV(csvContent);
  const summary: AdminImportSummary = {
    totalRows: rows.length,
    imported: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    conflicts: [],
    failed: [],
  };

  if (error || rows.length === 0) {
    summary.failed.push({ rowNumber: 0, reason: error || 'No rows found in Admin CSV' });
    return {
      updatedAdmins: [],
      allProfiles: existingProfiles,
      summary,
    };
  }

  // Separate non-admin profiles (students) and existing admins
  const studentProfiles = existingProfiles.filter((p) => p.role !== 'admin');
  const existingAdmins = existingProfiles.filter((p) => p.role === 'admin');

  const adminMapById = new Map<string, any>();
  const adminMapByPhone = new Map<string, any>();

  for (const a of existingAdmins) {
    if (a.account_id) adminMapById.set(a.account_id.toUpperCase(), a);
    if (a.phone) adminMapByPhone.set(normalizePhoneNumber(a.phone), a);
    if (a.phone_number) adminMapByPhone.set(normalizePhoneNumber(a.phone_number), a);
  }

  const finalAdmins: any[] = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const rowNumber = idx + 2;

    const adminId = String(row.admin_id).trim().toUpperCase();
    const fullName = String(row.full_name).trim();
    const rawPhone = String(row.phone_number).trim();
    const rawDob = String(row.date_of_birth).trim();
    const email = row.email && row.email.trim().length > 0 ? row.email.trim() : null;

    if (!adminId) {
      summary.failed.push({ rowNumber, reason: 'Missing admin_id', data: row });
      continue;
    }

    const cleanDigits = rawPhone.replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 7) {
      summary.failed.push({ rowNumber, reason: `Invalid phone number: '${rawPhone}'`, data: row });
      continue;
    }

    const normalizedPhone = normalizePhoneNumber(rawPhone);
    const rawPhoneDigits = cleanDigits.length === 10 ? cleanDigits : normalizedPhone.replace(/\D/g, '');

    const { isoDate, initialPasswordDDMMYYYY, error: dobError } = parseDateOfBirth(rawDob);
    if (dobError) {
      summary.failed.push({ rowNumber, reason: dobError, data: row });
      continue;
    }

    const existingById = adminMapById.get(adminId);
    const existingByPhone = adminMapByPhone.get(normalizedPhone);

    if (existingById && existingByPhone && existingById.id !== existingByPhone.id) {
      summary.conflicts.push({
        admin_id: adminId,
        reason: `Admin ID matches ${existingById.name} but Phone ${normalizedPhone} belongs to ${existingByPhone.name}`,
      });
      continue;
    }

    const existing = existingById || existingByPhone;

    if (existing) {
      // Re-import update: Preserve existing auth_user_id and password hash
      const passwordChanged = Boolean(existing.password_changed);
      const passwordHash = existing.password_hash || hashPassword(initialPasswordDDMMYYYY);

      const updatedAdmin = {
        ...existing,
        account_id: adminId,
        name: fullName,
        full_name: fullName,
        phone: normalizedPhone,
        phone_number: rawPhoneDigits, // Canonical 10 digits for clean profile display
        date_of_birth: isoDate,
        email: email || existing.email,
        role: 'admin',
        admin_role: existing.admin_role || 'super_admin',
        department: existing.department || 'Administration & Governance',
        university: existing.university || 'Supreme Knowledge Foundation Group of Institutions',
        password_hash: passwordHash,
        password_changed: passwordChanged,
        must_change_password: false,
        is_active: existing.is_active !== undefined ? existing.is_active : true,
        updated_at: new Date().toISOString(),
      };

      finalAdmins.push(updatedAdmin);
      summary.imported++;
      summary.updated++;
    } else {
      // Brand new administrator provisioning
      const authUserId = `auth-admin-${adminId.toLowerCase()}-${crypto.randomBytes(4).toString('hex')}`;

      const newAdmin = {
        id: `prof-${adminId.toLowerCase()}`,
        auth_user_id: authUserId,
        account_id: adminId,
        name: fullName,
        full_name: fullName,
        phone: normalizedPhone,
        phone_number: rawPhoneDigits,
        date_of_birth: isoDate,
        email,
        role: 'admin',
        admin_role: 'super_admin',
        department: 'Administration & Governance',
        university: 'Supreme Knowledge Foundation Group of Institutions',
        password_hash: hashPassword(initialPasswordDDMMYYYY),
        password_changed: false,
        must_change_password: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      finalAdmins.push(newAdmin);
      summary.imported++;
      summary.created++;
    }
  }

  const allProfiles = [...studentProfiles, ...finalAdmins];

  return {
    updatedAdmins: finalAdmins,
    allProfiles,
    summary,
  };
}
