
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Priority, Service, RequestStatus } from '../../types';
import { db } from '../../services/mockSupabase';
import { Icons } from '../../components/Icons';
import { compressImage } from '../../services/imageUtils';

interface Props {
  user: User;
}

const NewRequest: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [scope, setScope] = useState<'condo' | 'private'>('condo');
  const [formData, setFormData] = useState({
    type: '',
    priority: Priority.LOW,
    description: '',
  });

  useEffect(() => {
    const loadServices = async () => {
      const services = await db.getServices();
      setAvailableServices(services);
      if (services.length > 0) {
        setFormData(prev => ({ ...prev, type: services[0].title }));
      } else {
        setFormData(prev => ({ ...prev, type: 'Manutenção Geral' }));
      }
    };
    loadServices();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 3 - photos.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    setLoading(true);
    try {
      const compressedImages = await Promise.all(
        filesToProcess.map(file => compressImage(file as File))
      );
      setPhotos(prev => [...prev, ...compressedImages]);
    } catch (err) {
      alert('Erro ao processar imagens.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type) return alert('Selecione o tipo de serviço.');
    
    setLoading(true);
    try {
      await db.createServiceRequest({
        ...formData,
        is_private: scope === 'private',
        photos
      }, user);
      navigate('/app');
    } catch (err) {
      alert('Erro ao criar chamado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/app')} className="mb-4 text-slate-400 hover:text-brand-blue flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors">
            <Icons.ArrowLeft size={16} /> Voltar ao Painel
          </button>
          <h1 className="text-3xl md:text-4xl font-black font-heading text-slate-900 tracking-tight">Registro de Ocorrência</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Relate a demanda técnica para iniciar o protocolo de atendimento.</p>
        </div>
        <div className="hidden md:block p-4 bg-brand-accent/10 rounded-2xl">
          <Icons.Wrench className="text-brand-accent" size={32} />
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-8 md:p-12">
        <form onSubmit={handleSubmit} className="space-y-10">
          
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Abrangência do Chamado</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setScope('condo')}
                className={`p-6 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${scope === 'condo' ? 'border-brand-blue bg-blue-50/50 text-brand-blue' : 'border-slate-100 text-slate-400'}`}
              >
                <Icons.Building size={24} />
                <span className="font-black uppercase text-[11px] tracking-widest">Área Comum</span>
              </button>
              <button 
                type="button"
                onClick={() => setScope('private')}
                className={`p-6 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${scope === 'private' ? 'border-brand-accent bg-blue-50/50 text-brand-blue' : 'border-slate-100 text-slate-400'}`}
              >
                <Icons.Home size={24} />
                <span className="font-black uppercase text-[11px] tracking-widest">Unidade Privada</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vertical Especialista</label>
              <div className="relative group">
                <Icons.Zap className="absolute left-5 top-4.5 text-slate-300 group-focus-within:text-brand-accent transition-colors" size={20} />
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full pl-14 pr-6 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent outline-none appearance-none text-slate-800 font-bold text-sm transition-all"
                >
                  {availableServices.length > 0 ? (
                    availableServices.map(s => <option key={s.id} value={s.title}>{s.title}</option>)
                  ) : (
                    <>
                      <option>Manutenção Predial</option>
                      <option>Elétrica Técnica</option>
                      <option>Hidráulica / Prumadas</option>
                    </>
                  )}
                </select>
                <Icons.ArrowRight className="absolute right-5 top-5 text-slate-300 pointer-events-none rotate-90" size={16} />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nível de Prioridade</label>
              <div className="relative group">
                <Icons.AlertTriangle className="absolute left-5 top-4.5 text-slate-300 group-focus-within:text-brand-accent transition-colors" size={20} />
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value as Priority})}
                  className="w-full pl-14 pr-6 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent outline-none appearance-none text-slate-800 font-bold text-sm transition-all"
                >
                  <option value={Priority.LOW}>Baixa (Preventiva/Rotina)</option>
                  <option value={Priority.MEDIUM}>Média (Corretiva Leve)</option>
                  <option value={Priority.HIGH}>Alta (Urgência Crítica)</option>
                </select>
                <Icons.ArrowRight className="absolute right-5 top-5 text-slate-300 pointer-events-none rotate-90" size={16} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição Técnica da Ocorrência</label>
            <textarea
              required
              rows={6}
              className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent outline-none resize-none text-slate-700 font-medium text-sm transition-all shadow-inner"
              placeholder="Descreva detalhadamente o problema encontrado..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registro de Evidências (Máx 3)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               {photos.map((photo, index) => (
                 <div key={index} className="relative aspect-square rounded-3xl overflow-hidden border border-slate-100 bg-slate-50 group">
                    <img src={photo} className="w-full h-full object-cover" alt={`Preview ${index}`} />
                    <button 
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                    >
                      <Icons.Trash size={14} />
                    </button>
                 </div>
               ))}
               
               {photos.length < 3 && (
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="aspect-square border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center hover:bg-slate-50 hover:border-brand-accent transition-all cursor-pointer group"
                 >
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-brand-accent/10 group-hover:text-brand-accent mb-2">
                       <Icons.Upload size={24} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Add Foto</span>
                 </div>
               )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
          </div>

          <div className="pt-8 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-end gap-4">
            <button type="button" onClick={() => navigate('/app')} className="w-full sm:w-auto px-8 py-5 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-900 transition-colors">
              Descartar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-12 py-5 bg-brand-blue text-white font-black rounded-2xl shadow-premium hover:bg-black transition-all flex justify-center items-center gap-3 uppercase text-[10px] tracking-widest"
            >
              {loading ? 'Processando...' : <><Icons.CheckCircle size={20} className="text-brand-accent" /> Registrar Protocolo</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewRequest;
