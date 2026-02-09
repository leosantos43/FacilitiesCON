
import React, { useState } from 'react';
import { User } from '../../types';
import { db } from '../../services/mockSupabase';
import { Icons } from '../../components/Icons';

interface Props {
  user: User;
}

const UserSettings: React.FC<Props> = ({ user }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As novas senhas não coincidem.' });
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' });
      setLoading(false);
      return;
    }

    // Primeiro valida se a senha atual está correta tentando um login silencioso
    const { user: verifiedUser, error: loginError } = await db.login(user.email, currentPassword);

    if (!verifiedUser || loginError) {
       setMessage({ type: 'error', text: 'Senha atual incorreta. Verifique e tente novamente.' });
       setLoading(false);
       return;
    }

    // Se validou, procede com a troca
    const result = await db.changePassword(user.id, newPassword);

    if (result.success) {
      setMessage({ type: 'success', text: 'Sua senha foi atualizada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setMessage({ type: 'error', text: result.error || 'Não foi possível atualizar a senha no momento.' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold font-heading text-slate-900 tracking-tight">Meus <span className="text-brand-accent">Dados</span></h1>
        <p className="text-slate-500">Gerencie sua segurança e dados de acesso ao sistema.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 md:p-10">
           <div className="flex items-center gap-6 mb-10 pb-10 border-b border-slate-50">
             <div className="w-20 h-20 rounded-2xl bg-brand-blue flex items-center justify-center text-brand-accent text-3xl font-black shadow-lg">
               {user?.name?.charAt(0) || '?'}
             </div>
             <div>
               <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
               <p className="text-slate-500 font-medium">{user.email}</p>
               <div className="flex gap-2 mt-2">
                  <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest border">
                    {user.role}
                  </span>
                  {user.condo_name && (
                    <span className="text-[10px] font-black bg-blue-50 text-brand-blue px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100">
                      {user.condo_name}
                    </span>
                  )}
               </div>
             </div>
           </div>

           <div>
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl flex items-center gap-3 text-slate-900">
                  <Icons.Lock size={22} className="text-brand-accent" />
                  Segurança da Conta
                </h3>
                <button 
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="text-xs font-bold text-brand-blue bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition"
                >
                  {showPasswords ? 'Ocultar Digitação' : 'Ver Digitação'}
                </button>
             </div>

             {message && (
               <div className={`p-5 rounded-2xl mb-8 text-sm flex items-center gap-4 border-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
                 message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
               }`}>
                 {message.type === 'success' ? <Icons.CheckCircle size={24} /> : <Icons.AlertTriangle size={24} />}
                 <span className="font-black">{message.text}</span>
               </div>
             )}

             <form onSubmit={handleChangePassword} className="space-y-6 max-w-lg">
               <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Senha Atual</label>
                 <div className="relative">
                   <Icons.Key className="absolute left-4 top-4 text-slate-300" size={18} />
                   <input 
                     type={showPasswords ? 'text' : 'password'}
                     required
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-12 focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent outline-none transition-all font-bold text-slate-700"
                     placeholder="Sua senha atual"
                     value={currentPassword}
                     onChange={(e) => setCurrentPassword(e.target.value)}
                   />
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nova Senha</label>
                   <input 
                     type={showPasswords ? 'text' : 'password'}
                     required
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent outline-none transition-all font-bold text-slate-700"
                     placeholder="Mín. 6 caracteres"
                     value={newPassword}
                     onChange={(e) => setNewPassword(e.target.value)}
                   />
                 </div>
                 <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Confirmar Nova</label>
                   <input 
                     type={showPasswords ? 'text' : 'password'}
                     required
                     className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent outline-none transition-all font-bold text-slate-700"
                     placeholder="Repita a senha"
                     value={confirmPassword}
                     onChange={(e) => setConfirmPassword(e.target.value)}
                   />
                 </div>
               </div>
               
               <div className="pt-6">
                 <button 
                   type="submit" 
                   disabled={loading}
                   className="w-full md:w-auto px-12 py-5 bg-brand-blue text-white font-black rounded-2xl hover:bg-black transition-all disabled:opacity-70 flex items-center justify-center gap-3 shadow-premium active:scale-95 uppercase tracking-widest text-[10px]"
                 >
                   {loading ? <Icons.Loader className="animate-spin" /> : 'Atualizar Minha Senha'}
                 </button>
               </div>
             </form>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
