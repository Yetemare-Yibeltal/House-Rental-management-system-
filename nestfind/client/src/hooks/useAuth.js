// nestfind/nestfind/client/src/hooks/useAuth.js

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../context/AuthContext";
import authApi from "../api/authApi";
import { setTokens, clearAuthData } from "../utils/tokenService";
import toast from "react-hot-toast";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const { setUser, setTokensAndUser, logout, refreshUser } = useAuthStore();
  const navigate = useNavigate();

  const register = async (data) => {
    setLoading(true);
    try {
      const response = await authApi.register(data);
      const { user, accessToken, refreshToken } = response.data.data;
      setTokensAndUser(accessToken, refreshToken, user);
      toast.success("Account created successfully!");
      navigate("/verify-otp", {
        state: { purpose: "email_verification", email: user.email },
      });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password, rememberMe, from }) => {
    setLoading(true);
    try {
      const response = await authApi.login({ email, password, rememberMe });
      const { user, accessToken, refreshToken } = response.data.data;
      setTokensAndUser(accessToken, refreshToken, user);
      toast.success(`Welcome back, ${user.firstName}!`);
      const dashboardMap = {
        admin: "/admin/dashboard",
        landlord: "/landlord/dashboard",
        tenant: "/tenant/dashboard",
      };
      navigate(from || dashboardMap[user.role] || "/");
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      toast.success("Reset code sent to your email");
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reset code");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (data) => {
    setLoading(true);
    try {
      await authApi.resetPassword(data);
      toast.success("Password reset successfully!");
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data) => {
    setLoading(true);
    try {
      const response = await authApi.updateProfile(data);
      setUser(response.data.data);
      toast.success("Profile updated successfully!");
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await authApi.uploadAvatar(formData);
    setUser(response.data.data);
    return response.data.data;
  };

  const submitKYC = async (data) => {
    setLoading(true);
    try {
      await authApi.submitKYC(data);
      toast.success("KYC submitted for review!");
      await refreshUser();
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || "KYC submission failed");
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    uploadAvatar,
    submitKYC,
    refreshUser,
  };
};

export default useAuth;
