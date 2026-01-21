
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, ServiceRequest, UserRole, RequestStatus, Priority, Professional, CompanySettings } from '../../types';
import { db } from '../../services/mockSupabase';
import { Icons } from '../../components/Icons';
import { Chat } from '../../components/Chat';
import { compressImage } from '../../services/imageUtils';

interface Props {
  user: User;
}

const RequestDetails: React.FC<Props> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileBeforeRef = useRef<HTMLInputElement>(null);
  const fileAfterRef = useRef<HTMLInputElement>(null);
  
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  
  const [budgetData, setBudgetData] = useState({
    value: 0,
    is_hourly: false,
    estimated_hours: 1,
    description: '',
    profId: ''
  });

  const [technicalReport, setTechnicalReport] = useState('');
  const [photosBefore, setPhotosBefore] = useState<string[]>([]);
  const [photosAfter, setPhotosAfter] = useState<string[]>([]);
  const [showFinishModal, setShowFinishModal] = useState(false);

  const isAdmin = user.role === UserRole.ADMIN;
  const isSyndic = user.role === UserRole.SYNDIC;

  useEffect(() => {
    loadRequest();
    db.getProfessionals().then(data => setProfessionals(data.filter(p => p.active)));
    db.getCompanySettings().then(setCompany);
  }, [id]);

  const loadRequest = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const reqs = await db.getServiceRequests();
      const found = reqs.find(r => r.id === id);
      if (found) {
        setRequest(found);
        setBudgetData({
          value: found.budget_value || 0,
          is_hourly: found.is_hourly || false,
          estimated_hours: found.estimated_hours || 1,
          description: found.budget_description || '',
          profId: found.professional_id || ''
        });
        if (found.technical_report) setTechnicalReport(found.technical_report);
        if (found.photos_before) setPhotosBefore(found.photos_before || []);
        if (found.photos_after) setPhotosAfter(found.photos_after || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const files = e.target.files;
    if (!files) return;
    
    setActionLoading(true);
    try {
      const compressed = await Promise.all(
        Array.from(files).map(f => compressImage(f, 800, 0.7))
      );
      if (type === 'before') setPhotosBefore(prev => [...prev, ...compressed].slice(0, 3));
      else setPhotosAfter(prev => [...prev, ...compressed].slice(0, 3));
    } finally {
      setActionLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  const removePhoto = (index: number, type: 'before' | 'after') => {
    if (type === 'before') {
      setPhotosBefore(prev => prev.filter((_, i) => i !== index));
    } else {
      setPhotosAfter(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateStatus = async (newStatus: RequestStatus, title: string, desc: string, extra: any = {}) => {
    if (!request) return;
    setActionLoading(true);
    try {
      await db.updateServiceRequest(request.id, { 
        status: newStatus, 
        updated_at: new Date().toISOString(),
        ...extra 
      });

      await db.addTimelineEvent(request.id, title, desc);
      await db.sendRequestMessage(request.id, user, `SISTEMA: ${title}. ${desc}`);

      if (request.requester_id) {
        await db.createNotification(request.requester_id, title, desc, `/app/request/${request.id}`);
      }

      await loadRequest();
      setShowFinishModal(false);
    } catch (err: any) {
      console.error("Erro na atualização:", err);
      alert('ERRO: ' + (err.message || 'Falha na comunicação com o servidor.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendBudget = async () => {
    if (!budgetData.profId) return alert('Selecione um técnico.');
    if (budgetData.value <= 0) return alert('Informe um valor válido.');
    if (!budgetData.description) return alert('Descreva o escopo técnico.');

    const prof = professionals.find(p => p.id === budgetData.profId);
    const total = budgetData.is_hourly ? (budgetData.value * budgetData.estimated_hours) : budgetData.value;

    await updateStatus(
      RequestStatus.WAITING_BUDGET_APPROVAL,
      'Orçamento Disponível',
      `O orçamento de R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi liberado para sua aprovação.`,
      {
        budget_value: total,
        budget_description: budgetData.description,
        is_hourly: budgetData.is_hourly,
        estimated_hours: budgetData.estimated_hours,
        professional_id: prof?.id,
        professional_name: prof?.name,
        professional_cpf: prof?.cpf,
        professional_photo: prof?.photo,
        budget_status: 'pending'
      }
    );
  };

  const printVoucher = (e: React.MouseEvent) => {
     e.preventDefault();
     e.stopPropagation();
     window.print();
  };

  if (loading) return <div className="p-24 text-center"><Icons.Loader className="animate-spin inline text-brand-accent" size={32} /></div>;
  if (!request) return <div className="p-24 text-center font-black uppercase text-slate-400">Chamado não localizado.</div>;

  const canApprove = (request.requester_id === user.id) || 
                     (isSyndic && !request.is_private) ||
                     (isAdmin);

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 md:px-0 animate-in fade-in duration-700">
      
      <style>{`
        @media print {
          @page { margin: 1.5cm; size: A4; }
          body { background: white !important; -webkit-print-color-adjust: exact; }
          nav, header, aside, .no-print, button, .sidebar-container, .central-mensagens, footer { display: none !important; }
          .max-w-7xl { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .print-header { display: flex !important; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
          .print-visible { display: block !important; }
          .rounded-[3.5rem] { border-radius: 1.5rem !important; border: 1px solid #eee !important; box-shadow: none !important; }
          .shadow-premium, .shadow-sm { box-shadow: none !important; }
          .bg-slate-50 { background-color: #f8fafc !important; }
          .text-brand-blue { color: #0F172A !important; }
          .text-brand-accent { color: #38BDF8 !important; }
        }
      `}</style>

      {/* CABEÇALHO PARA IMPRESSÃO */}
      <div className="hidden print:block print-header">
         <div className="flex justify-between items-start w-full">
            <div>
               <h1 className="text-4xl font-black text-brand-blue uppercase tracking-tighter">Facilities<span className="text-brand-accent">CON</span></h1>
               <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Relatório Técnico de Engenharia</p>
               <div className="mt-6 text-[10px] text-slate-400 leading-relaxed font-bold uppercase space-y-1">
                  <p>{company?.company_name} • CNPJ: {company?.cnpj}</p>
                  <p>{company?.address}</p>
                  <p>{company?.email} • {company?.phone}</p>
               </div>
            </div>
            <div className="text-right">
               <div className="bg-slate-900 text-white px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest mb-2 inline-block">Protocolo #{request.protocol}</div>
               <p className="text-[10px] font-bold text-slate-400 uppercase">Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
         </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between mb-10 gap-4 print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-brand-blue transition-colors">
          <Icons.ArrowLeft size={16} /> Voltar ao Painel
        </button>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref: #{request.protocol}</span>
          <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase text-white shadow-lg ${request.status === RequestStatus.COMPLETED ? 'bg-emerald-500' : 'bg-brand-blue'}`}>
            {request.status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8 print:col-span-12">
          
          {/* BANNER DE APROVAÇÃO FINANCEIRA */}
          {canApprove && request.status === RequestStatus.WAITING_BUDGET_APPROVAL && (
            <div className="bg-gradient-to-br from-brand-blue to-indigo-900 p-10 md:p-14 rounded-[3.5rem] text-white shadow-2xl border-b-8 border-brand-accent animate-in zoom-in-95 print:hidden">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-brand-accent text-brand-blue rounded-2xl flex items-center justify-center shadow-lg">
                    <Icons.DollarSign size={32} />
                  </div>
                  <h2 className="text-3xl font-black font-heading tracking-tighter">Aprovação de Orçamento</h2>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                  <div className="bg-white/10 p-8 rounded-3xl border border-white/5 shadow-inner">
                     <p className="text-[10px] font-black text-indigo-300 uppercase mb-2 tracking-widest">Valor do Investimento</p>
                     <p className="text-5xl font-black text-brand-accent tracking-tighter">R$ {request.budget_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-white/10 p-8 rounded-3xl border border-white/5 shadow-inner">
                     <p className="text-[10px] font-black text-indigo-300 uppercase mb-2 tracking-widest">Executante Técnico</p>
                     <p className="text-xl font-black">{request.professional_name || 'Técnico Especialista'}</p>
                  </div>
               </div>

               <div className="bg-black/20 p-8 rounded-3xl mb-12 border border-white/5">
                  <p className="text-[10px] font-black text-brand-accent uppercase mb-3 tracking-widest">Descrição do Serviço:</p>
                  <p className="text-base text-indigo-100 leading-relaxed font-medium italic">"{request.budget_description || 'Manutenção técnica conforme vistoria.'}"</p>
               </div>

               <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => updateStatus(RequestStatus.BUDGET_APPROVED, 'Orçamento Aprovado', 'O cliente autorizou formalmente a execução do serviço.')} disabled={actionLoading} className="flex-1 bg-brand-accent text-brand-blue py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-glow hover:scale-105 transition-all">
                     {actionLoading ? 'Processando...' : 'Aprovar e Autorizar Reparo'}
                  </button>
                  <button onClick={() => updateStatus(RequestStatus.CANCELED, 'Orçamento Recusado', 'O cliente optou pela não realização do serviço.')} disabled={actionLoading} className="bg-white/10 text-white px-10 py-6 rounded-2xl font-black uppercase text-[11px] hover:bg-red-500 transition-all">
                     Recusar
                  </button>
               </div>
            </div>
          )}

          {/* LAUDO TÉCNICO DE CONCLUSÃO */}
          {request.status === RequestStatus.COMPLETED && (
            <div className="bg-white border-2 border-emerald-100 p-8 md:p-14 rounded-[3.5rem] shadow-premium print:border-none print:p-0 print:shadow-none">
               <div className="flex items-center gap-4 mb-8 print:mb-12">
                  <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg print:hidden">
                     <Icons.ShieldCheck size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black font-heading text-slate-900 tracking-tight leading-none">Laudo de Conclusão</h2>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Serviço Certificado & Homologado</p>
                  </div>
               </div>
               
               <div className="bg-slate-50 p-10 rounded-[2.5rem] shadow-inner border border-emerald-100 mb-12 print:bg-white print:border-l-4 print:border-emerald-500 print:rounded-none print:p-6">
                  <Icons.Quote className="absolute top-6 right-8 text-emerald-50 opacity-20 print:hidden" size={80} />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Relatório Final da Intervenção:</h4>
                  <p className="text-lg text-slate-700 leading-relaxed font-medium italic print:not-italic print:text-base">
                    "{request.technical_report}"
                  </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                  <div className="space-y-4">
                     <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-400"></span> Registro Fotográfico: Entrada
                     </h5>
                     <div className="grid grid-cols-3 gap-2">
                        {(request.photos_before || []).map((img, i) => (
                           <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                              <img src={img} className="w-full h-full object-cover" />
                           </div>
                        ))}
                        {(!request.photos_before || request.photos_before.length === 0) && (
                           <div className="col-span-3 py-8 text-center bg-slate-50 rounded-2xl text-[8px] font-black uppercase text-slate-300">Nenhum registro</div>
                        )}
                     </div>
                  </div>
                  <div className="space-y-4">
                     <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Registro Fotográfico: Saída
                     </h5>
                     <div className="grid grid-cols-3 gap-2">
                        {(request.photos_after || []).map((img, i) => (
                           <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                              <img src={img} className="w-full h-full object-cover" />
                           </div>
                        ))}
                        {(!request.photos_after || request.photos_after.length === 0) && (
                           <div className="col-span-3 py-8 text-center bg-slate-50 rounded-2xl text-[8px] font-black uppercase text-slate-300">Nenhum registro</div>
                        )}
                     </div>
                  </div>
               </div>

               <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-emerald-100 print:mt-10">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 print:hidden">
                        <Icons.CheckCircle size={24} />
                     </div>
                     <p className="text-[11px] font-black text-emerald-800 uppercase tracking-widest">Garantia FacilitiesCON: 3 meses</p>
                  </div>
                  <button onClick={printVoucher} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-black transition-all flex items-center gap-2 print:hidden no-print">
                     <Icons.Download size={16} /> Baixar Laudo Completo (PDF)
                  </button>
               </div>
            </div>
          )}

          {/* DETALHES GERAIS DO CHAMADO */}
          <div className="bg-white p-8 md:p-14 rounded-[3.5rem] shadow-sm border border-slate-100 print:border-none print:shadow-none print:p-0">
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 font-heading tracking-tighter">{request.type}</h1>
                  <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] mt-2">Vertical de Manutenção</p>
               </div>
               <div className="text-right print:text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Localização</p>
                  <p className="font-black text-brand-blue">{request.condo_name} • {request.unit_info || 'Infraestrutura Geral'}</p>
               </div>
            </div>

            <div className="bg-slate-50 p-10 rounded-[2.5rem] border-l-8 border-l-brand-accent italic font-medium text-slate-600 mb-14 shadow-inner text-lg print:bg-white print:border-none print:p-0 print:italic">
              "{request.description}"
            </div>
            
            <div className="pt-12 border-t border-slate-100 print:hidden no-print">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-10 flex items-center gap-3 italic">
                 <Icons.Activity size={20} className="text-brand-accent" /> Histórico de Atividades
               </h3>
               <div className="space-y-10 border-l-2 border-slate-100 ml-4 pl-10 relative">
                  {request.timeline.map((event, idx) => (
                    <div key={idx} className="relative group">
                       <div className="absolute -left-[49px] top-1 w-4 h-4 rounded-full bg-white border-4 border-brand-accent group-hover:scale-125 transition-transform"></div>
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">{new Date(event.timestamp).toLocaleString('pt-BR')}</p>
                       <h5 className="font-black text-slate-800 text-base">{event.title}</h5>
                       <p className="text-sm text-slate-500 mt-1 font-medium">{event.description}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR DE GESTÃO */}
        <div className="lg:col-span-4 space-y-8 print:hidden no-print">
           
           {isAdmin && request.status !== RequestStatus.COMPLETED && request.status !== RequestStatus.CANCELED && (
             <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl space-y-8 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent rounded-full blur-[100px] opacity-5"></div>
                
                <div className="flex items-center gap-4 relative z-10">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-brand-accent shadow-inner">
                      <Icons.Cpu size={24} />
                   </div>
                   <h3 className="font-black text-xl uppercase italic tracking-tighter">Terminal Admin</h3>
                </div>

                <div className="space-y-8 relative z-10">
                   <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Vincular Profissional</label>
                      <select 
                        className="w-full bg-white/5 p-5 rounded-2xl text-xs font-bold border border-white/10 text-white outline-none appearance-none shadow-inner" 
                        value={budgetData.profId} 
                        onChange={e => setBudgetData({...budgetData, profId: e.target.value})}
                      >
                         <option value="" className="text-slate-900">Buscar Especialista...</option>
                         {professionals.map(p => <option key={p.id} value={p.id} className="text-slate-900">{p.name} ({p.specialty})</option>)}
                      </select>
                   </div>

                   {(request.status === RequestStatus.PENDING_APPROVAL || request.status === RequestStatus.WAITING_BUDGET_APPROVAL) && (
                     <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[10px] font-black text-brand-accent uppercase italic tracking-widest">Orçamento Técnico</span>
                           <button onClick={() => setBudgetData({...budgetData, is_hourly: !budgetData.is_hourly})} className="text-[8px] px-3 py-1 bg-slate-800 rounded-full uppercase font-black text-slate-400 hover:text-white transition-colors">
                             {budgetData.is_hourly ? 'Por Hora' : 'Fixo'}
                           </button>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-slate-500 uppercase ml-1">{budgetData.is_hourly ? 'Valor/Hora (R$)' : 'Valor Total (R$)'}</p>
                           <input type="number" placeholder="0,00" className="w-full bg-white/10 p-5 rounded-2xl text-2xl font-black text-white outline-none border border-white/10 focus:border-brand-accent transition-all shadow-inner" value={budgetData.value} onChange={e => setBudgetData({...budgetData, value: parseFloat(e.target.value)})} />
                        </div>
                        
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-slate-500 uppercase ml-1">Escopo Técnico do Orçamento</p>
                           <textarea className="w-full bg-white/10 p-5 rounded-2xl text-xs h-32 outline-none border border-white/10 focus:border-brand-accent transition-all shadow-inner resize-none font-medium" placeholder="Ex: Substituição de disjuntor bipolar 40A..." value={budgetData.description} onChange={(e) => setBudgetData({...budgetData, description: e.target.value})} />
                        </div>

                        <button 
                          onClick={handleSendBudget} 
                          disabled={actionLoading || budgetData.value <= 0 || !budgetData.profId}
                          className="w-full bg-brand-accent text-brand-blue py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-glow hover:scale-105 transition-all disabled:opacity-20"
                        >
                           {actionLoading ? 'Processando...' : 'Protocolar Orçamento'}
                        </button>
                     </div>
                   )}

                   <div className="pt-6 border-t border-white/10 space-y-4">
                      {request.status === RequestStatus.BUDGET_APPROVED && (
                         <button onClick={() => updateStatus(RequestStatus.IN_PROGRESS, 'Equipe em Campo', 'A execução do serviço foi iniciada conforme o escopo aprovado.')} disabled={actionLoading} className="w-full bg-brand-accent text-brand-blue py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-glow">
                            Iniciar Execução
                         </button>
                      )}
                      {request.status === RequestStatus.IN_PROGRESS && (
                         <button onClick={() => setShowFinishModal(true)} disabled={actionLoading} className="w-full bg-emerald-500 text-white py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg">
                            Finalizar e Emitir Laudo
                         </button>
                      )}
                      
                      <button onClick={() => { if(confirm('Deseja cancelar o chamado?')) updateStatus(RequestStatus.CANCELED, 'Chamado Encerrado', 'O chamado foi cancelado pela administração.'); }} className="w-full py-4 text-red-400 font-black uppercase text-[9px] tracking-[0.3em] hover:text-red-500 transition-colors">Cancelar Chamado</button>
                   </div>
                </div>
             </div>
           )}

           <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden h-[600px] flex flex-col no-print central-mensagens">
              <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
                 <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center text-brand-accent shadow-sm">
                    <Icons.MessageSquare size={18} />
                 </div>
                 <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-700 italic">Central de Mensagens</h4>
              </div>
              <Chat requestId={request.id} user={user} />
           </div>
        </div>
      </div>

      {showFinishModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-brand-dark/95 backdrop-blur-md p-4 no-print">
           <div className="bg-white rounded-[4rem] w-full max-w-2xl p-8 md:p-12 shadow-premium relative overflow-y-auto max-h-[90vh]">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner">
                  <Icons.FileText size={32} />
                </div>
                <h3 className="text-3xl font-black font-heading text-slate-900 tracking-tight">Publicar Laudo Final</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registro: Entrada</label>
                    <div className="grid grid-cols-3 gap-2">
                       {photosBefore.map((p, i) => (
                         <div key={i} className="relative group/photo aspect-square rounded-xl overflow-hidden bg-slate-100">
                            <img src={p} className="w-full h-full object-cover" />
                            <button 
                              onClick={() => removePhoto(i, 'before')}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-100 md:opacity-0 group-hover/photo:opacity-100 transition-opacity shadow-lg"
                              title="Remover foto"
                            >
                              <Icons.Trash size={12} />
                            </button>
                         </div>
                       ))}
                       {photosBefore.length < 3 && (
                          <button onClick={() => fileBeforeRef.current?.click()} className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 hover:border-brand-accent transition-all">
                             <Icons.Plus size={20} />
                          </button>
                       )}
                    </div>
                    <input type="file" ref={fileBeforeRef} className="hidden" multiple accept="image/*" onChange={(e) => handlePhotoUpload(e, 'before')} />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registro: Saída</label>
                    <div className="grid grid-cols-3 gap-2">
                       {photosAfter.map((p, i) => (
                         <div key={i} className="relative group/photo aspect-square rounded-xl overflow-hidden bg-slate-100">
                            <img src={p} className="w-full h-full object-cover" />
                            <button 
                              onClick={() => removePhoto(i, 'after')}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-100 md:opacity-0 group-hover/photo:opacity-100 transition-opacity shadow-lg"
                              title="Remover foto"
                            >
                              <Icons.Trash size={12} />
                            </button>
                         </div>
                       ))}
                       {photosAfter.length < 3 && (
                          <button onClick={() => fileAfterRef.current?.click()} className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 hover:border-brand-accent transition-all">
                             <Icons.Plus size={20} />
                          </button>
                       )}
                    </div>
                    <input type="file" ref={fileAfterRef} className="hidden" multiple accept="image/*" onChange={(e) => handlePhotoUpload(e, 'after')} />
                 </div>
              </div>

              <textarea className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none min-h-[150px] mb-10 font-medium text-slate-700 shadow-inner focus:ring-4 focus:ring-emerald-500/5 transition-all" placeholder="Relate as intervenções técnicas realizadas para o cliente..." value={technicalReport} onChange={(e) => setTechnicalReport(e.target.value)} />
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => updateStatus(RequestStatus.COMPLETED, 'Laudo Técnico Emitido', 'O serviço foi finalizado com sucesso e o laudo técnico já está disponível.', { 
                    technical_report: technicalReport,
                    photos_before: photosBefore,
                    photos_after: photosAfter
                  })} 
                  disabled={!technicalReport || actionLoading} 
                  className="w-full bg-emerald-500 text-white py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-all disabled:opacity-30"
                >
                  {actionLoading ? 'Processando...' : 'Publicar Laudo e Encerrar'}
                </button>
                <button onClick={() => setShowFinishModal(false)} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-900">Cancelar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetails;
