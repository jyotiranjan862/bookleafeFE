import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthorLayout } from "../../components/layout/AuthorLayout";
import { bookApi } from "../../api/bookApi";
import { authApi } from "../../api/authApi";
import { useAuthContext } from "../../context/AuthContext";
import type { Book, RoyaltySummary } from "../../types";
import {
  BookOpen,
  DollarSign,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Search,
  Eye,
  CreditCard,
  CheckCircle2,
  Clock,
  ExternalLink,
  X,
  Check,
  Building,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const PUBLICATION_STAGES = [
  "Manuscript Received",
  "Editing",
  "Cover Design",
  "Typesetting",
  "Proofreading",
  "ISBN Assignment",
  "Printing",
  "Distribution Setup",
  "Published & Live",
];

function getStageIndex(status: string): number {
  const norm = status.toLowerCase();
  if (norm.includes("published") || norm.includes("live")) return 8;
  if (norm.includes("distribution")) return 7;
  if (norm.includes("printing")) return 6;
  if (norm.includes("isbn")) return 5;
  if (norm.includes("proofread")) return 4;
  if (norm.includes("typeset")) return 3;
  if (norm.includes("cover")) return 2;
  if (norm.includes("edit")) return 1;
  return 0;
}

export function AuthorDashboardPage() {
  const { user, checkSession } = useAuthContext();
  const [books, setBooks] = useState<Book[]>([]);
  const [royaltySummary, setRoyaltySummary] = useState<RoyaltySummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const navigate = useNavigate();

  // Modals
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankAccountNumber: "",
    bankIfscCode: "",
    bankAccountName: "",
  });
  const [savingBank, setSavingBank] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, limit };
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const [booksRes, royaltyRes] = await Promise.all([
        bookApi.getMyBooks(params),
        bookApi.getRoyaltySummary().catch(() => null),
      ]);
      setBooks(booksRes.data || []);
      setTotalCount(booksRes.total || (booksRes.data ? booksRes.data.length : 0));
      setTotalPages(booksRes.totalPages || Math.ceil((booksRes.total || 1) / limit) || 1);
      setRoyaltySummary(royaltyRes);
    } catch (err: any) {
      console.error("Failed to load author catalog:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setPage(1);
  };

  // Prepopulate bank form when opening modal
  const handleOpenBankModal = () => {
    setBankForm({
      bankAccountNumber: user?.profile?.bankAccountNumber || "",
      bankIfscCode: user?.profile?.bankIfscCode || "",
      bankAccountName: user?.profile?.bankAccountName || user?.name || "",
    });
    setShowBankModal(true);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingBank(true);
      await authApi.updateProfile({
        bankAccountNumber: bankForm.bankAccountNumber.trim(),
        bankIfscCode: bankForm.bankIfscCode.trim(),
        bankAccountName: bankForm.bankAccountName.trim(),
      });
      await checkSession();
      setShowBankModal(false);
      setToastMessage("Royalty payout bank credentials updated successfully");
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      alert(err?.message || "Failed to update bank details");
    } finally {
      setSavingBank(false);
    }
  };

  const totalCopiesSold = books.reduce((acc, b) => acc + (b.totalCopiesSold || 0), 0);
  const totalAccrued =
    royaltySummary?.totalEarned ??
    books.reduce((acc, b) => acc + (b.totalRoyaltyEarned || 0), 0);
  const totalPaid =
    royaltySummary?.totalPaid ??
    books.reduce((acc, b) => acc + (b.royaltyPaid || 0), 0);
  const netPending =
    royaltySummary?.totalPending ?? Math.max(0, totalAccrued - totalPaid);

  const startEntry = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, totalCount);
    royaltySummary?.totalPending ?? Math.max(0, totalAccrued - totalPaid);

  const bankLinked = Boolean(user?.profile?.bankLinked);
  const maskedAcc = user?.profile?.bankAccountNumber
    ? `•••• ${user.profile.bankAccountNumber.slice(-4)}`
    : "Not Configured";

  return (
    <AuthorLayout
      title="My Books & Royalties"
      subtitle="Contractual 80% net margin royalty records, publication statuses, and sales tracking"
    >
      <div className="space-y-4">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 bg-emerald-800 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Royalty Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200/90 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Catalog Titles
              </span>
              <BookOpen className="w-4 h-4 text-emerald-800" />
            </div>
            <span className="text-xl font-bold text-slate-900 block">{books.length}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {totalCopiesSold.toLocaleString()} total units sold
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Royalties Earned
              </span>
              <DollarSign className="w-4 h-4 text-emerald-800" />
            </div>
            <span className="text-xl font-bold text-slate-900 block">
              ₹{totalAccrued.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">
              80% Net margin formula
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Royalties Disbursed
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-800" />
            </div>
            <span className="text-xl font-bold text-emerald-800 block">
              ₹{totalPaid.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Transferred to bank</span>
          </div>

          <div className="bg-white border border-slate-200/90 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Payable Balance
              </span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xl font-bold text-amber-700 block">
              ₹{netPending.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Next quarterly cycle</span>
          </div>
        </div>

        {/* Royalty Threshold & Settlement Info Banner */}
        {netPending > 0 && netPending < 1000 ? (
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-950">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Rollover Notice (Balance Under ₹1,000 Threshold)</span>
              <span>
                Your current payable royalty balance of <strong>₹{netPending.toLocaleString()}</strong> is below the ₹1,000 minimum disbursement threshold. In accordance with BookLeaf publisher policy, this balance automatically rolls over into the subsequent quarterly settlement cycle.
              </span>
            </div>
          </div>
        ) : netPending >= 1000 ? (
          <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-3.5 flex items-start gap-3 text-xs text-emerald-950">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Quarterly Payout Eligible</span>
              <span>
                Your payable balance of <strong>₹{netPending.toLocaleString()}</strong> exceeds the ₹1,000 threshold and is scheduled for disbursement to your verified bank account during the next settlement cycle.
              </span>
            </div>
          </div>
        ) : null}

        {/* Royalty Payout & Bank Account Card */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
              <CreditCard className="w-5 h-5 text-emerald-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Royalty Disbursement Bank Profile</span>
                {bankLinked ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified & Linked</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <AlertCircle className="w-3 h-3" />
                    <span>Bank Pending</span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px] mt-1 font-mono">
                <span>Account: <strong className="text-slate-800">{maskedAcc}</strong></span>
                {user?.profile?.bankIfscCode && (
                  <span>IFSC: <strong className="text-slate-800">{user.profile.bankIfscCode}</strong></span>
                )}
                {user?.profile?.bankAccountName && (
                  <span>Beneficiary: <strong className="text-slate-800 font-sans">{user.profile.bankAccountName}</strong></span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
            <button
              onClick={handleOpenBankModal}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Building className="w-3.5 h-3.5 text-slate-600" />
              <span>{bankLinked ? "Edit Bank Details" : "Link Bank Account"}</span>
            </button>
            <Link
              to="/author/tickets"
              className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
            >
              View Support Tickets
            </Link>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-slate-200/90 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search your titles by book name, ISBN, or genre..."
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-700 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1 text-slate-400 text-xs font-medium mr-1">
              <SlidersHorizontal className="w-3 h-3" />
              <span>Status:</span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              className="bg-slate-50 border border-slate-200/80 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg focus:bg-white focus:outline-none focus:border-emerald-700 font-medium"
            >
              <option value="">All Publications</option>
              <option value="live">Published & Live Only</option>
              <option value="in_production">In Production Only</option>
            </select>

            {(statusFilter || search) && (
              <button
                onClick={() => {
                  setStatusFilter("");
                  setSearch("");
                  setPage(1);
                }}
                className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-900 font-semibold"
              >
                Reset
              </button>
            )}

            <button
              onClick={() => loadData()}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Refresh catalog"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-800" : ""}`} />
            </button>
          </div>
        </div>

        {/* Master Books Table — Compact Row UI with Eye Icon Details */}
        <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Book Title & Genre</th>
                  <th className="py-2.5 px-3">ISBN</th>
                  <th className="py-2.5 px-3">Pub. Date</th>
                  <th className="py-2.5 px-3">Publication Status</th>
                  <th className="py-2.5 px-3">MRP (₹)</th>
                  <th className="py-2.5 px-3">Units Sold</th>
                  <th className="py-2.5 px-3">Accrued (₹)</th>
                  <th className="py-2.5 px-3">Paid (₹)</th>
                  <th className="py-2.5 px-3">Balance (₹)</th>
                  <th className="py-2.5 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-800" />
                        <span>Loading published titles...</span>
                      </div>
                    </td>
                  </tr>
                ) : books.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 font-medium">
                      No published books found in your author catalog matching the filter.
                    </td>
                  </tr>
                ) : (
                  books.map((b) => {
                    const pending = Math.max(0, (b.totalRoyaltyEarned || 0) - (b.royaltyPaid || 0));

                    return (
                      <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Title & Genre */}
                        <td className="py-2 px-3 max-w-xs">
                          <div className="font-bold text-slate-900 truncate leading-tight">
                            {b.title}
                          </div>
                          {b.genre && (
                            <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {b.genre}
                            </span>
                          )}
                        </td>

                        {/* ISBN */}
                        <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap text-[11px]">
                          {b.isbn || "N/A"}
                        </td>

                        {/* Publication Date */}
                        <td className="py-2 px-3 whitespace-nowrap text-slate-600 text-[11px] font-mono">
                          {b.publicationDate
                            ? new Date(b.publicationDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : <span className="text-slate-400 italic">In Production</span>}
                        </td>

                        {/* Status */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              b.status.toLowerCase().includes("live")
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-blue-50 text-blue-800 border-blue-200"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-2 px-3 whitespace-nowrap font-mono font-medium text-slate-900 text-[11px]">
                          ₹{b.mrp || 0}
                        </td>

                        {/* Copies Sold */}
                        <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-700 text-[11px]">
                          {(b.totalCopiesSold || 0).toLocaleString()}
                        </td>

                        {/* Royalties Earned */}
                        <td className="py-2 px-3 whitespace-nowrap font-mono font-bold text-slate-900 text-[11px]">
                          ₹{(b.totalRoyaltyEarned || 0).toLocaleString()}
                        </td>

                        {/* Paid to Date */}
                        <td className="py-2 px-3 whitespace-nowrap font-mono text-emerald-800 font-semibold text-[11px]">
                          ₹{(b.royaltyPaid || 0).toLocaleString()}
                        </td>

                        {/* Balance */}
                        <td className="py-2 px-3 whitespace-nowrap font-mono font-bold text-[11px]">
                          <span className={pending > 0 ? "text-amber-700" : "text-slate-400"}>
                            ₹{pending.toLocaleString()}
                          </span>
                        </td>

                        {/* Actions: Eye Icon Details */}
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedBook(b)}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 border border-slate-200 transition-colors inline-flex items-center gap-1 text-xs"
                            title="View Book Details & Production Lifecycle"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline text-[11px] font-medium">Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Backend Pagination Toolbar */}
          <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <span>
                Showing <strong className="text-slate-900">{startEntry}</strong> to{" "}
                <strong className="text-slate-900">{endEntry}</strong> of{" "}
                <strong className="text-slate-900">{totalCount}</strong> books
              </span>

              <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                <span className="text-slate-500">Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-700"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1 || loading}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Prev</span>
              </button>

              <div className="px-2.5 py-0.5 font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg">
                Page {page} of {Math.max(1, totalPages)}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3 h-3" />
              </button>

              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages || loading}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Book Details & Publication Lifecycle Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedBook(null)}
          />

          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 mb-5">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                  {selectedBook.genre || "Publication"}
                </span>
                <h3 className="font-bold text-slate-900 text-lg mt-1">{selectedBook.title}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ISBN: {selectedBook.isbn || "N/A"} • Retail Price: ₹{selectedBook.mrp || 0} • Published:{" "}
                  {selectedBook.publicationDate
                    ? new Date(selectedBook.publicationDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "In Production"}
                </p>
              </div>

              <button
                onClick={() => setSelectedBook(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Financial Performance Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Units Sold</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {(selectedBook.totalCopiesSold || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Royalty Accrued</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  ₹{(selectedBook.totalRoyaltyEarned || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Disbursed</span>
                <span className="text-base font-bold text-emerald-800 font-mono">
                  ₹{(selectedBook.royaltyPaid || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Payable Balance</span>
                <span className="text-base font-bold text-amber-700 font-mono">
                  ₹{Math.max(0, (selectedBook.totalRoyaltyEarned || 0) - (selectedBook.royaltyPaid || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Publication Progress Lifecycle Stepper */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-800" />
                  <span>Publication Lifecycle Progress</span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Current: {selectedBook.status}
                </span>
              </div>

              {(() => {
                const currentStageIdx = getStageIndex(selectedBook.status);

                return (
                  <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {PUBLICATION_STAGES.map((stage, idx) => {
                        const isDone = idx < currentStageIdx;
                        const isCurrent = idx === currentStageIdx;

                        return (
                          <div
                            key={stage}
                            className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                              isDone
                                ? "bg-emerald-50/80 border-emerald-200 text-emerald-950 font-semibold"
                                : isCurrent
                                ? "bg-white border-emerald-600 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-500"
                                : "bg-white/60 border-slate-200 text-slate-400"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                isDone
                                  ? "bg-emerald-800 text-white"
                                  : isCurrent
                                  ? "bg-emerald-700 text-white animate-pulse"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                            </span>
                            <span className="text-[11px] truncate leading-tight">{stage}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Distribution Channels */}
            <div className="mb-6">
              <span className="text-xs font-bold text-slate-900 block mb-2">Active Distribution Channels</span>
              <div className="flex flex-wrap gap-2">
                {selectedBook.availableOn && selectedBook.availableOn.length > 0 ? (
                  selectedBook.availableOn.map((ch) => (
                    <span
                      key={ch}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-medium text-xs border border-slate-200 flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                      <span>{ch}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Available exclusively via BookLeaf Store</span>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  const bookId = selectedBook._id;
                  const title = selectedBook.title;
                  setSelectedBook(null);
                  navigate(`/author/tickets?new=true&bookId=${bookId}&bookTitle=${encodeURIComponent(title)}`);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>Report Issue with this Book</span>
              </button>

              <button
                onClick={() => setSelectedBook(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Link Bank Credentials Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowBankModal(false)}
          />

          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Royalty Disbursement Bank Profile</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct quarterly net margin royalty transfers into your verified account
                </p>
              </div>
              <button
                onClick={() => setShowBankModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Account Holder Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="As registered in your bank records"
                  value={bankForm.bankAccountName}
                  onChange={(e) => setBankForm({ ...bankForm, bankAccountName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-700 transition-colors"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Bank Account Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50100234567890"
                  value={bankForm.bankAccountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, bankAccountNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-emerald-700 transition-colors"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Bank IFSC Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC0001234"
                  value={bankForm.bankIfscCode}
                  onChange={(e) => setBankForm({ ...bankForm, bankIfscCode: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono uppercase text-xs focus:bg-white focus:outline-none focus:border-emerald-700 transition-colors"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-[11px] leading-relaxed">
                <strong>Schedule Note:</strong> Royalty disbursements occur on the 10th of every calendar quarter (Jan, Apr, Jul, Oct) directly into this bank account.
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBank}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {savingBank ? "Saving..." : "Save Bank Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthorLayout>
  );
}
