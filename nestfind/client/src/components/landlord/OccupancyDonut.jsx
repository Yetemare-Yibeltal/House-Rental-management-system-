import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const Tip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-white font-semibold">{payload[0].name}: {payload[0].value}</p>
    </div>
  );
};

const OccupancyDonut = ({ occupied = 0, vacant = 0, total = 0 }) => {
  const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const data = [
    { name: 'Occupied', value: occupied, color: '#c9a84c' },
    { name: 'Vacant', value: vacant, color: '#2a2b3a' },
  ];

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
            {data.map((d) => <Cell key={d.name} fill={d.color} strokeWidth={0} />)}
          </Pie>
          <Tooltip content={<Tip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ bottom: 28 }}>
        <span className="text-2xl font-bold text-yellow-400">{rate}%</span>
        <span className="text-xs text-gray-400">Occupied</span>
      </div>
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-500" /><span className="text-xs text-gray-400">Occupied ({occupied})</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-surface-border" /><span className="text-xs text-gray-400">Vacant ({vacant})</span></div>
      </div>
    </div>
  );
};

export default OccupancyDonut;
