import { AlertTriangle, LogOut, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "danger" | "primary" | "warning";
  icon?: "logout" | "warning";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger",
  icon = "warning",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (confirmVariant) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500";
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500";
      case "primary":
      default:
        return "bg-emerald-800 hover:bg-emerald-900 text-white focus:ring-emerald-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={loading ? undefined : onCancel}
      />

      {/* Dialog Card */}
      <div className="relative w-full max-w-sm bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                confirmVariant === "danger"
                  ? "bg-red-50 text-red-600 border border-red-100"
                  : confirmVariant === "warning"
                  ? "bg-amber-50 text-amber-600 border border-amber-100"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-100"
              }`}
            >
              {icon === "logout" ? (
                <LogOut className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
            </div>
          </div>

          <button
            onClick={onCancel}
            disabled={loading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-5 pl-0.5">{message}</p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5 ${getVariantStyles()}`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
