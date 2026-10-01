import React, { useState } from 'react';
import { Star, MessageSquare, Check, X, Award, AlertCircle } from 'lucide-react';
import { Complaint } from '../../types';
import { api } from '../../lib/api';

interface ComplaintFeedbackModalProps {
  complaint: Complaint;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedComplaint: Complaint) => void;
}

export const ComplaintFeedbackModal: React.FC<ComplaintFeedbackModalProps> = ({
  complaint,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(complaint.feedback_rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState(complaint.feedback_comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await api.submitFeedback(complaint.id, rating, comment.trim());
      if (result && result.error) {
        throw new Error(result.error);
      }

      const updatedComplaint: Complaint = result?.complaint || {
        ...complaint,
        feedback_rating: rating,
        feedback_comment: comment.trim() || null,
        feedback_submitted_at: result?.feedback_submitted_at || new Date().toISOString(),
      };

      setComment('');
      onClose();
      onSuccess(updatedComplaint);
    } catch (err: any) {
      console.error('Feedback submit error:', err);
      setError(err.message || 'Unable to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const starLabels = [
    'Very Dissatisfied',
    'Somewhat Dissatisfied',
    'Neutral / Adequate',
    'Satisfied with Resolution',
    'Exceptional Fast Service',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-amber-50 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
              <Star className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Rate Resolution Quality
              </h2>
              <p className="text-xs text-amber-900/80 font-medium">
                Ticket #{complaint.complaint_id} • Status: {complaint.status}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-xs text-slate-600 font-medium">
              How satisfied are you with the resolution of your grievance by {complaint.department_name || 'campus staff'}?
            </p>

            {/* Interactive Stars */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        isActive
                          ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                          : 'text-slate-200 fill-slate-100 hover:text-amber-200'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="text-xs font-bold text-amber-700">
              {starLabels[(hoverRating || rating) - 1]}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Resolution Feedback Comments (Optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share what went well or how campus services could be further improved..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm shadow-amber-200 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Submit Rating</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
