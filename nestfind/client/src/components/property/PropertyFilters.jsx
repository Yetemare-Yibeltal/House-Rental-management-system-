import { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Select from '../ui/Select';
import Input from '../ui/Input';
import { PROPERTY_TYPES, SUB_CITIES, FURNISHED_OPTIONS, AMENITIES, SORT_OPTIONS } from '../../utils/constants';

const DEFAULT_FILTERS = {
  keyword: '', subCity: '', propertyType: '', minPrice: '', maxPrice: '',
  minBedrooms: '', furnished: '', amenities: [], sortBy: 'newest',
};

const PropertyFilters = ({ onFiltersChange, initialFilters = {}, compact = false }) => {
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [showAmenities, setShowAmenities] = useState(false);

  const activeCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'sortBy') return val !== 'newest';
    if (Array.isArray(val)) return val.length > 0;
    return val !== '' && val !== null && val !== undefined;
  }).length;

  const handleChange = (field, value) => {
    const updated = { ...filters, [field]: value };
    setFilters(updated);
    onFiltersChange?.(updated);
  };

  const toggleAmenity = (key) => {
    const current = filters.amenities || [];
    handleChange('amenities', current.includes(key) ? current.filter((k) => k !== key) : [...current, key]);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    onFiltersChange?.(DEFAULT_FILTERS);
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => compact && setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-yellow-400" />
          <span className="text-sm font-semibold text-white">Filters</span>
          {activeCount > 0 && (
            <span className="w-5 h-5 bg-yellow-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">{activeCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button onClick={(e) => { e.stopPropagation(); clearFilters(); }} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors">
              <X size={12} /> Clear
            </button>
          )}
          {compact && (isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />)}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t border-surface-border pt-3">
              <Input placeholder="Search by title or keyword..." value={filters.keyword} onChange={(e) => handleChange('keyword', e.target.value)} size="sm" />
              <div className="grid grid-cols-2 gap-2">
                <Select placeholder="Sub-City" value={filters.subCity} onChange={(e) => handleChange('subCity', e.target.value)} options={SUB_CITIES.map((s) => ({ value: s, label: s }))} size="sm" />
                <Select placeholder="Property Type" value={filters.propertyType} onChange={(e) => handleChange('propertyType', e.target.value)} options={PROPERTY_TYPES} size="sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Min Price (ETB)" type="number" value={filters.minPrice} onChange={(e) => handleChange('minPrice', e.target.value)} size="sm" />
                <Input placeholder="Max Price (ETB)" type="number" value={filters.maxPrice} onChange={(e) => handleChange('maxPrice', e.target.value)} size="sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select placeholder="Min Bedrooms" value={filters.minBedrooms} onChange={(e) => handleChange('minBedrooms', e.target.value)}
                  options={[{ value: '0', label: 'Studio' }, { value: '1', label: '1+ Bedroom' }, { value: '2', label: '2+ Bedrooms' }, { value: '3', label: '3+ Bedrooms' }, { value: '4', label: '4+ Bedrooms' }]} size="sm" />
                <Select placeholder="Furnished" value={filters.furnished} onChange={(e) => handleChange('furnished', e.target.value)} options={FURNISHED_OPTIONS} size="sm" />
              </div>
              <Select placeholder="Sort By" value={filters.sortBy} onChange={(e) => handleChange('sortBy', e.target.value)} options={SORT_OPTIONS} size="sm" />

              <button onClick={() => setShowAmenities(!showAmenities)} className="flex items-center justify-between w-full text-xs text-gray-400 hover:text-yellow-400 transition-colors">
                <span>Amenities {filters.amenities.length > 0 && `(${filters.amenities.length} selected)`}</span>
                {showAmenities ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {showAmenities && (
                <div className="flex flex-wrap gap-1.5">
                  {AMENITIES.map(({ key, label, icon }) => (
                    <button key={key} onClick={() => toggleAmenity(key)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${filters.amenities.includes(key) ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' : 'border-surface-border text-gray-400 hover:border-yellow-500/30 hover:text-yellow-400'}`}>
                      <span>{icon}</span>{label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PropertyFilters;
