import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SALT = 'campus_resolve_salt_2026';

export function hashPassword(password: string): string {
  if (!password) return '';
  return crypto.createHash('sha256').update(`${SALT}:${password}`).digest('hex');
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  const hashed = hashPassword(password);
  if (hashed === storedHash) return true;
  // Fallback for direct match if previously unhashed
  if (password === storedHash) return true;
  return false;
}

export interface RawStudentCSVRow {
  full_name: string;
  roll_number: string;
  student_id: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
  department: string;
  university: string;
  email?: string;
}

export interface ProvisionedStudent {
  id: string;
  auth_user_id: string;
  account_id: string;
  student_id: string;
  anonymous_reporter_id: string;
  name: string;
  full_name: string;
  roll_number: string;
  phone: string;
  phone_number: string;
  date_of_birth: string;
  gender: 'male' | 'female';
  department: string;
  university: string;
  email: string | null;
  role: 'student';
  password_hash: string;
  must_change_password: boolean;
  password_changed?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_complaints: number;
  verified_false_complaints: number;
  warnings_count: number;
  is_restricted: boolean;
}

export interface ImportSummary {
  totalRows: number;
  imported: number;
  created: number;
  updated: number;
  skipped: number;
  conflicts: Array<{ student_id: string; reason: string }>;
  failed: Array<{ rowNumber: number; reason: string; data?: any }>;
}

/**
 * Normalizes Indian and international phone numbers to canonical E.164 (+91XXXXXXXXXX)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+91${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  if (String(phone).trim().startsWith('+')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

/**
 * Parses dates formatted as M/D/YYYY, MM/DD/YYYY, or YYYY-MM-DD
 * into an ISO calendar date (YYYY-MM-DD) and the DDMMYYYY initial password format.
 */
export function parseDateOfBirth(dobStr: string): {
  isoDate: string;
  initialPasswordDDMMYYYY: string;
  error?: string;
} {
  if (!dobStr) {
    return { isoDate: '', initialPasswordDDMMYYYY: '', error: 'Missing date of birth' };
  }
  const clean = String(dobStr).trim();

  // Pattern M/D/YYYY or MM/DD/YYYY
  const slashParts = clean.split('/');
  if (slashParts.length === 3) {
    const month = parseInt(slashParts[0], 10);
    const day = parseInt(slashParts[1], 10);
    const year = parseInt(slashParts[2], 10);

    if (isNaN(month) || isNaN(day) || isNaN(year) || month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) {
      return { isoDate: '', initialPasswordDDMMYYYY: '', error: `Invalid date values in ${clean}` };
    }

    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const yyyy = String(year);

    return {
      isoDate: `${yyyy}-${mm}-${dd}`,
      initialPasswordDDMMYYYY: `${dd}${mm}${yyyy}`,
    };
  }

  // Pattern YYYY-MM-DD
  const dashParts = clean.split('-');
  if (dashParts.length === 3) {
    const year = parseInt(dashParts[0], 10);
    const month = parseInt(dashParts[1], 10);
    const day = parseInt(dashParts[2], 10);

    if (isNaN(month) || isNaN(day) || isNaN(year) || month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) {
      return { isoDate: '', initialPasswordDDMMYYYY: '', error: `Invalid date values in ${clean}` };
    }

    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const yyyy = String(year);

    return {
      isoDate: `${yyyy}-${mm}-${dd}`,
      initialPasswordDDMMYYYY: `${dd}${mm}${yyyy}`,
    };
  }

  return { isoDate: '', initialPasswordDDMMYYYY: '', error: `Unrecognized date format: ${clean}` };
}

/**
 * Generates a unique 8-character uppercase alphanumeric Anonymous Reporter ID
 * Format: AN-XXXXXXXX (e.g. AN-7K4P9X2M)
 */
