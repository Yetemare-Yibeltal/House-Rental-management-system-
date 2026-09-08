// nestfind/nestfind/client/src/components/ui/GradientText.jsx

const GradientText = ({
  children,
  className = '',
  as: Tag = 'span',
  gradient = 'gold'
}) => {
  const gradients = {
    gold: 'from-yellow-600 via-yellow-400 to-yellow-700',
    goldLight: 'from-yellow-400 via-yellow-200 to-yellow-500',
    white: 'from-white via-gray-200 to-white',
    blue: 'from-blue-400 via-cyan-300 to-blue-600'
  }

  return (
    <Tag
      className={`
        bg-gradient-to-r ${gradients[gradient] || gradients.gold}
        bg-clip-text text-transparent
        ${className}
      `}
    >
      {children}
    </Tag>
  )
}

export default GradientText
