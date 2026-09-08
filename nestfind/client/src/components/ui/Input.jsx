// nestfind/nestfind/client/src/components/ui/Input.jsx

import { forwardRef, useState } from 'react'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

const Input = forwardRef(
  (
    {
      label,
      type = 'text',
      error,
      success,
      hint,
      icon: Icon,
      iconPosition = 'left',
      rightElement,
      className = '',
      containerClassName = '',
      disabled = false,
      required = false,
      fullWidth = true,
      size = 'md',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-4 py-3 text-base'
    }

    const borderColor = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : success
      ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
      : 'border-surface-border focus:border-yellow-500 focus:ring-yellow-500/20'

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
        {label && (
          <label className='block text-sm font-medium text-gray-300 mb-1.5'>
            {label}
            {required && <span className='text-yellow-400 ml-1'>*</span>}
          </label>
        )}

        <div className='relative'>
          {Icon && iconPosition === 'left' && (
            <div className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'>
              <Icon size={16} />
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            className={`
            w-full bg-surface-card text-white placeholder-gray-500
            border rounded-xl outline-none transition-all duration-200
            focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed
            ${sizes[size]}
            ${Icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${
              isPassword || rightElement || (Icon && iconPosition === 'right')
                ? 'pr-10'
                : ''
            }
            ${borderColor}
            ${className}
          `}
            {...props}
          />

          {Icon && iconPosition === 'right' && !isPassword && (
            <div className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'>
              <Icon size={16} />
            </div>
          )}

          {isPassword && (
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-400 transition-colors'
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}

          {rightElement && !isPassword && (
            <div className='absolute right-3 top-1/2 -translate-y-1/2'>
              {rightElement}
            </div>
          )}

          {error && (
            <div className='absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none'>
              <AlertCircle size={16} />
            </div>
          )}

          {success && !error && (
            <div className='absolute right-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none'>
              <CheckCircle size={16} />
            </div>
          )}
        </div>

        {error && (
          <p className='mt-1.5 text-xs text-red-400 flex items-center gap-1'>
            <AlertCircle size={12} />
            {error}
          </p>
        )}
        {!error && hint && (
          <p className='mt-1.5 text-xs text-gray-500'>{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
