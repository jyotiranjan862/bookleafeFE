import axios from "axios";

/**
 * Base API Client
 * Configured with withCredentials: true so HTTP-only session cookies
 * are automatically sent and received on all requests.
 * Zero localStorage token handling.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

/**
 * Normalizes backend error responses into readable messages
 */
export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const serverMessage = error.response?.data?.message;
    if (serverMessage && typeof serverMessage === "string") {
      return serverMessage;
    }
    const details = error.response?.data?.details;
    if (Array.isArray(details) && details.length > 0 && details[0]?.message) {
      return details[0].message;
    }
    if (error.response?.status === 401) {
      return "Authentication required. Please log in.";
    }
    if (error.response?.status === 403) {
      return "You do not have permission to perform this action.";
    }
    if (error.response?.status === 404) {
      return "Requested resource not found.";
    }
    if (error.response?.status === 429) {
      return "Too many requests. Please wait a moment.";
    }
    return error.message || "A network error occurred.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred.";
};
