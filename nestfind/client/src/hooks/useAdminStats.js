// nestfind/nestfind/client/src/hooks/useAdminStats.js

import { useState, useEffect, useCallback } from "react";
import adminApi from "../api/adminApi";

export const useAdminStats = () => {
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, overviewRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getOverview(),
      ]);
      setStats(statsRes.data.data);
      setOverview(overviewRes.data.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats,
    overview,
    loading,
    error,
    lastUpdated,
    refresh,
  };
};
