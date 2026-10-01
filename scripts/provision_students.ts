import fs from 'fs';
import path from 'path';
import {
  provisionStudentsFromCSV,
  normalizePhoneNumber,
} from '../src/lib/studentProvisioning.js';

const ROOT_DIR = process.cwd();
const CSV_FILE = path.join(ROOT_DIR, 'DATABASE_STUDENTS (1).csv');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_FILE = path.join(DATA_DIR, 'campus_db.json');

export async function runProvisioning() {
  console.log('--- SUPABASE & STUDENT DATA PROVISIONING ---');
  console.log(`Reading CSV Source of Truth: ${CSV_FILE}`);

  if (!fs.existsSync(CSV_FILE)) {
    console.error(`ERROR: CSV file not found at ${CSV_FILE}`);
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
  const { updatedProfiles, allProfiles, summary } = provisionStudentsFromCSV(csvContent, existingProfiles);

  console.log('\n================ IMPORT SUMMARY ================');
  console.log(`Total CSV Rows:      ${summary.totalRows}`);
  console.log(`Successfully Import: ${summary.imported}`);
  console.log(`New Accounts Created:${summary.created}`);
  console.log(`Accounts Updated:    ${summary.updated}`);
  console.log(`Skipped:             ${summary.skipped}`);
  console.log(`Conflicts:           ${summary.conflicts.length}`);
  console.log(`Failed Rows:         ${summary.failed.length}`);
  console.log('================================================\n');

  if (summary.conflicts.length > 0) {
    console.warn('Conflicts encountered:', summary.conflicts);
  }
  if (summary.failed.length > 0) {
    console.error('Failed rows:', summary.failed);
  }

  console.log('Provisioned Student Records:');
  updatedProfiles.forEach((s, idx) => {
    console.log(
      `[${idx + 1}] ${s.name} | Roll: ${s.roll_number} | ID: ${s.student_id} | AnonID: ${s.anonymous_reporter_id} | Phone: ${s.phone} | InitialPass: ${s.password_hash} | MustChangePass: ${s.must_change_password}`
    );
  });

  // Re-associate any complaints previously associated with demo accounts if applicable, or keep complaints clean
  db.profiles = allProfiles;

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  console.log(`\nSuccessfully updated ${DB_FILE} with ${allProfiles.length} total profiles.`);

  return { summary, updatedProfiles };
}

// If run directly via node / tsx
if (import.meta.url === `file://${process.argv[1]}`) {
  runProvisioning().catch((err) => {
    console.error('Provisioning failed:', err);
    process.exit(1);
  });
}
