// nestfind/nestfind/client/src/components/ui/Button.jsx

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import LoadingSpinner from './LoadingSpinner'

const variants = {
  gold: 'bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-700 text-black font-bold hover:shadow-gold hover:shadow-lg border-0',
  outline:
    'bg-transparent border border-yellow-500 text-yellow-400 hover:bg-yellow-500/10 hover:shadow-gold',
  ghost: 'bg-transparent text-yellow-400 hover:bg-yellow-500/10 border-0',
  dark: 'bg-surface-card border border-surface-border text-white hover:border-yellow-500/50',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-0',
  success: 'bg-green-600 hover:bg-green-700 text-white border-0'
}

const sizes = {
  xs: 'px-3 py-1.5 text-xs rounded-lg',
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-6 py-2.5 text-sm rounded-xl',
  lg: 'px-8 py-3 text-base rounded-xl',
  xl: 'px-10 py-4 text-lg rounded-2xl'
}

const Button = forwardRef(
  (
    {
      children,
      variant = 'gold',
      size = 'md',
      loading = false,
      disabled = false,
      fullWidth = false,
      icon: Icon = null,
      iconPosition = 'left',
      className = '',
      onClick,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <motion.button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        whileHover={!isDisabled ? { scale: 1.02 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        className={`
        inline-flex items-center justify-center gap-2
        font-semibold transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-yellow-500/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant] || variants.gold}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
        {...props}
      >
        {loading ? (
          <LoadingSpinner
            size='sm'
            color={variant === 'gold' ? 'dark' : 'gold'}
          />
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon size={16} />}
            {children}
            {Icon && iconPosition === 'right' && <Icon size={16} />}
          </>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button
