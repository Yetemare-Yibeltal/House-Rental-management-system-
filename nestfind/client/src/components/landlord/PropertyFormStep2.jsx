import { MapPin } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { SUB_CITIES } from '../../utils/constants';

const PropertyFormStep2 = ({ values, errors = {}, onChange }) => (
  <div className="space-y-5">
    <div>
      <h3 className="text-lg font-bold text-white font-display mb-1">Location</h3>
      <p className="text-sm text-gray-400">Where is your property located?</p>
    </div>
    <Select label="Sub-City" value={values.location.subCity} onChange={(e) => onChange('location.subCity', e.target.value)} options={SUB_CITIES.map((s) => ({ value: s, label: s }))} placeholder="Select sub-city" error={errors['location.subCity']} required />
    <Input label="Full Address" placeholder="e.g. Near CMC Roundabout, Bole Road, House No. 123" value={values.location.address} onChange={(e) => onChange('location.address', e.target.value)} error={errors['location.address']} icon={MapPin} required />
    <div className="grid grid-cols-2 gap-3">
      <Input label="City" value={values.location.city} onChange={(e) => onChange('location.city', e.target.value)} placeholder="Addis Ababa" />
      <Input label="Region" value={values.location.region} onChange={(e) => onChange('location.region', e.target.value)} placeholder="Addis Ababa" />
    </div>
    <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
      <p className="text-xs text-yellow-400 font-semibold mb-1">📍 Location Tip</p>
      <p className="text-xs text-gray-400">Include nearby landmarks to help tenants find the property easily.</p>
    </div>
  </div>
);

export default PropertyFormStep2;
