import React, { useState } from 'react';
import { Search, Filter, Plus, ChevronRight, Calendar, Building2, EyeOff } from 'lucide-react';
import { Complaint, ComplaintStatus } from '../../types';
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES } from '../../lib/constants';
import { StatusBadge, PriorityBadge } from '../common/Badge';

interface MyComplaintsProps {
  complaints: Complaint[];
  onSelectComplaint: (complaintId: string) => void;
  onRaiseNew: () => void;
}

export const MyComplaints: React.FC<MyComplaintsProps> = ({
  complaints,
  onSelectComplaint,
  onRaiseNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filtered = complaints.filter((c) => {
    const q = (searchTerm || '').trim().toLowerCase();
    const matchesSearch =
      !q ||
      (c.complaint_id && c.complaint_id.toLowerCase().includes(q)) ||
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q));

    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-5 pb-16">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Complaints</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track and monitor the status of all grievances lodged under your account
          </p>
        </div>
        <button
          onClick={onRaiseNew}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-semibold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Raise New Complaint</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="search-my-complaints-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, keyword, title..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            id="filter-my-complaints-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="All">All Statuses ({complaints.length})</option>
            {COMPLAINT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s} ({complaints.filter((c) => c.status === s).length})
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            id="filter-my-complaints-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="All">All Categories</option>
            {COMPLAINT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Complaints List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-2xs">
          <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No matching complaints</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search terms or filters above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              id={`complaint-item-${item.complaint_id}`}
              onClick={() => onSelectComplaint(item.id)}
              className="bg-white rounded-2xl border border-slate-200 hover:border-primary-border hover:shadow-xs p-4 sm:p-5 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {item.complaint_id}
                  </span>
                  <span className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  <PriorityBadge priority={item.priority} />
                  {item.identity_mode === 'anonymous' && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      <EyeOff className="w-3 h-3 text-slate-400" />
                      Anonymous
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {item.department_name && (
                    <span className="flex items-center gap-1 text-slate-500 truncate">
                      <Building2 className="w-3.5 h-3.5" />
                      {item.department_name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                <StatusBadge status={item.status} size="md" />
                <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-primary-light text-slate-400 group-hover:text-primary flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
