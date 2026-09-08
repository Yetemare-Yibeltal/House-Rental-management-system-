// nestfind/nestfind/client/src/hooks/usePayment.js

import { useState, useCallback } from "react";
import tenantApi from "../api/tenantApi";
import toast from "react-hot-toast";

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPayments = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await tenantApi.getPayments(params);
      const { data, pagination } = response.data;
      setPayments(data);
      setTotalPages(pagination.totalPages || 1);
      setCurrentPage(pagination.page || 1);
      return { success: true, data };
    } catch (err) {
      toast.error("Failed to load payments");
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const createPayment = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await tenantApi.createPayment(data);
      toast.success("Payment processed successfully");
      return { success: true, payment: response.data.data.payment };
    } catch (err) {
      const message = err.response?.data?.message || "Payment failed";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const raiseDispute = useCallback(async (paymentId, reason) => {
    setLoading(true);
    try {
      await tenantApi.raiseDispute(paymentId, { reason });
      toast.success(
        "Dispute submitted. Our team will investigate within 48 hours.",
      );
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to raise dispute";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaymentReceipt = useCallback(async (paymentId) => {
    setLoading(true);
    try {
      const response = await tenantApi.getPaymentReceipt(paymentId);
      return { success: true, payment: response.data.data.payment };
    } catch {
      toast.error("Failed to load receipt");
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    payments,
    totalPages,
    currentPage,
    fetchPayments,
    createPayment,
    raiseDispute,
    getPaymentReceipt,
  };
};
