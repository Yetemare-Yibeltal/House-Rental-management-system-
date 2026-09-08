// nestfind/nestfind/client/src/hooks/useAuth.js

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../context/AuthContext";
import authApi from "../api/authApi";
import { setAccessToken, clearAuthData } from "../utils/tokenService";
import toast from "react-hot-toast";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { setUser, setAuthenticated, clearUser } = useAuthStore();

  const clearError = useCallback(() => setError(null), []);

  const register = useCallback(
    async (data) => {
      setLoading(true);
      setError(null);
      try {
        const response = await authApi.register(data);
        toast.success(response.data.message);
        navigate("/verify-otp", {
          state: { purpose: "email_verification", email: data.email },
        });
        return { success: true };
      } catch (err) {
        const message = err.response?.data?.message || "Registration failed";
        setError(message);
        toast.error(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  const login = useCallback(
    async (data) => {
      setLoading(true);
      setError(null);
      try {
        const response = await authApi.login(data);
        const { user, tokens } = response.data.data;
        setAccessToken(tokens.accessToken);
        setUser(user);
        setAuthenticated(true);
        toast.success(`Welcome back, ${user.firstName}!`);

        if (user.role === "admin") navigate("/admin/dashboard");
        else if (user.role === "landlord") navigate("/landlord/dashboard");
        else navigate("/tenant/dashboard");

        return { success: true, user };
      } catch (err) {
        const message = err.response?.data?.message || "Login failed";
        setError(message);
        toast.error(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [navigate, setUser, setAuthenticated],
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authApi.logout();
    } catch {
    } finally {
      clearAuthData();
      clearUser();
      setAuthenticated(false);
      navigate("/login");
      toast.success("Logged out successfully");
      setLoading(false);
    }
  }, [navigate, clearUser, setAuthenticated]);

  const logoutAll = useCallback(async () => {
    setLoading(true);
    try {
      await authApi.logoutAll();
      clearAuthData();
      clearUser();
      setAuthenticated(false);
      navigate("/login");
      toast.success("Logged out from all devices");
    } catch (err) {
      toast.error("Failed to logout from all devices");
    } finally {
      setLoading(false);
    }
  }, [navigate, clearUser, setAuthenticated]);

  const forgotPassword = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.forgotPassword({ email });
      toast.success(response.data.message);
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to send reset email";
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(
    async (data) => {
      setLoading(true);
      setError(null);
      try {
        const response = await authApi.resetPassword(data);
        toast.success(response.data.message);
        navigate("/login");
        return { success: true };
      } catch (err) {
        const message =
          err.response?.data?.message || "Failed to reset password";
        setError(message);
        toast.error(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  const changePassword = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.changePassword(data);
      toast.success(response.data.message);
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to change password";
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (data) => {
      setLoading(true);
      setError(null);
      try {
        const response = await authApi.updateProfile(data);
        setUser(response.data.data.user);
        toast.success("Profile updated successfully");
        return { success: true, user: response.data.data.user };
      } catch (err) {
        const message =
          err.response?.data?.message || "Failed to update profile";
        setError(message);
        toast.error(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [setUser],
  );

  const uploadAvatar = useCallback(
    async (file) => {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append("avatar", file);
        const response = await authApi.uploadAvatar(formData);
        setUser((prev) => ({ ...prev, avatar: response.data.data.avatar }));
        toast.success("Avatar updated successfully");
        return { success: true };
      } catch (err) {
        toast.error("Failed to upload avatar");
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [setUser],
  );

  const updateNotificationPreferences = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await authApi.updateNotificationPreferences(data);
      toast.success("Notification preferences updated");
      return {
        success: true,
        preferences: response.data.data.notificationPreferences,
      };
    } catch (err) {
      toast.error("Failed to update preferences");
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAIPreferences = useCallback(
    async (data) => {
      setLoading(true);
      try {
        const response = await authApi.updateAIPreferences(data);
        setUser((prev) => ({
          ...prev,
          aiPreferences: response.data.data.aiPreferences,
        }));
        toast.success("AI preferences updated");
        return { success: true };
      } catch (err) {
        toast.error("Failed to update AI preferences");
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [setUser],
  );

  const submitKYC = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.submitKYC(formData);
      toast.success("KYC documents submitted successfully");
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "KYC submission failed";
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    clearError,
    register,
    login,
    logout,
    logoutAll,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    uploadAvatar,
    updateNotificationPreferences,
    updateAIPreferences,
    submitKYC,
  };
};
