
import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockSupabase';
import { ServiceRequest, RequestStatus, User } from '../../types';
import { Icons } from '../../components/Icons';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [reqData, userData] = await Promise.all([
          db.getServiceRequests(),
          db.getUsers()
        ]);
        setRequests(reqData);
        setUsers(userData);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const stats = [
    { label: 'Total Geral', value: requests.length, icon: Icons.List, color: 'text-slate-400' },
    { label: 'Triagem / Pendentes', value: requests.filter(r => r.status === RequestStatus.PENDING_APPROVAL).length, icon: Icons.Clock, color: 'text-orange-500' },
    { label: 'Orçamentos em Análise', value: requests.filter(r => r.status === RequestStatus.WAITING_BUDGET_APPROVAL).length, icon: Icons.TrendingUp, color: 'text-indigo-500' },
    { label: 'Executando Agora', value: requests.filter(r => r.status === RequestStatus.IN_PROGRESS).length, icon: Icons.Zap, color: 'text-brand-accent' },
  ];

  const chartData = [
    { name: 'Seg', v: 400 }, { name: 'Ter', v: 700 }, { name: 'Qua', v: 600 },
    { name: 'Qui', v: 1100 }, { name: 'Sex', v: 950 }, { name: 'Sab', v: 500 }, { name: 'Dom', v: 300 }
  ];

  const pieData = [
    { name: 'Elétrica', value: 400 },
    { name: 'Hidráulica', value: 300 },
    { name: 'Civil', value: 200 },
    { name: 'T.I.', value: 150 },
  ];

  const PIE_COLORS = ['#38BDF8', '#0F172A', '#10B981', '#6366F1'];

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <p className="text-brand-accent text-[10px] font-black uppercase tracking-[0.4em] mb-2">Central de Operações CON</p>
          <h1 className="text-4xl md:text-5xl font-black font-heading text-slate-900 tracking-tighter">Visão Estratégica</h1>
        </div>
        <div className="flex gap-4">
           <button className="bg-white border border-slate-200 text-slate-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-3">
              <Icons.Download size={18} /> Relatório Mensal
           </button>
           <button onClick={() => navigate('/admin/requests')} className="bg-brand-blue text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-premium hover:bg-black transition-all flex items-center gap-3">
              Gerenciar Chamados <Icons.ArrowRight size={18} className="text-brand-accent" />
           </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-premium transition-all duration-500">
            <div className={`p-4 bg-slate-50 rounded-2xl w-fit mb-8 group-hover:bg-brand-blue transition-all ${stat.color}`}>
              <stat.icon size={26} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-5xl font-black text-slate-900 mt-2 tracking-tighter">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 bg-brand-blue p-10 md:p-14 rounded-[4rem] shadow-premium text-white relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
           <div className="flex justify-between items-center mb-12 relative z-10">
              <h3 className="font-black text-lg uppercase tracking-widest flex items-center gap-4 italic">
                <Icons.Activity size={24} className="text-brand-accent" /> Fluxo de Atendimento
              </h3>
              <div className="flex gap-2">
                 <div className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-bold">Últimos 7 dias</div>
              </div>
           </div>
           
           <div className="h-80 relative z-10">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 900}} />
                  <YAxis hide />
                  <Tooltip contentStyle={{borderRadius: '24px', border: 'none', background: '#020617', color: '#fff'}} />
                  <Area type="monotone" dataKey="v" stroke="#38BDF8" strokeWidth={5} fillOpacity={1} fill="url(#colorV)" />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Security and Integrity Panel */}
        <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center gap-4 mb-10">
             <div className="p-3 bg-brand-accent/10 rounded-xl text-brand-accent">
                <Icons.ShieldCheck size={24} />
             </div>
             <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Segurança do Sistema</h3>
          </div>
          
          <div className="space-y-6 flex-1">
             <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base de Usuários</span>
                   <span className="text-xs font-black text-slate-900">{users.length}</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                   <div className="bg-brand-accent h-full w-[70%]"></div>
                </div>
             </div>

             <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acessos Pendentes</span>
                   <span className="text-xs font-black text-red-500">{users.filter(u => !u.is_validated).length}</span>
                </div>
                <button 
                  onClick={() => navigate('/admin/users')}
                  className="mt-4 text-[9px] font-black text-brand-blue uppercase tracking-widest flex items-center gap-2 hover:text-brand-accent transition-colors"
                >
                  Revisar Validações <Icons.ArrowRight size={12} />
                </button>
             </div>

             <div className="p-6 bg-brand-blue rounded-3xl border border-white/5 text-white">
                <div className="flex items-center gap-3 mb-4">
                   <Icons.Lock size={16} className="text-brand-accent" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Admin Autenticado</span>
                </div>
                <p className="text-[10px] text-blue-200 leading-relaxed">
                   O sistema está utilizando Supabase Auth com políticas de RLS ativas para garantir que dados de orçamentos e mensagens sejam sigilosos.
                </p>
             </div>
          </div>
          
          <div className="mt-10 pt-10 border-t border-slate-50 flex flex-col items-center">
             <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Infraestrutura Cloud</span>
             <div className="flex gap-4 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                <img src="https://supabase.com/dashboard/img/supabase-logo.svg" className="h-4" alt="Supabase" />
                <span className="font-black text-[10px] text-slate-900">PostgreSQL</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
