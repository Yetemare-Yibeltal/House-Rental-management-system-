// nestfind/nestfind/client/src/pages/landlord/Analytics.jsx

import { useState, useEffect } from 'react'
import { TrendingUp, Building2, Users, CreditCard } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import RevenueChart from '../../components/landlord/RevenueChart'
import OccupancyDonut from '../../components/landlord/OccupancyDonut'
import StatCard from '../../components/ui/StatCard'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import landlordApi from '../../api/landlordApi'
import { formatCurrency } from '../../utils/formatters'

const Analytics = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('6m')

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        const response = await landlordApi.getAnalytics({ period })
        setData(response.data.data)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [period])

  if (loading)
    return (
      <DashboardLayout>
        <PageLoader text='Loading analytics...' />
      </DashboardLayout>
    )

  const { overview, revenueByMonth, occupancy, topProperties, tenantMetrics } =
    data || {}

  return (
    <DashboardLayout>
      <SEO title='Analytics' />

      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-white font-display'>
            Analytics
          </h1>
          <p className='text-gray-400 text-sm mt-1'>
            Performance insights for your properties
          </p>
        </div>
        <div className='flex gap-2'>
          {['1m', '3m', '6m', '1y'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                period === p
                  ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                  : 'border-surface-border text-gray-400 hover:border-yellow-500/30'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        <StatCard
          title='Total Revenue'
          value={overview?.totalRevenue || 0}
          prefix='ETB '
          icon={CreditCard}
          iconColor='text-green-400'
          iconBg='bg-green-500/10 border-green-500/20'
          trend={overview?.revenueTrend}
        />
        <StatCard
          title='Active Properties'
          value={overview?.activeProperties || 0}
          icon={Building2}
          iconColor='text-yellow-400'
          iconBg='bg-yellow-500/10 border-yellow-500/20'
        />
        <StatCard
          title='Active Tenants'
          value={overview?.activeTenants || 0}
          icon={Users}
          iconColor='text-blue-400'
          iconBg='bg-blue-500/10 border-blue-500/20'
        />
        <StatCard
          title='Avg. Occupancy'
          value={overview?.avgOccupancy || 0}
          suffix='%'
          icon={TrendingUp}
          iconColor='text-purple-400'
          iconBg='bg-purple-500/10 border-purple-500/20'
        />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
        {/* Revenue Chart */}
        <div className='lg:col-span-2 bg-surface-card border border-surface-border rounded-2xl p-5'>
          <h3 className='text-base font-bold text-white font-display mb-4'>
            Revenue Over Time
          </h3>
          <RevenueChart data={revenueByMonth || []} height={240} />
        </div>

        {/* Occupancy */}
        <div className='bg-surface-card border border-surface-border rounded-2xl p-5'>
          <h3 className='text-base font-bold text-white font-display mb-4'>
            Current Occupancy
          </h3>
          <OccupancyDonut
            occupied={occupancy?.occupied || 0}
            vacant={occupancy?.vacant || 0}
            total={occupancy?.total || 0}
          />
        </div>
      </div>

      {/* Top Properties */}
      {topProperties?.length > 0 && (
        <div className='bg-surface-card border border-surface-border rounded-2xl p-5 mb-6'>
          <h3 className='text-base font-bold text-white font-display mb-4'>
            Top Performing Properties
          </h3>
          <div className='space-y-3'>
            {topProperties.map((p, i) => (
              <div key={p._id} className='flex items-center gap-3'>
                <span className='w-6 h-6 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-bold flex items-center justify-center flex-shrink-0'>
                  {i + 1}
                </span>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-semibold text-white truncate'>
                    {p.title}
                  </p>
                  <p className='text-xs text-gray-400'>{p.location?.subCity}</p>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-bold text-yellow-400'>
                    {formatCurrency(p.revenue || p.pricing?.monthlyRent)}
                  </p>
                  <p className='text-xs text-gray-500'>
                    {p.stats?.totalViews || 0} views
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tenant Metrics */}
      {tenantMetrics && (
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          {[
            {
              label: 'Average Tenancy Duration',
              value: `${tenantMetrics.avgTenancyMonths || 0} months`
            },
            {
              label: 'Tenant Retention Rate',
              value: `${tenantMetrics.retentionRate || 0}%`
            },
            {
              label: 'On-time Payment Rate',
              value: `${tenantMetrics.onTimePaymentRate || 0}%`
            }
          ].map(({ label, value }) => (
            <div
              key={label}
              className='bg-surface-card border border-surface-border rounded-2xl p-5 text-center'
            >
              <p className='text-2xl font-bold text-yellow-400 font-display'>
                {value}
              </p>
              <p className='text-xs text-gray-400 mt-1'>{label}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}

export default Analytics
