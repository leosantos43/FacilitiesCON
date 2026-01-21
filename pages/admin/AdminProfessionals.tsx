
import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../services/mockSupabase';
import { Professional } from '../../types';
import { Icons } from '../../components/Icons';
import { compressImage } from '../../services/imageUtils';

const AdminProfessionals: React.FC = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await db.getProfessionals();
      setProfessionals(data);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 400, 0.7);
      setPhoto(compressed);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const prof: any = {
      name: formData.get('name') as string,
      cpf: formData.get('cpf') as string,
      phone: formData.get('phone') as string,
      specialty: formData.get('specialty') as string,
      active: formData.get('active') === 'on',
      photo: photo
    };
    
    if (editing) prof.id = editing.id;

    try {
      await db.saveProfessional(prof);
      setIsModalOpen(false);
      setPhoto(null);
      loadData();
    } catch (err: any) {
      alert('Erro ao salvar profissional: ' + err.message);
    }
  };

  const filtered = professionals.filter(p => 
    p.name.toLowerCase().includes(filter.toLowerCase()) || 
    p.specialty.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black font-heading text-slate-900 tracking-tight">Base de <span className="text-brand-accent">Profissionais</span></h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Gestão centralizada de especialistas e técnicos homologados.</p>
        </div>
        <button 
          onClick={() => { setEditing(null); setPhoto(null); setIsModalOpen(true); }}
          className="bg-brand-blue text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-premium hover:bg-black transition-all flex items-center gap-3"
        >
          <Icons.PlusCircle size={18} className="text-brand-accent" /> Adicionar Novo Prestador
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 max-w-md">
        <Icons.Search size={20} className="text-slate-300 ml-2" />
        <input 
          type="text" 
          placeholder="Filtrar por nome ou especialidade..." 
          className="w-full bg-transparent outline-none font-bold text-sm text-slate-700"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center"><Icons.Loader className="animate-spin inline text-brand-accent" size={40} /></div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
             <Icons.Users size={48} className="mb-4 opacity-20" />
             <p className="font-black uppercase text-xs tracking-widest">Nenhum profissional localizado.</p>
          </div>
        ) : filtered.map(p => (
          <div key={p.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-premium transition-all duration-500">
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-brand-blue group-hover:bg-brand-accent transition-all shadow-inner overflow-hidden border border-slate-50">
                {p.photo ? (
                  <img src={p.photo} className="w-full h-full object-cover" alt={p.name} />
                ) : (
                  <Icons.User size={28} />
                )}
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${p.active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                {p.active ? 'Ativo' : 'Pausado'}
              </span>
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-1">{p.name}</h3>
            <p className="text-brand-accent text-[10px] font-black uppercase tracking-widest mb-6">{p.specialty}</p>
            
            <div className="space-y-3 mb-8">
               <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                  <Icons.FileText size={16} className="text-slate-300" /> CPF: {p.cpf}
               </div>
               <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                  <Icons.MessageCircle size={16} className="text-slate-300" /> {p.phone}
               </div>
            </div>

            <div className="flex gap-2">
               <button 
                  onClick={() => { setEditing(p); setPhoto(p.photo || null); setIsModalOpen(true); }}
                  className="flex-1 bg-slate-50 text-slate-600 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
               >
                  Editar Perfil
               </button>
               <a 
                  href={`https://wa.me/55${p.phone.replace(/\D/g, '')}`} 
                  target="_blank" 
                  className="p-3.5 bg-brand-green/10 text-brand-green rounded-xl hover:bg-brand-green hover:text-white transition-all shadow-sm border border-brand-green/10"
               >
                  <Icons.MessageCircle size={18} />
               </a>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-dark/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-premium animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black font-heading text-slate-900 mb-8 tracking-tight flex items-center gap-3">
               <Icons.UserPlus className="text-brand-accent" /> {editing ? 'Atualizar Prestador' : 'Cadastrar Especialista'}
            </h2>
            <form onSubmit={handleSave} className="space-y-5">
              
              <div className="flex justify-center mb-6">
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-24 h-24 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-accent transition-all overflow-hidden relative group"
                 >
                   {photo ? (
                     <img src={photo} className="w-full h-full object-cover" />
                   ) : (
                     <Icons.Upload size={24} className="text-slate-300" />
                   )}
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[8px] font-black uppercase">Trocar Foto</div>
                 </div>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input name="name" defaultValue={editing?.name} required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent transition-all" placeholder="Nome do profissional" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF (Identificação)</label>
                   <input name="cpf" defaultValue={editing?.cpf} required placeholder="000.000.000-00" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent transition-all" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                   <input name="phone" defaultValue={editing?.phone} required placeholder="11999999999" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent transition-all" />
                 </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especialidade / Vertical</label>
                <input name="specialty" defaultValue={editing?.specialty} required placeholder="Ex: Elétrica / CFTV" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent transition-all" />
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <input type="checkbox" name="active" id="active" defaultChecked={editing ? editing.active : true} className="w-5 h-5 accent-brand-accent" />
                <label htmlFor="active" className="text-xs font-bold text-slate-600">Disponível para novos chamados</label>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button type="submit" className="w-full py-5 bg-brand-blue text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-premium hover:bg-black transition-all">
                   {editing ? 'Salvar Alterações' : 'Concluir Cadastro'}
                </button>
                <button type="button" onClick={() => { setIsModalOpen(false); setPhoto(null); }} className="w-full py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfessionals;
