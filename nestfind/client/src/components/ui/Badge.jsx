// nestfind/nestfind/client/src/components/ui/Badge.jsx

const variants = {
  gold: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  green: 'bg-green-500/15 text-green-400 border-green-500/30',
  red: 'bg-red-500/15 text-red-400 border-red-500/30',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  orange: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  gray: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  yellow: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
}

const sizes = {
  xs: 'px-2 py-0.5 text-[10px]',
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3 py-1 text-sm'
}

const statusVariantMap = {
  active: 'green',
  approved: 'green',
  completed: 'green',
  pending: 'gold',
  pending_review: 'gold',
  submitted: 'gold',
  in_progress: 'blue',
  declined: 'red',
  rejected: 'red',
  cancelled: 'red',
  suspended: 'red',
  expired: 'gray',
  inactive: 'gray',
  emergency: 'red',
  high: 'orange',
  medium: 'gold',
  low: 'green'
}

const Badge = ({
  children,
  variant = 'gold',
  size = 'sm',
  status,
  dot = false,
  className = '',
  pill = true
}) => {
  const resolvedVariant = status ? statusVariantMap[status] || 'gray' : variant

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-semibold border
        ${variants[resolvedVariant] || variants.gold}
        ${sizes[size]}
        ${pill ? 'rounded-full' : 'rounded-lg'}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            resolvedVariant === 'green'
              ? 'bg-green-400'
              : resolvedVariant === 'red'
              ? 'bg-red-400'
              : resolvedVariant === 'blue'
              ? 'bg-blue-400'
              : resolvedVariant === 'orange'
              ? 'bg-orange-400'
              : 'bg-yellow-400'
          }`}
        />
      )}
      {children}
    </span>
  )
}

export default Badge
