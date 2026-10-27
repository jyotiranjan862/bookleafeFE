import { useState, useEffect, useCallback } from "react";
import { authApi } from "../api/authApi";
import type { LoginPayload, RegisterPayload, ChangePasswordPayload } from "../api/authApi";
import { getApiErrorMessage } from "../api/client";
import type { User } from "../types";
import { ROLES } from "../utils/constants";

export interface UseAuthResult {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAuthor: boolean;
  isAdmin: boolean;
  isOperationsExecutive: boolean;
  login: (credentials: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<{ message: string }>;
  checkSession: () => Promise<User | null>;
}

/**
 * Clean, cookie-based authentication hook.
 * Relies exclusively on HTTP-only session cookies sent by the browser.
 * Zero localStorage usage.
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check current session from HTTP cookie on initial mount
  const checkSession = useCallback(async (): Promise<User | null> => {
    try {
      setLoading(true);
      setError(null);
      const currentUser = await authApi.getMe();
      setUser(currentUser);
      return currentUser;
    } catch {
      localStorage.removeItem("accessToken");
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (credentials: LoginPayload): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
      const loggedInUser = await authApi.login(credentials);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
      const newUser = await authApi.register(payload);
      setUser(newUser);
      return newUser;
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  const changePassword = async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
    try {
      return await authApi.changePassword(payload);
    } catch (err) {
      const msg = getApiErrorMessage(err);
      throw new Error(msg);
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAuthor: user?.role === ROLES.AUTHOR,
    isAdmin: user?.role === ROLES.ADMIN,
    isOperationsExecutive: user?.role === ROLES.OPERATIONS_EXECUTIVE,
    login,
    register,
    logout,
    changePassword,
    checkSession,
  };
}
