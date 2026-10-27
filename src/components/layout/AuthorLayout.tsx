import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { ConfirmModal } from "../common/ConfirmModal";
import {
  BookOpen,
  MessageSquare,
  LogOut,
  Menu,
  X,
  User as UserIcon,
} from "lucide-react";

interface AuthorLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthorLayout({ children, title, subtitle }: AuthorLayoutProps) {
  const { user, logout } = useAuthContext();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = [
    {
      label: "My Books & Royalties",
      path: "/author/dashboard",
      icon: BookOpen,
    },
    {
      label: "Support Tickets",
      path: "/author/tickets",
      icon: MessageSquare,
    },
    {
      label: "Profile & Payouts",
      path: "/author/profile",
      icon: UserIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Author Sidebar - Clean White / Slate Aesthetic matching Admin */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out shadow-[1px_0_3px_rgba(0,0,0,0.02)] ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <Link to="/author/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-serif text-lg font-bold shadow-xs">
              ❦
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                BookLeaf
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                  Author
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Publishing Workspace</p>
            </div>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Routes */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-slate-100 text-slate-900 font-bold shadow-xs border border-slate-200/90 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1.5 before:bg-emerald-600 before:rounded-r-full"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* User Card & Logout in Sidebar Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase() || <UserIcon className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-slate-800 truncate leading-tight">
                  {user?.name || "Author"}
                </span>
                <span className="block text-[10px] font-mono text-slate-500 truncate">
                  {user?.email || "author@bookleaf.in"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Sign Out of Author Portal"
        message="Are you sure you want to log out of your author workspace? You will need to log back in to review royalties and ticket responses."
        confirmText="Sign Out"
        confirmVariant="danger"
        icon="logout"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <header className="h-16 px-4 sm:px-8 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {title || "Author Portal"}
              </h1>
              {subtitle && <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/author/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-xs text-slate-700 transition-colors"
              title="View & Edit Author Profile"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-[10px]">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <span className="font-semibold text-slate-800 hidden sm:inline">{user?.name || "Author"}</span>
            </Link>
          </div>
        </header>

        {/* Workspace Container */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
