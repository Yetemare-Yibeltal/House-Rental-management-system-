import { useState } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { formatDate, formatTimeAgo } from '../../utils/formatters';
import landlordApi from '../../api/landlordApi';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import toast from 'react-hot-toast';

const SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

const BookingRequestCard = ({ booking, onUpdate }) => {
  const { tenant, property, preferredDate, preferredTime, tenantMessage, status, createdAt } = booking;
  const [showApprove, setShowApprove] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [approve, setApprove] = useState({
    confirmedDate: preferredDate ? String(preferredDate).split('T')[0] : '',
    confirmedTime: preferredTime || '',
    landlordResponse: '',
  });

  const handleApprove = async () => {
    if (!approve.confirmedDate || !approve.confirmedTime) { toast.error('Select a confirmed date and time'); return; }
    setLoading(true);
    try {
      await landlordApi.approveBooking(booking._id, approve);
      toast.success('Booking approved. The tenant has been notified.');
      setShowApprove(false);
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve booking');
    } finally { setLoading(false); }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      await landlordApi.declineBooking(booking._id, { reason: declineReason });
      toast.success('Booking declined. The tenant has been notified.');
      setShowDecline(false);
      onUpdate?.();
    } catch {
      toast.error('Failed to decline booking');
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-5 hover:border-yellow-500/20 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar src={tenant?.avatar?.url} firstName={tenant?.firstName} lastName={tenant?.lastName} size="md" />
          <div><p className="text-sm font-bold text-white">{tenant?.firstName} {tenant?.lastName}</p><p className="text-xs text-gray-400">{formatTimeAgo(createdAt)}</p></div>
        </div>
        <Badge status={status} size="sm" dot />
      </div>

      <div className="bg-surface-light rounded-xl p-3 mb-4"><p className="text-xs text-gray-500 mb-0.5">Property</p><p className="text-sm font-semibold text-white">{property?.title}</p></div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2"><Calendar size={14} className="text-yellow-400" /><div><p className="text-[10px] text-gray-500">Preferred Date</p><p className="text-xs font-semibold text-white">{formatDate(preferredDate)}</p></div></div>
        <div className="flex items-center gap-2"><Clock size={14} className="text-yellow-400" /><div><p className="text-[10px] text-gray-500">Preferred Time</p><p className="text-xs font-semibold text-white">{preferredTime || 'N/A'}</p></div></div>
      </div>

      {tenantMessage && (
        <div className="flex gap-2 p-3 bg-surface-light rounded-xl mb-4">
          <MessageSquare size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-300 leading-relaxed">{tenantMessage}</p>
        </div>
      )}

      {status === 'pending' && (
        <div className="flex gap-2">
          <Button variant="success" size="sm" fullWidth icon={CheckCircle} onClick={() => setShowApprove(true)}>Approve</Button>
          <Button variant="danger" size="sm" fullWidth icon={XCircle} onClick={() => setShowDecline(true)}>Decline</Button>
        </div>
      )}

      <Modal isOpen={showApprove} onClose={() => setShowApprove(false)} title="Approve Visit" size="sm">
        <div className="space-y-4">
          <Input label="Confirmed Date" type="date" value={approve.confirmedDate} onChange={(e) => setApprove((p) => ({ ...p, confirmedDate: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Confirmed Time</label>
            <div className="grid grid-cols-3 gap-1.5">
              {SLOTS.map((s) => (
                <button key={s} type="button" onClick={() => setApprove((p) => ({ ...p, confirmedTime: s }))} className={`py-1.5 text-xs rounded-lg border transition-all ${approve.confirmedTime === s ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' : 'border-surface-border text-gray-400 hover:border-yellow-500/30'}`}>{s}</button>
              ))}
            </div>
          </div>
          <Textarea label="Message to tenant (optional)" placeholder="Any instructions for the visit..." value={approve.landlordResponse} onChange={(e) => setApprove((p) => ({ ...p, landlordResponse: e.target.value }))} rows={3} />
          <div className="flex gap-2">
            <Button variant="outline" fullWidth onClick={() => setShowApprove(false)}>Cancel</Button>
            <Button variant="gold" fullWidth loading={loading} onClick={handleApprove} icon={CheckCircle}>Confirm</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDecline} onClose={() => setShowDecline(false)} title="Decline Visit" size="sm">
        <div className="space-y-4">
          <Textarea label="Reason (optional)" placeholder="e.g. Property already booked for that date..." value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} rows={3} />
          <div className="flex gap-2">
            <Button variant="outline" fullWidth onClick={() => setShowDecline(false)}>Cancel</Button>
            <Button variant="danger" fullWidth loading={loading} onClick={handleDecline} icon={XCircle}>Decline</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookingRequestCard;
