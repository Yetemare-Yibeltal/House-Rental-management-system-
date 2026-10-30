import Input from '../ui/Input';
import Select from '../ui/Select';
import { FURNISHED_OPTIONS } from '../../utils/constants';

const PropertyFormStep3 = ({ values, errors = {}, onChange }) => (
  <div className="space-y-5">
    <div>
      <h3 className="text-lg font-bold text-white font-display mb-1">Property Details</h3>
      <p className="text-sm text-gray-400">Specifications and features</p>
    </div>
    <div className="grid grid-cols-3 gap-3">
      <Input label="Bedrooms" type="number" min="0" max="20" value={values.details.bedrooms} onChange={(e) => onChange('details.bedrooms', e.target.value)} error={errors['details.bedrooms']} hint="0 = Studio" required />
      <Input label="Bathrooms" type="number" min="1" max="20" value={values.details.bathrooms} onChange={(e) => onChange('details.bathrooms', e.target.value)} error={errors['details.bathrooms']} required />
      <Input label="Area (sqm)" type="number" min="10" value={values.details.area} onChange={(e) => onChange('details.area', e.target.value)} error={errors['details.area']} required />
    </div>
    <Select label="Furnishing Status" value={values.details.furnished} onChange={(e) => onChange('details.furnished', e.target.value)} options={FURNISHED_OPTIONS} placeholder="Select furnishing" error={errors['details.furnished']} required />
    <div className="grid grid-cols-3 gap-3">
      <Input label="Floor Number" type="number" min="0" value={values.details.floorNumber} onChange={(e) => onChange('details.floorNumber', e.target.value)} placeholder="0 = Ground" />
      <Input label="Total Floors" type="number" min="1" value={values.details.totalFloors} onChange={(e) => onChange('details.totalFloors', e.target.value)} />
      <Input label="Parking Spaces" type="number" min="0" value={values.details.parkingSpaces} onChange={(e) => onChange('details.parkingSpaces', e.target.value)} />
    </div>
    <Input label="Year Built" type="number" min="1900" max={new Date().getFullYear()} value={values.details.yearBuilt} onChange={(e) => onChange('details.yearBuilt', e.target.value)} placeholder="e.g. 2018" />
  </div>
);

export default PropertyFormStep3;
