import { MapPin, ExternalLink } from 'lucide-react';

const PropertyMap = ({ location, title }) => {
  const lat = location?.coordinates?.coordinates?.[1];
  const lng = location?.coordinates?.coordinates?.[0];
  const hasCoords = Boolean(lat && lng);

  const mapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : `https://www.google.com/maps/search/${encodeURIComponent(`${location?.address || ''}, ${location?.subCity || ''}, ${location?.city || 'Addis Ababa'}, Ethiopia`)}`;
  const embedUrl = hasCoords ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed` : null;

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-yellow-400" />
          <h3 className="text-sm font-bold text-white">Location</h3>
        </div>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 transition-colors">
          View on Google Maps <ExternalLink size={11} />
        </a>
      </div>
      <div className="px-5 py-3 bg-surface-light">
        <p className="text-sm text-gray-300">
          {location?.address && <span>{location.address}, </span>}
          <span className="font-medium text-white">{location?.subCity}</span>
          {location?.city && `, ${location.city}`}
        </p>
      </div>
      {embedUrl ? (
        <div className="h-48 w-full">
          <iframe src={embedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={`Map - ${title}`} />
        </div>
      ) : (
        <div className="h-40 bg-surface-light flex flex-col items-center justify-center gap-2">
          <MapPin size={28} className="text-yellow-500/40" />
          <p className="text-xs text-gray-500">Map preview unavailable</p>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-yellow-400 hover:underline">Search on Google Maps →</a>
        </div>
      )}
    </div>
  );
};

export default PropertyMap;
