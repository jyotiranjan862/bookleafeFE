import React, { useState, useEffect, useRef } from "react";
import { bookApi } from "../../api/bookApi";
import { ticketApi } from "../../api/ticketApi";
import { getApiErrorMessage } from "../../api/client";
import type { BookDropdownItem, Ticket, TicketAttachment } from "../../types";
import {
  X,
  Send,
  BookOpen,
  Sparkles,
  AlertCircle,
  Tag,
  Loader2,
  Paperclip,
  FileText,
  Trash2,
  UploadCloud,
  Check,
  DollarSign,
  Truck,
  AlertTriangle,
  Bookmark,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

interface QueryTemplate {
  id: string;
  label: string;
  icon: React.ElementType;
  subject: string;
  placeholder: string;
  suggestedCategory: string;
}

const QUERY_TEMPLATES: QueryTemplate[] = [
  {
    id: "royalty",
    label: "Royalty & Settlement",
    icon: DollarSign,
    subject: "Quarterly Royalty Payout Settlement Inquiry",
    placeholder:
      "Please specify the settlement quarter (e.g., Q3-2025), sales discrepancy observed, or bank account disbursement confirmation inquiry...",
    suggestedCategory: "Royalty & Payments",
  },
  {
    id: "distribution",
    label: "Distribution & Stock",
    icon: Truck,
    subject: "Listing Currently Unavailable on Amazon / Flipkart",
    placeholder:
      "Specify which retail platform (Amazon IN, Flipkart, BookLeaf Store), the listing URL, ASIN / ISBN, and how long the title has shown out of stock...",
    suggestedCategory: "Distribution & Stock",
  },
  {
    id: "defect",
    label: "Print Quality Defect",
    icon: AlertTriangle,
    subject: "Defective / Damaged Print Copies Received",
    placeholder:
      "Describe the print defect (e.g. binding failure, spine misalignment, inverted page sequencing, color bleeding) and total affected copies...",
    suggestedCategory: "Print Quality & Defects",
  },
  {
    id: "isbn",
    label: "ISBN & Catalog",
    icon: Bookmark,
    subject: "BookLeaf ISBN & Metadata Update Request",
    placeholder:
      "Detail the ISBN discrepancy, barcode barcode mapping, author name misspelling, or metadata correction needed for your published title...",
    suggestedCategory: "ISBN & Metadata",
  },
  {
    id: "timeline",
    label: "Production Timeline",
    icon: Clock,
    subject: "Update on Current Publication Production Stage",
    placeholder:
      "Inquire about ongoing proofreading corrections, book cover design revisions, typesetting approval, or print dispatch timelines...",
    suggestedCategory: "Publishing Process",
  },
];

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ticket: Ticket) => void;
  initialBookId?: string;
  initialBookTitle?: string;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialBookId,
  initialBookTitle,
}) => {
  const [books, setBooks] = useState<BookDropdownItem[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState(initialBookId || "");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  // Cloudinary Attachments State
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const data = await bookApi.getDropdownBooks();
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

  const handleApplyTemplate = (tmpl: QueryTemplate) => {
    setSelectedTemplateId(tmpl.id);
    setSubject(tmpl.subject);
    setDescription(tmpl.placeholder);
  };

  const handleFileChange = async (file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds 10 MB limit. Please select a smaller file.");
      return;
    }

    if (attachments.length >= 3) {
      setUploadError("Maximum 3 attachments allowed per query.");
      return;
    }

    try {
      setUploadingFile(true);
      setUploadError(null);
      const uploaded = await ticketApi.uploadAttachment(file);
      setAttachments((prev) => [...prev, uploaded]);
    } catch (err: unknown) {
      setUploadError(getApiErrorMessage(err) || "Failed to upload file to Cloudinary");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      // Reset form
      setSubject("");
      setDescription("");
      setSelectedBookId("");
      setSelectedTemplateId(null);
      setAttachments([]);
      onSuccess(ticket);
      onClose();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBook = books.find((b) => b._id === selectedBookId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Brand Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-800" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100/70 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-emerald-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Submit Support Query
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Live Triage
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Direct algorithmic routing to BookLeaf author support, production & royalty executives
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={submitting || uploadingFile}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Unable to submit query: </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Quick Query Templates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Quick Query Templates</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Click to auto-format inquiry</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {QUERY_TEMPLATES.map((tmpl) => {
                const IconComponent = tmpl.icon;
                const isSelected = selectedTemplateId === tmpl.id;

                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className={`group px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-emerald-800 text-white border-emerald-800 shadow-xs ring-2 ring-emerald-200"
                        : "bg-slate-50 hover:bg-emerald-50/80 hover:border-emerald-300 text-slate-700 border-slate-200"
                    }`}
                  >
                    <IconComponent
                      className={`w-3.5 h-3.5 ${
                        isSelected ? "text-white" : "text-slate-500 group-hover:text-emerald-700"
                      }`}
                    />
                    <span>{tmpl.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-200 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catalog Book Selection */}
          <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-800" />
                <span>Related Book Title (Optional)</span>
              </label>
              {selectedBook && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-900 border border-emerald-200 font-bold">
                  {selectedBook.isbn ? `ISBN: ${selectedBook.isbn}` : "Catalog Match"}
                </span>
              )}
            </div>

              <select
              value={selectedBookId}
              onChange={(e) => {
                setSelectedBookId(e.target.value);
              }}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-colors shadow-xs"
            >
              <option value="">General / Account Level (No specific book)</option>
              {initialBookId && initialBookTitle && !books.some((b) => b._id === initialBookId) && (
                <option value={initialBookId}>{initialBookTitle}</option>
              )}
              {loadingBooks ? (
                <option disabled value="">Loading catalog titles...</option>
              ) : (
                books.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.title} {b.isbn ? `— ISBN: ${b.isbn}` : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Subject Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-800" />
                <span>Subject / Issue Summary <span className="text-red-500">*</span></span>
              </label>
              <span
                className={`text-[10px] font-mono ${
                  subject.length > 250 ? "text-amber-600 font-bold" : "text-slate-400"
                }`}
              >
                {subject.length}/300
              </span>
            </div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Discrepancy observed in Q3 author royalty report"
              maxLength={300}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all placeholder-slate-400"
            />
          </div>

          {/* Description Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>Detailed Description <span className="text-red-500">*</span></span>
              </label>
              <span
                className={`text-[10px] font-mono ${
                  description.trim().length >= 10
                    ? "text-emerald-700 font-bold"
                    : "text-amber-600 font-semibold"
                }`}
              >
                {description.trim().length} chars (min 10)
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Provide specific details including settlement dates, transaction references, retailer URLs, or physical book defect descriptions..."
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all resize-none leading-relaxed placeholder-slate-400"
            />
          </div>

          {/* Cloudinary File Attachment Drag-and-Drop Zone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-emerald-800" />
                <span>Cloudinary Attachments (Optional)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {attachments.length}/3 files attached
              </span>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileChange(file);
              }}
            />

            {/* Drag & Drop Area */}
            {attachments.length < 3 && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileChange(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all group ${
                  isDragOver
                    ? "border-emerald-600 bg-emerald-50/70 scale-[0.99]"
                    : "border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/30 bg-slate-50/40"
                }`}
              >
                {uploadingFile ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
                    <span className="text-xs font-bold text-slate-800">
                      Uploading directly to Cloudinary...
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Generating secure storage stream
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-500 group-hover:text-emerald-700 group-hover:border-emerald-300 flex items-center justify-center transition-colors mb-2 shadow-xs">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 transition-colors">
                      Click to browse or drag & drop attachments
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5 text-center">
                      PNG, JPG, WEBP, or PDF up to 10MB • Saved in Cloudinary cloud storage
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Upload Error Alert */}
            {uploadError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Uploaded Files List */}
            {attachments.length > 0 && (
              <div className="space-y-2 pt-1">
                {attachments.map((att, idx) => {
                  const isImage = att.mimeType.startsWith("image/");

                  return (
                    <div
                      key={att.storageUrl || idx}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-xs"
                    >
                      <div className="flex items-center gap-3 truncate">
                        {isImage ? (
                          <img
                            src={att.storageUrl}
                            alt={att.originalName}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}

                        <div className="truncate">
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {att.originalName}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                            <span>{(att.sizeBytes / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold font-sans">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Cloudinary Stored</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <a
                          href={att.storageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-200/60 transition-colors"
                          title="Open uploaded file"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Remove attachment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Priority Author SLA • Tracked under BookLeaf Support Policy</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting || uploadingFile}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingFile}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Ticket...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Support Query</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
