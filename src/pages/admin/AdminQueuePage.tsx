import { useAuthContext } from "../../context/AuthContext";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Sparkles, RefreshCw } from "lucide-react";

export function AdminQueuePage() {
  const { user } = useAuthContext();

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Operations Header */}
        <div className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>AI-Assisted Operations Queue</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Support Triage Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Active Executive: <span className="text-slate-200 font-semibold">{user?.name}</span> ({user?.email})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Triage Overview Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-1">Queue Health</span>
            <span className="text-2xl font-bold text-emerald-400">Active</span>
            <span className="text-[11px] text-slate-400 block mt-1">Real-time WebSocket sync</span>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-1">AI Classifier</span>
            <span className="text-2xl font-bold text-indigo-400">Online</span>
            <span className="text-[11px] text-slate-400 block mt-1">Auto category & priority scoring</span>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-1">Knowledge Grounding</span>
            <span className="text-2xl font-bold text-amber-400">5 Categories</span>
            <span className="text-[11px] text-slate-400 block mt-1">75% token targeted injection</span>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-1">SLA Target</span>
            <span className="text-2xl font-bold text-red-400">&lt; 48 Hours</span>
            <span className="text-[11px] text-slate-400 block mt-1">Critical/High resolution window</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

