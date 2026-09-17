// nestfind/nestfind/client/src/pages/tenant/SavedSearches.jsx

import { useState, useEffect } from 'react'
import { Search, Play, Trash2, Bell, BellOff } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import SEO from '../../components/common/SEO'
import tenantApi from '../../api/tenantApi'
import { formatTimeAgo } from '../../utils/formatters'
import toast from 'react-hot-toast'

const SavedSearches = () => {
  const [searches, setSearches] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchSearches = async () => {
    try {
      const response = await tenantApi.getSavedSearches()
      setSearches(response.data.data.searches || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSearches()
  }, [])

  const handleRunSearch = search => {
    const query = search.ai?.naturalLanguageQuery || ''
    if (query) {
      window.location.href = `/search?q=${encodeURIComponent(query)}`
    } else {
      window.location.href = '/listings'
    }
  }

  const handleToggleAlert = async search => {
    try {
      await tenantApi.updateSavedSearch(search._id, {
        alertEnabled: !search.alertEnabled
      })
      setSearches(prev =>
        prev.map(s =>
          s._id === search._id ? { ...s, alertEnabled: !s.alertEnabled } : s
        )
      )
      toast.success(`Alert ${!search.alertEnabled ? 'enabled' : 'disabled'}`)
    } catch {
      toast.error('Failed to update alert')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await tenantApi.deleteSavedSearch(deleteId)
      setSearches(prev => prev.filter(s => s._id !== deleteId))
      toast.success('Search deleted')
      setDeleteId(null)
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  if (loading)
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    )

  return (
    <DashboardLayout>
      <SEO title='Saved Searches' />

      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white font-display'>
          Saved Searches
        </h1>
        <p className='text-gray-400 text-sm mt-1'>
          Re-run your searches and get new listing alerts
        </p>
      </div>

      {searches.length === 0 ? (
        <EmptyState
          emoji='🔍'
          title='No saved searches'
          description='Save a search to get notified when new matching properties are listed.'
          action={() => (window.location.href = '/listings')}
          actionLabel='Browse Properties'
        />
      ) : (
        <div className='space-y-4'>
          {searches.map(search => (
            <div
              key={search._id}
              className='bg-surface-card border border-surface-border rounded-2xl p-5 hover:border-yellow-500/20 transition-all'
            >
              <div className='flex items-start justify-between mb-2'>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-bold text-white'>
                    {search.name ||
                      search.ai?.naturalLanguageQuery ||
                      'Saved Search'}
                  </p>
                  <p className='text-xs text-gray-400 mt-0.5'>
                    Last run:{' '}
                    {search.lastRunAt
                      ? formatTimeAgo(search.lastRunAt)
                      : 'Never'}{' '}
                    ·
                    {search.matchCount > 0
                      ? ` ${search.matchCount} matches`
                      : ' Run to see results'}
                  </p>
                </div>
                <div className='flex items-center gap-2 ml-3'>
                  <button
                    onClick={() => handleToggleAlert(search)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      search.alertEnabled
                        ? 'text-yellow-400 bg-yellow-500/10'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                    title={
                      search.alertEnabled ? 'Disable alerts' : 'Enable alerts'
                    }
                  >
                    {search.alertEnabled ? (
                      <Bell size={14} />
                    ) : (
                      <BellOff size={14} />
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteId(search._id)}
                    className='p-1.5 rounded-lg text-gray-500 hover:text-red-400 transition-colors'
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {search.ai?.naturalLanguageQuery && (
                <div className='flex items-start gap-2 p-2.5 bg-yellow-500/5 border border-yellow-500/20 rounded-xl mb-3'>
                  <Search
                    size={12}
                    className='text-yellow-400 flex-shrink-0 mt-0.5'
                  />
                  <p className='text-xs text-gray-300 italic'>
                    "{search.ai.naturalLanguageQuery}"
                  </p>
                </div>
              )}

              {search.alertEnabled && (
                <p className='text-xs text-yellow-400 mb-3'>
                  🔔 Alerts enabled · {search.alertFrequency} notifications
                </p>
              )}

              <Button
                variant='outline'
                size='sm'
                icon={Play}
                onClick={() => handleRunSearch(search)}
                fullWidth
              >
                Run Search
              </Button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title='Delete Search?'
        message='This saved search and its alerts will be permanently deleted.'
        type='danger'
        confirmLabel='Delete'
        loading={deleting}
      />
    </DashboardLayout>
  )
}

export default SavedSearches
