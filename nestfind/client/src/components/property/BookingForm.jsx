import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useAuthStore } from '../../context/AuthContext';
import tenantApi from '../../api/tenantApi';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import toast from 'react-hot-toast';

const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
const EMPTY = { preferredDate: '', preferredTime: '', alternativeDate: '', alternativeTime: '', tenantMessage: '' };

const BookingForm = ({ propertyId, landlordName, onSuccess }) => {
  const { isAuthenticated, isTenant } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const today = new Date().toISOString().split('T')[0];
  const max = new Date();
  max.setMonth(max.getMonth() + 3);
  const maxDate = max.toISOString().split('T')[0];

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isTenant) { toast.error('Only tenants can book property visits'); return; }
    if (!form.preferredDate || !form.preferredTime) { toast.error('Please select a preferred date and time'); return; }
    setLoading(true);
    try {
      await tenantApi.createBooking({ propertyId, ...form });
      toast.success('Visit request sent! The landlord will respond within 24 hours.');
      setForm(EMPTY);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit booking request');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6 text-center">
        <p className="text-gray-400 text-sm mb-4">Login to book a visit to this property</p>
        <Link to="/login" className="block w-full py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold text-sm rounded-xl">Login to Book</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface-card border border-surface-border rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-base font-bold text-white font-display">Schedule a Visit</h3>
        <p className="text-xs text-gray-400">with {landlordName}</p>
      </div>

      <Input label="Preferred Visit Date" type="date" min={today} max={maxDate} value={form.preferredDate} onChange={(e) => set('preferredDate', e.target.value)} icon={Calendar} required />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Time <span className="text-yellow-400">*</span></label>
        <div className="grid grid-cols-3 gap-1.5">
          {TIME_SLOTS.map((slot) => (
            <button key={slot} type="button" onClick={() => set('preferredTime', slot)}
              className={`py-1.5 text-xs rounded-lg border transition-all ${form.preferredTime === slot ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' : 'border-surface-border text-gray-400 hover:border-yellow-500/30 hover:text-yellow-400'}`}>
              {slot}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input label="Alt. Date" type="date" min={today} max={maxDate} value={form.alternativeDate} onChange={(e) => set('alternativeDate', e.target.value)} size="sm" />
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Alt. Time</label>
          <select value={form.alternativeTime} onChange={(e) => set('alternativeTime', e.target.value)} className="w-full bg-surface-card border border-surface-border text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-500">
            <option value="">Select time</option>
            {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <Textarea label="Message to landlord (optional)" placeholder="Introduce yourself or ask any questions..." value={form.tenantMessage} onChange={(e) => set('tenantMessage', e.target.value)} rows={3} maxLength={500} showCount />

      <Button type="submit" variant="gold" fullWidth loading={loading}>Send Visit Request</Button>
    </form>
  );
};

export default BookingForm;
