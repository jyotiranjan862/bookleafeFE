import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthorLayout } from "../../components/layout/AuthorLayout";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { bookApi } from "../../api/bookApi";
import { ticketApi } from "../../api/ticketApi";
import type { BookDropdownItem } from "../../types";
import {
  Send,
  BookOpen,
  Sparkles,
  AlertCircle,
  Tag,
} from "lucide-react";

const QUERY_TEMPLATES = [
  {
    label: "Royalty & Settlement",
    subject: "Quarterly Royalty Payout Settlement Inquiry",
    placeholder: "Please specify the quarter (e.g. Q3), sales discrepancy observed, or bank settlement date inquiry...",
  },
  {
    label: "Distribution & Stock",
    subject: "Listing Currently Unavailable on Amazon / Flipkart",
    placeholder: "Specify which retailer (Amazon IN, Flipkart, Amazon US) and the listing URL or ASIN if available...",
  },
  {
    label: "Print Quality Defect",
    subject: "Defective / Damaged Print Copies Received",
    placeholder: "Describe the print defect (binding flaw, cover alignment, page sequencing) and number of affected copies...",
  },
  {
    label: "ISBN & Catalog",
    subject: "BookLeaf ISBN & Metadata Update Request",
    placeholder: "Detail the ISBN discrepancy or metadata correction needed for your title...",
  },
  {
    label: "Production Timeline",
    subject: "Update on Current Publication Production Stage",
    placeholder: "Inquire about proofreading revisions, cover design iterations, or printing dispatch timelines...",
  },
];

export function AuthorNewTicketPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [books, setBooks] = useState<BookDropdownItem[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>(
    searchParams.get("bookId") || ""
  );
  const bookTitleParam = searchParams.get("bookTitle");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const list = await bookApi.getDropdownBooks();
        setBooks(Array.isArray(list) ? list : (list as any)?.books || []);
      } catch (err) {
        console.error("Failed to load books for dropdown:", err);
        setBooks([]);
      }
    };
    loadBooks();
  }, []);

  const handleSelectTemplate = (template: typeof QUERY_TEMPLATES[0]) => {
    setActiveTemplate(template.label);
    if (!subject.trim() || QUERY_TEMPLATES.some((t) => t.subject === subject)) {
      setSubject(template.subject);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError("Please provide both a subject and a detailed description.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await ticketApi.createTicket({
        bookId: selectedBookId || undefined,
        subject: subject.trim(),
        description: description.trim(),
      });
      navigate("/author/tickets");
    } catch (err: any) {
      setError(err?.message || "Failed to create support query. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (subject.trim() || description.trim()) {
      setShowDiscardConfirm(true);
    } else {
      navigate("/author/tickets");
    }
  };

  return (
    <AuthorLayout
      title="Submit Support Query"
      subtitle="Direct triage routing to BookLeaf author support and royalty team"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* SLA Information Card */}
        <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-5 flex items-start gap-3.5 shadow-xs">
          <Sparkles className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950 leading-relaxed">
            <span className="font-bold block text-sm mb-0.5 text-emerald-950">
              Guaranteed 48-Hour Author SLA
            </span>
            All inquiries are analyzed by our automated intake engine and routed immediately to
            dedicated operations executives. Royalty, ISBN, and print defects receive urgent priority triage.
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Topic Presets */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>Select Query Category Preset (Optional)</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {QUERY_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.label}
                type="button"
                onClick={() => handleSelectTemplate(tmpl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  activeTemplate === tmpl.label
                    ? "bg-emerald-50 text-emerald-950 border-emerald-600 ring-1 ring-emerald-500 shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket Submission Form */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Associated Book Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-800" />
                  <span>Associated Published Book (Optional)</span>
                </label>
                {selectedBookId && (
                  <button
                    type="button"
                    onClick={() => setSelectedBookId("")}
                    className="text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              {bookTitleParam && selectedBookId && (
                <div className="mb-2 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                  <span className="font-medium">
                    Pre-selected: <strong>{decodeURIComponent(bookTitleParam)}</strong>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono">Catalog Ref</span>
                </div>
              )}

              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-700 text-xs font-medium transition-colors"
              >
                <option value="">General Query (Not tied to a specific title)</option>
                {(books || []).map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.title} (ISBN: {b.isbn || "N/A"})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Linking a title allows support executives to cross-reference sales numbers and distribution channels instantly.
              </p>
            </div>

            {/* Subject */}
            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                Query Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Q3 Royalty Calculation Discrepancy"
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-emerald-700 text-xs transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="font-bold text-slate-800 block mb-1.5 flex items-center justify-between">
                <span>Detailed Description <span className="text-red-500">*</span></span>
                <span className="text-[11px] font-normal text-slate-400">
                  {description.length} characters
                </span>
              </label>
              <textarea
                rows={6}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  activeTemplate
                    ? QUERY_TEMPLATES.find((t) => t.label === activeTemplate)?.placeholder
                    : "Please describe your query or problem in detail. Include dates, retailer channels, or relevant ISBN figures if applicable..."
                }
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-700 text-xs leading-relaxed transition-colors"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold shadow-xs transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? "Submitting Query..." : "Submit Support Query"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Discard Confirmation Dialog */}
      <ConfirmModal
        isOpen={showDiscardConfirm}
        title="Discard Support Query?"
        message="You have unsaved changes in your ticket. If you discard, all typed information will be lost."
        confirmText="Discard & Exit"
        confirmVariant="danger"
        icon="warning"
        onConfirm={() => {
          setShowDiscardConfirm(false);
          navigate("/author/tickets");
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </AuthorLayout>
  );
}
