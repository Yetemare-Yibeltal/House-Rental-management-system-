// nestfind/nestfind/client/src/pages/landlord/RentPayments.jsx

import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import DataTable from '../../components/ui/DataTable'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import SEO from '../../components/common/SEO'
import landlordApi from '../../api/landlordApi'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { CreditCard, TrendingUp, AlertCircle } from 'lucide-react'

const RentPayments = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [summary, setSummary] = useState(null)
  const [overdue, setOverdue] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [paymentsRes, summaryRes, overdueRes] = await Promise.all([
          landlordApi.getPayments({ page: 1, limit: 20 }),
          landlordApi.getMonthlySummary(),
          landlordApi.getOverduePayments()
        ])
        setPayments(paymentsRes.data.data || [])
        setTotalPages(paymentsRes.data.pagination?.totalPages || 1)
        setSummary(summaryRes.data.data)
        setOverdue(overdueRes.data.data.overdue || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const annualTotal =
    summary?.summary?.reduce((sum, m) => sum + m.totalAmount, 0) || 0

  const columns = [
    {
      key: 'payer',
      label: 'Tenant',
      render: val => `${val?.firstName} ${val?.lastName}`
    },
    {
      key: 'property',
      label: 'Property',
      render: val => (
        <span className='truncate max-w-32 block text-xs'>{val?.title}</span>
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
      key: 'paymentMethod',
      label: 'Method',
      render: val => (
        <span className='capitalize text-xs'>{val?.replace(/_/g, ' ')}</span>
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
      render: val => <span className='text-xs'>{formatDate(val)}</span>
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

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6'>
        <StatCard
          title='Annual Revenue'
          value={annualTotal}
          prefix='ETB '
          icon={TrendingUp}
          iconColor='text-green-400'
          iconBg='bg-green-500/10 border-green-500/20'
        />
        <StatCard
          title='This Month'
          value={summary?.summary?.[new Date().getMonth()]?.totalAmount || 0}
          prefix='ETB '
          icon={CreditCard}
          iconColor='text-yellow-400'
          iconBg='bg-yellow-500/10 border-yellow-500/20'
        />
        <StatCard
          title='Overdue Payments'
          value={overdue.length}
          icon={AlertCircle}
          iconColor='text-red-400'
          iconBg='bg-red-500/10 border-red-500/20'
          description='Tenants with missed payments'
        />
      </div>

      {overdue.length > 0 && (
        <div className='mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl'>
          <p className='text-sm font-bold text-red-400 mb-2'>
            ⚠️ Overdue Payments
          </p>
          <div className='space-y-1'>
            {overdue.map(rental => (
              <div
                key={rental._id}
                className='flex items-center justify-between text-xs'
              >
                <span className='text-gray-300'>
                  {rental.tenant?.firstName} {rental.tenant?.lastName} —{' '}
                  {rental.property?.title}
                </span>
                <span className='text-red-400 font-semibold'>
                  {formatCurrency(rental.monthlyRent)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataTable
        title='Payment History'
        columns={columns}
        data={payments}
        loading={loading}
        emptyTitle='No payments yet'
        emptyDescription='Rent payments from your tenants will appear here'
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={async page => {
          const res = await landlordApi.getPayments({ page, limit: 20 })
          setPayments(res.data.data || [])
          setCurrentPage(page)
        }}
      />
    </DashboardLayout>
  )
}

export default RentPayments
