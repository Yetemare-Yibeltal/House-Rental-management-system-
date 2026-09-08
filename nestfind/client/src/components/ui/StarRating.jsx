// nestfind/nestfind/client/src/components/ui/StarRating.jsx

import { useState } from 'react'
import { Star } from 'lucide-react'

const StarRating = ({
  value = 0,
  onChange,
  max = 5,
  size = 20,
  readOnly = false,
  showValue = false,
  className = ''
}) => {
  const [hovered, setHovered] = useState(0)

  const displayValue = hovered || value

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1
        const filled = starValue <= displayValue

        return (
          <button
            key={i}
            type='button'
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(starValue)}
            onMouseEnter={() => !readOnly && setHovered(starValue)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            className={`
              transition-transform duration-100
              ${!readOnly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}
              focus:outline-none
            `}
          >
            <Star
              size={size}
              className={`transition-colors duration-150 ${
                filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
              }`}
            />
          </button>
        )
      })}

      {showValue && (
        <span className='ml-1 text-sm font-semibold text-yellow-400'>
          {value.toFixed(1)}
        </span>
      )}
    </div>
  )
}

export const RatingDisplay = ({ value = 0, count, size = 'sm' }) => {
  const sizes = { sm: 14, md: 16, lg: 20 }
  const starSize = sizes[size] || 14

  return (
    <div className='flex items-center gap-1.5'>
      <Star size={starSize} className='text-yellow-400 fill-yellow-400' />
      <span className='text-sm font-semibold text-white'>
        {Number(value).toFixed(1)}
      </span>
      {count !== undefined && (
        <span className='text-xs text-gray-400'>({count})</span>
      )}
    </div>
  )
}

export default StarRating
