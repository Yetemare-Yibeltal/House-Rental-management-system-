import { CheckCircle, Printer } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import Button from '../ui/Button';
import GradientText from '../ui/GradientText';

const PaymentReceipt = ({ payment }) => {
  if (!payment) return null;

  const { receiptNumber, amount, netAmount, platformCommission, paymentType, paymentMethod, status, paidAt, transactionId, paymentPeriod, property, payer, payee } = payment;

  const rows = [
    { label: 'Payment Type', value: paymentType?.replace(/_/g, ' ') },
    { label: 'Payment Method', value: paymentMethod?.replace(/_/g, ' ') },
    { label: 'Property', value: property?.title },
    { label: 'Period', value: paymentPeriod?.periodLabel },
    { label: 'Date & Time', value: paidAt ? formatDateTime(paidAt) : null },
    { label: 'Transaction ID', value: transactionId, mono: true },
    { label: 'Status', value: status, green: true },
  ].filter((r) => r.value);

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-400/10 border-b border-yellow-500/20 p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={28} className="text-green-400" />
          </div>
          <h2 className="text-xl font-bold font-display"><GradientText>Payment Receipt</GradientText></h2>
          <p className="text-2xl font-bold text-white mt-2">{formatCurrency(amount)}</p>
          {receiptNumber && <p className="text-xs text-gray-400 mt-1">Receipt #{receiptNumber}</p>}
        </div>

        <div className="p-5 space-y-3">
          {rows.map(({ label, value, mono, green }) => (
            <div key={label} className="flex justify-between items-start gap-4">
              <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
              <span className={`text-xs text-right capitalize ${mono ? 'font-mono text-gray-300 break-all normal-case' : green ? 'text-green-400 font-semibold' : 'text-gray-200 font-medium'}`}>{value}</span>
            </div>
          ))}

          <div className="border-t border-surface-border my-3" />

          <div className="space-y-1.5">
            <div className="flex justify-between"><span className="text-xs text-gray-500">Gross Amount</span><span className="text-xs text-gray-300">{formatCurrency(amount)}</span></div>
            {platformCommission > 0 && (
              <div className="flex justify-between"><span className="text-xs text-gray-500">Platform Fee</span><span className="text-xs text-red-400">-{formatCurrency(platformCommission)}</span></div>
            )}
            <div className="flex justify-between font-bold"><span className="text-sm text-white">Net Amount</span><span className="text-sm text-yellow-400">{formatCurrency(netAmount || amount)}</span></div>
          </div>

          <div className="border-t border-surface-border pt-3 grid grid-cols-2 gap-3">
            <div><p className="text-[10px] text-gray-500 mb-1">Paid by</p><p className="text-xs font-semibold text-white">{payer?.firstName} {payer?.lastName}</p></div>
            <div><p className="text-[10px] text-gray-500 mb-1">Paid to</p><p className="text-xs font-semibold text-white">{payee?.firstName} {payee?.lastName}</p></div>
          </div>
        </div>

        <div className="border-t border-surface-border p-4 text-center">
          <p className="text-[10px] text-gray-500">This is an official NestFind payment receipt. Keep for your records.</p>
        </div>
      </div>

      <div className="mt-4">
        <Button variant="outline" fullWidth onClick={() => window.print()} icon={Printer}>Print Receipt</Button>
      </div>
    </div>
  );
};

export default PaymentReceipt;
