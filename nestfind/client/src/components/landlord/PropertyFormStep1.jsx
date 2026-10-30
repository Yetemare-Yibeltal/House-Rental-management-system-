import { Bot } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import { PROPERTY_TYPES } from '../../utils/constants';

const PropertyFormStep1 = ({ values, errors = {}, onChange, onGenerateDescription, aiGenerating }) => (
  <div className="space-y-5">
    <div>
      <h3 className="text-lg font-bold text-white font-display mb-1">Basic Information</h3>
      <p className="text-sm text-gray-400">Tell us about your property</p>
    </div>
    <Select label="Property Type" value={values.propertyType} onChange={(e) => onChange('propertyType', e.target.value)} options={PROPERTY_TYPES} placeholder="Select property type" error={errors.propertyType} required />
    <Input label="Listing Title" placeholder="e.g. Modern 2-Bedroom Apartment in Bole with Generator" value={values.title} onChange={(e) => onChange('title', e.target.value)} error={errors.title} hint="A clear title gets more views" required />
    <div>
      <Textarea label="Property Description" placeholder="Highlights, nearby landmarks, what makes it special..." value={values.description} onChange={(e) => onChange('description', e.target.value)} rows={5} maxLength={3000} showCount error={errors.description} required />
      <Button type="button" variant="outline" size="sm" icon={Bot} loading={aiGenerating} onClick={onGenerateDescription} disabled={!values.propertyType} className="mt-2">Generate with AI</Button>
    </div>
  </div>
);

export default PropertyFormStep1;
