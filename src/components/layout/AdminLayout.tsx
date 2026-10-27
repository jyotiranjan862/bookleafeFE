import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { ConfirmModal } from "../common/ConfirmModal";
import {
  Shield,
  Inbox,
  BarChart3,
  Library,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Users,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const { user, logout } = useAuthContext();
  const { unreadTicketsCount, realtimeToast, dismissToast } = useSocket();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = [
    {
      label: "Support Ticket Queue",
      path: "/admin/queue",
      icon: Inbox,
      badge: unreadTicketsCount > 0 ? `+${unreadTicketsCount} New` : "Live",
      badgeHighlight: unreadTicketsCount > 0,
    },
    {
      label: "Author Management",
      path: "/admin/authors",
      icon: Users,
    },
    {
      label: "Book Catalog & Royalties",
      path: "/admin/books",
      icon: Library,
    },
    {
      label: "Operations & Analytics",
      path: "/admin/analytics",
      icon: BarChart3,
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

      {/* Admin Sidebar - Clean White/Light Theme */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out shadow-[1px_0_3px_rgba(0,0,0,0.02)] ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <Link to="/admin/queue" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                BookLeaf
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Operations Command</p>
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
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold transition-all ${
                      item.badgeHighlight
                        ? "bg-amber-500 text-white shadow-xs animate-pulse font-extrabold"
                        : isActive
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200 group-hover:text-slate-600"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
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
                  {user?.name || "Admin"}
                </span>
                <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider truncate">
                  {user?.role?.replace("_", " ") || "STAFF"}
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
        title="Sign Out of Admin Portal"
        message="Are you sure you want to end your administrative session? You will be redirected to the public login screen."
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
                {title || "BookLeaf Operations"}
              </h1>
              {subtitle && <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-medium text-slate-500">{user?.email}</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-center font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
        </header>

        {/* Workspace Container */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>

      {/* Real-time Toast Alert Notification */}
      {realtimeToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 max-w-sm animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5">
                <Inbox className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white tracking-tight">
                  {realtimeToast.title}
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  {realtimeToast.message}
                </p>
                <Link
                  to="/admin/queue"
                  onClick={dismissToast}
                  className="inline-block mt-2 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-wider"
                >
                  View in Queue →
                </Link>
              </div>
            </div>
            <button
              onClick={dismissToast}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
