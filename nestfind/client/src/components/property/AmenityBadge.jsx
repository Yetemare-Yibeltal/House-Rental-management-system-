
export default AmenityBadge;

export const AmenitiesGrid = ({ amenities = {}, maxShow = null }) => {
  const { AMENITIES } = require('../../utils/constants') || { AMENITIES: [] };
  const enabled = (AMENITIES || []).filter((a) => amenities[a.key]);
  const visible = maxShow ? enabled.slice(0, maxShow) : enabled;
  const remaining = maxShow && enabled.length > maxShow ? enabled.length - maxShow : 0;
  if (visible.length === 0) return <p className="text-xs text-gray-500">No amenities listed</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((amenity) => (
        <AmenityBadge key={amenity.key} amenityKey={amenity.key} size="sm" />
      ))}
      {remaining > 0 && (
        <span className="px-2.5 py-1 text-xs bg-surface-light border border-surface-border text-gray-400 rounded-full">
          +{remaining} more
        </span>
      )}
    </div>
  );
};
