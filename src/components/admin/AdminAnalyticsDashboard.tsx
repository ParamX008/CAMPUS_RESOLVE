import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  ShieldAlert,
  RefreshCw,
  Award,
  ArrowLeft,
  FolderOpen,
  Shield,
  AlertCircle,
  Search,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AnalyticsData } from '../../types';
import { api } from '../../lib/api';
import { StarRating } from '../common/Badge';

// Clean, institutional color palette (no neon purple/indigo)
const BRAND_CHART_COLORS = [
  '#E21B23', // Brand Red
  '#2563EB', // Blue
  '#059669', // Emerald
  '#D97706', // Amber
  '#475569', // Slate
  '#0284C7', // Sky
  '#DC2626', // Deep Red
  '#64748B', // Muted Slate
];

const STATUS_CHART_COLORS: Record<string, string> = {
  Pending: '#D97706',
  'In Progress': '#2563EB',
  'Under Investigation': '#0284C7',
  Resolved: '#059669',
  Closed: '#475569',
};

const PRIORITY_CHART_COLORS: Record<string, string> = {
  Low: '#94A3B8',
  Medium: '#D97706',
  High: '#EA580C',
  Urgent: '#E21B23',
};

export const AdminAnalyticsDashboard: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await api.getAnalytics();
      setData(result);
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      setError(err?.message || 'Unable to load analytics. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 pb-16">
        {/* Back Link */}
        {onBack && (
          <div>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#E21B23] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto text-[#E21B23]">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <h2 className="text-base font-bold text-[#111827]">Loading Institutional Analytics...</h2>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            Aggregating complaint records, departmental case throughput, and student satisfaction metrics.
          </p>
        </div>
      </div>
    );
  }

  // 2. Error State (Never blank white page!)
  if (error || !data) {
    return (
      <div className="space-y-6 pb-16">
        {onBack && (
          <div>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#E21B23] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl border border-rose-200 p-8 sm:p-12 text-center shadow-sm space-y-4 max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-rose-900">Unable to Load Analytics</h2>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            {error || 'An unexpected error occurred while communicating with the analytics service.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fetchAnalytics()}
              className="px-4 py-2 bg-[#E21B23] hover:bg-[#B5122A] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Retry
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#111827] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Return to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Safe data extraction (fully defensive checks against undefined/null)
  const totalComplaints = Number(data.total_complaints ?? data.summary?.total_complaints ?? 0);
  const pendingComplaints = Number(data.pending_complaints ?? data.summary?.pending_complaints ?? 0);
  const inProgressComplaints = Number(data.in_progress_complaints ?? data.summary?.in_progress_complaints ?? 0);
  const investigatingComplaints = Number(data.under_investigation_complaints ?? data.summary?.under_investigation_complaints ?? 0);
  const resolvedComplaints = Number(data.resolved_complaints ?? data.summary?.resolved_complaints ?? 0);
  const closedComplaints = Number(data.closed_complaints ?? data.summary?.closed_complaints ?? 0);
  const resolutionRate = Number(data.resolution_rate_percent ?? data.summary?.resolution_rate_percent ?? 0);
  const avgResolutionHours = Number(data.avg_resolution_time_hours ?? data.summary?.avg_resolution_hours ?? 0);
  const avgRating = Number(data.average_rating ?? data.summary?.avg_satisfaction_rating ?? 0);
  const totalFeedbackCount = Number(data.total_feedback_count ?? data.summary?.total_feedback_count ?? 0);
  const safetyCount = Number(data.safety_flagged_count ?? data.summary?.safety_alerts ?? 0);
  const abuseCount = Number(data.abuse_flagged_count ?? data.summary?.pending_abuse_reviews ?? 0);

  // Safe category data
  let categoryChartData: Array<{ name: string; count: number }> = [];
  if (Array.isArray(data.by_category) && data.by_category.length > 0) {
    categoryChartData = data.by_category.map((item) => ({
      name: item.name || item.category || 'Other',
      count: Number(item.count || 0),
    })).filter((c) => c.count > 0);
  } else if (data.categories && typeof data.categories === 'object') {
    categoryChartData = Object.entries(data.categories)
      .map(([name, count]) => ({ name, count: Number(count || 0) }))
      .filter((c) => c.count > 0);
  }

  // Safe department data
  let departmentChartData: Array<{ name: string; fullName: string; count: number }> = [];
  if (Array.isArray(data.by_department) && data.by_department.length > 0) {
    departmentChartData = data.by_department.map((dept) => {
      const fullName = dept.name || dept.department || 'Unassigned';
      return {
        name: fullName.length > 22 ? fullName.substring(0, 20) + '...' : fullName,
        fullName,
        count: Number(dept.count || 0),
      };
    });
  } else if (data.departments && typeof data.departments === 'object') {
    departmentChartData = Object.entries(data.departments).map(([name, count]) => ({
      name: name.length > 22 ? name.substring(0, 20) + '...' : name,
      fullName: name,
      count: Number(count || 0),
    }));
  }

  // Safe timeline data
  let timelineChartData: Array<{ date: string; count: number; resolved: number }> = [];
  if (Array.isArray(data.timeline) && data.timeline.length > 0) {
    timelineChartData = data.timeline.map((t) => ({
      date: t.date,
      count: Number(t.count || 0),
      resolved: Number(t.resolved || 0),
    }));
  } else if (Array.isArray(data.monthly_trend) && data.monthly_trend.length > 0) {
    timelineChartData = data.monthly_trend.map((m) => ({
      date: m.month,
      count: Number(m.total || 0),
      resolved: Number(m.resolved || 0),
    }));
  }

  // Safe status data
  let statusChartData: Array<{ name: string; count: number }> = [];
  if (Array.isArray(data.by_status) && data.by_status.length > 0) {
    statusChartData = data.by_status.map((st) => ({
      name: st.status,
      count: Number(st.count || 0),
    }));
  } else if (data.statuses && typeof data.statuses === 'object') {
    statusChartData = Object.entries(data.statuses).map(([name, count]) => ({
      name,
      count: Number(count || 0),
    }));
  } else {
    statusChartData = [
      { name: 'Pending', count: pendingComplaints },
      { name: 'In Progress', count: inProgressComplaints },
      { name: 'Under Investigation', count: investigatingComplaints },
      { name: 'Resolved', count: resolvedComplaints },
      { name: 'Closed', count: closedComplaints },
    ];
  }

  // Safe priority data
  let priorityChartData: Array<{ name: string; count: number }> = [];
  if (Array.isArray(data.by_priority) && data.by_priority.length > 0) {
    priorityChartData = data.by_priority.map((p) => ({
      name: p.priority,
      count: Number(p.count || 0),
    }));
  } else if (data.priorities && typeof data.priorities === 'object') {
    priorityChartData = Object.entries(data.priorities).map(([name, count]) => ({
      name,
      count: Number(count || 0),
    }));
  }

  return (
    <div className="space-y-5 sm:space-y-6 pb-16">
      {/* Navigation & Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#E21B23] transition-colors cursor-pointer mb-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Grievance Dashboard</span>
              </button>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Administrative Operations &amp; Governance
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-semibold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Live Data Synchronized
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
              Institutional Grievance Analytics
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-2xl">
              Comprehensive operational visibility across grievance volume, departmental turnaround SLAs, safety escalations, and verified student sentiment.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => fetchAnalytics(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#E2E8F0] hover:border-slate-300 hover:bg-slate-50 text-[#111827] text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#64748B] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Updating...' : 'Refresh Metrics'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Empty State check (When 0 complaints in database) */}
      {totalComplaints === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <FolderOpen className="w-7 h-7 stroke-[1.8]" />
          </div>
          <h2 className="text-base font-bold text-[#111827]">No Complaint Data Available Yet</h2>
          <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
            When students submit grievances through the student portal, metrics, monthly trends, and departmental breakdowns will automatically be computed here.
          </p>
          {onBack && (
            <div className="pt-2">
              <button
                onClick={onBack}
                className="px-4 py-2 bg-[#E21B23] hover:bg-[#B5122A] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Key Administrative KPIs (6 Primary Status Metrics) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Total Filings */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs flex flex-col justify-between min-h-[105px]">
              <div className="flex items-center justify-between text-[#64748B]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Filings</span>
                <BarChart3 className="w-4 h-4 text-[#111827]" />
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-bold text-[#111827]">{totalComplaints}</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">All-time campus logs</p>
              </div>
            </div>

            {/* Pending */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs flex flex-col justify-between min-h-[105px]">
              <div className="flex items-center justify-between text-[#64748B]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Pending</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-bold text-amber-600">{pendingComplaints}</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">Awaiting triage</p>
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs flex flex-col justify-between min-h-[105px]">
              <div className="flex items-center justify-between text-[#64748B]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">In Progress</span>
                <AlertCircle className="w-4 h-4 text-blue-500" />
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{inProgressComplaints}</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">Under department action</p>
              </div>
            </div>

            {/* Investigating */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs flex flex-col justify-between min-h-[105px]">
              <div className="flex items-center justify-between text-[#64748B]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Investigating</span>
                <Search className="w-4 h-4 text-sky-600" />
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-bold text-sky-600">{investigatingComplaints}</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">Formal inquiry active</p>
              </div>
            </div>

            {/* Resolved */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs flex flex-col justify-between min-h-[105px]">
              <div className="flex items-center justify-between text-[#64748B]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Resolved</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{resolvedComplaints}</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">Completed resolutions</p>
              </div>
            </div>

            {/* Closed */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs flex flex-col justify-between min-h-[105px]">
              <div className="flex items-center justify-between text-[#64748B]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Closed</span>
                <Shield className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-bold text-slate-700">{closedComplaints}</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">Archived records</p>
              </div>
            </div>
          </div>

          {/* Operational Quality Bento (Resolution Rate, SLA, Rating, Safety Alerts) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Resolution Rate */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs">
              <div className="flex items-center justify-between text-[#64748B] mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Resolution Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{resolutionRate}%</p>
              <p className="text-[10px] text-[#64748B] mt-1">Resolved or Closed tickets</p>
            </div>

            {/* Avg Turnaround Time */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs">
              <div className="flex items-center justify-between text-[#64748B] mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Avg. Turnaround</span>
                <Clock className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#111827]">
                {avgResolutionHours > 0 ? `${avgResolutionHours}h` : 'N/A'}
              </p>
              <p className="text-[10px] text-[#64748B] mt-1">Lodge to resolution time</p>
            </div>

            {/* Student Satisfaction */}
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs">
              <div className="flex items-center justify-between text-[#64748B] mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Student Rating</span>
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl sm:text-3xl font-bold text-[#111827]">
                  {avgRating > 0 ? avgRating : '0.0'}
                </p>
                <span className="text-xs text-[#64748B] font-semibold">/ 5.0</span>
              </div>
              <p className="text-[10px] text-[#64748B] mt-1">
                {totalFeedbackCount > 0 ? `${totalFeedbackCount} verified ratings` : 'No ratings yet'}
              </p>
            </div>

            {/* Safety Alerts */}
            <div className="bg-white p-4 rounded-xl border border-red-200 shadow-2xs bg-red-50/15">
              <div className="flex items-center justify-between text-[#64748B] mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#E21B23]">
                  Safety Alerts
                </span>
                <ShieldAlert className="w-4 h-4 text-[#E21B23]" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#E21B23]">{safetyCount}</p>
              <p className="text-[10px] text-[#64748B] mt-1">
                {abuseCount > 0 ? `${abuseCount} abuse review(s) active` : 'Immediate triage escalated'}
              </p>
            </div>
          </div>

          {/* Row 2: Charts - Inflow Velocity & Category Spread */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Timeline Inflow Chart */}
            <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#E21B23]" />
                    <span>Grievance Inflow Velocity (Monthly Trend)</span>
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Real-time volume tracking of student submissions over time
                  </p>
                </div>
              </div>

              <div className="h-64 w-full flex-1 min-h-[220px]">
                {timelineChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="redCountGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E21B23" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#E21B23" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [`${val} Grievance(s)`, 'Filings']}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#E21B23"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#redCountGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#64748B]">
                    No historical date trends recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Category Breakdown Donut */}
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col">
              <div className="mb-2">
                <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-[#E21B23]" />
                  <span>Category Distribution</span>
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">Distribution across grievance classifications</p>
              </div>

              <div className="h-56 w-full flex-1 relative flex items-center justify-center">
                {categoryChartData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="count"
                        >
                          {categoryChartData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={BRAND_CHART_COLORS[index % BRAND_CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            fontSize: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-bold text-[#111827]">{totalComplaints}</span>
                      <span className="text-[10px] text-[#64748B] uppercase font-semibold">Total</span>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-[#64748B]">No categories reported yet</div>
                )}
              </div>

              {categoryChartData.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 pt-3 border-t border-[#E2E8F0] text-[11px]">
                  {categoryChartData.slice(0, 6).map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-[#64748B] truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: BRAND_CHART_COLORS[idx % BRAND_CHART_COLORS.length] }}
                      />
                      <span className="truncate" title={item.name}>{item.name}:</span>
                      <span className="font-bold text-[#111827]">{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Department Workload & Status Severity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {/* Department Workload */}
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Department Case Load Distribution</span>
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">Total grievances assigned per institutional unit</p>
              </div>

              <div className="h-64 w-full">
                {departmentChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={departmentChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#111827' }} width={120} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                        }}
                        formatter={(val: any, _name: any, props: any) => [
                          `${val} ticket(s)`,
                          props.payload.fullName || 'Department',
                        ]}
                      />
                      <Bar dataKey="count" fill="#E21B23" radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#64748B]">
                    No department data logged.
                  </div>
                )}
              </div>
            </div>

            {/* Status & Priority Pipeline */}
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E2E8F0] shadow-sm space-y-5">
              <div>
                <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2 mb-0.5">
                  <Shield className="w-4 h-4 text-[#E21B23]" />
                  <span>Triage Pipeline &amp; Severity Breakdown</span>
                </h2>
                <p className="text-xs text-[#64748B]">Operational lifecycle distribution across ticket priority levels</p>
              </div>

              {/* Status Pills */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Lifecycle Status
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {statusChartData.map((st) => (
                    <div
                      key={st.name}
                      className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: STATUS_CHART_COLORS[st.name] || '#64748B' }}
                        />
                        <span className="text-xs font-semibold text-[#111827]">{st.name}</span>
                      </div>
                      <span className="text-sm font-bold text-[#111827] font-mono">{st.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Distribution */}
              <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Priority Severity
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {priorityChartData.map((pr) => (
                    <div
                      key={pr.name}
                      className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col justify-between"
                    >
                      <span className="text-[11px] font-semibold text-[#64748B]">{pr.name} Priority</span>
                      <p className="text-lg font-bold text-[#111827] mt-1 font-mono">{pr.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Student Feedback & Service Quality Highlights */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Student Satisfaction &amp; Feedback Logs</span>
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Direct student satisfaction ratings submitted upon resolution of grievances
                </p>
              </div>

              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(avgRating)} size="md" />
                <span className="text-xs font-bold text-[#111827]">
                  {avgRating > 0 ? `${avgRating} / 5.0` : 'No reviews'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rating Summary Box */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-center items-center text-center">
                <div className="text-3xl sm:text-4xl font-bold text-amber-600">
                  {avgRating > 0 ? avgRating : '—'}
                </div>
                <div className="my-1.5">
                  <StarRating rating={Math.round(avgRating)} size="md" />
                </div>
                <p className="text-xs font-semibold text-[#111827]">Campus Service Score</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Based on {totalFeedbackCount} verified student reviews
                </p>
              </div>

              {/* Quality Mandate Information Box */}
              <div className="md:col-span-2 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between text-xs text-[#64748B]">
                <div className="space-y-1.5">
                  <p className="font-bold text-[#111827] flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#E21B23]" />
                    <span>Resolution Quality Assurance</span>
                  </p>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    When tickets reach <strong>Resolved</strong> or <strong>Closed</strong> status, students receive an instant feedback prompt. Ratings of 1–2 stars automatically trigger departmental review.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-[#64748B] pt-2 mt-2 border-t border-[#E2E8F0]">
                  <span>Resolution SLA Target: <strong>&lt; 24h</strong></span>
                  <span>Satisfaction Target: <strong>&gt; 4.0 / 5.0</strong></span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
