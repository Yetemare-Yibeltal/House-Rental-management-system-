import { AMENITIES } from '../../utils/constants';

const SIZES = {
  xs: 'px-2 py-0.5 text-[10px] gap-1',
  sm: 'px-2.5 py-1 text-xs gap-1.5',
  md: 'px-3 py-1.5 text-sm gap-2',
};

const AmenityBadge = ({ amenityKey, size = 'sm' }) => {
  const amenity = AMENITIES.find((a) => a.key === amenityKey);
  if (!amenity) return null;

  return (
    <span className={`inline-flex items-center bg-surface-light border border-surface-border text-gray-300 rounded-full font-medium ${SIZES[size] || SIZES.sm}`}>
      <span>{amenity.icon}</span>
      {amenity.label}
    </span>
  );
};

export const AmenitiesGrid = ({ amenities = {}, maxShow = null }) => {
  const enabled = AMENITIES.filter((a) => amenities[a.key]);
  const visible = maxShow ? enabled.slice(0, maxShow) : enabled;
  const remaining = maxShow && enabled.length > maxShow ? enabled.length - maxShow : 0;

  if (visible.length === 0) {
    return <p className="text-xs text-gray-500">No amenities listed</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((a) => (
        <AmenityBadge key={a.key} amenityKey={a.key} size="sm" />
      ))}
      {remaining > 0 && (
        <span className="px-2.5 py-1 text-xs bg-surface-light border border-surface-border text-gray-400 rounded-full">
          +{remaining} more
        </span>
      )}
    </div>
  );
};

export default AmenityBadge;
