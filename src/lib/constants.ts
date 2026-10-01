import { Department, ComplaintCategory, ComplaintStatus, ComplaintPriority } from '../types';

export const COMPLAINT_CATEGORIES = [
  'Safety & Security',
  'Ragging & Harassment',
  'Academic',
  'Infrastructure',
  'Cleanliness & Sanitation',
  'Food & Canteen',
  'Hostel & Accommodation',
  'Transport & Other Services',
  'Other',
] as const;

export const COMPLAINT_STATUSES: ComplaintStatus[] = [
  'Pending',
  'In Progress',
  'Under Investigation',
  'Resolved',
  'Closed',
];

export const COMPLAINT_PRIORITIES: ComplaintPriority[] = [
  'Low',
  'Medium',
  'High',
  'Urgent',
];

export const INITIAL_DEPARTMENTS: Omit<Department, 'complaint_count'>[] = [
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

export const DEMO_STUDENT = {
  account_id: 'SKF7A2Q9',
  student_id: 'SKF7A2Q9',
  roll_number: '25300123055',
  password: '15062004',
  name: 'Parambrata Kanjilal',
  role: 'student' as const,
  phone: '+918697633925',
  phone_number: '+918697633925',
  date_of_birth: '2004-06-15',
  gender: 'male' as const,
  email: null,
  department: 'CSE',
  university: 'Supreme knowledge Foundation',
  anonymous_reporter_id: 'AN-CQ2XADRH',
};
