// nestfind/nestfind/client/src/pages/public/ListingsPage.jsx

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, Grid, List, MapPin } from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import PropertyCard from '../../components/property/PropertyCard'
import PropertyFilters from '../../components/property/PropertyFilters'
import SmartSearchBar from '../../components/ai/SmartSearchBar'
import Pagination from '../../components/ui/Pagination'
import { PropertyCardSkeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import SEO from '../../components/common/SEO'
import propertyApi from '../../api/propertyApi'
import { buildQueryString } from '../../utils/helpers'

const ListingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [properties, setProperties] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    subCity: searchParams.get('subCity') || '',
    propertyType: searchParams.get('propertyType') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minBedrooms: searchParams.get('minBedrooms') || '',
    furnished: searchParams.get('furnished') || '',
    amenities: searchParams.get('amenities')?.split(',').filter(Boolean) || [],
    sortBy: searchParams.get('sortBy') || 'newest',
    isFeatured: searchParams.get('isFeatured') || ''
  })

  const fetchProperties = useCallback(
    async (page = 1, currentFilters = filters) => {
      setLoading(true)
      try {
        const params = {
          page,
          limit: 12,
          ...currentFilters,
          amenities: currentFilters.amenities?.join(',') || ''
        }
        const response = await propertyApi.getProperties(params)
        const { data, pagination } = response.data
        setProperties(data || [])
        setTotal(pagination?.total || 0)
        setTotalPages(pagination?.totalPages || 1)
        setCurrentPage(page)
      } catch {
        setProperties([])
      } finally {
        setLoading(false)
      }
    },
    [filters]
  )

  useEffect(() => {
    fetchProperties(1, filters)
  }, [])

  const handleFiltersChange = useCallback(
    newFilters => {
      setFilters(newFilters)
      setSearchParams(
        new URLSearchParams(buildQueryString(newFilters).replace('?', ''))
      )
      fetchProperties(1, newFilters)
    },
    [fetchProperties, setSearchParams]
  )

  const handlePageChange = page => {
    fetchProperties(page, filters)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearch = query => {
    const newFilters = { ...filters, keyword: query }
    handleFiltersChange(newFilters)
  }

  return (
    <PublicLayout>
      <SEO
        title='Browse Properties'
        description='Search thousands of verified rental properties across Addis Ababa, Ethiopia.'
      />

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Page Header */}
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-white font-display mb-1'>
            Browse Properties
          </h1>
          <p className='text-gray-400 text-sm'>
            {total > 0
              ? `${total.toLocaleString()} verified properties in Ethiopia`
              : 'Finding properties...'}
          </p>
        </div>

        {/* Smart Search Bar */}
        <div className='mb-6'>
          <SmartSearchBar
            onSearch={handleSearch}
            defaultValue={filters.keyword}
            placeholder="Search with AI — try '2 bedroom in Bole under 25k'"
          />
        </div>

        <div className='flex gap-6'>
          {/* Sidebar Filters — Desktop */}
          <div className='hidden lg:block w-72 flex-shrink-0'>
            <div className='sticky top-20'>
              <PropertyFilters
                onFiltersChange={handleFiltersChange}
                initialFilters={filters}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className='flex-1 min-w-0'>
            {/* Toolbar */}
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className='lg:hidden flex items-center gap-1.5 px-3 py-2 border border-surface-border text-gray-400 rounded-xl text-sm hover:border-yellow-500/50 hover:text-yellow-400 transition-colors'
                >
                  <SlidersHorizontal size={14} />
                  Filters
                </button>
                {!loading && (
                  <p className='text-sm text-gray-400'>
                    {total.toLocaleString()} results
                  </p>
                )}
              </div>
              <div className='flex items-center gap-1'>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'text-yellow-400 bg-yellow-500/10'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'text-yellow-400 bg-yellow-500/10'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Mobile Filters */}
            {showMobileFilters && (
              <div className='lg:hidden mb-4'>
                <PropertyFilters
                  onFiltersChange={handleFiltersChange}
                  initialFilters={filters}
                />
              </div>
            )}

            {/* Properties Grid */}
            {loading ? (
              <div
                className={`grid gap-4 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                    : 'grid-cols-1'
                }`}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <PropertyCardSkeleton key={i} />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <EmptyState
                emoji='🏠'
                title='No properties found'
                description='Try adjusting your search filters or search in a different area.'
                action={() =>
                  handleFiltersChange({
                    keyword: '',
                    subCity: '',
                    propertyType: '',
                    minPrice: '',
                    maxPrice: '',
                    minBedrooms: '',
                    furnished: '',
                    amenities: [],
                    sortBy: 'newest'
                  })
                }
                actionLabel='Clear All Filters'
              />
            ) : (
              <>
                <div
                  className={`grid gap-4 ${
                    viewMode === 'grid'
                      ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                      : 'grid-cols-1'
                  }`}
                >
                  {properties.map(property => (
                    <PropertyCard
                      key={property._id}
                      property={property}
                      compact={viewMode === 'list'}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className='flex justify-center mt-8'>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}

export default ListingsPage
