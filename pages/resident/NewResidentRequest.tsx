
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Priority, Service } from '../../types';
import { db } from '../../services/mockSupabase';
import { Icons } from '../../components/Icons';
import { compressImage } from '../../services/imageUtils';

interface Props {
  user: User;
}

const NewResidentRequest: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<'private' | 'condo'>('private');
  const [photos, setPhotos] = useState<string[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
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
    if (!formData.type) return alert('Selecione a categoria do reparo.');

    setLoading(true);
    await db.createServiceRequest({
      ...formData,
      is_private: scope === 'private',
      photos
    }, user);
    
    setLoading(false);
    navigate('/resident');
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <button onClick={() => navigate('/resident')} className="mb-4 text-slate-400 hover:text-brand-blue flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors">
           <Icons.ArrowLeft size={16} /> Voltar
        </button>
        <h1 className="text-2xl md:text-3xl font-black font-heading text-slate-900 tracking-tight">Solicitar Atendimento</h1>
      </div>

      <div className="bg-white rounded-3xl md:rounded-[3rem] shadow-sm border border-slate-100 p-6 md:p-12">
        <form onSubmit={handleSubmit} className="space-y-8 md:space-y-10">
          
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Área de Atuação</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div 
                 onClick={() => setScope('private')}
                 className={`cursor-pointer p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all flex items-center gap-4 md:gap-5 ${
                   scope === 'private' 
                     ? 'border-brand-accent bg-blue-50/50' 
                     : 'border-slate-50 hover:border-slate-100 hover:bg-slate-50/50'
                 }`}
               >
                  <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${scope === 'private' ? 'border-brand-accent' : 'border-slate-300'}`}>
                    {scope === 'private' && <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-brand-accent rounded-full"></div>}
                  </div>
                  <div>
                    <span className={`font-black uppercase text-[10px] md:text-xs block ${scope === 'private' ? 'text-brand-blue' : 'text-slate-400'}`}>Minha Unidade</span>
                    <span className="text-[9px] md:text-[10px] text-slate-400 font-medium">Reparo no apartamento</span>
                  </div>
               </div>
               
               <div 
                 onClick={() => setScope('condo')}
                 className={`cursor-pointer p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all flex items-center gap-4 md:gap-5 ${
                   scope === 'condo' 
                     ? 'border-slate-900 bg-slate-900 text-white' 
                     : 'border-slate-50 hover:border-slate-100 hover:bg-slate-50/50'
                 }`}
               >
                  <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${scope === 'condo' ? 'border-white' : 'border-slate-300'}`}>
                     {scope === 'condo' && <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-white rounded-full"></div>}
                  </div>
                  <div>
                    <span className={`font-black uppercase text-[10px] md:text-xs block ${scope === 'condo' ? 'text-white' : 'text-slate-400'}`}>Área Comum</span>
                    <span className={`text-[9px] md:text-[10px] font-medium ${scope === 'condo' ? 'text-blue-200' : 'text-slate-400'}`}>Problema no prédio</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
              <div className="relative group">
                <Icons.Wrench className="absolute left-4 top-3.5 md:left-5 md:top-4.5 text-slate-300" size={18} />
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full pl-12 md:pl-14 pr-4 py-3 md:py-4.5 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent outline-none appearance-none font-bold text-sm text-slate-800"
                >
                  {availableServices.length > 0 ? (
                    availableServices.map(s => <option key={s.id} value={s.title}>{s.title}</option>)
                  ) : (
                    <>
                      <option>Manutenção Geral</option>
                      <option>Reparo Elétrico</option>
                      <option>Reparo Hidráulico</option>
                    </>
                  )}
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Urgência</label>
              <div className="relative group">
                <Icons.AlertTriangle className="absolute left-4 top-3.5 md:left-5 md:top-4.5 text-slate-300" size={18} />
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value as Priority})}
                  className="w-full pl-12 md:pl-14 pr-4 py-3 md:py-4.5 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent outline-none appearance-none font-bold text-sm text-slate-800"
                >
                  <option value={Priority.LOW}>Tranquilo</option>
                  <option value={Priority.MEDIUM}>Aguardando</option>
                  <option value={Priority.HIGH}>Urgente</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
            <textarea
              required
              rows={4}
              className="w-full p-5 md:p-6 bg-slate-50 border border-slate-100 rounded-2xl md:rounded-[2rem] focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent outline-none resize-none font-medium text-sm text-slate-700"
              placeholder="Descreva o que está acontecendo..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fotos (Opcional - Máx 3)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               {photos.map((photo, index) => (
                 <div key={index} className="relative aspect-square rounded-2xl md:rounded-[2rem] overflow-hidden border border-slate-100 bg-slate-50 group">
                    <img src={photo} className="w-full h-full object-cover" alt={`Preview ${index}`} />
                    <button 
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-100 transition-all"
                    >
                      <Icons.Trash size={12} />
                    </button>
                 </div>
               ))}
               
               {photos.length < 3 && (
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl md:rounded-[2rem] flex flex-col items-center justify-center hover:bg-slate-50 hover:border-brand-accent transition-all cursor-pointer group"
                 >
                    <Icons.Image size={24} className="text-slate-300 group-hover:text-brand-accent" />
                    <span className="text-[8px] md:text-[9px] font-black uppercase mt-1 text-slate-400">Add Foto</span>
                 </div>
               )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
          </div>

          <div className="pt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-4 md:gap-6">
            <button type="button" onClick={() => navigate('/resident')} className="w-full sm:w-auto text-slate-400 font-black uppercase text-[10px] tracking-widest py-3 hover:text-slate-800 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-10 py-5 bg-brand-blue text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest"
            >
              {loading ? 'Enviando...' : <><Icons.Check size={20} className="text-brand-accent" /> Enviar Agora</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewResidentRequest;
