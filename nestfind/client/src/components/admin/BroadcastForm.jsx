import { useState } from 'react';
import { Send } from 'lucide-react';
import adminApi from '../../api/adminApi';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

const INITIAL = { subject: '', message: '', targetRole: 'all', channels: { email: true, inApp: true, sms: false } };

const CHANNELS = [
  { key: 'inApp', label: '🔔 In-App' },
  { key: 'email', label: '📧 Email' },
  { key: 'sms', label: '📱 SMS' },
];

const BroadcastForm = ({ onSuccess }) => {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const toggle = (key) => setForm((p) => ({ ...p, channels: { ...p.channels, [key]: !p.channels[key] } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) { toast.error('Subject and message are required'); return; }
    if (!Object.values(form.channels).some(Boolean)) { toast.error('Select at least one channel'); return; }
    setLoading(true);
    try {
      const res = await adminApi.sendBroadcast(form);
      toast.success(`Broadcast sent to ${res.data.data?.sent ?? 0} users`);
      setForm(INITIAL);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select label="Target Audience" value={form.targetRole} onChange={(e) => set('targetRole', e.target.value)}
        options={[{ value: 'all', label: 'All Users' }, { value: 'tenant', label: 'Tenants Only' }, { value: 'landlord', label: 'Landlords Only' }]} />
      <Input label="Subject" placeholder="Broadcast subject line..." value={form.subject} onChange={(e) => set('subject', e.target.value)} required />
      <Textarea label="Message" placeholder="Write your broadcast message..." value={form.message} onChange={(e) => set('message', e.target.value)} rows={5} maxLength={3000} showCount required />
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Send Via</label>
        <div className="flex gap-2 flex-wrap">
          {CHANNELS.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => toggle(key)}
              className={`px-3 py-2 rounded-xl text-sm border transition-all ${form.channels[key] ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' : 'border-surface-border text-gray-400 hover:border-yellow-500/20'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" variant="gold" fullWidth loading={loading} icon={Send}>Send Broadcast</Button>
    </form>
  );
};

export default BroadcastForm;
