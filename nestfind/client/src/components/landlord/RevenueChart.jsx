import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCompactCurrency } from '../../utils/formatters';

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((p) => <p key={p.name} className="text-sm font-bold" style={{ color: p.color }}>{formatCompactCurrency(p.value)}</p>)}
    </div>
  );
};

const TYPES = [{ key: 'area', label: 'Area' }, { key: 'bar', label: 'Bar' }, { key: 'line', label: 'Line' }];

const RevenueChart = ({ data = [], height = 250 }) => {
  const [type, setType] = useState('area');
  const rows = data.map((d) => ({ ...d, monthName: d.monthName || d.month || '' }));
  const margin = { top: 5, right: 10, left: 0, bottom: 5 };

  const axes = [
    <CartesianGrid key="g" strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />,
    <XAxis key="x" dataKey="monthName" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />,
    <YAxis key="y" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatCompactCurrency} width={64} />,
    <Tooltip key="t" content={<Tip />} />,
  ];

  const chart =
    type === 'bar' ? (
      <BarChart data={rows} margin={margin}>{axes}<Bar dataKey="revenue" fill="#c9a84c" radius={[4, 4, 0, 0]} /></BarChart>
    ) : type === 'line' ? (
      <LineChart data={rows} margin={margin}>{axes}<Line type="monotone" dataKey="revenue" stroke="#c9a84c" strokeWidth={2} dot={{ fill: '#c9a84c', r: 4 }} activeDot={{ r: 6 }} /></LineChart>
    ) : (
      <AreaChart data={rows} margin={margin}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
          </linearGradient>
        </defs>
        {axes}
        <Area type="monotone" dataKey="revenue" stroke="#c9a84c" strokeWidth={2} fill="url(#revGrad)" />
      </AreaChart>
    );

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {TYPES.map(({ key, label }) => (
          <button key={key} onClick={() => setType(key)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${type === key ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'text-gray-500 hover:text-gray-300'}`}>{label}</button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={height}>{chart}</ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
