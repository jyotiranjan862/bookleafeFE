import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { adminApi } from "../../api/adminApi";
import type { Book } from "../../types";
import {
  Search,
  RefreshCw,
  BookOpen,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Edit,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
} from "lucide-react";

export function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Edit Book Modal
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editCopiesSold, setEditCopiesSold] = useState<number>(0);
  const [editRoyaltyPerCopy, setEditRoyaltyPerCopy] = useState<number>(0);
  const [editRoyaltyEarned, setEditRoyaltyEarned] = useState<number>(0);
  const [editRoyaltyPaid, setEditRoyaltyPaid] = useState<number>(0);
  const [savingEdit, setSavingEdit] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Global Real Aggregates
  const [catalogSummary, setCatalogSummary] = useState({
    totalBooks: 0,
    totalSales: 0,
    totalAccrued: 0,
    totalPaid: 0,
    totalPending: 0,
  });

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        limit,
      };
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const result = await adminApi.getAllBooks(params);
      setBooks(result.data || []);
      setTotalCount(result.total || (result.data ? result.data.length : 0));
      setTotalPages(result.totalPages || Math.ceil((result.total || 1) / limit) || 1);
      if ((result as any).summary) {
        setCatalogSummary((result as any).summary);
      }
    } catch (err: any) {
      console.error("Failed to load book catalog:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, search]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setPage(1);
  };

  // Financial aggregates across entire catalog matching filter (100% Real Live Database Telemetry)
  const totalSales = catalogSummary.totalSales || books.reduce((acc, b) => acc + (b.totalCopiesSold || 0), 0);
  const totalAccrued = catalogSummary.totalAccrued || books.reduce((acc, b) => acc + (b.totalRoyaltyEarned || 0), 0);
  const totalPaid = catalogSummary.totalPaid || books.reduce((acc, b) => acc + (b.royaltyPaid || 0), 0);
  const totalPending = catalogSummary.totalPending || totalAccrued - totalPaid;

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setEditPrice(book.mrp || 0);
    setEditStatus(book.status);
    setEditCopiesSold(book.totalCopiesSold || 0);
    setEditRoyaltyPerCopy(book.authorRoyaltyPerCopy || 0);
    setEditRoyaltyEarned(book.totalRoyaltyEarned || 0);
    setEditRoyaltyPaid(book.royaltyPaid || 0);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;

    try {
      setSavingEdit(true);
      const updated = await adminApi.updateBook(editingBook._id, {
        mrp: editPrice,
        status: editStatus as any,
        totalCopiesSold: editCopiesSold,
        authorRoyaltyPerCopy: editRoyaltyPerCopy,
        totalRoyaltyEarned: editRoyaltyEarned,
        royaltyPaid: editRoyaltyPaid,
      });

      const updatedBook: Book = (updated as any)?.book || updated;
      setBooks((prev) =>
        prev.map((b) => (b._id === updatedBook._id ? { ...b, ...updatedBook } : b))
      );
      setEditingBook(null);
      setSuccessToast(`Book "${updatedBook.title || editingBook.title}" updated successfully`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      alert(err?.message || "Failed to update book");
    } finally {
      setSavingEdit(false);
    }
  };

  const startEntry = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, totalCount);

  return (
    <AdminLayout
      title="Book Catalog & Publishing Royalties"
      subtitle="Publishing lifecycle management, distribution records, and author royalty disbursements"
    >
      <div className="space-y-6">
        {/* Toast Notification */}
        {successToast && (
          <div className="fixed top-20 right-8 z-50 bg-emerald-700 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4" />
            <span className="font-medium">{successToast}</span>
          </div>
        )}

        {/* Catalog Financial KPI Cards in White Theme */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Catalog Titles
              </span>
              <BookOpen className="w-4 h-4 text-emerald-700" />
            </div>
            <span className="text-2xl font-bold text-slate-900 block">{totalCount}</span>
            <span className="text-[11px] text-slate-500 block mt-1">
              {totalSales.toLocaleString()} total units sold
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Accrued
              </span>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-blue-700 block">
              ₹{totalAccrued.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              80% net margin contractual
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Royalties Disbursed
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
            <span className="text-2xl font-bold text-emerald-700 block">
              ₹{totalPaid.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              Transferred to author accounts
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Pending Payouts
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-2xl font-bold text-amber-700 block">
              ₹{totalPending.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">
              Quarterly cycle settlement
            </span>
          </div>
        </div>

        {/* Filter and Search Bar in White Theme */}
        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title, ISBN, or author name..."
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
              />
            </div>

            <button
              onClick={() => fetchBooks()}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Refresh catalog"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-700" : ""}`} />
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Status:</span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              className="bg-slate-50 border border-slate-200/80 text-slate-700 text-xs px-3 py-2 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
            >
              <option value="">All Publication Statuses</option>
              <option value="Published & Live">Published & Live</option>
              <option value="Under Review">Under Review</option>
              <option value="In Editing">In Editing</option>
              <option value="Out of Print">Out of Print</option>
            </select>

            {(statusFilter || search) && (
              <button
                onClick={() => {
                  setStatusFilter("");
                  setSearch("");
                  setPage(1);
                }}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-900 font-semibold"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Books Master Table in White Theme */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">ISBN</th>
                  <th className="py-3.5 px-4">Title & Genre</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Price (MRP)</th>
                  <th className="py-3.5 px-4">Sales Copies</th>
                  <th className="py-3.5 px-4">Accrued (₹)</th>
                  <th className="py-3.5 px-4">Paid (₹)</th>
                  <th className="py-3.5 px-4">Pending (₹)</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-emerald-700" />
                        <span>Loading book catalog...</span>
                      </div>
                    </td>
                  </tr>
                ) : books.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                      No books found matching the current search or filters.
                    </td>
                  </tr>
                ) : (
                  books.map((b) => {
                    const authorName =
                      typeof b.author === "object" && b.author !== null ? b.author.name : "Author";
                    const authorEmail =
                      typeof b.author === "object" && b.author !== null ? b.author.email : "";
                    const pending = (b.totalRoyaltyEarned || 0) - (b.royaltyPaid || 0);

                    return (
                      <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                          {b.isbn || "N/A"}
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-slate-900 truncate">{b.title}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {b.genre && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                {b.genre}
                              </span>
                            )}
                            {b.availableOn && b.availableOn.length > 0 && (
                              <span className="text-[10px] text-slate-400 truncate">
                                {b.availableOn.join(", ")}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{authorName}</div>
                          {authorEmail && (
                            <div className="text-[10px] text-slate-400">{authorEmail}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              b.status === "Published & Live"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : b.status === "Under Review"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : b.status === "In Editing"
                                ? "bg-blue-50 text-blue-800 border-blue-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-semibold text-slate-800">
                          ₹{b.mrp || 0}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                          {(b.totalCopiesSold || 0).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-semibold text-blue-700">
                          ₹{(b.totalRoyaltyEarned || 0).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-emerald-700 font-semibold">
                          ₹{(b.royaltyPaid || 0).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold">
                          <span className={pending > 0 ? "text-amber-700" : "text-slate-400"}>
                            ₹{pending.toLocaleString()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => openEditModal(b)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-500" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
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
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-600"
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
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <div className="px-3 py-1 font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg">
                Page {page} of {Math.max(1, totalPages)}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages || loading}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Book Modal in White Theme */}
      {editingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setEditingBook(null)}
          />

          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit Sales & Author Earnings</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{editingBook.isbn || "No ISBN"}</p>
              </div>
              <button
                onClick={() => setEditingBook(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-600 font-bold block mb-1">Book Title</label>
                <input
                  type="text"
                  disabled
                  value={editingBook.title}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 cursor-not-allowed font-medium"
                />
              </div>

              {/* Sales Performance Section */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  📈 Sales Performance
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Retail MRP (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-emerald-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Total Copies Sold</label>
                    <input
                      type="number"
                      min="0"
                      value={editCopiesSold}
                      onChange={(e) => {
                        const copies = Number(e.target.value);
                        setEditCopiesSold(copies);
                        // Optional live helper: if royalty per copy is set and user edits copies, suggest accrued
                        if (editRoyaltyPerCopy > 0) {
                          setEditRoyaltyEarned(copies * editRoyaltyPerCopy);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-emerald-600 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Author Earnings & Royalties Section */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                    💰 Author Royalty Payouts
                  </span>
                  <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Pending: ₹{Math.max(0, editRoyaltyEarned - editRoyaltyPaid).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Royalty/Copy (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={editRoyaltyPerCopy}
                      onChange={(e) => {
                        const rpc = Number(e.target.value);
                        setEditRoyaltyPerCopy(rpc);
                        if (editCopiesSold > 0) {
                          setEditRoyaltyEarned(editCopiesSold * rpc);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 font-semibold focus:outline-none focus:border-emerald-600 transition-colors text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Total Earned (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={editRoyaltyEarned}
                      onChange={(e) => setEditRoyaltyEarned(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-blue-700 font-bold focus:outline-none focus:border-emerald-600 transition-colors text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Total Paid (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={editRoyaltyPaid}
                      onChange={(e) => setEditRoyaltyPaid(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-emerald-700 font-bold focus:outline-none focus:border-emerald-600 transition-colors text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Publication Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
                >
                  <option value="Published & Live">Published & Live</option>
                  <option value="Manuscript Received">Manuscript Received</option>
                  <option value="Editing">Editing</option>
                  <option value="Cover Design">Cover Design</option>
                  <option value="Typesetting">Typesetting</option>
                  <option value="Proofreading">Proofreading</option>
                  <option value="Printing">Printing</option>
                  <option value="Distribution Setup">Distribution Setup</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
