
import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockSupabase';
import { Condominium, User, UserRole } from '../../types';
import { Icons } from '../../components/Icons';

const AdminCondos: React.FC = () => {
  const [condos, setCondos] = useState<Condominium[]>([]);
  const [syndics, setSyndics] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Condominium | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    syndic_id: '',
    towers: 1,
    residents_count: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [condoData, userData] = await Promise.all([
        db.getCondominiums(),
        db.getUsers()
      ]);
      setCondos(condoData);
      setSyndics(userData.filter(u => u.role === UserRole.SYNDIC));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (condo: Condominium | null = null) => {
    if (condo) {
      setEditing(condo);
      setFormData({
        name: condo.name,
        address: condo.address,
        syndic_id: condo.syndic_id || '',
        towers: condo.towers,
        residents_count: condo.residents_count
      });
    } else {
      setEditing(null);
      setFormData({ name: '', address: '', syndic_id: '', towers: 1, residents_count: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedSyndic = syndics.find(s => s.id === formData.syndic_id);
      
      const payload: Partial<Condominium> = {
        name: formData.name,
        address: formData.address,
        syndic_id: formData.syndic_id || undefined,
        syndic_name: selectedSyndic ? selectedSyndic.name : 'Não Atribuído',
        towers: Number(formData.towers),
        residents_count: Number(formData.residents_count)
      };

      if (editing) {
        await db.createCondominium({ ...payload, id: editing.id }); // Upsert via Supabase service
      } else {
        await db.createCondominium(payload);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert('Erro ao salvar condomínio: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if(window.confirm('Excluir este condomínio? Registros e moradores vinculados podem ser afetados.')) {
      try {
        await db.deleteCondominium(id);
        setCondos(prev => prev.filter(c => c.id !== id));
      } catch (err: any) {
        alert('Erro ao excluir condomínio.');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black font-heading text-slate-900 tracking-tight">Condomínios <span className="text-brand-accent">Atendidos</span></h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Gestão de empreendimentos e responsáveis técnicos.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-brand-blue text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-premium hover:bg-black transition-all flex items-center gap-3"
        >
          <Icons.Plus size={18} className="text-brand-accent" /> Novo Condomínio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center"><Icons.Loader className="animate-spin inline text-brand-blue" size={32} /></div>
        ) : condos.length === 0 ? (
          <div className="col-span-full py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-400 font-black uppercase tracking-widest text-xs">
            <Icons.Building2 size={48} className="mb-4 opacity-20" />
            Nenhum condomínio registrado.
          </div>
        ) : condos.map(condo => (
          <div key={condo.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-premium transition-all duration-500 relative">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-brand-blue group-hover:bg-brand-accent group-hover:text-brand-blue transition-all">
                <Icons.Building2 size={28} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => openModal(condo)} className="p-2 text-slate-400 hover:text-brand-blue transition-colors"><Icons.Edit2 size={18} /></button>
                <button onClick={() => handleDelete(condo.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Icons.Trash2 size={18} /></button>
              </div>
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-1">{condo.name}</h3>
            <p className="text-slate-500 text-xs mb-6 flex items-center gap-2 font-medium">
               <Icons.MapPin size={14} className="text-brand-accent" /> {condo.address}
            </p>

            <div className="bg-slate-50 p-6 rounded-2xl space-y-3 mb-6">
               <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Síndico Responsável</span>
                  <span className="text-xs font-bold text-slate-900">{condo.syndic_name || 'Nenhum'}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unidades / Torres</span>
                  <span className="text-xs font-bold text-slate-900">{condo.residents_count} / {condo.towers}</span>
               </div>
            </div>

            <button onClick={() => openModal(condo)} className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all">
               Gerenciar Detalhes
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-dark/80 backdrop-blur-sm p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-premium animate-in zoom-in-95 duration-200">
              <h3 className="text-2xl font-black font-heading text-slate-900 mb-8 tracking-tight">
                {editing ? 'Editar Condomínio' : 'Novo Condomínio'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Empreendimento</label>
                    <input 
                      required 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-brand-accent/5" 
                      placeholder="Ex: Residencial Diamond" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Completo</label>
                    <input 
                      required 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-brand-accent/5" 
                      placeholder="Rua, Número, Bairro" 
                      value={formData.address} 
                      onChange={e => setFormData({...formData, address: e.target.value})} 
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Síndico Responsável</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-brand-accent/5 appearance-none"
                      value={formData.syndic_id}
                      onChange={e => setFormData({...formData, syndic_id: e.target.value})}
                    >
                       <option value="">Selecionar Síndico Cadastrado...</option>
                       {syndics.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Torres</label>
                      <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900" value={formData.towers} onChange={e => setFormData({...formData, towers: parseInt(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidades</label>
                      <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900" value={formData.residents_count} onChange={e => setFormData({...formData, residents_count: parseInt(e.target.value)})} />
                    </div>
                 </div>
                 
                 <div className="pt-6 flex flex-col gap-3">
                    <button type="submit" className="w-full py-5 bg-brand-blue text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-premium hover:bg-black transition-all">
                       {editing ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                    </button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminCondos;
