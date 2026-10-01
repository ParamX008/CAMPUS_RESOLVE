import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  provisionStudentsFromCSV,
  hashPassword,
  verifyPassword,
  parseDateOfBirth,
} from './src/lib/studentProvisioning.js';
import { provisionAdminsFromCSV } from './src/lib/adminProvisioning.js';

const PORT = Number(process.env.PORT) || 3000;
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'campus_db.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure data and uploads directories exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

interface DBProfile {
  id: string;
  auth_user_id: string;
  account_id: string;
  roll_number?: string;
  student_id?: string;
  anonymous_reporter_id?: string;
  university?: string;
  password_hash: string;
  name: string;
  gender?: 'male' | 'female' | 'other';
  role: 'student' | 'admin';
  admin_role?: 'super_admin' | 'department_staff';
  phone: string;
  phone_number?: string;
  date_of_birth: string;
  email?: string | null;
  department: string;
  created_at: string;
  updated_at?: string;
  must_change_password?: boolean;
  password_changed?: boolean;
  is_active?: boolean;
  // Abuse History Tracking
  total_complaints?: number;
  verified_false_complaints?: number;
  warnings_count?: number;
  is_restricted?: boolean;
  restriction_start_date?: string | null;
  restriction_end_date?: string | null;
  restriction_reason?: string | null;
}

interface DBDepartment {
  id: string;
  name: string;
  description: string;
}

interface DBComplaintAttachment {
  id: string;
  complaint_id: string;
  storage_path: string;
  original_file_name: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
  url: string;
}

interface DBComplaintUpdate {
  id: string;
  complaint_id: string;
  status: 'Pending' | 'In Progress' | 'Under Investigation' | 'Resolved' | 'Closed';
  previous_status?: 'Pending' | 'In Progress' | 'Under Investigation' | 'Resolved' | 'Closed' | null;
  note: string;
  updated_by: string;
  is_internal?: boolean;
  action?: string;
  created_at: string;
}

export type AIProcessingStatus = 'Pending' | 'Processed' | 'Failed' | 'Requires Review';
export type AbuseReviewStatus = 'None' | 'Review Required' | 'Verified Legitimate' | 'Verified False';

interface DBComplaint {
  id: string;
  complaint_id: string; // e.g. CMP-1001
  student_id: string;
  student_name: string;
  anonymous_reporter_id?: string | null;
  category: string;
  title: string;
  description: string;
  image_url: string | null;
  identity_mode: 'identified' | 'anonymous';
  status: 'Pending' | 'In Progress' | 'Under Investigation' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  department_id: string | null;
  // Assignment fields
  assigned_to?: string | null;
  assigned_by?: string | null;
  assigned_at?: string | null;
  // Investigation fields
  investigation_notes?: string | null;
  investigator_name?: string | null;
  investigated_at?: string | null;
  // Resolution fields
  resolution_notes?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
  // Archive state (student active dashboard exclusion)
  student_archived?: boolean;
  archived_at?: string | null;
  // Gemini AI Fields
  ai_status?: AIProcessingStatus;
  ai_title?: string | null;
  ai_summary?: string | null;
  ai_category_detected?: string | null;
  ai_priority_detected?: 'Low' | 'Medium' | 'High' | 'Urgent' | null;
  ai_recommended_department?: string | null;
  ai_confidence?: number | null;
  ai_safety_flag?: boolean | null;
  ai_safety_type?: string | null;
  ai_reasoning?: string | null;
  ai_processed_at?: string | null;
  ai_overridden?: boolean | null;
  // Abuse Prevention Fields
  abuse_flag?: boolean | null;
  abuse_reason?: string | null;
  abuse_review_status?: AbuseReviewStatus;
  // Resolution Feedback
  feedback_rating?: number | null;
  feedback_comment?: string | null;
  feedback_submitted_at?: string | null;
  // Super Admin Audited Unmasking
  is_unmasked?: boolean;
  unmasked_by?: string | null;
  unmasked_at?: string | null;
  unmask_reason?: string | null;
}

interface DBNotification {
  id: string;
  user_id: string; // student account_id e.g. SKF7A2Q9
  complaint_id: string;
  complaint_num: string;
  title: string;
  message: string;
  type: 'status_change' | 'assigned' | 'resolved' | 'staff_update' | 'received' | 'safety';
  read: boolean;
  is_dismissed?: boolean;
  dismissed_at?: string | null;
  created_at: string;
}

interface DatabaseSchema {
  profiles: DBProfile[];
  departments: DBDepartment[];
  complaints: DBComplaint[];
  complaint_attachments: DBComplaintAttachment[];
  complaint_updates: DBComplaintUpdate[];
  notifications: DBNotification[];
  last_complaint_num: number;
}

const INITIAL_DEPARTMENTS: DBDepartment[] = [
  {
    id: 'dept-1',
    name: 'Student Welfare / Anti-Ragging Committee',
    description: 'Handles student safety, anti-ragging prevention, harassment complaints, and general student welfare.',
  },
  {
    id: 'dept-2',
    name: 'Administration',
    description: 'Manages official institutional policies, registrar affairs, identity cards, and central administrative services.',
  },
  {
    id: 'dept-3',
    name: 'Maintenance',
    description: 'Responsible for campus infrastructure, electrical repairs, plumbing, fixtures, and classroom physical maintenance.',
  },
  {
    id: 'dept-4',
    name: 'Hostel Administration',
    description: 'Oversees residential rooms, hostel cleanliness, water supply, room amenities, and hostel wardens.',
  },
  {
    id: 'dept-5',
    name: 'Canteen Management',
    description: 'Monitors food hygiene, cafeteria menu quality, dining hall pricing, and catering staff services.',
  },
  {
    id: 'dept-6',
    name: 'Transport',
    description: 'Manages campus bus routes, driver schedules, student transit passes, and parking facilities.',
  },
  {
    id: 'dept-7',
    name: 'Academic Administration',
    description: 'Addresses examination schedules, grade sheets, lecture hall equipment, and departmental course queries.',
  },
  {
    id: 'dept-8',
    name: 'Security',
    description: 'Maintains 24/7 campus gate security, surveillance systems, night patrolling, and incident containment.',
  },
];

const INITIAL_PROFILES: DBProfile[] = [
  {
    id: 'prof-skf7a2q9',
    auth_user_id: 'auth-user-skf7a2q9',
    account_id: 'SKF7A2Q9',
    student_id: 'SKF7A2Q9',
    anonymous_reporter_id: 'AN-CQ2XADRH',
    roll_number: '25300123055',
    university: 'Supreme knowledge Foundation',
    password_hash: hashPassword('15062004'),
    name: 'Parambrata Kanjilal',
    gender: 'male',
    role: 'student',
    phone: '+918697633925',
    phone_number: '+918697633925',
    date_of_birth: '2004-06-15',
    email: null,
    department: 'CSE',
    created_at: new Date('2026-08-01T09:00:00Z').toISOString(),
    total_complaints: 0,
    verified_false_complaints: 0,
    warnings_count: 0,
    is_restricted: false,
    must_change_password: false,
    password_changed: false,
    is_active: true,
  },
  {
    id: 'prof-skf7a2q6',
    auth_user_id: 'auth-user-skf7a2q6',
    account_id: 'SKF7A2Q6',
    student_id: 'SKF7A2Q6',
    anonymous_reporter_id: 'AN-62KHZTPM',
    roll_number: '25300123060',
    university: 'Supreme knowledge Foundation',
    password_hash: hashPassword('21102005'),
    name: 'Pritam Das',
    gender: 'male',
    role: 'student',
    phone: '+918240878930',
    phone_number: '+918240878930',
    date_of_birth: '2005-10-21',
    email: null,
    department: 'CSE',
    created_at: new Date('2026-08-01T09:00:00Z').toISOString(),
    total_complaints: 0,
    verified_false_complaints: 0,
    warnings_count: 0,
    is_restricted: false,
    must_change_password: false,
    password_changed: false,
    is_active: true,
  },
  {
    id: 'prof-skf7a2q7',
    auth_user_id: 'auth-user-skf7a2q7',
    account_id: 'SKF7A2Q7',
    student_id: 'SKF7A2Q7',
    anonymous_reporter_id: 'AN-6Z79TV9L',
    roll_number: '25300123059',
    university: 'Supreme knowledge Foundation',
    password_hash: hashPassword('20122004'),
    name: 'Prerona Sinha Roy',
    gender: 'female',
    role: 'student',
    phone: '+919735033212',
    phone_number: '+919735033212',
    date_of_birth: '2004-12-20',
    email: null,
    department: 'CSE',
    created_at: new Date('2026-08-01T09:00:00Z').toISOString(),
    total_complaints: 0,
    verified_false_complaints: 0,
    warnings_count: 0,
    is_restricted: false,
    must_change_password: false,
    password_changed: false,
    is_active: true,
  },
  {
    id: 'prof-skf7a2q8',
    auth_user_id: 'auth-user-skf7a2q8',
    account_id: 'SKF7A2Q8',
    student_id: 'SKF7A2Q8',
    anonymous_reporter_id: 'AN-YN9R5DCW',
    roll_number: '25300123108',
    university: 'Supreme knowledge Foundation',
    password_hash: hashPassword('01012003'),
    name: 'Tamali Singha Roy',
    gender: 'female',
    role: 'student',
    phone: '+919432882031',
    phone_number: '+919432882031',
    date_of_birth: '2003-01-01',
    email: null,
    department: 'CSE',
    created_at: new Date('2026-08-01T09:00:00Z').toISOString(),
    total_complaints: 0,
    verified_false_complaints: 0,
    warnings_count: 0,
    is_restricted: false,
    must_change_password: false,
    password_changed: false,
    is_active: true,
  },
  {
    id: 'prof-skf7a2q5',
    auth_user_id: 'auth-user-skf7a2q5',
    account_id: 'SKF7A2Q5',
    student_id: 'SKF7A2Q5',
    anonymous_reporter_id: 'AN-SP5K7W8Q',
    roll_number: '25300123077',
    university: 'Supreme knowledge Foundation',
    password_hash: hashPassword('04082003'),
    name: 'Sayan Pyne',
    gender: 'male',
    role: 'student',
    phone: '+919433322260',
    phone_number: '+919433322260',
    date_of_birth: '2003-08-04',
    email: null,
    department: 'CSE',
    created_at: new Date('2026-08-01T09:00:00Z').toISOString(),
    total_complaints: 0,
    verified_false_complaints: 0,
    warnings_count: 0,
    is_restricted: false,
    must_change_password: false,
    password_changed: false,
    is_active: true,
  },
];

