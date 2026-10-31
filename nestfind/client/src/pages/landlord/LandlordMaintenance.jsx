import { useState, useEffect, useCallback } from 'react';
import { Wrench, Calendar } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import SEO from '../../components/common/SEO';
import landlordApi from '../../api/landlordApi';
import { formatDate, formatTimeAgo } from '../../utils/formatters';
import toast from 'react-hot-toast';

const FILTERS = ['all', 'pending', 'in_progress', 'resolved', 'closed'];
const URGENCY = { emergency: 'red', high: 'orange', medium: 'gold', low: 'green' };
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const LandlordMaintenance = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ status: 'in_progress', landlordResponse: '', scheduledDate: '', estimatedCost: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter === 'all' ? {} : { status: filter };
      const res = await landlordApi.getMaintenanceRequests(params);
      setRequests(res.data.data || []);
    } catch {
      toast.error('Failed to load maintenance requests');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const open = (req) => {
    setSelected(req);
    setForm({
      status: req.status === 'pending' ? 'in_progress' : req.status,
      landlordResponse: req.landlordResponse || '',
      scheduledDate: req.scheduledDate ? String(req.scheduledDate).split('T')[0] : '',
      estimatedCost: req.estimatedCost ?? '',
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await landlordApi.updateMaintenanceRequest(selected._id, {
        status: form.status,
        landlordResponse: form.landlordResponse,
        scheduledDate: form.scheduledDate || undefined,
        estimatedCost: form.estimatedCost === '' ? undefined : Number(form.estimatedCost),
      });
      toast.success('Request updated. The tenant has been notified.');
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update request');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <SEO title="Maintenance" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white font-display">Maintenance Requests</h1>
        <p className="text-gray-400 text-sm mt-1">Issues reported by your tenants</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-semibold rounded-full border capitalize transition-all ${filter === f ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' : 'border-surface-border text-gray-400 hover:border-yellow-500/30'}`}>
            {f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? <PageLoader text="Loading requests..." /> : requests.length === 0 ? (
        <EmptyState emoji="🔧" title="No maintenance requests" description="Requests from your tenants will appear here." />
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r._id} className="bg-surface-card border border-surface-border rounded-2xl p-5 hover:border-yellow-500/20 transition-all">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center"><Wrench size={18} className="text-orange-400" /></div>
                  <div>
                    <p className="text-sm font-bold text-white">{r.title}</p>
                    <p className="text-xs text-gray-400">{r.tenant?.firstName} {r.tenant?.lastName} · {r.property?.title}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={URGENCY[r.urgency] || 'gold'} size="xs" dot>{r.urgency}</Badge>
                  <Badge status={r.status} size="xs" />
                </div>
              </div>
              <p className="text-sm text-gray-300 line-clamp-2 mb-3">{r.description}</p>
              {r.aiDiagnosis?.diagnosis && (
                <div className="p-2.5 bg-yellow-500/5 border border-yellow-500/20 rounded-xl mb-3">
                  <p className="text-[10px] font-semibold text-yellow-400 mb-0.5">AI diagnosis</p>
                  <p className="text-xs text-gray-300 line-clamp-2">{r.aiDiagnosis.diagnosis}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-gray-500"><Calendar size={11} />{formatTimeAgo(r.createdAt)}{r.scheduledDate && ` · scheduled ${formatDate(r.scheduledDate)}`}</span>
                <Button size="xs" variant="outline" onClick={() => open(r)}>Manage</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Manage Request" size="md">
        {selected && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold text-white">{selected.title}</p>
              <p className="text-sm text-gray-300 mt-1">{selected.description}</p>
            </div>
            {selected.photos?.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {selected.photos.map((p, i) => <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"><img src={p.url} alt="" className="w-full h-20 object-cover rounded-xl" /></a>)}
              </div>
            )}
            <Select label="Status" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} options={STATUS_OPTIONS} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Scheduled date" type="date" value={form.scheduledDate} onChange={(e) => setForm((p) => ({ ...p, scheduledDate: e.target.value }))} />
              <Input label="Estimated cost (ETB)" type="number" min="0" value={form.estimatedCost} onChange={(e) => setForm((p) => ({ ...p, estimatedCost: e.target.value }))} />
            </div>
            <Textarea label="Response to tenant" value={form.landlordResponse} onChange={(e) => setForm((p) => ({ ...p, landlordResponse: e.target.value }))} rows={3} placeholder="e.g. A plumber will visit on Thursday morning." />
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setSelected(null)}>Cancel</Button>
              <Button variant="gold" fullWidth loading={saving} onClick={save}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default LandlordMaintenance;
