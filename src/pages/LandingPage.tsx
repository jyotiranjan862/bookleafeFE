import { useState } from "react";
import { Navbar } from "../components/common/Navbar";
import { LoginModal } from "../components/common/LoginModal";
import {
  BookOpen,
  Shield,
  Sparkles,
  TrendingUp,
  Clock,
  Printer,
  Globe2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRole, setModalRole] = useState<"author" | "admin">("author");

  const openLogin = (role: "author" | "admin") => {
    setModalRole(role);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>AI-Grounded Author Support & Communication Portal</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-black text-stone-900 tracking-tight leading-[1.1] mb-6">
              Empowering Authors. <br />
              <span className="text-emerald-900 italic font-serif">Scaling Publishing Support.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-stone-600 font-normal leading-relaxed mb-8 max-w-2xl mx-auto">
              BookLeaf processes over 1,200 books every month across India and the US. 
              Our unified support portal combines live catalog telemetry with AI-assisted response drafting to deliver transparent, consistent, and instant resolution.
            </p>

            {/* Two Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-12">
              <button
                type="button"
                onClick={() => openLogin("author")}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group active:scale-95"
              >
                <BookOpen className="w-4 h-4 text-amber-200" />
                <span>Enter Author Portal</span>
                <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => openLogin("admin")}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-100 font-semibold text-sm border border-stone-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Operations & Admin Console</span>
              </button>
            </div>

            {/* Live Operational Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-6 border-t border-stone-200/80">
              <div className="p-3 bg-white/60 rounded-xl border border-stone-200">
                <span className="block text-2xl font-serif font-bold text-emerald-900">22,000+</span>
                <span className="text-xs text-stone-500 font-medium">Catalog Titles</span>
              </div>
              <div className="p-3 bg-white/60 rounded-xl border border-stone-200">
                <span className="block text-2xl font-serif font-bold text-emerald-900">1,200+</span>
                <span className="text-xs text-stone-500 font-medium">Monthly Books</span>
              </div>
              <div className="p-3 bg-white/60 rounded-xl border border-stone-200">
                <span className="block text-2xl font-serif font-bold text-emerald-900">80 / 20</span>
                <span className="text-xs text-stone-500 font-medium">Net Profit Royalty Split</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Knowledge Base Features */}
      <section id="royalties" className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 block mb-2">
            Institutional Knowledge Base
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            How BookLeaf Operates & Resolves Queries
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Royalty */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:border-emerald-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-2">Royalty & Payouts</h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-3">
              80% net profit paid quarterly within 45 days. Minimum payout threshold is ?1,000, rolling over automatically.
            </p>
            <ul className="text-[11px] space-y-1.5 text-stone-500 font-medium">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Quarterly ledger sync</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Transparent net formula</li>
            </ul>
          </div>

          {/* Card 2: ISBN */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:border-emerald-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-2">ISBN & Metadata</h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-3">
              Registered under BookLeaf publisher imprint. Metadata errors are treated as critical with an immediate 48-hour resolution SLA.
            </p>
            <ul className="text-[11px] space-y-1.5 text-stone-500 font-medium">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> High-priority escalation</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> 3-5 day marketplace sync</li>
            </ul>
          </div>

          {/* Card 3: Printing */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:border-emerald-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center mb-4">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-2">Printing & Quality</h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-3">
              In-house Delhi facility + Repro India and Epitome Books. Free reprint arranged within 5�7 business days upon photo verification.
            </p>
            <ul className="text-[11px] space-y-1.5 text-stone-500 font-medium">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> 100% Free reprints</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> In-house print verification</li>
            </ul>
          </div>

          {/* Card 4: Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:border-emerald-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mb-4">
              <Globe2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-2">Distribution</h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-3">
              Live listings across Amazon India, Flipkart, Amazon US, UK, and BookLeaf Store. Stock availability re-synced within 24�48 hours.
            </p>
            <ul className="text-[11px] space-y-1.5 text-stone-500 font-medium">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Multi-channel distribution</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Global marketplace sync</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Login Modal */}
      <LoginModal
        isOpen={modalOpen}
        initialRole={modalRole}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
