// nestfind/nestfind/client/src/pages/landlord/ContractManagement.jsx

import { useState, useEffect } from 'react'
import { FileText, CheckCircle, Clock, Plus } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import landlordApi from '../../api/landlordApi'
import { formatDate, formatCurrency } from '../../utils/formatters'

const ContractManagement = () => {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true)
      try {
        const params = {}
        if (statusFilter !== 'all') params.status = statusFilter
        const response = await landlordApi.getContracts(params)
        setContracts(response.data.data || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchContracts()
  }, [statusFilter])

  return (
    <DashboardLayout>
      <SEO title='Contract Management' />

      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-white font-display'>
            Contracts
          </h1>
          <p className='text-gray-400 text-sm mt-1'>
            Manage all your rental lease agreements
          </p>
        </div>
      </div>

      {/* Status Filters */}
      <div className='flex flex-wrap gap-2 mb-5'>
        {[
          'all',
          'draft',
          'pending_tenant_signature',
          'active',
          'expired',
          'terminated'
        ].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border capitalize transition-all ${
              statusFilter === s
                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                : 'border-surface-border text-gray-400 hover:border-yellow-500/30'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader text='Loading contracts...' />
      ) : contracts.length === 0 ? (
        <EmptyState
          emoji='📋'
          title='No Contracts'
          description='Create rental contracts for your tenants to review and sign digitally.'
        />
      ) : (
        <div className='space-y-4'>
          {contracts.map(contract => (
            <div
              key={contract._id}
              className='bg-surface-card border border-surface-border rounded-2xl p-5 hover:border-yellow-500/20 transition-all'
            >
              <div className='flex items-start justify-between gap-3 mb-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center'>
                    <FileText size={18} className='text-yellow-400' />
                  </div>
                  <div>
                    <p className='text-sm font-bold text-white'>
                      Contract #{contract.contractNumber}
                    </p>
                    <p className='text-xs text-gray-400'>
                      {contract.tenant?.firstName} {contract.tenant?.lastName} —{' '}
                      {contract.property?.title}
                    </p>
                  </div>
                </div>
                <Badge status={contract.status} size='sm' dot />
              </div>

              <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4'>
                {[
                  {
                    label: 'Monthly Rent',
                    value: formatCurrency(contract.terms?.monthlyRent)
                  },
                  {
                    label: 'Start Date',
                    value: formatDate(contract.terms?.startDate)
                  },
                  {
                    label: 'End Date',
                    value: formatDate(contract.terms?.endDate)
                  },
                  {
                    label: 'Deposit',
                    value: formatCurrency(contract.terms?.securityDeposit)
                  }
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className='bg-surface-light rounded-xl p-2.5'
                  >
                    <p className='text-[10px] text-gray-500'>{label}</p>
                    <p className='text-xs font-semibold text-white mt-0.5'>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Signature Status */}
              <div className='flex gap-3'>
                <div
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
                    contract.landlordSignature?.isSigned
                      ? 'text-green-400 border-green-500/30 bg-green-500/5'
                      : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5'
                  }`}
                >
                  {contract.landlordSignature?.isSigned ? (
                    <CheckCircle size={12} />
                  ) : (
                    <Clock size={12} />
                  )}
                  Your Signature{' '}
                  {contract.landlordSignature?.isSigned ? 'Done' : 'Pending'}
                </div>
                <div
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
                    contract.tenantSignature?.isSigned
                      ? 'text-green-400 border-green-500/30 bg-green-500/5'
                      : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5'
                  }`}
                >
                  {contract.tenantSignature?.isSigned ? (
                    <CheckCircle size={12} />
                  ) : (
                    <Clock size={12} />
                  )}
                  Tenant{' '}
                  {contract.tenantSignature?.isSigned ? 'Signed' : 'Pending'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}

export default ContractManagement
