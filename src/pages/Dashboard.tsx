import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { dashboard } from '../lib/api';
import { Users, Wrench, Clock, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const PIE_COLORS: Record<string, string> = {
  Pending: '#F59E0B', 'In Progress': '#3B82F6', Completed: '#10B981', Cancelled: '#EF4444',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats]     = useState<any>(null);
  const [byStatus, setByStatus] = useState<any[]>([]);
  const [byRegion, setByRegion] = useState<any[]>([]);
  const [monthly, setMonthly]   = useState<any[]>([]);

  useEffect(() => {
    dashboard.stats().then((r) => setStats(r.data));
    dashboard.byStatus().then((r) => setByStatus(r.data.data));
    dashboard.byRegion().then((r) => setByRegion(r.data.data.map((d: any) => ({ name: d._id, value: d.count }))));
    dashboard.monthlyInstallations().then((r) =>
      setMonthly(r.data.data.map((d: any) => ({
        name: `${MONTH_NAMES[d._id.month - 1]} ${d._id.year}`,
        total: d.count, completed: d.completed,
      })))
    );
  }, []);

  if (!stats) return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  const statCards = [
    { label: 'Total Customers',      value: stats.totalCustomers,      icon: Users,       color: 'text-blue-400',   sub: `+${stats.newCustomersThisMonth} this month` },
    { label: 'Total Installations',  value: stats.totalInstallations,  icon: Wrench,      color: 'text-purple-400', sub: `+${stats.newInstallationsThisMonth} this month` },
    { label: 'Pending',              value: stats.pendingInstallations, icon: Clock,       color: 'text-yellow-400', sub: 'Awaiting work' },
    { label: 'Completed',            value: stats.completedInstallations, icon: CheckCircle, color: 'text-green-400', sub: 'Successfully done' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Overview of customers and installations</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className="card">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-400">{label}</p>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-3xl font-bold text-white">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Monthly bar chart */}
          <div className="card lg:col-span-2">
            <h3 className="text-sm font-semibold text-white mb-4">Monthly Installations</h3>
            {monthly.length === 0 ? <p className="text-gray-500 text-sm">No data yet</p> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthly} barSize={18}>
                  <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#2C2C2E', border: '1px solid #3A3A3C', borderRadius: 8 }} />
                  <Bar dataKey="total" fill="#F59E0B" radius={[3,3,0,0]} name="Total" />
                  <Bar dataKey="completed" fill="#10B981" radius={[3,3,0,0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Status pie */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-4">Status Breakdown</h3>
            {byStatus.length === 0 ? <p className="text-gray-500 text-sm">No data yet</p> : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byStatus} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={70} label={false}>
                    {byStatus.map((entry) => (
                      <Cell key={entry._id} fill={PIE_COLORS[entry._id] || '#6B7280'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#2C2C2E', border: '1px solid #3A3A3C', borderRadius: 8 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} formatter={(v) => v} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Customers by region */}
        {byRegion.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-4">Customers by Region</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={byRegion} layout="vertical" barSize={14}>
                <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#2C2C2E', border: '1px solid #3A3A3C', borderRadius: 8 }} />
                <Bar dataKey="value" fill="#F59E0B" radius={[0,3,3,0]} name="Customers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent rows */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Recent Customers</h3>
              <button onClick={() => navigate('/customers')} className="text-xs text-primary hover:underline">View all</button>
            </div>
            <div className="space-y-3">
              {stats.recentCustomers.map((c: any) => (
                <div key={c._id} className="flex items-center gap-3 cursor-pointer hover:opacity-80" onClick={() => navigate(`/customers/${c._id}`)}>
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary text-xs font-bold">{c.fullName[0]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{c.fullName}</p>
                    <p className="text-xs text-gray-500">{c.region} · {c.phone || 'No phone'}</p>
                  </div>
                </div>
              ))}
              {stats.recentCustomers.length === 0 && <p className="text-gray-500 text-sm">No customers yet</p>}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Recent Installations</h3>
              <button onClick={() => navigate('/installations')} className="text-xs text-primary hover:underline">View all</button>
            </div>
            <div className="space-y-3">
              {stats.recentInstallations.map((i: any) => (
                <div key={i._id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{i.projectTitle || 'Untitled'}</p>
                    <p className="text-xs text-gray-500">{i.customer?.fullName} · {i.customer?.region}</p>
                  </div>
                  <StatusBadge status={i.status} />
                </div>
              ))}
              {stats.recentInstallations.length === 0 && <p className="text-gray-500 text-sm">No installations yet</p>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
