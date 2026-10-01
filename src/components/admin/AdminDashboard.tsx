import React, { useState } from 'react';
import {
  Search,
  Eye,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Shield,
  ShieldAlert,
  BarChart3,
  Users,
  Star,
} from 'lucide-react';
import { Complaint, DashboardStats, Department, Profile, ComplaintStatus } from '../../types';
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES, COMPLAINT_PRIORITIES } from '../../lib/constants';
import { StatusBadge, PriorityBadge, AbuseBadge, IdentityBadge, StarRating } from '../common/Badge';

interface AdminDashboardProps {
  stats: DashboardStats;
  complaints: Complaint[];
  departments: Department[];
  user: Profile;
  onSelectComplaint: (id: string) => void;
  onQuickUpdateStatus: (id: string, newStatus: ComplaintStatus) => Promise<void>;
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  complaints,
  departments,
  user,
  onSelectComplaint,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [specialFilter, setSpecialFilter] = useState<'all' | 'abuse' | 'safety' | 'feedback'>('all');

  const filteredComplaints = complaints.filter((c) => {
    const q = (searchTerm || '').trim().toLowerCase();
    const matchesSearch =
      !q ||
      (c.complaint_id && c.complaint_id.toLowerCase().includes(q)) ||
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q)) ||
      (c.student_name && c.student_name.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;
    const matchesPriority = priorityFilter === 'All' || c.priority === priorityFilter;
    const matchesDept =
      departmentFilter === 'All' ||
      c.department_id === departmentFilter ||
      (departmentFilter === 'unassigned' && !c.department_id);

    const matchesSpecial =
      specialFilter === 'all' ||
      (specialFilter === 'abuse' && (c.ai_abuse_flag || c.abuse_status === 'Review Required')) ||
      (specialFilter === 'safety' && c.ai_safety_flag) ||
      (specialFilter === 'feedback' && c.feedback_rating !== undefined && c.feedback_rating !== null);

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority && matchesDept && matchesSpecial;
  });

  const abuseCount = complaints.filter(
    (c) => c.ai_abuse_flag || c.abuse_status === 'Review Required'
  ).length;

  const safetyCount = complaints.filter((c) => c.ai_safety_flag).length;

  const hasActiveFilters =
    statusFilter !== 'All' ||
    categoryFilter !== 'All' ||
    departmentFilter !== 'All' ||
    priorityFilter !== 'All' ||
    specialFilter !== 'all' ||
    Boolean(searchTerm.trim());

  const handleResetFilters = () => {
    setStatusFilter('All');
    setCategoryFilter('All');
    setDepartmentFilter('All');
    setPriorityFilter('All');
    setSpecialFilter('all');
    setSearchTerm('');
  };

  const statCards: Array<{
    key: string;
    label: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
    filterStatus: string;
    indicatorDot: string;
  }> = [
    {
      key: 'total',
      label: 'Total',
      count: stats.total,
      icon: FolderOpen,
      filterStatus: 'All',
      indicatorDot: 'bg-slate-700',
    },
    {
      key: 'pending',
      label: 'Pending',
      count: stats.pending,
      icon: Clock,
      filterStatus: 'Pending',
      indicatorDot: 'bg-amber-500',
    },
    {
      key: 'in_progress',
      label: 'In Progress',
      count: stats.in_progress,
      icon: AlertCircle,
      filterStatus: 'In Progress',
      indicatorDot: 'bg-blue-500',
    },
    {
      key: 'under_investigation',
      label: 'Investigating',
      count: stats.under_investigation,
      icon: Search,
      filterStatus: 'Under Investigation',
      indicatorDot: 'bg-sky-500',
    },
    {
      key: 'resolved',
      label: 'Resolved',
      count: stats.resolved,
      icon: CheckCircle2,
      filterStatus: 'Resolved',
      indicatorDot: 'bg-emerald-500',
    },
    {
      key: 'closed',
      label: 'Closed',
      count: stats.closed,
      icon: Shield,
      filterStatus: 'Closed',
      indicatorDot: 'bg-slate-400',
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 pb-16">
      {/* 1. Main Admin Overview & Quick Actions Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Administrative Operations &amp; Governance
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-mono font-medium text-[#64748B] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                ID: {user.account_id} ({user.role})
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
              Campus Grievance Triage Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-2xl">
              Review incoming student tickets, assign departments, conduct abuse reviews, and monitor AI triage.
            </p>
          </div>

          {/* Quick Actions in consistent desktop-first horizontal group */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('admin-analytics')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#E2E8F0] hover:border-slate-300 hover:bg-slate-50 text-[#111827] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => onNavigate('admin-students')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#E2E8F0] hover:border-slate-300 hover:bg-slate-50 text-[#111827] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Students</span>
            </button>

            <button
              onClick={() => onNavigate('admin-departments')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#E2E8F0] hover:border-slate-300 hover:bg-slate-50 text-[#111827] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Departments ({departments.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Compact 6 Statistics Cards in Responsive Desktop Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((card) => {
          const isSelected = statusFilter === card.filterStatus;
          const Icon = card.icon;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setStatusFilter(card.filterStatus)}
              className={`group text-left p-4 sm:p-4.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-h-[105px] ${
                isSelected
                  ? 'bg-red-50/20 border-[#E21B23] ring-2 ring-[#E21B23] shadow-xs'
                  : 'bg-white border-[#E2E8F0] hover:border-slate-300 hover:shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${card.indicatorDot}`} />
                  {card.label}
                </span>
                <Icon
                  className={`w-4 h-4 ${
                    isSelected ? 'text-[#E21B23]' : 'text-slate-400 group-hover:text-slate-600'
                  } transition-colors`}
                />
              </div>
              <div className="mt-3 flex items-baseline justify-between w-full">
                <p className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
                  {card.count}
                </p>
                {isSelected && (
                  <span className="text-[10px] font-bold text-[#E21B23] uppercase tracking-wide">
                    Filtered
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Complaint Management Section: Tabs, Filters, and Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {/* Navigation Tabs and Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#111827]">Grievance Records &amp; Triage</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Filter and manage submitted student grievances across departments
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[#111827] font-mono">
                {filteredComplaints.length} showing
              </span>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-[#E21B23] hover:text-[#B5122A] px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Category / Queue Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSpecialFilter('all')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                specialFilter === 'all'
                  ? 'bg-[#E21B23] text-white shadow-2xs'
                  : 'bg-[#F8F9FA] text-[#111827] border border-[#E2E8F0] hover:bg-slate-100'
              }`}
            >
              All Grievances ({complaints.length})
            </button>

            <button
              onClick={() => setSpecialFilter('abuse')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                specialFilter === 'abuse'
                  ? 'bg-[#E21B23] text-white shadow-2xs'
                  : 'bg-[#F8F9FA] text-[#111827] border border-[#E2E8F0] hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Abuse Review Queue</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  specialFilter === 'abuse' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {abuseCount}
              </span>
            </button>

            <button
              onClick={() => setSpecialFilter('safety')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                specialFilter === 'safety'
                  ? 'bg-[#E21B23] text-white shadow-2xs'
                  : 'bg-[#F8F9FA] text-[#111827] border border-[#E2E8F0] hover:bg-slate-100'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Safety Alerts</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  specialFilter === 'safety' ? 'bg-white/20 text-white' : 'bg-red-100 text-[#E21B23]'
                }`}
              >
                {safetyCount}
              </span>
            </button>

            <button
              onClick={() => setSpecialFilter('feedback')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                specialFilter === 'feedback'
                  ? 'bg-[#E21B23] text-white shadow-2xs'
                  : 'bg-[#F8F9FA] text-[#111827] border border-[#E2E8F0] hover:bg-slate-100'
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  specialFilter === 'feedback'
                    ? 'fill-white text-white'
                    : 'text-amber-500 fill-amber-500'
                }`}
              />
              <span>Student Feedback</span>
            </button>
          </div>

          {/* Structured Search & Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {/* Row 1: Search field & Status */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                id="admin-search-complaints-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search complaint ID, student name, keyword..."
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#111827] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E21B23]/15 focus:border-[#E21B23] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <select
                id="admin-filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#E21B23]/15 focus:border-[#E21B23] transition-colors cursor-pointer"
              >
                <option value="All">All Statuses ({complaints.length})</option>
                {COMPLAINT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s} ({complaints.filter((c) => c.status === s).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Row 2: Category & Priority */}
            <div>
              <select
                id="admin-filter-category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#E21B23]/15 focus:border-[#E21B23] transition-colors cursor-pointer"
              >
                <option value="All">All Categories</option>
                {COMPLAINT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                id="admin-filter-priority"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#E21B23]/15 focus:border-[#E21B23] transition-colors cursor-pointer"
              >
                <option value="All">All Priorities</option>
                {COMPLAINT_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p} Priority
                  </option>
                ))}
              </select>
            </div>

            {/* Row 3: Department & Reset Button */}
            <div className="md:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <select
                  id="admin-filter-department"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#E21B23]/15 focus:border-[#E21B23] transition-colors truncate cursor-pointer"
                >
                  <option value="All">All Departments</option>
                  <option value="unassigned">Unassigned</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="h-10 px-4 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-[#E21B23] text-xs font-semibold transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop-First Complaint Table / Work Area */}
        {filteredComplaints.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <FolderOpen className="w-6 h-6 stroke-[1.8]" />
            </div>
            <h3 className="text-sm font-bold text-[#111827]">
              {complaints.length === 0 ? 'No complaints to review' : 'No complaints matching the criteria'}
            </h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
              {complaints.length === 0
                ? 'New student complaints will appear here.'
                : 'Try adjusting or resetting your search, status, or department filters.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="mt-3.5 px-3 py-1.5 text-xs font-semibold text-[#E21B23] bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#E2E8F0] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4 whitespace-nowrap">Complaint ID</th>
                  <th className="py-3 px-4 min-w-[200px]">Issue / Title</th>
                  <th className="py-3 px-4 whitespace-nowrap">Student / Identity</th>
                  <th className="py-3 px-4 whitespace-nowrap">Category</th>
                  <th className="py-3 px-4 whitespace-nowrap">Department</th>
                  <th className="py-3 px-4 whitespace-nowrap">Priority</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 whitespace-nowrap">Submitted</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-xs">
                {filteredComplaints.map((item) => {
                  return (
                    <tr
                      key={item.id}
                      id={`admin-row-${item.complaint_id}`}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onSelectComplaint(item.id)}
                    >
                      {/* Complaint ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#111827] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {item.ai_safety_flag && (
                            <span
                              title={`Safety Alert: ${item.ai_safety_type || 'Hazard Detected'}`}
                              className="p-1 bg-red-100 text-[#E21B23] rounded-md animate-pulse"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <span>{item.complaint_id}</span>
                        </div>
                      </td>

                      {/* Issue / Title */}
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-sm">
                        <div className="font-semibold text-[#111827] group-hover:text-[#E21B23] transition-colors truncate flex items-center gap-1.5">
                          <span>{item.title}</span>
                          {item.ai_confidence && (
                            <span className="text-[10px] text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded font-mono shrink-0">
                              AI {Math.round(item.ai_confidence * 100)}%
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#64748B] truncate max-w-sm mt-0.5">
                          {item.ai_summary || item.description}
                        </div>
                        {item.abuse_status && item.abuse_status !== 'None' && (
                          <div className="mt-1">
                            <AbuseBadge status={item.abuse_status} />
                          </div>
                        )}
                      </td>

                      {/* Student / Anonymous Identity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <IdentityBadge
                          mode={item.identity_mode}
                          studentName={item.student_name}
                          isUnmasked={item.is_unmasked}
                        />
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-medium text-[#111827] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded text-[11px]">
                          {item.category}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-[11px] font-medium ${
                            item.department_name && item.department_name !== 'Unassigned'
                              ? 'text-[#111827]'
                              : 'text-amber-700 italic'
                          }`}
                        >
                          {item.department_name || 'Unassigned'}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <PriorityBadge priority={item.priority} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <StatusBadge status={item.status} size="sm" />
                          {item.feedback_rating && (
                            <div className="flex items-center gap-1">
                              <StarRating rating={item.feedback_rating} size="sm" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3.5 px-4 text-[#64748B] whitespace-nowrap text-[11px]">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectComplaint(item.id);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-red-50 hover:border-red-200 hover:text-[#E21B23] text-[#111827] text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#E21B23]" />
                          <span>Triage</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
