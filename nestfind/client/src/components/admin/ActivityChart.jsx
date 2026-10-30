import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCompactCurrency } from '../../utils/formatters';

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-300">{p.name}:</span>
          <span className="font-semibold text-white">{p.name === 'Revenue' ? formatCompactCurrency(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

const SERIES = [
  { key: 'users', name: 'Users', color: '#3b82f6', id: 'usersGrad' },
  { key: 'properties', name: 'Properties', color: '#10b981', id: 'propsGrad' },
  { key: 'revenue', name: 'Revenue', color: '#c9a84c', id: 'revGrad' },
];

const ActivityChart = ({ data = [], height = 280 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
      <defs>
        {SERIES.map((s) => (
          <linearGradient key={s.id} id={s.id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={s.color} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
      <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
      <Tooltip content={<Tip />} />
      <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af', paddingTop: '16px' }} />
      {SERIES.map((s) => (
        <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} fill={`url(#${s.id})`} dot={false} />
      ))}
    </AreaChart>
  </ResponsiveContainer>
);

export default ActivityChart;
