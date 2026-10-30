import Input from '../ui/Input';
import FileUpload from '../ui/FileUpload';

const PropertyFormStep5 = ({ values, onChange, onImagesChange, imagePreviews = [], onRemoveImage }) => (
  <div className="space-y-5">
    <div>
      <h3 className="text-lg font-bold text-white font-display mb-1">Lease Terms & Photos</h3>
      <p className="text-sm text-gray-400">Final details and property photos</p>
    </div>
    <div className="grid grid-cols-3 gap-3">
      <Input label="Min Lease (months)" type="number" min="1" value={values.leaseTerms.minimumLease} onChange={(e) => onChange('leaseTerms.minimumLease', e.target.value)} />
      <Input label="Notice Period (days)" type="number" min="0" value={values.leaseTerms.noticePeriod} onChange={(e) => onChange('leaseTerms.noticePeriod', e.target.value)} />
      <Input label="Available From" type="date" min={new Date().toISOString().split('T')[0]} value={values.leaseTerms.availableFrom} onChange={(e) => onChange('leaseTerms.availableFrom', e.target.value)} />
    </div>

    <FileUpload label="Property Photos (up to 10)" hint="Upload clear, well-lit photos. More photos bring more inquiries." accept="image/*" multiple maxFiles={10} maxSize={5 * 1024 * 1024} onFilesChange={onImagesChange} />

    {imagePreviews.length > 0 && (
      <div>
        <p className="text-xs text-gray-400 mb-2">{imagePreviews.length} photo(s) selected. The first is the cover.</p>
        <div className="grid grid-cols-5 gap-2">
          {imagePreviews.map((img, i) => (
            <div key={`${img.name}-${i}`} className="relative group rounded-xl overflow-hidden h-16">
              <img src={img.preview} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => onRemoveImage?.(i)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">Remove</button>
              {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-yellow-500 text-black text-[9px] font-bold text-center py-0.5">COVER</span>}
            </div>
          ))}
        </div>
      </div>
    )}

    <div className="p-4 bg-surface-light rounded-xl border border-surface-border">
      <p className="text-xs text-gray-400 leading-relaxed">
        🔍 Your listing is reviewed by our team before it goes live, usually within <strong className="text-white">24 hours</strong>. Our AI fraud detection also scans each listing.
      </p>
    </div>
  </div>
);

export default PropertyFormStep5;
