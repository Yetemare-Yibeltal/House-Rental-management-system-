// nestfind/nestfind/client/src/components/ui/EmptyState.jsx

import { motion } from 'framer-motion'
import Button from './Button'

const EmptyState = ({
  icon: Icon,
  emoji,
  title,
  description,
  action,
  actionLabel,
  actionVariant = 'gold',
  secondaryAction,
  secondaryActionLabel,
  className = '',
  size = 'md'
}) => {
  const sizes = {
    sm: {
      container: 'py-8',
      iconSize: 40,
      titleClass: 'text-base',
      descClass: 'text-sm'
    },
    md: {
      container: 'py-12',
      iconSize: 48,
      titleClass: 'text-lg',
      descClass: 'text-sm'
    },
    lg: {
      container: 'py-20',
      iconSize: 64,
      titleClass: 'text-xl',
      descClass: 'text-base'
    }
  }

  const s = sizes[size] || sizes.md

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center text-center ${s.container} ${className}`}
    >
      {/* Icon */}
      <div className='mb-4'>
        {emoji ? (
          <span className='text-5xl'>{emoji}</span>
        ) : Icon ? (
          <div className='w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto'>
            <Icon size={s.iconSize * 0.5} className='text-yellow-500/60' />
          </div>
        ) : (
          <div className='w-16 h-16 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center mx-auto'>
            <span className='text-2xl'>📭</span>
          </div>
        )}
      </div>

      {/* Text */}
      <h3 className={`font-bold text-white mb-2 font-display ${s.titleClass}`}>
        {title || 'Nothing here yet'}
      </h3>
      {description && (
        <p className={`text-gray-400 max-w-sm mb-6 ${s.descClass}`}>
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className='flex items-center gap-3 flex-wrap justify-center'>
          {action && (
            <Button onClick={action} variant={actionVariant} size='md'>
              {actionLabel || 'Get Started'}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction} variant='outline' size='md'>
              {secondaryActionLabel || 'Learn More'}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default EmptyState
