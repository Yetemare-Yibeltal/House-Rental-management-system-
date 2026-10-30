import Input from '../ui/Input';
import Select from '../ui/Select';
import { AMENITIES } from '../../utils/constants';

const PropertyFormStep4 = ({ values, errors = {}, onChange, onToggleAmenity }) => (
  <div className="space-y-5">
    <div>
      <h3 className="text-lg font-bold text-white font-display mb-1">Pricing & Amenities</h3>
      <p className="text-sm text-gray-400">Set your price and select available amenities</p>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <Input label="Monthly Rent (ETB)" type="number" min="0" value={values.pricing.monthlyRent} onChange={(e) => onChange('pricing.monthlyRent', e.target.value)} error={errors['pricing.monthlyRent']} hint="Try the AI Rent Advisor for a suggestion" required />
      <Input label="Security Deposit (ETB)" type="number" min="0" value={values.pricing.securityDeposit} onChange={(e) => onChange('pricing.securityDeposit', e.target.value)} hint="Usually 1-2 months rent" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <Select label="Utility Bills" value={values.pricing.utilityBills} onChange={(e) => onChange('pricing.utilityBills', e.target.value)}
        options={[{ value: 'included', label: 'Included in rent' }, { value: 'excluded', label: 'Tenant pays separately' }, { value: 'negotiable', label: 'Negotiable' }]} />
      <div className="flex items-end pb-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={!!values.pricing.negotiable} onChange={(e) => onChange('pricing.negotiable', e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm text-gray-300">Price is negotiable</span>
        </label>
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-3">Available Amenities</label>
      <div className="flex flex-wrap gap-2">
        {AMENITIES.map(({ key, label, icon }) => (
          <button key={key} type="button" onClick={() => onToggleAmenity(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${values.amenities[key] ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' : 'border-surface-border text-gray-400 hover:border-yellow-500/30 hover:text-yellow-400'}`}>
            <span>{icon}</span>{label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default PropertyFormStep4;
