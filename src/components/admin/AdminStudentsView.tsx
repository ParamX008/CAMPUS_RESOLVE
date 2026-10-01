import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  AlertTriangle,
  UserX,
  UserCheck,
  Clock,
  Calendar,
  Lock,
  Unlock,
  Building,
  Mail,
  Phone,
} from 'lucide-react';
import { Profile } from '../../types';
import { api } from '../../lib/api';

interface AdminStudentsViewProps {
  onBack?: () => void;
}

export const AdminStudentsView: React.FC<AdminStudentsViewProps> = ({ onBack }) => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRestriction, setFilterRestriction] = useState<'all' | 'restricted' | 'active'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [modalStudent, setModalStudent] = useState<Profile | null>(null);
  const [restrictionReason, setRestrictionReason] = useState('Submitting repeated false/spam grievances');
  const [restrictionDays, setRestrictionDays] = useState(7);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminStudents();
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleToggleRestriction = async (student: Profile, action: 'restrict' | 'unrestrict') => {
    setActionLoading(student.account_id);
    try {
      await api.restrictStudent(
        student.account_id,
        action,
        action === 'restrict' ? restrictionDays : undefined,
        action === 'restrict' ? restrictionReason : undefined
      );
      await fetchStudents();
      setModalStudent(null);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = (searchTerm || '').trim().toLowerCase();
    const matchesSearch =
      !q ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.account_id && s.account_id.toLowerCase().includes(q)) ||
      (s.student_id && s.student_id.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.phone && s.phone.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q));

    const matchesFilter =
      filterRestriction === 'all' ||
      (filterRestriction === 'restricted' && s.is_restricted) ||
      (filterRestriction === 'active' && !s.is_restricted);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                Institutional User Directory
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-mono font-medium text-slate-600">
                {students.length} Student Profiles
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Student Accounts & Policy Compliance
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Inspect student standing, monitor disciplinary warnings, and manage grievance submission privileges.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student by name, student ID, department..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterRestriction}
            onChange={(e) => setFilterRestriction(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium"
          >
            <option value="all">All Account Standings</option>
            <option value="active">Active (Good Standing)</option>
            <option value="restricted">Restricted Accounts</option>
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Student ID & Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Warnings</th>
                <th className="py-3 px-4">Privilege Status</th>
                <th className="py-3 px-4 text-right">Policy Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((stu) => {
                const isRestricted = !!stu.is_restricted;
                return (
                  <tr key={stu.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* ID & Name */}
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs uppercase shrink-0">
                          {stu.name.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{stu.name}</p>
                          <span className="font-mono text-[11px] text-slate-500">
                            {stu.account_id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 text-slate-700">
                      {stu.department || 'General Campus'}
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1 text-[11px]">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className={stu.email ? '' : 'italic text-slate-400'}>
                            {stu.email || 'No email on file'}
                          </span>
                        </p>
                        {stu.phone && (
                          <p className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{stu.phone}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Warnings */}
                    <td className="py-3.5 px-4">
                      {stu.warnings_count && stu.warnings_count > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="w-3 h-3" />
                          {stu.warnings_count} Warning{stu.warnings_count > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">0 Warnings</span>
                      )}
                    </td>

                    {/* Privilege Status */}
                    <td className="py-3.5 px-4">
                      {isRestricted ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <Lock className="w-3 h-3" />
                            Submissions Restricted
                          </span>
                          {stu.restricted_until && (
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Until {new Date(stu.restricted_until).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <ShieldCheck className="w-3 h-3" />
                          Active (Good Standing)
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {isRestricted ? (
                        <button
                          onClick={() => handleToggleRestriction(stu, 'unrestrict')}
                          disabled={actionLoading === stu.account_id}
                          className="px-3 py-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold shadow-2xs transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Lifting Restriction</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setModalStudent(stu)}
                          className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-700 text-xs font-semibold shadow-2xs transition-colors inline-flex items-center gap-1"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Restrict Account</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Restriction Modal */}
      {modalStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Restrict Submissions for {modalStudent.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">ID: {modalStudent.account_id}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Restriction Duration (Days)
              </label>
              <select
                value={restrictionDays}
                onChange={(e) => setRestrictionDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
              >
                <option value={3}>3 Days (Minor)</option>
                <option value={7}>7 Days (Standard)</option>
                <option value={14}>14 Days (Extended)</option>
                <option value={30}>30 Days (Suspension)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mandatory Rationale
              </label>
              <textarea
                rows={2}
                value={restrictionReason}
                onChange={(e) => setRestrictionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalStudent(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleRestriction(modalStudent, 'restrict')}
                disabled={actionLoading === modalStudent.account_id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Confirm Restriction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
