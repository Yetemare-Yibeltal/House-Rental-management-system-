// nestfind/nestfind/client/src/pages/admin/AdminDashboard.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Users, Building2, CreditCard, Flag } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PlatformStatsGrid from '../../components/admin/PlatformStatsGrid'
import ActivityChart from '../../components/admin/ActivityChart'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import adminApi from '../../api/adminApi'
import { formatCurrency, formatTimeAgo } from '../../utils/formatters'

const AdminDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      try {
        const response = await adminApi.getDashboard()
        setData(response.data.data)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading)
    return (
      <DashboardLayout>
        <PageLoader text='Loading admin dashboard...' />
      </DashboardLayout>
    )

  const { stats, recentUsers, recentPayments, activityData, alerts } =
    data || {}

  return (
    <DashboardLayout>
      <SEO title='Admin Dashboard' />

      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>
          Admin Dashboard
        </h1>
        <p className='text-gray-400 text-sm mt-0.5'>
          Platform overview and management
        </p>
      </div>

      {/* Alerts */}
      {alerts?.length > 0 && (
        <div className='space-y-2 mb-5'>
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                alert.type === 'error'
                  ? 'bg-red-500/10 border-red-500/20'
                  : alert.type === 'warning'
                  ? 'bg-yellow-500/10 border-yellow-500/20'
                  : 'bg-blue-500/10 border-blue-500/20'
              }`}
            >
              <span className='text-sm'>{alert.message}</span>
              {alert.link && (
                <Link
                  to={alert.link}
                  className='text-xs text-yellow-400 hover:text-yellow-300 ml-auto whitespace-nowrap'
                >
                  View →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Platform Stats */}
      <PlatformStatsGrid stats={stats} loading={loading} />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6'>
        {/* Activity Chart */}
        <div className='lg:col-span-2 bg-surface-card border border-surface-border rounded-2xl p-5'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-base font-bold text-white font-display'>
              Platform Activity
            </h3>
          </div>
          <ActivityChart data={activityData || []} height={240} />
        </div>

        {/* Quick Actions */}
        <div className='space-y-4'>
          <div className='bg-surface-card border border-surface-border rounded-2xl p-5'>
            <h3 className='text-sm font-bold text-white font-display mb-3'>
              Quick Actions
            </h3>
            <div className='space-y-2'>
              {[
                {
                  to: '/admin/kyc',
                  label: '🪪 Review KYC',
                  count: stats?.users?.kycPending
                },
                {
                  to: '/admin/properties',
                  label: '🏠 Review Properties',
                  count: stats?.properties?.pendingReview
                },
                {
                  to: '/admin/reports',
                  label: '🚩 Handle Reports',
                  count: stats?.reports?.pending
                },
                { to: '/admin/users', label: '👥 Manage Users' },
                { to: '/admin/payments', label: '💳 View Payments' },
                { to: '/admin/settings', label: '⚙️ System Settings' }
              ].map(({ to, label, count }) => (
                <Link
                  key={to}
                  to={to}
                  className='flex items-center justify-between px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/5 transition-all'
                >
                  <span>{label}</span>
                  <div className='flex items-center gap-2'>
                    {count > 0 && (
                      <span className='w-5 h-5 bg-yellow-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center'>
                        {count > 9 ? '9+' : count}
                      </span>
                    )}
                    <ArrowRight size={12} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Users */}
          {recentUsers?.length > 0 && (
            <div className='bg-surface-card border border-surface-border rounded-2xl p-5'>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='text-sm font-bold text-white font-display'>
                  New Users
                </h3>
                <Link to='/admin/users' className='text-xs text-yellow-400'>
                  View All
                </Link>
              </div>
              <div className='space-y-2'>
                {recentUsers.slice(0, 4).map(u => (
                  <div key={u._id} className='flex items-center gap-2'>
                    <div className='w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold flex items-center justify-center flex-shrink-0'>
                      {u.firstName?.[0]}
                      {u.lastName?.[0]}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs font-semibold text-white truncate'>
                        {u.firstName} {u.lastName}
                      </p>
                      <p className='text-[10px] text-gray-500 capitalize'>
                        {u.role}
                      </p>
                    </div>
                    <span className='text-[10px] text-gray-500'>
                      {formatTimeAgo(u.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Payments */}
      {recentPayments?.length > 0 && (
        <div className='mt-6 bg-surface-card border border-surface-border rounded-2xl p-5'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-base font-bold text-white font-display'>
              Recent Transactions
            </h3>
            <Link
              to='/admin/payments'
              className='text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1'
            >
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-surface-border'>
                  {[
                    'Tenant',
                    'Landlord',
                    'Amount',
                    'Commission',
                    'Status',
                    'Date'
                  ].map(h => (
                    <th
                      key={h}
                      className='text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className='divide-y divide-surface-border'>
                {recentPayments.slice(0, 5).map(p => (
                  <tr
                    key={p._id}
                    className='hover:bg-surface-light transition-colors'
                  >
                    <td className='py-2.5 px-3 text-gray-300 text-xs'>
                      {p.payer?.firstName} {p.payer?.lastName}
                    </td>
                    <td className='py-2.5 px-3 text-gray-300 text-xs'>
                      {p.payee?.firstName} {p.payee?.lastName}
                    </td>
                    <td className='py-2.5 px-3 font-bold text-yellow-400 text-xs'>
                      {formatCurrency(p.amount)}
                    </td>
                    <td className='py-2.5 px-3 text-green-400 text-xs'>
                      {formatCurrency(p.platformCommission)}
                    </td>
                    <td className='py-2.5 px-3'>
                      <span
                        className={`text-xs font-semibold capitalize ${
                          p.status === 'completed'
                            ? 'text-green-400'
                            : 'text-yellow-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className='py-2.5 px-3 text-gray-500 text-xs'>
                      {formatTimeAgo(p.paidAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default AdminDashboard
