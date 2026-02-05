
import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockSupabase';
import { ServiceRequest, RequestStatus, Priority } from '../../types';
import { Icons } from '../../components/Icons';
import { useNavigate } from 'react-router-dom';

const AdminRequests: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'condo' | 'resident'>('condo');
  const [filterText, setFilterText] = useState('');
  const navigate = useNavigate();

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const data = await db.getServiceRequests();
    setRequests(data);
    if (showLoading) setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = requests.filter(r => {
    const isRightScope = activeTab === 'condo' ? !r.is_private : r.is_private;
    const matchesText = 
      r.protocol.toLowerCase().includes(filterText.toLowerCase()) ||
      r.condo_name.toLowerCase().includes(filterText.toLowerCase()) ||
      r.type.toLowerCase().includes(filterText.toLowerCase());
    return isRightScope && matchesText;
  });

  // Contador de alertas: O Admin precisa agir se for Novo (Triagem) OU Aprovado pelo Cliente (P/ Iniciar)
  const condoTriageCount = requests.filter(r => !r.is_private && (r.status === RequestStatus.PENDING_APPROVAL || r.status === RequestStatus.BUDGET_APPROVED)).length;
  const residentTriageCount = requests.filter(r => r.is_private && (r.status === RequestStatus.PENDING_APPROVAL || r.status === RequestStatus.BUDGET_APPROVED)).length;

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.COMPLETED: return 'bg-emerald-500 text-white border-emerald-600';
      case RequestStatus.IN_PROGRESS: return 'bg-brand-accent text-brand-blue border-brand-accent';
      case RequestStatus.BUDGET_APPROVED: return 'bg-emerald-100 text-emerald-800 border-emerald-500 ring-2 ring-emerald-500/20 font-black';
      case RequestStatus.PENDING_APPROVAL: return 'bg-orange-50 text-orange-700 border-orange-200';
      case RequestStatus.WAITING_BUDGET_APPROVAL: return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case RequestStatus.CANCELED: return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.HIGH: return 'text-red-500';
      case Priority.MEDIUM: return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-black font-heading text-slate-900 tracking-tight">Central de <span className="text-brand-accent">Chamados</span></h1>
           <p className="text-slate-500 text-sm font-medium">Gestão global de todas as solicitações técnicas.</p>
        </div>
        <div className="flex bg-slate-200 p-1.5 rounded-2xl border border-slate-300 w-full md:w-fit shadow-sm">
           <button 
             onClick={() => setActiveTab('condo')} 
             className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'condo' ? 'bg-brand-blue text-white shadow-premium' : 'text-slate-600 hover:text-slate-900'}`}
           >
              Áreas Comuns
              {condoTriageCount > 0 && (
                <span className="bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {condoTriageCount}
                </span>
              )}
           </button>
           <button 
             onClick={() => setActiveTab('resident')} 
             className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'resident' ? 'bg-brand-blue text-white shadow-premium' : 'text-slate-600 hover:text-slate-900'}`}
           >
              Moradores
              {residentTriageCount > 0 && (
                <span className="bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {residentTriageCount}
                </span>
              )}
           </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30">
          <div className="relative max-w-md group">
             <Icons.Search className="absolute left-5 top-4.5 text-slate-300 group-focus-within:text-brand-accent transition-colors" size={20} />
             <input type="text" placeholder="Protocolo, Condomínio ou Serviço..." className="w-full pl-14 pr-6 py-4.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent font-bold text-slate-700 text-sm shadow-sm" value={filterText} onChange={e => setFilterText(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
              <tr>
                <th className="px-8 py-6">Identificação / Localização</th>
                <th className="px-8 py-6">Atendimento</th>
                <th className="px-8 py-6">Status / Atualização</th>
                <th className="px-8 py-6">Investimento</th>
                <th className="px-8 py-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && requests.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center"><Icons.Loader className="animate-spin inline text-brand-accent" size={32} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center font-black uppercase text-slate-400 italic">Nenhum chamado localizado.</td></tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id} className={`hover:bg-slate-50/50 cursor-pointer group transition-colors ${r.status === RequestStatus.BUDGET_APPROVED ? 'bg-emerald-50/30' : ''}`} onClick={() => navigate(`/admin/request/${r.id}`)}>
                    <td className="px-8 py-6">
                      <p className="text-[11px] font-black text-brand-blue mb-1.5 uppercase tracking-wider">#{r.protocol}</p>
                      <p className="text-[10px] text-slate-900 font-black uppercase tracking-tight flex items-center gap-1.5">
                        <Icons.Building size={12} className="text-brand-accent" /> {r.condo_name}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-slate-900 text-sm mb-1">{r.type}</p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                        {r.unit_info ? `Unidade ${r.unit_info}` : 'Infraestrutura Comum'}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm w-fit ${getStatusColor(r.status)}`}>
                          {r.status === RequestStatus.BUDGET_APPROVED ? 'Aprovado (Iniciar)' : r.status}
                        </span>
                        <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 ml-1">
                           <Icons.Clock size={10} className="text-brand-accent" />
                           {new Date(r.updated_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                        {r.budget_value ? (
                          <span className="text-xs font-black text-slate-900 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                             R$ {r.budget_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-slate-300 uppercase italic">Pendente</span>
                        )}
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all border ${r.status === RequestStatus.BUDGET_APPROVED ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-slate-50 text-slate-400 border-slate-100 group-hover:bg-brand-blue group-hover:text-white'}`}>
                          <Icons.ArrowRight size={18} />
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRequests;
