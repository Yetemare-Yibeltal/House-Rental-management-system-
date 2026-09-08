// nestfind/nestfind/client/src/components/ui/LoadingSpinner.jsx

const sizes = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
  xl: 'w-12 h-12 border-[3px]',
  '2xl': 'w-16 h-16 border-4'
}

const colors = {
  gold: 'border-yellow-500/30 border-t-yellow-500',
  white: 'border-white/30 border-t-white',
  dark: 'border-gray-800 border-t-gray-600',
  gray: 'border-gray-600/30 border-t-gray-400'
}

const LoadingSpinner = ({
  size = 'md',
  color = 'gold',
  className = '',
  fullScreen = false,
  text = ''
}) => {
  const spinner = (
    <div
      className={`
        rounded-full animate-spin
        ${sizes[size] || sizes.md}
        ${colors[color] || colors.gold}
        ${className}
      `}
    />
  )

  if (fullScreen) {
    return (
      <div className='fixed inset-0 bg-dark/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 gap-4'>
        <div className='w-12 h-12 rounded-full border-4 border-yellow-500/30 border-t-yellow-500 animate-spin' />
        {text && <p className='text-gray-400 text-sm'>{text}</p>}
      </div>
    )
  }

  if (text) {
    return (
      <div className='flex items-center gap-3'>
        {spinner}
        <span className='text-gray-400 text-sm'>{text}</span>
      </div>
    )
  }

  return spinner
}

export const PageLoader = ({ text = 'Loading...' }) => (
  <div className='min-h-[400px] flex flex-col items-center justify-center gap-4'>
    <div className='w-10 h-10 rounded-full border-[3px] border-yellow-500/30 border-t-yellow-500 animate-spin' />
    <p className='text-gray-400 text-sm'>{text}</p>
  </div>
)

export default LoadingSpinner
