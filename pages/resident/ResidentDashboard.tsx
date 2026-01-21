
// Adicionando importação do React para resolver erro de namespace
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, ServiceRequest, RequestStatus } from '../../types';
import { db } from '../../services/mockSupabase';
import { Icons } from '../../components/Icons';

interface Props {
  user: User;
}

const ServiceCard: React.FC<{ req: ServiceRequest }> = ({ req }) => {
  const navigate = useNavigate();
  
  const getStatusInfo = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING_APPROVAL: return { color: 'bg-orange-500', label: 'Em Análise', progress: 20 };
      case RequestStatus.OPEN: return { color: 'bg-blue-500', label: 'Aberto', progress: 40 };
      case RequestStatus.WAITING_BUDGET_APPROVAL: return { color: 'bg-indigo-500', label: 'Orçamento Pendente', progress: 50 };
      case RequestStatus.BUDGET_APPROVED: return { color: 'bg-brand-blue', label: 'Iniciando', progress: 60 };
      case RequestStatus.IN_PROGRESS: return { color: 'bg-brand-accent', label: 'Em Execução', progress: 75 };
      case RequestStatus.COMPLETED: return { color: 'bg-green-500', label: 'Concluído', progress: 100 };
      case RequestStatus.CANCELED: return { color: 'bg-red-500', label: 'Cancelado', progress: 0 };
      default: return { color: 'bg-gray-400', label: status, progress: 0 };
    }
  };

  const info = getStatusInfo(req.status);

  return (
    <div 
      onClick={() => navigate(`/resident/request/${req.id}`)}
      className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 hover:shadow-premium hover:-translate-y-2 transition-all duration-500 cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-8">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all shadow-inner">
           <Icons.Wrench size={28} />
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-white ${info.color} shadow-lg shadow-current/20`}>
            {info.label}
          </span>
          {req.is_private && req.budget_value && req.status !== RequestStatus.PENDING_APPROVAL && (
            <span className="text-[10px] font-black text-slate-900 bg-brand-accent/10 px-3 py-1 rounded-full">
              R$ {req.budget_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            #{req.protocol}
          </p>
          <h3 className="font-black text-gray-900 text-2xl tracking-tighter group-hover:text-brand-accent transition-colors">{req.type}</h3>
        </div>
        
        <p className="text-sm text-gray-500 line-clamp-2 font-medium leading-relaxed">{req.description}</p>
        
        <div className="pt-4">
           <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">
              <span>Progresso Técnico</span>
              <span>{info.progress}%</span>
           </div>
           <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${info.color}`} 
                style={{ width: `${info.progress}%` }}
              ></div>
           </div>
        </div>
      </div>
    </div>
  );
};

const ResidentDashboard: React.FC<Props> = ({ user }) => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getServiceRequests(user.id, user.role).then(data => {
      setRequests(data);
      setLoading(false);
    });
  }, [user]);

  const privateRequests = requests.filter(r => r.is_private);
  const condoRequests = requests.filter(r => !r.is_private);

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      <div className="bg-brand-blue rounded-[3.5rem] p-12 md:p-16 text-white shadow-premium relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-accent rounded-full blur-[160px] opacity-10"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
           <div className="text-center md:text-left space-y-6">
              <div className="inline-flex gap-3 items-center">
                 <span className="w-3 h-3 rounded-full bg-brand-accent animate-pulse"></span>
                 <p className="text-brand-accent font-black uppercase text-[10px] tracking-[0.4em]">Conexão Ativa: {user.condo_name}</p>
              </div>
              <h1 className="text-5xl md:text-7xl font-black font-heading leading-none tracking-tighter">
                Olá, <span className="gradient-text italic">{user.name.split(' ')[0]}</span>.
              </h1>
              <div className="flex gap-4 justify-center md:justify-start">
                 <div className="bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-xs font-bold">Unidade {user.apartment}</div>
                 <div className="bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-xs font-bold">Bloco {user.block}</div>
              </div>
           </div>

           <Link to="/resident/new-request" className="relative group overflow-hidden bg-brand-accent text-brand-blue px-12 py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-glow transition-all hover:scale-105 active:scale-95">
              <span className="relative z-10 flex items-center gap-3">Solicitar Novo Reparo <Icons.Plus size={18} /></span>
              <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform"></div>
           </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center"><Icons.Loader className="animate-spin inline text-brand-blue" size={40} /></div>
      ) : (
        <div className="space-y-24">
          <section>
            <div className="flex items-center gap-6 mb-12">
               <div className="p-4 bg-brand-blue text-brand-accent rounded-[1.5rem] shadow-glow"><Icons.Home size={24} /></div>
               <div>
                  <h2 className="text-3xl font-black text-brand-blue font-heading italic tracking-tighter">Minha Residência</h2>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Atendimentos exclusivos na sua unidade</p>
               </div>
               <div className="h-px flex-1 bg-slate-100"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {privateRequests.length === 0 ? (
                <div className="col-span-full py-24 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200 text-center space-y-6">
                   <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <Icons.Inbox size={40} className="text-slate-200" />
                   </div>
                   <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Nenhuma solicitação ativa</p>
                   <Link to="/resident/new-request" className="inline-block text-brand-accent font-black hover:underline uppercase text-[10px] tracking-[0.2em]">Iniciar primeiro chamado</Link>
                </div>
              ) : (
                privateRequests.map(r => <ServiceCard key={r.id} req={r} />)
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-6 mb-12">
               <div className="p-4 bg-brand-blue text-brand-accent rounded-[1.5rem] shadow-glow"><Icons.Building2 size={24} /></div>
               <div>
                  <h2 className="text-3xl font-black text-brand-blue font-heading italic tracking-tighter">Áreas Comuns</h2>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Monitoramento técnico do edifício</p>
               </div>
               <div className="h-px flex-1 bg-slate-100"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {condoRequests.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">
                   Nenhuma ocorrência relatada nas áreas comuns do prédio.
                </div>
              ) : (
                condoRequests.map(r => <ServiceCard key={r.id} req={r} />)
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default ResidentDashboard;
