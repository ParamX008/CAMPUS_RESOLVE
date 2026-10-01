import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  X,
  Shield,
  User,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { COMPLAINT_CATEGORIES } from '../../lib/constants';
import { Profile, IdentityMode } from '../../types';
import { CameraCaptureModal } from '../common/CameraCaptureModal';

interface RaiseComplaintProps {
  user: Profile;
  onSubmitComplaint: (data: {
    student_id: string;
    category: string;
    title: string;
    description: string;
    image_url: string | null;
    identity_mode: IdentityMode;
    department_id: string | null;
  }) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
}

export const RaiseComplaint: React.FC<RaiseComplaintProps> = ({
  user,
  onSubmitComplaint,
  isLoading,
  onCancel,
}) => {
  const [category, setCategory] = useState<string>(COMPLAINT_CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [identityMode, setIdentityMode] = useState<IdentityMode>('identified');
  const [departmentId] = useState<string>('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setValidationError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setValidationError('Image size must be less than 10MB.');
      return;
    }

    setValidationError(null);
    setImageFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = (capturedDataUrl: string) => {
    setImageDataUrl(capturedDataUrl);
    setImageFileName(`campus_cam_${Date.now()}.jpg`);
    setValidationError(null);
  };

  const removeImage = () => {
    setImageDataUrl(null);
    setImageFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!category) {
      setValidationError('Please select a complaint category.');
      return;
    }

    if (!description.trim()) {
      setValidationError('Please provide a detailed description of your issue.');
      return;
    }

    if (description.trim().length < 15) {
      setValidationError('Description should be at least 15 characters to provide sufficient context.');
      return;
    }

    const finalTitle = title.trim() || `${category} Grievance (${new Date().toLocaleDateString()})`;

    onSubmitComplaint({
      student_id: user.account_id,
      category,
      title: finalTitle,
      description: description.trim(),
      image_url: imageDataUrl,
      identity_mode: identityMode,
      department_id: departmentId || null,
    });
  };

  const isStudentRestricted = Boolean(
    user.is_restricted &&
    (!user.restriction_until || new Date(user.restriction_until) > new Date())
  );

  return (
    <div className="max-w-2xl mx-auto w-full pb-12 sm:pb-16">
      {/* 1. Top Navigation: Back to Dashboard Button (Compact, Left-Aligned) */}
      <div className="mb-2.5 sm:mb-3">
        <button
          type="button"
          id="back-to-dashboard-btn"
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-medium shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
          <span className="leading-none whitespace-nowrap">Back to Dashboard</span>
        </button>
      </div>

      {/* 2. Page Heading (Left-Aligned, Consistent Spacing) */}
      <div className="mb-4 sm:mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
          Report an Issue
        </h1>
      </div>

      {/* Account Restriction Notice Banner (If Restricted) */}
      {isStudentRestricted && (
        <div className="mb-4 sm:mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
            <Shield className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Complaint Submission Temporarily Restricted</span>
          </div>
          <p className="leading-relaxed text-amber-800">
            {user.restriction_reason
              ? `Account Restriction Reason: "${user.restriction_reason}"`
              : 'Your ability to submit new campus grievances has been restricted under academic grievance conduct policy.'}
          </p>
          {user.restriction_until && (
            <p className="text-[11px] font-medium text-amber-700">
              Restriction Active Until: {new Date(user.restriction_until).toLocaleString()}
            </p>
          )}
          <p className="text-[11px] text-amber-600 italic">
            If you believe this restriction is in error, please contact the Office of the Dean of Student Welfare.
          </p>
        </div>
      )}

      {/* Form Validation Alert (If Any) */}
      {validationError && (
        <div className="mb-4 sm:mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold block mb-0.5">Please check the form:</span>
            <span className="leading-relaxed">{validationError}</span>
          </div>
        </div>
      )}

      {/* Main Form: Consistent Spacing Rhythm Between Sections */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Section 1: Select Category */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
          <div className="mb-3">
            <label className="block text-xs sm:text-sm font-semibold text-slate-900 mb-0.5">
              1. Select Category <span className="text-rose-500 font-normal ml-0.5">*</span>
            </label>
            <p className="text-xs text-slate-500">
              Choose the category that best describes your grievance:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
            {COMPLAINT_CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <button
                  type="button"
                  key={cat}
                  id={`cat-btn-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  onClick={() => setCategory(cat)}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 sm:p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-primary-light border-primary text-primary-dark font-semibold ring-1 ring-primary/30 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200/90 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Complaint Details */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5 sm:space-y-4">
          <div>
            <label
              htmlFor="complaint-title-input"
              className="block text-xs sm:text-sm font-semibold text-slate-900 mb-1.5"
            >
              2. Title / Short Subject <span className="text-slate-400 font-normal text-xs ml-0.5">(Optional)</span>
            </label>
            <input
              id="complaint-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Water leakage in Room 304 / Projector failure in Hall B"
              className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="complaint-description-input"
                className="block text-xs sm:text-sm font-semibold text-slate-900"
              >
                Detailed Description <span className="text-rose-500 font-normal ml-0.5">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {description.length} chars
              </span>
            </div>
            <textarea
              id="complaint-description-input"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the exact location (Block, Floor, Room #), what happened, when it started, and any immediate hazards..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-colors leading-relaxed"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              Providing specific details helps administrators assign the right maintenance team quickly.
            </p>
          </div>
        </div>

        {/* Section 3: Visual Evidence / Image (Optional) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-900 mb-0.5">
                3. Visual Evidence / Image <span className="text-slate-400 font-normal text-xs ml-0.5">(Optional)</span>
              </label>
              <p className="text-xs text-slate-500">
                Snap a photo with your mobile camera or upload from device gallery
              </p>
            </div>
            <ImageIcon className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
          </div>

          {imageDataUrl ? (
            <div className="relative mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2 sm:p-2.5">
              <div className="relative max-h-64 w-full flex items-center justify-center bg-black/5 rounded-lg overflow-hidden">
                <img
                  src={imageDataUrl}
                  alt="Evidence preview"
                  className="max-h-60 object-contain rounded-md"
                />
              </div>

              <div className="mt-2.5 flex items-center justify-between px-1.5 gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{imageFileName || 'Photo attached'}</span>
                </div>
                <button
                  type="button"
                  id="remove-image-btn"
                  onClick={removeImage}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-medium transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mt-3">
              {/* Take Photo with Camera */}
              <button
                type="button"
                id="open-camera-btn"
                onClick={() => setIsCameraOpen(true)}
                className="w-full min-h-[68px] p-3.5 rounded-xl border border-dashed border-slate-200 hover:border-primary-border bg-slate-50/70 hover:bg-primary-light/30 text-slate-900 transition-all flex items-center gap-3 group cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold block text-slate-900">Take Camera Photo</span>
                  <span className="text-[11px] text-slate-500 block truncate">Ideal for mobile reporting</span>
                </div>
              </button>

              {/* Upload from device */}
              <button
                type="button"
                id="upload-file-btn"
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[68px] p-3.5 rounded-xl border border-dashed border-slate-200 hover:border-primary-border bg-slate-50/70 hover:bg-primary-light/30 text-slate-900 transition-all flex items-center gap-3 group cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-200/80 text-slate-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold block text-slate-900">Upload Image File</span>
                  <span className="text-[11px] text-slate-500 block truncate">PNG, JPG, WEBP up to 10MB</span>
                </div>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Section 4: Identity Preference */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
          <div className="mb-3">
            <label className="block text-xs sm:text-sm font-semibold text-slate-900 mb-0.5">
              4. Identity Preference <span className="text-rose-500 font-normal ml-0.5">*</span>
            </label>
            <p className="text-xs text-slate-500">
              Choose whether your name is visible to staff or submitted anonymously:
            </p>
          </div>

          <div className="space-y-2.5">
            {/* Submit with my identity */}
            <div
              id="identity-mode-identified"
              role="button"
              tabIndex={0}
              onClick={() => setIdentityMode('identified')}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  setIdentityMode('identified');
                }
              }}
              className={`w-full p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 text-left ${
                identityMode === 'identified'
                  ? 'bg-primary-light border-primary ring-1 ring-primary/30'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              {/* Left Icon */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  identityMode === 'identified'
                    ? 'bg-primary-light text-primary'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <User className="w-4 h-4" />
              </div>

              {/* Center Content */}
              <div className="flex-1 min-w-0">
                <div
                  className={`text-xs sm:text-sm font-semibold ${
                    identityMode === 'identified' ? 'text-primary-dark' : 'text-slate-900'
                  }`}
                >
                  Submit with my identity
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Name ({user.name}) will be shown to staff for direct follow-up.
                </p>
              </div>

              {/* Right Radio Indicator */}
              <div className="shrink-0 flex items-center justify-center">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    identityMode === 'identified'
                      ? 'border-primary bg-primary'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {identityMode === 'identified' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </div>

            {/* Submit anonymously */}
            <div
              id="identity-mode-anonymous"
              role="button"
              tabIndex={0}
              onClick={() => setIdentityMode('anonymous')}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  setIdentityMode('anonymous');
                }
              }}
              className={`w-full p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 text-left ${
                identityMode === 'anonymous'
                  ? 'bg-primary-light border-primary ring-1 ring-primary/30'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              {/* Left Icon */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  identityMode === 'anonymous'
                    ? 'bg-primary-light text-primary'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <EyeOff className="w-4 h-4" />
              </div>

              {/* Center Content */}
              <div className="flex-1 min-w-0">
                <div
                  className={`text-xs sm:text-sm font-semibold ${
                    identityMode === 'anonymous' ? 'text-primary-dark' : 'text-slate-900'
                  }`}
                >
                  Submit anonymously
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Your identity will remain hidden from administrators.
                </p>
              </div>

              {/* Right Radio Indicator */}
              <div className="shrink-0 flex items-center justify-center">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    identityMode === 'anonymous'
                      ? 'border-primary bg-primary'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {identityMode === 'anonymous' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Neutral Handling Information Message */}
          <div className="mt-3.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Your submission is handled according to campus reporting procedures.</span>
          </div>
        </div>

        {/* Action Buttons: Mobile-first stacked layout, desktop side-by-side */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-1 sm:pt-2">
          <button
            type="button"
            id="cancel-complaint-btn"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto min-h-[44px] px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-sm font-medium transition-colors text-center cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            id="submit-complaint-btn"
            type="submit"
            disabled={isLoading || isStudentRestricted}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-semibold text-sm shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting...</span>
              </span>
            ) : isStudentRestricted ? (
              <>
                <Shield className="w-4 h-4" />
                <span>Account Restricted</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Complaint</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};
