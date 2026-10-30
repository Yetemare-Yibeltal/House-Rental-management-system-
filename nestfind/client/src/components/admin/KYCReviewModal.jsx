import { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import adminApi from '../../api/adminApi';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import Avatar from '../ui/Avatar';
import { formatDate, formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const MESSAGES = {
  approve: 'KYC approved',
  reject: 'KYC rejected',
  request_resubmission: 'Resubmission requested',
};

const KYCReviewModal = ({ isOpen, onClose, kyc, onUpdate }) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!kyc) return null;
  const { user, personalInfo, primaryDocumentType, documents, submittedAt, status } = kyc;
  const reviewable = status === 'submitted' || status === 'under_review';

  const decide = async (action) => {
    setLoading(true);
    try {
      await adminApi.processKYC(kyc._id, { action, notes });
      toast.success(MESSAGES[action]);
      setNotes('');
      onUpdate?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process KYC');
    } finally {
      setLoading(false);
    }
  };

  const info = [
    { label: 'Full Name', value: personalInfo?.fullName },
    { label: 'Date of Birth', value: personalInfo?.dateOfBirth ? formatDate(personalInfo.dateOfBirth) : null },
    { label: 'Nationality', value: personalInfo?.nationality },
    { label: 'Document Type', value: primaryDocumentType?.replace(/_/g, ' ') },
  ];

  const docs = documents ? Object.entries(documents).filter(([, d]) => d?.url) : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="KYC Review" size="lg">
      <div className="space-y-5">
        <div className="flex items-center gap-4 p-4 bg-surface-light rounded-xl">
          <Avatar src={user?.avatar?.url} firstName={user?.firstName} lastName={user?.lastName} size="lg" />
          <div>
            <p className="font-bold text-white">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
            {submittedAt && <p className="text-xs text-gray-500 mt-0.5">Submitted: {formatDateTime(submittedAt)}</p>}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-white mb-3">Personal Information</p>
          <div className="grid grid-cols-2 gap-3">
            {info.map(({ label, value }) => (
              <div key={label} className="bg-surface-card border border-surface-border rounded-xl p-3">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-medium text-white capitalize mt-0.5">{value || 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>

        {docs.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-white mb-3">Uploaded Documents</p>
            <div className="grid grid-cols-2 gap-3">
              {docs.map(([key, doc]) => (
                <div key={key} className="relative group rounded-xl overflow-hidden border border-surface-border bg-surface-light">
                  <img src={doc.url} alt={key} className="w-full h-36 object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-white/20 text-white text-xs rounded-lg">
                      <Eye size={12} /> View Full
                    </a>
                  </div>
                  <p className="p-2 text-xs font-medium text-white capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {reviewable ? (
          <>
            <Textarea label="Admin Notes (optional)" placeholder="Notes for the user or internal reference..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            <div className="flex gap-2">
              <Button variant="danger" fullWidth icon={XCircle} loading={loading} onClick={() => decide('reject')}>Reject</Button>
              <Button variant="outline" fullWidth icon={AlertCircle} loading={loading} onClick={() => decide('request_resubmission')}>Resubmit</Button>
              <Button variant="success" fullWidth icon={CheckCircle} loading={loading} onClick={() => decide('approve')}>Approve</Button>
            </div>
          </>
        ) : (
          <p className="text-center text-sm text-gray-400 py-3">
            This application has already been <span className={`font-semibold ${status === 'approved' ? 'text-green-400' : 'text-red-400'}`}>{status}</span>.
          </p>
        )}
      </div>
    </Modal>
  );
};

export default KYCReviewModal;
