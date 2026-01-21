
import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockSupabase';
import { Service } from '../../types';
import { Icons } from '../../components/Icons';

const AdminServices: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'Wrench'
  });

  // Gama expandida de ícones para abranger todas as áreas possíveis de um condomínio
  const availableIcons = [
    'Wrench', 'Zap', 'Droplet', 'Shield', 'Cpu', 'Hammer', 'Building', 
    'Smartphone', 'Monitor', 'Key', 'Globe', 'Activity', 'Award', 'CheckCircle', 
    'Star', 'Camera', 'Wifi', 'Fan', 'Lightbulb', 'Plug', 'Wind', 'HardDrive', 
    'Paintbrush', 'Box', 'Thermometer', 'ShieldAlert', 'HardHat', 'Construction', 'Waves'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await db.getServices();
      setServices(data);
    } catch (e) {
      console.error("Falha ao carregar serviços", e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (service: Service | null = null) => {
    if (service) {
      setEditing(service);
      setFormData({
        title: service.title,
        description: service.description,
        icon: service.icon
      });
    } else {
      setEditing(null);
      setFormData({ title: '', description: '', icon: 'Wrench' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Service> = {
        title: formData.title,
        description: formData.description,
        icon: formData.icon
      };

      if (editing?.id) {
        payload.id = editing.id;
      }

      await db.saveService(payload);
      
      setIsModalOpen(false);
      setFormData({ title: '', description: '', icon: 'Wrench' });
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar no banco de dados: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir esta vertical de serviço? Ela sumirá imediatamente do site institucional.')) {
      setLoading(true);
      try {
        await db.deleteService(id);
        await loadData();
      } catch (e: any) {
        alert('Erro ao excluir: ' + e.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black font-heading text-slate-900 tracking-tight">Gestão de <span className="text-brand-accent">Verticais</span></h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Controle os serviços exibidos na Home do site.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-brand-blue text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-premium hover:bg-black transition-all flex items-center gap-3"
        >
          <Icons.Plus size={18} className="text-brand-accent" /> Nova Vertical
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center"><Icons.Loader className="animate-spin inline text-brand-blue" size={32} /></div>
        ) : services.length === 0 ? (
          <div className="col-span-full py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-400 font-black uppercase tracking-widest text-xs">
            <Icons.Inbox size={48} className="mb-4 opacity-20" />
            Nenhuma vertical cadastrada.
          </div>
        ) : services.map(s => {
          const IconComp = (Icons as any)[s.icon] || Icons.Wrench;
          return (
            <article key={s.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-premium transition-all duration-500 relative">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-brand-blue group-hover:bg-brand-accent group-hover:text-brand-blue transition-all">
                  <IconComp size={28} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(s)} className="p-2 text-slate-400 hover:text-brand-blue transition-colors" title="Editar"><Icons.Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Excluir"><Icons.Trash2 size={18} /></button>
                </div>
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-2">{s.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-medium line-clamp-3">
                {s.description}
              </p>
            </article>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-dark/80 backdrop-blur-sm p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-premium animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black font-heading text-slate-900 tracking-tight">
                  {editing ? 'Editar Vertical' : 'Nova Vertical'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><Icons.X size={24} /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Serviço</label>
                    <input 
                      required 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-brand-accent/5 transition-all" 
                      placeholder="Ex: Elétrica Predial" 
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})} 
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição Curta (SEO Friendly)</label>
                    <textarea 
                      required 
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-brand-accent/5 resize-none transition-all" 
                      placeholder="Descreva este serviço para atrair mais clientes..." 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                    />
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selecione um Ícone Representativo</label>
                      <span className="text-[10px] font-black text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-full">{availableIcons.length} Opções</span>
                    </div>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-3 max-h-56 overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-200 custom-scrollbar shadow-inner">
                       {availableIcons.map(iconName => {
                         const IconOption = (Icons as any)[iconName] || Icons.Wrench;
                         return (
                           <button 
                             key={iconName}
                             type="button"
                             onClick={() => setFormData({...formData, icon: iconName})}
                             className={`p-3 rounded-xl flex items-center justify-center transition-all group ${formData.icon === iconName ? 'bg-brand-blue text-brand-accent shadow-lg scale-110' : 'bg-white text-slate-400 hover:bg-white hover:text-brand-blue hover:shadow-sm'}`}
                             title={iconName}
                           >
                             <IconOption size={20} className={formData.icon === iconName ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
                           </button>
                         );
                       })}
                    </div>
                 </div>
                 
                 <div className="pt-6 flex flex-col gap-3">
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="w-full py-5 bg-brand-blue text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-premium hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                       {isSaving ? <Icons.Loader className="animate-spin" size={16} /> : (editing ? 'Confirmar Alterações' : 'Publicar Vertical')}
                    </button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-900 transition-colors">Cancelar</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminServices;
