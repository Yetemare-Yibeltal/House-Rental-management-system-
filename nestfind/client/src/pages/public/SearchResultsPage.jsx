// nestfind/nestfind/client/src/pages/public/SearchResultsPage.jsx

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bot, Sparkles } from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import PropertyCard from '../../components/property/PropertyCard'
import SmartSearchBar from '../../components/ai/SmartSearchBar'
import Pagination from '../../components/ui/Pagination'
import { PropertyCardSkeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import SEO from '../../components/common/SEO'
import aiApi from '../../api/aiApi'

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState([])
  const [interpretation, setInterpretation] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const search = async (q, page = 1) => {
    if (!q.trim()) return
    setLoading(true)
    try {
      const response = await aiApi.smartSearch({ q, page, limit: 12 })
      const d = response.data.data
      setResults(d.properties || [])
      setInterpretation(d.interpretation || '')
      setConfidence(d.confidence || 0)
      setTotalPages(d.pagination?.totalPages || 1)
      setTotal(d.pagination?.total || 0)
      setCurrentPage(page)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (query) search(query, 1)
  }, [query])

  const handleSearch = newQuery => {
    setSearchParams({ q: newQuery })
    search(newQuery, 1)
  }

  const handlePageChange = page => {
    search(query, page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <PublicLayout>
      <SEO
        title={`Search: ${query}`}
        description={`AI search results for "${query}" in Ethiopia`}
      />

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='mb-6'>
          <SmartSearchBar
            onSearch={handleSearch}
            defaultValue={query}
            autoFocus={false}
          />
        </div>

        {/* AI Interpretation */}
        {interpretation && !loading && (
          <div className='flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl mb-6'>
            <div className='w-8 h-8 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0'>
              <Bot size={16} className='text-yellow-400' />
            </div>
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-1'>
                <p className='text-xs font-semibold text-yellow-400'>
                  AI Understanding
                </p>
                <div className='flex items-center gap-1'>
                  <Sparkles size={10} className='text-yellow-400' />
                  <span className='text-[10px] text-yellow-400'>
                    {confidence}% confident
                  </span>
                </div>
              </div>
              <p className='text-sm text-gray-300'>{interpretation}</p>
              {total > 0 && (
                <p className='text-xs text-gray-500 mt-1'>
                  Found {total.toLocaleString()} matching properties
                </p>
              )}
            </div>
          </div>
        )}

        {/* Results Header */}
        {!loading && query && (
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-base font-bold text-white'>
              Results for "<span className='text-yellow-400'>{query}</span>"
            </h2>
            <span className='text-sm text-gray-400'>
              {total.toLocaleString()} found
            </span>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {Array.from({ length: 12 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            emoji='🔍'
            title='No properties found'
            description={`No results for "${query}". Try a different search or browse all listings.`}
            action={() => (window.location.href = '/listings')}
            actionLabel='Browse All Properties'
          />
        ) : (
          <>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              {results.map(p => (
                <PropertyCard key={p._id} property={p} />
              ))}
            </div>
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
    </PublicLayout>
  )
}

export default SearchResultsPage
