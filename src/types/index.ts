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
    bankAccountNumber?: string;
    bankIfscCode?: string;
    bankAccountName?: string;
    bankLinked?: boolean;
  };
  createdAt?: string;
}

export interface Book {
  _id: string;
  externalId?: string;
  author: User | string;
  title: string;
  isbn?: string;
  genre?: string;
  description?: string;
  status: string;
  mrp?: number;
  authorRoyaltyPerCopy?: number;
  totalCopiesSold: number;
  totalRoyaltyEarned: number;
  royaltyPaid: number;
  royaltyPending: number;
  publicationDate?: string | null;
  lastRoyaltyPayoutDate?: string | null;
  printPartner?: string | null;
  availableOn: string[];
}

export interface BookDropdownItem {
  _id: string;
  title: string;
  isbn?: string;
}

export interface RoyaltySummary {
  totalEarned: number;
  totalPaid: number;
  totalPending: number;
}

export interface TicketAttachment {
  _id?: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageUrl: string;
  publicId?: string;
}

export interface TicketMessage {
  _id: string;
  senderType: "author" | "admin" | "system";
  sender: User | { _id: string; name: string; role: string } | string;
  body: string;
  isInternal: boolean;
  isAiDraft?: boolean;
  aiDraftEdited?: boolean;
  attachments?: TicketAttachment[];
  createdAt: string;
}

export interface TicketAIClassification {
  status: "pending" | "completed" | "failed" | "skipped";
  suggestedCategory?: string | null;
  categoryConfidenceScore?: number | null;
  suggestedPriority?: "Critical" | "High" | "Medium" | "Low" | null;
  priorityRationale?: string | null;
  draftResponse?: string | null;
  draftGeneratedAt?: string | null;
  modelUsed?: string | null;
  promptTokensUsed?: number | null;
  completionTokensUsed?: number | null;
  processingDurationMs?: number | null;
  failureReason?: string | null;
}

export interface Ticket {
  _id: string;
  ticketNumber: string;
  author: User | { _id: string; name: string; email: string };
  book?: Book | { _id: string; title: string; isbn?: string } | null;
  subject: string;
  description: string;
  category: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Awaiting Author" | "Escalated" | "Resolved" | "Closed";
  assignedTo?: User | { _id: string; name: string; email: string } | null;
  messages: TicketMessage[];
  attachments?: TicketAttachment[];
  ai?: TicketAIClassification;
  createdAt: string;
  updatedAt: string;
  ageHours?: number;
  isOverdue?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TicketAnalytics {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}

export interface TicketFilterParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  status?: string;
  category?: string;
  priority?: string;
  assignedTo?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface BookFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface CreateTicketPayload {
  bookId?: string;
  subject: string;
  description: string;
  attachments?: TicketAttachment[];
}

export interface AuthorWithMetrics {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  profile?: {
    phone?: string;
    city?: string;
    bio?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    bankAccountName?: string;
    bankLinked?: boolean;
  };
  booksCount: number;
  totalCopiesSold: number;
  totalRoyaltyEarned: number;
  royaltyPaid: number;
  royaltyPending: number;
  createdAt: string;
}

export interface AuthorFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  bankLinked?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface AuthorDropdownItem {
  _id: string;
  name: string;
  email: string;
}

export interface CreateAuthorPayload {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  city?: string;
  bio?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankAccountName?: string;
}

export interface CreateBookPayload {
  title: string;
  author: string;
  isbn?: string;
  genre?: string;
  mrp?: number;
  status?: string;
  availableOn?: string[];
}

