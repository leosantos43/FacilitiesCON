
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
      alert('Erro na atualização.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendBudget = async () => {
    if (!budgetData.profId) return alert('Selecione um técnico.');
    if (budgetData.value <= 0) return alert('Informe um valor.');
    const prof = professionals.find(p => p.id === budgetData.profId);
    const total = budgetData.is_hourly ? (budgetData.value * budgetData.estimated_hours) : budgetData.value;

    await updateStatus(
      RequestStatus.WAITING_BUDGET_APPROVAL,
      'Orçamento Disponível',
      `Orçamento de R$ ${total.toLocaleString('pt-BR')} liberado.`,
      {
        budget_value: total,
        budget_description: budgetData.description,
        is_hourly: budgetData.is_hourly,
        estimated_hours: budgetData.estimated_hours,
        professional_id: prof?.id,
        professional_name: prof?.name,
        professional_cpf: prof?.cpf,
        budget_status: 'approved'
      }
    );
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
          /* Reset Global para Impressão */
          @page { margin: 2cm; size: A4; }
          
          /* Esconde TUDO o que for interface web */
          html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
          #root { display: block !important; }
          nav, header, aside, footer, .no-print, button, .central-mensagens, .timeline-section, .chat-section, a[href^="https://wa.me"] { 
            display: none !important; 
          }
          
          /* Garante que o conteúdo principal ocupe 100% sem margens de layout flex */
          .max-w-7xl { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .lg\\:col-span-8, .lg\\:col-span-12 { width: 100% !important; display: block !important; }
          .grid { display: block !important; }
          
          /* Estilização do Laudo PDF */
          .laudo-doc {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .print-header {
            display: flex !important;
            justify-content: space-between;
            align-items: flex-end;
            border-bottom: 3px solid #0F172A;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }

          .section-block {
            page-break-inside: avoid;
            margin-bottom: 30px;
          }

          .section-title {
            background: #f1f5f9 !important;
            color: #0F172A !important;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 11px;
            padding: 8px 12px;
            border-left: 5px solid #0F172A;
            margin-bottom: 15px;
            -webkit-print-color-adjust: exact;
          }

          .metadata-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .metadata-table td {
            border: 1px solid #e2e8f0;
            padding: 10px;
            font-size: 11px;
          }
          .label { font-weight: 800; color: #64748b; text-transform: uppercase; font-size: 9px; display: block; margin-bottom: 2px; }
          .value { font-weight: 700; color: #000; font-size: 12px; }

          .photo-grid-pdf {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 15px !important;
          }
          .photo-box {
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            height: 220px;
            overflow: hidden;
            page-break-inside: avoid;
          }
          .photo-box img { width: 100%; height: 100%; object-fit: cover; }

          .parecer-pdf {
            background: #f8fafc !important;
            padding: 25px !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 8px;
            font-style: italic;
            font-size: 13px;
            line-height: 1.6;
            -webkit-print-color-adjust: exact;
          }

          .print-footer {
            display: block !important;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
          }
        }
      `}</style>

      {/* ELEMENTO DE CABEÇALHO PARA PDF (HIDDEN ON WEB) */}
      <div className="hidden print:block print-header">
         <div className="flex items-center gap-4">
            <div className="bg-brand-blue p-2 rounded-lg">
               <Icons.Building size={32} className="text-brand-accent" />
            </div>
            <div>
               <h1 className="text-2xl font-black text-brand-blue tracking-tighter">Facilities<span className="text-brand-accent">CON</span></h1>
               <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Relatório Técnico de Engenharia</p>
            </div>
         </div>
         <div className="text-right">
            <p className="text-lg font-black text-slate-900">Protocolo OS: {request.protocol}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Documento Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
         </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between mb-10 gap-4 print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-brand-blue transition-colors">
          <Icons.ArrowLeft size={16} /> Voltar
        </button>
        <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase text-white shadow-lg ${request.status === RequestStatus.COMPLETED ? 'bg-emerald-500' : 'bg-brand-blue'}`}>
          {request.status}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12 space-y-8">
          
          <div className="bg-white border border-slate-100 p-0 rounded-[3.5rem] shadow-premium overflow-hidden laudo-doc">
               
               {/* 1. Identificação Técnica */}
               <div className="p-8 md:p-12">
                  <div className="section-title">I. Identificação da Ocorrência</div>
                  <table className="metadata-table">
                     <tbody>
                        <tr>
                           <td width="50%"><span className="label">Condomínio / Parceiro</span><span className="value">{request.condo_name}</span></td>
                           <td width="50%"><span className="label">Localização Específica</span><span className="value">{request.unit_info || 'Áreas Comuns do Edifício'}</span></td>
                        </tr>
                        <tr>
                           <td><span className="label">Data de Abertura</span><span className="value">{creationDate} às {creationTime}</span></td>
                           <td><span className="label">Data de Conclusão</span><span className="value">{completionDate || 'Serviço em Execução'}</span></td>
                        </tr>
                        <tr>
                           <td><span className="label">Especialidade Técnica</span><span className="value">{request.type}</span></td>
                           <td><span className="label">Responsável Técnico</span><span className="value">{request.professional_name || 'Gestão FacilitiesCON'}</span></td>
                        </tr>
                     </tbody>
                  </table>

                  <div className="section-block">
                     <div className="section-title">II. Descrição do Problema / Objeto</div>
                     <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 text-sm font-medium print:bg-white print:p-0 print:border-none">
                        {request.description}
                     </div>
                  </div>

                  <div className="section-block">
                     <div className="section-title">III. Evidências do Diagnóstico (Entrada)</div>
                     <div className="photo-grid-pdf">
                        {(request.photos_before || request.photos || []).map((img, i) => (
                           <div key={i} className="photo-box">
                              <img src={img} />
                           </div>
                        ))}
                     </div>
                  </div>

                  {request.status === RequestStatus.COMPLETED && (
                    <>
                       <div className="section-block page-break-before">
                          <div className="section-title">IV. Evidências da Solução (Saída)</div>
                          <div className="photo-grid-pdf">
                             {(request.photos_after || []).map((img, i) => (
                                <div key={i} className="photo-box">
                                   <img src={img} />
                                </div>
                             ))}
                          </div>
                       </div>

                       <div className="section-block">
                          <div className="section-title">V. Parecer Técnico e Conclusão</div>
                          <div className="parecer-pdf">
                             "{request.technical_report}"
                          </div>
                       </div>
                    </>
                  )}

                  <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-end print:mt-20">
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Documento Digitalizado pela</p>
                        <p className="font-bold text-slate-900 text-sm">Plataforma Integrada FacilitiesCON</p>
                     </div>
                     <div className="text-right">
                        <div className="w-48 h-px bg-slate-900 mb-2 ml-auto"></div>
                        <p className="text-[10px] font-black uppercase text-slate-900">Validação Operacional CON</p>
                        <p className="text-[8px] text-slate-400 font-medium">Hash: {id?.substring(0,24).toUpperCase()}</p>
                     </div>
                  </div>
               </div>

               {/* Botão de Download (Web Only) */}
               <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center print:hidden no-print">
                  <div className="flex items-center gap-3">
                     <Icons.ShieldCheck size={24} className="text-brand-blue" />
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Documento Certificado</p>
                  </div>
                  <button onClick={printVoucher} className="px-10 py-5 bg-brand-blue text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-lg hover:bg-black transition-all flex items-center gap-3">
                     <Icons.Download size={20} className="text-brand-accent" /> Gerar Laudo PDF
                  </button>
               </div>
          </div>
          
          {/* Timeline - Web Only */}
          <div className="pt-12 print:hidden timeline-section">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-10 flex items-center gap-3 italic">
                 <Icons.Activity size={20} className="text-brand-accent" /> Linha do Tempo
               </h3>
               <div className="space-y-10 border-l-2 border-slate-100 ml-4 pl-10 relative">
                  {request.timeline.map((event, idx) => (
                    <div key={idx} className="relative">
                       <div className="absolute -left-[49px] top-1 w-4 h-4 rounded-full bg-white border-4 border-brand-accent"></div>
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{new Date(event.timestamp).toLocaleString('pt-BR')}</p>
                       <h5 className="font-black text-slate-800 text-base">{event.title}</h5>
                       <p className="text-sm text-slate-500 mt-1 font-medium">{event.description}</p>
                    </div>
                  ))}
               </div>
          </div>
        </div>
      </div>

      <div className="hidden print:block print-footer">
         <p>© {new Date().getFullYear()} {company?.company_name} | CNPJ: {company?.cnpj} | {company?.address}</p>
         <p>Este documento é uma via digital autêntica de vistoria e manutenção predial.</p>
      </div>
    </div>
  );
};

export default RequestDetails;
