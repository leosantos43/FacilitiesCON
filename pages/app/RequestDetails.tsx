
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
          /* RESET DE UI */
          body * { visibility: hidden; }
          #laudo-tecnico-oficial, #laudo-tecnico-oficial * { visibility: visible; }

          #laudo-tecnico-oficial {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding-bottom: 4cm !important; /* Espaço para o rodapé não sobrepor */
            display: block !important;
          }

          @page {
            size: A4;
            margin: 1.5cm 1.5cm 3.5cm 1.5cm; /* Margem inferior aumentada para o rodapé */
          }

          .print-header {
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            border-bottom: 4px solid #0F172A;
            padding-bottom: 15px;
            margin-bottom: 30px;
          }

          .section-title {
            background-color: #1e293b !important;
            color: #ffffff !important;
            font-size: 10pt !important;
            font-weight: 800 !important;
            text-transform: uppercase;
            padding: 10px 15px;
            margin: 25px 0 15px 0;
            border-radius: 4px;
            -webkit-print-color-adjust: exact;
          }

          .metadata-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }

          .metadata-table td {
            border: 1px solid #334155;
            padding: 12px;
            vertical-align: top;
          }

          .field-label {
            font-size: 7.5pt;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            display: block;
            margin-bottom: 3px;
          }

          .field-value {
            font-size: 10.5pt;
            font-weight: 700;
            color: #000;
          }

          .desc-box {
            border: 1.5px solid #334155;
            padding: 20px;
            font-size: 11pt;
            line-height: 1.6;
            text-align: justify;
            background: #f8fafc !important;
            -webkit-print-color-adjust: exact;
          }

          .photo-grid-print {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 15px !important;
          }

          .photo-card {
            border: 1px solid #334155;
            border-radius: 4px;
            overflow: hidden;
            page-break-inside: avoid;
            margin-bottom: 10px;
          }

          .photo-card img {
            width: 100%;
            height: 240px;
            object-fit: cover;
          }

          .photo-caption {
            background: #1e293b;
            color: #fff;
            font-size: 7.5pt;
            font-weight: bold;
            padding: 6px;
            text-align: center;
            -webkit-print-color-adjust: exact;
          }

          .parecer-tecnico {
            border-left: 6px solid #0F172A;
            padding: 20px 30px;
            font-style: italic;
            font-size: 11.5pt;
            line-height: 1.7;
            background: #f1f5f9 !important;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
          }

          /* GARANTE QUE A CONCLUSÃO NÃO QUEBRE NO MEIO OU SOBREPOR */
          .conclusion-section {
            page-break-before: auto;
            page-break-inside: avoid;
          }

          .signature-section {
            margin-top: 50px;
            display: flex !important;
            justify-content: space-around;
            page-break-inside: avoid;
          }

          .signature-box {
            width: 240px;
            border-top: 1.5px solid #000;
            text-align: center;
            padding-top: 8px;
            font-size: 8.5pt;
            font-weight: bold;
          }

          .footer-print {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 7.5pt;
            color: #475569;
            border-top: 1px solid #cbd5e1;
            padding: 15px 0;
            background: white !important;
          }
        }
      `}</style>

      {/* WEB UI CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between mb-10 gap-4 print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-brand-blue transition-colors">
          <Icons.ArrowLeft size={16} /> Voltar ao Painel
        </button>
        <div className="flex items-center gap-4">
          <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase text-white shadow-lg ${request.status === RequestStatus.COMPLETED ? 'bg-emerald-500' : 'bg-brand-blue'}`}>
            {request.status}
          </div>
          <button onClick={printVoucher} className="bg-brand-blue text-brand-accent px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-premium hover:bg-black transition-all flex items-center gap-3">
            <Icons.Download size={18} /> Imprimir Laudo Completo
          </button>
        </div>
      </div>

      {/* LAUDO TÉCNICO (PDF STRUCTURE) */}
      <div id="laudo-tecnico-oficial" className="bg-white p-0 md:p-16 md:border md:border-slate-100 md:rounded-[3rem] md:shadow-premium print:p-0 print:border-none print:shadow-none">
        
        {/* HEADER */}
        <div className="print-header">
           <div className="flex items-center gap-5">
              <div className="bg-brand-blue p-3 rounded-xl">
                 <Icons.Building size={40} className="text-brand-accent" />
              </div>
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

        {/* I. DADOS GERAIS */}
        <div className="section-title">I. Identificação da Ordem de Serviço</div>
        <table className="metadata-table">
           <tbody>
              <tr>
                 <td width="55%">
                    <span className="field-label">Cliente / Condomínio</span>
                    <span className="field-value">{request.condo_name}</span>
                 </td>
                 <td width="45%">
                    <span className="field-label">Área de Atendimento</span>
                    <span className="field-value">{request.unit_info || 'Área Comum / Estrutural'}</span>
                 </td>
              </tr>
              <tr>
                 <td>
                    <span className="field-label">Data de Abertura</span>
                    <span className="field-value">{creationDate} às {creationTime}</span>
                 </td>
                 <td>
                    <span className="field-label">Data de Conclusão</span>
                    <span className="field-value">{completionDate || 'Em Processo de Reparo'}</span>
                 </td>
              </tr>
              <tr>
                 <td>
                    <span className="field-label">Natureza do Serviço</span>
                    <span className="field-value uppercase text-brand-accent">{request.type}</span>
                 </td>
                 <td>
                    <span className="field-label">Profissional Responsável</span>
                    <span className="field-value">{request.professional_name || 'Gestão FacilitiesCON'}</span>
                 </td>
              </tr>
           </tbody>
        </table>

        {/* II. DESCRIÇÃO */}
        <div className="section-title">II. Descrição da Ocorrência e Diagnóstico</div>
        <div className="desc-box">
           {request.description}
        </div>

        {/* III. FOTOS ANTES */}
        <div className="section-title">III. Evidências Técnicas - Situação Encontrada (Antes)</div>
        <div className="photo-grid-print">
           {(request.photos_before || request.photos || []).map((img, i) => (
              <div key={i} className="photo-card">
                 <img src={img} alt="Antes" />
                 <div className="photo-caption">EVIDÊNCIA DE ENTRADA #{i+1}</div>
              </div>
           ))}
        </div>

        {/* IV. CONCLUSÃO */}
        {request.status === RequestStatus.COMPLETED && (
           <div className="conclusion-section">
              <div className="section-title">IV. Evidências Técnicas - Solução Aplicada (Depois)</div>
              <div className="photo-grid-print">
                 {(request.photos_after || []).map((img, i) => (
                    <div key={i} className="photo-card">
                       <img src={img} alt="Depois" />
                       <div className="photo-caption">EVIDÊNCIA DE CONCLUSÃO #{i+1}</div>
                    </div>
                 ))}
              </div>

              {/* V. PARECER */}
              <div className="section-title">V. Parecer Técnico e Encerramento</div>
              <div className="parecer-tecnico">
                 {request.technical_report}
              </div>

              <div className="mt-8 p-6 border border-slate-200 rounded-xl text-[9.5px] text-slate-500 italic leading-relaxed">
                 Nota: As atividades foram executadas conforme as diretrizes técnicas da ABNT e normas internas de segurança da FacilitiesCON. 
                 Garantia legal de 90 dias a partir desta emissão para os serviços descritos neste relatório técnico.
              </div>

              {/* SIGNATURES */}
              <div className="signature-section">
                 <div className="signature-box">
                    Responsável Técnico
                    <p className="font-normal text-[7pt] text-slate-400 mt-1">CREA/Assinatura Digital FacilitiesCON</p>
                 </div>
                 <div className="signature-box">
                    Recebido por (Cliente/Síndico)
                    <p className="font-normal text-[7pt] text-slate-400 mt-1">{request.condo_name}</p>
                 </div>
              </div>
           </div>
        )}

        {/* PDF FOOTER (STAYS AT BOTTOM OF EACH PAGE) */}
        <div className="hidden print:block footer-print">
           <p className="font-bold">© {new Date().getFullYear()} {company?.company_name} | CNPJ: {company?.cnpj}</p>
           <p>{company?.address} | {company?.email} | {company?.phone}</p>
           <p className="mt-1 font-medium opacity-50">Documento gerado eletronicamente - Autenticação Hash: {id?.substring(0,20).toUpperCase()}</p>
        </div>
      </div>

      {/* WEB ONLY TIMELINE */}
      <div className="pt-20 print:hidden timeline-section max-w-4xl mx-auto">
           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-10 flex items-center gap-3 italic">
             <Icons.Activity size={20} className="text-brand-accent" /> Histórico Operacional Completo
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
  );
};

export default RequestDetails;
