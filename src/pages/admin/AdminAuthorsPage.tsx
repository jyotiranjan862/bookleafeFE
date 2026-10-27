import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { adminApi } from "../../api/adminApi";
import type { AuthorWithMetrics, Book } from "../../types";
import {
  Users,
  Search,
  RefreshCw,
  Plus,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  CreditCard,
  Eye,
  KeyRound,
  UserX,
  UserCheck,
  EyeOff,
} from "lucide-react";

export function AdminAuthorsPage() {
  const [authors, setAuthors] = useState<AuthorWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State — Default Limit: 50 as requested
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Global Real Aggregates
  const [globalSummary, setGlobalSummary] = useState({
    totalAuthors: 0,
    totalBooks: 0,
    totalCopiesSold: 0,
    totalEarned: 0,
    totalPaid: 0,
    totalPending: 0,
  });

  // Filters
  const [search, setSearch] = useState("");
  const [bankFilter, setBankFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals State
  const [showAddAuthorModal, setShowAddAuthorModal] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [authorDropdown, setAuthorDropdown] = useState<Array<{ _id: string; name: string; email: string }>>([]);

  // View Author Books Modal
  const [viewingAuthor, setViewingAuthor] = useState<AuthorWithMetrics | null>(null);
  const [authorBooks, setAuthorBooks] = useState<Book[]>([]);
  const [loadingAuthorBooks, setLoadingAuthorBooks] = useState(false);

  // Password Management Modal
  const [passwordModalAuthor, setPasswordModalAuthor] = useState<AuthorWithMetrics | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Add Author Form State
  const [authorForm, setAuthorForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    bio: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    bankAccountName: "",
  });
  const [submittingAuthor, setSubmittingAuthor] = useState(false);

  // Add Book Form State
  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    isbn: "",
    genre: "Fiction",
    mrp: 399,
    status: "Published & Live",
    availableOn: ["Amazon India", "Flipkart", "BookLeaf Store"],
  });
  const [submittingBook, setSubmittingBook] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchAuthors = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, limit };
      if (search.trim()) params.search = search.trim();
      if (bankFilter) params.bankLinked = bankFilter;
      if (statusFilter) params.status = statusFilter;

      const result = await adminApi.getAuthors(params);
      setAuthors(result.data || []);
      setTotalCount(result.total || (result.data ? result.data.length : 0));
      setTotalPages(result.totalPages || Math.ceil((result.total || 1) / limit) || 1);
      if (result.summary) {
        setGlobalSummary(result.summary);
      }
    } catch (err: any) {
      console.error("Failed to load authors:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, bankFilter, statusFilter]);

  const fetchDropdown = async () => {
    try {
      const list = await adminApi.getAuthorsDropdown();
      setAuthorDropdown(list || []);
    } catch (err) {
      console.error("Failed to load author dropdown:", err);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, [fetchAuthors]);

  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setPage(1);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // View Author Books
  const handleOpenAuthorBooks = async (author: AuthorWithMetrics) => {
    setViewingAuthor(author);
    setLoadingAuthorBooks(true);
    try {
      const books = await adminApi.getAuthorBooks(author._id);
      setAuthorBooks(books || []);
    } catch (err: any) {
      console.error("Failed to load author books:", err);
      alert("Failed to load author books");
    } finally {
      setLoadingAuthorBooks(false);
    }
  };

  // Toggle Active/Deactivate Login
  const handleToggleAuthorStatus = async (author: AuthorWithMetrics) => {
    const actionWord = author.isActive ? "deactivate" : "activate";
    const confirmed = window.confirm(
      `Are you sure you want to ${actionWord} login access for author "${author.name}"?`
    );
    if (!confirmed) return;

    try {
      const updated = await adminApi.updateAuthorStatus(author._id, !author.isActive);
      setAuthors((prev) =>
        prev.map((a) => (a._id === author._id ? { ...a, isActive: updated.isActive } : a))
      );
      showToast(`Author "${author.name}" is now ${updated.isActive ? "active" : "deactivated"}`);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to update author status");
    }
  };

  // Reset Author Password
  const handleOpenPasswordModal = (author: AuthorWithMetrics) => {
    setPasswordModalAuthor(author);
    setNewPassword("");
    setShowPasswordText(false);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalAuthor || !newPassword.trim()) return;

    if (newPassword.trim().length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    try {
      setSavingPassword(true);
      const msg = await adminApi.resetAuthorPassword(passwordModalAuthor._id, newPassword.trim());
      showToast(msg);
      setPasswordModalAuthor(null);
      setNewPassword("");
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to reset password");
    } finally {
      setSavingPassword(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setShowPasswordText(true);
  };

  // Create Author
  const handleCreateAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorForm.name.trim() || !authorForm.email.trim()) return;

    try {
      setSubmittingAuthor(true);
      await adminApi.createAuthor(authorForm);
      showToast(`Author "${authorForm.name}" created successfully`);
      setShowAddAuthorModal(false);
      setAuthorForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        city: "",
        bio: "",
        bankAccountNumber: "",
        bankIfscCode: "",
        bankAccountName: "",
      });
      fetchAuthors();
      fetchDropdown();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to create author");
    } finally {
      setSubmittingAuthor(false);
    }
  };

  // Open Add Book Modal
  const handleOpenAddBook = (authorId?: string) => {
    fetchDropdown();
    if (authorId) {
      setBookForm((prev) => ({ ...prev, author: authorId }));
    }
    setShowAddBookModal(true);
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title.trim() || !bookForm.author) {
      alert("Please enter a book title and select an author.");
      return;
    }

    try {
      setSubmittingBook(true);
      await adminApi.createBook(bookForm);
      showToast(`Book "${bookForm.title}" added to catalog successfully`);
      setShowAddBookModal(false);
      setBookForm({
        title: "",
        author: "",
        isbn: "",
        genre: "Fiction",
        mrp: 399,
        status: "Published & Live",
        availableOn: ["Amazon India", "Flipkart", "BookLeaf Store"],
      });
      fetchAuthors();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to create book");
    } finally {
      setSubmittingBook(false);
    }
  };

  const startEntry = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, totalCount);

  return (
    <AdminLayout
      title="Author Roster & Royalty Disbursements"
      subtitle="Author profile registry, book publishing ownership, account logins, and contractual 80% net margin royalties"
    >
      <div className="space-y-4">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 bg-emerald-700 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Global Financial Summary Cards in Modern White Theme (100% Real Live DB Data) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200/90 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Registered Authors
              </span>
              <Users className="w-4 h-4 text-emerald-700" />
            </div>
            <span className="text-xl font-bold text-slate-900 block">{globalSummary.totalAuthors}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Author database total</span>
          </div>

          <div className="bg-white border border-slate-200/90 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Catalog Titles
              </span>
              <BookOpen className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-xl font-bold text-slate-900 block">{globalSummary.totalBooks}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {globalSummary.totalCopiesSold.toLocaleString()} total units sold
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Royalties Disbursed
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
            <span className="text-xl font-bold text-emerald-700 block">
              ₹{globalSummary.totalPaid.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Total payout to authors</span>
          </div>

          <div className="bg-white border border-slate-200/90 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Pending Future Payouts
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xl font-bold text-amber-700 block">
              ₹{globalSummary.totalPending.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Upcoming quarterly cycle</span>
          </div>
        </div>

        {/* Action, Filter, and Search Bar */}
        <div className="bg-white border border-slate-200/90 p-3 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex flex-1 items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search authors by name, email, or city..."
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
              />
            </div>

            <button
              onClick={() => fetchAuthors()}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Refresh authors list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-700" : ""}`} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1 text-slate-400 text-xs font-medium mr-1">
              <SlidersHorizontal className="w-3 h-3" />
              <span>Filters:</span>
            </div>

            {/* Login Account Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              className="bg-slate-50 border border-slate-200/80 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
            >
              <option value="">All Accounts</option>
              <option value="active">Active Login Only</option>
              <option value="inactive">Deactivated Only</option>
            </select>

            {/* Bank Filter */}
            <select
              value={bankFilter}
              onChange={(e) => handleFilterChange(setBankFilter, e.target.value)}
              className="bg-slate-50 border border-slate-200/80 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg focus:bg-white focus:outline-none focus:border-emerald-600 font-medium"
            >
              <option value="">All Bank Statuses</option>
              <option value="true">Bank Linked</option>
              <option value="false">Bank Pending</option>
            </select>

            {(bankFilter || search || statusFilter) && (
              <button
                onClick={() => {
                  setBankFilter("");
                  setSearch("");
                  setStatusFilter("");
                  setPage(1);
                }}
                className="px-2 py-1 text-xs text-slate-500 hover:text-slate-900 font-semibold"
              >
                Reset
              </button>
            )}

            {/* Actions */}
            <button
              onClick={() => handleOpenAddBook()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors"
            >
              <BookOpen className="w-3 h-3 text-slate-600" />
              <span>+ Add Book</span>
            </button>

            <button
              onClick={() => setShowAddAuthorModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span> Add Author</span>
            </button>
          </div>
        </div>

        {/* Master Authors Table — Compact Row UI for Maximum Density */}
        <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Author Profile</th>
                  <th className="py-2.5 px-3">Location & Phone</th>
                  <th className="py-2.5 px-3">Login Status</th>
                  <th className="py-2.5 px-3">Catalog Books</th>
                  <th className="py-2.5 px-3">Sales Units</th>
                  <th className="py-2.5 px-3">Accrued (₹)</th>
                  <th className="py-2.5 px-3">Paid (₹)</th>
                  <th className="py-2.5 px-3">Upcoming Payout</th>
                  <th className="py-2.5 px-3">Bank Details</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
                        <span>Loading author registry (up to {limit} rows)...</span>
                      </div>
                    </td>
                  </tr>
                ) : authors.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 font-medium">
                      No authors found matching current filter criteria.
                    </td>
                  </tr>
                ) : (
                  authors.map((a) => {
                    const pending = Math.max(0, (a.totalRoyaltyEarned || 0) - (a.royaltyPaid || 0));

                    return (
                      <tr key={a._id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Author Profile */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900 leading-tight">{a.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{a.email}</div>
                        </td>

                        {/* Location & Phone */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="text-slate-800 font-medium text-[11px] leading-tight">
                            {a.profile?.city || "—"}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {a.profile?.phone || "No phone"}
                          </div>
                        </td>

                        {/* Login Status */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          {a.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              <span>Deactivated</span>
                            </span>
                          )}
                        </td>

                        {/* Catalog Books with Eye Icon Trigger */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {a.booksCount || 0}
                            </span>
                            <button
                              onClick={() => handleOpenAuthorBooks(a)}
                              className="p-1 rounded text-slate-400 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                              title="View author books catalog"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Total Sales */}
                        <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                          {(a.totalCopiesSold || 0).toLocaleString()}
                        </td>

                        {/* Accrued */}
                        <td className="py-2 px-3 whitespace-nowrap font-mono font-semibold text-blue-700 text-[11px]">
                          ₹{(a.totalRoyaltyEarned || 0).toLocaleString()}
                        </td>

                        {/* Paid */}
                        <td className="py-2 px-3 whitespace-nowrap font-mono font-semibold text-emerald-700 text-[11px]">
                          ₹{(a.royaltyPaid || 0).toLocaleString()}
                        </td>

                        {/* Upcoming Payout */}
                        <td className="py-2 px-3 whitespace-nowrap font-mono font-bold text-[11px]">
                          <span className={pending > 0 ? "text-amber-700" : "text-slate-400"}>
                            ₹{pending.toLocaleString()}
                          </span>
                        </td>

                        {/* Bank Status */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          {a.profile?.bankLinked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CreditCard className="w-2.5 h-2.5" />
                              <span>Linked</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* Actions: View Books, Reset Password, Active/Deactivate Login, Add Book */}
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {/* View Books Eye Button */}
                            <button
                              onClick={() => handleOpenAuthorBooks(a)}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 border border-slate-200 transition-colors"
                              title="View author's books"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Reset Password Button */}
                            <button
                              onClick={() => handleOpenPasswordModal(a)}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 transition-colors"
                              title="Manage author password"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            {/* Activate / Deactivate Toggle Button */}
                            <button
                              onClick={() => handleToggleAuthorStatus(a)}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                a.isActive
                                  ? "bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 border-slate-200"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                              }`}
                              title={a.isActive ? "Deactivate login access" : "Activate login access"}
                            >
                              {a.isActive ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Add Book Button */}
                            <button
                              onClick={() => handleOpenAddBook(a._id)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-semibold transition-colors"
                              title="Publish new book for this author"
                            >
                              + Book
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Compact Pagination Toolbar — Default 50 per page */}
          <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <span>
                Showing <strong className="text-slate-900">{startEntry}</strong> to{" "}
                <strong className="text-slate-900">{endEntry}</strong> of{" "}
                <strong className="text-slate-900">{totalCount}</strong> authors
              </span>

              <div className="flex items-center gap-1 pl-2.5 border-l border-slate-200">
                <span className="text-slate-500 text-[11px]">Rows:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-600"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1 || loading}
                className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-2 py-1 rounded bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-0.5 text-xs"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Prev</span>
              </button>

              <div className="px-2.5 py-0.5 font-semibold text-slate-700 bg-white border border-slate-200 rounded text-xs">
                Page {page} of {Math.max(1, totalPages)}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="px-2 py-1 rounded bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-0.5 text-xs"
              >
                <span>Next</span>
                <ChevronRight className="w-3 h-3" />
              </button>

              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages || loading}
                className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Author Books Modal */}
      {viewingAuthor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setViewingAuthor(null)}
          />

          <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Published Titles by {viewingAuthor.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {viewingAuthor.email} • {authorBooks.length} book(s) in catalog
                </p>
              </div>
              <button
                onClick={() => setViewingAuthor(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {loadingAuthorBooks ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-700" />
                  <span>Loading author catalog...</span>
                </div>
              ) : authorBooks.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-medium">
                  No books found for this author.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">ISBN</th>
                      <th className="py-2.5 px-3">Title & Genre</th>
                      <th className="py-2.5 px-3">MRP (₹)</th>
                      <th className="py-2.5 px-3">Sales Units</th>
                      <th className="py-2.5 px-3">Accrued (₹)</th>
                      <th className="py-2.5 px-3">Paid (₹)</th>
                      <th className="py-2.5 px-3">Pending (₹)</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Channels</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {authorBooks.map((b) => {
                      const bookPending = (b.totalRoyaltyEarned || 0) - (b.royaltyPaid || 0);

                      return (
                        <tr key={b._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                            {b.isbn || "N/A"}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{b.title}</div>
                            {b.genre && (
                              <span className="text-[10px] text-slate-500">{b.genre}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                            ₹{b.mrp || 0}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                            {(b.totalCopiesSold || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-blue-700 whitespace-nowrap">
                            ₹{(b.totalRoyaltyEarned || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-emerald-700 whitespace-nowrap">
                            ₹{(b.royaltyPaid || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap">
                            <span className={bookPending > 0 ? "text-amber-700" : "text-slate-400"}>
                              ₹{bookPending.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {b.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[10px] max-w-xs truncate">
                            {b.availableOn?.join(", ") || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5 shrink-0 mt-4">
              <button
                onClick={() => {
                  const authorId = viewingAuthor._id;
                  setViewingAuthor(null);
                  handleOpenAddBook(authorId);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-colors"
              >
                + Add Another Book
              </button>
              <button
                onClick={() => setViewingAuthor(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Management Modal */}
      {passwordModalAuthor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setPasswordModalAuthor(null)}
          />

          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Reset Author Password</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {passwordModalAuthor.name} ({passwordModalAuthor.email})
                </p>
              </div>
              <button
                onClick={() => setPasswordModalAuthor(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold">New Account Password *</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold"
                  >
                    Generate Random
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPasswordText ? "text" : "password"}
                    required
                    placeholder="Enter minimum 8 characters..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-10 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Author will immediately be able to log in with this updated password.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPasswordModalAuthor(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword || !newPassword.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {savingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Author Modal */}
      {showAddAuthorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowAddAuthorModal(false)}
          />

          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Onboard New Author</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create author credentials, publication profile, and bank details
                </p>
              </div>
              <button
                onClick={() => setShowAddAuthorModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAuthor} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Author Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Seth"
                    value={authorForm.name}
                    onChange={(e) => setAuthorForm({ ...authorForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. author@email.com"
                    value={authorForm.email}
                    onChange={(e) => setAuthorForm({ ...authorForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Initial Password</label>
                  <input
                    type="password"
                    placeholder="Default: Author@12345"
                    value={authorForm.password}
                    onChange={(e) => setAuthorForm({ ...authorForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={authorForm.phone}
                    onChange={(e) => setAuthorForm({ ...authorForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">City / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. New Delhi"
                    value={authorForm.city}
                    onChange={(e) => setAuthorForm({ ...authorForm, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="As in bank records"
                    value={authorForm.bankAccountName}
                    onChange={(e) => setAuthorForm({ ...authorForm, bankAccountName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              {/* Bank Details Sub-card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Royalty Payout Bank Information
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 50100234567890"
                      value={authorForm.bankAccountNumber}
                      onChange={(e) => setAuthorForm({ ...authorForm, bankAccountNumber: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Bank IFSC Code</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC0001234"
                      value={authorForm.bankIfscCode}
                      onChange={(e) => setAuthorForm({ ...authorForm, bankIfscCode: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono uppercase text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddAuthorModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAuthor}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {submittingAuthor ? "Saving..." : "Create Author"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Book Modal */}
      {showAddBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowAddBookModal(false)}
          />

          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Publish New Book Title</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Register new title in BookLeaf catalog under author ownership
                </p>
              </div>
              <button
                onClick={() => setShowAddBookModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Select Author *</label>
                <select
                  required
                  value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
                >
                  <option value="">Choose an author...</option>
                  {authorDropdown.map((author) => (
                    <option key={author._id} value={author._id}>
                      {author.name} ({author.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shadows of the Western Ghats"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">ISBN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 978-81-945678-0-1"
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Genre</label>
                  <select
                    value={bookForm.genre}
                    onChange={(e) => setBookForm({ ...bookForm, genre: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
                  >
                    <option value="Fiction">Fiction</option>
                    <option value="Non-Fiction">Non-Fiction</option>
                    <option value="Poetry">Poetry</option>
                    <option value="Self-Help">Self-Help</option>
                    <option value="Business">Business</option>
                    <option value="Academic">Academic</option>
                    <option value="Mystery / Thriller">Mystery / Thriller</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Retail MRP (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={bookForm.mrp}
                    onChange={(e) => setBookForm({ ...bookForm, mrp: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Publication Status</label>
                  <select
                    value={bookForm.status}
                    onChange={(e) => setBookForm({ ...bookForm, status: e.target.value })}
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
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddBookModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBook}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {submittingBook ? "Publishing..." : "Add to Catalog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
