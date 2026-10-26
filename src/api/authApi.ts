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
   * HTTP-only session cookie is set automatically by backend.
   */
  login: async (credentials: LoginPayload): Promise<User> => {
    const { data } = await apiClient.post<ApiResponse<{ user: User }>>("/auth/login", credentials);
    return data.data.user;
  },

  /**
   * Register a new author account.
   */
  register: async (payload: RegisterPayload): Promise<User> => {
    const { data } = await apiClient.post<ApiResponse<{ user: User }>>("/auth/register", payload);
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
   * Logout session (clears HTTP cookie on backend)
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Ignore if logout route is missing or fails
    }
  },
};
