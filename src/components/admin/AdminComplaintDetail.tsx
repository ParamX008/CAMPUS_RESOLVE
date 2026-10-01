import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Building2,
  Clock,
  Shield,
  EyeOff,
  User,
  CheckCircle2,
  FileText,
  MessageSquarePlus,
  Send,
  AlertTriangle,
  ZoomIn,
  Edit3,
  Sparkles,
  RefreshCw,
  Cpu,
  Check,
  AlertOctagon,
  HelpCircle,
  ShieldAlert,
  Eye,
  Star,
  Lock,
} from 'lucide-react';
import { Complaint, Department, Profile, ComplaintStatus, ComplaintPriority } from '../../types';
import { COMPLAINT_STATUSES, COMPLAINT_PRIORITIES, COMPLAINT_CATEGORIES } from '../../lib/constants';
import { StatusBadge, PriorityBadge, AbuseBadge, StarRating } from '../common/Badge';
import { AbuseManagementModal } from './AbuseManagementModal';
import { UnmaskIdentityModal } from './UnmaskIdentityModal';

interface AdminComplaintDetailProps {
  complaint: Complaint;
  departments: Department[];
  user: Profile;
  onBack: () => void;
  onUpdateComplaint: (payload: {
    status?: ComplaintStatus;
    department_id?: string | null;
    priority?: ComplaintPriority;
    category?: string;
    note?: string;
  }) => Promise<void>;
  onReanalyze?: () => Promise<void>;
  onComplaintUpdated?: (updated: Complaint) => void;
  isLoading: boolean;
  isReanalyzing?: boolean;
}

