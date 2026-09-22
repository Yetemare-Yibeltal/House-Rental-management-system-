// nestfind/nestfind/client/src/pages/landlord/RentPayments.jsx

import { useState, useEffect } from 'react'
import { CreditCard, TrendingUp, AlertCircle } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/ui/StatCard'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import SEO from '../../components/common/SEO'
import landlordApi from '../../api/landlordApi'
import {
  formatCurrency,
  formatDate,
  formatDateTime
} from '../../utils/formatters'

const RentPayments = () => {
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [overdueRentals, setOverdueRentals] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [paymentsRes, statsRes, overdueRes] = await Promise.all([
          landlordApi.getPayments({ page: 1, limit: 15 }),
          landlordApi.getPaymentStats(),
          landlordApi.getOverdueRentals()
        ])
        setPayments(paymentsRes.data.data || [])
        setTotalPages(paymentsRes.data.pagination?.totalPages || 1)
        setStats(statsRes.data.data)
        setOverdueRentals(overdueRes.data.data || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const fetchPayments = async page => {
    try {
      const response = await landlordApi.getPayments({ page, limit: 15 })
      setPayments(response.data.data || [])
      setTotalPages(response.data.pagination?.totalPages || 1)
      setCurrentPage(page)
    } catch {}
  }

  const columns = [
    {
      key: 'payer',
      label: 'Tenant',
      render: val => (
        <span className='text-sm font-medium text-white'>
          {val?.firstName} {val?.lastName}
        </span>
      )
    },
    {
      key: 'property',
      label: 'Property',
      render: val => (
        <span className='text-xs text-gray-300 line-clamp-1'>{val?.title}</span>
      )
    },
    {
      key: 'paymentType',
      label: 'Type',
      render: val => (
        <span className='text-xs capitalize'>{val?.replace(/_/g, ' ')}</span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: val => (
        <span className='font-bold text-yellow-400'>{formatCurrency(val)}</span>
      )
    },
    {
      key: 'netAmount',
      label: 'Net Received',
      render: (val, row) => (
        <span className='font-semibold text-green-400'>
          {formatCurrency(val || row.amount)}
        </span>
      )
    },
    {
      key: 'paymentMethod',
      label: 'Method',
      render: val => (
        <span className='text-xs capitalize'>{val?.replace(/_/g, ' ')}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: val => <Badge status={val} size='xs' dot />
    },
    {
      key: 'paidAt',
      label: 'Date',
      render: val => (
        <span className='text-xs text-gray-400'>{formatDate(val)}</span>
      )
    }
  ]

  return (
    <DashboardLayout>
      <SEO title='Rent Payments' />

      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>
          Rent Payments
        </h1>
        <p className='text-gray-400 text-sm mt-1'>
          Track all incoming rent payments
        </p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        <StatCard
          title='Total Revenue'
          value={stats?.totalRevenue || 0}
          prefix='ETB '
          icon={CreditCard}
          iconColor='text-green-400'
          iconBg='bg-green-500/10 border-green-500/20'
          loading={loading}
        />
        <StatCard
          title='This Month'
          value={stats?.monthlyRevenue || 0}
          prefix='ETB '
          icon={TrendingUp}
          iconColor='text-yellow-400'
          iconBg='bg-yellow-500/10 border-yellow-500/20'
          loading={loading}
        />
        <StatCard
          title='Pending'
          value={stats?.pendingPayments || 0}
          icon={AlertCircle}
          iconColor='text-orange-400'
          iconBg='bg-orange-500/10 border-orange-500/20'
          loading={loading}
        />
        <StatCard
          title='Overdue'
          value={overdueRentals.length}
          icon={AlertCircle}
          iconColor='text-red-400'
          iconBg='bg-red-500/10 border-red-500/20'
          loading={loading}
        />
      </div>

      {/* Overdue Alert */}
      {overdueRentals.length > 0 && (
        <div className='flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-5'>
          <AlertCircle
            size={18}
            className='text-red-400 flex-shrink-0 mt-0.5'
          />
          <div>
            <p className='text-sm font-semibold text-red-400'>
              {overdueRentals.length} Overdue Payment
              {overdueRentals.length !== 1 ? 's' : ''}
            </p>
            <p className='text-xs text-gray-400 mt-0.5'>
              {overdueRentals
                .map(r => `${r.tenant?.firstName} ${r.tenant?.lastName}`)
                .join(', ')}{' '}
              — please follow up.
            </p>
          </div>
        </div>
      )}

      {/* Payments Table */}
      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        emptyTitle='No Payments Yet'
        emptyDescription='Payment records will appear here as tenants pay rent.'
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={fetchPayments}
        rowKey='_id'
      />
    </DashboardLayout>
  )
}

export default RentPayments
