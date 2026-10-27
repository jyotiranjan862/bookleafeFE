import React, { useState, useEffect } from "react";
import { bookApi } from "../../api/bookApi";
import { ticketApi } from "../../api/ticketApi";
import { getApiErrorMessage } from "../../api/client";
import type { BookDropdownItem, Ticket } from "../../types";
import {
  X,
  Send,
  BookOpen,
  Sparkles,
  AlertCircle,
  Tag,
  Loader2,
} from "lucide-react";

const QUERY_TEMPLATES = [
  {
    label: "Royalty & Settlement",
    subject: "Quarterly Royalty Payout Settlement Inquiry",
    placeholder:
      "Please specify the quarter (e.g. Q3), sales discrepancy observed, or bank settlement date inquiry...",
  },
  {
    label: "Distribution & Stock",
    subject: "Listing Currently Unavailable on Amazon / Flipkart",
    placeholder:
      "Specify which retailer (Amazon IN, Flipkart, Amazon US) and the listing URL or ASIN if available...",
  },
  {
    label: "Print Quality Defect",
    subject: "Defective / Damaged Print Copies Received",
    placeholder:
      "Describe the print defect (binding flaw, cover alignment, page sequencing) and number of affected copies...",
  },
  {
    label: "ISBN & Catalog",
    subject: "BookLeaf ISBN & Metadata Update Request",
    placeholder:
      "Detail the ISBN discrepancy or metadata correction needed for your title...",
  },
  {
    label: "Production Timeline",
    subject: "Update on Current Publication Production Stage",
    placeholder:
      "Inquire about proofreading revisions, cover design iterations, or printing dispatch timelines...",
  },
];

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ticket: Ticket) => void;
  initialBookId?: string;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialBookId,
}) => {
  const [books, setBooks] = useState<BookDropdownItem[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState(initialBookId || "");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialBookId) {
      setSelectedBookId(initialBookId);
    }
  }, [initialBookId]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchBooks = async () => {
      try {
        setLoadingBooks(true);
        const data = await bookApi.getMyBooksDropdown();
        if (isMounted) setBooks(data);
      } catch (err) {
        console.error("Failed to load author books dropdown:", err);
      } finally {
        if (isMounted) setLoadingBooks(false);
      }
    };

    fetchBooks();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyTemplate = (template: (typeof QUERY_TEMPLATES)[0]) => {
    if (!subject.trim() || QUERY_TEMPLATES.some((t) => t.subject === subject)) {
      setSubject(template.subject);
    }
    if (!description.trim()) {
      setDescription(template.placeholder);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSubject = subject.trim();
    const cleanDescription = description.trim();

    if (!cleanSubject || !cleanDescription) {
      setError("Please provide both a subject and a detailed description.");
      return;
    }
    if (cleanSubject.length < 5) {
      setError("Subject must be at least 5 characters.");
      return;
    }
    if (cleanDescription.length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const ticket = await ticketApi.createTicket({
        bookId: selectedBookId || undefined,
        subject: cleanSubject,
        description: cleanDescription,
      });

      // Reset form
      setSubject("");
      setDescription("");
      setSelectedBookId("");
      onSuccess(ticket);
      onClose();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Submit Support Query
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct triage routing to BookLeaf author support and royalty team
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Unable to submit query: </span>
                {error}
              </div>
            </div>
          )}

          {/* Quick Query Templates */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Quick Query Templates</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUERY_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.label}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 rounded-lg text-slate-700 transition-colors"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Book Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>Related Book (Optional)</span>
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-700 transition-colors"
            >
              <option value="">General Support / No Specific Book</option>
              {books.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.title} {b.isbn ? `(ISBN: ${b.isbn})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Field */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>Subject / Issue Summary <span className="text-red-500">*</span></span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {subject.length}/300
              </span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Discrepancy observed in Q3 author royalty report"
              maxLength={300}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-700 transition-colors"
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>
                Detailed Description <span className="text-red-500">*</span>
              </span>
              <span
                className={`text-[10px] font-mono ${
                  description.trim().length < 10
                    ? "text-amber-600 font-bold"
                    : "text-slate-400"
                }`}
              >
                {description.trim().length} chars (min 10)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Provide specific details including dates, transaction numbers, retailer URLs, or proof reading references..."
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-700 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Query...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
