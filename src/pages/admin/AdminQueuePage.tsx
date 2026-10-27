import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { adminApi } from "../../api/adminApi";
import { useSocket } from "../../context/SocketContext";
import type { Ticket } from "../../types";
import {
  Search,
  RefreshCw,
  Sparkles,
  Send,
  Lock,
  X,
  Bot,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  Clock,
} from "lucide-react";
import { CATEGORIES, PRIORITIES, STATUSES } from "../../utils/constants";

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

export function AdminQueuePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Real Database Queue Counts (Zero Dummy Data)
  const [queueSummary, setQueueSummary] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    critical: 0,
  });

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Selected Ticket for Drawer Management
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Management Drawer State
  const [replyBody, setReplyBody] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [generatingAiDraft, setGeneratingAiDraft] = useState(false);
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const { socket, joinTicket, leaveTicket } = useSocket();

  const loadQueueSummary = useCallback(async () => {
    try {
      const stats = await adminApi.getAnalytics();
      const byStatus = (stats as any)?.byStatus || {};
      const statusList = (stats as any)?.statusList || [];
      const open =
        byStatus["Open"] ??
        (statusList.find((s: any) => s.status === "Open")?.count || 0);
      const inProgress =
        byStatus["In Progress"] ??
        (statusList.find((s: any) => s.status === "In_Progress" || s.status === "In Progress")?.count || 0);

      setQueueSummary({
        total: stats.total || 0,
        open,
        inProgress,
        critical: 0,
      });
    } catch (e) {
      console.error("Queue summary error:", e);
    }
  }, []);

  useEffect(() => {
    loadQueueSummary();
  }, [loadQueueSummary]);

  // Join ticket room when thread drawer is open
  useEffect(() => {
    if (!selectedTicket?._id) return;
    joinTicket(selectedTicket._id);

    return () => {
      leaveTicket(selectedTicket._id);
    };
  }, [selectedTicket?._id, joinTicket, leaveTicket]);

  // Real-time socket event listeners for queue & thread
  useEffect(() => {
    if (!socket) return;

    // 1. When a new ticket is submitted in real-time
    const handleTicketCreated = (payload: { ticket: Ticket }) => {
      if (!payload.ticket) return;

      setTickets((prev) => {
        if (prev.some((t) => t._id === payload.ticket._id)) return prev;
        return [payload.ticket, ...prev];
      });

      setTotalCount((prev) => prev + 1);
      setQueueSummary((prev) => ({
        ...prev,
        total: prev.total + 1,
        open: prev.open + 1,
      }));

      setActionSuccessMessage(`New Ticket #${payload.ticket.ticketNumber} arrived in queue`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    };

    // 2. Real-time messages posted to thread (author responses or team responses)
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

    const handleInternalNotePosted = (payload: { ticketId: string; message: any }) => {
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

    // 3. Real-time ticket status updates
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

    // 4. Real-time AI classification completed in background
    const handleAiClassified = (payload: { ticketId: string; category?: string; priority?: string; ai?: any }) => {
      setTickets((prev) =>
        prev.map((t) =>
          t._id === payload.ticketId
            ? {
                ...t,
                category: payload.category || t.category,
                priority: (payload.priority as any) || t.priority,
              }
            : t
        )
      );

      if (selectedTicket && selectedTicket._id === payload.ticketId) {
        setSelectedTicket((prev) =>
          prev
            ? {
                ...prev,
                category: payload.category || prev.category,
                priority: (payload.priority as any) || prev.priority,
                ai: payload.ai || prev.ai,
              }
            : null
        );
        if (payload.ai?.draftResponse) {
          setAiDraft(payload.ai.draftResponse);
        }
      }
    };

    const handleQueueUpdated = () => {
      loadQueueSummary();
    };

    socket.on("TICKET_CREATED", handleTicketCreated);
    socket.on("MESSAGE_POSTED", handleMessagePosted);
    socket.on("INTERNAL_NOTE_POSTED", handleInternalNotePosted);
    socket.on("TICKET_UPDATED", handleTicketUpdated);
    socket.on("AI_CLASSIFIED", handleAiClassified);
    socket.on("QUEUE_UPDATED", handleQueueUpdated);

    return () => {
      socket.off("TICKET_CREATED", handleTicketCreated);
      socket.off("MESSAGE_POSTED", handleMessagePosted);
      socket.off("INTERNAL_NOTE_POSTED", handleInternalNotePosted);
      socket.off("TICKET_UPDATED", handleTicketUpdated);
      socket.off("AI_CLASSIFIED", handleAiClassified);
      socket.off("QUEUE_UPDATED", handleQueueUpdated);
    };
  }, [socket, selectedTicket, loadQueueSummary]);

  // Fetch Tickets with Pagination and Filtering
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        limit,
      };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (search.trim()) params.search = search.trim();

      const result = await adminApi.getAdminQueue(params);
      setTickets(result.data || []);
      setTotalCount(result.total || (result.data ? result.data.length : 0));
      setTotalPages(result.totalPages || Math.ceil((result.total || 1) / limit) || 1);
    } catch (err: any) {
      console.error("Failed to load ticket queue:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, categoryFilter, priorityFilter, search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Reset to page 1 on filter changes
  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setPage(1);
  };

  // Open Ticket Details in Slide-over Drawer
  const openTicketDrawer = async (ticket: Ticket) => {
    try {
      setSelectedTicket(ticket);
      setAiDraft(null);
      setReplyBody("");
      setIsInternalNote(false);
      const fullTicket = await adminApi.getTicketById(ticket._id);
      setSelectedTicket(fullTicket);
    } catch (err) {
      console.error("Error fetching full ticket:", err);
    }
  };

  // Update Status
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket) return;
    try {
      const updated = await adminApi.updateStatus(selectedTicket._id, newStatus);
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t._id === updated._id ? { ...t, status: updated.status } : t)));
      showToast(`Ticket status updated to ${newStatus}`);
    } catch (err: any) {
      alert(err?.message || "Failed to update status");
    }
  };

  // Update Classification
  const handleClassificationChange = async (category?: string, priority?: string) => {
    if (!selectedTicket) return;
    try {
      const updated = await adminApi.overrideClassification(selectedTicket._id, {
        category: category || selectedTicket.category,
        priority: (priority as any) || selectedTicket.priority,
      });
      setSelectedTicket(updated);
      setTickets((prev) =>
        prev.map((t) =>
          t._id === updated._id ? { ...t, category: updated.category, priority: updated.priority } : t
        )
      );
      showToast("Classification updated successfully");
    } catch (err: any) {
      alert(err?.message || "Failed to update classification");
    }
  };

  // Generate AI Draft Response
  const handleGenerateAiDraft = async () => {
    if (!selectedTicket) return;
    try {
      setGeneratingAiDraft(true);
      const draftResult = await adminApi.generateAiDraft(selectedTicket._id);
      setAiDraft(draftResult.draftResponse);
    } catch (err: any) {
      alert(err?.message || "Failed to generate AI draft");
    } finally {
      setGeneratingAiDraft(false);
    }
  };

  // Post Reply or Internal Note
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyBody.trim()) return;

    try {
      setSendingMessage(true);
      await adminApi.addMessage(selectedTicket._id, replyBody.trim(), isInternalNote);
      const refreshed = await adminApi.getTicketById(selectedTicket._id);
      setSelectedTicket(refreshed);
      setReplyBody("");
      showToast(isInternalNote ? "Internal note recorded" : "Reply sent to author");
    } catch (err: any) {
      alert(err?.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const showToast = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const openCount = tickets.filter((t) => t.status === STATUSES.OPEN).length;
  const inProgressCount = tickets.filter((t) => t.status === STATUSES.IN_PROGRESS).length;
  const criticalCount = tickets.filter((t) => t.priority === PRIORITIES.CRITICAL || t.priority === PRIORITIES.HIGH).length;

  const startEntry = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, totalCount);

  return (
    <AdminLayout
      title="Support Ticket Queue"
      subtitle="Comprehensive triage, AI automated categorization, and SLA management"
    >
      <div className="space-y-6">
        {/* Toast Alert */}
        {actionSuccessMessage && (
          <div className="fixed top-20 right-8 z-50 bg-emerald-700 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4" />
            <span className="font-medium">{actionSuccessMessage}</span>
          </div>
        )}

        {/* Overview Metric Bar in Modern White Theme (100% Real Live DB Metrics) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total in Queue
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {queueSummary.total || totalCount}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Active system queries</span>
          </div>

          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Open / Unassigned
            </span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">
              {queueSummary.open || openCount}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Awaiting staff response</span>
          </div>

          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              In Progress
            </span>
            <span className="text-2xl font-bold text-amber-700 mt-1 block">
              {queueSummary.inProgress || inProgressCount}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Active investigation</span>
          </div>

          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              High / Critical SLA
            </span>
            <span className="text-2xl font-bold text-red-600 mt-1 block">
              {criticalCount}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">&lt; 48h priority target</span>
          </div>
        </div>

        {/* Filter and Search Bar in White Theme */}
        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticket #, subject, or author name..."
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
              />
            </div>

            <button
              onClick={() => fetchTickets()}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-700" : ""}`} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              className="bg-slate-50 border border-slate-200/80 text-slate-700 text-xs px-3 py-2 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
            >
              <option value="">All Statuses</option>
              {(Object.values(STATUSES) as string[]).map((st) => (
                <option key={st} value={st}>
                  {st.replace("_", " ")}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => handleFilterChange(setCategoryFilter, e.target.value)}
              className="bg-slate-50 border border-slate-200/80 text-slate-700 text-xs px-3 py-2 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
            >
              <option value="">All Categories</option>
              {(Object.values(CATEGORIES) as string[]).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => handleFilterChange(setPriorityFilter, e.target.value)}
              className="bg-slate-50 border border-slate-200/80 text-slate-700 text-xs px-3 py-2 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
            >
              <option value="">All Priorities</option>
              {(Object.values(PRIORITIES) as string[]).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {(statusFilter || categoryFilter || priorityFilter || search) && (
              <button
                onClick={() => {
                  setStatusFilter("");
                  setCategoryFilter("");
                  setPriorityFilter("");
                  setSearch("");
                  setPage(1);
                }}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-900 font-semibold"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Master Ticket Table in Clean White Theme */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Timing & SLA</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-emerald-700" />
                        <span>Loading support queue...</span>
                      </div>
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      No tickets match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => {
                    const authorName =
                      typeof t.author === "object" && t.author !== null ? t.author.name : "Author";
                    const authorEmail =
                      typeof t.author === "object" && t.author !== null ? t.author.email : "";

                    return (
                      <tr
                        key={t._id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => openTicketDrawer(t)}
                      >
                        {/* Ticket Number */}
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 whitespace-nowrap">
                          {t.ticketNumber}
                        </td>

                        {/* Subject */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-slate-900 group-hover:text-emerald-800 transition-colors truncate">
                            {t.subject}
                          </div>
                          {t.book && typeof t.book === "object" && (
                            <span className="text-[10px] text-slate-500 truncate block mt-0.5">
                              📖 {t.book.title}
                            </span>
                          )}
                        </td>

                        {/* Author */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{authorName}</div>
                          {authorEmail && (
                            <div className="text-[10px] text-slate-400">{authorEmail}</div>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {t.category}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              t.priority === "Critical"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : t.priority === "High"
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : t.priority === "Medium"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {t.priority}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              t.status === STATUSES.OPEN
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : t.status === STATUSES.IN_PROGRESS
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : t.status === STATUSES.RESOLVED
                                ? "bg-blue-50 text-blue-800 border-blue-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {t.status.replace("_", " ")}
                          </span>
                        </td>

                        {/* Timing & SLA Countdown */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {new Date(t.createdAt).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                              ,{" "}
                              {new Date(t.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 font-mono">
                              {getTimeAgo(t.createdAt)}
                            </span>
                            {renderSlaBadge(t)}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openTicketDrawer(t)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-200 transition-colors"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Professional Pagination Bar */}
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
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
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-600"
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
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <div className="px-3 py-1 font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg">
                Page {page} of {Math.max(1, totalPages)}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages || loading}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Ticket Management Drawer in White Theme */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedTicket(null)}
          />

          <div className="relative w-full max-w-2xl bg-white border-l border-slate-200 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-sm text-emerald-800">
                    {selectedTicket.ticketNumber}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-600 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(selectedTicket.createdAt).toLocaleDateString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(selectedTicket.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({getTimeAgo(selectedTicket.createdAt)})
                  </span>
                  {renderSlaBadge(selectedTicket)}
                </div>
                <h2 className="text-lg font-bold text-slate-900 leading-snug">{selectedTicket.subject}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Author:{" "}
                  <span className="text-slate-800 font-semibold">
                    {typeof selectedTicket.author === "object"
                      ? selectedTicket.author.name
                      : "Author"}
                  </span>{" "}
                  (
                  {typeof selectedTicket.author === "object"
                    ? selectedTicket.author.email
                    : ""}
                  )
                </p>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions & Triage Controls Bar */}
            <div className="p-4 border-b border-slate-200 bg-white grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Update Status
                </label>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-600 font-semibold"
                >
                  {(Object.values(STATUSES) as string[]).map((st) => (
                    <option key={st} value={st}>
                      {st.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Override Priority
                </label>
                <select
                  value={selectedTicket.priority}
                  onChange={(e) => handleClassificationChange(undefined, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-600 font-semibold"
                >
                  {(Object.values(PRIORITIES) as string[]).map((pr) => (
                    <option key={pr} value={pr}>
                      {pr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scrollable Conversation & AI Assistant Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Author Query Description</span>
                  <span className="text-[10px] text-emerald-800 font-mono font-semibold">
                    Original Submission
                  </span>
                </div>
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {/* AI Draft Generator Banner */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <span>BookLeaf AI Knowledge Assistant</span>
                  </div>
                  <button
                    onClick={handleGenerateAiDraft}
                    disabled={generatingAiDraft}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>{generatingAiDraft ? "Generating..." : "Generate AI Draft"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Synthesizes knowledge base guidelines (80% net royalties, distribution, SLAs) into a verified response draft.
                </p>

                {aiDraft && (
                  <div className="mt-3 bg-white border border-emerald-200 rounded-xl p-3.5 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono text-emerald-800 font-bold uppercase">
                        AI Suggested Response
                      </span>
                      <button
                        onClick={() => {
                          setReplyBody(aiDraft);
                          setCopiedDraft(true);
                          setTimeout(() => setCopiedDraft(false), 2000);
                        }}
                        className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-bold"
                      >
                        {copiedDraft ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedDraft ? "Inserted!" : "Insert into Reply"}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {aiDraft}
                    </p>
                  </div>
                )}
              </div>

              {/* Thread History */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Conversation Thread ({selectedTicket.messages?.length || 0})
                </div>

                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((msg, idx) => (
                    <div
                      key={msg._id || idx}
                      className={`p-4 rounded-xl text-xs border ${
                        msg.isInternal
                          ? "bg-amber-50/70 border-amber-200 text-amber-900"
                          : msg.senderType === "admin"
                          ? "bg-slate-50 border-slate-200 text-slate-800"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {typeof msg.sender === "object" ? (msg.sender as any).name : "Team Member"}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase font-bold ${
                              msg.isInternal
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {msg.isInternal ? "INTERNAL NOTE" : msg.senderType}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(msg.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                            ,{" "}
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="text-slate-500">({getTimeAgo(msg.createdAt)})</span>
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No previous messages in this ticket.</p>
                )}
              </div>
            </div>

            {/* Bottom Reply Composer */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800">
                  {isInternalNote ? "Add Staff Note (Internal Only)" : "Send Reply to Author"}
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Internal Staff Note
                  </span>
                </label>
              </div>

              <textarea
                rows={3}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder={
                  isInternalNote
                    ? "Write an internal triage note (invisible to author)..."
                    : "Type response to author or generate from AI..."
                }
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition-colors shadow-xs"
              />

              <div className="flex justify-end mt-2.5">
                <button
                  type="submit"
                  disabled={sendingMessage || !replyBody.trim()}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50 ${
                    isInternalNote
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-emerald-800 hover:bg-emerald-900"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingMessage ? "Sending..." : isInternalNote ? "Save Note" : "Send to Author"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
