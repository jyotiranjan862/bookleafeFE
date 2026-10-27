import { useState, useEffect, useCallback, useRef } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { adminApi } from "../../api/adminApi";
import { useSocket } from "../../context/SocketContext";
import { useAuthContext } from "../../context/AuthContext";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import type { Ticket } from "../../types";
import {
  Search,
  RefreshCw,
  Sparkles,
  Send,
  Lock,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  Clock,
  UserCheck,
  UserPlus,
  Flame,
  Paperclip,
  ExternalLink,
  User,
  Shield,
  ChevronDown,
  ChevronUp,
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

  const { user } = useAuthContext();

  // Filters & Quick Views
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [quickView, setQuickView] = useState<"all" | "urgent" | "oldest">("all");

  // Selected Ticket for Drawer Management
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Confirmation Modal & Pending Action State
  const [pendingAction, setPendingAction] = useState<{
    type: "status" | "category" | "priority" | "assign" | "unassign";
    title: string;
    message: string;
    confirmText: string;
    confirmVariant: "danger" | "primary" | "warning";
    payload?: any;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showTriageControls, setShowTriageControls] = useState(false);

  // Management Drawer State
  const [replyBody, setReplyBody] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [generatingAiDraft, setGeneratingAiDraft] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.messages?.length, selectedTicket?._id]);

  const { socket, joinTicket, leaveTicket } = useSocket();

  const loadQueueSummary = useCallback(async () => {
    try {
      const stats = await adminApi.getAnalytics();
      const byStatus = (stats as any)?.byStatus || {};
      const statusList = (stats as any)?.statusList || [];
      const byPriority = (stats as any)?.byPriority || {};
      const priorityList = (stats as any)?.priorityList || [];

      const open =
        byStatus["Open"] ??
        (statusList.find((s: any) => s.status === "Open")?.count || 0);
      const inProgress =
        byStatus["In Progress"] ??
        (statusList.find((s: any) => s.status === "In_Progress" || s.status === "In Progress")?.count || 0);

      const critical =
        (byPriority["Critical"] || 0) + (byPriority["High"] || 0) ||
        priorityList
          .filter((p: any) => p.priority === "Critical" || p.priority === "High")
          .reduce((sum: number, p: any) => sum + (p.count || 0), 0);

      setQueueSummary({
        total: stats.total || 0,
        open,
        inProgress,
        critical,
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

  // Fetch Tickets with Pagination, Date Filtering, and Quick Sorting
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

      // Quick views logic: "urgent" (Critical) or "oldest" (Ascending createdAt)
      if (quickView === "urgent") {
        params.priority = "Critical";
      } else if (quickView === "oldest") {
        params.sort = "createdAt";
        params.order = "asc";
      }

      // Date filtering logic
      if (dateFilter === "today") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        params.from = start.toISOString();
      } else if (dateFilter === "7d") {
        const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        params.from = start.toISOString();
      } else if (dateFilter === "30d") {
        const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        params.from = start.toISOString();
      }

      const result = await adminApi.getAdminQueue(params);
      setTickets(result.data || []);
      setTotalCount(result.total || (result.data ? result.data.length : 0));
      setTotalPages(result.totalPages || Math.ceil((result.total || 1) / limit) || 1);
    } catch (err: any) {
      console.error("Failed to load ticket queue:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, categoryFilter, priorityFilter, dateFilter, quickView, search]);

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
      setReplyBody("");
      setIsInternalNote(false);
      const fullTicket = await adminApi.getTicketById(ticket._id);
      setSelectedTicket(fullTicket);
    } catch (err) {
      console.error("Error fetching full ticket:", err);
    }
  };

  // Trigger Confirmation Modals Before Critical Actions
  const requestStatusChange = (newStatus: string) => {
    if (!selectedTicket || newStatus === selectedTicket.status) return;
    setPendingAction({
      type: "status",
      title: `Confirm Status Change: ${newStatus.replace("_", " ")}`,
      message: `Are you sure you want to transition ticket ${selectedTicket.ticketNumber} to "${newStatus.replace("_", " ")}"? This will immediately update the author's triage timeline and SLA tracking.`,
      confirmText: `Confirm Status Change`,
      confirmVariant:
        newStatus === STATUSES.CLOSED || newStatus === STATUSES.RESOLVED
          ? "primary"
          : "warning",
      payload: { newStatus },
    });
  };

  const requestCategoryChange = (newCategory: string) => {
    if (!selectedTicket || newCategory === selectedTicket.category) return;
    setPendingAction({
      type: "category",
      title: "Confirm Category Override",
      message: `Re-classify ticket ${selectedTicket.ticketNumber} to category "${newCategory}"? This will override the AI classifier recommendation.`,
      confirmText: "Override Category",
      confirmVariant: "warning",
      payload: { category: newCategory },
    });
  };

  const requestPriorityChange = (newPriority: string) => {
    if (!selectedTicket || newPriority === selectedTicket.priority) return;
    setPendingAction({
      type: "priority",
      title: `Confirm Priority Override: ${newPriority}`,
      message: `Change priority of ticket ${selectedTicket.ticketNumber} to "${newPriority}"? ${
        newPriority === "Critical"
          ? "Critical priority enforces a strict 24-hour SLA turnaround window."
          : ""
      }`,
      confirmText: "Override Priority",
      confirmVariant: newPriority === "Critical" ? "danger" : "warning",
      payload: { priority: newPriority },
    });
  };

  const requestAssignToMe = () => {
    if (!selectedTicket || !user?._id) return;
    setPendingAction({
      type: "assign",
      title: "Assign Ticket to Yourself",
      message: `Take full operational ownership of ticket ${selectedTicket.ticketNumber}? You will be assigned as primary responder.`,
      confirmText: "Assign to Me",
      confirmVariant: "primary",
    });
  };

  const requestUnassignTicket = () => {
    if (!selectedTicket) return;
    setPendingAction({
      type: "unassign",
      title: "Unassign Ticket",
      message: `Release your ownership of ticket ${selectedTicket.ticketNumber}? It will return to the unassigned queue for other team members.`,
      confirmText: "Release Ticket",
      confirmVariant: "warning",
    });
  };

  // Execute Confirmed Action & Fetch Latest Authoritative State
  const executePendingAction = async () => {
    if (!pendingAction || !selectedTicket) return;
    try {
      setActionLoading(true);
      if (pendingAction.type === "status") {
        await adminApi.updateStatus(selectedTicket._id, pendingAction.payload.newStatus);
        showToast(`Status updated to ${pendingAction.payload.newStatus.replace("_", " ")}`);
      } else if (pendingAction.type === "category") {
        await adminApi.overrideClassification(selectedTicket._id, {
          category: pendingAction.payload.category,
          priority: selectedTicket.priority,
        });
        showToast("Category override updated successfully");
      } else if (pendingAction.type === "priority") {
        await adminApi.overrideClassification(selectedTicket._id, {
          category: selectedTicket.category,
          priority: pendingAction.payload.priority,
        });
        showToast("Priority override updated successfully");
      } else if (pendingAction.type === "assign") {
        await adminApi.assignTicket(selectedTicket._id, user!._id);
        showToast("Ticket assigned to you");
      } else if (pendingAction.type === "unassign") {
        await adminApi.assignTicket(selectedTicket._id, null);
        showToast("Ticket returned to unassigned queue");
      }

      // Re-fetch latest authoritative ticket state from backend API
      const refreshed = await adminApi.getTicketById(selectedTicket._id);
      setSelectedTicket(refreshed);
      await fetchTickets();
      await loadQueueSummary();
    } catch (err: any) {
      alert(err?.message || "Action failed to execute");
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  };

  // Generate AI Draft Response directly into composer
  const handleGenerateAiDraft = async () => {
    if (!selectedTicket) return;
    try {
      setGeneratingAiDraft(true);
      const draftResult = await adminApi.generateAiDraft(selectedTicket._id);
      if (draftResult.draftResponse) {
        setReplyBody(draftResult.draftResponse);
        showToast("AI response drafted into reply box");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to generate AI draft");
    } finally {
      setGeneratingAiDraft(false);
    }
  };

  // Post Reply or Internal Note & Re-fetch Fresh State
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyBody.trim()) return;

    try {
      setSendingMessage(true);
      await adminApi.addMessage(selectedTicket._id, replyBody.trim(), isInternalNote);
      
      // Re-fetch authoritative fresh state after posting message
      const refreshed = await adminApi.getTicketById(selectedTicket._id);
      setSelectedTicket(refreshed);
      setReplyBody("");
      showToast(isInternalNote ? "Internal staff note recorded" : "Reply sent to author");
      await fetchTickets();
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
  const criticalCount = queueSummary.critical ?? tickets.filter((t) => t.priority === PRIORITIES.CRITICAL || t.priority === PRIORITIES.HIGH).length;

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

        {/* Quick Queue Priority Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setQuickView("all");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              quickView === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>All Tickets</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-slate-200">
              {queueSummary.total || totalCount}
            </span>
          </button>

          <button
            onClick={() => {
              setQuickView("urgent");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              quickView === "urgent"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-white border border-red-200 text-red-700 hover:bg-red-50"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Most Urgent (Critical)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-800">
              {criticalCount}
            </span>
          </button>

          <button
            onClick={() => {
              setQuickView("oldest");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              quickView === "oldest"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white border border-amber-200 text-amber-800 hover:bg-amber-50"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Oldest Unresolved (FIFO)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800">
              {queueSummary.open || openCount}
            </span>
          </button>
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

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => handleFilterChange(setDateFilter, e.target.value)}
              className="bg-slate-50 border border-slate-200/80 text-slate-700 text-xs px-3 py-2 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
            >
              <option value="">All Dates</option>
              <option value="today">Created Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

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

            {(statusFilter || categoryFilter || priorityFilter || dateFilter || search || quickView !== "all") && (
              <button
                onClick={() => {
                  setStatusFilter("");
                  setCategoryFilter("");
                  setPriorityFilter("");
                  setDateFilter("");
                  setQuickView("all");
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
                  <th className="py-3.5 px-4">Assignee</th>
                  <th className="py-3.5 px-4">Timing & SLA</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-emerald-700" />
                        <span>Loading support queue...</span>
                      </div>
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
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

                        {/* Assignee */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {t.assignedTo && typeof t.assignedTo === "object" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              <span className="truncate max-w-[90px]">{t.assignedTo.name}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                          )}
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

      {/* Slide-over Ticket Management Drawer with Two-Sided Modern Chat */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedTicket(null)}
          />

          <div className="relative w-full max-w-2xl bg-white border-l border-slate-200 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-200 overflow-hidden">
            {/* Minimal Top Brand Line */}
            <div className="h-1 w-full bg-emerald-800" />

            {/* Minimal Drawer Header */}
            <div className="px-5 py-3 border-b border-slate-100 bg-white flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-slate-900">
                    {selectedTicket.ticketNumber}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {getTimeAgo(selectedTicket.createdAt)}
                  </span>
                  <span className="text-slate-300">•</span>
                  {renderSlaBadge(selectedTicket)}
                  <span className="text-slate-300">•</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-700 font-mono">
                    {selectedTicket.status.replace("_", " ")}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <h2 className="text-xs font-bold text-slate-900 truncate">
                    {selectedTicket.subject}
                  </h2>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <span className="text-[11px] text-slate-500 truncate hidden sm:inline">
                    {typeof selectedTicket.author === "object" ? selectedTicket.author.name : "Author"}
                    {selectedTicket.book && typeof selectedTicket.book === "object" ? ` (📖 ${selectedTicket.book.title})` : ""}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowTriageControls(!showTriageControls)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    showTriageControls
                      ? "bg-slate-100 text-slate-900 border-slate-300 shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                  title="Triage Settings"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Triage</span>
                  {showTriageControls ? (
                    <ChevronUp className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  )}
                </button>

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Collapsible Minimal Triage Bar (Tucked Away by Default) */}
            {showTriageControls && (
              <div className="p-3.5 bg-slate-50/90 border-b border-slate-200 text-xs space-y-2.5 animate-in slide-in-from-top-2 duration-150">
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                      Status
                    </label>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => requestStatusChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-emerald-600 shadow-2xs"
                    >
                      {(Object.values(STATUSES) as string[]).map((st) => (
                        <option key={st} value={st}>
                          {st.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                      Category
                    </label>
                    <select
                      value={selectedTicket.category}
                      onChange={(e) => requestCategoryChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-emerald-600 shadow-2xs"
                    >
                      {(Object.values(CATEGORIES) as string[]).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                      Priority
                    </label>
                    <select
                      value={selectedTicket.priority}
                      onChange={(e) => requestPriorityChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-emerald-600 shadow-2xs"
                    >
                      {(Object.values(PRIORITIES) as string[]).map((pr) => (
                        <option key={pr} value={pr}>
                          {pr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">Assignee:</span>
                    <span className="font-semibold text-slate-800 text-[11px]">
                      {selectedTicket.assignedTo && typeof selectedTicket.assignedTo === "object"
                        ? selectedTicket.assignedTo.name
                        : "Unassigned"}
                    </span>
                  </div>

                  <div>
                    {selectedTicket.assignedTo &&
                    typeof selectedTicket.assignedTo === "object" &&
                    user?._id &&
                    selectedTicket.assignedTo._id === user._id ? (
                      <button
                        type="button"
                        onClick={requestUnassignTicket}
                        disabled={actionLoading}
                        className="text-[11px] text-slate-500 hover:text-red-600 font-medium underline"
                      >
                        Release Ticket
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={requestAssignToMe}
                        disabled={actionLoading}
                        className="px-2.5 py-1 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-[11px] flex items-center gap-1 shadow-2xs"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Assign to Me</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Breathing, Clean Chat Timeline */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30">
              <div className="flex items-center justify-center my-1">
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date(selectedTicket.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>

              {/* 1. Root Message: Author Initial Query (Left Aligned) */}
              <div className="flex items-start gap-2.5 max-w-[88%] self-start animate-in fade-in">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-slate-600" />
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 pl-0.5 text-[11px]">
                    <span className="font-bold text-slate-800">
                      {typeof selectedTicket.author === "object" ? selectedTicket.author.name : "Author"}
                    </span>
                    <span className="text-[9px] px-1 rounded bg-slate-200/70 text-slate-600 font-medium">Author</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-tl-xs px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap">
                    {selectedTicket.description}
                  </div>

                  {/* Attached Evidence Chips */}
                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedTicket.attachments.map((att, idx) => (
                        <a
                          key={att.storageUrl || idx}
                          href={att.storageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-600 text-[11px] text-slate-700 font-medium transition-colors shadow-2xs group"
                        >
                          <Paperclip className="w-3 h-3 text-emerald-800" />
                          <span className="truncate max-w-[140px]">{att.originalName}</span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            ({(att.sizeBytes / 1024).toFixed(0)}KB)
                          </span>
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-700" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Conversation Messages Stream */}
              {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                selectedTicket.messages.map((msg, idx) => {
                  const isAuthor = msg.senderType === "author";
                  const isInternal = msg.isInternal;
                  const senderName =
                    typeof msg.sender === "object" && msg.sender ? (msg.sender as any).name : isAuthor ? "Author" : "Staff";
                  const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                  // Centered Internal Staff Note
                  if (isInternal) {
                    return (
                      <div
                        key={msg._id || idx}
                        className="mx-auto my-2 w-full max-w-md bg-amber-50/70 border border-amber-200/80 rounded-xl px-3 py-2 text-xs shadow-2xs animate-in fade-in"
                      >
                        <div className="flex items-center justify-between text-[10px] text-amber-800 font-medium mb-1">
                          <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-700" />
                            <span>Internal note · {senderName}</span>
                          </span>
                          <span className="font-mono text-amber-600">{formattedTime}</span>
                        </div>
                        <p className="text-xs text-amber-950 whitespace-pre-wrap leading-relaxed">
                          {msg.body}
                        </p>
                      </div>
                    );
                  }

                  // Author Follow-up Message (Left Aligned)
                  if (isAuthor) {
                    return (
                      <div
                        key={msg._id || idx}
                        className="flex items-start gap-2.5 max-w-[85%] self-start animate-in fade-in"
                      >
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5 pl-0.5 text-[11px]">
                            <span className="font-bold text-slate-800">{senderName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{formattedTime}</span>
                          </div>
                          <div className="bg-slate-100 text-slate-800 px-3.5 py-2.5 rounded-2xl rounded-tl-xs text-xs leading-relaxed whitespace-pre-wrap">
                            {msg.body}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Staff Message (Right Aligned)
                  return (
                    <div
                      key={msg._id || idx}
                      className="flex items-start justify-end gap-2.5 max-w-[85%] ml-auto animate-in fade-in"
                    >
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 mb-0.5 pr-0.5 text-[11px]">
                          <span className="text-[10px] text-slate-400 font-mono">{formattedTime}</span>
                          <span className="font-semibold text-slate-800">{senderName}</span>
                        </div>
                        <div className="bg-emerald-800 text-white px-3.5 py-2.5 rounded-2xl rounded-tr-xs text-xs leading-relaxed shadow-xs whitespace-pre-wrap">
                          {msg.body}
                        </div>
                        {msg.isAiDraft && (
                          <span className="text-[9px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5 pr-1">
                            <Sparkles className="w-3 h-3 text-emerald-600" /> AI-Assisted
                          </span>
                        )}
                      </div>

                      <div className="w-7 h-7 rounded-full bg-emerald-800 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-200" />
                      </div>
                    </div>
                  );
                })
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Minimalist Chat Composer */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white">
              {/* Mode Toggle Tabs & AI Quick Assist */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center p-0.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(false)}
                    className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      !isInternalNote
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Reply to Author
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(true)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      isInternalNote
                        ? "bg-amber-100 text-amber-900 shadow-2xs font-bold"
                        : "text-slate-500 hover:text-amber-800"
                    }`}
                  >
                    <Lock className="w-3 h-3 text-amber-700" />
                    <span>Internal Note</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAiDraft}
                  disabled={generatingAiDraft}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50 border border-emerald-200/80 transition-all disabled:opacity-50 shadow-2xs"
                  title="Generate response from BookLeaf knowledge base"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{generatingAiDraft ? "Drafting..." : "AI Assist"}</span>
                </button>
              </div>

              {/* Textarea with docked Send button */}
              <div className="relative">
                <textarea
                  rows={2}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      handleSendMessage(e);
                    }
                  }}
                  placeholder={
                    isInternalNote
                      ? "Write a private internal note (invisible to author)..."
                      : "Type your reply to the author (Cmd+Enter to send)..."
                  }
                  className={`w-full rounded-xl p-2.5 pr-20 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-2xs resize-none ${
                    isInternalNote
                      ? "bg-amber-50/40 border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      : "bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  }`}
                />

                <div className="absolute right-2 bottom-2">
                  <button
                    type="submit"
                    disabled={sendingMessage || !replyBody.trim()}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-2xs transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                      isInternalNote
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-emerald-800 hover:bg-emerald-900"
                    }`}
                  >
                    <span>{sendingMessage ? "..." : "Send"}</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal before Critical Actions */}
      {pendingAction && (
        <ConfirmModal
          isOpen={Boolean(pendingAction)}
          title={pendingAction.title}
          message={pendingAction.message}
          confirmText={pendingAction.confirmText}
          confirmVariant={pendingAction.confirmVariant}
          loading={actionLoading}
          onConfirm={executePendingAction}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </AdminLayout>
  );
}
