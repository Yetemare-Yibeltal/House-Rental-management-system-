// nestfind/nestfind/client/src/pages/landlord/LandlordDashboard.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Users,
  CreditCard,
  CalendarCheck,
  TrendingUp,
  Plus,
  ArrowRight
} from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/ui/StatCard'
import OccupancyDonut from '../../components/landlord/OccupancyDonut'
import BookingRequestCard from '../../components/landlord/BookingRequestCard'
import TenantRow from '../../components/landlord/TenantRow'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import GradientText from '../../components/ui/GradientText'
import SEO from '../../components/common/SEO'
import { useAuthStore } from '../../context/AuthContext'
import landlordApi from '../../api/landlordApi'
import { formatCurrency } from '../../utils/formatters'

const LandlordDashboard = () => {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState(null)
  const [pendingBookings, setPendingBookings] = useState([])
  const [tenants, setTenants] = useState([])

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, bookingsRes, tenantsRes] = await Promise.all([
          landlordApi.getDashboard(),
          landlordApi.getBookings({ status: 'pending', limit: 3 }),
          landlordApi.getTenants()
        ])
        setDashboard(dashRes.data.data)
        setPendingBookings(bookingsRes.data.data || [])
        setTenants((tenantsRes.data.data.tenants || []).slice(0, 5))
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  const refreshBookings = async () => {
    const res = await landlordApi.getBookings({ status: 'pending', limit: 3 })
    setPendingBookings(res.data.data || [])
  }

  if (loading)
    return (
      <DashboardLayout>
        <PageLoader text='Loading dashboard...' />
      </DashboardLayout>
    )

  const props = dashboard?.properties || {}
  const stats = [
    {
      title: 'Total Properties',
      value: props.total || 0,
      icon: Building2,
      iconColor: 'text-yellow-400',
      iconBg: 'bg-yellow-500/10 border-yellow-500/20',
      description: `${props.active || 0} active, ${props.rented || 0} rented`
    },
    {
      title: 'Active Tenants',
      value: dashboard?.activeRentals || 0,
      icon: Users,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      description: 'Currently renting from you'
    },
    {
      title: 'Total Revenue',
      value: dashboard?.totalRevenue || 0,
      prefix: 'ETB ',
      icon: CreditCard,
      iconColor: 'text-green-400',
      iconBg: 'bg-green-500/10 border-green-500/20',
      description: 'All time net revenue'
    },
    {
      title: 'Pending Bookings',
      value: dashboard?.pendingBookings || 0,
      icon: CalendarCheck,
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/10 border-orange-500/20',
      description: 'Awaiting your response'
    }
  ]

  return (
    <DashboardLayout>
      <SEO title='Landlord Dashboard' />

      {/* Welcome */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-white font-display'>
            Welcome, <GradientText>{user?.firstName}</GradientText>!
          </h1>
          <p className='text-gray-400 text-sm mt-0.5'>
            {!user?.isKYCVerified
              ? 'Complete KYC verification to list properties'
              : 'Manage your property portfolio'}
          </p>
        </div>
        <Link
          to='/landlord/properties/add'
          className='hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold text-sm rounded-xl hover:shadow-gold transition-all'
        >
          <Plus size={15} />
          Add Property
        </Link>
      </div>

      {/* KYC Alert */}
      {!user?.isKYCVerified && (
        <div className='flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl mb-6'>
          <div>
            <p className='text-sm font-semibold text-yellow-400'>
              Complete KYC to List Properties
            </p>
            <p className='text-xs text-gray-400 mt-0.5'>
              Identity verification is required before you can list properties
            </p>
          </div>
          <Link
            to='/tenant/profile'
            className='text-xs font-bold text-yellow-400 flex items-center gap-1'
          >
            Verify Now <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        {stats.map(stat => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6'>
        {/* Occupancy Donut */}
        <div className='bg-surface-card border border-surface-border rounded-2xl p-5'>
          <h3 className='text-sm font-bold text-white mb-4'>Occupancy Rate</h3>
          <OccupancyDonut
            occupied={props.rented || 0}
            vacant={props.active || 0}
            total={props.total || 0}
          />
        </div>

        {/* Recent Payments */}
        <div className='lg:col-span-2 bg-surface-card border border-surface-border rounded-2xl p-5'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-sm font-bold text-white'>Recent Payments</h3>
            <Link
              to='/landlord/payments'
              className='text-xs text-yellow-400 flex items-center gap-1'
            >
              View All <ArrowRight size={12} />
            </Link>
          </div>
          {dashboard?.recentPayments?.length > 0 ? (
            <div className='space-y-2'>
              {dashboard.recentPayments.map(payment => (
                <div
                  key={payment._id}
                  className='flex items-center justify-between py-2 border-b border-surface-border last:border-0'
                >
                  <div className='flex items-center gap-2'>
                    <div className='w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center'>
                      <CreditCard size={13} className='text-green-400' />
                    </div>
                    <div>
                      <p className='text-xs font-semibold text-white'>
                        {payment.payer?.firstName} {payment.payer?.lastName}
                      </p>
                      <p className='text-[10px] text-gray-400'>
                        {payment.property?.title?.slice(0, 25)}
                      </p>
                    </div>
                  </div>
                  <p className='text-sm font-bold text-green-400'>
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-sm text-gray-400 text-center py-4'>
              No recent payments
            </p>
          )}
        </div>
      </div>

      {/* Pending Booking Requests */}
      {pendingBookings.length > 0 && (
        <div className='mb-6'>
          <div className='flex items-center justify-between mb-3'>
            <h2 className='text-base font-bold text-white'>
              Pending Visit Requests
            </h2>
            <Link
              to='/landlord/bookings'
              className='text-xs text-yellow-400 flex items-center gap-1'
            >
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {pendingBookings.map(booking => (
              <BookingRequestCard
                key={booking._id}
                booking={booking}
                onUpdate={refreshBookings}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active Tenants */}
      {tenants.length > 0 && (
        <div>
          <div className='flex items-center justify-between mb-3'>
            <h2 className='text-base font-bold text-white'>Active Tenants</h2>
            <Link
              to='/landlord/tenants'
              className='text-xs text-yellow-400 flex items-center gap-1'
            >
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div className='space-y-3'>
            {tenants.map(tenant => (
              <TenantRow key={tenant.tenant?._id} tenantData={tenant} />
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default LandlordDashboard
