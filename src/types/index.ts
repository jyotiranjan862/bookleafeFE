export type UserRole = "author" | "operations_executive" | "admin";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  profile?: {
    phone?: string;
    city?: string;
    bio?: string;
    bankLinked?: boolean;
  };
}

export interface Book {
  _id: string;
  title: string;
  isbn?: string;
  genre?: string;
  status: string;
  mrp?: number;
  authorRoyaltyPerCopy?: number;
  totalCopiesSold: number;
  totalRoyaltyEarned: number;
  royaltyPaid: number;
  royaltyPending: number;
  publicationDate?: string;
  printPartner?: string;
  availableOn: string[];
}

export interface TicketMessage {
  _id: string;
  senderType: "author" | "admin" | "system";
  sender: User | string;
  body: string;
  isInternal: boolean;
  isAiDraft?: boolean;
  createdAt: string;
}

export interface Ticket {
  _id: string;
  ticketNumber: string;
  author: User | string;
  book?: Book | string | null;
  subject: string;
  description: string;
  category: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Awaiting Author" | "Escalated" | "Resolved" | "Closed";
  assignedTo?: User | string | null;
  messages: TicketMessage[];
  ai?: {
    status: "pending" | "completed" | "failed" | "skipped";
    suggestedCategory?: string;
    categoryConfidenceScore?: number;
    suggestedPriority?: string;
    priorityRationale?: string;
    draftResponse?: string;
  };
  createdAt: string;
  updatedAt: string;
}

