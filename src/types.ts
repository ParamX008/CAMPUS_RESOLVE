export type UserRole = 'student' | 'admin';
export type AdminSubRole = 'super_admin' | 'department_staff';

export type ComplaintCategory =
  | 'Safety & Security'
  | 'Ragging & Harassment'
  | 'Academic'
  | 'Infrastructure'
  | 'Cleanliness & Sanitation'
  | 'Food & Canteen'
  | 'Hostel & Accommodation'
  | 'Transport & Other Services'
  | 'Other';

export type ComplaintStatus =
  | 'Pending'
  | 'In Progress'
  | 'Under Investigation'
  | 'Resolved'
  | 'Closed';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type IdentityMode = 'identified' | 'anonymous';

export type AbuseReviewStatus =
  | 'None'
  | 'Review Required'
  | 'Verified Legitimate'
  | 'Verified False';

export interface Profile {
  id: string;
  auth_user_id: string;
  account_id: string; // e.g. SKF7A2Q9 (Student) or ADMSKF01 (Admin)
  roll_number?: string; // e.g. 25300123055
  student_id?: string; // Authoritative 8-character ID e.g. SKF7A2Q9
  anonymous_reporter_id?: string; // Permanent anonymous reporter ID e.g. AN-7K4P9X2M
  university?: string;
  name: string;
  full_name?: string;
  gender?: 'male' | 'female' | 'other';
  role: UserRole;
  admin_role?: AdminSubRole;
  phone: string;
  phone_number?: string;
  date_of_birth: string;
  email?: string | null;
  department?: string;
  created_at: string;
  updated_at?: string;
  must_change_password?: boolean;
  password_changed?: boolean;
  is_active?: boolean;
  // Student Abuse History Tracking
  total_complaints?: number;
  verified_false_complaints?: number;
  warnings_count?: number;
  is_restricted?: boolean;
  restriction_start_date?: string | null;
  restriction_end_date?: string | null;
  restriction_reason?: string | null;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  complaint_count?: number;
}

export interface ComplaintAttachment {
  id: string;
  complaint_id: string;
  storage_path: string;
  original_file_name: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
  url: string;
}

export interface ComplaintUpdate {
  id: string;
  complaint_id: string;
  status: ComplaintStatus;
  previous_status?: ComplaintStatus | null;
  note: string;
  updated_by: string; // Admin Name, Student Name, or System
  is_internal?: boolean;
  action?: string;
  created_at: string;
}

export type AIProcessingStatus = 'Pending' | 'Processed' | 'Failed' | 'Requires Review';

export interface Complaint {
  id: string;
  complaint_id: string; // e.g. CMP-1001
  student_id: string; // Verified Internal Student ID (e.g. SKF7A2Q9)
  student_name?: string; // Stored name
  displayName?: string; // "Anonymous Student" or verified name based on mode & viewer role
  anonymous_reporter_id?: string | null;
  is_anonymous?: boolean;
  category: string;
  title: string;
  description: string;
  image_url?: string | null;
  attachments?: ComplaintAttachment[];
  identity_mode: IdentityMode;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  department_id?: string | null;
  department_name?: string | null;
  // Assignment details
  assigned_to?: string | null;
  assigned_by?: string | null;
  assigned_at?: string | null;
  // Investigation details
  investigation_notes?: string | null;
  investigator_name?: string | null;
  investigated_at?: string | null;
  // Resolution details
  resolution_notes?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
  student_archived?: boolean;
  archived_at?: string | null;
  updates?: ComplaintUpdate[];
  // AI fields for Gemini Complaint Processing
  ai_status?: AIProcessingStatus;
  ai_title?: string | null;
  ai_summary?: string | null;
  ai_category_detected?: string | null;
  ai_priority_detected?: ComplaintPriority | null;
  ai_recommended_department?: string | null;
  ai_confidence?: number | null;
  ai_safety_flag?: boolean | null;
  ai_safety_type?: string | null;
  ai_reasoning?: string | null;
  ai_processed_at?: string | null;
  ai_overridden?: boolean | null;
  // False Complaint / Abuse Prevention
  abuse_flag?: boolean | null;
  abuse_reason?: string | null;
  abuse_review_status?: AbuseReviewStatus;
  // Resolution Feedback
  feedback_rating?: number | null; // 1 to 5
  feedback_comment?: string | null;
  feedback_submitted_at?: string | null;
  // Super Admin Audited Unmasking
  is_unmasked?: boolean;
  unmasked_by?: string | null;
  unmasked_at?: string | null;
  unmask_reason?: string | null;
}

export interface AppNotification {
  id: string;
  user_id: string; // account_id
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

export interface DashboardStats {
  total: number;
  pending: number;
  in_progress: number;
  under_investigation: number;
  resolved: number;
  closed: number;
  safety_count?: number;
  abuse_review_count?: number;
}

export interface AnalyticsData {
  total_complaints: number;
  pending_complaints?: number;
  in_progress_complaints?: number;
  under_investigation_complaints?: number;
  resolved_complaints: number;
  closed_complaints?: number;
  open_complaints: number;
  safety_flagged_count?: number;
  safety_complaints_count?: number;
  abuse_flagged_count?: number;
  resolution_rate_percent?: number;
  avg_resolution_time_hours?: number;
  avg_resolution_hours?: number;
  average_rating?: number;
  avg_satisfaction_rating?: number;
  total_feedback_count?: number;

  categories?: Record<string, number>;
  departments?: Record<string, number>;
  priorities?: Record<string, number>;
  statuses?: Record<string, number>;

  by_category?: { name?: string; category?: string; count: number; percentage?: number }[];
  by_department?: { id?: string; name?: string; department?: string; count: number; resolved?: number }[];
  by_priority?: { priority: string; count: number }[];
  by_status?: { status: string; count: number }[];
  monthly_trend?: { month: string; total: number; resolved: number; safety?: number }[];
  timeline?: { date: string; count: number; resolved?: number }[];
  rating_distribution?: { stars: string; count: number }[];
  feedback_distribution?: { rating: number; count: number }[];

  summary?: {
    total_complaints: number;
    pending_complaints: number;
    in_progress_complaints: number;
    under_investigation_complaints: number;
    resolved_complaints: number;
    closed_complaints: number;
    open_complaints: number;
    safety_alerts: number;
    avg_resolution_hours: number;
    avg_satisfaction_rating: number;
    total_warnings: number;
    total_restricted_students: number;
    verified_false_complaints: number;
    pending_abuse_reviews: number;
    resolution_rate_percent?: number;
    total_feedback_count?: number;
  };
}

export interface AuthSession {
  user: Profile;
  token: string;
}

