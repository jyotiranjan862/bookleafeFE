import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { X, Lock, Mail, BookOpen, Shield, AlertCircle, ArrowRight } from "lucide-react";
import { ROLES } from "../../utils/constants";

interface LoginModalProps {
  isOpen: boolean;
  initialRole?: "author" | "admin";
  onClose: () => void;
}

export function LoginModal({ isOpen, initialRole = "author", onClose }: LoginModalProps) {
  const navigate = useNavigate();
  const { login } = useAuthContext();

  const [roleMode, setRoleMode] = useState<"author" | "admin">(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setRoleMode(initialRole);
    setErrorMsg(null);
  }, [initialRole, isOpen]);

  if (!isOpen) return null;

  const handleQuickFill = (presetEmail: string, presetPass: string, mode: "author" | "admin") => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setRoleMode(mode);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please provide both email and password.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const user = await login({ email, password });
      onClose();

      // Enforce strict destination routing by role
      if (user.role === ROLES.AUTHOR) {
        navigate("/author/dashboard");
      } else {
        navigate("/admin/queue");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication failed. Check credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header decoration */}
        <div className={`h-2 ${roleMode === "author" ? "bg-emerald-800" : "bg-stone-800"}`} />

        <div className="p-6 sm:p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Brand & Title */}
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                roleMode === "author" ? "bg-emerald-800" : "bg-stone-800"
              }`}
            >
              {roleMode === "author" ? <BookOpen className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-stone-900 tracking-tight">BookLeaf</span>
              <span className="text-xs text-stone-500 font-sans ml-1.5 font-medium">Publishing Portal</span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-stone-900 tracking-tight mt-3">
            {roleMode === "author" ? "Sign in to Author Portal" : "Operations & Admin Login"}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            {roleMode === "author"
              ? "Access your catalog, royalties, and direct support tickets."
              : "Access the triage queue, AI responses, and catalog management."}
          </p>

          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 mt-5 bg-stone-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setRoleMode("author");
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                roleMode === "author"
                  ? "bg-white text-emerald-800 shadow-sm font-bold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Author Access
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleMode("admin");
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                roleMode === "admin"
                  ? "bg-white text-stone-900 shadow-sm font-bold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin / Staff
            </button>
          </div>

          {/* Quick preset credentials for evaluators */}
          <div className="mt-4 pt-3 border-t border-dashed border-stone-200">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-2">
              ? Quick Fill Evaluation Accounts:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill("priya.sharma@email.com", "Author@12345", "author")}
                className="text-[11px] bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md transition-colors"
              >
                Priya (Author)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("rohit.kapoor@email.com", "Author@12345", "author")}
                className="text-[11px] bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md transition-colors"
              >
                Rohit (Author)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("admin@bookleaf.com", "Admin@12345", "admin")}
                className="text-[11px] bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-300 px-2 py-1 rounded-md transition-colors font-medium"
              >
                Admin Staff
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("ops@bookleaf.com", "Ops@12345", "admin")}
                className="text-[11px] bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-300 px-2 py-1 rounded-md transition-colors font-medium"
              >
                Ops Lead
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="author@example.com"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="��������"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full mt-2 py-2.5 px-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                roleMode === "author"
                  ? "bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99]"
                  : "bg-stone-900 hover:bg-stone-800 active:scale-[0.99]"
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
