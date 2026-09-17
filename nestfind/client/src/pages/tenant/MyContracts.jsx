// nestfind/nestfind/client/src/pages/tenant/MyContracts.jsx

import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import ContractViewer from '../../components/tenant/ContractViewer'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import SEO from '../../components/common/SEO'
import tenantApi from '../../api/tenantApi'
import { formatDate, formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

const MyContracts = () => {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const fetchContracts = async () => {
    try {
      const response = await tenantApi.getContracts()
      setContracts(response.data.data.contracts || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContracts()
  }, [])

  const handleSign = async data => {
    await tenantApi.signContract(selectedContract._id, data)
    fetchContracts()
    setShowModal(false)
    toast.success('Contract signed!')
  }

  if (loading)
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    )

  return (
    <DashboardLayout>
      <SEO title='My Contracts' />

      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>
          My Contracts
        </h1>
        <p className='text-gray-400 text-sm mt-1'>
          Review and manage your lease agreements
        </p>
      </div>

      {contracts.length === 0 ? (
        <EmptyState
          emoji='📋'
          title='No contracts yet'
          description='Your lease contracts will appear here when a landlord creates one for you.'
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
                    Contract #{contract.contractNumber}
                  </p>
                </div>
                <Badge status={contract.status} size='sm' dot />
              </div>

              <div className='grid grid-cols-3 gap-3 mb-4'>
                <div className='bg-surface-light rounded-xl p-3'>
                  <p className='text-[10px] text-gray-500'>Monthly Rent</p>
                  <p className='text-xs font-bold text-yellow-400'>
                    {formatCurrency(contract.terms?.monthlyRent)}
                  </p>
                </div>
                <div className='bg-surface-light rounded-xl p-3'>
                  <p className='text-[10px] text-gray-500'>Start Date</p>
                  <p className='text-xs font-semibold text-white'>
                    {formatDate(contract.terms?.startDate)}
                  </p>
                </div>
                <div className='bg-surface-light rounded-xl p-3'>
                  <p className='text-[10px] text-gray-500'>End Date</p>
                  <p className='text-xs font-semibold text-white'>
                    {formatDate(contract.terms?.endDate)}
                  </p>
                </div>
              </div>

              {/* Signature Status */}
              <div className='flex gap-2 mb-4'>
                <div
                  className={`flex-1 p-2 rounded-lg text-center text-xs ${
                    contract.landlordSignature?.isSigned
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-surface-light text-gray-400'
                  }`}
                >
                  Landlord:{' '}
                  {contract.landlordSignature?.isSigned
                    ? '✓ Signed'
                    : 'Pending'}
                </div>
                <div
                  className={`flex-1 p-2 rounded-lg text-center text-xs ${
                    contract.tenantSignature?.isSigned
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-yellow-500/10 text-yellow-400'
                  }`}
                >
                  You:{' '}
                  {contract.tenantSignature?.isSigned ? '✓ Signed' : 'Pending'}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedContract(contract)
                  setShowModal(true)
                }}
                className='w-full py-2 text-sm font-medium border border-yellow-500/30 text-yellow-400 rounded-xl hover:bg-yellow-500/10 transition-colors'
              >
                {contract.status === 'pending_tenant_signature'
                  ? 'Review & Sign →'
                  : 'View Contract →'}
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title='Contract Details'
        size='xl'
      >
        {selectedContract && (
          <ContractViewer
            contract={selectedContract}
            canSign={selectedContract.status === 'pending_tenant_signature'}
            onSign={handleSign}
          />
        )}
      </Modal>
    </DashboardLayout>
  )
}

export default MyContracts
