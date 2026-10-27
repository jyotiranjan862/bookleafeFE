import axios from "axios";

/**
 * Determine API Base URL strictly from environment variables (.env)
 * Supports both API_URL and VITE_API_URL.
 * Normalizes trailing slashes and ensures /api/v1 routing path.
 */
const getApiBaseUrl = (): string => {
  let url = (
    import.meta.env.API_URL ||
    import.meta.env.VITE_API_URL ||
    ""
  ).trim();

  // Strip trailing slash
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }

  // If server origin provided without /api/v1, append /api/v1
  if (url && !url.includes("/api/v1") && !url.includes("/api")) {
    url = `${url}/api/v1`;
  }

  return url;
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Attach JWT token to all requests when authenticated
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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
