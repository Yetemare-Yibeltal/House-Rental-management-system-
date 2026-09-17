// nestfind/nestfind/client/src/pages/landlord/ContractManagement.jsx

import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import landlordApi from '../../api/landlordApi'
import { formatDate, formatCurrency } from '../../utils/formatters'

const ContractManagement = () => {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await landlordApi.getContracts()
        setContracts(response.data.data.contracts || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchContracts()
  }, [])

  if (loading)
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    )

  return (
    <DashboardLayout>
      <SEO title='Contract Management' />

      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>
          Contracts
        </h1>
        <p className='text-gray-400 text-sm mt-1'>
          Manage all your lease agreements
        </p>
      </div>

      {contracts.length === 0 ? (
        <EmptyState
          emoji='📋'
          title='No contracts yet'
          description='Lease contracts you create for tenants will appear here.'
        />
      ) : (
        <div className='space-y-4'>
          {contracts.map(contract => (
            <div
              key={contract._id}
              className='bg-surface-card border border-surface-border rounded-2xl p-5 hover:border-yellow-500/20 transition-all'
            >
              <div className='flex items-start justify-between mb-3'>
                <div>
                  <p className='text-sm font-bold text-white'>
                    {contract.property?.title}
                  </p>
                  <p className='text-xs text-gray-400'>
                    Tenant: {contract.tenant?.firstName}{' '}
                    {contract.tenant?.lastName}
                  </p>
                </div>
                <Badge status={contract.status} size='sm' dot />
              </div>
              <div className='grid grid-cols-3 gap-3 mb-3'>
                <div className='bg-surface-light rounded-xl p-3'>
                  <p className='text-[10px] text-gray-500'>Rent</p>
                  <p className='text-xs font-bold text-yellow-400'>
                    {formatCurrency(contract.terms?.monthlyRent)}
                  </p>
                </div>
                <div className='bg-surface-light rounded-xl p-3'>
                  <p className='text-[10px] text-gray-500'>Start</p>
                  <p className='text-xs font-semibold text-white'>
                    {formatDate(contract.terms?.startDate)}
                  </p>
                </div>
                <div className='bg-surface-light rounded-xl p-3'>
                  <p className='text-[10px] text-gray-500'>End</p>
                  <p className='text-xs font-semibold text-white'>
                    {formatDate(contract.terms?.endDate)}
                  </p>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-2 text-xs'>
                <div
                  className={`p-2 rounded-lg text-center ${
                    contract.landlordSignature?.isSigned
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-surface-light text-gray-400'
                  }`}
                >
                  You:{' '}
                  {contract.landlordSignature?.isSigned
                    ? '✓ Signed'
                    : 'Pending'}
                </div>
                <div
                  className={`p-2 rounded-lg text-center ${
                    contract.tenantSignature?.isSigned
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-yellow-500/10 text-yellow-400'
                  }`}
                >
                  Tenant:{' '}
                  {contract.tenantSignature?.isSigned ? '✓ Signed' : 'Pending'}
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
