
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../services/mockSupabase';
import { UserRole } from '../../types';
import { Icons } from '../../components/Icons';

const AdminRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    password: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        role: UserRole.ADMIN // Forçando papel de administrador
      });
      
      if (!success) {
        setError(authError || 'Erro ao realizar cadastro.');
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/staff'), 3000);
      }
    } catch (err: any) {
      setError('Erro de conexão com o Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-brand-accent rounded-full blur-[150px] opacity-10"></div>
      
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-[3rem] shadow-premium border border-white/10 overflow-hidden relative z-10">
        <div className="bg-brand-blue/50 p-12 text-center border-b border-white/5">
           <div className="w-16 h-16 bg-brand-accent rounded-2xl flex items-center justify-center text-brand-blue mx-auto mb-6 shadow-glow">
              <Icons.ShieldCheck size={32} />
           </div>
           <h1 className="text-2xl font-black font-heading text-white tracking-tight italic">Novo Gestor Staff</h1>
           <p className="text-brand-accent text-[10px] mt-2 uppercase tracking-[0.3em] font-black">FacilitiesCON Engenharia</p>
        </div>
        
        <div className="p-12">
          {success ? (
            <div className="text-center space-y-8 animate-in zoom-in duration-500">
               <div className="w-20 h-20 bg-brand-accent/20 rounded-full flex items-center justify-center mx-auto text-brand-accent">
                  <Icons.CheckCircle size={48} />
               </div>
               <h2 className="text-xl font-black text-white">Admin Criado!</h2>
               <p className="text-slate-400 font-medium text-sm leading-relaxed">Seu acesso administrativo foi configurado e validado. Redirecionando para o login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
               {error && <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 flex items-center gap-2">
                 <Icons.AlertTriangle size={16} /> {error}
               </div>}
               
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input 
                    required 
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white focus:border-brand-accent transition-all" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                  <input 
                    required 
                    type="email" 
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white focus:border-brand-accent transition-all" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha de Gestão</label>
                  <input 
                    required 
                    type="password" 
                    placeholder="Mínimo 6 caracteres" 
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white focus:border-brand-accent transition-all" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                  />
               </div>

               <button type="submit" disabled={loading} className="w-full bg-brand-accent text-brand-blue font-black py-5 rounded-2xl mt-4 shadow-glow hover:bg-white transition-all active:scale-95 uppercase text-[10px] tracking-widest">
                  {loading ? 'Processando...' : 'Criar Acesso Admin'}
               </button>

               <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest mt-6">
                 Já possui acesso? <Link to="/staff" className="text-brand-accent hover:underline">Voltar ao Login</Link>
               </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
