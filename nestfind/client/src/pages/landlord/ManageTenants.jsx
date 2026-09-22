// nestfind/nestfind/client/src/pages/landlord/ManageTenants.jsx

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import TenantRow from '../../components/landlord/TenantRow'
import EmptyState from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import landlordApi from '../../api/landlordApi'
import { useDebounce } from '../../hooks/useDebounce'

const ManageTenants = () => {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 400)

  const fetchTenants = async (search = '') => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      const response = await landlordApi.getTenants(params)
      setTenants(response.data.data || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants(debouncedSearch)
  }, [debouncedSearch])

  return (
    <DashboardLayout>
      <SEO title='Manage Tenants' />

      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>
          My Tenants
        </h1>
        <p className='text-gray-400 text-sm mt-1'>
          {tenants.length} active {tenants.length === 1 ? 'tenant' : 'tenants'}
        </p>
      </div>

      {/* Search */}
      <div className='relative mb-5 max-w-md'>
        <Search
          size={15}
          className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
        />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder='Search tenants by name or email...'
          className='w-full bg-surface-card border border-surface-border text-white placeholder-gray-500 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-yellow-500 transition-colors'
        />
      </div>

      {loading ? (
        <PageLoader text='Loading tenants...' />
      ) : tenants.length === 0 ? (
        <EmptyState
          emoji='👥'
          title='No Active Tenants'
          description={
            searchQuery
              ? 'No tenants match your search.'
              : "You don't have any active tenants yet. Approve booking requests to start renting."
          }
        />
      ) : (
        <div className='space-y-3'>
          {tenants.map(tenantData => (
            <TenantRow
              key={tenantData.rental?._id || tenantData.tenant?._id}
              tenantData={tenantData}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}

export default ManageTenants
