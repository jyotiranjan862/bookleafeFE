import { useState } from "react";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState<"author" | "admin">("author");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              B
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-lg">BookLeaf</span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Support Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("author")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === "author"
                  ? "bg-white text-emerald-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Author Portal
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === "admin"
                  ? "bg-white text-indigo-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Admin Operations
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Verification Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-8 text-white shadow-lg mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 animate-ping"></span>
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-200">
              Tailwind CSS v4 Verified & Active
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Author Support & Communication Portal
          </h1>
          <p className="text-emerald-100 text-sm max-w-2xl leading-relaxed">
            Frontend architecture scaffolded with modular separation for Author and Operations dashboards, ready for state management, API routes, and Socket.IO real-time channels.
          </p>
        </div>

        {/* Scaffold Health & Structure Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Card 1: Tailwind Test */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-4">
              ?
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">Tailwind CSS v4</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              Native Vite plugin integration active with modern color palettes, typography, and responsive breakpoints.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Engine Ready
            </span>
          </div>

          {/* Card 2: Modular Architecture */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mb-4">
              ??
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">Clean Folder Structure</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              Separated into <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">api/</code>, <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">components/</code>, <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">pages/</code>, <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">context/</code>, and <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">types/</code>.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
              Architecture Scaffolded
            </span>
          </div>

          {/* Card 3: Dual-Portal Support */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold mb-4">
              ?
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">Dual Interfaces</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              Pre-configured routing zones for Author-facing dashboard and Admin operations queue with AI draft controls.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              Dual Portal Wireframe
            </span>
          </div>
        </div>

        {/* Directory Blueprint View */}
        <div className="bg-slate-900 rounded-xl p-6 text-slate-200 font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-slate-400 font-sans">
            <span className="font-semibold text-xs tracking-wide">frontend/src/ Directory Blueprint</span>
            <span className="text-[11px] text-emerald-400 font-mono">? All folders created</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
            <div>
              <p className="text-emerald-400 font-bold mb-1">?? src/api/ <span className="text-slate-500 font-normal">? Axios client & API endpoints</span></p>
              <p className="text-emerald-400 font-bold mb-1">?? src/components/ <span className="text-slate-500 font-normal">? Common, Layout, & Ticket UI</span></p>
              <p className="text-emerald-400 font-bold mb-1">?? src/context/ <span className="text-slate-500 font-normal">? AuthContext & SocketContext</span></p>
              <p className="text-emerald-400 font-bold mb-1">?? src/hooks/ <span className="text-slate-500 font-normal">? useAuth, useSocket, useTickets</span></p>
            </div>
            <div>
              <p className="text-indigo-400 font-bold mb-1">?? src/pages/author/ <span className="text-slate-500 font-normal">? My Books, Raise Ticket, Ticket Thread</span></p>
              <p className="text-indigo-400 font-bold mb-1">?? src/pages/admin/ <span className="text-slate-500 font-normal">? Ticket Queue, AI Drafts, Overrides</span></p>
              <p className="text-indigo-400 font-bold mb-1">?? src/types/ <span className="text-slate-500 font-normal">? User, Book, Ticket TypeScript interfaces</span></p>
              <p className="text-indigo-400 font-bold mb-1">?? src/utils/ <span className="text-slate-500 font-normal">? Constants (Roles, Statuses, Categories)</span></p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

