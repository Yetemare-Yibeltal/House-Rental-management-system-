import { useState } from 'react';
import { FileText, CheckCircle, Clock, AlertTriangle, Bot, PenLine } from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { useAI } from '../../hooks/useAI';
import toast from 'react-hot-toast';

const SignatureTile = ({ label, signature }) => (
  <div className={`p-3 rounded-xl border ${signature?.isSigned ? 'bg-green-500/5 border-green-500/20' : 'bg-surface-light border-surface-border'}`}>
    <div className="flex items-center gap-1.5 mb-1">
      {signature?.isSigned ? <CheckCircle size={12} className="text-green-400" /> : <Clock size={12} className="text-yellow-400" />}
      <span className="text-xs font-semibold text-gray-300">{label}</span>
    </div>
    <p className="text-xs text-gray-400">{signature?.isSigned ? `Signed ${formatDate(signature.signedAt)}` : 'Pending signature'}</p>
  </div>
);

const ContractViewer = ({ contract, onSign, canSign = false }) => {
  const [showSign, setShowSign] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [explaining, setExplaining] = useState(false);
  const [signature, setSignature] = useState('');
  const [signing, setSigning] = useState(false);
  const { explainLease } = useAI();

  if (!contract) return null;
  const { terms, status, contractNumber, tenant, property, landlordSignature, tenantSignature } = contract;

  const handleExplain = async () => {
    setShowExplain(true);
    if (explanation) return;
    setExplaining(true);
    const result = await explainLease(contract._id);
    if (result?.success) setExplanation(result);
    else toast.error('Failed to generate explanation');
    setExplaining(false);
  };

  const handleSign = async () => {
    if (!signature.trim()) { toast.error('Please type your full name as signature'); return; }
    setSigning(true);
    try {
      await onSign({ signatureData: signature });
      setShowSign(false);
    } catch {
      toast.error('Failed to sign contract');
    } finally {
      setSigning(false);
    }
  };

  const keyTerms = [
    { label: 'Monthly Rent', value: formatCurrency(terms?.monthlyRent) },
    { label: 'Security Deposit', value: formatCurrency(terms?.securityDeposit) },
    { label: 'Start Date', value: formatDate(terms?.startDate) },
    { label: 'End Date', value: formatDate(terms?.endDate) },
    { label: 'Payment Due', value: `Day ${terms?.paymentDueDay} of month` },
    { label: 'Notice Period', value: `${terms?.noticePeriodDays || 30} days` },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center"><FileText size={18} className="text-yellow-400" /></div>
            <div><h3 className="text-sm font-bold text-white">Lease Contract</h3><p className="text-xs text-gray-400">#{contractNumber}</p></div>
          </div>
          <Badge status={status} size="sm" dot />
        </div>

        <div className="bg-surface-light rounded-xl p-3 mb-4">
          <p className="text-xs text-gray-500 mb-0.5">Property</p>
          <p className="text-sm font-semibold text-white">{property?.title}</p>
          <p className="text-xs text-gray-400">{property?.location?.address}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {keyTerms.map(({ label, value }) => (
            <div key={label} className="bg-surface-light rounded-xl p-3"><p className="text-[10px] text-gray-500">{label}</p><p className="text-xs font-semibold text-white mt-0.5">{value}</p></div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Pets', value: terms?.petPolicy },
            { label: 'Smoking', value: terms?.smokingPolicy },
            { label: 'Utilities', value: terms?.utilityBillsIncluded ? 'Included' : 'Excluded' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-2 bg-surface-light rounded-xl"><p className="text-[10px] text-gray-500">{label}</p><p className="text-xs font-medium text-white capitalize mt-0.5">{value?.replace(/_/g, ' ') || 'N/A'}</p></div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SignatureTile label="Landlord" signature={landlordSignature} />
          <SignatureTile label="Tenant" signature={tenantSignature} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" fullWidth icon={Bot} onClick={handleExplain}>Explain with AI</Button>
        {canSign && !tenantSignature?.isSigned && (
          <Button variant="gold" fullWidth icon={PenLine} onClick={() => setShowSign(true)}>Sign Contract</Button>
        )}
      </div>

      <Modal isOpen={showExplain} onClose={() => setShowExplain(false)} title="AI Lease Explainer" size="lg">
        {explaining ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-yellow-500/30 border-t-yellow-500 animate-spin" />
            <p className="text-gray-400 text-sm">Analyzing your lease contract...</p>
          </div>
        ) : explanation ? (
          <div className="space-y-4">
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-sm font-semibold text-yellow-400 mb-2">Summary</p>
              <p className="text-sm text-gray-300 leading-relaxed">{explanation.summary}</p>
            </div>
            {explanation.keyObligations?.tenant?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-white mb-2">Your Key Obligations</p>
                <ul className="space-y-1.5">
                  {explanation.keyObligations.tenant.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300"><span className="text-yellow-400 mt-0.5">•</span>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {explanation.riskyClause?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5"><AlertTriangle size={14} className="text-orange-400" /> Watch Out For</p>
                <div className="space-y-2">
                  {explanation.riskyClause.map((risk, i) => (
                    <div key={i} className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3">
                      <p className="text-xs font-semibold text-orange-400 mb-1">{risk.clause}</p>
                      <p className="text-xs text-gray-400">{risk.risk}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {explanation.overallAssessment && (
              <div className="bg-surface-light rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 mb-1">Overall Assessment</p>
                <p className="text-sm text-gray-300">{explanation.overallAssessment}</p>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal isOpen={showSign} onClose={() => setShowSign(false)} title="Sign Contract" size="sm">
        <div className="space-y-4">
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
            <p className="text-xs text-yellow-400 font-semibold mb-1">⚠️ Legal Notice</p>
            <p className="text-xs text-gray-400 leading-relaxed">By signing this contract, you agree to all the terms and conditions of the lease agreement. This signature is legally binding.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Type your full name as signature *</label>
            <input type="text" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder={`${tenant?.firstName || ''} ${tenant?.lastName || ''}`.trim()}
              className="w-full bg-surface-light border border-surface-border text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-500" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" fullWidth onClick={() => setShowSign(false)}>Cancel</Button>
            <Button variant="gold" fullWidth loading={signing} onClick={handleSign} icon={PenLine}>Sign Now</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ContractViewer;