export function generateAnonymousReporterId(existingIds: Set<string>): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let id = '';
  do {
    let rand = '';
    const bytes = crypto.randomBytes(8);
    for (let i = 0; i < 8; i++) {
      rand += chars[bytes[i] % chars.length];
    }
    id = `AN-${rand}`;
  } while (existingIds.has(id));
  return id;
}

/**
 * Parses raw CSV content into typed rows
 */
export function parseStudentsCSV(csvContent: string): { rows: RawStudentCSVRow[]; error?: string } {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return { rows: [], error: 'CSV file is empty or missing data rows' };
  }

  const headerLine = lines[0];
  const headers = headerLine.split(',').map((h) => h.trim().toLowerCase());
  const expectedHeaders = ['full_name', 'roll_number', 'student_id', 'phone_number', 'date_of_birth', 'gender', 'department', 'university'];

  for (const expected of expectedHeaders) {
    if (!headers.includes(expected)) {
      return { rows: [], error: `Missing required CSV column: '${expected}'` };
    }
  }

  const rows: RawStudentCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Split by comma taking basic quoting into account
    const values = rawLine.split(',').map((v) => v.trim());
    if (values.length < headers.length) {
      continue;
    }

    const rowObj: any = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });

    if (rowObj.full_name && rowObj.student_id && rowObj.phone_number) {
      rows.push(rowObj as RawStudentCSVRow);
    }
  }

  return { rows };
}

/**
 * Provision students from the authoritative CSV file into the database.
 * Re-import safe: Updates existing records without creating duplicates or regenerating IDs.
 */
