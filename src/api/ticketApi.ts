import { apiClient } from "./client";
import type {
  ApiResponse,
  CreateTicketPayload,
  PaginatedResult,
  Ticket,
  TicketFilterParams,
  TicketMessage,
} from "../types";

export const ticketApi = {
  /**
   * Submit a new support ticket (Author)
   */
  createTicket: async (payload: CreateTicketPayload): Promise<Ticket> => {
    const { data } = await apiClient.post<ApiResponse<{ ticket: Ticket }>>("/tickets", payload);
    return data.data.ticket;
  },

  /**
   * Get own submitted tickets (Author)
   */
  getMyTickets: async (params?: TicketFilterParams): Promise<PaginatedResult<Ticket>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResult<Ticket>>>("/tickets", {
      params,
    });
    return data.data;
  },

  /**
   * Get single ticket thread (Author)
   */
  getTicketById: async (id: string): Promise<Ticket> => {
    const { data } = await apiClient.get<ApiResponse<{ ticket: Ticket }>>(`/tickets/${id}`);
    return data.data.ticket;
  },

  /**
   * Reply to an open ticket (Author)
   */
  replyToTicket: async (id: string, body: string): Promise<TicketMessage> => {
    const { data } = await apiClient.post<ApiResponse<{ message: TicketMessage }>>(
      `/tickets/${id}/messages`,
      { body, isInternal: false }
    );
    return data.data.message;
  },
};
