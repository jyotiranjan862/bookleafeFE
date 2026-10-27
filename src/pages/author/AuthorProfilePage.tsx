import { useState, useEffect } from "react";
import { AuthorLayout } from "../../components/layout/AuthorLayout";
import { useAuthContext } from "../../context/AuthContext";
import { authApi } from "../../api/authApi";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Check,
  ShieldCheck,
  Calendar,
  Save,
} from "lucide-react";

export function AuthorProfilePage() {
  const { user, checkSession } = useAuthContext();

  // Profile fields state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");

  // Bank fields state
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfscCode, setBankIfscCode] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorProfile, setErrorProfile] = useState<string | null>(null);
  const [errorBank, setErrorBank] = useState<string | null>(null);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.profile?.phone || "");
      setCity(user.profile?.city || "");
      setBio(user.profile?.bio || "");
      setBankAccountNumber(user.profile?.bankAccountNumber || "");
      setBankIfscCode(user.profile?.bankIfscCode || "");
      setBankAccountName(user.profile?.bankAccountName || user.name || "");
    }
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorProfile(null);
    try {
      setSavingProfile(true);
      await authApi.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        bio: bio.trim(),
      });
      await checkSession();
      showToast("Personal profile details updated successfully");
    } catch (err: any) {
      setErrorProfile(err?.message || "Failed to update profile details");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBank(null);
    try {
      setSavingBank(true);
      await authApi.updateProfile({
        bankAccountNumber: bankAccountNumber.trim(),
        bankIfscCode: bankIfscCode.trim().toUpperCase(),
        bankAccountName: bankAccountName.trim(),
      });
      await checkSession();
      showToast("Royalty payout bank credentials updated successfully");
    } catch (err: any) {
      setErrorBank(err?.message || "Failed to update bank details");
    } finally {
      setSavingBank(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPassword(null);
    if (newPassword.length < 8) {
      setErrorPassword("New password must be at least 8 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorPassword("New passwords do not match");
      return;
    }

    try {
      setSavingPassword(true);
      await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Security password updated successfully");
    } catch (err: any) {
      setErrorPassword(err?.message || "Failed to change password. Verify your current password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const bankLinked = Boolean(user?.profile?.bankLinked);
  const memberSince = (user as any)?.createdAt
    ? new Date((user as any).createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "2024";

  return (
    <AuthorLayout
      title="Author Profile & Payout Settings"
      subtitle="Manage your registered author identity, payout bank credentials, and portal security"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 bg-emerald-800 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Profile Header Summary Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xl font-serif">
              {user?.name?.charAt(0).toUpperCase() || <UserIcon className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">{user?.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase font-mono">
                  Active Author
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Member since {memberSince}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>80% Net Margin Royalty Tier</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Author Personal Details */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <UserIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
                <p className="text-[11px] text-slate-500">Official author contact details</p>
              </div>
            </div>

            {errorProfile && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorProfile}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-700 transition-colors"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ""}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-500 font-mono text-xs cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Primary identifier used for official notices and statements</p>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-700 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">City / Region</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. New Delhi, India"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-700 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Author Bio</label>
                <textarea
                  rows={3}
                  placeholder="Short bio for your BookLeaf catalog listings..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-700 transition-colors leading-relaxed"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingProfile ? "Saving..." : "Save Profile Details"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Royalty Disbursement Bank Profile */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Payout Bank Profile</h3>
                    <p className="text-[11px] text-slate-500">Direct quarterly royalty settlement account</p>
                  </div>
                </div>

                {bankLinked ? (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified & Linked</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <AlertCircle className="w-3 h-3" />
                    <span>Bank Pending</span>
                  </span>
                )}
              </div>

              {errorBank && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorBank}</span>
                </div>
              )}

              <form onSubmit={handleUpdateBank} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Beneficiary Account Holder Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Must match bank account records"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-emerald-700 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Bank Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50100234567890"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-emerald-700 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Bank IFSC Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC0001234"
                    value={bankIfscCode}
                    onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono uppercase text-xs focus:bg-white focus:outline-none focus:border-emerald-700 transition-colors"
                  />
                </div>

                {/* BookLeaf Institutional Policy Note */}
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-[11px] leading-relaxed space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <Building className="w-3.5 h-3.5" />
                    <span>Quarterly Disbursement & Rollover Terms</span>
                  </div>
                  <p>
                    Royalties are computed quarterly and disbursed directly into this account within 45 days of quarter end (Jan 10, Apr 10, Jul 10, Oct 10).
                  </p>
                  <p className="font-medium text-emerald-900">
                    <strong>₹1,000 Threshold:</strong> Balances under ₹1,000 automatically roll over into the subsequent quarterly payout cycle.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingBank}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50"
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>{savingBank ? "Saving..." : "Update Bank Details"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Card 3: Security & Password Update */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Account Security</h3>
                  <p className="text-[11px] text-slate-500">Update author portal login password</p>
                </div>
              </div>

              {errorPassword && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorPassword}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Current Password *</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter existing password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-700 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">New Password *</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-700 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-700 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{savingPassword ? "Updating..." : "Update Password"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AuthorLayout>
  );
}