export function provisionStudentsFromCSV(
  csvContent: string,
  existingProfiles: any[]
): {
  updatedProfiles: ProvisionedStudent[];
  allProfiles: any[];
  summary: ImportSummary;
} {
  const { rows, error } = parseStudentsCSV(csvContent);
  const summary: ImportSummary = {
    totalRows: rows.length,
    imported: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    conflicts: [],
    failed: [],
  };

  if (error || rows.length === 0) {
    summary.failed.push({ rowNumber: 0, reason: error || 'No rows found in CSV' });
    return {
      updatedProfiles: [],
      allProfiles: existingProfiles,
      summary,
    };
  }

  const existingAnonIds = new Set<string>();
  existingProfiles.forEach((p) => {
    if (p.anonymous_reporter_id) existingAnonIds.add(p.anonymous_reporter_id);
  });

  const studentMapByStudentId = new Map<string, any>();
  const studentMapByPhone = new Map<string, any>();

  // Filter out any obsolete demo students (Alex Rivera / Maya Lin)
  const nonStudentProfiles = existingProfiles.filter((p) => p.role !== 'student');
  const existingStudents = existingProfiles.filter((p) => p.role === 'student');

  for (const s of existingStudents) {
    if (s.student_id) studentMapByStudentId.set(s.student_id.toUpperCase(), s);
    if (s.account_id) studentMapByStudentId.set(s.account_id.toUpperCase(), s);
    if (s.phone) studentMapByPhone.set(normalizePhoneNumber(s.phone), s);
  }

  const finalStudents: ProvisionedStudent[] = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const rowNumber = idx + 2;

    const studentId = String(row.student_id).trim().toUpperCase();
    const fullName = String(row.full_name).trim();
    const rollNumber = String(row.roll_number).trim();
    const rawPhone = String(row.phone_number).trim();
    const normalizedPhone = normalizePhoneNumber(rawPhone);
    const rawDob = String(row.date_of_birth).trim();
    const genderRaw = String(row.gender).trim().toLowerCase();
    const gender: 'male' | 'female' = genderRaw === 'female' || genderRaw === 'f' ? 'female' : 'male';
    const department = String(row.department).trim();
    const university = String(row.university).trim();
    const email = row.email && row.email.trim().length > 0 ? row.email.trim() : null;

    if (!studentId) {
      summary.failed.push({ rowNumber, reason: 'Missing student_id', data: row });
      continue;
    }

    if (!normalizedPhone || normalizedPhone.length < 10) {
      summary.failed.push({ rowNumber, reason: `Invalid phone number: '${rawPhone}'`, data: row });
      continue;
    }

    const { isoDate, initialPasswordDDMMYYYY, error: dobError } = parseDateOfBirth(rawDob);
    if (dobError) {
      summary.failed.push({ rowNumber, reason: dobError, data: row });
      continue;
    }

    // Check if student already exists by Student ID or normalized Phone
    const existingById = studentMapByStudentId.get(studentId);
    const existingByPhone = studentMapByPhone.get(normalizedPhone);

    // Conflict detection: ID matches one student, but phone matches a different student
    if (existingById && existingByPhone && existingById.id !== existingByPhone.id) {
      summary.conflicts.push({
        student_id: studentId,
        reason: `Student ID matches ${existingById.name} but Phone ${normalizedPhone} belongs to ${existingByPhone.name}`,
      });
      continue;
    }

    const existing = existingById || existingByPhone;

    if (existing) {
      // Re-import update: Keep permanent IDs, NEVER overwrite changed password
      const passwordChanged = Boolean(existing.password_changed);
      const passwordHash = existing.password_hash || hashPassword(initialPasswordDDMMYYYY);
      const anonymousReporterId = existing.anonymous_reporter_id || generateAnonymousReporterId(existingAnonIds);
      existingAnonIds.add(anonymousReporterId);

      const updatedStudent: ProvisionedStudent = {
        ...existing,
        student_id: studentId,
        account_id: studentId,
        auth_user_id: existing.auth_user_id || `auth-${studentId.toLowerCase()}`,
        anonymous_reporter_id: anonymousReporterId,
        name: fullName,
        full_name: fullName,
        roll_number: rollNumber,
        phone: normalizedPhone,
        phone_number: normalizedPhone,
        date_of_birth: isoDate,
        gender,
        department,
        university,
        email,
        role: 'student',
        password_hash: passwordHash,
        password_changed: passwordChanged,
        must_change_password: false,
        is_active: existing.is_active !== undefined ? existing.is_active : true,
        updated_at: new Date().toISOString(),
        total_complaints: existing.total_complaints || 0,
        verified_false_complaints: existing.verified_false_complaints || 0,
        warnings_count: existing.warnings_count || 0,
        is_restricted: Boolean(existing.is_restricted),
      };

      finalStudents.push(updatedStudent);
      summary.imported++;
      summary.updated++;
    } else {
      // Brand new student provisioning
      const anonymousReporterId = generateAnonymousReporterId(existingAnonIds);
      existingAnonIds.add(anonymousReporterId);
      const authUserId = `auth-${studentId.toLowerCase()}-${crypto.randomBytes(4).toString('hex')}`;

      const newStudent: ProvisionedStudent = {
        id: `prof-${studentId.toLowerCase()}`,
        auth_user_id: authUserId,
        account_id: studentId,
        student_id: studentId,
        anonymous_reporter_id: anonymousReporterId,
        name: fullName,
        full_name: fullName,
        roll_number: rollNumber,
        phone: normalizedPhone,
        phone_number: normalizedPhone,
        date_of_birth: isoDate,
        gender,
        department,
        university,
        email,
        role: 'student',
        password_hash: hashPassword(initialPasswordDDMMYYYY), // Initial hashed password derived from DOB DDMMYYYY
        password_changed: false,
        must_change_password: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_complaints: 0,
        verified_false_complaints: 0,
        warnings_count: 0,
        is_restricted: false,
      };

      finalStudents.push(newStudent);
      summary.imported++;
      summary.created++;
    }
  }

  // Combine admin staff profiles and the provisioned student profiles
  const allProfiles = [...nonStudentProfiles, ...finalStudents];

  return {
    updatedProfiles: finalStudents,
    allProfiles,
    summary,
  };
}
