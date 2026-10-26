import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { LoginModal } from "./LoginModal";
import { BookOpen, Shield, LogOut, LayoutDashboard } from "lucide-react";
import { ROLES } from "../../utils/constants";

export function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRole, setModalRole] = useState<"author" | "admin">("author");

  const openLogin = (role: "author" | "admin") => {
    setModalRole(role);
    setModalOpen(true);
  };

  const handleDashboardRedirect = () => {
    if (user?.role === ROLES.AUTHOR) {
      navigate("/author/dashboard");
    } else {
      navigate("/admin/queue");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-stone-50/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-900 text-amber-100 flex items-center justify-center font-serif text-xl font-bold shadow-sm group-hover:bg-emerald-950 transition-colors">
              ?
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-black text-xl text-stone-900 tracking-tight leading-tight">
                BookLeaf
              </span>
              <span className="text-[10px] uppercase font-sans tracking-widest text-emerald-800 font-bold">
                Publishing Portal
              </span>
            </div>
          </Link>

          {/* Navigation Links (Editorial/Publishing style) */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-stone-600">
            <a href="#about" className="hover:text-emerald-900 transition-colors">About</a>
            <a href="#royalties" className="hover:text-emerald-900 transition-colors">Royalty Policy</a>
            <a href="#distribution" className="hover:text-emerald-900 transition-colors">Distribution</a>
            <a href="#support" className="hover:text-emerald-900 transition-colors">AI Support</a>
          </nav>

          {/* Action Area */}
          <div className="flex items-center gap-2.5">
            {!isAuthenticated ? (
              <>
                {/* 1. Login as Author Button */}
                <button
                  type="button"
                  onClick={() => openLogin("author")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-all shadow-sm active:scale-95"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Login as Author</span>
                </button>

                {/* 2. Login as Admin Button */}
                <button
                  type="button"
                  onClick={() => openLogin("admin")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 transition-all shadow-sm active:scale-95"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Login as Admin</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDashboardRedirect}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-stone-300 hover:border-emerald-700 text-stone-800 transition-all shadow-sm"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-emerald-800" />
                  <span>
                    {user?.role === ROLES.AUTHOR ? "Author Dashboard" : "Admin Operations"}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 uppercase">
                    {user?.name.split(" ")[0]}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={logout}
                  title="Sign out"
                  className="p-2 rounded-xl text-stone-500 hover:text-red-700 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Reusable Login Modal */}
      <LoginModal
        isOpen={modalOpen}
        initialRole={modalRole}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

