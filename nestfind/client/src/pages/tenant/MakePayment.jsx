// nestfind/nestfind/client/src/pages/tenant/MakePayment.jsx

import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CreditCard, CheckCircle } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import PaymentReceipt from '../../components/tenant/PaymentReceipt'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import tenantApi from '../../api/tenantApi'
import { formatCurrency } from '../../utils/formatters'
import { PAYMENT_METHODS, PAYMENT_TYPES } from '../../utils/constants'
import toast from 'react-hot-toast'

const MakePayment = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const rentalIdFromUrl = searchParams.get('rentalId')

  const [rental, setRental] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completedPayment, setCompletedPayment] = useState(null)
  const [form, setForm] = useState({
    rentalId: rentalIdFromUrl || '',
    paymentType: 'monthly_rent',
    amount: '',
    paymentMethod: '',
    externalTransactionId: '',
    notes: '',
    paymentPeriod: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    }
  })

  useEffect(() => {
    const fetchRental = async () => {
      try {
        const response = await tenantApi.getActiveRental()
        const activeRental = response.data.data.rental
        if (activeRental) {
          setRental(activeRental)
          setForm(prev => ({
            ...prev,
            rentalId: activeRental._id,
            amount: String(activeRental.monthlyRent)
          }))
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchRental()
  }, [])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.paymentMethod) {
      toast.error('Please select a payment method')
      return
    }
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Invalid amount')
      return
    }

    setSubmitting(true)
    try {
      const response = await tenantApi.createPayment({
        ...form,
        amount: Number(form.amount)
      })
      setCompletedPayment(response.data.data.payment)
      toast.success('Payment processed successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading)
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    )

  if (completedPayment) {
    return (
      <DashboardLayout>
        <SEO title='Payment Receipt' />
        <div className='max-w-lg mx-auto'>
          <div className='flex items-center gap-2 mb-6'>
            <CheckCircle size={20} className='text-green-400' />
            <h1 className='text-xl font-bold text-white font-display'>
              Payment Successful
            </h1>
          </div>
          <PaymentReceipt payment={completedPayment} />
          <div className='flex gap-3 mt-6'>
            <Button
              variant='outline'
              fullWidth
              onClick={() => navigate('/tenant/payments')}
            >
              View History
            </Button>
            <Button
              variant='gold'
              fullWidth
              onClick={() => setCompletedPayment(null)}
            >
              Make Another Payment
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <SEO title='Make Payment' />

      <div className='max-w-lg mx-auto'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-white font-display'>
            Make a Payment
          </h1>
          <p className='text-gray-400 text-sm mt-1'>
            Pay your rent securely online
          </p>
        </div>

        {rental && (
          <div className='bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 mb-5'>
            <p className='text-xs text-gray-400 mb-0.5'>Active Rental</p>
            <p className='text-sm font-bold text-white'>
              {rental.property?.title}
            </p>
            <p className='text-sm text-yellow-400 font-semibold'>
              {formatCurrency(rental.monthlyRent)}/month
            </p>
          </div>
        )}

        {!rental && (
          <div className='bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-5'>
            <p className='text-sm text-red-400'>
              No active rental found. Payments require an active rental.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <Select
            label='Payment Type *'
            value={form.paymentType}
            onChange={e => handleChange('paymentType', e.target.value)}
            options={PAYMENT_TYPES}
            required
          />

          <Input
            label='Amount (ETB) *'
            type='number'
            min='1'
            value={form.amount}
            onChange={e => handleChange('amount', e.target.value)}
            icon={CreditCard}
            required
          />

          <Select
            label='Payment Method *'
            value={form.paymentMethod}
            onChange={e => handleChange('paymentMethod', e.target.value)}
            options={PAYMENT_METHODS}
            placeholder='Select payment method'
            required
          />

          <Input
            label='Transaction ID (optional)'
            placeholder='Bank reference or Telebirr transaction ID'
            value={form.externalTransactionId}
            onChange={e =>
              handleChange('externalTransactionId', e.target.value)
            }
          />

          <div className='grid grid-cols-2 gap-3'>
            <Select
              label='Month'
              value={form.paymentPeriod.month}
              onChange={e =>
                handleChange('paymentPeriod', {
                  ...form.paymentPeriod,
                  month: Number(e.target.value)
                })
              }
              options={Array.from({ length: 12 }, (_, i) => ({
                value: i + 1,
                label: new Date(2024, i, 1).toLocaleString('en', {
                  month: 'long'
                })
              }))}
            />
            <Input
              label='Year'
              type='number'
              min='2024'
              max='2030'
              value={form.paymentPeriod.year}
              onChange={e =>
                handleChange('paymentPeriod', {
                  ...form.paymentPeriod,
                  year: Number(e.target.value)
                })
              }
            />
          </div>

          <Button
            type='submit'
            variant='gold'
            fullWidth
            loading={submitting}
            disabled={!rental}
            icon={CreditCard}
          >
            Process Payment —{' '}
            {form.amount ? formatCurrency(Number(form.amount)) : 'ETB 0'}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default MakePayment