// Pure empty initial collections: No mock / demo complaints or notifications exist.
const INITIAL_COMPLAINTS: DBComplaint[] = [];
const INITIAL_UPDATES: DBComplaintUpdate[] = [];
const INITIAL_NOTIFICATIONS: DBNotification[] = [];

function loadDatabase(): DatabaseSchema {
  let db: DatabaseSchema | null = null;
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content);
    } catch (e) {
      console.error('Error reading DB file, reinitializing default:', e);
    }
  }

  if (!db) {
    db = {
      profiles: INITIAL_PROFILES,
      departments: INITIAL_DEPARTMENTS,
      complaints: [],
      complaint_attachments: [],
      complaint_updates: [],
      notifications: [],
      last_complaint_num: 1000,
    };
  } else {
    // Migration: ensure notifications array exists
    if (!db.notifications) {
      db.notifications = [];
    }
    if (!db.complaints) {
      db.complaints = [];
    }
    if (!db.complaint_attachments) {
      db.complaint_attachments = [];
    }
    if (!db.complaint_updates) {
      db.complaint_updates = [];
    }

    // Clean out only original mock demo complaints (exact legacy IDs)
    const LEGACY_MOCK_IDS = new Set(['CMP-1000', 'CMP-1001', 'CMP-1002', 'CMP-1003']);
    const LEGACY_MOCK_UUIDS = new Set(['cmp-uuid-1000', 'cmp-uuid-1001', 'cmp-uuid-1002', 'cmp-uuid-1003']);
    db.complaints = db.complaints.filter(
      (c) => !LEGACY_MOCK_IDS.has(c.complaint_id) && !LEGACY_MOCK_UUIDS.has(c.id)
    );
    db.complaint_updates = db.complaint_updates.filter(
      (u) => !LEGACY_MOCK_UUIDS.has(u.complaint_id)
    );
    
    // Prune any legacy notifications for mock demo complaints or non-existent complaints
    const validComplaintKeys = new Set(
      db.complaints.flatMap((c) => [c.id.toLowerCase(), c.complaint_id.toLowerCase()])
    );
    db.notifications = db.notifications.filter((n) => {
      if (['notif-101', 'notif-102', 'notif-103'].includes(n.id)) return false;
      if (n.complaint_num && LEGACY_MOCK_IDS.has(n.complaint_num)) return false;
      if (n.complaint_id && !validComplaintKeys.has(n.complaint_id.toLowerCase())) {
        if (n.complaint_num && validComplaintKeys.has(n.complaint_num.toLowerCase())) {
          return true;
        }
        return false;
      }
      return true;
    });

    // Remove obsolete demo accounts if present
    db.profiles = db.profiles.filter(
      (p) => !['ADM1001', 'ADM1002', 'ADM1003', 'STU1001', 'STU1002'].includes(p.account_id)
    );

    // Migration: ensure all staff accounts exist
    for (const initProf of INITIAL_PROFILES) {
      const existing = db.profiles.find((p) => p.account_id === initProf.account_id);
      if (!existing) {
        db.profiles.push(initProf);
      } else {
        if (initProf.admin_role && !existing.admin_role) existing.admin_role = initProf.admin_role;
        if (initProf.student_id && !existing.student_id) existing.student_id = initProf.student_id;
        if (initProf.anonymous_reporter_id && !existing.anonymous_reporter_id) existing.anonymous_reporter_id = initProf.anonymous_reporter_id;
        if (initProf.roll_number && !existing.roll_number) existing.roll_number = initProf.roll_number;
      }
    }
  }

  // Authoritative CSV sync: synchronize student profiles directly from DATABASE_STUDENTS (1).csv
  const csvPath = path.join(process.cwd(), 'DATABASE_STUDENTS (1).csv');
  if (fs.existsSync(csvPath)) {
    try {
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const { allProfiles } = provisionStudentsFromCSV(csvContent, db.profiles);
      db.profiles = allProfiles;
    } catch (err) {
      console.error('Error auto-syncing students from CSV:', err);
    }
  }

  // Authoritative CSV sync: synchronize administrator profiles directly from Admin_data.csv
  const adminCsvPath = path.join(process.cwd(), 'Admin_data.csv');
  const altAdminCsvPath = path.join(process.cwd(), 'data', 'Admin_data.csv');
  const targetAdminCsv = fs.existsSync(adminCsvPath)
    ? adminCsvPath
    : fs.existsSync(altAdminCsvPath)
    ? altAdminCsvPath
    : null;
  if (targetAdminCsv) {
    try {
      const adminCsvContent = fs.readFileSync(targetAdminCsv, 'utf-8');
      const { allProfiles } = provisionAdminsFromCSV(adminCsvContent, db.profiles);
      db.profiles = allProfiles;
    } catch (err) {
      console.error('Error auto-syncing admins from CSV:', err);
    }
  }

  // Calculate live complaint counts, ensure no forced password change, and preserve password_changed
  db.profiles.forEach((p) => {
    if (p.role === 'student') {
      p.must_change_password = false;
      if (p.password_changed === undefined) {
        p.password_changed = false;
      }
      const activeCount = db.complaints.filter(
        (c) => c.student_id.toUpperCase() === p.account_id.toUpperCase() && !c.student_archived
      ).length;
      p.total_complaints = activeCount;
    }
  });

  saveDatabase(db);
  return db;
}

function saveDatabase(db: DatabaseSchema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

// Global SSE clients list for real-time live sync
const sseClients: Array<{ id: number; res: express.Response }> = [];

function broadcastChange(type: string, data: any) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: new Date().toISOString() })}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch {
      // client disconnected
    }
  });
}

function createNotification(
  db: DatabaseSchema,
  notif: Omit<DBNotification, 'id' | 'created_at' | 'read'>
) {
  const newNotif: DBNotification = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...notif,
    read: false,
    created_at: new Date().toISOString(),
  };
  if (!db.notifications) {
    db.notifications = [];
  }
  db.notifications.unshift(newNotif);
  broadcastChange('NOTIFICATION_CREATED', newNotif);
  return newNotif;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. AI processing will fallback gracefully.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface AIAnalysisResult {
  ai_title: string;
  ai_summary: string;
  ai_category_detected: string;
  ai_priority_detected: 'Low' | 'Medium' | 'High' | 'Urgent';
  ai_recommended_department: string;
  ai_confidence: number;
  ai_safety_flag: boolean;
  ai_safety_type: string;
  ai_reasoning: string;
}

