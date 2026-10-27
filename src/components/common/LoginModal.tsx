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
    setEmail("");
    setPassword("");
  }, [initialRole, isOpen]);

  if (!isOpen) return null;

  const handleRoleSwitch = (mode: "author" | "admin") => {
    setRoleMode(mode);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg("Please provide both email and password.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const user = await login({ email: cleanEmail, password });

      // Guard role alignment with selected tab
      if (roleMode === "admin" && user.role === ROLES.AUTHOR) {
        setErrorMsg("This is an Author account. Please switch to the Author Portal tab above.");
        setSubmitting(false);
        return;
      }

      if (roleMode === "author" && user.role !== ROLES.AUTHOR) {
        setErrorMsg("This is a Staff/Admin account. Please switch to the Admin & Ops tab above.");
        setSubmitting(false);
        return;
      }

      onClose();

      // Destination routing by user role
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

  const isAuthor = roleMode === "author";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header accent strip */}
        <div className={`h-2 transition-colors duration-200 ${isAuthor ? "bg-emerald-800" : "bg-stone-900"}`} />

        <div className="p-6 sm:p-8">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Brand header */}
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white transition-colors duration-200 ${
                isAuthor ? "bg-emerald-800" : "bg-stone-900"
              }`}
            >
              {isAuthor ? <BookOpen className="w-5 h-5 text-amber-200" /> : <Shield className="w-5 h-5 text-emerald-400" />}
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-stone-900 tracking-tight">BookLeaf</span>
              <span className="text-xs text-stone-500 font-sans ml-1.5 font-medium">Publishing Portal</span>
            </div>
          </div>

          {/* Simple Role Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-xl mb-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleRoleSwitch("author")}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg transition-all ${
                isAuthor
                  ? "bg-white text-emerald-900 shadow-sm font-bold"
                  : "text-stone-500 hover:text-stone-900 hover:bg-stone-200/50"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Author Portal</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch("admin")}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg transition-all ${
                !isAuthor
                  ? "bg-stone-900 text-white shadow-sm font-bold"
                  : "text-stone-500 hover:text-stone-900 hover:bg-stone-200/50"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin & Ops</span>
            </button>
          </div>

          {/* Context Helper */}
          <div className="mb-4">
            <h3 className="font-serif font-bold text-base text-stone-900">
              {isAuthor ? "Author Portal Sign In" : "Operations & Admin Sign In"}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {isAuthor
                ? "Access your book catalog, sales telemetry, royalties, and support queries."
                : "Access AI triage queue, operations command center, and author tickets."}
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {isAuthor ? "Author Email Address" : "Admin / Operations Email"}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isAuthor ? "author@example.com" : "admin@bookleaf.com"}
                  required
                  autoFocus
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
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full mt-2 py-2.5 px-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                isAuthor
                  ? "bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99]"
                  : "bg-stone-900 hover:bg-stone-800 active:scale-[0.99]"
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isAuthor ? "Sign In as Author" : "Sign In as Admin"}</span>
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
