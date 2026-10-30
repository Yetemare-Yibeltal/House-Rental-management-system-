import { Link } from 'react-router-dom';
import { Phone, Mail, CheckCircle, ChevronRight, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDaysRemaining } from '../../utils/formatters';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

const TenantRow = ({ tenantData }) => {
  const { tenant, property, rental } = tenantData;
  const overdue = rental?.nextPaymentDue && new Date(rental.nextPaymentDue) < new Date();

  return (
    <div className="flex items-center gap-4 p-4 bg-surface-card border border-surface-border rounded-2xl hover:border-yellow-500/20 transition-all group">
      <Avatar src={tenant?.avatar?.url} firstName={tenant?.firstName} lastName={tenant?.lastName} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-white truncate">{tenant?.firstName} {tenant?.lastName}</p>
          {tenant?.isKYCVerified && <CheckCircle size={12} className="text-green-400 flex-shrink-0" />}
          {overdue && <AlertCircle size={12} className="text-red-400 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {tenant?.phone && <a href={`tel:${tenant.phone}`} className="flex items-center gap-1 text-xs text-gray-400 hover:text-yellow-400"><Phone size={10} />{tenant.phone}</a>}
          {tenant?.email && <a href={`mailto:${tenant.email}`} className="flex items-center gap-1 text-xs text-gray-400 hover:text-yellow-400"><Mail size={10} />{tenant.email}</a>}
        </div>
      </div>
      <div className="hidden sm:block min-w-0 w-32"><p className="text-[10px] text-gray-500">Property</p><p className="text-xs font-medium text-white truncate">{property?.title}</p></div>
      <div className="hidden md:block text-center w-24"><p className="text-[10px] text-gray-500">Monthly Rent</p><p className="text-sm font-bold text-yellow-400">{formatCurrency(rental?.monthlyRent)}</p></div>
      <div className="hidden lg:block text-center w-24"><p className="text-[10px] text-gray-500">Lease Ends</p><p className="text-xs font-medium text-white">{formatDaysRemaining(rental?.endDate)}</p></div>
      <Badge status={rental?.status} size="xs" dot />
      <Link to="/landlord/messages" className="w-8 h-8 rounded-lg border border-surface-border text-gray-400 hover:border-yellow-500/50 hover:text-yellow-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
        <ChevronRight size={14} />
      </Link>
    </div>
  );
};

export default TenantRow;
