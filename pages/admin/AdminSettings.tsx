
import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockSupabase';
import { CompanySettings } from '../../types';
import { Icons } from '../../components/Icons';

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const data = await db.getCompanySettings();
    setSettings(data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    setMessage('');

    try {
      await db.saveCompanySettings(settings);
      setMessage('Configurações atualizadas com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Erro ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center"><Icons.Loader className="animate-spin inline" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-3xl font-black font-heading text-slate-900 tracking-tight">Dados da <span className="text-brand-accent">Unidade</span></h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">Configure as informações da FacilitiesCON que aparecem nos laudos e PDFs.</p>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 p-10 md:p-14">
        <form onSubmit={handleSave} className="space-y-8">
          {message && (
            <div className="bg-emerald-50 text-emerald-600 p-5 rounded-2xl border border-emerald-100 font-black uppercase text-[10px] tracking-widest flex items-center gap-3">
               <Icons.CheckCircle size={20} /> {message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Razão Social</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 font-bold text-slate-900 focus:ring-4 focus:ring-brand-accent/5 outline-none transition-all"
                  value={settings?.company_name}
                  onChange={e => setSettings({...settings!, company_name: e.target.value})}
                  placeholder="FacilitiesCON Engenharia Ltda"
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ Oficial</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 font-bold text-slate-900 focus:ring-4 focus:ring-brand-accent/5 outline-none transition-all"
                  value={settings?.cnpj}
                  onChange={e => setSettings({...settings!, cnpj: e.target.value})}
                  placeholder="00.000.000/0001-00"
                />
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço da Sede / Filial</label>
             <input 
               className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 font-bold text-slate-900 focus:ring-4 focus:ring-brand-accent/5 outline-none transition-all"
               value={settings?.address}
               onChange={e => setSettings({...settings!, address: e.target.value})}
               placeholder="Av. Paulista, 1000 - São Paulo, SP"
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone de Contato</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 font-bold text-slate-900 focus:ring-4 focus:ring-brand-accent/5 outline-none transition-all"
                  value={settings?.phone}
                  onChange={e => setSettings({...settings!, phone: e.target.value})}
                  placeholder="(11) 98888-7777"
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Operacional</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 font-bold text-slate-900 focus:ring-4 focus:ring-brand-accent/5 outline-none transition-all"
                  value={settings?.email}
                  onChange={e => setSettings({...settings!, email: e.target.value})}
                  placeholder="contato@facilitiescon.com.br"
                />
             </div>
          </div>

          <div className="pt-10 border-t border-slate-50 flex justify-end">
             <button 
               type="submit" 
               disabled={isSaving}
               className="bg-brand-blue text-white px-12 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-premium hover:bg-black transition-all flex items-center gap-3"
             >
                {isSaving ? <Icons.Loader className="animate-spin" /> : <><Icons.CheckCircle size={20} className="text-brand-accent" /> Salvar Configurações</>}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
