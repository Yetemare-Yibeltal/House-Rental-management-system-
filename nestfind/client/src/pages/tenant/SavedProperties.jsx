// nestfind/nestfind/client/src/pages/tenant/SavedProperties.jsx

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import PropertyCard from '../../components/property/PropertyCard'
import { PropertyCardSkeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import SEO from '../../components/common/SEO'
import tenantApi from '../../api/tenantApi'

const SavedProperties = () => {
  const [saved, setSaved] = useState([])
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCollection, setActiveCollection] = useState('')

  const fetchSaved = async (collection = '') => {
    setLoading(true)
    try {
      const [savedRes, collRes] = await Promise.all([
        tenantApi.getSavedProperties({ collection }),
        tenantApi.getCollections()
      ])
      setSaved(savedRes.data.data || [])
      setCollections(collRes.data.data.collections || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSaved()
  }, [])

  const handleSaveToggle = (propertyId, isSaved) => {
    if (!isSaved) {
      setSaved(prev => prev.filter(s => s.property?._id !== propertyId))
    }
  }

  const properties = saved.map(s => s.property).filter(Boolean)

  return (
    <DashboardLayout>
      <SEO title='Saved Properties' />

      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>
          Saved Properties
        </h1>
        <p className='text-gray-400 text-sm mt-1'>
          {properties.length} saved properties
        </p>
      </div>

      {/* Collections */}
      {collections.length > 0 && (
        <div className='flex gap-2 flex-wrap mb-5'>
          <button
            onClick={() => {
              setActiveCollection('')
              fetchSaved('')
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
              !activeCollection
                ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                : 'border-surface-border text-gray-400'
            }`}
          >
            All ({saved.length})
          </button>
          {collections.map(col => (
            <button
              key={col.name}
              onClick={() => {
                setActiveCollection(col.name)
                fetchSaved(col.name)
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                activeCollection === col.name
                  ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                  : 'border-surface-border text-gray-400'
              }`}
            >
              {col.name} ({col.count})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <EmptyState
          emoji='❤️'
          title='No saved properties'
          description='Save properties you like by clicking the heart icon on any listing.'
          action={() => (window.location.href = '/listings')}
          actionLabel='Browse Properties'
        />
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {properties.map(property => (
            <PropertyCard
              key={property._id}
              property={property}
              isSaved
              onSaveToggle={handleSaveToggle}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}

export default SavedProperties
