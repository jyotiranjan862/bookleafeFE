import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { Shield, Inbox, BarChart3, Library, LogOut, Radio } from "lucide-react";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthContext();
  const location = useLocation();

  const navItems = [
    { label: "Ticket Queue", path: "/admin/queue", icon: Inbox },
    { label: "Support Analytics", path: "/admin/analytics", icon: BarChart3 },
    { label: "Book Catalog", path: "/admin/books", icon: Library },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      {/* Admin Operations Topbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">BookLeaf</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 font-semibold tracking-wide uppercase">
                Operations
              </span>
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-sm font-bold"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-[11px] text-emerald-400">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="font-semibold">Live AI Gateway</span>
            </div>

            <div className="text-right hidden sm:block">
              <span className="block text-xs font-bold text-slate-200">{user?.name}</span>
              <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-500">
                {user?.role.replace("_", " ")}
              </span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-3 text-center text-xs text-slate-500">
        BookLeaf Publishing Support Operations Console � Internal Authorized Access Only
      </footer>
    </div>
  );
}

