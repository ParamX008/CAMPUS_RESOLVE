import React from 'react';
import { Building2, ArrowLeft, Layers, ShieldCheck, ChevronRight } from 'lucide-react';
import { Department, Complaint } from '../../types';

interface AdminDepartmentsViewProps {
  departments: Department[];
  complaints: Complaint[];
  onBack: () => void;
  onFilterByDept: (deptId: string) => void;
}

export const AdminDepartmentsView: React.FC<AdminDepartmentsViewProps> = ({
  departments,
  complaints,
  onBack,
  onFilterByDept,
}) => {
  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 pastel-indigo rounded-xl border border-indigo-200">
            <Building2 className="w-5 h-5 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Campus Service Departments</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Overview of all 8 administrative divisions and active workload distribution
            </p>
          </div>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((dept) => {
          const deptComplaints = complaints.filter((c) => c.department_id === dept.id);
          const pendingCount = deptComplaints.filter((c) => c.status === 'Pending').length;
          const inProgressCount = deptComplaints.filter((c) => c.status === 'In Progress' || c.status === 'Under Investigation').length;
          const resolvedCount = deptComplaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;

          return (
            <div
              key={dept.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {dept.name}
                  </h3>
                  <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700 shrink-0">
                    {deptComplaints.length} tickets
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {dept.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-amber-700 font-medium">
                    {pendingCount} Pending
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-blue-700 font-medium">
                    {inProgressCount} Active
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-700 font-medium">
                    {resolvedCount} Resolved
                  </span>
                </div>

                <button
                  onClick={() => onFilterByDept(dept.id)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 hover:underline"
                >
                  View Tickets
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
