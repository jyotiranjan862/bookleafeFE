import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { BookOpen, PlusCircle, MessageSquare, LogOut } from "lucide-react";

export function AuthorLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthContext();
  const location = useLocation();

  const navItems = [
    { label: "My Books & Royalties", path: "/author/dashboard", icon: BookOpen },
    { label: "Submit Support Query", path: "/author/tickets/new", icon: PlusCircle },
    { label: "My Support Tickets", path: "/author/tickets", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 font-sans flex flex-col">
      {/* Author Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-900 text-amber-100 flex items-center justify-center font-serif text-lg font-bold">
                ?
              </div>
              <span className="font-serif font-bold text-lg text-stone-900 tracking-tight">BookLeaf</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                Author Portal
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
                        ? "bg-emerald-900 text-white shadow-sm font-bold"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-bold text-stone-900">{user?.name}</span>
              <span className="block text-[11px] text-stone-500">{user?.email}</span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-lg text-stone-500 hover:text-red-700 hover:bg-red-50 border border-stone-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Author Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 text-center text-xs text-stone-400">
        BookLeaf Publishing Support � Author Assistance SLA: 48h for High/Critical tickets
      </footer>
    </div>
  );
}

