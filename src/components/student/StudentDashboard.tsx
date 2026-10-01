import React, { useState } from 'react';
import {
  PlusCircle,
  ChevronRight,
  FolderOpen,
  Calendar,
} from 'lucide-react';
import { Complaint, DashboardStats, Profile } from '../../types';
import { StatusBadge } from '../common/Badge';
import {
  MaleStudentAvatarSVG,
  FemaleStudentAvatarSVG,
  getStudentGender,
} from '../common/StudentAvatar';

interface StudentDashboardProps {
  stats: DashboardStats;
  complaints: Complaint[];
  user: Profile;
  onNavigate: (tab: string) => void;
  onSelectComplaint: (complaintId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  complaints,
  user,
  onNavigate,
  onSelectComplaint,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'in_progress' | 'pending' | 'resolved'>('all');

  const filteredComplaints = complaints.filter((item) => {
    if (filterTab === 'all') return true;
    if (filterTab === 'in_progress') {
      return item.status === 'In Progress' || item.status === 'Under Investigation';
    }
    if (filterTab === 'pending') {
      return item.status === 'Pending';
    }
    if (filterTab === 'resolved') {
      return item.status === 'Resolved' || item.status === 'Closed';
    }
    return true;
  });

  const allCount = complaints.length;
  const inProgressCount = complaints.filter(
    (c) => c.status === 'In Progress' || c.status === 'Under Investigation'
  ).length;
  const pendingCount = complaints.filter((c) => c.status === 'Pending').length;
  const resolvedCount = complaints.filter(
    (c) => c.status === 'Resolved' || c.status === 'Closed'
  ).length;

  const studentGender = getStudentGender(user);

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 sm:pb-16 max-w-5xl mx-auto">
      {/* Clean Dashboard Header: Profile Welcome & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 sm:gap-4 pt-1.5 pb-1 sm:py-0">
        {/* Left: Dynamic Circular Avatar + Welcome Text */}
        <div className="flex items-center gap-3.5 sm:gap-4.5 min-w-0">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-xs ring-1 ring-slate-200/80 flex items-center justify-center select-none"
            aria-label={`${studentGender} student avatar`}
          >
            {studentGender === 'female' ? <FemaleStudentAvatarSVG /> : <MaleStudentAvatarSVG />}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight break-words leading-tight sm:leading-snug">
              Welcome — {user.name}
            </h1>
          </div>
        </div>

        {/* Mobile Raise Your Issue Button: Prominent, spacious touch target */}
        <div className="sm:hidden">
          <button
            id="student-raise-complaint-btn-mobile"
            onClick={() => onNavigate('raise-complaint')}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-semibold text-sm shadow-xs hover:shadow transition-all active:scale-[0.99] cursor-pointer min-h-[46px]"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Raise Your Issue</span>
          </button>
        </div>

        {/* Right: Independent Standalone Button on Desktop */}
        <button
          id="student-raise-complaint-btn"
          onClick={() => onNavigate('raise-complaint')}
          className="hidden sm:inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-semibold text-xs sm:text-sm shadow-sm hover:shadow transition-all shrink-0 active:scale-[0.99]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Raise Your Issue</span>
        </button>
      </div>

      {/* Main Complaints Feed Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-3.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">Your Submitted Complaints</h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-normal">
              Review what you have filed and check the current progress or resolution
            </p>
          </div>

          {/* Clean Segmented Filter Tabs: 2x2 grid on mobile, horizontal row on desktop */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 w-full sm:w-auto shrink-0">
            <button
              id="filter-tab-all"
              onClick={() => setFilterTab('all')}
              className={`w-full sm:w-auto text-center px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({allCount})
            </button>
            <button
              id="filter-tab-in-progress"
              onClick={() => setFilterTab('in_progress')}
              className={`w-full sm:w-auto text-center px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTab === 'in_progress'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              id="filter-tab-pending"
              onClick={() => setFilterTab('pending')}
              className={`w-full sm:w-auto text-center px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTab === 'pending'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              id="filter-tab-resolved"
              onClick={() => setFilterTab('resolved')}
              className={`w-full sm:w-auto text-center px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTab === 'resolved'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>
        </div>

        {/* Complaints List Cards */}
        {filteredComplaints.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <FolderOpen className="w-9 h-9 text-slate-300 mx-auto mb-2.5" />
            <h3 className="text-sm font-bold text-slate-800">
              {filterTab === 'resolved'
                ? 'No resolved complaints yet'
                : filterTab === 'in_progress'
                ? 'No complaints currently in progress'
                : filterTab === 'pending'
                ? 'No pending complaints'
                : 'No complaints submitted yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              {complaints.length === 0
                ? 'If you encounter any issue regarding campus facilities, canteen, hostel, or academics, submit a report here.'
                : `No complaints found with ${
                    filterTab === 'in_progress'
                      ? 'In Progress'
                      : filterTab === 'pending'
                      ? 'Pending'
                      : filterTab === 'resolved'
                      ? 'Resolved'
                      : ''
                  } status.`}
            </p>
            {complaints.length === 0 && (
              <button
                onClick={() => onNavigate('raise-complaint')}
                className="px-4 py-2 bg-primary hover:bg-primary-hover active:bg-primary-active text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Submit Your First Complaint</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredComplaints.map((item) => {
              const isResolved = item.status === 'Resolved' || item.status === 'Closed';
              return (
                <div
                  key={item.id}
                  id={`student-complaint-${item.complaint_id}`}
                  onClick={() => onSelectComplaint(item.id)}
                  className={`group p-4 sm:p-4.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${
                    isResolved
                      ? 'bg-emerald-50/15 border-emerald-200/70 hover:border-emerald-300 hover:bg-emerald-50/30'
                      : 'bg-white border-slate-200 hover:border-primary-border hover:bg-primary-light/30'
                  }`}
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* TOP: Complaint ID + Category */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {item.complaint_id}
                      </span>
                      <span className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                    </div>

                    {/* MIDDLE: Title */}
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors leading-snug">
                      {item.title}
                    </h3>

                    {/* BOTTOM: Date Submitted */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* RIGHT: Status Badge + Click Indicator Arrow */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <StatusBadge status={item.status} size="md" />
                    <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-primary-light text-slate-400 group-hover:text-primary flex items-center justify-center transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
