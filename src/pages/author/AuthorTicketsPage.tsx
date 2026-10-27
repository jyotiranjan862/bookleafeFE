import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthorLayout } from "../../components/layout/AuthorLayout";
import { ticketApi } from "../../api/ticketApi";
import { CreateTicketModal } from "../../components/tickets/CreateTicketModal";
import { useSocket } from "../../context/SocketContext";
import type { Ticket } from "../../types";
import {
  PlusCircle,
  RefreshCw,
  Search,
  Send,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Paperclip,
  FileText,
  ExternalLink,
  User,
  Shield,
  Clock,
} from "lucide-react";
import { STATUSES } from "../../utils/constants";

function getTimeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function renderSlaBadge(t: Ticket) {
  if (t.status === "Resolved" || t.status === "Closed") {
    return (
      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
        SLA Met
      </span>
    );
  }

  const targetHours = t.priority === "Critical" ? 24 : t.priority === "High" ? 48 : 72;
  const elapsedHours = (Date.now() - new Date(t.createdAt).getTime()) / 3600000;
  const remainingHours = Math.round(targetHours - elapsedHours);

  if (remainingHours > 0) {
    return (
      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
        {remainingHours}h left
      </span>
    );
  } else {
    return (
      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-red-50 text-red-700 border border-red-200 animate-pulse">
        {Math.abs(remainingHours)}h overdue
      </span>
    );
  }
}

