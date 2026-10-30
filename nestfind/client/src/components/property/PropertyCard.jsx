import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MapPin, Bed, Bath, Maximize, CheckCircle, Eye } from 'lucide-react';
import { useAuthStore } from '../../context/AuthContext';
import { useAIStore } from '../../context/AIContext';
import tenantApi from '../../api/tenantApi';
import { formatCurrency } from '../../utils/formatters';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { RatingDisplay } from '../ui/StarRating';
import toast from 'react-hot-toast';

const PropertyCard = ({ property, onSaveToggle, isSaved: initialSaved = false, showLandlord = false, compact = false }) => {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);
  const { isAuthenticated, isTenant } = useAuthStore();
  const { recordInteraction } = useAIStore();

  const { _id, title, location, pricing, details, propertyType, coverImage, images, isVerified, isFeatured, stats, landlord, ai } = property;
  const coverUrl = coverImage?.url || images?.[0]?.url || null;

  const handleSaveToggle = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to save properties'); return; }
    if (!isTenant) { toast.error('Only tenants can save properties'); return; }
    setSaving(true);
    try {
      const response = await tenantApi.toggleSaveProperty({ propertyId: _id });
      const newSaved = response.data.data.saved;
      setIsSaved(newSaved);
      onSaveToggle?.(_id, newSaved);
      toast.success(newSaved ? 'Saved to favourites' : 'Removed from favourites');
      if (newSaved) recordInteraction(_id, 'saved');
    } catch {
      toast.error('Failed to update saved status');
    } finally {
      setSaving(false);
    }
  }, [_id, isAuthenticated, isTenant, onSaveToggle, recordInteraction]);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group bg-surface-card border border-surface-border rounded-2xl overflow-hidden hover:border-yellow-500/30 hover:shadow-card transition-all duration-300"
    >
      <Link to={`/property/${_id}`} onClick={() => recordInteraction(_id, 'viewed')} className="block">
        <div className="relative overflow-hidden" style={{ height: compact ? 160 : 200 }}>
          {coverUrl ? (
            <img src={coverUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-surface-light flex items-center justify-center"><span className="text-4xl">🏠</span></div>
          )}

          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {isFeatured && <Badge variant="gold" size="xs">⭐ Featured</Badge>}
            {isVerified && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full">
                <CheckCircle size={10} className="text-green-400" />
                <span className="text-[10px] font-semibold text-green-400">Verified</span>
              </div>
            )}
            {ai?.matchScore > 0 && <Badge variant="purple" size="xs">🤖 {ai.matchScore}% Match</Badge>}
          </div>

          <button
            onClick={handleSaveToggle}
            disabled={saving}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-sm ${isSaved ? 'bg-red-500 text-white' : 'bg-black/40 text-white hover:bg-red-500'}`}
          >
            <Heart size={14} className={isSaved ? 'fill-white' : ''} />
          </button>

          {stats?.totalViews > 0 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/60 rounded-lg">
              <Eye size={10} className="text-gray-300" />
              <span className="text-[10px] text-gray-300">{stats.totalViews}</span>
            </div>
          )}

          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-0.5 bg-black/60 text-white text-[10px] rounded-full capitalize">{propertyType}</span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-1 mb-1.5">
            <MapPin size={11} className="text-yellow-500 flex-shrink-0" />
            <span className="text-xs text-gray-400 truncate">{location?.subCity}, {location?.city || 'Addis Ababa'}</span>
          </div>

          <h3 className="font-semibold text-white text-sm leading-snug mb-2 line-clamp-2 group-hover:text-yellow-400 transition-colors">{title}</h3>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1 text-xs text-gray-400"><Bed size={12} /><span>{details?.bedrooms === 0 ? 'Studio' : `${details?.bedrooms}bd`}</span></div>
            <div className="flex items-center gap-1 text-xs text-gray-400"><Bath size={12} /><span>{details?.bathrooms}ba</span></div>
            {details?.area && <div className="flex items-center gap-1 text-xs text-gray-400"><Maximize size={12} /><span>{details.area}m²</span></div>}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-base font-bold text-yellow-400">{formatCurrency(pricing?.monthlyRent)}</span>
              <span className="text-xs text-gray-500">/mo</span>
            </div>
            {stats?.averageRating > 0 && <RatingDisplay value={stats.averageRating} count={stats.totalReviews} />}
          </div>

          {showLandlord && landlord && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-border">
              <Avatar src={landlord.avatar?.url} firstName={landlord.firstName} lastName={landlord.lastName} size="xs" />
              <span className="text-xs text-gray-400">{landlord.firstName} {landlord.lastName}</span>
              {landlord.isKYCVerified && <CheckCircle size={11} className="text-green-400 ml-auto" />}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default PropertyCard;
