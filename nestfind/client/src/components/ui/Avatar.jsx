// nestfind/nestfind/client/src/components/ui/Avatar.jsx

import { useState } from 'react'
import { getInitials, getInitialsColor } from '../../utils/helpers'

const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-20 h-20 text-xl',
  '3xl': 'w-24 h-24 text-2xl'
}

const Avatar = ({
  src,
  firstName = '',
  lastName = '',
  size = 'md',
  className = '',
  online = false,
  ring = false,
  onClick
}) => {
  const [imgError, setImgError] = useState(false)
  const initials = getInitials(firstName, lastName)
  const bgColor = getInitialsColor(`${firstName}${lastName}`)
  const showImage = src && !imgError

  return (
    <div
      className={`
        relative inline-flex flex-shrink-0
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div
        className={`
          rounded-full overflow-hidden flex items-center justify-center
          font-bold text-white select-none
          ${sizes[size]}
          ${
            ring
              ? 'ring-2 ring-yellow-500/50 ring-offset-2 ring-offset-dark'
              : ''
          }
        `}
        style={!showImage ? { backgroundColor: bgColor } : {}}
      >
        {showImage ? (
          <img
            src={src}
            alt={`${firstName} ${lastName}`}
            className='w-full h-full object-cover'
            onError={() => setImgError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {online && (
        <span className='absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-dark' />
      )}
    </div>
  )
}

export default Avatar
