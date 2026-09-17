// nestfind/nestfind/client/src/pages/tenant/PaymentHistory.jsx

import { useState, useEffect } from 'react'
import { Receipt } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import PaymentReceipt from '../../components/tenant/PaymentReceipt'
import SEO from '../../components/common/SEO'
import tenantApi from '../../api/tenantApi'
import { formatCurrency, formatDateTime } from '../../utils/formatters'

const PaymentHistory = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedPayment, setSelectedPayment] = useState(null)

  const fetchPayments = async (page = 1) => {
    setLoading(true)
    try {
      const response = await tenantApi.getPayments({ page, limit: 15 })
      setPayments(response.data.data || [])
      setTotalPages(response.data.pagination?.totalPages || 1)
      setCurrentPage(page)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const columns = [
    {
      key: 'receiptNumber',
      label: 'Receipt #',
      render: val => (
        <span className='font-mono text-xs text-gray-300'>{val}</span>
      )
    },
    {
      key: 'paymentType',
      label: 'Type',
      render: val => (
        <span className='capitalize text-sm text-white'>
          {val?.replace(/_/g, ' ')}
        </span>
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
        <span className='capitalize text-sm text-gray-300'>
          {val?.replace(/_/g, ' ')}
        </span>
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
        <span className='text-xs text-gray-400'>{formatDateTime(val)}</span>
      )
    },
    {
      key: '_id',
      label: 'Receipt',
      render: (_, row) => (
        <button
          onClick={e => {
            e.stopPropagation()
            setSelectedPayment(row)
          }}
          className='flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300'
        >
          <Receipt size={12} /> View
        </button>
      )
    }
  ]

  return (
    <DashboardLayout>
      <SEO title='Payment History' />

      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>
          Payment History
        </h1>
        <p className='text-gray-400 text-sm mt-1'>
          All your rent and fee payments
        </p>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        emptyTitle='No payments yet'
        emptyDescription='Your payment history will appear here'
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={fetchPayments}
        rowKey='_id'
      />

      <Modal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        title='Payment Receipt'
        size='sm'
      >
        {selectedPayment && <PaymentReceipt payment={selectedPayment} />}
      </Modal>
    </DashboardLayout>
  )
}

export default PaymentHistory
