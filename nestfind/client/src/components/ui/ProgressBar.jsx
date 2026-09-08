// nestfind/nestfind/client/src/components/ui/ProgressBar.jsx

import { motion } from 'framer-motion'

const colors = {
  gold: 'bg-gradient-to-r from-yellow-600 to-yellow-400',
  green: 'bg-green-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  orange: 'bg-orange-500'
}

const ProgressBar = ({
  value = 0,
  max = 100,
  color = 'gold',
  height = 8,
  showLabel = false,
  label,
  animated = true,
  className = '',
  rounded = true
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className='flex justify-between items-center mb-1.5'>
          <span className='text-xs text-gray-400'>{label}</span>
          <span className='text-xs font-semibold text-white'>
            {Math.round(percentage)}%
          </span>
        </div>
      )}

      <div
        className={`w-full bg-surface-border overflow-hidden ${
          rounded ? 'rounded-full' : 'rounded'
        }`}
        style={{ height }}
      >
        <motion.div
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${colors[color] || colors.gold} ${
            rounded ? 'rounded-full' : ''
          }`}
        />
      </div>
    </div>
  )
}

export const MultiProgressBar = ({
  segments = [],
  height = 8,
  className = ''
}) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0)

  return (
    <div
      className={`w-full flex overflow-hidden rounded-full ${className}`}
      style={{ height }}
    >
      {segments.map((segment, i) => (
        <motion.div
          key={i}
          initial={{ width: 0 }}
          animate={{ width: `${(segment.value / total) * 100}%` }}
          transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
          className={`h-full ${colors[segment.color] || colors.gold}`}
          title={`${segment.label}: ${segment.value}`}
        />
      ))}
    </div>
  )
}

export default ProgressBar
