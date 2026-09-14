// nestfind/nestfind/client/src/components/ai/PropertyRecommendations.jsx

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, RefreshCw, Sparkles } from 'lucide-react'
import { useAIStore } from '../../context/AIContext'
import PropertyCard from '../property/PropertyCard'
import { PropertyCardSkeleton } from '../ui/Skeleton'
import Button from '../ui/Button'
import GradientText from '../ui/GradientText'

const PropertyRecommendations = ({
  title = 'AI Recommended For You',
  limit = 6
}) => {
  const {
    recommendations,
    recommendationsLoading,
    fetchRecommendations,
    recordInteraction
  } = useAIStore()

  useEffect(() => {
    if (recommendations.length === 0) {
      fetchRecommendations()
    }
  }, [])

  const displayRecs = recommendations.slice(0, limit)

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center'>
            <Bot size={16} className='text-yellow-400' />
          </div>
          <div>
            <h3 className='text-base font-bold text-white font-display'>
              {title}
            </h3>
            <p className='text-xs text-gray-500'>
              Personalized by AI based on your preferences
            </p>
          </div>
        </div>
        <Button
          variant='ghost'
          size='sm'
          icon={RefreshCw}
          onClick={() => fetchRecommendations(true)}
          loading={recommendationsLoading}
        >
          Refresh
        </Button>
      </div>

      {/* AI Insight Banner */}
      {recommendations[0]?.ai?.matchReason && (
        <div className='flex items-start gap-2 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl'>
          <Sparkles
            size={14}
            className='text-yellow-400 flex-shrink-0 mt-0.5'
          />
          <p className='text-xs text-yellow-300'>
            <strong>AI Insight:</strong> {recommendations[0].ai.matchReason}
          </p>
        </div>
      )}

      {/* Properties Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {recommendationsLoading ? (
          Array.from({ length: limit }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))
        ) : displayRecs.length === 0 ? (
          <div className='col-span-full text-center py-12'>
            <Bot size={40} className='text-gray-600 mx-auto mb-3' />
            <p className='text-gray-400 text-sm mb-2'>No recommendations yet</p>
            <p className='text-gray-500 text-xs mb-4'>
              Update your AI preferences to get personalized property
              suggestions
            </p>
            <Button
              variant='gold'
              size='sm'
              onClick={() => fetchRecommendations(true)}
            >
              Generate Recommendations
            </Button>
          </div>
        ) : (
          displayRecs.map((property, i) => (
            <motion.div
              key={property._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <PropertyCard
                property={property}
                onSaveToggle={() => recordInteraction(property._id, 'saved')}
              />
              {property.ai?.matchScore > 0 && (
                <div className='mt-1.5 flex items-center gap-1.5 px-1'>
                  <Sparkles size={11} className='text-yellow-400' />
                  <span className='text-xs text-yellow-400 font-medium'>
                    {property.ai.matchScore}% match
                  </span>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

export default PropertyRecommendations
