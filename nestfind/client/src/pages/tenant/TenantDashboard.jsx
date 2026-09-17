// nestfind/nestfind/client/src/pages/tenant/TenantDashboard.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, BookOpen, CreditCard, Wrench, Heart, Bell, ArrowRight, Bot } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import RentalCard from '../../components/tenant/RentalCard';
import PropertyRecommendations from '../../components/ai/PropertyRecommendations';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import GradientText from '../../components/ui/GradientText';
import SEO from '../../components/common/SEO';
import { useAuthStore } from '../../context/AuthContext';
import tenantApi from '../../api/tenantApi';
import notificationApi from '../../api/notificationApi';
import { formatCurrency } from '../../utils/formatters';

const TenantDashboard = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeRental, setActiveRental] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [rentalRes, bookingsRes, paymentsRes, notifRes] = await Promise.all([
          tenantApi.getActiveRental(),
          tenantApi.getBookings({ status: 'pending', limit: 3 }),
          tenantApi.getPayments({ limit: 5 }),
          notificationApi.getUnreadCount(),
        ]);
        setActiveRental(rentalRes.data.data.rental);
        setBookings(bookingsRes.data.data || []);
        setRecentPayments(paymentsRes.data.data || []);
        setUnreadCount(notifRes.data.data.unreadCount || 0);
      } catch {}
      finally { setLoading(false); }
    };
    fetchDashboard();
  }, []);

  if (loading) return <DashboardLayout><PageLoader text="Loading dashboard..." /></DashboardLayout>;

  const stats = [
    {
      title: 'Active Rental',
      value: activeRental ? 1 : 0,
      icon: Home,
      iconColor: 'text-yellow-400',
      iconBg: 'bg-yellow-500/10 border-yellow-500/20',
      description: activeRental ? activeRental.property?.title?.slice(0, 30) : 'No active rental',
    },
    {
      title: 'Pending Bookings',
      value: bookings.length,
      icon: BookOpen,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      description: 'Awaiting landlord response',
    },
    {
      title: 'Monthly Rent',
      value: activeRental?.monthlyRent || 0,
      prefix: 'ETB ',
      icon: CreditCard,
      iconColor: 'text-green-400',
      iconBg: 'bg-green-500/10 border-green-500/20',
      description: activeRental ? `Due day ${activeRental.paymentDueDay}` : 'No active rental',
    },
    {
      title: 'Notifications',
      value: unreadCount,
      icon: Bell,
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/10 border-orange-500/20',
      description: 'Unread notifications',
    },
  ];

  return (
    <DashboardLayout>
      <SEO title="Tenant Dashboard" />

      {/* Welcome */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">
            Welcome back, <GradientText>{user?.firstName}</GradientText>!
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {activeRental ? 'Manage your rental from your dashboard' : 'Find your perfect home today'}
          </p>
        </div>
        <Link
          to="/listings"
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold text-sm rounded-xl hover:shadow-gold transition-all"
        >
          <Home size={15} />
          Find Properties
        </Link>
      </div>

      {/* KYC Alert */}
      {!user?.isKYCVerified && (
        <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl mb-6">
          <div>
            <p className="text-sm font-semibold text-yellow-400">Complete Identity Verification</p>
            <p className="text-xs text-gray-400 mt-0.5">KYC verification unlocks all NestFind features</p>
          </div>
          <Link to="/tenant/profile" className="text-xs font-bold text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
            Verify Now <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => <StatCard key={stat.title} {...stat} />)}
      </div>

      {/* Active Rental */}
      {activeRental ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white">Active Rental</h2>
            <Link to="/tenant/rentals" className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
              View Details <ArrowRight size={12} />
            </Link>
          </div>
          <RentalCard rental={activeRental} />
        </div>
      ) : (
        <div className="mb-6 p-6 bg-surface-card border border-surface-border rounded-2xl text-center">
          <Home size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-300 mb-1">No active rental</p>
          <p className="text-xs text-gray-500 mb-4">Browse thousands of verified properties in Addis Ababa</p>
          <Link
            to="/listings"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold text-sm rounded-xl"
          >
            Find a Property
          </Link>
        </div>
      )}

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white">Recent Payments</h2>
            <Link to="/tenant/payments" className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
            {recentPayments.map((payment, i) => (
              <div
                key={payment._id}
                className={`flex items-center justify-between px-5 py-3 ${i < recentPayments.length - 1 ? 'border-b border-surface-border' : ''}`}
              >
                <div>
                  <p className="text-sm font-semibold text-white capitalize">{payment.paymentType?.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-400">{payment.paymentMethod?.replace(/_/g, ' ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-yellow-400">{formatCurrency(payment.amount)}</p>
                  <p className="text-xs text-green-400 capitalize">{payment.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { to: '/tenant/bookings', icon: BookOpen, label: 'My Bookings', color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { to: '/tenant/maintenance', icon: Wrench, label: 'Maintenance', color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { to: '/tenant/saved-properties', icon: Heart, label: 'Saved', color: 'text-red-400', bg: 'bg-red-500/10' },
          { to: '/tenant/notifications', icon: Bell, label: 'Alerts', color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map(({ to, icon: Icon, label, color, bg }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-2 p-4 bg-surface-card border border-surface-border rounded-2xl hover:border-yellow-500/30 transition-all"
          >
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon size={18} className={color} />
            </div>
            <span className="text-xs font-medium text-gray-300">{label}</span>
          </Link>
        ))}
      </div>

      {/* AI Recommendations */}
      <PropertyRecommendations limit={4} title="AI Picks For You" />
    </DashboardLayout>
  );
};

export default TenantDashboard;