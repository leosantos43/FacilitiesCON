
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, ServiceRequest, RequestStatus } from '../../types';
import { db } from '../../services/mockSupabase';
import { Icons } from '../../components/Icons';

interface Props {
  user: User;
  showHistory?: boolean;
}

const SyndicDashboard: React.FC<Props> = ({ user, showHistory }) => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'common' | 'private' | 'finished'>('common');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const data = await db.getServiceRequests(user.id, user.role, user.condo_name);
    setRequests(data);
    setLoading(false);
  };

  const commonRequests = requests.filter(r => !r.is_private && r.status !== RequestStatus.COMPLETED && r.status !== RequestStatus.CANCELED);
  const privateRequests = requests.filter(r => r.is_private && r.status !== RequestStatus.COMPLETED && r.status !== RequestStatus.CANCELED);
  const finishedRequests = requests.filter(r => r.status === RequestStatus.COMPLETED);
  
  const commonPendingCount = requests.filter(r => !r.is_private && r.status === RequestStatus.PENDING_APPROVAL).length;
  const privatePendingCount = requests.filter(r => r.is_private && r.status === RequestStatus.PENDING_APPROVAL).length;

  const displayedRequests = activeTab === 'common' ? commonRequests : activeTab === 'private' ? privateRequests : finishedRequests;
  
  const totalCost = requests.filter(r => r.status === RequestStatus.COMPLETED).reduce((acc, r) => acc + (r.budget_value || 0), 0);

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black font-heading text-slate-900 tracking-tight">Gestão <span className="text-brand-accent">{user.condo_name}</span></h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1 font-medium flex items-center gap-2">
            <Icons.MapPin size={14} className="text-brand-accent" /> Painel Operacional Técnico
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           <Link to="/app/new-request" className="flex-1 md:flex-none justify-center items-center gap-2 bg-brand-accent hover:bg-brand-blue hover:text-white text-brand-blue px-6 py-4 rounded-2xl font-black transition shadow-glow flex text-[10px] uppercase tracking-widest">
              <Icons.PlusCircle size={18} /> Novo Chamado
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
         <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Total Investido (Mês)</p>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900">R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
         </div>
         <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Chamados em Aberto</p>
            <h3 className="text-2xl md:text-3xl font-black text-brand-accent">{requests.filter(r => r.status !== RequestStatus.COMPLETED && r.status !== RequestStatus.CANCELED).length}</h3>
         </div>
         <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Serviços Finalizados</p>
            <h3 className="text-2xl md:text-3xl font-black text-emerald-500">{finishedRequests.length}</h3>
         </div>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-fit border border-slate-200 shadow-sm overflow-x-auto custom-scrollbar">
         <button 
           onClick={() => setActiveTab('common')} 
           className={`px-6 md:px-10 py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'common' ? 'bg-white text-brand-blue shadow-premium' : 'text-slate-400 hover:text-slate-600'}`}
         >
           Áreas Comuns
           {commonPendingCount > 0 && (
             <span className="bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
               {commonPendingCount}
             </span>
           )}
         </button>
         <button 
           onClick={() => setActiveTab('private')} 
           className={`px-6 md:px-10 py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'private' ? 'bg-white text-brand-blue shadow-premium' : 'text-slate-400 hover:text-slate-600'}`}
         >
           Moradores
           {privatePendingCount > 0 && (
             <span className="bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
               {privatePendingCount}
             </span>
           )}
         </button>
         <button onClick={() => setActiveTab('finished')} className={`px-6 md:px-10 py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'finished' ? 'bg-emerald-500 text-white shadow-premium' : 'text-slate-400 hover:text-slate-600'}`}>Finalizados</button>
      </div>

      <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center"><Icons.Loader className="animate-spin inline text-brand-accent" size={32} /></div>
        ) : displayedRequests.length === 0 ? (
          <div className="p-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest italic">Nenhuma atividade nesta categoria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6">Protocolo</th>
                  <th className="px-8 py-6">Local e Serviço</th>
                  <th className="px-8 py-6">Status / Data</th>
                  <th className="px-8 py-6">Investimento</th>
                  <th className="px-8 py-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayedRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition cursor-pointer group" onClick={() => navigate(`/app/request/${req.id}`)}>
                    <td className="px-8 py-6 text-xs font-black text-brand-blue">#{req.protocol}</td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col">
                          <p className="font-black text-slate-900 text-sm mb-1">{req.type}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1.5">
                            <Icons.MapPin size={10} className="text-brand-accent" /> 
                            {req.unit_info ? `Unidade ${req.unit_info}` : 'Área Comum'}
                          </p>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col gap-2">
                          <span className={`w-fit text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                            req.status === RequestStatus.COMPLETED ? 'bg-green-50 text-green-700 border-green-100' : 
                            req.status === RequestStatus.CANCELED ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-blue-50 text-brand-blue border-blue-100'
                          }`}>
                            {req.status}
                          </span>
                          <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">
                             <Icons.Calendar size={10} className="text-brand-accent" />
                             {new Date(req.status === RequestStatus.COMPLETED ? req.updated_at : req.created_at).toLocaleDateString('pt-BR')}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col">
                          {req.budget_value ? (
                            <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                               R$ {req.budget_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-[9px] font-black text-slate-300 uppercase italic">Em análise</span>
                          )}
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-brand-accent group-hover:text-brand-blue transition-all border border-slate-100">
                          <Icons.ArrowRight size={18} />
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Fix: Added missing default export
export default SyndicDashboard;
