// nestfind/nestfind/client/src/pages/tenant/ActiveRentals.jsx

import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import RentalCard from '../../components/tenant/RentalCard'
import EmptyState from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import tenantApi from '../../api/tenantApi'
import { Link } from 'react-router-dom'
import { Home, History } from 'lucide-react'

const ActiveRentals = () => {
  const [activeRental, setActiveRental] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const [activeRes, historyRes] = await Promise.all([
          tenantApi.getActiveRental(),
          tenantApi.getRentalHistory()
        ])
        setActiveRental(activeRes.data.data.rental)
        setHistory(historyRes.data.data || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchRentals()
  }, [])

  if (loading)
    return (
      <DashboardLayout>
        <PageLoader text='Loading rentals...' />
      </DashboardLayout>
    )

  return (
    <DashboardLayout>
      <SEO title='My Rentals' />

      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>
          My Rentals
        </h1>
        <p className='text-gray-400 text-sm mt-1'>
          Track your current and past rental agreements
        </p>
      </div>

      {/* Tabs */}
      <div className='flex gap-1 border-b border-surface-border mb-5'>
        {[
          { key: 'active', label: 'Active Rental', icon: Home },
          { key: 'history', label: 'Rental History', icon: History }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-yellow-500 text-yellow-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'active' &&
        (activeRental ? (
          <RentalCard rental={activeRental} />
        ) : (
          <EmptyState
            emoji='🏠'
            title='No active rental'
            description="You don't have an active rental. Browse properties to find your next home."
            action={() => (window.location.href = '/listings')}
            actionLabel='Browse Properties'
          />
        ))}

      {tab === 'history' &&
        (history.length === 0 ? (
          <EmptyState
            emoji='📋'
            title='No rental history'
            description='Your completed and past rentals will appear here.'
          />
        ) : (
          <div className='space-y-4'>
            {history.map(rental => (
              <div
                key={rental._id}
                className='bg-surface-card border border-surface-border rounded-2xl p-5'
              >
                <div className='flex items-start justify-between mb-3'>
                  <div>
                    <Link
                      to={`/property/${rental.property?._id}`}
                      className='text-sm font-bold text-white hover:text-yellow-400 transition-colors'
                    >
                      {rental.property?.title}
                    </Link>
                    <p className='text-xs text-gray-400 mt-0.5'>
                      {rental.property?.location?.subCity},{' '}
                      {rental.property?.location?.city}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full border capitalize ${
                      rental.status === 'expired'
                        ? 'text-gray-400 border-gray-600'
                        : rental.status === 'terminated_early'
                        ? 'text-red-400 border-red-500/30'
                        : 'text-yellow-400 border-yellow-500/30'
                    }`}
                  >
                    {rental.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className='grid grid-cols-3 gap-3 text-center'>
                  <div className='bg-surface-light rounded-xl p-2.5'>
                    <p className='text-[10px] text-gray-500'>Duration</p>
                    <p className='text-xs font-semibold text-white'>
                      {rental.startDate
                        ? new Date(rental.startDate).getFullYear()
                        : 'N/A'}{' '}
                      –{' '}
                      {rental.endDate
                        ? new Date(rental.endDate).getFullYear()
                        : 'N/A'}
                    </p>
                  </div>
                  <div className='bg-surface-light rounded-xl p-2.5'>
                    <p className='text-[10px] text-gray-500'>Monthly Rent</p>
                    <p className='text-xs font-semibold text-yellow-400'>
                      ETB {rental.monthlyRent?.toLocaleString()}
                    </p>
                  </div>
                  <div className='bg-surface-light rounded-xl p-2.5'>
                    <p className='text-[10px] text-gray-500'>Total Paid</p>
                    <p className='text-xs font-semibold text-green-400'>
                      ETB {(rental.totalRentPaid || 0)?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
    </DashboardLayout>
  )
}

export default ActiveRentals
