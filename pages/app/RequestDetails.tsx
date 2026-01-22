
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
  
  const [technicalReport, setTechnicalReport] = useState('');
  const [photosBefore, setPhotosBefore] = useState<string[]>([]);
  const [photosAfter, setPhotosAfter] = useState<string[]>([]);
  const [showFinishModal, setShowFinishModal] = useState(false);

  useEffect(() => {
    loadRequest();
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
      await loadRequest();
      setShowFinishModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
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
        /* ESTILOS DE IMPRESSÃO - PRESERVADOS DO MODELO ANTERIOR */
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
          .signature-section-print { margin-top: 50px; display: flex !important; justify-content: space-around; page-break-inside: avoid; }
          .signature-box-print { width: 240px; border-top: 1.5px solid #000; text-align: center; padding-top: 8px; font-size: 8.5pt; font-weight: bold; }
        }
      `}</style>

      {/* 1. VISUALIZAÇÃO NO SISTEMA (DASHBOARD WEB) */}
      <div className="print:hidden space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header de Ações */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-brand-blue transition-all">
            <Icons.ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar
          </button>
          <div className="flex items-center gap-4">
             {request.status !== RequestStatus.COMPLETED && user.role === UserRole.ADMIN && (
               <button onClick={() => setShowFinishModal(true)} className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all flex items-center gap-2">
                 <Icons.CheckCircle size={18} /> Finalizar Chamado
               </button>
             )}
             <button onClick={() => window.print()} className="bg-brand-blue text-brand-accent px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-premium hover:bg-black transition-all flex items-center gap-2">
               <Icons.Download size={18} /> Gerar PDF Oficial
             </button>
          </div>
        </div>

        {/* Hero Card do Chamado */}
        <div className="bg-brand-blue rounded-[3rem] p-8 md:p-12 text-white shadow-premium relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
           <div className="relative z-10 flex flex-col md:flex-row justify-between gap-10">
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <span className="px-4 py-1.5 bg-brand-accent/20 text-brand-accent rounded-full text-[9px] font-black uppercase tracking-[0.3em] border border-brand-accent/20">Protocolo #{request.protocol}</span>
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] ${request.status === RequestStatus.COMPLETED ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white'}`}>{request.status}</span>
                 </div>
                 <h1 className="text-4xl md:text-5xl font-black font-heading tracking-tighter leading-none italic">{request.type}</h1>
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

        {/* Grid de Informações Web */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Coluna Detalhes */}
           <div className="lg:col-span-2 space-y-8">
              
              {/* Card de Identificação */}
              <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm">
                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-3 italic">
                    <Icons.Building size={18} className="text-brand-accent" /> Dados da Ocorrência
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Localização</p>
                       <p className="font-black text-slate-900 text-lg">{request.condo_name}</p>
                       <p className="text-sm text-slate-400 font-medium">{request.unit_info || 'Área Comum / Estrutura'}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Responsável Técnico</p>
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-accent text-brand-blue rounded-xl flex items-center justify-center font-black">
                             {request.professional_name?.charAt(0) || 'F'}
                          </div>
                          <div>
                             <p className="font-black text-slate-900">{request.professional_name || 'Equipe FacilitiesCON'}</p>
                             <p className="text-xs text-slate-400 font-medium">Engenharia e Manutenção</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Card Galeria Web */}
              <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm">
                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-3 italic">
                    <Icons.Image size={18} className="text-brand-accent" /> Registro de Evidências
                 </h3>
                 
                 <div className="space-y-12">
                    {/* Antes */}
                    <div>
                       <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span> Diagnóstico de Entrada
                       </p>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {(request.photos_before || request.photos || []).map((img, i) => (
                             <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-inner group">
                                <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                             </div>
                          ))}
                       </div>
                    </div>

                    {/* Depois */}
                    {request.status === RequestStatus.COMPLETED && (
                       <div className="pt-8 border-t border-slate-50">
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Resultado Pós-Reparo
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             {(request.photos_after || []).map((img, i) => (
                                <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-inner group">
                                   <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                </div>
                             ))}
                          </div>
                       </div>
                    )}
                 </div>
              </div>

              {/* Parecer Técnico Web */}
              {request.status === RequestStatus.COMPLETED && (
                <div className="bg-emerald-500/5 rounded-[2.5rem] p-8 md:p-10 border border-emerald-500/10">
                   <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.4em] mb-6 flex items-center gap-3 italic">
                      <Icons.FileText size={18} /> Laudo e Encerramento
                   </h3>
                   <p className="text-slate-800 text-lg font-medium leading-relaxed italic">
                      "{request.technical_report}"
                   </p>
                </div>
              )}
           </div>

           {/* Coluna Chat / Timeline */}
           <div className="space-y-8 h-fit">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
                 <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                    <Icons.MessageSquare size={18} className="text-brand-accent" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Comunicações do Chamado</span>
                 </div>
                 <div className="flex-1 overflow-hidden">
                    <Chat requestId={request.id} user={user} />
                 </div>
              </div>

              {/* Resumo Financeiro Web (Se Admin/Síndico) */}
              {(user.role === UserRole.ADMIN || user.role === UserRole.SYNDIC) && request.budget_value && (
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-glow relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10"><Icons.DollarSign size={80} /></div>
                   <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest mb-2 relative z-10">Custo Total Executado</p>
                   <h4 className="text-4xl font-black relative z-10">R$ {request.budget_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* 2. MOTOR DE IMPRESSÃO (INVISÍVEL NA TELA) */}
      <div id="laudo-pdf-engine" className="hidden print:block">
        <div className="print-header">
           <div className="flex items-center gap-5">
              <div className="bg-brand-blue p-3 rounded-xl"><Icons.Building size={40} className="text-brand-accent" /></div>
              <div>
                 <h1 className="text-3xl font-black text-brand-blue tracking-tighter">Facilities<span className="text-brand-accent">CON</span></h1>
                 <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Engenharia e Gestão Técnica</p>
              </div>
           </div>
           <div className="text-right">
              <h2 className="text-2xl font-black text-slate-900 mb-1">RELATÓRIO TÉCNICO</h2>
              <p className="text-[11px] font-black uppercase text-brand-accent tracking-widest">Protocolo: OS-{request.protocol}</p>
           </div>
        </div>

        <div className="section-title">I. Identificação da Ordem de Serviço</div>
        <table className="metadata-table">
           <tbody>
              <tr>
                 <td width="55%"><span className="field-label">Cliente / Condomínio</span><span className="field-value">{request.condo_name}</span></td>
                 <td width="45%"><span className="field-label">Área de Atendimento</span><span className="field-value">{request.unit_info || 'Área Comum'}</span></td>
              </tr>
              <tr>
                 <td><span className="field-label">Data de Abertura</span><span className="field-value">{creationDate} às {creationTime}</span></td>
                 <td><span className="field-label">Data de Conclusão</span><span className="field-value">{completionDate || 'Em Processo'}</span></td>
              </tr>
              <tr>
                 <td><span className="field-label">Natureza do Serviço</span><span className="field-value uppercase">{request.type}</span></td>
                 <td><span className="field-label">Responsável Técnico</span><span className="field-value">{request.professional_name || 'Equipe FacilitiesCON'}</span></td>
              </tr>
           </tbody>
        </table>

        <div className="section-title">II. Descrição da Ocorrência e Diagnóstico</div>
        <div className="desc-box">{request.description}</div>

        <div className="section-title">III. Evidências Técnicas - Situação Encontrada (Antes)</div>
        <div className="photo-grid-print">
           {(request.photos_before || request.photos || []).map((img, i) => (
              <div key={i} className="photo-card-print">
                 <img src={img} /><div className="photo-caption-print">DIAGNÓSTICO #{i+1}</div>
              </div>
           ))}
        </div>

        {request.status === RequestStatus.COMPLETED && (
           <>
              <div className="section-title">IV. Evidências Técnicas - Solução Aplicada (Depois)</div>
              <div className="photo-grid-print">
                 {(request.photos_after || []).map((img, i) => (
                    <div key={i} className="photo-card-print">
                       <img src={img} /><div className="photo-caption-print">CONCLUÍDO #{i+1}</div>
                    </div>
                 ))}
              </div>

              <div className="section-title">V. Parecer Técnico e Encerramento</div>
              <div className="parecer-tecnico-print">{request.technical_report}</div>

              <div className="signature-section-print">
                 <div className="signature-box-print">Responsável Técnico<p className="font-normal text-[7pt] text-slate-400 mt-1">FacilitiesCON Engenharia</p></div>
                 <div className="signature-box-print">Recebido por (Cliente/Síndico)<p className="font-normal text-[7pt] text-slate-400 mt-1">{request.condo_name}</p></div>
              </div>
           </>
        )}

        <div className="footer-print">
           <p className="font-bold">© {new Date().getFullYear()} {company?.company_name} | CNPJ: {company?.cnpj}</p>
           <p>{company?.address} | {company?.email} | {company?.phone}</p>
        </div>
      </div>

      {/* MODAL DE FINALIZAÇÃO WEB */}
      {showFinishModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-brand-dark/95 backdrop-blur-md p-4 print:hidden">
           <div className="bg-white rounded-[4rem] w-full max-w-2xl p-8 md:p-12 shadow-premium relative overflow-y-auto max-h-[90vh]">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner"><Icons.FileText size={32} /></div>
                <h3 className="text-3xl font-black font-heading text-slate-900 tracking-tight">Finalizar e Gerar Laudo</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fotos de Conclusão (Depois)</label>
                    <div className="grid grid-cols-3 gap-2">
                       {photosAfter.map((p, i) => (
                         <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-100"><img src={p} className="w-full h-full object-cover" /></div>
                       ))}
                       {photosAfter.length < 4 && (
                          <button onClick={() => fileAfterRef.current?.click()} className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300"><Icons.Plus size={20} /></button>
                       )}
                    </div>
                    <input type="file" ref={fileAfterRef} className="hidden" multiple accept="image/*" onChange={(e) => handlePhotoUpload(e, 'after')} />
                 </div>
              </div>
              <textarea className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none min-h-[150px] mb-10 font-medium text-slate-700 shadow-inner" placeholder="Escreva o parecer técnico detalhado..." value={technicalReport} onChange={(e) => setTechnicalReport(e.target.value)} />
              <div className="flex flex-col gap-4">
                <button onClick={() => updateStatus(RequestStatus.COMPLETED, 'Laudo Técnico Emitido', 'O serviço foi finalizado e o laudo oficial está disponível.', { technical_report: technicalReport, photos_after: photosAfter })} disabled={!technicalReport || actionLoading} className="w-full bg-emerald-500 text-white py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-all">
                  {actionLoading ? 'Processando...' : 'Confirmar e Publicar'}
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
