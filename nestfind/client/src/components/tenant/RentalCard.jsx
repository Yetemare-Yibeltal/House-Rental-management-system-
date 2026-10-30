import { Link } from 'react-router-dom';
import { Home, CreditCard, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate, formatDaysRemaining } from '../../utils/formatters';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';

const DAY = 1000 * 60 * 60 * 24;

const RentalCard = ({ rental }) => {
  const { _id, property, monthlyRent, startDate, endDate, status, nextPaymentDue, totalRentPaid, securityDeposit, paymentDueDay } = rental;

  const isOverdue = nextPaymentDue && new Date(nextPaymentDue) < new Date() && status === 'active';
  const totalDays = Math.max(Math.ceil((new Date(endDate) - new Date(startDate)) / DAY), 1);
  const elapsed = Math.ceil((Date.now() - new Date(startDate)) / DAY);
  const progress = Math.min(Math.max((elapsed / totalDays) * 100, 0), 100);

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden hover:border-yellow-500/30 transition-all">
      <div className="flex gap-4 p-5 border-b border-surface-border">
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface-light">
          {property?.coverImage?.url ? (
            <img src={property.coverImage.url} alt={property.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Home size={24} className="text-gray-500" /></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link to={`/property/${property?._id}`} className="text-sm font-bold text-white hover:text-yellow-400 transition-colors line-clamp-1">{property?.title}</Link>
              <p className="text-xs text-gray-400 mt-0.5">{property?.location?.subCity}, {property?.location?.city}</p>
            </div>
            <Badge status={status} size="xs" dot />
          </div>
          <p className="text-base font-bold text-yellow-400 mt-1">{formatCurrency(monthlyRent)}<span className="text-xs text-gray-400 font-normal">/mo</span></p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-light rounded-xl p-3"><p className="text-xs text-gray-500 mb-0.5">Start Date</p><p className="text-sm font-semibold text-white">{formatDate(startDate)}</p></div>
          <div className="bg-surface-light rounded-xl p-3"><p className="text-xs text-gray-500 mb-0.5">End Date</p><p className="text-sm font-semibold text-white">{formatDate(endDate)}</p></div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-gray-400">Lease Progress</span>
            <span className="text-xs font-semibold text-white">{formatDaysRemaining(endDate)}</span>
          </div>
          <ProgressBar value={progress} max={100} color={progress > 80 ? 'orange' : 'gold'} height={6} />
        </div>

        {status === 'active' && nextPaymentDue && (
          <div className={`flex items-center gap-3 p-3 rounded-xl ${isOverdue ? 'bg-red-500/10 border border-red-500/20' : 'bg-surface-light'}`}>
            {isOverdue ? <AlertCircle size={16} className="text-red-400 flex-shrink-0" /> : <CreditCard size={16} className="text-yellow-400 flex-shrink-0" />}
            <div className="flex-1">
              <p className={`text-xs font-semibold ${isOverdue ? 'text-red-400' : 'text-gray-300'}`}>{isOverdue ? 'Payment Overdue!' : 'Next Payment Due'}</p>
              <p className="text-xs text-gray-400">{formatDate(nextPaymentDue)}</p>
            </div>
            <p className="text-sm font-bold text-yellow-400">{formatCurrency(monthlyRent)}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-surface-light rounded-xl p-2"><p className="text-xs text-gray-500">Due Day</p><p className="text-sm font-bold text-white">{paymentDueDay}</p></div>
          <div className="bg-surface-light rounded-xl p-2"><p className="text-xs text-gray-500">Paid Total</p><p className="text-xs font-bold text-green-400">{formatCurrency(totalRentPaid || 0)}</p></div>
          <div className="bg-surface-light rounded-xl p-2"><p className="text-xs text-gray-500">Deposit</p><p className="text-xs font-bold text-white">{formatCurrency(securityDeposit || 0)}</p></div>
        </div>

        <div className="flex gap-2">
          <Link to={`/tenant/payments/make?rentalId=${_id}`} className="flex-1 text-center py-2.5 text-sm font-bold bg-gradient-to-r from-yellow-600 to-yellow-400 text-black rounded-xl hover:shadow-gold transition-all">Pay Rent</Link>
          <Link to="/tenant/contracts" className="flex-1 text-center py-2.5 text-sm font-medium border border-surface-border text-gray-300 rounded-xl hover:border-yellow-500/50 hover:text-yellow-400 transition-all">Contract</Link>
        </div>
      </div>
    </div>
  );
};

export default RentalCard;
