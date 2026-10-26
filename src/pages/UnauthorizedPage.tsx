import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { ROLES } from "../utils/constants";

export function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const handleReturn = () => {
    if (user?.role === ROLES.AUTHOR) {
      navigate("/author/dashboard");
    } else if (user) {
      navigate("/admin/queue");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-stone-200 text-center">
        <div className="w-14 h-14 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-1">
          403 Forbidden
        </span>
        <h1 className="text-2xl font-serif font-bold text-stone-900 mb-2">
          Strict Security Boundary
        </h1>
        <p className="text-xs text-stone-600 leading-relaxed mb-6">
          You do not have administrative credentials to enter this protected workspace. 
          Author and Operations consoles are isolated to safeguard author royalty ledgers and proprietary metadata.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleReturn}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-900 text-white text-xs font-bold hover:bg-emerald-950 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Workspace</span>
          </button>
          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
