import {
  Profile,
  Department,
  Complaint,
  ComplaintUpdate,
  DashboardStats,
  UserRole,
} from '../types';

class ApiService {
  private getHeaders(accountId?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accountId) {
      headers['x-account-id'] = accountId;
    } else {
      const stored = localStorage.getItem('campus_active_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.account_id) {
            headers['x-account-id'] = parsed.account_id;
          }
          if (parsed?.role) {
            headers['x-user-role'] = parsed.role;
          }
        } catch {
          // ignore
        }
      }
    }
    return headers;
  }

  async login(accountId: string, password: string, requiredRole: UserRole): Promise<{ user: Profile; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account_id: accountId,
        password,
        required_role: requiredRole,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to authenticate');
    }
    return data;
  }

  async changePassword(accountId: string, currentPassword: string, newPassword: string): Promise<Profile> {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account_id: accountId,
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update password');
    }
    return data.user;
  }

  async getMe(accountId?: string): Promise<Profile> {
    const res = await fetch('/api/auth/me', {
      headers: this.getHeaders(accountId),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load profile');
    }
    return data.user;
  }

  async getDepartments(): Promise<Department[]> {
    const res = await fetch('/api/departments');
    if (!res.ok) throw new Error('Failed to load departments');
    return res.json();
  }

  async getStats(studentId?: string): Promise<DashboardStats> {
    const url = studentId ? `/api/stats?student_id=${encodeURIComponent(studentId)}` : '/api/stats';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load stats');
    return res.json();
  }

  async getNotifications(userId?: string): Promise<import('../types').AppNotification[]> {
    const url = userId ? `/api/notifications?user_id=${encodeURIComponent(userId)}` : '/api/notifications';
    const res = await fetch(url, {
      headers: this.getHeaders(userId),
    });
    if (!res.ok) return [];
    return res.json();
  }

  async markNotificationRead(id: string): Promise<void> {
    await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await fetch('/api/notifications/mark-all-read', {
      method: 'POST',
      headers: this.getHeaders(userId),
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async getAnalytics(): Promise<import('../types').AnalyticsData> {
    const res = await fetch('/api/analytics', {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load analytics data');
    return res.json();
  }

  async submitFeedback(complaintId: string, rating: number, comment?: string): Promise<any> {
    const res = await fetch(`/api/complaints/${complaintId}/feedback`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ rating, comment }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit feedback');
    return data;
  }

  async reviewAbuse(payload: {
    complaint_id: string;
    is_deliberately_false: boolean;
    issue_warning?: boolean;
    apply_restriction?: boolean;
    restriction_days?: number;
    restriction_reason?: string;
    reviewer_name?: string;
    audit_note?: string;
  }): Promise<any> {
    const res = await fetch('/api/admin/abuse/review', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to complete abuse review');
    return data;
  }

  async getAdminStudents(): Promise<Profile[]> {
    const res = await fetch('/api/admin/students', {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load student profiles');
    return res.json();
  }

  async restrictStudent(
    accountId: string,
    action: 'restrict' | 'unrestrict',
    days?: number,
    reason?: string
  ): Promise<any> {
    const res = await fetch(`/api/admin/students/${accountId}/restrict`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ action, days, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update student restriction');
    return data;
  }

  async unmaskComplaint(id: string, reason: string, adminName?: string): Promise<Complaint> {
    const res = await fetch(`/api/complaints/${id}/unmask`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason, admin_name: adminName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to unmask identity');
    return data;
  }

  async getComplaints(params?: {
    student_id?: string;
    status?: string;
    category?: string;
    department_id?: string;
    priority?: string;
    search?: string;
    safety_only?: boolean;
    abuse_only?: boolean;
    sort_by?: 'newest' | 'oldest' | 'priority';
    include_archived?: boolean;
  }): Promise<Complaint[]> {
    const query = new URLSearchParams();
    if (params?.student_id) query.set('student_id', params.student_id);
    if (params?.status && params.status !== 'All') query.set('status', params.status);
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.department_id && params.department_id !== 'All') query.set('department_id', params.department_id);
    if (params?.priority && params.priority !== 'All') query.set('priority', params.priority);
    if (params?.search) query.set('search', params.search);
    if (params?.safety_only) query.set('safety_only', 'true');
    if (params?.abuse_only) query.set('abuse_only', 'true');
    if (params?.sort_by) query.set('sort_by', params.sort_by);
    if (params?.include_archived) query.set('include_archived', 'true');

    const res = await fetch(`/api/complaints?${query.toString()}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load complaints');
    return res.json();
  }

  async archiveComplaint(id: string, accountId?: string): Promise<Complaint> {
    const res = await fetch(`/api/complaints/${id}/archive`, {
      method: 'POST',
      headers: this.getHeaders(accountId),
      body: JSON.stringify({ account_id: accountId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to archive complaint');
    return data.complaint;
  }

  async getComplaint(id: string): Promise<Complaint | null> {
    if (!id || id === 'null' || id === 'undefined') {
      return null;
    }
    try {
      const res = await fetch(`/api/complaints/${encodeURIComponent(id)}`, {
        headers: this.getHeaders(),
      });
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load complaint details');
      }
      return res.json();
    } catch (err: any) {
      if (err.message && err.message !== 'Failed to load complaint details') {
        console.warn('Network error fetching complaint:', err.message);
      }
      return null;
    }
  }

  async createComplaint(payload: {
    student_id: string;
    category: string;
    title?: string;
    description: string;
    image_url?: string | null;
    identity_mode: 'identified' | 'anonymous';
    priority?: string;
    department_id?: string | null;
  }): Promise<Complaint> {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: this.getHeaders(payload.student_id),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit complaint');
    return data;
  }

  async updateComplaint(
    id: string,
    payload: {
      status?: string;
      department_id?: string | null;
      priority?: string;
      category?: string;
      note?: string;
      updated_by_name?: string;
    }
  ): Promise<Complaint> {
    const res = await fetch(`/api/complaints/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update complaint');
    return data;
  }

  async reanalyzeComplaint(id: string): Promise<Complaint> {
    const res = await fetch(`/api/complaints/${id}/reanalyze`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to run Gemini AI triage');
    return data;
  }

  async addComplaintUpdate(
    id: string,
    payload: {
      note: string;
      updated_by_name?: string;
      status?: string;
    }
  ): Promise<ComplaintUpdate> {
    const res = await fetch(`/api/complaints/${id}/updates`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add update note');
    return data;
  }

  async uploadImage(base64Data: string, filename?: string): Promise<string> {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_base64: base64Data,
        filename,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload image');
    return data.url;
  }

  // Subscribe to real-time updates
  subscribeRealtime(onMessage: (event: { type: string; data: any }) => void): () => void {
    try {
      const es = new EventSource('/api/realtime/stream');
      es.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.type !== 'CONNECTED') {
            onMessage(parsed);
          }
        } catch {
          // ignore parse error
        }
      };
      es.onerror = () => {
        // silently handled by browser reconnection logic
      };

      return () => {
        es.close();
      };
    } catch {
      return () => {};
    }
  }
}

export const api = new ApiService();
