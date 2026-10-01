import React, { useState } from 'react';
import { Database, Copy, Check, Shield, Layers, FileCode } from 'lucide-react';
import { Modal } from '../common/Modal';
import { SUPABASE_SQL_SCHEMA, isSupabaseConfigured } from '../../lib/supabase';

interface DatabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supabase PostgreSQL Architecture"
      subtitle="Part 1 Database Schema, Tables, Indexes, and Row Level Security (RLS) Policies"
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Status card */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200/60">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">Unified PostgreSQL Engine</p>
              <p className="text-[11px] text-slate-600">
                Both Student and Admin portals are connected to this exact schema with real-time sync.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isSupabaseConfigured
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {isSupabaseConfigured ? 'Remote Supabase Active' : 'Live Express/Postgres Engine Active'}
            </span>

            <button
              id="copy-sql-btn"
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied SQL
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy SQL Script
                </>
              )}
            </button>
          </div>
        </div>

        {/* Schema Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-900 font-semibold mb-1">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Core Tables</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">profiles</code>,{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">departments</code>,{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">complaints</code>, and{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">complaint_updates</code>.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-900 font-semibold mb-1">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>RLS & Role Gating</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Students can only query/insert their own records. Admins have triage authority. Anonymous metadata is masked.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-900 font-semibold mb-1">
              <FileCode className="w-4 h-4 text-amber-600" />
              <span>Part 2 AI Fields</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Pre-provisioned columns for Gemini AI category classification, summarization, and safety flagging.
            </p>
          </div>
        </div>

        {/* Code block */}
        <div className="relative">
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[380px] leading-relaxed selection:bg-blue-500/40">
            {SUPABASE_SQL_SCHEMA}
          </pre>
        </div>
      </div>
    </Modal>
  );
};
