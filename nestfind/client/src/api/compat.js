// Adapters: pages call these names; each delegates to the real API method.
import tenantApi from './tenantApi';
import landlordApi from './landlordApi';
import adminApi from './adminApi';

const wrap = (data) => ({ data: { data } });
const toArray = (d) => (Array.isArray(d) ? d : d ? [d] : []);

// ---------- tenant ----------
tenantApi.getRentals = async (params = {}) => {
  if (params.status === 'active') {
    const res = await tenantApi.getActiveRental();
    return wrap(toArray(res.data?.data));
  }
  const res = await tenantApi.getRentalHistory(params);
  const d = res.data?.data;
  return wrap(Array.isArray(d) ? d : d?.rentals || []);
};

tenantApi.getDashboard = async () => {
  const [rental, payments, maint, saved] = await Promise.allSettled([
    tenantApi.getActiveRental(),
    tenantApi.getPayments({ page: 1, limit: 5 }),
    tenantApi.getMaintenanceRequests({ status: 'pending' }),
    tenantApi.getSavedProperties(),
  ]);
  const val = (r) => (r.status === 'fulfilled' ? r.value.data?.data : null);
  const activeRental = toArray(val(rental))[0] || null;
  const recentPayments = toArray(val(payments));
  const completed = recentPayments.filter((p) => p.status === 'completed');
  return wrap({
    stats: {
      activeRentals: activeRental ? 1 : 0,
      totalPaid: activeRental?.totalRentPaid ?? completed.reduce((s, p) => s + (p.amount || 0), 0),
      savedProperties: toArray(val(saved)).length,
    },
    activeRental,
    recentPayments,
    pendingMaintenance: toArray(val(maint)).length,
  });
};

tenantApi.toggleSearchAlert = (id, enabled) => tenantApi.updateSavedSearch(id, { alertEnabled: enabled });

// ---------- landlord ----------
landlordApi.getPaymentStats = (params) => landlordApi.getMonthlySummary(params);
landlordApi.getOverdueRentals = (params) => landlordApi.getOverduePayments(params);

landlordApi.updateMaintenanceRequest = (id, data) => {
  switch (data.status) {
    case 'in_progress': return landlordApi.markInProgress(id, data);
    case 'resolved': return landlordApi.completeRequest(id, data);
    case 'closed': return landlordApi.rejectRequest(id, data);
    default: return landlordApi.acknowledgeRequest(id, data);
  }
};

// ---------- admin ----------
adminApi.suspendUser = (id, data = {}) => adminApi.updateUserStatus(id, { status: 'suspended', ...data });
adminApi.activateUser = (id) => adminApi.updateUserStatus(id, { status: 'active' });
adminApi.resolveReport = (id, data) => adminApi.processReport(id, data);
adminApi.getPosts = (params) => adminApi.getAllPosts(params);
adminApi.getFAQs = (params) => adminApi.getAllFAQs(params);
