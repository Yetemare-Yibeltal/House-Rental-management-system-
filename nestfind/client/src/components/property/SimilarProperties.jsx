import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const SimilarProperties = ({ properties = [] }) => {
  if (!properties.length) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-white font-display mb-4">Similar Properties</h3>
      <div className="space-y-3">
        {properties.map((p) => (
          <Link key={p._id} to={`/property/${p._id}`} className="flex gap-3 p-3 bg-surface-card border border-surface-border rounded-xl hover:border-yellow-500/30 transition-all group">
            <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-light">
              {p.coverImage?.url ? (
                <img src={p.coverImage.url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><span className="text-xl">🏠</span></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white line-clamp-1 group-hover:text-yellow-400 transition-colors">{p.title}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={10} className="text-yellow-500" />
                <span className="text-xs text-gray-400 truncate">{p.location?.subCity}</span>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-sm font-bold text-yellow-400">{formatCurrency(p.pricing?.monthlyRent)}<span className="text-xs text-gray-500 font-normal">/mo</span></span>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="flex items-center gap-0.5"><Bed size={10} />{p.details?.bedrooms}</span>
                  <span className="flex items-center gap-0.5"><Bath size={10} />{p.details?.bathrooms}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SimilarProperties;
