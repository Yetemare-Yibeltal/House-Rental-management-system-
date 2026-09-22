// nestfind/nestfind/client/src/pages/admin/PaymentsRevenue.jsx

import { useState, useEffect } from 'react'
import { CreditCard, TrendingUp, DollarSign, BarChart2 } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/ui/StatCard'
import AdminDataTable from '../../components/admin/AdminDataTable'
import ReportGenerator from '../../components/admin/ReportGenerator'
import Badge from '../../components/ui/Badge'
import SEO from '../../components/common/SEO'
import adminApi from '../../api/adminApi'
import { formatCurrency, formatDate } from '../../utils/formatters'

const PaymentsRevenue = () => {
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [paymentsRes, statsRes] = await Promise.all([
          adminApi.getPayments({ page: 1, limit: 15 }),
          adminApi.getRevenueStats({})
        ])
        setPayments(paymentsRes.data.data || [])
        setTotalPages(paymentsRes.data.pagination?.totalPages || 1)
        setStats(statsRes.data.data)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const fetchPayments = async page => {
    try {
      const response = await adminApi.getPayments({ page, limit: 15 })
      setPayments(response.data.data || [])
      setCurrentPage(page)
    } catch {}
  }

  const columns = [
    {
      key: 'receiptNumber',
      label: 'Receipt',
      render: val => (
        <span className='font-mono text-xs text-gray-300'>#{val}</span>
      )
    },
    {
      key: 'payer',
      label: 'Tenant',
      render: val => (
        <span className='text-xs text-white'>
          {val?.firstName} {val?.lastName}
        </span>
      )
    },
    {
      key: 'payee',
      label: 'Landlord',
      render: val => (
        <span className='text-xs text-white'>
          {val?.firstName} {val?.lastName}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: val => (
        <span className='font-bold text-yellow-400 text-xs'>
          {formatCurrency(val)}
        </span>
      )
    },
    {
      key: 'platformCommission',
      label: 'Commission',
      render: val => (
        <span className='text-xs text-green-400 font-semibold'>
          {formatCurrency(val)}
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
      <SEO title='Payments & Revenue' />
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>
          Payments & Revenue
        </h1>
        <p className='text-gray-400 text-sm mt-1'>
          Platform transaction and commission tracking
        </p>
      </div>

      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        <StatCard
          title='Total Revenue'
          value={stats?.totalGross || 0}
          prefix='ETB '
          icon={DollarSign}
          iconColor='text-yellow-400'
          iconBg='bg-yellow-500/10 border-yellow-500/20'
          loading={loading}
        />
        <StatCard
          title='Commission Earned'
          value={stats?.totalCommission || 0}
          prefix='ETB '
          icon={TrendingUp}
          iconColor='text-green-400'
          iconBg='bg-green-500/10 border-green-500/20'
          loading={loading}
        />
        <StatCard
          title='This Month'
          value={stats?.monthlyRevenue || 0}
          prefix='ETB '
          icon={CreditCard}
          iconColor='text-blue-400'
          iconBg='bg-blue-500/10 border-blue-500/20'
          loading={loading}
        />
        <StatCard
          title='Transactions'
          value={stats?.totalTransactions || 0}
          icon={BarChart2}
          iconColor='text-purple-400'
          iconBg='bg-purple-500/10 border-purple-500/20'
          loading={loading}
        />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
        <div className='lg:col-span-2'>
          <AdminDataTable
            title='All Transactions'
            columns={columns}
            data={payments}
            loading={loading}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={fetchPayments}
            emptyTitle='No transactions'
            rowKey='_id'
          />
        </div>
        <div className='bg-surface-card border border-surface-border rounded-2xl p-5'>
          <h3 className='text-base font-bold text-white font-display mb-4'>
            Generate Report
          </h3>
          <ReportGenerator />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PaymentsRevenue
