// nestfind/nestfind/client/src/components/ui/Skeleton.jsx

const Skeleton = ({
  width = '100%',
  height = '1rem',
  borderRadius = '0.5rem',
  className = '',
  count = 1
}) => {
  const skeletonStyle = {
    width,
    height,
    borderRadius
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={skeletonStyle}
          className={`skeleton ${i < count - 1 ? 'mb-2' : ''} ${className}`}
        />
      ))}
    </>
  )
}

export const PropertyCardSkeleton = () => (
  <div className='bg-surface-card border border-surface-border rounded-2xl overflow-hidden'>
    <Skeleton height='200px' borderRadius='0' />
    <div className='p-4 space-y-3'>
      <Skeleton height='1.25rem' width='70%' />
      <Skeleton height='1rem' width='50%' />
      <div className='flex gap-2'>
        <Skeleton height='1.5rem' width='60px' />
        <Skeleton height='1.5rem' width='60px' />
        <Skeleton height='1.5rem' width='60px' />
      </div>
      <Skeleton height='1.5rem' width='40%' />
    </div>
  </div>
)

export const DashboardStatSkeleton = () => (
  <div className='bg-surface-card border border-surface-border rounded-2xl p-6'>
    <div className='flex items-center justify-between mb-4'>
      <Skeleton height='1rem' width='60%' />
      <Skeleton height='2.5rem' width='2.5rem' borderRadius='0.75rem' />
    </div>
    <Skeleton height='2rem' width='40%' />
    <Skeleton height='0.75rem' width='50%' className='mt-2' />
  </div>
)

export const TableRowSkeleton = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className='px-4 py-3'>
        <Skeleton height='1rem' />
      </td>
    ))}
  </tr>
)

export const ProfileSkeleton = () => (
  <div className='flex items-center gap-4'>
    <Skeleton height='3rem' width='3rem' borderRadius='50%' />
    <div className='flex-1'>
      <Skeleton height='1rem' width='40%' />
      <Skeleton height='0.75rem' width='60%' className='mt-1.5' />
    </div>
  </div>
)

export default Skeleton
