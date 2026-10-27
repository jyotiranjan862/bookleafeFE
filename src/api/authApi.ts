import { apiClient } from "./client";
import type { ApiResponse, User } from "../types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const authApi = {
  /**
   * Authenticate with email & password.
   * HTTP-only cookies are automatically set in the browser by the backend.
   */
  login: async (credentials: LoginPayload): Promise<User> => {
    const { data } = await apiClient.post<
      ApiResponse<{ user: User; accessToken?: string; refreshToken?: string }>
    >("/auth/login", credentials);
    // Optional fallback for legacy headers
    if (data.data?.accessToken) {
      localStorage.setItem("accessToken", data.data.accessToken);
    }
    return data.data.user;
  },

  /**
   * Register a new author account.
   */
  register: async (payload: RegisterPayload): Promise<User> => {
    const { data } = await apiClient.post<
      ApiResponse<{ user: User; accessToken?: string; refreshToken?: string }>
    >("/auth/register", payload);
    if (data.data?.accessToken) {
      localStorage.setItem("accessToken", data.data.accessToken);
    }
    return data.data.user;
  },

  /**
   * Get current authenticated user profile using active session cookie
   */
  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<ApiResponse<{ user: User }>>("/auth/me");
    return data.data.user;
  },

  /**
   * Change user password
   */
  changePassword: async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
    const { data } = await apiClient.post<ApiResponse<null>>("/auth/change-password", payload);
    return { message: data.message || "Password changed successfully" };
  },

  /**
   * Update author profile and royalty payout bank credentials
   */
  updateProfile: async (payload: {
    name?: string;
    phone?: string;
    city?: string;
    bio?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    bankAccountName?: string;
  }): Promise<User> => {
    const { data } = await apiClient.patch<ApiResponse<{ user: User }>>("/auth/profile", payload);
    return data.data.user;
  },

  /**
   * Logout session (clears HTTP-only cookies on backend and local storage)
   */
  logout: async (): Promise<void> => {
    localStorage.removeItem("accessToken");
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Ignore network errors on logout
    }
  },
};
