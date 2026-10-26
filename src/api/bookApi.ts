import { apiClient } from "./client";
import type {
  ApiResponse,
  Book,
  BookDropdownItem,
  BookFilterParams,
  PaginatedResult,
  RoyaltySummary,
} from "../types";

export const bookApi = {
  /**
   * Get paginated books for the logged-in author
   */
  getMyBooks: async (params?: BookFilterParams): Promise<PaginatedResult<Book>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResult<Book>>>("/books", {
      params,
    });
    return data.data;
  },

  /**
   * Get lightweight book list for ticket dropdown
   */
  getDropdownBooks: async (): Promise<BookDropdownItem[]> => {
    const { data } = await apiClient.get<ApiResponse<BookDropdownItem[]>>("/books/dropdown");
    return data.data;
  },

  /**
   * Get author catalog aggregated royalties
   */
  getRoyaltySummary: async (): Promise<RoyaltySummary> => {
    const { data } = await apiClient.get<ApiResponse<RoyaltySummary>>("/books/royalty-summary");
    return data.data;
  },

  /**
   * Get single book details
   */
  getBookById: async (id: string): Promise<Book> => {
    const { data } = await apiClient.get<ApiResponse<Book>>(`/books/${id}`);
    return data.data;
  },
};
