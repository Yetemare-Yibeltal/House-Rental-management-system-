import { Users, Building2, CreditCard, FileText, Flag, Star, Bot, TrendingUp } from 'lucide-react';
import StatCard from '../ui/StatCard';

const PlatformStatsGrid = ({ stats, loading = false }) => {
  const cards = [
    { title: 'Total Users', value: stats?.users?.total || 0, icon: Users, iconColor: 'text-blue-400', iconBg: 'bg-blue-500/10 border-blue-500/20', description: `+${stats?.users?.newThisWeek || 0} this week` },
    { title: 'Total Properties', value: stats?.properties?.total || 0, icon: Building2, iconColor: 'text-yellow-400', iconBg: 'bg-yellow-500/10 border-yellow-500/20', description: `${stats?.properties?.active || 0} active listings` },
    { title: 'Platform Revenue', value: stats?.revenue?.totalCommission || 0, prefix: 'ETB ', icon: CreditCard, iconColor: 'text-green-400', iconBg: 'bg-green-500/10 border-green-500/20', description: `${stats?.revenue?.totalTransactions || 0} transactions` },
    { title: 'Active Rentals', value: stats?.rentals?.active || 0, icon: FileText, iconColor: 'text-purple-400', iconBg: 'bg-purple-500/10 border-purple-500/20', description: `${stats?.rentals?.total || 0} total rentals` },
    { title: 'Open Reports', value: stats?.reports?.pending || 0, icon: Flag, iconColor: 'text-red-400', iconBg: 'bg-red-500/10 border-red-500/20', description: `${stats?.reports?.total || 0} total reports` },
    { title: 'Pending KYC', value: stats?.users?.kycPending || 0, icon: Star, iconColor: 'text-orange-400', iconBg: 'bg-orange-500/10 border-orange-500/20', description: `${stats?.users?.kycApproved || 0} verified users` },
    { title: 'AI Conversations', value: stats?.ai?.totalConversations || 0, icon: Bot, iconColor: 'text-cyan-400', iconBg: 'bg-cyan-500/10 border-cyan-500/20', description: `${(stats?.ai?.totalTokensUsed || 0).toLocaleString()} tokens used` },
    { title: 'Gross Revenue', value: stats?.revenue?.totalGross || 0, prefix: 'ETB ', icon: TrendingUp, iconColor: 'text-yellow-400', iconBg: 'bg-yellow-500/10 border-yellow-500/20', description: 'All time' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard key={card.title} loading={loading} {...card} />
      ))}
    </div>
  );
};

export default PlatformStatsGrid;
