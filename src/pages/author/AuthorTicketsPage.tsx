import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { AuthorLayout } from "../../components/layout/AuthorLayout";
import { ticketApi } from "../../api/ticketApi";
import type { Ticket } from "../../types";
import {
  PlusCircle,
  RefreshCw,
  Search,
  Send,
  X,
  Check,
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

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Slide-over Thread Modal
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { limit: "100" };
      if (statusFilter) params.status = statusFilter;

      const res = await ticketApi.getMyTickets(params);
      setTickets(res.data || []);
    } catch (err: any) {
      console.error("Failed to load support tickets:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

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

  const filteredTickets = tickets.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.ticketNumber.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q)
    );
  });

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
                placeholder="Search by ticket # or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg focus:bg-white focus:outline-none focus:border-emerald-700 font-medium"
            >
              <option value="">All Statuses</option>
              {(Object.values(STATUSES) as string[]).map((st) => (
                <option key={st} value={st}>
                  {st.replace("_", " ")}
                </option>
              ))}
            </select>

            <Link
              to="/author/tickets/new"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Submit Query</span>
            </Link>
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
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      You have no tickets matching the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((t) => (
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
        </div>
      </div>

      {/* Ticket Conversation Slide-Over Drawer */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedTicket(null)}
          />

          <div className="relative w-full max-w-xl bg-white border-l border-slate-200 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-xs text-emerald-800">
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
                  {renderSlaBadge(selectedTicket)}
                </div>
                <h2 className="text-base font-bold text-slate-900 leading-snug">
                  {selectedTicket.subject}
                </h2>
                {selectedTicket.book && typeof selectedTicket.book === "object" && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Associated Book: {selectedTicket.book.title}
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Original Query */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Original Query Description
                </span>
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Submitted on: {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                  <span>{getTimeAgo(selectedTicket.createdAt)}</span>
                </div>
              </div>

              {/* Messages History */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Staff Communications
                </span>

                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((msg, idx) => (
                    <div
                      key={msg._id || idx}
                      className={`p-3.5 rounded-xl text-xs border ${
                        msg.senderType === "author"
                          ? "bg-white border-slate-200 text-slate-800"
                          : "bg-emerald-50/60 border-emerald-200 text-slate-900"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-[11px]">
                          {msg.senderType === "author"
                            ? "You (Author)"
                            : "BookLeaf Publishing Team"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(msg.createdAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed text-xs">{msg.body}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">
                    Our team is currently reviewing your ticket. Replies will appear here.
                  </p>
                )}
              </div>
            </div>

            {/* Reply Composer Form */}
            {selectedTicket.status !== STATUSES.CLOSED ? (
              <form
                onSubmit={handleSendReply}
                className="p-4 border-t border-slate-200 bg-slate-50/50"
              >
                <textarea
                  rows={3}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Type your response to the publishing support team..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-700 transition-colors"
                />

                <div className="flex justify-end mt-2.5">
                  <button
                    type="submit"
                    disabled={sendingReply || !replyBody.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50"
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
    </AuthorLayout>
  );
}