function runFallbackAnalysis(
  data: { description: string; category: string; title?: string; identity_mode?: string },
  errorMsg?: string
): { status: AIProcessingStatus; result: AIAnalysisResult } {
  const descLower = data.description.toLowerCase();
  const catLower = data.category.toLowerCase();

  const isRagging =
    descLower.includes('harass') ||
    descLower.includes('threat') ||
    descLower.includes('senior') ||
    descLower.includes('bully') ||
    descLower.includes('ragging') ||
    descLower.includes('abuse') ||
    descLower.includes('intimidat') ||
    catLower.includes('ragging');

  const isElectrical =
    descLower.includes('exposed wire') ||
    descLower.includes('electrical wire') ||
    descLower.includes('electric wire') ||
    descLower.includes('spark') ||
    descLower.includes('shock') ||
    descLower.includes('short circuit') ||
    descLower.includes('fire');

  const isSafety =
    isRagging ||
    isElectrical ||
    descLower.includes('danger') ||
    descLower.includes('hazard') ||
    descLower.includes('assault') ||
    catLower.includes('safety');

  let priority: 'Low' | 'Medium' | 'High' | 'Urgent' = 'Medium';
  let recommendedDept = 'Maintenance';
  let safetyType = 'None';
  let categoryDetected = data.category;

  if (isRagging) {
    priority = 'Urgent';
    recommendedDept = 'Student Welfare / Anti-Ragging Committee';
    safetyType = 'Ragging & Harassment';
    categoryDetected = 'Ragging & Harassment';
  } else if (isElectrical) {
    priority = 'Urgent';
    recommendedDept = 'Maintenance';
    safetyType = 'Electrical Hazard';
    categoryDetected = 'Infrastructure';
  } else if (isSafety) {
    priority = 'High';
    recommendedDept = 'Security';
    safetyType = 'Physical Safety';
    categoryDetected = 'Safety & Security';
  } else if (
    descLower.includes('fan') ||
    descLower.includes('projector') ||
    descLower.includes('light') ||
    descLower.includes('room 204') ||
    descLower.includes('classroom') ||
    descLower.includes('desk') ||
    descLower.includes('switch')
  ) {
    priority = descLower.includes('not working') || descLower.includes('fan') ? 'Low' : 'Medium';
    recommendedDept = 'Maintenance';
    categoryDetected = 'Infrastructure';
  } else if (
    descLower.includes('water') ||
    descLower.includes('cooler') ||
    descLower.includes('clean') ||
    descLower.includes('toilet') ||
    descLower.includes('washroom') ||
    descLower.includes('garbage')
  ) {
    priority = 'High';
    recommendedDept = descLower.includes('hostel') ? 'Hostel Administration' : 'Maintenance';
    categoryDetected = 'Cleanliness & Sanitation';
  } else if (
    descLower.includes('hostel') ||
    descLower.includes('room') ||
    descLower.includes('warden') ||
    descLower.includes('bed') ||
    descLower.includes('dorm')
  ) {
    priority = 'Medium';
    recommendedDept = 'Hostel Administration';
    categoryDetected = 'Hostel & Accommodation';
  } else if (
    descLower.includes('food') ||
    descLower.includes('canteen') ||
    descLower.includes('mess') ||
    descLower.includes('meal') ||
    descLower.includes('hygiene')
  ) {
    priority = 'Medium';
    recommendedDept = 'Canteen Management';
    categoryDetected = 'Food & Canteen';
  } else if (
    descLower.includes('bus') ||
    descLower.includes('route') ||
    descLower.includes('driver') ||
    descLower.includes('transport')
  ) {
    priority = 'Medium';
    recommendedDept = 'Transport';
    categoryDetected = 'Transport & Other Services';
  }

  const sentences = data.description.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const summary =
    sentences.length > 0
      ? sentences.slice(0, 2).join('. ').trim() + '.'
      : data.description.slice(0, 120);

  const cleanTitle =
    data.title && data.title.trim().length > 3
      ? data.title.trim()
      : `${categoryDetected}: ${summary.slice(0, 45)}...`;

  return {
    status: errorMsg ? 'Requires Review' : 'Processed',
    result: {
      ai_title: cleanTitle,
      ai_summary: summary,
      ai_category_detected: categoryDetected,
      ai_priority_detected: priority,
      ai_recommended_department: recommendedDept,
      ai_confidence: 0.88,
      ai_safety_flag: isSafety,
      ai_safety_type: safetyType,
      ai_reasoning: `Rule-based triage evaluation: Detected ${safetyType !== 'None' ? safetyType : 'standard campus grievance'} from complaint content. Assigned to ${recommendedDept} with ${priority} priority level.`,
    },
  };
}

