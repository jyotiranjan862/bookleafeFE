import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { adminApi } from "../../api/adminApi";
import type { TicketAnalytics } from "../../types";
import {
  RefreshCw,
  Clock,
  PieChart,
  CheckCircle2,
  TrendingUp,
  Layers,
  AlertTriangle,
} from "lucide-react";

export function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<TicketAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await adminApi.getAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      console.error("Failed to load operational analytics:", err);
      setErrorMessage(err?.response?.data?.message || err?.message || "Failed to load operational analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Safe extraction of statusList & categoryList regardless of backend array or dictionary format
  const rawStatus = (analytics as any)?.statusList || (analytics as any)?.byStatus;
  const statusList: Array<{ status: string; count: number }> = (
    Array.isArray(rawStatus)
      ? rawStatus
      : typeof rawStatus === "object" && rawStatus !== null
      ? Object.entries(rawStatus).map(([status, count]) => ({
          status: String(status || ""),
          count: typeof count === "number" ? count : 0,
        }))
      : []
  ).filter((s) => s && s.status);

  const rawCategory = (analytics as any)?.categoryList || (analytics as any)?.byCategory;
  const categoryList: Array<{ category: string; count: number }> = (
    Array.isArray(rawCategory)
      ? rawCategory
      : typeof rawCategory === "object" && rawCategory !== null
      ? Object.entries(rawCategory).map(([category, count]) => ({
          category: String(category || ""),
          count: typeof count === "number" ? count : 0,
        }))
      : []
  ).filter((c) => c && c.category);

  const totalTickets =
    typeof (analytics as any)?.total === "number"
      ? (analytics as any).total
      : statusList.reduce((acc, item) => acc + (typeof item.count === "number" ? item.count : 0), 0);

  const openItem = statusList.find(
    (s) => s.status && typeof s.status === "string" && s.status.toLowerCase().includes("open")
  );
  const openCount = openItem ? openItem.count : 0;

  const inProgressItem = statusList.find(
    (s) =>
      s.status &&
      typeof s.status === "string" &&
      (s.status.toLowerCase().includes("progress") || s.status.toLowerCase().includes("awaiting"))
  );
  const inProgressCount = inProgressItem ? inProgressItem.count : 0;

  const resolvedItem = statusList.find(
    (s) => s.status && typeof s.status === "string" && s.status.toLowerCase().includes("resolved")
  );
  const resolvedCount = resolvedItem ? resolvedItem.count : 0;
  const resolutionRate = totalTickets > 0 ? Math.round((resolvedCount / totalTickets) * 100) : 0;

  return (
    <AdminLayout
      title="Operations & SLA Analytics"
      subtitle="Resolution speed metrics, automated category routing, and queue distributions"
    >
      <div className="space-y-6">
        {/* Error Alert with Retry */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-red-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={fetchAnalytics}
              className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Real Live Database Metric Cards (Zero Dummy Data) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Cumulative Volume
              </span>
              <Layers className="w-4 h-4 text-emerald-700" />
            </div>
            <span className="text-2xl font-bold text-slate-900 block">{totalTickets}</span>
            <span className="text-[11px] text-slate-500 block mt-1">Total inquiries logged</span>
          </div>

          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Open Inquiries
              </span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-2xl font-bold text-amber-700 block">{openCount}</span>
            <span className="text-[11px] text-slate-500 block mt-1">Awaiting staff response</span>
          </div>

          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                In Progress
              </span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-2xl font-bold text-indigo-700 block">{inProgressCount}</span>
            <span className="text-[11px] text-slate-500 block mt-1">Active investigations</span>
          </div>

          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Resolved Tickets
              </span>
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            </div>
            <span className="text-2xl font-bold text-teal-700 block">{resolvedCount}</span>
            <span className="text-[11px] text-slate-500 block mt-1">{resolutionRate}% resolution rate</span>
          </div>
        </div>

        {/* Breakdown Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Status Distribution Table</h3>
                  <p className="text-[11px] text-slate-500">Active tickets across support lifecycle</p>
                </div>
              </div>
              <button
                onClick={fetchAnalytics}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Refresh stats"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-700" : ""}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3.5">Lifecycle Status</th>
                    <th className="py-3 px-3.5 text-right">Tickets</th>
                    <th className="py-3 px-3.5 text-right">Queue Share</th>
                    <th className="py-3 px-3.5">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {statusList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        {loading ? "Calculating metrics..." : "No status records found."}
                      </td>
                    </tr>
                  ) : (
                    statusList.map((item) => {
                      const countNum = typeof item.count === "number" ? item.count : 0;
                      const pct = totalTickets > 0 ? Math.round((countNum / totalTickets) * 100) : 0;
                      const statusDisplay = (item.status || "Unknown").replace("_", " ");

                      return (
                        <tr key={item.status} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-3.5 font-semibold text-slate-900 whitespace-nowrap">
                            <span className="inline-block w-2 h-2 rounded-full mr-2 bg-emerald-500" />
                            {statusDisplay}
                          </td>
                          <td className="py-3.5 px-3.5 text-right font-mono font-bold text-slate-900">
                            {countNum}
                          </td>
                          <td className="py-3.5 px-3.5 text-right font-mono text-slate-500 font-medium">
                            {pct}%
                          </td>
                          <td className="py-3.5 px-3.5 w-36">
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-emerald-600 h-full rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Distribution Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Category Distribution Table</h3>
                  <p className="text-[11px] text-slate-500">Classified inquiries grounded in knowledge base</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                AI Grounded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3.5">Inquiry Category</th>
                    <th className="py-3 px-3.5 text-right">Tickets</th>
                    <th className="py-3 px-3.5 text-right">Queue Share</th>
                    <th className="py-3 px-3.5">Target SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {categoryList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        {loading ? "Calculating categories..." : "No category records found."}
                      </td>
                    </tr>
                  ) : (
                    categoryList.map((item) => {
                      const countNum = typeof item.count === "number" ? item.count : 0;
                      const pct = totalTickets > 0 ? Math.round((countNum / totalTickets) * 100) : 0;
                      const categoryStr = String(item.category || "");

                      return (
                        <tr key={item.category} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-3.5 font-semibold text-slate-900 whitespace-nowrap">
                            <span className="inline-block w-2 h-2 rounded-full mr-2 bg-indigo-500" />
                            {categoryStr || "General"}
                          </td>
                          <td className="py-3.5 px-3.5 text-right font-mono font-bold text-slate-900">
                            {countNum}
                          </td>
                          <td className="py-3.5 px-3.5 text-right font-mono text-slate-500 font-medium">
                            {pct}%
                          </td>
                          <td className="py-3.5 px-3.5 font-mono text-[11px] text-emerald-700 font-semibold">
                            {categoryStr.toLowerCase().includes("royalty")
                              ? "< 24 Hours"
                              : categoryStr.toLowerCase().includes("distribution")
                              ? "< 48 Hours"
                              : "< 72 Hours"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
