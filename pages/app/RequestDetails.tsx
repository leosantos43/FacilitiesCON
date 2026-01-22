
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
        Array.from(files).map(f => compressImage(f as File, 1200, 0.8))
      );
      if (type === 'before') setPhotosBefore(prev => [...prev, ...compressed].slice(0, 4));
      else setPhotosAfter(prev => [...prev, ...compressed].slice(0, 4));
    } finally {
      setActionLoading(false);
      if (e.target) e.target.value = '';
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
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const printVoucher = (e: React.MouseEvent) => {
     e.preventDefault();
     window.print();
  };

  if (loading) return <div className="p-24 text-center"><Icons.Loader className="animate-spin inline text-brand-accent" size={32} /></div>;
  if (!request) return <div className="p-24 text-center font-black uppercase text-slate-400">Chamado não localizado.</div>;

  const creationDate = new Date(request.created_at).toLocaleDateString('pt-BR');
  const creationTime = new Date(request.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const completionDate = request.status === RequestStatus.COMPLETED ? new Date(request.updated_at).toLocaleDateString('pt-BR') : null;

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 md:px-0">
      
      <style>{`
        @media print {
          /* CONFIGURAÇÕES DE PÁGINA */
          @page { 
            margin: 1.5cm; 
            size: A4; 
          }
          
          /* RESET DE INTERFACE WEB */
          html, body { 
            height: auto !important; 
            overflow: visible !important; 
            background: #fff !important; 
            color: #000 !important;
            font-size: 12pt !important;
          }
          
          #root { display: block !important; }
          
          /* ESCONDER ELEMENTOS DE NAVEGAÇÃO E UI */
          nav, header, aside, footer, .no-print, button, .central-mensagens, 
          .timeline-section, .chat-section, .sidebar-container, 
          a[href^="https://wa.me"] { 
            display: none !important; 
          }
          
          /* ESTRUTURA DO DOCUMENTO */
          .max-w-7xl { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .lg\\:col-span-8, .lg\\:col-span-12 { width: 100% !important; display: block !important; }
          .grid { display: block !important; }
          
          .laudo-doc {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }

          /* CABEÇALHO TIMBRADO */
          .print-header {
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0F172A;
            padding-bottom: 15px;
            margin-bottom: 30px;
          }

          .print-header-logo {
            display: flex !important;
            align-items: center;
            gap: 15px;
          }

          /* SEÇÕES TÉCNICAS */
          .section-block {
            page-break-inside: avoid;
            margin-bottom: 35px;
            width: 100%;
          }

          .section-title {
            background: #0F172A !important;
            color: #ffffff !important;
            font-weight: 900;
            text-transform: uppercase;
            font-size: 10pt;
            padding: 10px 15px;
            margin-bottom: 15px;
            -webkit-print-color-adjust: exact;
          }

          /* TABELA DE METADADOS */
          .metadata-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          .metadata-table td {
            border: 1px solid #000;
            padding: 12px;
            vertical-align: top;
          }
          .label { font-weight: 800; color: #475569; text-transform: uppercase; font-size: 8pt; display: block; margin-bottom: 3px; }
          .value { font-weight: 700; color: #000; font-size: 11pt; }

          /* GRID DE FOTOS PROFISSIONAL */
          .photo-grid-pdf {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px !important;
            margin-top: 15px;
          }
          .photo-box {
            border: 1px solid #000;
            border-radius: 4px;
            height: 320px;
            overflow: hidden;
            position: relative;
            page-break-inside: avoid;
          }
          .photo-box img { 
            width: 100%; 
            height: 100%; 
            object-fit: cover; 
          }
          .photo-tag {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0,0,0,0.7);
            color: #fff;
            padding: 5px 10px;
            font-size: 8pt;
            font-weight: bold;
          }

          /* PARECER TÉCNICO */
          .parecer-pdf {
            padding: 20px !important;
            border: 1px dashed #000 !important;
            font-family: serif;
            font-size: 13pt;
            line-height: 1.7;
            text-align: justify;
          }

          /* RODAPÉ INSTITUCIONAL */
          .print-footer {
            display: block !important;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 1px solid #000;
            padding-top: 8px;
            text-align: center;
            font-size: 8pt;
            color: #64748b;
          }

          .signature-area {
            margin-top: 60px;
            display: flex !important;
            justify-content: space-between;
            page-break-inside: avoid;
          }
          .signature-line {
            width: 250px;
            border-top: 1px solid #000;
            text-align: center;
            padding-top: 5px;
            font-size: 9pt;
            font-weight: bold;
          }
        }
      `}</style>

      {/* CABEÇALHO PARA IMPRESSÃO (TIMBRADO) */}
      <div className="hidden print:block print-header">
         <div className="print-header-logo">
            <div className="bg-brand-blue p-2 rounded-lg">
               <Icons.Building size={32} className="text-brand-accent" />
            </div>
            <div>
               <h1 className="text-2xl font-black text-brand-blue tracking-tighter">Facilities<span className="text-brand-accent">CON</span></h1>
               <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Engenharia e Manutenção Predial</p>
            </div>
         </div>
         <div className="text-right">
            <p className="text-xl font-black text-slate-900">Relatório Técnico #{request.protocol}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Via do Condomínio - Original</p>
         </div>
      </div>

      {/* INTERFACE WEB - CONTROLES */}
      <div className="flex flex-col md:flex-row justify-between mb-10 gap-4 print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-brand-blue transition-colors">
          <Icons.ArrowLeft size={16} /> Voltar ao Painel
        </button>
        <div className="flex items-center gap-4">
          <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase text-white shadow-lg ${request.status === RequestStatus.COMPLETED ? 'bg-emerald-500' : 'bg-brand-blue'}`}>
            {request.status}
          </div>
          <button onClick={printVoucher} className="bg-slate-900 text-white px-6 py-2 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-brand-accent hover:text-brand-blue transition-all flex items-center gap-2">
            <Icons.Download size={14} /> Imprimir Laudo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12">
          
          <div className="bg-white border border-slate-100 p-0 rounded-[3.5rem] shadow-premium overflow-hidden laudo-doc">
               
               {/* I. Identificação */}
               <div className="p-8 md:p-14">
                  <div className="section-block">
                     <div className="section-title">I. Identificação da Ordem de Serviço</div>
                     <table className="metadata-table">
                        <tbody>
                           <tr>
                              <td width="50%"><span className="label">Cliente / Condomínio</span><span className="value">{request.condo_name}</span></td>
                              <td width="50%"><span className="label">Endereço / Unidade</span><span className="value">{request.unit_info || 'Área Comum / Infraestrutura'}</span></td>
                           </tr>
                           <tr>
                              <td><span className="label">Data de Abertura</span><span className="value">{creationDate} às {creationTime}</span></td>
                              <td><span className="label">Data de Encerramento</span><span className="value">{completionDate || 'Serviço em Andamento'}</span></td>
                           </tr>
                           <tr>
                              <td><span className="label">Especialidade do Reparo</span><span className="value">{request.type}</span></td>
                              <td><span className="label">Engenheiro / Técnico Resp.</span><span className="value">{request.professional_name || 'Gestão FacilitiesCON'}</span></td>
                           </tr>
                        </tbody>
                     </table>
                  </div>

                  {/* II. Escopo */}
                  <div className="section-block">
                     <div className="section-title">II. Descrição da Ocorrência e Diagnóstico</div>
                     <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 text-slate-700 text-base leading-relaxed font-medium print:bg-white print:p-0 print:border-none">
                        {request.description}
                     </div>
                  </div>

                  {/* III. Registro Fotográfico - Entrada */}
                  <div className="section-block">
                     <div className="section-title">III. Registro Fotográfico - Diagnóstico (Entrada)</div>
                     <p className="text-[10px] text-slate-400 font-bold uppercase mb-4 print:hidden">Fotos capturadas no momento da abertura do chamado</p>
                     <div className="photo-grid-pdf">
                        {(request.photos_before || request.photos || []).map((img, i) => (
                           <div key={i} className="photo-box">
                              <img src={img} />
                              <div className="photo-tag">EVIDÊNCIA DE ENTRADA #{i+1}</div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* IV. Registro Fotográfico - Saída */}
                  {request.status === RequestStatus.COMPLETED && (
                    <div className="section-block">
                       <div className="section-title">IV. Registro Fotográfico - Conclusão (Saída)</div>
                       <p className="text-[10px] text-slate-400 font-bold uppercase mb-4 print:hidden">Fotos capturadas após a finalização do serviço técnico</p>
                       <div className="photo-grid-pdf">
                          {(request.photos_after || []).map((img, i) => (
                             <div key={i} className="photo-box">
                                <img src={img} />
                                <div className="photo-tag">EVIDÊNCIA DE CONCLUSÃO #{i+1}</div>
                             </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {/* V. Parecer Técnico */}
                  {request.status === RequestStatus.COMPLETED && (
                    <div className="section-block">
                       <div className="section-title">V. Parecer Técnico e Termo de Garantia</div>
                       <div className="parecer-pdf">
                          <p className="mb-6">Relatamos que as intervenções técnicas descritas neste documento foram executadas seguindo os padrões normativos da ABNT e os protocolos de segurança internos da FacilitiesCON.</p>
                          <p className="italic font-bold text-slate-900 border-l-4 border-brand-blue pl-6 my-8">
                             "{request.technical_report}"
                          </p>
                          <p className="text-[10px] font-black uppercase text-slate-400 mt-10">
                             Garantia de Serviço: 90 dias a partir desta data, cobrindo exclusivamente o escopo relatado acima.
                          </p>
                       </div>
                    </div>
                  )}

                  {/* Assinaturas */}
                  <div className="hidden print:flex signature-area">
                     <div className="signature-line">
                        Engenheiro / Técnico Responsável
                        <p className="text-[7pt] mt-1 font-normal">FacilitiesCON Engenharia</p>
                     </div>
                     <div className="signature-line">
                        Visto do Cliente / Síndico
                        <p className="text-[7pt] mt-1 font-normal">{request.condo_name}</p>
                     </div>
                  </div>

                  {/* Metadados de Integridade */}
                  <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-end gap-6 print:mt-24">
                     <div className="text-left">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Autenticação Digital</p>
                        <p className="font-bold text-slate-900 text-xs">Este documento é uma via digital certificada.</p>
                        <p className="text-[8px] text-slate-300 font-medium">Hash OS: {id?.toUpperCase()}</p>
                     </div>
                     <div className="text-right">
                        <Icons.ShieldCheck size={32} className="text-brand-blue ml-auto opacity-20" />
                     </div>
                  </div>
               </div>

               {/* Ações Web (Download/Imprimir) */}
               <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end items-center print:hidden no-print">
                  <button onClick={printVoucher} className="px-12 py-5 bg-brand-blue text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-lg hover:scale-105 transition-all flex items-center gap-3">
                     <Icons.Download size={20} className="text-brand-accent" /> Gerar Laudo em PDF
                  </button>
               </div>
          </div>
          
          {/* Timeline - Somente Web */}
          <div className="pt-12 print:hidden timeline-section">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-10 flex items-center gap-3 italic">
                 <Icons.Activity size={20} className="text-brand-accent" /> Histórico Operacional
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

      {/* RODAPÉ INSTITUCIONAL DE IMPRESSÃO */}
      <div className="hidden print:block print-footer">
         <p className="font-bold">© {new Date().getFullYear()} {company?.company_name} | CNPJ: {company?.cnpj}</p>
         <p>{company?.address} | {company?.phone} | {company?.email}</p>
         <p className="mt-1">Relatório gerado automaticamente via Plataforma Integrada de Manutenção Predial FacilitiesCON.</p>
      </div>

      {/* MODAL DE FINALIZAÇÃO (Somente Web) */}
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fotos de Diagnóstico (Antes)</label>
                    <div className="grid grid-cols-3 gap-2">
                       {photosBefore.map((p, i) => (
                         <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                            <img src={p} className="w-full h-full object-cover" />
                         </div>
                       ))}
                       {photosBefore.length < 4 && (
                          <button onClick={() => fileBeforeRef.current?.click()} className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300">
                             <Icons.Plus size={20} />
                          </button>
                       )}
                    </div>
                    <input type="file" ref={fileBeforeRef} className="hidden" multiple accept="image/*" onChange={(e) => handlePhotoUpload(e, 'before')} />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fotos de Conclusão (Depois)</label>
                    <div className="grid grid-cols-3 gap-2">
                       {photosAfter.map((p, i) => (
                         <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                            <img src={p} className="w-full h-full object-cover" />
                         </div>
                       ))}
                       {photosAfter.length < 4 && (
                          <button onClick={() => fileAfterRef.current?.click()} className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300">
                             <Icons.Plus size={20} />
                          </button>
                       )}
                    </div>
                    <input type="file" ref={fileAfterRef} className="hidden" multiple accept="image/*" onChange={(e) => handlePhotoUpload(e, 'after')} />
                 </div>
              </div>

              <textarea className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none min-h-[150px] mb-10 font-medium text-slate-700 shadow-inner focus:ring-4 focus:ring-emerald-500/5 transition-all" placeholder="Relate o parecer técnico final das intervenções..." value={technicalReport} onChange={(e) => setTechnicalReport(e.target.value)} />
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => updateStatus(RequestStatus.COMPLETED, 'Laudo Técnico Emitido', 'O serviço foi finalizado e o laudo oficial está disponível para download.', { 
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
