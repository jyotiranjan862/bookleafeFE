import { apiClient } from "./client";
import type {
  ApiResponse,
  Book,
  BookFilterParams,
  PaginatedResult,
  Ticket,
  TicketAnalytics,
  TicketFilterParams,
  TicketMessage,
} from "../types";

export const adminApi = {
  /**
   * Get paginated admin ticket queue with filtering and sorting
   */
  getAdminQueue: async (params?: TicketFilterParams): Promise<PaginatedResult<Ticket>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResult<Ticket>>>("/admin/tickets", {
      params,
    });
    return data.data;
  },

  /**
   * Get ticket analytics count breakdown by status and category
   */
  getAnalytics: async (): Promise<TicketAnalytics> => {
    const { data } = await apiClient.get<ApiResponse<TicketAnalytics>>("/admin/tickets/analytics");
    return data.data;
  },

  /**
   * Get full ticket view for admin (includes internal notes and AI classification metadata)
   */
  getTicketById: async (id: string): Promise<Ticket> => {
    const { data } = await apiClient.get<ApiResponse<{ ticket: Ticket }>>(`/admin/tickets/${id}`);
    return data.data.ticket;
  },

  /**
   * Update ticket status with lifecycle transition validation
   */
  updateStatus: async (id: string, status: string): Promise<Ticket> => {
    const { data } = await apiClient.patch<ApiResponse<{ ticket: Ticket }>>(
      `/admin/tickets/${id}/status`,
      { status }
    );
    return data.data.ticket;
  },

  /**
   * Override AI-suggested category and/or priority
   */
  overrideClassification: async (
    id: string,
    overrides: { category?: string; priority?: string }
  ): Promise<Ticket> => {
    const { data } = await apiClient.patch<ApiResponse<{ ticket: Ticket }>>(
      `/admin/tickets/${id}/classification`,
      overrides
    );
    return data.data.ticket;
  },

  /**
   * Assign ticket to a support executive
   */
  assignTicket: async (id: string, assignedTo: string | null): Promise<Ticket> => {
    const { data } = await apiClient.patch<ApiResponse<{ ticket: Ticket }>>(
      `/admin/tickets/${id}/assign`,
      { assignedTo }
    );
    return data.data.ticket;
  },

  /**
   * Generate or regenerate AI draft response based on BookLeaf Knowledge Base
   */
  generateAiDraft: async (id: string): Promise<{ draftResponse: string; modelUsed?: string }> => {
    const { data } = await apiClient.post<ApiResponse<{ draftResponse: string; modelUsed?: string }>>(
      `/admin/tickets/${id}/ai-draft`
    );
    return data.data;
  },

  /**
   * Post message: public response to author OR private internal note
   */
  addMessage: async (
    id: string,
    body: string,
    isInternal: boolean = false
  ): Promise<TicketMessage> => {
    const { data } = await apiClient.post<ApiResponse<{ message: TicketMessage }>>(
      `/admin/tickets/${id}/messages`,
      { body, isInternal }
    );
    return data.data.message;
  },

  /**
   * View all books across all authors in the catalog
   */
  getAllBooks: async (params?: BookFilterParams): Promise<PaginatedResult<Book>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResult<Book>>>("/admin/books", {
      params,
    });
    return data.data;
  },

  /**
   * Create a new book title assigned to an author
   */
  createBook: async (payload: any): Promise<Book> => {
    const { data } = await apiClient.post<ApiResponse<{ book: Book }>>("/admin/books", payload);
    return data.data.book;
  },

  /**
   * Update book status, MRP, or internal notes
   */
  updateBook: async (id: string, updates: Partial<Book>): Promise<Book> => {
    const { data } = await apiClient.patch<ApiResponse<{ book: Book }>>(`/admin/books/${id}`, updates);
    return data.data.book || (data.data as any);
  },

  /**
   * Get paginated authors with live aggregated book counts and royalty financials
   */
  getAuthors: async (
    params?: any
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary: {
      totalAuthors: number;
      totalBooks: number;
      totalCopiesSold: number;
      totalEarned: number;
      totalPaid: number;
      totalPending: number;
    };
  }> => {
    const { data } = await apiClient.get<ApiResponse<any>>("/admin/authors", {
      params,
    });
    return data.data;
  },

  /**
   * Create and onboard a new author account
   */
  createAuthor: async (payload: any): Promise<any> => {
    const { data } = await apiClient.post<ApiResponse<{ author: any }>>("/admin/authors", payload);
    return data.data.author;
  },

  /**
   * Lightweight author list for dropdown select
   */
  getAuthorsDropdown: async (): Promise<Array<{ _id: string; name: string; email: string }>> => {
    const { data } = await apiClient.get<ApiResponse<{ authors: Array<{ _id: string; name: string; email: string }> }>>(
      "/admin/authors/dropdown"
    );
    return data.data.authors;
  },

  /**
   * Activate or deactivate author login status
   */
  updateAuthorStatus: async (authorId: string, isActive: boolean): Promise<any> => {
    const { data } = await apiClient.patch<ApiResponse<{ author: any }>>(
      `/admin/authors/${authorId}/status`,
      { isActive }
    );
    return data.data.author;
  },

  /**
   * Reset author account password
   */
  resetAuthorPassword: async (authorId: string, password: string): Promise<string> => {
    const { data } = await apiClient.patch<ApiResponse<any>>(
      `/admin/authors/${authorId}/password`,
      { password }
    );
    return data.message || "Password updated successfully";
  },

  /**
   * Get all books published by this specific author
   */
  getAuthorBooks: async (authorId: string): Promise<Book[]> => {
    const { data } = await apiClient.get<any>(
      `/admin/authors/${authorId}/books`
    );
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.data?.data)) return data.data.data;
    return [];
  },
};

