import { useState } from 'react';
import { Bot, Wrench, AlertTriangle, Upload } from 'lucide-react';
import tenantApi from '../../api/tenantApi';
import { MAINTENANCE_CATEGORIES, URGENCY_LEVELS } from '../../utils/constants';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import FileUpload from '../ui/FileUpload';
import toast from 'react-hot-toast';

const EMPTY = { title: '', description: '', category: '', urgency: 'medium' };

const MaintenanceForm = ({ onSuccess }) => {
  const [form, setForm] = useState(EMPTY);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleDiagnose = async () => {
    if (!form.description || form.description.length < 20) {
      toast.error('Please describe the issue in more detail (20+ characters)');
      return;
    }
    setDiagnosing(true);
    try {
      const response = await tenantApi.diagnoseMaintenance({ title: form.title, description: form.description });
      const result = response.data.data;
      setDiagnosis(result);
      if (result.category && !form.category) set('category', result.category);
      if (result.urgency) set('urgency', result.urgency);
      toast.success('AI diagnosis complete');
    } catch {
      toast.error('AI diagnosis failed. Please select a category manually.');
    } finally {
      setDiagnosing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      photos.forEach((p) => data.append('photos', p));
      await tenantApi.createMaintenanceRequest(data);
      toast.success('Maintenance request submitted. Your landlord has been notified.');
      setForm(EMPTY);
      setPhotos([]);
      setDiagnosis(null);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Issue Title" placeholder="e.g. Water leaking from bathroom ceiling" value={form.title} onChange={(e) => set('title', e.target.value)} icon={Wrench} required />

      <div>
        <Textarea label="Describe the Issue" placeholder="When did it start, how bad is it, what have you tried..." value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} maxLength={2000} showCount required />
        <Button type="button" variant="outline" size="sm" icon={Bot} loading={diagnosing} onClick={handleDiagnose} className="mt-2">Diagnose with AI</Button>
      </div>

      {diagnosis && (
        <div className={`p-4 rounded-xl border ${diagnosis.isEmergency ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
          <div className="flex items-center gap-2 mb-2">
            {diagnosis.isEmergency && <AlertTriangle size={14} className="text-red-400" />}
            <p className="text-sm font-semibold text-yellow-400">AI Diagnosis — {diagnosis.urgencyInfo?.label || diagnosis.urgency}</p>
          </div>
          <p className="text-sm text-gray-300 mb-2">{diagnosis.diagnosis}</p>
          {diagnosis.immediateSteps?.length > 0 && (
            <ul className="space-y-0.5">
              {diagnosis.immediateSteps.map((step, i) => (
                <li key={i} className="text-xs text-gray-300 flex gap-1.5"><span className="text-yellow-400">→</span>{step}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Select label="Category" value={form.category} onChange={(e) => set('category', e.target.value)} options={MAINTENANCE_CATEGORIES} placeholder="Select category" required />
        <Select label="Urgency" value={form.urgency} onChange={(e) => set('urgency', e.target.value)} options={URGENCY_LEVELS} />
      </div>

      <FileUpload label="Photos (optional)" hint="Drag and drop or click to upload photos of the issue" accept="image/*" multiple maxFiles={5} onFilesChange={setPhotos} />

      <Button type="submit" variant="gold" fullWidth loading={loading} icon={Upload}>Submit Maintenance Request</Button>
    </form>
  );
};

export default MaintenanceForm;
