// nestfind/nestfind/client/src/components/ui/StatCard.jsx

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatNumber } from '../../utils/formatters'

const StatCard = ({
  title,
  value,
  prefix = '',
  suffix = '',
  icon: Icon,
  iconColor = 'text-yellow-400',
  iconBg = 'bg-yellow-500/10 border-yellow-500/20',
  trend,
  trendLabel,
  description,
  className = '',
  loading = false,
  onClick
}) => {
  const isPositiveTrend = trend > 0
  const isNegativeTrend = trend < 0

  if (loading) {
    return (
      <div
        className={`bg-surface-card border border-surface-border rounded-2xl p-6 ${className}`}
      >
        <div className='skeleton h-4 w-24 mb-4 rounded' />
        <div className='skeleton h-8 w-16 rounded mb-2' />
        <div className='skeleton h-3 w-32 rounded' />
      </div>
    )
  }

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02, y: -2 } : {}}
      onClick={onClick}
      className={`
        bg-surface-card border border-surface-border rounded-2xl p-6
        transition-all duration-200
        ${
          onClick
            ? 'cursor-pointer hover:border-yellow-500/30 hover:shadow-card'
            : ''
        }
        ${className}
      `}
    >
      <div className='flex items-start justify-between mb-4'>
        <div>
          <p className='text-xs font-medium text-gray-400 uppercase tracking-wider mb-1'>
            {title}
          </p>
        </div>
        {Icon && (
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconBg}`}
          >
            <Icon size={18} className={iconColor} />
          </div>
        )}
      </div>

      <div className='flex items-end justify-between'>
        <div>
          <p className='text-2xl font-bold text-white font-display'>
            {prefix}
            {typeof value === 'number' ? formatNumber(value) : value}
            {suffix}
          </p>
          {description && (
            <p className='text-xs text-gray-500 mt-1'>{description}</p>
          )}
        </div>

        {trend !== undefined && trend !== null && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
              isPositiveTrend
                ? 'text-green-400 bg-green-500/10'
                : isNegativeTrend
                ? 'text-red-400 bg-red-500/10'
                : 'text-gray-400 bg-gray-500/10'
            }`}
          >
            {isPositiveTrend ? (
              <TrendingUp size={12} />
            ) : isNegativeTrend ? (
              <TrendingDown size={12} />
            ) : (
              <Minus size={12} />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      {trendLabel && <p className='text-xs text-gray-500 mt-2'>{trendLabel}</p>}
    </motion.div>
  )
}

export default StatCard
