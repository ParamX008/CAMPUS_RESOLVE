import React, { useState, useRef, useEffect } from 'react';
import {
  User as UserIcon,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { Profile } from '../../types';
import { NotificationCenter } from './NotificationCenter';

interface NavbarProps {
  user: Profile | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onSelectComplaint?: (complaintId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  onTabChange,
  onLogout,
  onSelectComplaint,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] shadow-2xs">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Official College Logo only */}
          <div className="flex items-center min-w-0 pr-2">
            <button
              onClick={() => onTabChange(isStudent ? 'dashboard' : 'admin-dashboard')}
              className="flex items-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E21B23] rounded-lg py-1 transition-opacity hover:opacity-95 min-w-0 cursor-pointer"
              aria-label="Campus Portal Home"
            >
              <img
                src="/supreme-knowledge-foundation-logo.png"
                alt="Supreme Knowledge Foundation Logo"
                className="h-10 sm:h-12 w-auto max-w-[170px] sm:max-w-[320px] object-contain select-none"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  if (e.currentTarget.src.includes('supreme-knowledge-foundation-logo.png')) {
                    e.currentTarget.src = '/college-logo.png';
                  }
                }}
              />
            </button>
          </div>

          {/* Right: Notification Bell + User Avatar Profile Dropdown aligned on baseline */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <>
                {/* Notification Bell */}
                <NotificationCenter
                  user={user}
                  onSelectComplaint={onSelectComplaint}
                />

                {/* User Profile Avatar with Dropdown */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    id="user-profile-menu-btn"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E21B23] cursor-pointer"
                    aria-label="User account menu"
                    aria-expanded={profileDropdownOpen}
                  >
                    <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 text-[#E21B23] flex items-center justify-center text-xs font-bold uppercase shadow-2xs shrink-0">
                      {user.name ? user.name.charAt(0) : 'U'}
                    </div>
                    <div className="hidden sm:flex flex-col text-left leading-tight">
                      <span className="text-xs font-bold text-[#111827] max-w-[140px] truncate">
                        {user.name}
                      </span>
                      <span className="text-[10px] font-medium text-[#64748B] capitalize">
                        {isAdmin ? 'Administrator' : 'Student'}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-[#E2E8F0] shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                      <div className="px-3.5 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-[#111827] truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-[#64748B] capitalize">
                          {user.role} Portal • {user.account_id}
                        </p>
                      </div>

                      {/* Profile Access */}
                      <button
                        id="dropdown-profile-btn"
                        onClick={() => {
                          onTabChange(isStudent ? 'profile' : 'admin-profile');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#111827] hover:bg-slate-50 transition-colors text-left cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>{isStudent ? 'Student Profile' : 'Admin Profile'}</span>
                      </button>

                      <div className="my-1 border-t border-slate-100" />

                      {/* Log Out */}
                      <button
                        id="dropdown-logout-btn"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left font-semibold cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

