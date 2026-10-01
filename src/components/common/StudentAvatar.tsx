import React from 'react';
import { Profile } from '../../types';

// Professional, friendly vector illustration for Male student
export const MaleStudentAvatarSVG: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Clean soft background */}
    <circle cx="32" cy="32" r="32" fill="#DBEAFE" />
    {/* Torso / College Jacket */}
    <path d="M14 64C14 53 22 47 32 47C42 47 50 53 50 64" fill="#2563EB" />
    <path d="M27 47L32 54L37 47" fill="#FFFFFF" />
    <path d="M29 47L32 51L35 47" fill="#93C5FD" />
    {/* Neck */}
    <rect x="28.5" y="38" width="7" height="9" rx="2.5" fill="#FDBA74" />
    {/* Ears */}
    <circle cx="20.5" cy="32.5" r="3" fill="#FDBA74" />
    <circle cx="43.5" cy="32.5" r="3" fill="#FDBA74" />
    {/* Head / Face */}
    <path d="M21 28C21 21.9 25.9 17 32 17C38.1 17 43 21.9 43 28C43 35 38 41 32 41C26 41 21 35 21 28Z" fill="#FED7AA" />
    {/* Hair: Modern clean side-swept short crop */}
    <path d="M19 25C19 17.5 24.5 13 32 13C39.5 13 45 17.5 45 24.5C45 26.5 44 28 43 28C42 25 40 22 36.5 22C33 22 32.5 24 29 23.5C25.5 23 23 25 21 28C20 28 19 26.8 19 25Z" fill="#1E293B" />
    {/* Eyebrows */}
    <path d="M25 25.5C26.5 24.8 28.5 25 29.5 25.8" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M34.5 25.8C35.5 25 37.5 24.8 39 25.5" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round" />
    {/* Eyes */}
    <circle cx="27.5" cy="29" r="1.5" fill="#0F172A" />
    <circle cx="36.5" cy="29" r="1.5" fill="#0F172A" />
    {/* Friendly Smile */}
    <path d="M28.5 34.5C29.8 36.5 34.2 36.5 35.5 34.5" stroke="#C2410C" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// Professional, friendly vector illustration for Female student
export const FemaleStudentAvatarSVG: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Clean soft background */}
    <circle cx="32" cy="32" r="32" fill="#EDE9FE" />
    {/* Back hair volume */}
    <path d="M17 30C17 19 23 13 32 13C41 13 47 19 47 30C47 43 45 52 43 54C39 48 39 36 39 36H25C25 36 25 48 21 54C19 52 17 43 17 30Z" fill="#1E293B" />
    {/* Torso / College Sweater & Inner Collar */}
    <path d="M15 64C15 54 22 48 32 48C42 48 49 54 49 64" fill="#6366F1" />
    <path d="M28 48C28 52 32 55 32 55C32 55 36 52 36 48" fill="#FDBA74" />
    <path d="M26 48C28 53 32 56 32 56C32 56 36 53 38 48" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    {/* Neck */}
    <rect x="29" y="38" width="6" height="9" rx="2.5" fill="#FDBA74" />
    {/* Ears & Subtle Stud Earrings */}
    <circle cx="21" cy="32" r="2.8" fill="#FDBA74" />
    <circle cx="43" cy="32" r="2.8" fill="#FDBA74" />
    <circle cx="21" cy="34" r="1.1" fill="#F59E0B" />
    <circle cx="43" cy="34" r="1.1" fill="#F59E0B" />
    {/* Head / Face */}
    <path d="M22 28.5C22 22.8 26.5 18 32 18C37.5 18 42 22.8 42 28.5C42 35 37.5 40.5 32 40.5C26.5 40.5 22 35 22 28.5Z" fill="#FED7AA" />
    {/* Front Hair / Modern Framed Cut */}
    <path d="M20 25C21 17.5 26 13 32 13C38 13 44 17.5 44 24C44 26 43 27 41 24C39 20 35 19 32 20C27 21 24 24 21 28C20.3 27.5 20 26.3 20 25Z" fill="#1E293B" />
    <path d="M42 24C43 27 43 32 41 35C40 33 40 28 41 25" fill="#1E293B" />
    <path d="M22 24C21 27 21 32 23 35C24 33 24 28 23 25" fill="#1E293B" />
    {/* Eyebrows */}
    <path d="M25 25.5C26.2 24.8 28 24.8 29.2 25.5" stroke="#1E293B" strokeWidth="1.1" strokeLinecap="round" />
    <path d="M34.8 25.5C36 24.8 37.8 24.8 39 25.5" stroke="#1E293B" strokeWidth="1.1" strokeLinecap="round" />
    {/* Eyes */}
    <circle cx="27.5" cy="29" r="1.4" fill="#0F172A" />
    <circle cx="36.5" cy="29" r="1.4" fill="#0F172A" />
    {/* Friendly Smile */}
    <path d="M29 34.5C30.2 36.3 33.8 36.3 35 34.5" stroke="#C2410C" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// Determine whether student is male or female based on profile data
export const getStudentGender = (user: Profile): 'male' | 'female' => {
  const explicit = ((user as any).gender || (user as any).sex || '').toString().trim().toLowerCase();
  if (explicit === 'female' || explicit === 'f' || explicit === 'woman' || explicit === 'girl') {
    return 'female';
  }
  if (explicit === 'male' || explicit === 'm' || explicit === 'man' || explicit === 'boy') {
    return 'male';
  }

  // Student ID / Account ID mappings for seeded students from CSV
  if (user.student_id === 'SKF7A2Q7' || user.account_id === 'SKF7A2Q7') return 'female'; // Prerona Sinha Roy
  if (user.student_id === 'SKF7A2Q8' || user.account_id === 'SKF7A2Q8') return 'female'; // Tamali Singha Roy
  if (user.student_id === 'SKF7A2Q9' || user.account_id === 'SKF7A2Q9') return 'male';   // Parambrata Kanjilal
  if (user.student_id === 'SKF7A2Q6' || user.account_id === 'SKF7A2Q6') return 'male';   // Pritam Das

  // First name heuristic for dynamic users
  const firstName = (user.name || '').trim().split(' ')[0].toLowerCase();
  const femaleNames = new Set([
    'maya', 'sarah', 'sara', 'elena', 'emily', 'emma', 'olivia', 'sophia', 'priya',
    'ananya', 'sneha', 'pooja', 'neha', 'divya', 'rhea', 'tanvi', 'isabella', 'mia',
    'charlotte', 'amelia', 'harper', 'evelyn', 'abigail', 'elizabeth', 'sofia',
    'chloe', 'grace', 'zoe', 'zoey', 'hannah', 'lily', 'claire', 'anna', 'samantha',
    'maria', 'jessica', 'ashley', 'fatima', 'aisha', 'maryam', 'noor'
  ]);

  if (femaleNames.has(firstName)) {
    return 'female';
  }

  return 'male';
};