export function AuthorTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Create Ticket Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const initialBookId = searchParams.get("bookId") || undefined;

  // Slide-over Thread Modal
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.messages?.length, selectedTicket?._id]);

  const { socket, joinTicket, leaveTicket } = useSocket();

  // Auto-open modal if URL has ?new=true or ?bookId=...
  useEffect(() => {
    if (searchParams.get("new") === "true" || searchParams.get("bookId")) {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
      };
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await ticketApi.getMyTickets(params);
      setTickets(res.data || []);
      setTotalCount(res.total || (res.data ? res.data.length : 0));
      setTotalPages(res.totalPages || Math.ceil((res.total || 1) / limit) || 1);
    } catch (err: any) {
      console.error("Failed to load support tickets:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setPage(1);
  };

  // Join ticket room when thread drawer is open
  useEffect(() => {
    if (!selectedTicket?._id) return;
    joinTicket(selectedTicket._id);

    return () => {
      leaveTicket(selectedTicket._id);
    };
  }, [selectedTicket?._id, joinTicket, leaveTicket]);

  // Real-time socket event listeners for thread and ticket updates
  useEffect(() => {
    if (!socket) return;

    const handleMessagePosted = (payload: { ticketId: string; message: any }) => {
      if (selectedTicket && payload.ticketId === selectedTicket._id) {
        setSelectedTicket((prev) => {
          if (!prev) return null;
          const exists = prev.messages?.some((m) => m._id === payload.message._id);
          if (exists) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), payload.message],
          };
        });
      }
    };

    const handleTicketUpdated = (payload: { ticketId: string; status?: string; ticket?: any }) => {
      const newStatus = payload.status || payload.ticket?.status;
      if (newStatus) {
        setTickets((prev) =>
          prev.map((t) => (t._id === payload.ticketId ? { ...t, status: newStatus as any } : t))
        );
        if (selectedTicket && selectedTicket._id === payload.ticketId) {
          setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus as any } : null));
        }
      }
    };

    const handleTicketCreated = (payload: { ticket: Ticket }) => {
      if (payload.ticket) {
        setTickets((prev) => {
          if (prev.some((t) => t._id === payload.ticket._id)) return prev;
          return [payload.ticket, ...prev];
        });
      }
    };

    socket.on("MESSAGE_POSTED", handleMessagePosted);
    socket.on("TICKET_UPDATED", handleTicketUpdated);
    socket.on("TICKET_CREATED", handleTicketCreated);

    return () => {
      socket.off("MESSAGE_POSTED", handleMessagePosted);
      socket.off("TICKET_UPDATED", handleTicketUpdated);
      socket.off("TICKET_CREATED", handleTicketCreated);
    };
  }, [socket, selectedTicket]);

  const openTicketDrawer = async (ticket: Ticket) => {
    try {
      setSelectedTicket(ticket);
      setReplyBody("");
      const full = await ticketApi.getTicketById(ticket._id);
      setSelectedTicket(full);
    } catch (err) {
      console.error("Error fetching ticket conversation:", err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyBody.trim()) return;

    try {
      setSendingReply(true);
      await ticketApi.replyToTicket(selectedTicket._id, replyBody.trim());
      const refreshed = await ticketApi.getTicketById(selectedTicket._id);
      setSelectedTicket(refreshed);
      setReplyBody("");
      setSuccessToast("Reply sent to publishing support team");
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      alert(err?.message || "Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const startEntry = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, totalCount);

  return (
    <AuthorLayout
      title="My Support Tickets"
      subtitle="Track your queries, communicate directly with publishing executives, and review updates"
    >
      <div className="space-y-4">
        {/* Toast Alert */}
        {successToast && (
          <div className="fixed top-20 right-8 z-50 bg-emerald-800 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4" />
            <span className="font-medium">{successToast}</span>
          </div>
        )}

        {/* Filter and Action Bar */}
        <div className="bg-white border border-slate-200/90 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex flex-1 items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by ticket #, subject, or query..."
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-700 transition-colors"
              />
            </div>

            <button
              onClick={() => fetchTickets()}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Refresh tickets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-800" : ""}`} />
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              className="bg-slate-50 border border-slate-200/80 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg focus:bg-white focus:outline-none focus:border-emerald-700 font-medium"
            >
              <option value="">All Statuses</option>
              {(Object.values(STATUSES) as string[]).map((st) => (
                <option key={st} value={st}>
                  {st.replace("_", " ")}
                </option>
              ))}
            </select>

            {(statusFilter || search) && (
              <button
                onClick={() => {
                  setStatusFilter("");
                  setSearch("");
                  setPage(1);
                }}
                className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-900 font-semibold"
              >
                Reset
              </button>
            )}

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Submit Query</span>
            </button>
          </div>
        </div>

        {/* Tickets Master Table — Compact Row UI */}
        <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Ticket ID</th>
                  <th className="py-2.5 px-3">Subject & Book</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Timing & SLA</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-800" />
                        <span>Loading support history...</span>
                      </div>
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      You have no tickets matching the current filter.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr
                      key={t._id}
                      onClick={() => openTicketDrawer(t)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Ticket Number */}
                      <td className="py-2 px-3 font-mono font-bold text-emerald-800 whitespace-nowrap text-[11px]">
                        {t.ticketNumber}
                      </td>

                      {/* Subject */}
                      <td className="py-2 px-3 max-w-xs">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors truncate leading-tight">
                          {t.subject}
                        </div>
                        {t.book && typeof t.book === "object" && (
                          <span className="text-[10px] text-slate-500 truncate block mt-0.5">
                            📖 {t.book.title}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {t.category}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            t.priority === "Critical"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : t.priority === "High"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            t.status === STATUSES.OPEN
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : t.status === STATUSES.IN_PROGRESS
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : t.status === STATUSES.RESOLVED
                              ? "bg-slate-100 text-slate-700 border-slate-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}
                        >
                          {t.status.replace("_", " ")}
                        </span>
                      </td>

                      {/* Timing & SLA */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-slate-800 text-[11px] font-semibold">
                              {new Date(t.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({getTimeAgo(t.createdAt)})
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(t.createdAt).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            {renderSlaBadge(t)}
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-2 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openTicketDrawer(t)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-[11px] transition-colors"
                        >
                          View Thread
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Backend Pagination Toolbar */}
          <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <span>
                Showing <strong className="text-slate-900">{startEntry}</strong> to{" "}
                <strong className="text-slate-900">{endEntry}</strong> of{" "}
                <strong className="text-slate-900">{totalCount}</strong> tickets
              </span>

              <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                <span className="text-slate-500">Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-700"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1 || loading}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Prev</span>
              </button>

              <div className="px-2.5 py-0.5 font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg">
                Page {page} of {Math.max(1, totalPages)}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3 h-3" />
              </button>

              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages || loading}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Conversation Slide-Over Drawer with Two-Sided Modern Chat */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedTicket(null)}
          />

          <div className="relative w-full max-w-xl bg-white border-l border-slate-200 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-200 overflow-hidden">
            {/* Top Gradient Brand Accent Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-800" />

            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {selectedTicket.ticketNumber}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      selectedTicket.status === STATUSES.OPEN
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {selectedTicket.status.replace("_", " ")}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {getTimeAgo(selectedTicket.createdAt)}
                  </span>
                  <span className="text-slate-300">•</span>
                  {renderSlaBadge(selectedTicket)}
                </div>

                <h2 className="text-base font-bold text-slate-900 leading-snug">
                  {selectedTicket.subject}
                </h2>

                {selectedTicket.book && typeof selectedTicket.book === "object" && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-mono">
                    <span>📖 Related Title:</span>
                    <strong className="text-slate-800 font-sans">{selectedTicket.book.title}</strong>
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Two-Sided Interactive Chat Timeline */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40">
              <div className="flex items-center justify-center my-1">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                  Ticket Submitted • {new Date(selectedTicket.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>

              {/* 1. Root Query Message from You (Author) — Right Aligned */}
              <div className="flex items-start justify-end gap-3 max-w-[90%] ml-auto animate-in fade-in">
                <div className="space-y-1 flex-1 flex flex-col items-end">
                  <div className="flex items-center gap-2 pr-1">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                      YOU (AUTHOR)
                    </span>
                    <span className="text-xs font-bold text-slate-800">Original Inquiry</span>
                  </div>

                  <div className="bg-emerald-800 text-white rounded-2xl rounded-tr-xs p-4 shadow-xs text-xs space-y-2.5 max-w-full text-left">
                    <div className="font-bold text-emerald-100 pb-1.5 border-b border-emerald-700/80 flex items-center justify-between">
                      <span>Subject: {selectedTicket.subject}</span>
                    </div>

                    <p className="whitespace-pre-wrap leading-relaxed text-emerald-50">
                      {selectedTicket.description}
                    </p>

                    {/* Attached Evidence in Root Query */}
                    {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                      <div className="pt-2 border-t border-emerald-700/80 space-y-1.5">
                        <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider flex items-center gap-1">
                          <Paperclip className="w-3 h-3 text-emerald-200" />
                          <span>Attached Evidence ({selectedTicket.attachments.length})</span>
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          {selectedTicket.attachments.map((att, idx) => {
                            const isImg = att.mimeType?.startsWith("image/");
                            return (
                              <a
                                key={att.storageUrl || idx}
                                href={att.storageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 p-2 rounded-xl bg-emerald-900/60 border border-emerald-700 hover:border-emerald-400 transition-all group"
                              >
                                {isImg ? (
                                  <img
                                    src={att.storageUrl}
                                    alt={att.originalName}
                                    className="w-9 h-9 rounded-lg object-cover border border-emerald-600 shrink-0 bg-white"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                )}
                                <div className="truncate flex-1">
                                  <span className="text-[11px] font-bold text-white group-hover:text-emerald-200 block truncate">
                                    {att.originalName}
                                  </span>
                                  <span className="text-[9px] text-emerald-300 font-mono block">
                                    {(att.sizeBytes / 1024).toFixed(1)} KB • Cloudinary
                                  </span>
                                </div>
                                <ExternalLink className="w-3 h-3 text-emerald-300 group-hover:text-white shrink-0" />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <User className="w-4 h-4 text-emerald-200" />
                </div>
              </div>

              {/* 2. Conversation Messages Stream */}
              {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                selectedTicket.messages.map((msg, idx) => {
                  const isYou = msg.senderType === "author";
                  const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  if (isYou) {
                    // Author Follow-up Message (Right Aligned)
                    return (
                      <div
                        key={msg._id || idx}
                        className="flex items-start justify-end gap-3 max-w-[85%] ml-auto animate-in fade-in"
                      >
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2 mb-1 pr-1">
                            <span className="text-[10px] text-slate-400 font-mono">{formattedTime}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                              YOU
                            </span>
                          </div>
                          <div className="bg-emerald-800 text-white p-3.5 rounded-2xl rounded-tr-xs text-xs leading-relaxed shadow-xs whitespace-pre-wrap">
                            {msg.body}
                          </div>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                          <User className="w-4 h-4 text-emerald-200" />
                        </div>
                      </div>
                    );
                  }

                  // Staff / Publishing Team Message (Left Aligned)
                  return (
                    <div
                      key={msg._id || idx}
                      className="flex items-start gap-3 max-w-[85%] self-start animate-in fade-in"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-300 shadow-2xs mt-0.5">
                        <Shield className="w-4 h-4 text-emerald-800" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1 pl-1">
                          <span className="text-xs font-bold text-slate-800">
                            BookLeaf Publishing Team
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                            SUPPORT
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{formattedTime}</span>
                        </div>
                        <div className="bg-white border border-slate-200 text-slate-900 p-3.5 rounded-2xl rounded-tl-xs text-xs leading-relaxed shadow-2xs whitespace-pre-wrap">
                          {msg.body}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 italic">
                  Our author operations team has received your ticket and is actively reviewing it.
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Composer Form */}
            {selectedTicket.status !== STATUSES.CLOSED ? (
              <form
                onSubmit={handleSendReply}
                className="p-4 border-t border-slate-200 bg-white"
              >
                <textarea
                  rows={3}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Type your response to the publishing support team..."
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-all resize-none shadow-xs"
                />

                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-[10px] text-slate-400">
                    Replies notify assigned BookLeaf support executive
                  </span>

                  <button
                    type="submit"
                    disabled={sendingReply || !replyBody.trim()}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingReply ? "Sending..." : "Send Reply"}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 border-t border-slate-200 bg-slate-100 text-center text-xs text-slate-500 font-medium">
                This ticket has been marked as resolved and closed.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          if (searchParams.get("new") || searchParams.get("bookId")) {
            setSearchParams({});
          }
        }}
        initialBookId={initialBookId}
        onSuccess={(newTicket) => {
          setTickets((prev) => [newTicket, ...prev]);
          setSuccessToast(`Ticket #${newTicket.ticketNumber} created successfully`);
          setTimeout(() => setSuccessToast(null), 4000);
        }}
      />
    </AuthorLayout>
  );
}
