import { Link } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { AuthorLayout } from "../../components/layout/AuthorLayout";
import { BookOpen, PlusCircle, MessageSquare, TrendingUp, ShieldCheck } from "lucide-react";

export function AuthorDashboardPage() {
  const { user } = useAuthContext();

  return (
    <AuthorLayout>
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Welcome Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Verified BookLeaf Author Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
              Welcome back, {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              View your published titles, track real-time royalties, or raise a dedicated support query.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/author/tickets/new"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4 text-amber-200" />
              <span>Submit Support Query</span>
            </Link>
            <Link
              to="/author/tickets"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs border border-stone-300 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>My Tickets</span>
            </Link>
          </div>
        </div>

        {/* Overview Stats Wireframe Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Catalog Status</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-serif font-bold text-stone-900">Active Titles</div>
            <span className="text-xs text-stone-500 mt-1 block">Live distribution across Amazon & Flipkart</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Royalty Formula</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-serif font-bold text-stone-900">80% Net Profit</div>
            <span className="text-xs text-emerald-700 mt-1 block">Paid within 45 days of quarter end</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Support SLA</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-serif font-bold text-stone-900">Dedicated Help</div>
            <span className="text-xs text-stone-500 mt-1 block">Real-time AI grounded query routing</span>
          </div>
        </div>
      </div>
    </AuthorLayout>
  );
}
