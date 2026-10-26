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
   * Update book status, MRP, or internal notes
   */
  updateBook: async (id: string, updates: Partial<Book>): Promise<Book> => {
    const { data } = await apiClient.patch<ApiResponse<Book>>(`/admin/books/${id}`, updates);
    return data.data;
  },
};