export const AdminComplaintDetail: React.FC<AdminComplaintDetailProps> = ({
  complaint: initialComplaint,
  departments,
  user,
  onBack,
  onUpdateComplaint,
  onReanalyze,
  onComplaintUpdated,
  isLoading,
  isReanalyzing = false,
}) => {
  const [complaint, setComplaint] = useState<Complaint>(initialComplaint);
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>(complaint.status);
  const [selectedDepartment, setSelectedDepartment] = useState<string>(complaint.department_id || '');
  const [selectedPriority, setSelectedPriority] = useState<ComplaintPriority>(complaint.priority);
  const [selectedCategory, setSelectedCategory] = useState<string>(complaint.category);
  const [noteText, setNoteText] = useState('');
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  // Modals
  const [isAbuseModalOpen, setIsAbuseModalOpen] = useState(false);
  const [isUnmaskModalOpen, setIsUnmaskModalOpen] = useState(false);

  // Sync state if prop changes
  React.useEffect(() => {
    setComplaint(initialComplaint);
    setSelectedStatus(initialComplaint.status);
    setSelectedDepartment(initialComplaint.department_id || '');
    setSelectedPriority(initialComplaint.priority);
    setSelectedCategory(initialComplaint.category);
  }, [initialComplaint]);

  const handleAbuseSuccess = (updated: Complaint) => {
    setComplaint(updated);
    if (onComplaintUpdated) onComplaintUpdated(updated);
  };

  const handleUnmaskSuccess = (updated: Complaint) => {
    setComplaint(updated);
    if (onComplaintUpdated) onComplaintUpdated(updated);
  };

  const updates = complaint.updates || [];

  // Find department matching AI recommendation
  const aiRecDept = (complaint.ai_recommended_department || '').toLowerCase().trim();
  const aiMatchedDept = aiRecDept
    ? departments.find((d) => {
        const dName = (d.name || '').toLowerCase().trim();
        return dName === aiRecDept || dName.includes(aiRecDept) || aiRecDept.includes(dName);
      })
    : null;

  const handleApplyAiRecommendations = () => {
    if (aiMatchedDept) {
      setSelectedDepartment(aiMatchedDept.id);
    }
    if (complaint.ai_priority_detected) {
      setSelectedPriority(complaint.ai_priority_detected as ComplaintPriority);
    }
    if (complaint.ai_category_detected) {
      setSelectedCategory(complaint.ai_category_detected);
    }
  };

  const handleSaveTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateComplaint({
      status: selectedStatus,
      department_id: selectedDepartment || null,
      priority: selectedPriority,
      category: selectedCategory,
      note: noteText.trim() || undefined,
    });
    setNoteText('');
  };

  const confidencePercentage = complaint.ai_confidence
    ? Math.round(complaint.ai_confidence * 100)
    : null;

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-6">
      {/* Back button & ID */}
      <div className="flex items-center justify-between">
        <button
          id="admin-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Triage Table</span>
        </button>

        <div className="flex items-center gap-2">
          {complaint.ai_status && (
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl font-medium border ${
                complaint.ai_status === 'Processing'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-red-600" />
              <span>
                {complaint.ai_status === 'Processed'
                  ? 'Requires Review'
                  : complaint.ai_status}
              </span>
            </span>
          )}
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200">
            {complaint.complaint_id}
          </span>
          <StatusBadge status={complaint.status} size="md" />
        </div>
      </div>

      {/* Critical Safety / Anti-Ragging Alert Banner */}
      {complaint.ai_safety_flag && (
        <div
          id="admin-safety-alert-banner"
          className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm animate-pulse-subtle"
        >
          <div className="p-2 bg-red-100 rounded-xl text-red-600 shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-red-800 bg-red-200/80 px-2 py-0.5 rounded">
                High Priority Safety Alert
              </span>
              <span className="text-xs font-bold text-red-900">
                Threat Classification: {complaint.ai_safety_type || 'Safety & Well-being Hazard'}
              </span>
            </div>
            <p className="text-xs text-red-800 mt-1 leading-relaxed">
              Automated screening detected safety-critical keywords or hazard indicators in this student submission.
              Immediate intervention by Campus Security or Student Welfare is advised.
            </p>
          </div>
        </div>
      )}

      {/* Abuse / Policy Review Notification Banner */}
      {(complaint.ai_abuse_flag || complaint.abuse_status === 'Review Required' || complaint.abuse_status === 'Deliberately False') && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Policy & Abuse Review Flag
                </span>
                <AbuseBadge status={complaint.abuse_status || 'Review Required'} />
              </div>
              <p className="text-xs text-amber-950/80 leading-relaxed">
                {complaint.abuse_status === 'Deliberately False'
                  ? `Determined as deliberately false on ${new Date(complaint.abuse_reviewed_at || '').toLocaleDateString()} by ${complaint.abuse_reviewed_by}. Note: ${complaint.abuse_audit_note}`
                  : complaint.ai_abuse_reason
                  ? `AI Flagged: "${complaint.ai_abuse_reason}". Mandatory human administrative verification required.`
                  : 'This grievance has been flagged for institutional policy verification.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="admin-open-abuse-modal-btn"
            onClick={() => setIsAbuseModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all shrink-0 flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Conduct Abuse Review</span>
          </button>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Triage Insights, Complaint Content, Timeline, and Image */}
        <div className="lg:col-span-2 space-y-6">
          {/* Complaint Triage & Analysis Card */}
          <div
            id="complaint-triage-analysis-card"
            className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">
                      Complaint Triage & Analysis
                    </h2>
                    {complaint.ai_overridden && (
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                        Admin Overridden
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Automated classification and structured issue analysis
                  </p>
                </div>
              </div>

              {onReanalyze && (
                <button
                  id="admin-reanalyze-analysis-btn"
                  onClick={onReanalyze}
                  disabled={isReanalyzing || isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                  title="Run automated triage analysis again"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
                  <span>{isReanalyzing ? 'Analyzing...' : 'Re-run Analysis'}</span>
                </button>
              )}
            </div>

            {/* Summary Box */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  EXECUTIVE SUMMARY
                </label>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed shadow-2xs">
                  {complaint.ai_summary ? (
                    complaint.ai_summary.replace(/gemini\s*(?:ai|2\.5\s*flash)?/gi, 'automated triage')
                  ) : (
                    <span className="italic text-slate-400">Analysis pending or not generated.</span>
                  )}
                </div>
              </div>

              {/* 3-Column Metric Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* Detected Category */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    CATEGORY
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">
                      {complaint.ai_category_detected || complaint.category}
                    </span>
                    {complaint.ai_category_detected && complaint.ai_category_detected !== complaint.category && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        differs from student's '{complaint.category}'
                      </span>
                    )}
                  </div>
                </div>

                {/* Recommended Department */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    RECOMMENDED DEPARTMENT
                  </span>
                  <span className="text-xs font-bold text-red-700">
                    {complaint.ai_recommended_department || 'General Admin'}
                  </span>
                </div>

                {/* Confidence Level */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    CONFIDENCE
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-emerald-700">
                      {confidencePercentage !== null ? `${confidencePercentage}%` : 'N/A'}
                    </span>
                    {confidencePercentage !== null && (
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${confidencePercentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              {complaint.ai_reasoning && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 flex items-start gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <span className="font-semibold text-slate-900">Classification Reasoning: </span>
                    {complaint.ai_reasoning
                      .replace(/processed via gemini\s*(?:2\.5\s*flash)?/gi, 'automated triage')
                      .replace(/gemini\s*(?:ai|2\.5\s*flash)?\s*classification/gi, 'automated classification')
                      .replace(/gemini\s*(?:ai|2\.5\s*flash)?\s*detected/gi, 'automated triage detected')
                      .replace(/gemini\s*(?:ai|2\.5\s*flash)?/gi, 'automated triage')}
                  </p>
                </div>
              )}

              {/* Quick 1-Click Recommendation Apply Button */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  id="admin-apply-recommendations-btn"
                  onClick={handleApplyAiRecommendations}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Recommendations</span>
                </button>
              </div>
            </div>
          </div>

          {/* Original Student Submission Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold pastel-indigo px-2.5 py-1 rounded-lg border">
                  {complaint.category}
                </span>
                <PriorityBadge priority={complaint.priority} />
                {complaint.identity_mode === 'anonymous' ? (
                  complaint.is_unmasked ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-300 px-2.5 py-1 rounded-lg">
                      <Eye className="w-3.5 h-3.5 text-purple-700" />
                      <span>Unmasked: {complaint.student_name} ({complaint.student_id})</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                      <span>Anonymous Student</span>
                      {complaint.anonymous_reporter_id && (
                        <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded">
                          {complaint.anonymous_reporter_id}
                        </span>
                      )}
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium pastel-green px-2.5 py-1 rounded-lg border">
                    <User className="w-3.5 h-3.5 text-emerald-700" />
                    Student: {complaint.student_name} ({complaint.student_id})
                  </span>
                )}
              </div>

              {complaint.identity_mode === 'anonymous' && !complaint.is_unmasked && (
                <button
                  type="button"
                  id="admin-unmask-identity-btn"
                  onClick={() => setIsUnmaskModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold transition-colors shadow-2xs"
                  title="Unmask identity with formal administrative audit reason"
                >
                  <Lock className="w-3 h-3" />
                  <span>Unmask Identity (Dean Audit)</span>
                </button>
              )}
            </div>

            {complaint.is_unmasked && complaint.unmask_reason && (
              <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-purple-900 uppercase text-[10px] tracking-wider block">
                  Identity Unmask Audit Record
                </span>
                <p className="text-purple-950 font-medium">
                  "{complaint.unmask_reason}"
                </p>
                <p className="text-[10px] text-purple-700">
                  Authorized by {complaint.unmasked_by} on {new Date(complaint.unmasked_at || '').toLocaleString()}
                </p>
              </div>
            )}

            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {complaint.title}
            </h1>

            <div className="mt-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Original Student Description (Immutable Raw Record)
              </label>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {complaint.description}
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Lodged At</p>
                  <p className="font-medium text-slate-800">
                    {new Date(complaint.created_at).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Last Modified</p>
                  <p className="font-medium text-slate-800">
                    {new Date(complaint.updated_at).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Uploaded Visual Evidence */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Visual Incident Evidence
            </h2>
            {complaint.image_url ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div
                  onClick={() => setSelectedImageModal(complaint.image_url || null)}
                  className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-950 w-full sm:w-60 h-44 shrink-0 flex items-center justify-center cursor-pointer"
                >
                  <img
                    src={complaint.image_url}
                    alt="Evidence"
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium">
                    <ZoomIn className="w-4 h-4" />
                    <span>Expand View</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-900">Photo attached with grievance</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Multimodal image examined for contextual visual validation. Click thumbnail to inspect full resolution.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-100">
                No visual photo uploaded for this grievance.
              </p>
            )}
          </div>

          {/* Audit Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-600" />
              <span>Investigation & Status Audit Trail</span>
            </h2>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {updates.map((u, idx) => (
                <div key={u.id || idx} className="relative">
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-red-600 text-white border-2 border-white flex items-center justify-center shadow-2xs">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={u.status} size="sm" />
                        <span className="text-xs font-bold text-slate-800">
                          {u.updated_by?.replace(/gemini\s*ai(?:\s*system)?/gi, 'Automated System')}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(u.created_at).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      {u.note?.replace(/gemini\s*ai(?:\s*(?:re-)?triage)?/gi, 'Automated Triage')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Resolution Feedback Card */}
          {complaint.feedback_rating && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                    <Star className="w-4 h-4 fill-amber-400" />
                  </div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Student Resolution Feedback
                  </h2>
                </div>
                <StarRating rating={complaint.feedback_rating} size="md" />
              </div>

              {complaint.feedback_comment ? (
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 leading-relaxed italic">
                  "{complaint.feedback_comment}"
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Student rated resolution {complaint.feedback_rating}/5 stars.
                </p>
              )}

              {complaint.feedback_submitted_at && (
                <p className="text-[10px] text-slate-400 mt-2 font-mono">
                  Submitted on {new Date(complaint.feedback_submitted_at).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right 1 Column: Administrative Action Triage Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs sticky top-20">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Edit3 className="w-4 h-4 text-purple-600" />
              <span>Administrative Actions</span>
            </h2>

            <form onSubmit={handleSaveTriage} className="space-y-4">
              {/* Category Override */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category
                </label>
                <select
                  id="admin-update-category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                >
                  {COMPLAINT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Update */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Update Status
                </label>
                <select
                  id="admin-update-status-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ComplaintStatus)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                >
                  {COMPLAINT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Assignment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Assign Department
                </label>
                <select
                  id="admin-assign-dept-select"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                >
                  <option value="">Unassigned</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Triage Priority Level
                </label>
                <select
                  id="admin-update-priority-select"
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as ComplaintPriority)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                >
                  {COMPLAINT_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p} Priority
                    </option>
                  ))}
                </select>
              </div>

              {/* Investigation / Resolution Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Resolution / Progress Note (Optional)
                </label>
                <textarea
                  id="admin-triage-note-input"
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="e.g., Electrician dispatched to Auditorium; parts ordered from vendor..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 leading-relaxed"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  This note will be logged in the public timeline and visible on the student's dashboard.
                </p>
              </div>

              <button
                id="admin-save-triage-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-200 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Saving Updates...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Save & Update Ticket</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Preview */}
      {selectedImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImageModal(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[85vh] flex items-center justify-center">
            <img
              src={selectedImageModal}
              alt="Evidence Fullscreen"
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Policy & Abuse Review Modal */}
      {isAbuseModalOpen && (
        <AbuseManagementModal
          complaint={complaint}
          user={user}
          isOpen={isAbuseModalOpen}
          onClose={() => setIsAbuseModalOpen(false)}
          onSuccess={handleAbuseSuccess}
        />
      )}

      {/* Audited Identity Unmasking Modal */}
      {isUnmaskModalOpen && (
        <UnmaskIdentityModal
          complaint={complaint}
          user={user}
          isOpen={isUnmaskModalOpen}
          onClose={() => setIsUnmaskModalOpen(false)}
          onSuccess={handleUnmaskSuccess}
        />
      )}
    </div>
  );
};

