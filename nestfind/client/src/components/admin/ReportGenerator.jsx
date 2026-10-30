import { useState } from 'react';
import { Download, BarChart2 } from 'lucide-react';
import adminApi from '../../api/adminApi';
import Select from '../ui/Select';
import Input from '../ui/Input';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

const REPORT_TYPES = [
  { value: 'revenue', label: 'Revenue Report' },
  { value: 'platform', label: 'Platform Overview' },
];

const isoDate = (d) => d.toISOString().split('T')[0];

const ReportGenerator = () => {
  const [form, setForm] = useState({
    reportType: 'revenue',
    startDate: isoDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    endDate: isoDate(new Date()),
  });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const generate = async () => {
    setLoading(true);
    try {
      const res = form.reportType === 'platform'
        ? await adminApi.getDashboard()
        : await adminApi.getRevenueStats({ startDate: form.startDate, endDate: form.endDate });
      setReport(res.data.data);
      toast.success('Report generated');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nestfind-${form.reportType}-${form.startDate}-to-${form.endDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Select label="Report Type" value={form.reportType} onChange={(e) => set('reportType', e.target.value)} options={REPORT_TYPES} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Start Date" type="date" value={form.startDate} max={form.endDate} onChange={(e) => set('startDate', e.target.value)} />
        <Input label="End Date" type="date" value={form.endDate} min={form.startDate} max={isoDate(new Date())} onChange={(e) => set('endDate', e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button variant="gold" fullWidth loading={loading} icon={BarChart2} onClick={generate}>Generate</Button>
        {report && <Button variant="outline" icon={Download} onClick={download}>JSON</Button>}
      </div>
      {report && (
        <div className="bg-surface-light border border-surface-border rounded-xl p-3">
          <p className="text-xs font-semibold text-gray-400 mb-2">Preview</p>
          <pre className="text-xs text-gray-300 overflow-auto max-h-48 font-mono">{JSON.stringify(report, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;
