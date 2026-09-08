// nestfind/nestfind/client/src/hooks/useOTP.js

import { useState, useCallback, useRef } from "react";
import authApi from "../api/authApi";
import { useCountdown } from "./useCountdown";
import toast from "react-hot-toast";

export const useOTP = (purpose = "email_verification") => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef([]);
  const {
    seconds,
    isRunning,
    start: startCountdown,
    formatTime,
  } = useCountdown(60);

  const handleChange = useCallback(
    (index, value) => {
      if (!/^\d*$/.test(value)) return;
      const newOtp = [...otp];
      newOtp[index] = value.slice(-1);
      setOtp(newOtp);
      setError(null);

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp],
  );

  const handleKeyDown = useCallback(
    (index, e) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === "ArrowRight" && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp],
  );

  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, 6);
      if (pasted.length > 0) {
        const newOtp = [...otp];
        pasted.split("").forEach((char, i) => {
          if (i < 6) newOtp[i] = char;
        });
        setOtp(newOtp);
        const nextIndex = Math.min(pasted.length, 5);
        inputRefs.current[nextIndex]?.focus();
      }
    },
    [otp],
  );

  const sendOTP = useCallback(async () => {
    if (isRunning) return;
    setLoading(true);
    try {
      await authApi.sendOTP({ purpose });
      startCountdown(60);
      toast.success("Verification code sent to your email");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to send code";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [purpose, isRunning, startCountdown]);

  const verifyOTP = useCallback(async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return { success: false };
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.verifyOTP({ otp: code, purpose });
      setVerified(true);
      toast.success("Verification successful");
      return { success: true, otp: code };
    } catch (err) {
      const message =
        err.response?.data?.message || "Invalid verification code";
      setError(message);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [otp, purpose]);

  const reset = useCallback(() => {
    setOtp(["", "", "", "", "", ""]);
    setError(null);
    setVerified(false);
    inputRefs.current[0]?.focus();
  }, []);

  const otpValue = otp.join("");
  const isComplete = otpValue.length === 6;

  return {
    otp,
    otpValue,
    isComplete,
    loading,
    error,
    verified,
    inputRefs,
    countdown: seconds,
    isCountdownRunning: isRunning,
    countdownFormatted: formatTime(),
    handleChange,
    handleKeyDown,
    handlePaste,
    sendOTP,
    verifyOTP,
    reset,
  };
};
