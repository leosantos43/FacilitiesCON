
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
          /* 1. RESET RADICAL: Esconde TUDO do site */
          body * {
            visibility: hidden;
            overflow: visible !important;
          }

          /* 2. ISOLAMENTO: Mostra apenas o container do laudo */
          #laudo-tecnico-oficial, #laudo-tecnico-oficial * {
            visibility: visible;
          }

          #laudo-tecnico-oficial {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }

          /* 3. CONFIGURAÇÕES DE PÁGINA A4 */
          @page {
            size: A4;
            margin: 1.5cm;
          }

          /* 4. ESTILOS DO DOCUMENTO TÉCNICO */
          .print-container {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
            color: #000 !important;
          }

          .print-header {
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #0F172A;
            padding-bottom: 20px;
            margin-bottom: 40px;
          }

          .section-title {
            background-color: #0F172A !important;
            color: #ffffff !important;
            font-size: 11pt !important;
            font-weight: 900 !important;
            text-transform: uppercase;
            padding: 8px 15px;
            margin: 30px 0 15px 0;
            -webkit-print-color-adjust: exact;
          }

          .metadata-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }

          .metadata-table td {
            border: 1px solid #000;
            padding: 10px 15px;
            vertical-align: top;
          }

          .field-label {
            font-size: 8pt;
            font-weight: 800;
            color: #475569;
            text-transform: uppercase;
            display: block;
            margin-bottom: 4px;
          }

          .field-value {
            font-size: 11pt;
            font-weight: 700;
            color: #000;
          }

          .desc-box {
            border: 1px solid #000;
            padding: 20px;
            font-size: 11pt;
            line-height: 1.6;
            text-align: justify;
            min-height: 100px;
          }

          .photo-grid-print {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 20px !important;
            page-break-inside: auto;
          }

          .photo-card {
            border: 1px solid #000;
            border-radius: 4px;
            overflow: hidden;
            page-break-inside: avoid;
            margin-bottom: 10px;
          }

          .photo-card img {
            width: 100%;
            height: 250px;
            object-fit: cover;
          }

          .photo-caption {
            background: #000;
            color: #fff;
            font-size: 8pt;
            font-weight: bold;
            padding: 5px 10px;
            text-align: center;
          }

          .parecer-tecnico {
            border-left: 8px solid #0F172A;
            background: #f8fafc !important;
            padding: 30px;
            font-style: italic;
            font-size: 12pt;
            line-height: 1.8;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
          }

          .signature-section {
            margin-top: 80px;
            display: flex !important;
            justify-content: space-around;
            page-break-inside: avoid;
          }

          .signature-box {
            width: 250px;
            border-top: 1px solid #000;
            text-align: center;
            padding-top: 10px;
            font-size: 9pt;
            font-weight: bold;
          }

          .footer-print {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8pt;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
          }

          /* Força quebra de página se necessário */
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>

      {/* INTERFACE WEB (Não aparece no PDF) */}
      <div className="flex flex-col md:flex-row justify-between mb-10 gap-4 print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-brand-blue transition-colors">
          <Icons.ArrowLeft size={16} /> Voltar
        </button>
        <div className="flex items-center gap-4">
          <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase text-white shadow-lg ${request.status === RequestStatus.COMPLETED ? 'bg-emerald-500' : 'bg-brand-blue'}`}>
            {request.status}
          </div>
          <button onClick={printVoucher} className="bg-brand-blue text-brand-accent px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-glow hover:bg-black transition-all flex items-center gap-3">
            <Icons.Download size={18} /> Gerar Laudo Profissional
          </button>
        </div>
      </div>

      {/* DOCUMENTO DE LAUDO (ESTRUTURA DE IMPRESSÃO) */}
      <div id="laudo-tecnico-oficial" className="bg-white p-0 md:p-14 md:border md:border-slate-100 md:rounded-[3rem] md:shadow-premium print:p-0 print:border-none print:shadow-none print-container">
        
        {/* CABEÇALHO TIMBRADO */}
        <div className="print-header">
           <div className="flex items-center gap-5">
              <div className="bg-brand-blue p-3 rounded-xl">
                 <Icons.Building size={40} className="text-brand-accent" />
              </div>
              <div>
                 <h1 className="text-3xl font-black text-brand-blue tracking-tighter">Facilities<span className="text-brand-accent">CON</span></h1>
                 <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Engenharia e Gestão de Facilities</p>
              </div>
           </div>
           <div className="text-right">
              <h2 className="text-2xl font-black text-slate-900 mb-1">LAUDO TÉCNICO</h2>
              <p className="text-[11px] font-black uppercase text-brand-accent tracking-widest">Protocolo OS: #{request.protocol}</p>
           </div>
        </div>

        {/* I. IDENTIFICAÇÃO */}
        <div className="section-title">I. Identificação Técnica</div>
        <table className="metadata-table">
           <tbody>
              <tr>
                 <td width="50%">
                    <span className="field-label">Condomínio / Unidade</span>
                    <span className="field-value">{request.condo_name} - {request.unit_info || 'Área Comum'}</span>
                 </td>
                 <td width="50%">
                    <span className="field-label">Protocolo de Registro</span>
                    <span className="field-value">OS-{request.protocol}</span>
                 </td>
              </tr>
              <tr>
                 <td>
                    <span className="field-label">Data de Abertura</span>
                    <span className="field-value">{creationDate} às {creationTime}</span>
                 </td>
                 <td>
                    <span className="field-label">Data de Finalização</span>
                    <span className="field-value">{completionDate || 'Serviço em Execução'}</span>
                 </td>
              </tr>
              <tr>
                 <td>
                    <span className="field-label">Vertical Técnica</span>
                    <span className="field-value uppercase">{request.type}</span>
                 </td>
                 <td>
                    <span className="field-label">Responsável Técnico</span>
                    <span className="field-value">{request.professional_name || 'Equipe FacilitiesCON'}</span>
                 </td>
              </tr>
           </tbody>
        </table>

        {/* II. DESCRIÇÃO */}
        <div className="section-title">II. Descrição da Ocorrência</div>
        <div className="desc-box">
           {request.description}
        </div>

        {/* III. FOTOS ANTES */}
        <div className="section-title">III. Registro Fotográfico - Diagnóstico</div>
        <div className="photo-grid-print">
           {(request.photos_before || request.photos || []).map((img, i) => (
              <div key={i} className="photo-card">
                 <img src={img} alt="Antes" />
                 <div className="photo-caption">FOTO DE DIAGNÓSTICO #{i+1}</div>
              </div>
           ))}
        </div>

        {/* IV. FOTOS DEPOIS */}
        {request.status === RequestStatus.COMPLETED && (
           <>
              <div className="section-title">IV. Registro Fotográfico - Conclusão</div>
              <div className="photo-grid-pdf photo-grid-print">
                 {(request.photos_after || []).map((img, i) => (
                    <div key={i} className="photo-card">
                       <img src={img} alt="Depois" />
                       <div className="photo-caption">FOTO DE CONCLUSÃO #{i+1}</div>
                    </div>
                 ))}
              </div>

              {/* V. PARECER TÉCNICO */}
              <div className="section-title">V. Parecer Técnico Final</div>
              <div className="parecer-tecnico">
                 {request.technical_report}
              </div>

              <div className="mt-10 p-6 border border-slate-200 rounded-xl text-[10px] text-slate-500 italic">
                 Este documento certifica que os reparos descritos foram executados de acordo com as normas vigentes (ABNT) e possuem garantia legal de 90 dias para mão de obra, contados a partir da data de encerramento deste laudo.
              </div>

              {/* ASSINATURAS */}
              <div className="signature-section">
                 <div className="signature-box">
                    Assinatura Responsável Técnico
                    <p className="font-normal text-[7pt] text-slate-400 mt-1">FacilitiesCON Engenharia</p>
                 </div>
                 <div className="signature-box">
                    Visto do Cliente / Síndico
                    <p className="font-normal text-[7pt] text-slate-400 mt-1">{request.condo_name}</p>
                 </div>
              </div>
           </>
        )}

        {/* RODAPÉ DO PDF */}
        <div className="hidden print:block footer-print">
           <p>© {new Date().getFullYear()} {company?.company_name} | CNPJ: {company?.cnpj} | {company?.address}</p>
           <p>Autenticidade digital garantida pelo Hash: {id?.toUpperCase()}</p>
        </div>
      </div>

      {/* TIMELINE (Somente Web) */}
      <div className="pt-20 print:hidden timeline-section max-w-4xl">
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

      {/* MODAL DE FINALIZAÇÃO (Web) */}
      {showFinishModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-brand-dark/95 backdrop-blur-md p-4 no-print">
           <div className="bg-white rounded-[4rem] w-full max-w-2xl p-8 md:p-12 shadow-premium relative overflow-y-auto max-h-[90vh]">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner">
                  <Icons.FileText size={32} />
                </div>
                <h3 className="text-3xl font-black font-heading text-slate-900 tracking-tight">Finalizar e Gerar Laudo</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fotos de Entrada</label>
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fotos de Conclusão</label>
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

              <textarea 
                className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] outline-none min-h-[150px] mb-10 font-medium text-slate-700 shadow-inner focus:ring-4 focus:ring-emerald-500/5 transition-all" 
                placeholder="Escreva o parecer técnico detalhado..." 
                value={technicalReport} 
                onChange={(e) => setTechnicalReport(e.target.value)} 
              />
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => updateStatus(RequestStatus.COMPLETED, 'Laudo Técnico Emitido', 'O serviço foi finalizado e o laudo oficial está disponível.', { 
                    technical_report: technicalReport,
                    photos_before: photosBefore,
                    photos_after: photosAfter
                  })} 
                  disabled={!technicalReport || actionLoading} 
                  className="w-full bg-emerald-500 text-white py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-all disabled:opacity-30"
                >
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
