// nestfind/nestfind/client/src/pages/landlord/LandlordDashboard.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, CreditCard, CalendarCheck, TrendingUp, Plus, ArrowRight, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import OccupancyDonut from '../../components/landlord/OccupancyDonut';
import BookingRequestCard from '../../components/landlord/BookingRequestCard';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import SEO from '../../components/common/SEO';
import { useAuthStore } from '../../context/AuthContext';
import landlordApi from '../../api/landlordApi';
import { formatCurrency, formatDate } from '../../utils/formatters';

const LandlordDashboard = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await landlordApi.getDashboard();
      setData(response.data.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) return <DashboardLayout><PageLoader text="Loading dashboard..." /></DashboardLayout>;

  const { stats, pendingBookings, recentPayments, activeTenants, occupancy } = data || {};

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <DashboardLayout>
      <SEO title="Landlord Dashboard" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">
            {greeting()}, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-ET', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          to="/landlord/properties/add"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold text-sm rounded-xl hover:shadow-gold transition-all"
        >
          <Plus size={14} />
          Add Property
        </Link>
      </div>

      {/* KYC Alert */}
      {!user?.isKYCVerified && (
        <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl mb-5">
          <AlertCircle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-400">Complete KYC to List Properties</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Your listings won't go live until your identity and property ownership are verified.
            </p>
          </div>
          <Link to="/landlord/profile" className="text-xs font-bold text-yellow-400 hover:text-yellow-300 whitespace-nowrap">
            Verify Now →
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Properties"
          value={stats?.totalProperties || 0}
          icon={Building2}
          iconColor="text-yellow-400"
          iconBg="bg-yellow-500/10 border-yellow-500/20"
          description={`${stats?.activeProperties || 0} active`}
        />
        <StatCard
          title="Active Tenants"
          value={stats?.activeTenants || 0}
          icon={Users}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10 border-blue-500/20"
        />
        <StatCard
          title="Monthly Revenue"
          value={stats?.monthlyRevenue || 0}
          prefix="ETB "
          icon={CreditCard}
          iconColor="text-green-400"
          iconBg="bg-green-500/10 border-green-500/20"
          trend={stats?.revenueTrend}
        />
        <StatCard
          title="Pending Bookings"
          value={stats?.pendingBookings || 0}
          icon={CalendarCheck}
          iconColor="text-orange-400"
          iconBg="bg-orange-500/10 border-orange-500/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Booking Requests */}
          {pendingBookings?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-white font-display">
                  Pending Bookings ({pendingBookings.length})
                </h2>
                <Link to="/landlord/bookings" className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
                  View All <ArrowRight size={12} />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pendingBookings.slice(0, 4).map((booking) => (
                  <BookingRequestCard key={booking._id} booking={booking} onUpdate={fetchDashboard} />
                ))}
              </div>
            </div>
          )}

          {/* Recent Payments */}
          {recentPayments?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-white font-display">Recent Payments</h2>
                <Link to="/landlord/payments" className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
                  View All <ArrowRight size={12} />
                </Link>
              </div>
              <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
                {recentPayments.slice(0, 5).map((payment, i) => (
                  <div
                    key={payment._id}
                    className={`flex items-center justify-between px-4 py-3 ${i < recentPayments.length - 1 ? 'border-b border-surface-border' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <CreditCard size={14} className="text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {payment.payer?.firstName} {payment.payer?.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(payment.paidAt)}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-green-400">{formatCurrency(payment.netAmount || payment.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Tenants Preview */}
          {activeTenants?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-white font-display">Active Tenants</h2>
                <Link to="/landlord/tenants" className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
                  View All <ArrowRight size={12} />
                </Link>
              </div>
              <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
                {activeTenants.slice(0, 4).map((t, i) => (
                  <div key={t._id} className={`flex items-center gap-3 px-4 py-3 ${i < activeTenants.length - 1 ? 'border-b border-surface-border' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs font-bold text-yellow-400">
                      {t.tenant?.firstName?.[0]}{t.tenant?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {t.tenant?.firstName} {t.tenant?.lastName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{t.property?.title}</p>
                    </div>
                    <p className="text-xs font-bold text-yellow-400">{formatCurrency(t.rental?.monthlyRent)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Occupancy */}
          <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white font-display mb-4">Occupancy Rate</h3>
            <OccupancyDonut
              occupied={occupancy?.occupied || 0}
              vacant={occupancy?.vacant || 0}
              total={occupancy?.total || 0}
            />
          </div>

          {/* Quick Stats */}
          <div className="bg-surface-card border border-surface-border rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white font-display">This Month</h3>
            {[
              { label: 'Total Revenue', value: formatCurrency(stats?.monthlyRevenue || 0), color: 'text-green-400' },
              { label: 'Maintenance Requests', value: stats?.openMaintenance || 0, color: 'text-orange-400' },
              { label: 'Overdue Payments', value: stats?.overduePayments || 0, color: 'text-red-400' },
              { label: 'Contracts Expiring', value: stats?.expiringContracts || 0, color: 'text-yellow-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-xs text-gray-400">{label}</span>
                <span className={`text-sm font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Quick Links */}
          <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white font-display mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { to: '/landlord/properties/add', label: '+ Add New Property' },
                { to: '/landlord/bookings', label: '📅 Booking Requests' },
                { to: '/landlord/payments', label: '💳 Rent Payments' },
                { to: '/landlord/analytics', label: '📊 View Analytics' },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/5 transition-all"
                >
                  {label}
                  <ArrowRight size={12} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LandlordDashboard;