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
    const { data } = await apiClient.get<any>("/books/dropdown");
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.data?.books)) return data.data.books;
    return [];
  },

  /**
   * Get author catalog aggregated royalties
   */
  getRoyaltySummary: async (): Promise<RoyaltySummary> => {
    const { data } = await apiClient.get<any>("/books/royalty-summary");
    return data.data?.summary || data.data;
  },

  /**
   * Get single book details
   */
  getBookById: async (id: string): Promise<Book> => {
    const { data } = await apiClient.get<any>(`/books/${id}`);
    return data.data?.book || data.data;
  },
};
