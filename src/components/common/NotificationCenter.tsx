import React, { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { AppNotification, Profile } from '../../types';
import { api } from '../../lib/api';

interface NotificationCenterProps {
  user: Profile | null;
  onSelectComplaint?: (complaintId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ user, onSelectComplaint }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications(user.account_id);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen for realtime events
    const unsub = api.subscribeRealtime((event) => {
      if (
        event.type === 'NOTIFICATION' ||
        event.type === 'NOTIFICATION_CREATED' ||
        event.type === 'COMPLAINT_UPDATE' ||
        event.type === 'COMPLAINT_CREATED'
      ) {
        fetchNotifications();
      }
    });

    return () => unsub();
  }, [user]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const isNotifUnread = (n: AppNotification) => !n.read && !(n as any).is_read;

  // Filter out any individually dismissed notifications from visible popup
  const visibleNotifications = notifications.filter((n) => !dismissedNotificationIds.has(n.id));

  // Dynamically calculate unread count from visible notifications
  const unreadCount = visibleNotifications.filter(isNotifUnread).length;

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setIsLoading(true);
    try {
      await api.markAllNotificationsRead(user.account_id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, is_read: true })));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (isNotifUnread(notif)) {
      api.markNotificationRead(notif.id).catch(console.error);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true, is_read: true } : n))
      );
    }
    setIsOpen(false);
    if (notif.complaint_id && onSelectComplaint) {
      onSelectComplaint(notif.complaint_id);
    }
  };

  // Dismiss only the individual notification from view without closing panel or deleting complaint
  const handleDismissNotification = (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation(); // Prevent triggering notification item click
    setDismissedNotificationIds((prev) => {
      const next = new Set(prev);
      next.add(notifId);
      return next;
    });
  };

  const formatNotificationDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
        title="Notifications"
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white animate-pulse shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Mobile backdrop to easily close on outside tap */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/10 sm:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Notification Dropdown Panel: Responsive Anchoring & Positioning */}
      {isOpen && (
        <div
          className="fixed inset-x-3.5 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-84 max-w-sm sm:max-w-none mx-auto sm:mx-0 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden flex flex-col max-h-[calc(100vh-5rem)] sm:max-h-[26rem] animate-in fade-in slide-in-from-top-1"
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Notifications</span>
              {unreadCount > 0 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary border border-primary-border">
                  {unreadCount}
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-400">0</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  id="mark-all-read-btn"
                  onClick={handleMarkAllRead}
                  disabled={isLoading}
                  className="text-[11px] text-primary hover:text-primary-hover font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              {/* Header X: Closes the entire panel */}
              <button
                id="close-notifications-panel-btn"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {visibleNotifications.length === 0 ? (
              <div className="py-8 px-4 text-center text-slate-400">
                <p className="text-xs font-medium text-slate-500">No new updates</p>
              </div>
            ) : (
              visibleNotifications.map((notif) => {
                const isUnread = isNotifUnread(notif);
                return (
                  <div
                    key={notif.id}
                    id={`notification-item-${notif.id}`}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 transition-colors cursor-pointer text-left relative ${
                      isUnread
                        ? 'bg-primary-light/40 hover:bg-primary-light/70'
                        : 'bg-white hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Top Row: Title / Status + Date */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0 pr-1">
                        {isUnread && (
                          <span
                            className="w-2 h-2 rounded-full bg-primary shrink-0"
                            aria-label="Unread notification"
                          />
                        )}
                        <span
                          className={`text-xs font-bold uppercase tracking-wide truncate ${
                            isUnread ? 'text-slate-900' : 'text-slate-700'
                          }`}
                        >
                          {notif.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                        {formatNotificationDate(notif.created_at)}
                      </span>
                    </div>

                    {/* Message + Dismiss X Row */}
                    <div className="flex items-end justify-between gap-2">
                      <p className="text-xs text-slate-600 leading-snug break-words flex-1 min-w-0">
                        {notif.message}
                      </p>
                      {/* Individual X: Dismisses only this notification */}
                      <button
                        type="button"
                        id={`dismiss-notif-${notif.id}`}
                        onClick={(e) => handleDismissNotification(e, notif.id)}
                        className="p-1 -mr-1 -mb-0.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 active:bg-slate-200 transition-colors shrink-0 cursor-pointer"
                        title="Dismiss notification"
                        aria-label={`Dismiss notification: ${notif.title}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
