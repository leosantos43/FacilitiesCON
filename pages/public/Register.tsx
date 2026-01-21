
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../services/mockSupabase';
import { Condominium, UserRole } from '../../types';
import { Icons } from '../../components/Icons';

const ResidentRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    condo_name: '',
    block: '',
    apartment: '',
    password: ''
  });
  
  const [condos, setCondos] = useState<Condominium[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    db.getCondominiums().then(setCondos);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { success, error: authError } = await db.register({
        ...formData,
        role: UserRole.RESIDENT
      });
      
      if (!success) {
        setError(authError || 'Erro ao realizar cadastro.');
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-premium border border-slate-100 overflow-hidden">
        <div className="bg-brand-blue p-10 text-white text-center">
           <div className="w-16 h-16 bg-brand-accent rounded-2xl flex items-center justify-center text-brand-blue mx-auto mb-6 shadow-glow">
              <Icons.UserPlus size={32} />
           </div>
           <h1 className="text-2xl font-black font-heading tracking-tight">Cadastro de Morador</h1>
           <p className="text-blue-200 text-xs mt-2 uppercase tracking-widest font-bold">Portal FacilitiesCON</p>
        </div>
        
        <div className="p-10">
          {success ? (
            <div className="text-center space-y-8 animate-in zoom-in duration-500">
               <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto text-brand-green">
                  <Icons.CheckCircle size={48} />
               </div>
               <h2 className="text-xl font-black text-slate-900">Solicitação Enviada!</h2>
               <p className="text-slate-500 font-medium text-sm leading-relaxed">Seu cadastro foi recebido com sucesso. Verifique seu e-mail e aguarde a validação do seu síndico para acessar o portal.</p>
               <Link to="/login" className="block w-full bg-brand-blue text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Ir para o Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
               {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-2">
                 <Icons.AlertTriangle size={16} /> {error}
               </div>}
               
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-brand-accent/5" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                    <input required type="email" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                    <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900" placeholder="11999999999" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
                 </div>
               </div>

               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seu Condomínio</label>
                  <select required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 appearance-none" value={formData.condo_name} onChange={e => setFormData({...formData, condo_name: e.target.value})}>
                     <option value="">Buscar Condomínio...</option>
                     {condos.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bloco / Torre</label>
                    <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="Ex: B" value={formData.block} onChange={e => setFormData({...formData, block: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apartamento</label>
                    <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="Ex: 102" value={formData.apartment} onChange={e => setFormData({...formData, apartment: e.target.value})} />
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                  <input required type="password" placeholder="Mínimo 6 caracteres" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
               </div>

               <button type="submit" disabled={loading} className="w-full bg-brand-accent text-brand-blue font-black py-5 rounded-2xl mt-4 shadow-glow hover:scale-105 transition-all active:scale-95 uppercase text-[10px] tracking-widest">
                  {loading ? 'Processando Cadastro...' : 'Solicitar Acesso'}
               </button>

               <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6">Já possui conta? <Link to="/login" className="text-brand-accent hover:underline">Fazer Login</Link></p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResidentRegister;
