// nestfind/nestfind/client/src/pages/landlord/ManageTenants.jsx

import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import TenantRow from '../../components/landlord/TenantRow'
import EmptyState from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import landlordApi from '../../api/landlordApi'

const ManageTenants = () => {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await landlordApi.getTenants()
        setTenants(response.data.data.tenants || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchTenants()
  }, [])

  if (loading)
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    )

  return (
    <DashboardLayout>
      <SEO title='Manage Tenants' />

      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>
          My Tenants
        </h1>
        <p className='text-gray-400 text-sm mt-1'>
          {tenants.length} active tenants
        </p>
      </div>

      {tenants.length === 0 ? (
        <EmptyState
          emoji='👥'
          title='No active tenants'
          description='Tenants with active rentals will appear here.'
        />
      ) : (
        <div className='space-y-3'>
          {tenants.map(tenantData => (
            <TenantRow key={tenantData.tenant?._id} tenantData={tenantData} />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}

export default ManageTenants
