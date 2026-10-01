import React, { useState, useEffect, useCallback } from 'react';
import {
  Profile,
  Department,
  Complaint,
  DashboardStats,
  ComplaintStatus,
  ComplaintPriority,
  IdentityMode,
} from './types';
import { api } from './lib/api';
import { supabase } from './lib/supabase';
import { Navbar } from './components/common/Navbar';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { DatabaseSchemaModal } from './components/auth/DatabaseSchemaModal';
import { StudentLogin } from './components/auth/StudentLogin';
import { AdminLogin } from './components/auth/AdminLogin';
import { StudentDashboard } from './components/student/StudentDashboard';
import { RaiseComplaint } from './components/student/RaiseComplaint';
import { MyComplaints } from './components/student/MyComplaints';
import { ComplaintDetailView } from './components/student/ComplaintDetailView';
import { StudentProfile } from './components/student/StudentProfile';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminComplaintDetail } from './components/admin/AdminComplaintDetail';
import { AdminDepartmentsView } from './components/admin/AdminDepartmentsView';
import { AdminAnalyticsDashboard } from './components/admin/AdminAnalyticsDashboard';
import { AdminStudentsView } from './components/admin/AdminStudentsView';
import { AdminProfile } from './components/admin/AdminProfile';

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<Profile | null>(() => {
    const saved = localStorage.getItem('campus_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [authView, setAuthView] = useState<'student' | 'admin'>('student');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  // Data states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    under_investigation: 0,
    resolved: 0,
    closed: 0,
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load core data
  const loadData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const isStudent = currentUser.role === 'student';
      const [deptsData, statsData, complaintsData] = await Promise.all([
        api.getDepartments(),
        api.getStats(isStudent ? currentUser.account_id : undefined),
        api.getComplaints(isStudent ? { student_id: currentUser.account_id } : undefined),
      ]);

      setDepartments(deptsData);
      setStats(statsData);
      setComplaints(complaintsData);

      if (selectedComplaintId) {
        try {
          const detail = await api.getComplaint(selectedComplaintId);
          if (detail) {
            setSelectedComplaint(detail);
          } else {
            setSelectedComplaintId(null);
            setSelectedComplaint(null);
            if (activeTab === 'complaint-detail') setActiveTab('dashboard');
            if (activeTab === 'admin-complaint-detail') setActiveTab('admin-dashboard');
          }
        } catch {
          setSelectedComplaintId(null);
          setSelectedComplaint(null);
        }
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
    }
  }, [currentUser, selectedComplaintId, activeTab]);

  // Initial load and SSE real-time subscription
  useEffect(() => {
    if (currentUser) {
      loadData();
      const unsubscribe = api.subscribeRealtime((event) => {
        // Refresh on any database event
        loadData();
      });
      return () => {
        unsubscribe();
      };
    }
  }, [currentUser, loadData]);

  // Load single complaint detail when selected
  useEffect(() => {
    let isMounted = true;
    if (selectedComplaintId && currentUser) {
      api
        .getComplaint(selectedComplaintId)
        .then((data) => {
          if (!isMounted) return;
          if (data) {
            setSelectedComplaint(data);
          } else {
            setSelectedComplaintId(null);
            setSelectedComplaint(null);
            if (activeTab === 'complaint-detail') setActiveTab('dashboard');
            if (activeTab === 'admin-complaint-detail') setActiveTab('admin-dashboard');
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setSelectedComplaintId(null);
          setSelectedComplaint(null);
          if (activeTab === 'complaint-detail') setActiveTab('dashboard');
          if (activeTab === 'admin-complaint-detail') setActiveTab('admin-dashboard');
        });
    } else {
      setSelectedComplaint(null);
    }
    return () => {
      isMounted = false;
    };
  }, [selectedComplaintId, currentUser, activeTab]);

  // Handle Login
  const handleLogin = async (accountId: string, pass: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await api.login(accountId, pass, authView);
      localStorage.setItem('campus_active_user', JSON.stringify(res.user));
      setCurrentUser(res.user);
      setActiveTab(res.user.role === 'student' ? 'dashboard' : 'admin-dashboard');
      setSelectedComplaintId(null);
      addToast(
        'success',
        `Welcome back, ${res.user.name}`,
        `Signed into ${res.user.role === 'student' ? 'Student' : 'Administrator'} Portal.`
      );
    } catch (err: any) {
      setAuthError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    localStorage.removeItem('campus_active_user');
    setCurrentUser(null);
    setSelectedComplaintId(null);
    setAuthView('student');
    addToast('info', 'Logged out successfully');
  };

  // Switch Portal
  const handleSwitchPortal = (targetRole: 'student' | 'admin') => {
    setAuthView(targetRole);
    setAuthError(null);
    if (currentUser && currentUser.role !== targetRole) {
      handleLogout();
    }
  };

  // Student: Submit complaint
  const handleSubmitComplaint = async (data: {
    student_id: string;
    category: string;
    title: string;
    description: string;
    image_url: string | null;
    identity_mode: IdentityMode;
    department_id: string | null;
  }) => {
    setIsLoading(true);
    try {
      const newComplaint = await api.createComplaint(data);
      addToast(
        'success',
        `Complaint ${newComplaint.complaint_id} Submitted`,
        'Your grievance has been stored in Supabase and queued for triage.'
      );
      await loadData();
      setSelectedComplaintId(newComplaint.id);
      setActiveTab('complaint-detail');
    } catch (err: any) {
      addToast('error', 'Submission Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Admin: Update complaint
  const handleAdminUpdateComplaint = async (payload: {
    status?: ComplaintStatus;
    department_id?: string | null;
    priority?: ComplaintPriority;
    category?: string;
    note?: string;
  }) => {
    if (!selectedComplaint) return;
    setIsLoading(true);
    try {
      const updated = await api.updateComplaint(selectedComplaint.id, {
        ...payload,
        updated_by_name: `${currentUser?.name || 'Administrator'} (Staff)`,
      });
      setSelectedComplaint(updated);
      await loadData();
      addToast(
        'success',
        `Ticket ${updated.complaint_id} Updated`,
        `Status set to '${updated.status}'. Synced to shared database.`
      );
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Admin: Re-analyze complaint with Gemini AI
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const handleAdminReanalyze = async () => {
    if (!selectedComplaint) return;
    setIsReanalyzing(true);
    try {
      const updated = await api.reanalyzeComplaint(selectedComplaint.id);
      setSelectedComplaint(updated);
      await loadData();
      addToast(
        'success',
        'Triage Analysis Complete',
        `Re-classified as ${updated.ai_category_detected || updated.category} with ${
          updated.ai_confidence ? Math.round(updated.ai_confidence * 100) : 90
        }% confidence.`
      );
    } catch (err: any) {
      addToast('error', 'Triage Analysis Failed', err.message);
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Admin: Quick status update from table
  const handleAdminQuickUpdateStatus = async (id: string, newStatus: ComplaintStatus) => {
    try {
      await api.updateComplaint(id, {
        status: newStatus,
        updated_by_name: `${currentUser?.name || 'Administrator'} (Staff)`,
      });
      await loadData();
      addToast('success', 'Status Updated', `Grievance status changed to '${newStatus}'.`);
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message);
    }
  };

  // Standalone Authentication Layout: No Navbar, No Footer, No constrained main container
  if (!currentUser) {
    return (
      <div className="min-h-screen w-full relative selection:bg-primary-light selection:text-primary-dark">
        {/* Toast Notification Container */}
        <ToastContainer toasts={toasts} onDismiss={removeToast} />

        {/* Database Schema Modal */}
        <DatabaseSchemaModal
          isOpen={isSchemaModalOpen}
          onClose={() => setIsSchemaModalOpen(false)}
        />

        {authView === 'student' ? (
          <StudentLogin
            onLogin={handleLogin}
            onSwitchToAdmin={() => {
              setAuthView('admin');
              setAuthError(null);
            }}
            isLoading={isLoading}
            error={authError}
          />
        ) : (
          <AdminLogin
            onLogin={handleLogin}
            onSwitchToStudent={() => {
              setAuthView('student');
              setAuthError(null);
            }}
            isLoading={isLoading}
            error={authError}
          />
        )}
      </div>
    );
  }

  // Authenticated Layout: Complete with Navbar, Main Content Area, and Footer
  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans selection:bg-primary-light selection:text-primary-dark">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Database Schema Modal */}
      <DatabaseSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />

      {/* Top Navbar */}
      <Navbar
        user={currentUser}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setSelectedComplaintId(null);
          setActiveTab(tab);
        }}
        onLogout={handleLogout}
        onSelectComplaint={(id) => {
          setSelectedComplaintId(id);
          setActiveTab(currentUser.role === 'student' ? 'complaint-detail' : 'admin-complaint-detail');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-3.5 sm:pt-6">
        {currentUser.role === 'student' ? (
          /* =================================== */
          /* STUDENT PORTAL VIEWS                */
          /* =================================== */
          <>
            {activeTab === 'dashboard' && (
              <StudentDashboard
                stats={stats}
                complaints={complaints}
                user={currentUser}
                onNavigate={(tab) => {
                  setSelectedComplaintId(null);
                  setActiveTab(tab);
                }}
                onSelectComplaint={(id) => {
                  setSelectedComplaintId(id);
                  setActiveTab('complaint-detail');
                }}
              />
            )}

            {activeTab === 'raise-complaint' && (
              <RaiseComplaint
                user={currentUser}
                onSubmitComplaint={handleSubmitComplaint}
                isLoading={isLoading}
                onCancel={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'my-complaints' && (
              <MyComplaints
                complaints={complaints}
                onSelectComplaint={(id) => {
                  setSelectedComplaintId(id);
                  setActiveTab('complaint-detail');
                }}
                onRaiseNew={() => setActiveTab('raise-complaint')}
              />
            )}

            {activeTab === 'complaint-detail' && (
              selectedComplaint ? (
                <ComplaintDetailView
                  complaint={selectedComplaint}
                  onBack={() => {
                    setSelectedComplaintId(null);
                    setActiveTab('dashboard');
                  }}
                  onComplaintUpdated={() => loadData()}
                  onFeedbackSuccess={() => {
                    addToast('success', 'Feedback submitted successfully.');
                    setSelectedComplaintId(null);
                    setActiveTab('dashboard');
                    loadData();
                  }}
                />
              ) : (
                <StudentDashboard
                  stats={stats}
                  complaints={complaints}
                  user={currentUser}
                  onNavigate={(tab) => {
                    setSelectedComplaintId(null);
                    setActiveTab(tab);
                  }}
                  onSelectComplaint={(id) => {
                    setSelectedComplaintId(id);
                    setActiveTab('complaint-detail');
                  }}
                />
              )
            )}

            {activeTab === 'profile' && (
              <StudentProfile
                user={currentUser}
                onProfileUpdated={(updated) => {
                  setCurrentUser(updated);
                  try {
                    localStorage.setItem('campus_active_user', JSON.stringify(updated));
                  } catch {
                    // ignore
                  }
                }}
              />
            )}

            {/* Fallback to Student Dashboard for any unrecognized student route */}
            {!['dashboard', 'raise-complaint', 'my-complaints', 'complaint-detail', 'profile'].includes(activeTab) && (
              <StudentDashboard
                stats={stats}
                complaints={complaints}
                user={currentUser}
                onNavigate={(tab) => {
                  setSelectedComplaintId(null);
                  setActiveTab(tab);
                }}
                onSelectComplaint={(id) => {
                  setSelectedComplaintId(id);
                  setActiveTab('complaint-detail');
                }}
              />
            )}
          </>
        ) : (
          /* =================================== */
          /* ADMINISTRATIVE PORTAL VIEWS         */
          /* =================================== */
          <>
            {activeTab === 'admin-dashboard' && (
              <AdminDashboard
                stats={stats}
                complaints={complaints}
                departments={departments}
                user={currentUser}
                onSelectComplaint={(id) => {
                  setSelectedComplaintId(id);
                  setActiveTab('admin-complaint-detail');
                }}
                onQuickUpdateStatus={handleAdminQuickUpdateStatus}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'admin-complaints' && (
              <AdminDashboard
                stats={stats}
                complaints={complaints}
                departments={departments}
                user={currentUser}
                onSelectComplaint={(id) => {
                  setSelectedComplaintId(id);
                  setActiveTab('admin-complaint-detail');
                }}
                onQuickUpdateStatus={handleAdminQuickUpdateStatus}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'admin-complaint-detail' && (
              selectedComplaint ? (
                <AdminComplaintDetail
                  complaint={selectedComplaint}
                  departments={departments}
                  user={currentUser}
                  onBack={() => {
                    setSelectedComplaintId(null);
                    setActiveTab('admin-dashboard');
                  }}
                  onUpdateComplaint={handleAdminUpdateComplaint}
                  onReanalyze={handleAdminReanalyze}
                  onComplaintUpdated={() => loadData()}
                  isLoading={isLoading}
                  isReanalyzing={isReanalyzing}
                />
              ) : (
                <AdminDashboard
                  stats={stats}
                  complaints={complaints}
                  departments={departments}
                  user={currentUser}
                  onSelectComplaint={(id) => {
                    setSelectedComplaintId(id);
                    setActiveTab('admin-complaint-detail');
                  }}
                  onQuickUpdateStatus={handleAdminQuickUpdateStatus}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )
            )}

            {activeTab === 'admin-analytics' && (
              <AdminAnalyticsDashboard
                onBack={() => setActiveTab('admin-dashboard')}
              />
            )}

            {activeTab === 'admin-departments' && (
              <AdminDepartmentsView
                departments={departments}
                complaints={complaints}
                onBack={() => setActiveTab('admin-dashboard')}
                onFilterByDept={(deptId) => {
                  setActiveTab('admin-dashboard');
                }}
              />
            )}

            {activeTab === 'admin-students' && (
              <AdminStudentsView
                currentUser={currentUser}
                onBack={() => setActiveTab('admin-dashboard')}
              />
            )}

            {(activeTab === 'admin-profile' || activeTab === 'profile') && (
              <AdminProfile
                user={currentUser}
                onBack={() => setActiveTab('admin-dashboard')}
                onProfileUpdated={(updated) => {
                  setCurrentUser(updated);
                  try {
                    localStorage.setItem('campus_active_user', JSON.stringify(updated));
                  } catch {
                    // ignore
                  }
                }}
              />
            )}

            {/* Fallback for unrecognized admin tabs */}
            {!['admin-dashboard', 'admin-complaints', 'admin-complaint-detail', 'admin-analytics', 'admin-departments', 'admin-students', 'admin-profile', 'profile'].includes(activeTab) && (
              <AdminDashboard
                stats={stats}
                complaints={complaints}
                departments={departments}
                user={currentUser}
                onSelectComplaint={(id) => {
                  setSelectedComplaintId(id);
                  setActiveTab('admin-complaint-detail');
                }}
                onQuickUpdateStatus={handleAdminQuickUpdateStatus}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] mt-auto py-4 text-center text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 CampusResolve • Supreme Knowledge Foundation</p>
          <p className="text-slate-400 text-[11px]">
            Institutional Grievance & Resolution Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
