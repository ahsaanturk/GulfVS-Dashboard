
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { EmailLog, DashboardMetrics } from '../types';

interface AnalyticsProps {
  logs: EmailLog[];
  metrics: DashboardMetrics;
}

const AnalyticsPage: React.FC<AnalyticsProps> = ({ logs, metrics }) => {
  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map(d => ({ name: d, count: 0 }));
    
    const now = new Date();
    const startOfWeek = new Date(now).setDate(now.getDate() - now.getDay());
    const startOfWeekTimestamp = new Date(startOfWeek).setHours(0,0,0,0);
    
    logs.forEach(l => {
      if (l.dateSent >= startOfWeekTimestamp) {
        const dayIdx = new Date(l.dateSent).getDay();
        data[dayIdx].count += 1;
      }
    });
    return data;
  }, [logs]);

  const typeData = useMemo(() => {
    const firstTime = logs.filter(l => l.emailType === 'First-time').length;
    const followUp = logs.filter(l => l.emailType === 'Follow-up').length;
    if (firstTime === 0 && followUp === 0) return [];
    return [
      { name: 'First-time', value: firstTime },
      { name: 'Follow-up', value: followUp },
    ];
  }, [logs]);

  const hasLogs = logs.length > 0;

  const COLORS = ['#1a2d5a', '#f47c20'];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Market Intelligence</h1>
        <p className="text-gray-500 dark:text-gray-400 font-bold text-sm tracking-wide">Data visualization for GulfVS campaign managers</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Weekly Avg</p>
          <h3 className="text-3xl font-black text-primary dark:text-white mt-2">{(metrics.emailsWeek / 7).toFixed(1)}</h3>
          <div className="mt-4 flex items-center text-xs font-bold text-gray-400">Emails per day</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Interest Index</p>
          <h3 className="text-3xl font-black text-accent mt-2">{metrics.responseRate}%</h3>
          <div className="mt-4 flex items-center text-xs font-bold text-gray-400">Verified prospects</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Follow-ups</p>
          <h3 className="text-3xl font-black text-blue-500 mt-2">{logs.filter(l => l.emailType === 'Follow-up').length}</h3>
          <div className="mt-4 flex items-center text-xs font-bold text-gray-400">Total retargeting</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fresh Outreach</p>
          <h3 className="text-3xl font-black text-indigo-500 mt-2">{logs.filter(l => l.emailType === 'First-time').length}</h3>
          <div className="mt-4 flex items-center text-xs font-bold text-gray-400">Initial contacts</div>
        </div>
      </div>

      {!hasLogs ? (
        <div className="p-32 bg-white dark:bg-gray-800 rounded-[3rem] border-4 border-dashed border-gray-100 dark:border-gray-700 text-center">
          <div className="text-8xl mb-6 grayscale opacity-20">📊</div>
          <h3 className="text-3xl font-black text-gray-300 uppercase tracking-tighter">Waiting for Data Injection</h3>
          <p className="text-gray-400 mt-4 max-w-md mx-auto font-medium">Visualizations will automatically populate once you log your first email outreach campaign.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <section className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="font-black text-gray-900 dark:text-white mb-8 uppercase tracking-widest text-sm">Outreach Velocity (Weekly)</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f47c20" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f47c20" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                  <Area type="monotone" dataKey="count" stroke="#f47c20" strokeWidth={5} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="font-black text-gray-900 dark:text-white mb-8 uppercase tracking-widest text-sm">Campaign Distribution</h2>
            <div className="h-80 flex flex-col items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={10}
                    dataKey="value"
                    stroke="none"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-8 mt-6">
                {typeData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-lg shadow-sm" style={{ backgroundColor: COLORS[index] }}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
