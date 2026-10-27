# BookLeaf — Author Support & Communication Portal (Frontend)

A modern, responsive, dual-interface web application for BookLeaf Publishing built with React, TypeScript, and Vite. Designed to streamline author communication across 22,000+ titles with real-time WebSocket synchronization and AI-assisted triage.

---

## 🏛 Application Architecture

The frontend is cleanly architected into two role-protected interfaces powered by client-side routing, optimistic UI updates, and real-time Socket.IO synchronization:

```
┌─────────────────────────────────────────────────────────────┐
│                    React Router (v7)                        │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│    Author Portal Routes     │ │     Admin Portal Routes     │
│   (Role: author)            │ │ (Role: admin, operations)   │
├─────────────────────────────┤ ├─────────────────────────────┤
│ • /author/dashboard         │ │ • /admin/queue              │
│   - My Books Catalog        │ │   - Triage Queue            │
│   - Financial Royalty Ledger│ │   - Priority & Date Filters │
│ • /author/tickets           │ │   - AI Knowledge Assistant  │
│   - Submit Support Query    │ │   - Staff Self-Assignment   │
│   - Real-Time Message Thread│ │ • /admin/authors            │
│ • /author/profile           │ │ • /admin/books              │
│   - Bank Disbursement Config│ │ • /admin/analytics          │
└─────────────────────────────┘ └─────────────────────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Real-Time Socket.IO Layer                  │
│       Ticket Sync · Instant Messages · AI Classification    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

### 1. Author-Facing Portal (`/author/*`)
* **Authentication**: Simple email & password login with JWT token persistence. Authors are strictly scoped to their own catalog and tickets.
* **My Books Financial Ledger**:
  * Displays: **Title, ISBN, Genre, Publication Date, Publication Status, MRP, Units Sold, Royalty Earned, Royalty Paid, and Royalty Pending**.
  * Dynamic visual progress stepper mapping the 9 official BookLeaf production stages (from *Manuscript Received* to *Published & Live*).
  * Direct modal link to report issues against any specific catalog book.
* **Support Query Submission Modal**:
  * Book selector dropdown (including **"General / Account Level"**).
  * Quick query template buttons (Royalty & Settlement, Print Defects, Stock Availability, etc.).
  * Subject line and detailed description with live character counters.
  * **Optional file attachment support** with drag-and-drop preview for defective print photos and screenshots.
* **My Tickets & Real-Time Thread**:
  * Status chips: *Open, In Progress, Awaiting Author, Resolved, Closed*.
  * Real-time bidirectional message delivery via WebSockets—admin replies appear instantly without refreshing.
  * Admin internal notes are strictly isolated and never rendered in the author view.

### 2. Admin & Operations Portal (`/admin/*`)
* **Triage Ticket Queue**:
  * Instant queue metrics bar (Total, Open, In Progress, Critical SLA targets).
  * **Quick Priority Tabs**:
    * **All Tickets**: Standard queue view.
    * **🔥 Most Urgent**: Instantly isolates Critical priority tickets.
    * **⏳ Oldest Unresolved (FIFO)**: Automatically sorts Open/In-Progress queries by oldest first.
  * **Multi-Dimensional Filters**: Filter simultaneously by Status, Category, Priority, Date Range (Today, 7 Days, 30 Days), and Search keyword.
* **AI-Assisted Operations**:
  * **Automatic Classification & Priority Scoring**: Visual breakdown of AI suggested category and priority.
  * **Category Override**: Admin dropdown to immediately correct misclassified queries.
  * **Priority Override**: One-click adjustment between Critical, High, Medium, and Low.
  * **AI Draft Response Assistant**: One-click response generation pulling from the category-specific BookLeaf Knowledge Base, editable before sending.
* **Ticket Management & Ownership**:
  * **"Assign to Me" / Self-Assignment**: Support executives can claim tickets with one click, showing clear staff ownership in the queue table.
  * **Internal Staff Notes**: Toggle between public author replies and private internal notes (color-coded in amber).

---

## 🛠 Tech Stack

* **Core**: React 19, TypeScript
* **Build Tooling & Bundler**: Vite 8 with HMR
* **Routing**: React Router v7
* **Icons**: Lucide React
* **Styling**: Tailwind CSS & Modern Card Architecture
* **HTTP Client**: Axios with automatic JWT bearer interceptors and token refresh
* **Real-Time Client**: Socket.IO Client (room-scoped events)

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
* Node.js >= 20.x
* Backend server running on `http://localhost:5000`

### 2. Install Dependencies
```bash
cd frontend
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the `frontend` directory:

```ini
API_URL=http://localhost:5000/api/v1
SOCKET_URL=http://localhost:5000
```

### 4. Run the Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 5. Production Build
```bash
npm run build
```

---

## 👥 Pre-Configured Test Credentials

The database seeder (`npm run seed` in `backend`) creates the following ready-to-test accounts:

| Portal | Email | Password | Role / Details |
|---|---|---|---|
| **Admin Portal** | `admin@bookleaf.com` | `Admin@12345` | System Administrator |
| **Admin Portal** | `ops@bookleaf.com` | `Ops@12345` | Pooja Verma (Operations Lead) |
| **Author Portal** | `priya.sharma@email.com` | `Author@12345` | Priya Sharma (2 published books) |
| **Author Portal** | `rohit.kapoor@email.com` | `Author@12345` | Rohit Kapoor (Bestseller author) |
| **Author Portal** | `sneha.kulkarni@email.com` | `Author@12345` | Sneha Kulkarni (Book in Cover Design) |
| **Author Portal** | `kavita.deshmukh@email.com`| `Author@12345` | Kavita Deshmukh (Book in Typesetting) |
