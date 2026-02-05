
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
    description: '',
    profId: ''
  });

  const [technicalReport, setTechnicalReport] = useState('');
  const [photosBefore, setPhotosBefore] = useState<string[]>([]);
  const [photosAfter, setPhotosAfter] = useState<string[]>([]);
  const [showFinishModal, setShowFinishModal] = useState(false);

  const isAdmin = user.role === UserRole.ADMIN;
  const isOwner = user.id === request?.requester_id || user.role === UserRole.SYNDIC;

  useEffect(() => {
    loadRequest();
    db.getCompanySettings().then(setCompany);
    db.getProfessionals().then(data => setProfessionals(data.filter(p => p.active)));
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
      
      // Se for uma aprovação de orçamento pelo cliente, notificar todos os Admins
      if (newStatus === RequestStatus.BUDGET_APPROVED) {
        const users = await db.getUsers();
        const admins = users.filter(u => u.role === UserRole.ADMIN);
        for (const admin of admins) {
          await db.createNotification(
            admin.id, 
            'Orçamento Aprovado! ✅', 
            `O condomínio ${request.condo_name} aprovou o orçamento do chamado #${request.protocol}. Inicie a execução.`,
            `/admin/request/${request.id}`
          );
        }
      }

      await loadRequest();
      setShowFinishModal(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status. Verifique sua permissão.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendBudget = async () => {
    const prof = professionals.find(p => p.id === budgetData.profId);
    await updateStatus(
      RequestStatus.WAITING_BUDGET_APPROVAL,
      'Orçamento Enviado',
      `O orçamento de R$ ${budgetData.value.toLocaleString('pt-BR')} foi enviado para aprovação do cliente.`,
      {
        budget_value: budgetData.value,
        budget_description: budgetData.description,
        professional_id: budgetData.profId,
        professional_name: prof?.name
      }
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const files = e.target.files;
    if (!files) return;
    setActionLoading(true);
    try {
      const compressed = await Promise.all(
        Array.from(files).map(f => compressImage(f as File, 1200, 0.8))
      );
      if (type === 'before') setPhotosBefore(prev => [...prev, ...compressed].slice(0, 4));
      else setPhotosAfter(prev => [...prev, ...compressed].slice(0, 4));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-24 text-center"><Icons.Loader className="animate-spin inline text-brand-accent" size={32} /></div>;
  if (!request) return <div className="p-24 text-center font-black uppercase text-slate-400">Chamado não localizado.</div>;

  const creationDate = new Date(request.created_at).toLocaleDateString('pt-BR');
  const creationTime = new Date(request.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const completionDate = request.status === RequestStatus.COMPLETED ? new Date(request.updated_at).toLocaleDateString('pt-BR') : null;

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 lg:px-0">
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #laudo-pdf-engine, #laudo-pdf-engine * { visibility: visible; }
          #laudo-pdf-engine {
            position: absolute; left: 0; top: 0; width: 100% !important;
            margin: 0 !important; padding-bottom: 4cm !important; display: block !important;
          }
          @page { size: A4; margin: 1.5cm 1.5cm 3.5cm 1.5cm; }
          .print-header { display: flex !important; justify-content: space-between; align-items: center; border-bottom: 4px solid #0F172A; padding-bottom: 15px; margin-bottom: 30px; }
          .section-title { background-color: #1e293b !important; color: #ffffff !important; font-size: 10pt !important; font-weight: 800 !important; text-transform: uppercase; padding: 10px 15px; margin: 25px 0 15px 0; border-radius: 4px; -webkit-print-color-adjust: exact; }
          .metadata-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .metadata-table td { border: 1px solid #334155; padding: 12px; vertical-align: top; }
          .field-label { font-size: 7.5pt; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 3px; }
          .field-value { font-size: 10.5pt; font-weight: 700; color: #000; }
          .desc-box { border: 1.5px solid #334155; padding: 20px; font-size: 11pt; line-height: 1.6; text-align: justify; background: #f8fafc !important; -webkit-print-color-adjust: exact; }
          .photo-grid-print { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 15px !important; }
          .photo-card-print { border: 1px solid #334155; border-radius: 4px; overflow: hidden; page-break-inside: avoid; margin-bottom: 10px; }
          .photo-card-print img { width: 100%; height: 240px; object-fit: cover; }
          .photo-caption-print { background: #1e293b; color: #fff; font-size: 7.5pt; font-weight: bold; padding: 6px; text-align: center; -webkit-print-color-adjust: exact; }
          .parecer-tecnico-print { border-left: 6px solid #0F172A; padding: 20px 30px; font-style: italic; font-size: 11.5pt; line-height: 1.7; background: #f1f5f9 !important; page-break-inside: avoid; -webkit-print-color-adjust: exact; }
          .footer-print { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 7.5pt; color: #475569; border-top: 1px solid #cbd5e1; padding: 15px 0; background: white !important; }
          .signature-box-print { width: 240px; border-top: 1.5px solid #000; text-align: center; padding-top: 8px; font-size: 8.5pt; font-weight: bold; }
        }
      `}</style>

      {/* 1. VISUALIZAÇÃO NO SISTEMA (DASHBOARD WEB) */}
      <div className="print:hidden space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header de Ações */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-brand-blue transition-all">
            <Icons.ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Painel
          </button>
          <div className="flex items-center gap-4">
             {request.status === RequestStatus.BUDGET_APPROVED && isAdmin && (
                <button onClick={() => updateStatus(RequestStatus.IN_PROGRESS, 'Início da Execução', 'O profissional foi autorizado a iniciar as atividades em campo.')} className="bg-brand-accent text-brand-blue px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-glow flex items-center gap-2">
                   <Icons.Zap size={18} /> Iniciar Execução
                </button>
             )}
             {request.status === RequestStatus.IN_PROGRESS && isAdmin && (
               <button onClick={() => setShowFinishModal(true)} className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all flex items-center gap-2">
                 <Icons.CheckCircle size={18} /> Finalizar e Gerar Laudo
               </button>
             )}
             <button onClick={() => window.print()} className="bg-brand-blue text-brand-accent px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-premium hover:bg-black transition-all flex items-center gap-2">
               <Icons.Download size={18} /> Gerar PDF Oficial
             </button>
          </div>
        </div>

        {/* Hero Card */}
        <div className="bg-brand-blue rounded-[3rem] p-8 md:p-12 text-white shadow-premium relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
           <div className="relative z-10 flex flex-col md:flex-row justify-between gap-10">
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <span className="px-4 py-1.5 bg-brand-accent/20 text-brand-accent rounded-full text-[9px] font-black uppercase tracking-[0.3em] border border-brand-accent/20">Protocolo OS-{request.protocol}</span>
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] shadow-lg ${request.status === RequestStatus.COMPLETED ? 'bg-emerald-500 text-white' : request.status === RequestStatus.BUDGET_APPROVED ? 'bg-emerald-100 text-emerald-800' : 'bg-brand-accent text-brand-blue'}`}>
                      {request.status === RequestStatus.BUDGET_APPROVED ? 'Orçamento Aprovado ✅' : request.status}
                    </span>
                 </div>
                 <h1 className="text-4xl md:text-5xl font-black font-heading tracking-tighter leading-none italic uppercase">{request.type}</h1>
                 <p className="text-blue-100 text-lg font-medium max-w-2xl">{request.description}</p>
              </div>
              <div className="flex flex-col items-end gap-3 shrink-0">
                 <div className="text-right">
                    <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest mb-1">Abertura em</p>
                    <p className="text-xl font-black">{creationDate} <span className="text-sm font-medium opacity-50">{creationTime}</span></p>
                 </div>
                 {completionDate && (
                    <div className="text-right bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                       <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Concluído em</p>
                       <p className="text-xl font-black text-emerald-400">{completionDate}</p>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* Dash Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           <div className="lg:col-span-2 space-y-8">
              
              {/* ADMIN: PAINEL DE GESTÃO E ORÇAMENTO */}
              {isAdmin && request.status !== RequestStatus.COMPLETED && request.status !== RequestStatus.CANCELED && (
                <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-glow border border-white/10 overflow-hidden relative">
                   
                   {/* Overlay de Bloqueio se Aprovado, Aguardando ou Em Execução */}
                   {(request.status === RequestStatus.BUDGET_APPROVED || request.status === RequestStatus.WAITING_BUDGET_APPROVAL || request.status === RequestStatus.IN_PROGRESS) && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-20 flex items-center justify-center p-8 text-center">
                         <div className="space-y-4 animate-in zoom-in duration-300">
                            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                               request.status === RequestStatus.BUDGET_APPROVED || request.status === RequestStatus.IN_PROGRESS 
                               ? 'bg-emerald-500 text-white' 
                               : 'bg-brand-accent text-brand-blue'
                            }`}>
                               {request.status === RequestStatus.BUDGET_APPROVED && <Icons.CheckCircle size={32} />}
                               {request.status === RequestStatus.IN_PROGRESS && <Icons.Zap size={32} />}
                               {request.status === RequestStatus.WAITING_BUDGET_APPROVAL && <Icons.Clock size={32} />}
                            </div>
                            
                            <h4 className="text-xl font-black uppercase tracking-widest">
                               {request.status === RequestStatus.BUDGET_APPROVED && 'Orçamento Aprovado pelo Cliente!'}
                               {request.status === RequestStatus.IN_PROGRESS && 'Serviço em Execução'}
                               {request.status === RequestStatus.WAITING_BUDGET_APPROVAL && 'Orçamento em Análise pelo Cliente'}
                            </h4>
                            
                            <p className="text-slate-400 text-xs font-medium max-w-xs mx-auto">
                               {request.status === RequestStatus.BUDGET_APPROVED && 'O Síndico autorizou os custos. Clique abaixo para iniciar a obra.'}
                               {request.status === RequestStatus.IN_PROGRESS && 'A equipe técnica está trabalhando no local.'}
                               {request.status === RequestStatus.WAITING_BUDGET_APPROVAL && 'O orçamento está no painel do Síndico aguardando decisão.'}
                            </p>

                            {request.status === RequestStatus.BUDGET_APPROVED && (
                               <button onClick={() => updateStatus(RequestStatus.IN_PROGRESS, 'Início da Execução', 'O administrador confirmou o início das atividades.')} className="bg-brand-accent text-brand-blue px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-glow">
                                  Iniciar Execução Agora
                               </button>
                            )}
                         </div>
                      </div>
                   )}

                   <h3 className="text-[11px] font-black text-brand-accent uppercase tracking-[0.4em] mb-8 flex items-center gap-3 italic">
                      <Icons.DollarSign size={18} /> Gestão Comercial
                   </h3>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profissional Atribuído</label>
                         <select 
                            disabled={request.status !== RequestStatus.PENDING_APPROVAL}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-white outline-none focus:border-brand-accent disabled:opacity-50"
                            value={budgetData.profId}
                            onChange={e => setBudgetData({...budgetData, profId: e.target.value})}
                         >
                            <option value="" className="bg-slate-900">Selecionar...</option>
                            {professionals.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                         </select>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor do Orçamento (R$)</label>
                         <input 
                            disabled={request.status !== RequestStatus.PENDING_APPROVAL}
                            type="number"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-white"
                            value={budgetData.value}
                            onChange={e => setBudgetData({...budgetData, value: parseFloat(e.target.value)})}
                         />
                      </div>
                   </div>
                   <div className="space-y-3 mb-8">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escopo Técnico</label>
                      <textarea 
                         disabled={request.status !== RequestStatus.PENDING_APPROVAL}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 font-bold text-white outline-none h-32"
                         value={budgetData.description}
                         onChange={e => setBudgetData({...budgetData, description: e.target.value})}
                      />
                   </div>
                   
                   <button 
                      onClick={handleSendBudget}
                      disabled={actionLoading || !budgetData.value || request.status !== RequestStatus.PENDING_APPROVAL}
                      className="w-full bg-brand-accent text-brand-blue py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-glow disabled:opacity-30"
                   >
                      {actionLoading ? 'Processando...' : 'Enviar para o Síndico'}
                   </button>
                </div>
              )}

              {/* SÍNDICO/MORADOR: PAINEL DE APROVAÇÃO */}
              {!isAdmin && isOwner && request.status === RequestStatus.WAITING_BUDGET_APPROVAL && (
                <div className="bg-white rounded-[2.5rem] p-10 border-4 border-emerald-500 shadow-premium">
                   <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.4em] mb-6 flex items-center gap-3 italic">
                      <Icons.CheckCircle size={18} /> Aprovação de Orçamento
                   </h3>
                   <div className="bg-slate-50 p-8 rounded-[2rem] mb-8">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total do Investimento</p>
                      <p className="text-4xl font-black text-slate-900">R$ {request.budget_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <div className="mt-6 pt-6 border-t border-slate-200">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Escopo do Serviço</p>
                         <p className="text-sm font-medium text-slate-600">{request.budget_description}</p>
                      </div>
                   </div>
                   <div className="flex flex-col md:flex-row gap-4">
                      <button 
                        onClick={() => updateStatus(RequestStatus.BUDGET_APPROVED, 'Orçamento Aprovado ✅', 'O cliente aceitou o orçamento. Aguardando mobilização da equipe.')}
                        className="flex-1 bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg"
                      >
                         Aprovar e Autorizar
                      </button>
                      <button 
                        onClick={() => updateStatus(RequestStatus.PENDING_APPROVAL, 'Orçamento Rejeitado ❌', 'O cliente solicitou revisão do orçamento.')}
                        className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest"
                      >
                         Solicitar Revisão
                      </button>
                   </div>
                </div>
              )}

              {/* Card Identificação Web */}
              <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm">
                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-3 italic">
                    <Icons.Building size={18} className="text-brand-accent" /> Informações do Local
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Empreendimento</p>
                       <p className="font-black text-slate-900 text-lg">{request.condo_name}</p>
                       <p className="text-sm text-slate-400 font-medium">{request.unit_info || 'Infraestrutura Comum'}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Técnico Encarregado</p>
                       <p className="font-black text-slate-900">{request.professional_name || 'Aguardando seleção...'}</p>
                    </div>
                 </div>
              </div>

              {/* Galeria Web */}
              <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm">
                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-3 italic">
                    <Icons.Image size={18} className="text-brand-accent" /> Evidências Técnicas
                 </h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(request.photos_before || request.photos || []).map((img, i) => (
                       <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-inner group">
                          <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                       </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Coluna Chat / Timeline */}
           <div className="space-y-8 h-fit">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
                 <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                    <Icons.MessageSquare size={18} className="text-brand-accent" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Chat do Chamado</span>
                 </div>
                 <div className="flex-1 overflow-hidden">
                    <Chat requestId={request.id} user={user} />
                 </div>
              </div>

              {request.budget_value && (
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-glow relative overflow-hidden">
                   <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest mb-2">Investimento Estimado</p>
                   <h4 className="text-4xl font-black">R$ {request.budget_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* MOTOR DE IMPRESSÃO (PDF) - Igual ao anterior, mantido para integridade */}
      <div id="laudo-pdf-engine" className="hidden print:block">
        <div className="print-header">
           <div className="flex items-center gap-5">
              <div className="bg-brand-blue p-3 rounded-xl"><Icons.Building size={40} className="text-brand-accent" /></div>
              <div><h1 className="text-3xl font-black text-brand-blue">Facilities<span className="text-brand-accent">CON</span></h1></div>
           </div>
           <div className="text-right"><h2 className="text-2xl font-black">RELATÓRIO OS-{request.protocol}</h2></div>
        </div>
        <div className="section-title">I. Dados do Chamado</div>
        <table className="metadata-table">
           <tbody>
              <tr><td width="50%"><span className="field-label">Condomínio</span><span className="field-value">{request.condo_name}</span></td><td width="50%"><span className="field-label">Unidade</span><span className="field-value">{request.unit_info || 'Comum'}</span></td></tr>
              <tr><td><span className="field-label">Data</span><span className="field-value">{creationDate}</span></td><td><span className="field-label">Status</span><span className="field-value uppercase">{request.status}</span></td></tr>
           </tbody>
        </table>
        <div className="section-title">II. Descrição</div><div className="desc-box">{request.description}</div>
        <div className="section-title">III. Fotos</div>
        <div className="photo-grid-print">{(request.photos_before || request.photos || []).map((img, i) => (<div key={i} className="photo-card-print"><img src={img} /></div>))}</div>
        <div className="footer-print"><p>© {new Date().getFullYear()} {company?.company_name}</p></div>
      </div>

      {/* MODAL FINALIZAÇÃO */}
      {showFinishModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-brand-dark/95 backdrop-blur-md p-4 print:hidden">
           <div className="bg-white rounded-[4rem] w-full max-w-2xl p-8 md:p-12 shadow-premium relative overflow-y-auto max-h-[90vh]">
              <h3 className="text-3xl font-black font-heading text-slate-900 tracking-tight mb-8">Finalizar Chamado</h3>
              <textarea className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none min-h-[150px] mb-10 font-medium" placeholder="Relate o parecer técnico final..." value={technicalReport} onChange={(e) => setTechnicalReport(e.target.value)} />
              <button onClick={() => updateStatus(RequestStatus.COMPLETED, 'Chamado Finalizado ✅', 'O laudo técnico foi emitido e o chamado encerrado.', { technical_report: technicalReport })} disabled={!technicalReport || actionLoading} className="w-full bg-emerald-500 text-white py-6 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg">Confirmar Encerramento</button>
              <button onClick={() => setShowFinishModal(false)} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] mt-2">Cancelar</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetails;