async function analyzeComplaintWithGemini(data: {
  description: string;
  category: string;
  title?: string;
  image_url?: string | null;
  identity_mode?: string;
}): Promise<{ status: AIProcessingStatus; result: AIAnalysisResult; error?: string }> {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return runFallbackAnalysis(data);
    }

    const availableDepartments = INITIAL_DEPARTMENTS.map((d) => d.name);
    const availableCategories = [
      'Safety & Security',
      'Ragging & Harassment',
      'Academic',
      'Infrastructure',
      'Cleanliness & Sanitation',
      'Food & Canteen',
      'Hostel & Accommodation',
      'Transport & Other Services',
      'Other',
    ];

    const promptText = `
You are the CampusResolve AI Intelligence Triage Engine for a university campus.
Analyze this newly filed student grievance and produce a structured, high-accuracy classification and safety evaluation.

Complaint Details Provided by Student:
- Category Selected by Student: "${data.category}"
- Title Provided: "${data.title || 'None provided'}"
- Identity Submission Mode: "${data.identity_mode || 'identified'}"
- Original Detailed Description:
"""
${data.description}
"""

Triage Classification Guidelines:
1. Title (ai_title): Generate a clear, professional, concise 4-8 word title summarizing the grievance (e.g., "Exposed Electrical Wiring in Corridor" or "Repeated Senior Harassment & Intimidation Report" or "Ceiling Fan Inoperative in Room 204").
2. Executive Summary (ai_summary): Generate a crisp, objective 1-3 sentence summary capturing what happened, where, and the impact.
3. Category (ai_category_detected): Choose the exact most appropriate category from: ${JSON.stringify(availableCategories)}.
   - If the complaint mentions threats, intimidation, seniors, bullying, abuse, extortion, or ragging, categorize as "Ragging & Harassment".
   - If the complaint mentions exposed wires, fire risks, broken locks, intruders, theft, or physical danger, categorize as "Safety & Security".
   - If the complaint mentions fans, ACs, lights, projectors, lab equipment, or furniture in lecture rooms, categorize as "Infrastructure".
   - If the complaint mentions water supply, coolers, clean washrooms, or sanitation, categorize as "Cleanliness & Sanitation".
   - If the complaint mentions hostel rooms, room amenities, or warden concerns, categorize as "Hostel & Accommodation".
4. Priority (ai_priority_detected): Choose one of: "Low", "Medium", "High", "Urgent".
   - "Urgent": Life-safety threats, active ragging/harassment/bullying, exposed live electrical wires, fire hazards, physical violence.
   - "High": Urgent sanitation problems (broken drinking water filter), critical hostel security failures, exams/academic blocking issues.
   - "Medium": Routine broken equipment (e.g. flickering projector, slow WiFi, leaking tap).
   - "Low": Non-critical items (e.g. single fan not working in a room with other fans, minor cosmetic repairs).
5. Recommended Department (ai_recommended_department): Select the best matching department name from: ${JSON.stringify(availableDepartments)}.
   - "Student Welfare / Anti-Ragging Committee" for ragging, harassment, intimidation, mental health, bullying.
   - "Maintenance" for electrical repairs, plumbing, broken fans/projectors, campus fixtures.
   - "Hostel Administration" for hostel rooms, hostel amenities, warden concerns.
   - "Canteen Management" for cafeteria hygiene, food quality, mess pricing.
   - "Security" for gate security, theft, unauthorized persons, physical surveillance.
   - "Transport" for buses, shuttles, parking.
   - "Academic Administration" for grades, syllabus, exams, lecture halls.
   - "Administration" for central policies, ID cards, general matters.
6. Confidence (ai_confidence): Float between 0.70 and 0.99 indicating confidence level.
7. Safety Flag (ai_safety_flag): Set to true IF AND ONLY IF the complaint involves ragging, threats, harassment, exposed electrical wires, fire risks, physical hazards, or acute safety violations.
8. Safety Type (ai_safety_type): String specifying hazard category (e.g., "Ragging & Harassment", "Electrical Hazard", "Physical Safety", "Fire Hazard", "Hygiene Hazard", or "None").
9. Reasoning (ai_reasoning): Provide a clear 1-2 sentence explanation of why this priority, category, and department were assigned.
`;

    const contents: any[] = [];

    // Multimodal image support if base64 data url is supplied
    if (data.image_url && data.image_url.startsWith('data:image/')) {
      const matches = data.image_url.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        contents.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        });
      }
    }

    contents.push(promptText);

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ai_title: {
              type: Type.STRING,
              description: 'Concise, professional 4-8 word title for the grievance.',
            },
            ai_summary: {
              type: Type.STRING,
              description: 'Clear 1-3 sentence objective summary of the grievance.',
            },
            ai_category_detected: {
              type: Type.STRING,
              description: 'Most appropriate category name from available categories.',
            },
            ai_priority_detected: {
              type: Type.STRING,
              enum: ['Low', 'Medium', 'High', 'Urgent'],
              description: 'Assessed priority level.',
            },
            ai_recommended_department: {
              type: Type.STRING,
              description: 'Recommended campus department name from provided list.',
            },
            ai_confidence: {
              type: Type.NUMBER,
              description: 'Confidence score between 0.0 and 1.0.',
            },
            ai_safety_flag: {
              type: Type.BOOLEAN,
              description: 'Whether safety, ragging, or hazard alert is triggered.',
            },
            ai_safety_type: {
              type: Type.STRING,
              description: 'Specific category of safety hazard or None.',
            },
            ai_reasoning: {
              type: Type.STRING,
              description: 'Explanation for triage recommendations.',
            },
          },
          required: [
            'ai_title',
            'ai_summary',
            'ai_category_detected',
            'ai_priority_detected',
            'ai_recommended_department',
            'ai_confidence',
            'ai_safety_flag',
            'ai_safety_type',
            'ai_reasoning',
          ],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      return runFallbackAnalysis(data, 'Empty AI response');
    }

    const parsed = JSON.parse(rawText) as AIAnalysisResult;
    const sanitizedPriority = ['Low', 'Medium', 'High', 'Urgent'].includes(parsed.ai_priority_detected)
      ? parsed.ai_priority_detected
      : 'Medium';

    return {
      status: 'Processed',
      result: {
        ai_title: parsed.ai_title || data.title || `${data.category} Grievance`,
        ai_summary: parsed.ai_summary || data.description.slice(0, 120),
        ai_category_detected: parsed.ai_category_detected || data.category,
        ai_priority_detected: sanitizedPriority,
        ai_recommended_department: parsed.ai_recommended_department || 'Maintenance',
        ai_confidence: typeof parsed.ai_confidence === 'number' ? parsed.ai_confidence : 0.93,
        ai_safety_flag: Boolean(parsed.ai_safety_flag),
        ai_safety_type: parsed.ai_safety_type || (parsed.ai_safety_flag ? 'Safety Hazard' : 'None'),
        ai_reasoning: parsed.ai_reasoning || 'Categorized based on student grievance description and campus location context.',
      },
    };
  } catch (error: any) {
    console.error('Gemini AI processing error:', error?.message || error);
    return runFallbackAnalysis(data, error?.message);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  let db = loadDatabase();

  // SSE stream endpoint for real-time updates
  app.get('/api/realtime/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    sseClients.push(newClient);

    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId })}\n\n`);

    req.on('close', () => {
      const index = sseClients.findIndex((c) => c.id === clientId);
      if (index !== -1) {
        sseClients.splice(index, 1);
      }
    });
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { account_id, password, required_role } = req.body;

    if (!account_id || !password) {
      return res.status(400).json({
        error:
          required_role === 'admin'
            ? 'Please enter your Administrator ID and password.'
            : 'Please enter your phone number and password.',
      });
    }

    const trimmedInput = String(account_id).trim();
    const cleanDigits = trimmedInput.replace(/\D/g, '');

    const user = db.profiles.find((p) => {
      const matchAccountId =
        p.account_id.toUpperCase() === trimmedInput.toUpperCase() ||
        (p.student_id && p.student_id.toUpperCase() === trimmedInput.toUpperCase());
      const matchPhone =
        cleanDigits.length >= 7 &&
        ((p.phone && p.phone.replace(/\D/g, '').endsWith(cleanDigits)) ||
          (p.phone_number && p.phone_number.replace(/\D/g, '').endsWith(cleanDigits)));
      if (!matchAccountId && !matchPhone) return false;

      // 1. If user has voluntarily changed their password:
      // ONLY the new password authenticates them. The initial DOB is NEVER accepted.
      if (p.password_changed) {
        return verifyPassword(password, p.password_hash);
      }

      // 2. For users who have NEVER changed their password:
      // Verify stored password hash
      if (verifyPassword(password, p.password_hash)) return true;

      // Or check initial registered date of birth in DDMMYYYY format
      if (p.date_of_birth) {
        const { initialPasswordDDMMYYYY } = parseDateOfBirth(p.date_of_birth);
        if (initialPasswordDDMMYYYY && password === initialPasswordDDMMYYYY) {
          return true;
        }
      }

      return false;
    });

    if (!user) {
      return res.status(401).json({
        error:
          required_role === 'admin'
            ? 'Invalid Administrator ID or password. Please check your credentials.'
            : 'Invalid phone number or password. Please check your credentials.',
      });
    }

    // Role-based gate
    if (required_role && user.role !== required_role) {
      return res.status(403).json({
        error: `Access Denied: Account ${user.account_id} has role '${user.role}' and cannot access the ${required_role} portal.`,
      });
    }

    // Check if user is restricted and auto-lift if expired
    if (user.is_restricted && user.restriction_end_date) {
      const end = new Date(user.restriction_end_date).getTime();
      if (Date.now() > end) {
        user.is_restricted = false;
        user.restriction_start_date = null;
        user.restriction_end_date = null;
        user.restriction_reason = null;
        saveDatabase(db);
      }
    }

    if (user.role === 'student') {
      user.must_change_password = false;
    }

    const { password_hash, ...safeProfile } = user;
    safeProfile.must_change_password = false;
    const token = `mock-token-${user.id}-${Date.now()}`;

    return res.json({
      user: safeProfile,
      token,
    });
  });

  // Auth: Change Password
  app.post('/api/auth/change-password', (req, res) => {
    const { account_id, current_password, new_password } = req.body;
    if (!account_id || !current_password || !new_password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const trimmedInput = String(account_id).trim().toUpperCase();
    const user = db.profiles.find(
      (p) =>
        p.account_id.toUpperCase() === trimmedInput ||
        (p.student_id && p.student_id.toUpperCase() === trimmedInput)
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Verify current password:
    // If student has changed password, ONLY their current password_hash is valid.
    // If student has not changed password yet, accept password_hash or registered DOB.
    const isCurrentValid =
      verifyPassword(current_password, user.password_hash) ||
      (!user.password_changed &&
        user.date_of_birth &&
        parseDateOfBirth(user.date_of_birth).initialPasswordDDMMYYYY === current_password);

    if (!isCurrentValid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    user.password_hash = hashPassword(new_password);
    user.password_changed = true;
    user.must_change_password = false;
    user.updated_at = new Date().toISOString();
    saveDatabase(db);

    const { password_hash, ...safeProfile } = user;
    safeProfile.password_changed = true;
    safeProfile.must_change_password = false;
    return res.json({ success: true, message: 'Password updated successfully.', user: safeProfile });
  });

  // Get current user profile
  app.get('/api/auth/me', (req, res) => {
    const account_id = (req.headers['x-account-id'] as string) || (req.query.account_id as string);
    if (!account_id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = db.profiles.find((p) => p.account_id.toUpperCase() === account_id.toUpperCase());
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Auto-lift restriction if expired
    if (user.is_restricted && user.restriction_end_date) {
      const end = new Date(user.restriction_end_date).getTime();
      if (Date.now() > end) {
        user.is_restricted = false;
        user.restriction_start_date = null;
        user.restriction_end_date = null;
        user.restriction_reason = null;
        saveDatabase(db);
      }
    }

    const { password_hash, ...safeProfile } = user;
    return res.json({ user: safeProfile });
  });

  // Notifications: Get user notifications
  app.get('/api/notifications', (req, res) => {
    const user_id = (req.headers['x-account-id'] as string) || (req.query.user_id as string);
    if (!user_id) {
      return res.json([]);
    }
    const validComplaintKeys = new Set(
      db.complaints.flatMap((c) => [c.id.toLowerCase(), c.complaint_id.toLowerCase()])
    );
    const userNotifs = (db.notifications || [])
      .filter((n) => {
        if (n.user_id.toUpperCase() !== String(user_id).toUpperCase()) return false;
        if (n.complaint_id && !validComplaintKeys.has(n.complaint_id.toLowerCase())) {
          if (n.complaint_num && validComplaintKeys.has(n.complaint_num.toLowerCase())) {
            return true;
          }
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return res.json(userNotifs);
  });

  // Notifications: Mark read
  app.patch('/api/notifications/:id/read', (req, res) => {
    const id = req.params.id;
    const notif = (db.notifications || []).find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      saveDatabase(db);
      broadcastChange('NOTIFICATION_UPDATED', notif);
      return res.json(notif);
    }
    return res.status(404).json({ error: 'Notification not found' });
  });

  // Notifications: Mark all read
  app.post('/api/notifications/mark-all-read', (req, res) => {
    const { user_id } = req.body;
    if (user_id && db.notifications) {
      db.notifications.forEach((n) => {
        if (n.user_id.toUpperCase() === String(user_id).toUpperCase()) {
          n.read = true;
        }
      });
      saveDatabase(db);
      broadcastChange('NOTIFICATIONS_CLEARED', { user_id });
    }
    return res.json({ success: true });
  });

  // Departments
  app.get('/api/departments', (req, res) => {
    const depts = db.departments.map((d) => {
      const count = db.complaints.filter((c) => c.department_id === d.id).length;
      return {
        ...d,
        complaint_count: count,
      };
    });
    return res.json(depts);
  });

  // Dashboard Stats
  app.get('/api/stats', (req, res) => {
    const student_id = req.query.student_id as string;
    const complaints = student_id
      ? db.complaints.filter(
          (c) => c.student_id.toUpperCase() === student_id.toUpperCase() && !c.student_archived
        )
      : db.complaints;

    const stats = {
      total: complaints.length,
      pending: complaints.filter((c) => c.status === 'Pending').length,
      in_progress: complaints.filter((c) => c.status === 'In Progress').length,
      under_investigation: complaints.filter((c) => c.status === 'Under Investigation').length,
      resolved: complaints.filter((c) => c.status === 'Resolved').length,
      closed: complaints.filter((c) => c.status === 'Closed').length,
      safety_alerts: complaints.filter((c) => c.ai_safety_flag).length,
      abuse_reviews: complaints.filter((c) => c.abuse_flag && c.abuse_review_status === 'Review Required').length,
    };

    return res.json(stats);
  });

  // Admin Analytics with Rich Breakdown
  app.get('/api/analytics', (req, res) => {
    const complaints = db.complaints;
    const total = complaints.length;
    const resolvedList = complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed');

    // Avg resolution time in hours
    let totalResolutionHours = 0;
    let countedResolved = 0;
    resolvedList.forEach((c) => {
      const created = new Date(c.created_at).getTime();
      const updated = new Date(c.updated_at).getTime();
      if (updated > created) {
        totalResolutionHours += (updated - created) / (1000 * 60 * 60);
        countedResolved++;
      }
    });
    const avgResolutionHours = countedResolved > 0 ? Math.round((totalResolutionHours / countedResolved) * 10) / 10 : 0;

    // Feedback rating average
    const ratedComplaints = complaints.filter((c) => typeof c.feedback_rating === 'number' && c.feedback_rating > 0);
    const avgRating = ratedComplaints.length > 0
      ? Math.round((ratedComplaints.reduce((acc, c) => acc + (c.feedback_rating || 0), 0) / ratedComplaints.length) * 10) / 10
      : 0;

    // Breakdown by Category
    const catMap: Record<string, number> = {};
    complaints.forEach((c) => {
      if (c.category) {
        catMap[c.category] = (catMap[c.category] || 0) + 1;
      }
    });
    const by_category = Object.entries(catMap).map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    // Breakdown by Department
    const deptMap: Record<string, { id: string; name: string; count: number; resolved: number }> = {};
    db.departments.forEach((d) => {
      deptMap[d.id] = { id: d.id, name: d.name, count: 0, resolved: 0 };
    });
    complaints.forEach((c) => {
      if (c.department_id && deptMap[c.department_id]) {
        deptMap[c.department_id].count++;
        if (c.status === 'Resolved' || c.status === 'Closed') {
          deptMap[c.department_id].resolved++;
        }
      }
    });
    const by_department = Object.values(deptMap);

    // Breakdown by Priority
    const priorityOrder = ['Low', 'Medium', 'High', 'Urgent'] as const;
    const by_priority = priorityOrder.map((pri) => ({
      priority: pri,
      count: complaints.filter((c) => c.priority === pri).length,
    }));

    // Breakdown by Status
    const statusOrder = ['Pending', 'In Progress', 'Under Investigation', 'Resolved', 'Closed'] as const;
    const by_status = statusOrder.map((st) => ({
      status: st,
      count: complaints.filter((c) => c.status === st).length,
    }));

    // Real Monthly Trend derived from complaint created_at dates
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthMap: Record<string, { month: string; total: number; resolved: number; safety: number }> = {};
    complaints.forEach((c) => {
      try {
        const d = new Date(c.created_at);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
          if (!monthMap[key]) {
            monthMap[key] = { month: label, total: 0, resolved: 0, safety: 0 };
          }
          monthMap[key].total++;
          if (c.status === 'Resolved' || c.status === 'Closed') {
            monthMap[key].resolved++;
          }
          if (c.ai_safety_flag) {
            monthMap[key].safety++;
          }
        }
      } catch {
        // ignore date error
      }
    });
    const monthly_trend = Object.keys(monthMap)
      .sort()
      .map((k) => monthMap[k]);

    // Real ratings breakdown
    const rating_distribution = [
      { stars: '5 Stars', count: ratedComplaints.filter((c) => c.feedback_rating === 5).length },
      { stars: '4 Stars', count: ratedComplaints.filter((c) => c.feedback_rating === 4).length },
      { stars: '3 Stars', count: ratedComplaints.filter((c) => c.feedback_rating === 3).length },
      { stars: '2 Stars', count: ratedComplaints.filter((c) => c.feedback_rating === 2).length },
      { stars: '1 Star', count: ratedComplaints.filter((c) => c.feedback_rating === 1).length },
    ];

    // Status counts
    const pendingCount = complaints.filter((c) => c.status === 'Pending').length;
    const inProgressCount = complaints.filter((c) => c.status === 'In Progress').length;
    const investigatingCount = complaints.filter((c) => c.status === 'Under Investigation').length;
    const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;
    const closedCount = complaints.filter((c) => c.status === 'Closed').length;

    // Abuse statistics
    const totalWarnings = db.profiles.reduce((acc, p) => acc + (p.warnings_count || 0), 0);
    const totalRestricted = db.profiles.filter((p) => p.is_restricted).length;
    const totalVerifiedFalse = complaints.filter((c) => c.abuse_review_status === 'Verified False').length;
    const pendingAbuseReviews = complaints.filter((c) => c.abuse_flag && c.abuse_review_status === 'Review Required').length;

    // Maps for object-based lookups
    const departmentsObj: Record<string, number> = {};
    by_department.forEach((d) => {
      departmentsObj[d.name] = d.count;
    });
    const prioritiesObj: Record<string, number> = {};
    by_priority.forEach((p) => {
      prioritiesObj[p.priority] = p.count;
    });
    const statusesObj: Record<string, number> = {};
    by_status.forEach((s) => {
      statusesObj[s.status] = s.count;
    });

    const summary = {
      total_complaints: total,
      pending_complaints: pendingCount,
      in_progress_complaints: inProgressCount,
      under_investigation_complaints: investigatingCount,
      resolved_complaints: resolvedCount,
      closed_complaints: closedCount,
      open_complaints: pendingCount + inProgressCount + investigatingCount,
      safety_alerts: complaints.filter((c) => c.ai_safety_flag).length,
      avg_resolution_hours: avgResolutionHours,
      avg_satisfaction_rating: avgRating,
      total_warnings: totalWarnings,
      total_restricted_students: totalRestricted,
      verified_false_complaints: totalVerifiedFalse,
      pending_abuse_reviews: pendingAbuseReviews,
      resolution_rate_percent: total > 0 ? Math.round((resolvedList.length / total) * 100) : 0,
      total_feedback_count: ratedComplaints.length,
    };

    return res.json({
      // Flat properties
      total_complaints: total,
      pending_complaints: pendingCount,
      in_progress_complaints: inProgressCount,
      under_investigation_complaints: investigatingCount,
      resolved_complaints: resolvedCount,
      closed_complaints: closedCount,
      open_complaints: pendingCount + inProgressCount + investigatingCount,
      safety_flagged_count: complaints.filter((c) => c.ai_safety_flag).length,
      abuse_flagged_count: complaints.filter((c) => c.abuse_flag && c.abuse_review_status === 'Review Required').length,
      avg_resolution_time_hours: avgResolutionHours,
      resolution_rate_percent: summary.resolution_rate_percent,
      average_rating: avgRating,
      total_feedback_count: ratedComplaints.length,

      // Object maps
      categories: catMap,
      departments: departmentsObj,
      priorities: prioritiesObj,
      statuses: statusesObj,

      // Arrays
      by_category,
      by_department,
      by_priority,
      by_status,
      monthly_trend,
      timeline: monthly_trend.map((m) => ({ date: m.month, count: m.total, resolved: m.resolved })),
      rating_distribution,

      summary,
    });
  });

  // Get Complaints List (with role-based access & anonymity masking)
  app.get('/api/complaints', (req, res) => {
    const {
      student_id,
      status,
      category,
      department_id,
      priority,
      search,
      safety_only,
      abuse_only,
      sort_by,
    } = req.query;

    const callerRole = (req.headers['x-user-role'] as string) || 'admin';
    const callerAdminRole = req.headers['x-admin-role'] as string;
    const callerDept = req.headers['x-department'] as string;

    let list = [...db.complaints];

    // Role filtering: Student sees only their own complaints
    if (student_id) {
      list = list.filter((c) => c.student_id.toUpperCase() === String(student_id).toUpperCase());
      // For student view, exclude archived complaints from active dashboard unless specifically requested
      if (req.query.include_archived !== 'true') {
        list = list.filter((c) => !c.student_archived);
      }
    }

    // Role filtering: Department staff can be filtered by their department if requested or default
    if (department_id && department_id !== 'All') {
      list = list.filter((c) => c.department_id === department_id);
    }

    if (status && status !== 'All') {
      list = list.filter((c) => c.status === status);
    }

    if (category && category !== 'All') {
      list = list.filter((c) => c.category === category);
    }

    if (priority && priority !== 'All') {
      list = list.filter((c) => c.priority === priority);
    }

    if (safety_only === 'true') {
      list = list.filter((c) => c.ai_safety_flag === true);
    }

    if (abuse_only === 'true') {
      list = list.filter((c) => c.abuse_flag === true || c.abuse_review_status === 'Review Required');
    }

    if (search) {
      const q = String(search).trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.complaint_id && c.complaint_id.toLowerCase().includes(q)) ||
          (c.title && c.title.toLowerCase().includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q)) ||
          (c.category && c.category.toLowerCase().includes(q)) ||
          (c.student_name && c.student_name.toLowerCase().includes(q)) ||
          (c.ai_title && c.ai_title.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sort_by === 'priority') {
      const prioWeight: Record<string, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
      list.sort((a, b) => {
        // Safety alerts always pinned to top
        if (a.ai_safety_flag && !b.ai_safety_flag) return -1;
        if (!a.ai_safety_flag && b.ai_safety_flag) return 1;
        const diff = (prioWeight[b.priority] || 0) - (prioWeight[a.priority] || 0);
        if (diff !== 0) return diff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else if (sort_by === 'oldest') {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else {
      // Default: newest first, but safety alerts stay visually prominent
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Enrich and apply strict Anonymous protection
    const enriched = list.map((c) => {
      const dept = db.departments.find((d) => d.id === c.department_id);
      const isAnon = c.identity_mode === 'anonymous' && !c.is_unmasked;

      return {
        ...c,
        department_name: dept ? dept.name : 'Unassigned',
        displayName: isAnon ? 'Anonymous Student' : c.student_name,
        // Ensure sensitive student data is stripped
        student_id: isAnon ? 'VERIFIED_INTERNAL_ID' : c.student_id,
        is_anonymous_protected: c.identity_mode === 'anonymous',
      };
    });

    return res.json(enriched);
  });

  // Get Complaint Details
  app.get('/api/complaints/:id', (req, res) => {
    const id = req.params.id;
    const callerId = req.headers['x-account-id'] as string;
    const callerRole = (req.headers['x-user-role'] as string) || 'student';

    if (!id || id === 'null' || id === 'undefined') {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const cleanId = String(id).trim().toLowerCase();
    const complaint = db.complaints.find(
      (c) =>
        (c.id && c.id.toLowerCase() === cleanId) ||
        (c.complaint_id && c.complaint_id.toLowerCase() === cleanId)
    );

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    let updates = db.complaint_updates
      .filter((u) => u.complaint_id === complaint.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Filter out internal administrative notes for student viewers
    if (callerRole === 'student') {
      updates = updates.filter((u) => !u.is_internal);
    }

    const dept = db.departments.find((d) => d.id === complaint.department_id);
    const isAnon = complaint.identity_mode === 'anonymous' && !complaint.is_unmasked;

    // If caller is the author student or Super Admin with unmask, they can see identity context
    const isAuthor = callerId && callerId.toUpperCase() === complaint.student_id.toUpperCase();
    const canSeeIdentity = !isAnon || isAuthor;

    return res.json({
      ...complaint,
      department_name: dept ? dept.name : 'Unassigned',
      displayName: isAnon && !isAuthor ? 'Anonymous Student' : complaint.student_name,
      student_id: isAnon && !isAuthor ? 'VERIFIED_INTERNAL_ID' : complaint.student_id,
      is_anonymous_protected: complaint.identity_mode === 'anonymous',
      updates,
    });
  });

  // Archive Resolved Complaint (Student Action - Archive Only, No Permanent Deletion)
  app.post('/api/complaints/:id/archive', (req, res) => {
    const id = req.params.id;
    const callerId = (req.headers['x-account-id'] as string) || req.body.account_id;
    const callerRole = (req.headers['x-user-role'] as string) || 'student';

    const complaint = db.complaints.find(
      (c) => c.id === id || c.complaint_id.toUpperCase() === id.toUpperCase()
    );

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Role check: Only the owning student (or authorized admin) can archive
    if (callerRole === 'student' && callerId) {
      const matchOwner =
        complaint.student_id.toUpperCase() === String(callerId).toUpperCase();
      if (!matchOwner) {
        return res.status(403).json({ error: 'You can only archive your own complaints.' });
      }
    }

    // STRICT ARCHIVE-ONLY RULE: Only RESOLVED complaints can be archived!
    if (complaint.status !== 'Resolved' && complaint.status !== 'Closed') {
      return res.status(400).json({
        error: 'Only resolved complaints can be archived. Unresolved complaints must remain visible on the dashboard.',
      });
    }

    const now = new Date().toISOString();
    complaint.student_archived = true;
    complaint.archived_at = now;
    complaint.updated_at = now;

    // Timeline record for audit
    const archiveUpdate: DBComplaintUpdate = {
      id: `upd-${Date.now()}-arch`,
      complaint_id: complaint.id,
      status: complaint.status,
      note: 'Complaint archived from student active dashboard.',
      updated_by: callerRole === 'student' ? (complaint.student_name || 'Student') : 'Administrator',
      is_internal: false,
      action: 'ARCHIVED',
      created_at: now,
    };
    db.complaint_updates.push(archiveUpdate);

    // Update student's active total complaints count
    const student = db.profiles.find((p) => p.account_id.toUpperCase() === complaint.student_id.toUpperCase());
    if (student) {
      const activeCount = db.complaints.filter(
        (c) => c.student_id.toUpperCase() === student.account_id.toUpperCase() && !c.student_archived
      ).length;
      student.total_complaints = activeCount;
    }

    saveDatabase(db);
    broadcastChange('COMPLAINT_UPDATED', complaint);

    return res.json({
      success: true,
      message: 'Complaint archived from active dashboard.',
      complaint,
    });
  });

  // Create Complaint (with Restriction Enforcement, Abuse Heuristics & Safety Trigger)
  app.post('/api/complaints', async (req, res) => {
    const {
      student_id,
      category,
      title,
      description,
      image_url,
      identity_mode,
      department_id,
      priority,
    } = req.body;

    // Authenticated session automatically determines ownership from header or student_id
    const effectiveStudentId = (req.headers['x-account-id'] as string) || student_id;

    if (!effectiveStudentId || !category || !description) {
      return res.status(400).json({ error: 'Student ID, Category, and Description are required.' });
    }

    const trimmedStudentId = String(effectiveStudentId).trim().toUpperCase();
    const student = db.profiles.find((p) => p.account_id.toUpperCase() === trimmedStudentId);

    // 1. Restriction Check: If student is restricted, block submission
    if (student?.is_restricted) {
      const end = student.restriction_end_date ? new Date(student.restriction_end_date).getTime() : 0;
      if (Date.now() < end) {
        const remainingDays = Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
        return res.status(403).json({
          error: `Account Restricted: Your account is currently suspended from filing complaints for ${remainingDays} more day(s) due to verified violation: "${student.restriction_reason || 'Policy Violation'}". Contact administration if you believe this is an error.`,
          is_restricted: true,
          restriction_end_date: student.restriction_end_date,
          restriction_reason: student.restriction_reason,
        });
      } else {
        // Auto-lift expired restriction
        student.is_restricted = false;
        student.restriction_start_date = null;
        student.restriction_end_date = null;
        student.restriction_reason = null;
        saveDatabase(db);
      }
    }

    // 2. Abuse / Low-Information Heuristic (AI flags but NEVER auto-rejects)
    let isSuspectedAbuse = false;
    let abuseReason = '';
    const cleanDesc = String(description).trim();

    // Check for repetitive spam characters or nonsensical gibberish
    const isRepetitive = /(.)\1{9,}/i.test(cleanDesc);
    const isVeryShortNonsense = cleanDesc.length < 12 && !cleanDesc.includes(' ');
    
    // Check for recent duplicate by same student in last 3 minutes
    const recentDuplicate = db.complaints.find(
      (c) =>
        c.student_id === trimmedStudentId &&
        c.description.toLowerCase() === cleanDesc.toLowerCase() &&
        Date.now() - new Date(c.created_at).getTime() < 3 * 60 * 1000
    );

    if (isRepetitive || isVeryShortNonsense) {
      isSuspectedAbuse = true;
      abuseReason = 'Potential low-information content or keyboard spam detected.';
    } else if (recentDuplicate) {
      isSuspectedAbuse = true;
      abuseReason = 'Identical grievance submitted multiple times within 3 minutes.';
    }

    const studentName = student ? student.name : 'Student';
    const nextNum = (db.last_complaint_num || 1000) + 1;
    db.last_complaint_num = nextNum;
    const complaintIdFormatted = `CMP-${nextNum}`;

    const newId = `cmp-uuid-${nextNum}-${Date.now()}`;
    const now = new Date().toISOString();

    // 3. Run Gemini AI Intelligence Triage
    const aiTriage = await analyzeComplaintWithGemini({
      description: cleanDesc,
      category: String(category).trim(),
      title: title ? String(title).trim() : undefined,
      image_url: image_url || null,
      identity_mode: identity_mode === 'anonymous' ? 'anonymous' : 'identified',
    });

    const aiRes = aiTriage.result;

    // Resolve recommended department ID if not manually selected
    let resolvedDepartmentId = department_id || null;
    if (!resolvedDepartmentId && aiRes?.ai_recommended_department) {
      const recDept = String(aiRes.ai_recommended_department).trim().toLowerCase();
      const matchDept = db.departments.find((d) => {
        const dName = String(d.name || '').trim().toLowerCase();
        return dName === recDept || dName.includes(recDept) || recDept.includes(dName);
      });
      if (matchDept) {
        resolvedDepartmentId = matchDept.id;
      }
    }

    // Auto-escalate priority if safety alert triggered
    let finalPriority: 'Low' | 'Medium' | 'High' | 'Urgent' = priority || 'Medium';
    if (aiRes?.ai_safety_flag) {
      finalPriority = 'Urgent';
    } else if (aiRes?.ai_priority_detected && !priority) {
      finalPriority = aiRes.ai_priority_detected;
    }

    const effectiveTitle =
      title && String(title).trim().length > 3
        ? String(title).trim()
        : aiRes?.ai_title || `${category} Issue reported by student`;

    const newComplaint: DBComplaint = {
      id: newId,
      complaint_id: complaintIdFormatted,
      student_id: trimmedStudentId,
      student_name: studentName,
      category: String(category).trim(),
      title: effectiveTitle,
      description: cleanDesc,
      image_url: image_url || null,
      identity_mode: identity_mode === 'anonymous' ? 'anonymous' : 'identified',
      status: 'Pending',
      priority: finalPriority,
      department_id: resolvedDepartmentId,
      created_at: now,
      updated_at: now,
      // AI metadata
      ai_status: aiTriage.status,
      ai_title: aiRes?.ai_title || effectiveTitle,
      ai_summary: aiRes?.ai_summary || cleanDesc.slice(0, 120),
      ai_category_detected: aiRes?.ai_category_detected || String(category).trim(),
      ai_priority_detected: aiRes?.ai_priority_detected || finalPriority,
      ai_recommended_department: aiRes?.ai_recommended_department || null,
      ai_confidence: aiRes ? Math.round(aiRes.ai_confidence * 100) / 100 : null,
      ai_safety_flag: aiRes ? aiRes.ai_safety_flag : false,
      ai_safety_type: aiRes ? aiRes.ai_safety_type : 'None',
      ai_reasoning: aiRes ? aiRes.ai_reasoning : null,
      ai_processed_at: now,
      ai_overridden: false,
      // Abuse Prevention
      abuse_flag: isSuspectedAbuse,
      abuse_reason: isSuspectedAbuse ? abuseReason : null,
      abuse_review_status: isSuspectedAbuse ? 'Review Required' : 'None',
    };

    // Update student complaint counter
    if (student) {
      student.total_complaints = (student.total_complaints || 0) + 1;
    }

    // Add initial timeline update
    const initialUpdate: DBComplaintUpdate = {
      id: `upd-${nextNum}-1`,
      complaint_id: newId,
      status: 'Pending',
      note: 'Grievance submitted by student. Initial queue dispatch completed.',
      updated_by: identity_mode === 'anonymous' ? 'Anonymous Student' : studentName,
      is_internal: false,
      action: 'SUBMITTED',
      created_at: now,
    };

    // Add AI Triage audit note to timeline
    const aiConfidencePct = aiRes ? Math.round(aiRes.ai_confidence * 100) : 90;
    const aiSafetyNote = aiRes?.ai_safety_flag
      ? ` 🚨 CRITICAL SAFETY ALERT: ${aiRes.ai_safety_type || 'Safety Hazard'} detected. Priority escalated to Urgent.`
      : '';

    const aiUpdate: DBComplaintUpdate = {
      id: `upd-${nextNum}-ai`,
      complaint_id: newId,
      status: 'Pending',
      note: `Automated Triage: Classified as ${aiRes?.ai_category_detected || category} (${aiConfidencePct}% confidence). Recommended Department: ${aiRes?.ai_recommended_department || 'General'}.${aiSafetyNote}`,
      updated_by: 'Automated System',
      is_internal: false,
      action: 'AI_PROCESSED',
      created_at: new Date(Date.now() + 500).toISOString(),
    };

    db.complaints.unshift(newComplaint);
    db.complaint_updates.push(initialUpdate, aiUpdate);

    // Create Notification for Student
    createNotification(db, {
      user_id: trimmedStudentId,
      complaint_id: newId,
      complaint_num: complaintIdFormatted,
      title: 'Complaint Registered',
      message: `Your complaint ${complaintIdFormatted} has been registered.`,
      type: aiRes?.ai_safety_flag ? 'safety' : 'received',
    });

    saveDatabase(db);

    broadcastChange('COMPLAINT_CREATED', newComplaint);

    const dept = db.departments.find((d) => d.id === newComplaint.department_id);

    return res.status(201).json({
      ...newComplaint,
      department_name: dept ? dept.name : 'Unassigned',
      displayName: identity_mode === 'anonymous' ? 'Anonymous Student' : studentName,
      updates: [initialUpdate, aiUpdate],
    });
  });

  // Re-Analyze Complaint with Gemini AI (Admin action)
  app.post('/api/complaints/:id/reanalyze', async (req, res) => {
    const id = req.params.id;
    const complaint = db.complaints.find(
      (c) => c.id === id || c.complaint_id.toUpperCase() === id.toUpperCase()
    );

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const aiTriage = await analyzeComplaintWithGemini({
      description: complaint.description,
      category: complaint.category,
      title: complaint.title,
      image_url: complaint.image_url,
      identity_mode: complaint.identity_mode,
    });

    const aiRes = aiTriage.result;
    const now = new Date().toISOString();

    complaint.ai_status = aiTriage.status;
    if (aiRes) {
      complaint.ai_title = aiRes.ai_title;
      complaint.ai_summary = aiRes.ai_summary;
      complaint.ai_category_detected = aiRes.ai_category_detected;
      complaint.ai_priority_detected = aiRes.ai_priority_detected;
      complaint.ai_recommended_department = aiRes.ai_recommended_department;
      complaint.ai_confidence = Math.round(aiRes.ai_confidence * 100) / 100;
      complaint.ai_safety_flag = aiRes.ai_safety_flag;
      complaint.ai_safety_type = aiRes.ai_safety_type;
      complaint.ai_reasoning = aiRes.ai_reasoning;
      complaint.ai_processed_at = now;
    }
    complaint.updated_at = now;

    const confPct = aiRes ? Math.round(aiRes.ai_confidence * 100) : 90;
    const reanalyzeUpdate: DBComplaintUpdate = {
      id: `upd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      complaint_id: complaint.id,
      status: complaint.status,
      note: `Automated Re-Triage: Refreshed analysis (${confPct}% confidence). Category: ${aiRes?.ai_category_detected}, Department: ${aiRes?.ai_recommended_department}.`,
      updated_by: 'Automated System',
      is_internal: false,
      action: 'AI_REANALYZED',
      created_at: now,
    };

    db.complaint_updates.push(reanalyzeUpdate);
    saveDatabase(db);

    broadcastChange('COMPLAINT_UPDATED', complaint);

    const updates = db.complaint_updates
      .filter((u) => u.complaint_id === complaint.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const dept = db.departments.find((d) => d.id === complaint.department_id);

    return res.json({
      ...complaint,
      department_name: dept ? dept.name : 'Unassigned',
      displayName: complaint.identity_mode === 'anonymous' && !complaint.is_unmasked ? 'Anonymous Student' : complaint.student_name,
      updates,
    });
  });

  // Update Complaint Status / Department / Priority (Admin)
  app.patch('/api/complaints/:id', (req, res) => {
    const id = req.params.id;
    const {
      status,
      department_id,
      priority,
      category,
      note,
      is_internal,
      updated_by_name,
    } = req.body;

    const complaintIndex = db.complaints.findIndex(
      (c) => c.id === id || c.complaint_id.toUpperCase() === id.toUpperCase()
    );

    if (complaintIndex === -1) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = db.complaints[complaintIndex];
    const now = new Date().toISOString();
    const prevStatus = complaint.status;
    const statusChanged = status && status !== complaint.status;
    const prevDeptId = complaint.department_id;
    const deptChanged = department_id !== undefined && department_id !== complaint.department_id;

    let overridden = complaint.ai_overridden || false;

    if (status) complaint.status = status;
    if (category && category !== complaint.category) {
      complaint.category = category;
      if (complaint.ai_category_detected && category !== complaint.ai_category_detected) {
        overridden = true;
      }
    }
    if (department_id !== undefined) {
      complaint.department_id = department_id || null;
      const targetDept = db.departments.find((d) => d.id === department_id);
      if (
        complaint.ai_recommended_department &&
        targetDept &&
        targetDept.name !== complaint.ai_recommended_department
      ) {
        overridden = true;
      }
    }
    if (priority) {
      complaint.priority = priority;
      if (complaint.ai_priority_detected && priority !== complaint.ai_priority_detected) {
        overridden = true;
      }
    }

    complaint.ai_overridden = overridden;
    complaint.updated_at = now;

    // Add audit note to updates
    if (statusChanged || deptChanged || note) {
      const updateEntry: DBComplaintUpdate = {
        id: `upd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        complaint_id: complaint.id,
        status: complaint.status,
        note:
          note ||
          (statusChanged
            ? `Status progressed from '${prevStatus}' to '${status}'.`
            : deptChanged
            ? `Re-assigned to department '${db.departments.find((d) => d.id === department_id)?.name || 'Unassigned'}'.`
            : 'Complaint details updated by staff.'),
        updated_by: updated_by_name || 'Campus Administration',
        is_internal: Boolean(is_internal),
        action: statusChanged ? 'STATUS_CHANGED' : deptChanged ? 'DEPT_ASSIGNED' : 'STAFF_UPDATE',
        created_at: now,
      };
      db.complaint_updates.push(updateEntry);
    }

    // Trigger Notification for Student (unless private internal note)
    if (!is_internal) {
      if (statusChanged) {
        let notifType: 'status_change' | 'resolved' = status === 'Resolved' ? 'resolved' : 'status_change';
        let notifTitle = `Status: ${status}`;
        let notifMsg = `Your complaint ${complaint.complaint_id} status was updated to "${status}".`;
        if (status === 'Resolved') {
          notifTitle = 'Complaint Resolved';
          notifMsg = `Your complaint ${complaint.complaint_id} has been resolved.`;
        } else if (status === 'In Progress') {
          notifTitle = 'In Progress';
          notifMsg = `Your complaint ${complaint.complaint_id} is currently being processed.`;
        } else if (status === 'Under Investigation') {
          notifTitle = 'Under Investigation';
          notifMsg = `Your complaint ${complaint.complaint_id} is under investigation.`;
        }
        createNotification(db, {
          user_id: complaint.student_id,
          complaint_id: complaint.id,
          complaint_num: complaint.complaint_id,
          title: notifTitle,
          message: notifMsg,
          type: notifType,
        });
      } else if (deptChanged) {
        createNotification(db, {
          user_id: complaint.student_id,
          complaint_id: complaint.id,
          complaint_num: complaint.complaint_id,
          title: 'Complaint Assigned',
          message: `Your complaint ${complaint.complaint_id} has been assigned for action.`,
          type: 'assigned',
        });
      }
    }

    saveDatabase(db);
    broadcastChange('COMPLAINT_UPDATED', complaint);

    const updates = db.complaint_updates
      .filter((u) => u.complaint_id === complaint.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const dept = db.departments.find((d) => d.id === complaint.department_id);

    return res.json({
      ...complaint,
      department_name: dept ? dept.name : 'Unassigned',
      displayName: complaint.identity_mode === 'anonymous' && !complaint.is_unmasked ? 'Anonymous Student' : complaint.student_name,
      updates,
    });
  });

  // Admin Abuse Review Decision (Human Admin Verification)
  app.post('/api/admin/abuse/review', (req, res) => {
    const {
      complaint_id,
      is_deliberately_false,
      issue_warning,
      apply_restriction,
      restriction_days,
      restriction_reason,
      reviewer_name,
      audit_note,
    } = req.body;

    const complaint = db.complaints.find(
      (c) => c.id === complaint_id || c.complaint_id.toUpperCase() === String(complaint_id).toUpperCase()
    );

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const student = db.profiles.find((p) => p.account_id.toUpperCase() === complaint.student_id.toUpperCase());
    const now = new Date().toISOString();

    if (is_deliberately_false) {
      complaint.abuse_review_status = 'Verified False';
      complaint.abuse_flag = true;

      if (student) {
        student.verified_false_complaints = (student.verified_false_complaints || 0) + 1;
        if (issue_warning) {
          student.warnings_count = (student.warnings_count || 0) + 1;
        }

        // Apply 7-day restriction if requested or if student reached 2+ verified false complaints
        if (apply_restriction || (student.verified_false_complaints >= 2 && !student.is_restricted)) {
          const days = Number(restriction_days) || 7;
          const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
          student.is_restricted = true;
          student.restriction_start_date = now;
          student.restriction_end_date = endDate;
          student.restriction_reason =
            restriction_reason || 'Verified submission of deliberate false or malicious complaints.';
        }
      }

      // Add audit log entry
      const abuseAuditUpdate: DBComplaintUpdate = {
        id: `upd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        complaint_id: complaint.id,
        status: complaint.status,
        note: `[ADMIN AUDIT] Abuse Review by ${reviewer_name || 'Admin'}: Verified deliberate false complaint. ${audit_note || ''}`,
        updated_by: reviewer_name || 'Admin Abuse Oversight',
        is_internal: true,
        action: 'ABUSE_VERIFIED_FALSE',
        created_at: now,
      };
      db.complaint_updates.push(abuseAuditUpdate);

      // Notify student
      if (student) {
        createNotification(db, {
          user_id: student.account_id,
          complaint_id: complaint.id,
          complaint_num: complaint.complaint_id,
          title: 'Official Account Notice',
          message: student.is_restricted
            ? `Your complaint ${complaint.complaint_id} was verified as false. Your account has been restricted for ${restriction_days || 7} days.`
            : `Investigation Notice: Grievance ${complaint.complaint_id} was reviewed and verified as an invalid/false submission. An official warning was logged.`,
          type: 'status_change',
        });
      }
    } else {
      // Cleared as legitimate
      complaint.abuse_review_status = 'Verified Legitimate';
      complaint.abuse_flag = false;

      const clearAuditUpdate: DBComplaintUpdate = {
        id: `upd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        complaint_id: complaint.id,
        status: complaint.status,
        note: `[ADMIN AUDIT] Abuse Review by ${reviewer_name || 'Admin'}: Verified complaint is legitimate. Flag cleared.`,
        updated_by: reviewer_name || 'Admin Abuse Oversight',
        is_internal: true,
        action: 'ABUSE_CLEARED_LEGITIMATE',
        created_at: now,
      };
      db.complaint_updates.push(clearAuditUpdate);
    }

    saveDatabase(db);
    broadcastChange('COMPLAINT_UPDATED', complaint);
    if (student) {
      broadcastChange('STUDENT_UPDATED', student);
    }

    return res.json({
      success: true,
      complaint,
      student,
    });
  });

  // Admin: Get all students with abuse metrics
  app.get('/api/admin/students', (req, res) => {
    const students = db.profiles
      .filter((p) => p.role === 'student')
      .map(({ password_hash, ...safeStudent }) => {
        const studentComplaints = db.complaints.filter((c) => c.student_id === safeStudent.account_id);
        return {
          ...safeStudent,
          total_complaints: studentComplaints.length,
          active_complaints: studentComplaints.filter((c) => ['Pending', 'In Progress', 'Under Investigation'].includes(c.status)).length,
          verified_false_complaints: safeStudent.verified_false_complaints || 0,
          warnings_count: safeStudent.warnings_count || 0,
          is_restricted: Boolean(safeStudent.is_restricted),
        };
      });
    return res.json(students);
  });

  // Admin: Restrict or Unrestrict a student manually
  app.post('/api/admin/students/:accountId/restrict', (req, res) => {
    const accountId = req.params.accountId.toUpperCase();
    const { action, days, reason, admin_name } = req.body;

    const student = db.profiles.find((p) => p.account_id.toUpperCase() === accountId && p.role === 'student');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const now = new Date().toISOString();

    if (action === 'restrict') {
      const durationDays = Number(days) || 7;
      student.is_restricted = true;
      student.restriction_start_date = now;
      student.restriction_end_date = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
      student.restriction_reason = reason || 'Administrative suspension due to repeated campus policy violations.';
      
      createNotification(db, {
        user_id: student.account_id,
        complaint_id: 'SYSTEM',
        complaint_num: 'ADM-ACTION',
        title: 'Account Restriction Applied',
        message: `Your grievance filing privileges are restricted for ${durationDays} days. Reason: ${student.restriction_reason}`,
        type: 'status_change',
      });
    } else {
      // Unrestrict
      student.is_restricted = false;
      student.restriction_start_date = null;
      student.restriction_end_date = null;
      student.restriction_reason = null;

      createNotification(db, {
        user_id: student.account_id,
        complaint_id: 'SYSTEM',
        complaint_num: 'ADM-ACTION',
        title: 'Restriction Lifted',
        message: 'Your grievance filing privileges have been restored by campus administration.',
        type: 'status_change',
      });
    }

    saveDatabase(db);
    broadcastChange('STUDENT_UPDATED', student);

    const { password_hash, ...safeProfile } = student;
    return res.json({ success: true, student: safeProfile });
  });

  // Super Admin: Audited Unmasking of Anonymous Complaint
  app.post('/api/complaints/:id/unmask', (req, res) => {
    const id = req.params.id;
    const { reason, admin_name, admin_role } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ error: 'A valid institutional justification/reason is required for unmasking.' });
    }

    const complaint = db.complaints.find(
      (c) => c.id === id || c.complaint_id.toUpperCase() === id.toUpperCase()
    );

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const now = new Date().toISOString();
    complaint.is_unmasked = true;
    complaint.unmasked_by = admin_name || 'Super Admin';
    complaint.unmasked_at = now;
    complaint.unmask_reason = reason.trim();
    complaint.updated_at = now;

    // Add immutable security audit log
    const auditUpdate: DBComplaintUpdate = {
      id: `upd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      complaint_id: complaint.id,
      status: complaint.status,
      note: `[SECURITY AUDIT] Identity unmasked for official institutional inquiry by ${admin_name || 'Super Admin'}. Justification: "${reason.trim()}"`,
      updated_by: admin_name || 'Super Admin Security Log',
      is_internal: true,
      action: 'IDENTITY_UNMASKED',
      created_at: now,
    };

    db.complaint_updates.push(auditUpdate);
    saveDatabase(db);

    broadcastChange('COMPLAINT_UPDATED', complaint);

    const dept = db.departments.find((d) => d.id === complaint.department_id);
    const updates = db.complaint_updates
      .filter((u) => u.complaint_id === complaint.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return res.json({
      ...complaint,
      department_name: dept ? dept.name : 'Unassigned',
      displayName: complaint.student_name,
      updates,
    });
  });

  // Student: Submit Resolution Feedback & Rating
  app.post('/api/complaints/:id/feedback', (req, res) => {
    const id = req.params.id;
    const { rating, comment, student_id } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Please provide a star rating from 1 to 5.' });
    }

    const complaint = db.complaints.find(
      (c) => c.id === id || c.complaint_id.toUpperCase() === id.toUpperCase()
    );

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (complaint.status !== 'Resolved' && complaint.status !== 'Closed') {
      return res.status(400).json({ error: 'Feedback can only be submitted for resolved complaints.' });
    }

    const now = new Date().toISOString();
    complaint.feedback_rating = rating;
    complaint.feedback_comment = comment ? String(comment).trim() : null;
    complaint.feedback_submitted_at = now;
    complaint.updated_at = now;

    const feedbackUpdate: DBComplaintUpdate = {
      id: `upd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      complaint_id: complaint.id,
      status: complaint.status,
      note: `Student submitted resolution feedback: ${rating}/5 Stars. ${comment ? `"${comment}"` : ''}`,
      updated_by: complaint.identity_mode === 'anonymous' ? 'Anonymous Student' : complaint.student_name,
      is_internal: false,
      action: 'FEEDBACK_SUBMITTED',
      created_at: now,
    };

    db.complaint_updates.push(feedbackUpdate);
    saveDatabase(db);

    broadcastChange('COMPLAINT_UPDATED', complaint);

    return res.json({
      success: true,
      complaint,
      feedback_rating: rating,
      feedback_comment: complaint.feedback_comment,
      feedback_submitted_at: now,
    });
  });

  // Add note/update
  app.post('/api/complaints/:id/updates', (req, res) => {
    const id = req.params.id;
    const { note, updated_by_name, status, is_internal } = req.body;

    const complaint = db.complaints.find(
      (c) => c.id === id || c.complaint_id.toUpperCase() === id.toUpperCase()
    );

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    if (!note) {
      return res.status(400).json({ error: 'Note text is required.' });
    }

    const now = new Date().toISOString();
    const targetStatus = status || complaint.status;

    const updateEntry: DBComplaintUpdate = {
      id: `upd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      complaint_id: complaint.id,
      status: targetStatus,
      note: String(note).trim(),
      updated_by: updated_by_name || 'Staff Note',
      is_internal: Boolean(is_internal),
      action: 'STAFF_NOTE',
      created_at: now,
    };

    if (status && status !== complaint.status) {
      complaint.status = status;
    }
    complaint.updated_at = now;

    db.complaint_updates.push(updateEntry);

    // Notify student if not an internal note
    if (!is_internal) {
      createNotification(db, {
        user_id: complaint.student_id,
        complaint_id: complaint.id,
        complaint_num: complaint.complaint_id,
        title: 'Staff Update on Grievance',
        message: `${updated_by_name || 'Staff'}: ${String(note).trim().slice(0, 100)}`,
        type: 'staff_update',
      });
    }

    saveDatabase(db);
    broadcastChange('COMPLAINT_UPDATED', complaint);

    return res.status(201).json(updateEntry);
  });

  // Simple image upload handler
  app.post('/api/upload', (req, res) => {
    const { image_base64, filename } = req.body;
    if (!image_base64) {
      return res.status(400).json({ error: 'No image data provided' });
    }
    return res.json({
      url: image_base64,
      filename: filename || 'campus_evidence.jpg',
    });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Vite Middleware for development & Production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Campus Service Management Platform running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
