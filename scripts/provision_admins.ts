import fs from 'fs';
import path from 'path';
import { provisionAdminsFromCSV } from '../src/lib/adminProvisioning.js';

const ROOT_DIR = process.cwd();
const CSV_FILE = path.join(ROOT_DIR, 'Admin_data.csv');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_FILE = path.join(DATA_DIR, 'campus_db.json');

export async function runAdminProvisioning() {
  console.log('--- SUPABASE & ADMINISTRATOR DATA PROVISIONING ---');
  console.log(`Reading Admin CSV Source of Truth: ${CSV_FILE}`);

  if (!fs.existsSync(CSV_FILE)) {
    console.error(`ERROR: Admin CSV file not found at ${CSV_FILE}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');

  // Load existing campus database
  let db: any = { profiles: [], departments: [], complaints: [], complaint_updates: [], notifications: [] };
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (err) {
      console.error('Error parsing campus_db.json, initializing clean DB');
    }
  }

  const existingProfiles = db.profiles || [];
  const { updatedAdmins, allProfiles, summary } = provisionAdminsFromCSV(csvContent, existingProfiles);

  console.log('\n================ ADMIN IMPORT SUMMARY ================');
  console.log(`Total CSV Rows:       ${summary.totalRows}`);
  console.log(`Successfully Import:  ${summary.imported}`);
  console.log(`New Admins Created:   ${summary.created}`);
  console.log(`Admins Updated:       ${summary.updated}`);
  console.log(`Skipped:              ${summary.skipped}`);
  console.log(`Conflicts:            ${summary.conflicts.length}`);
  console.log(`Failed Rows:          ${summary.failed.length}`);
  console.log('======================================================\n');

  if (summary.conflicts.length > 0) {
    console.warn('Conflicts encountered:', summary.conflicts);
  }
  if (summary.failed.length > 0) {
    console.error('Failed rows:', summary.failed);
  }

  console.log('Provisioned Administrator Records:');
  updatedAdmins.forEach((a, idx) => {
    console.log(
      `[${idx + 1}] ${a.name} | ID: ${a.account_id} | Phone: ${a.phone} | Email: ${a.email} | DOB: ${a.date_of_birth} | Role: ${a.admin_role}`
    );
  });

  db.profiles = allProfiles;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  console.log(`\nSuccessfully updated ${DB_FILE} with ${allProfiles.length} total profiles.`);

  return { summary, updatedAdmins };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAdminProvisioning().catch((err) => {
    console.error('Admin provisioning failed:', err);
    process.exit(1);
  });
}
