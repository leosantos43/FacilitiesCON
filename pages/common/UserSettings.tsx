
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

    if (newPassword.length < 3) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 3 caracteres.' });
      setLoading(false);
      return;
    }

    const { user: verifiedUser, error } = await db.login(user.email, currentPassword);

    if (!verifiedUser || error) {
       setMessage({ type: 'error', text: 'Sua senha atual está incorreta.' });
       setLoading(false);
       return;
    }

    const success = await db.changePassword(user.id, newPassword);

    if (success) {
      setMessage({ type: 'success', text: 'Sua senha foi atualizada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setMessage({ type: 'error', text: 'Não foi possível atualizar a senha.' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold font-heading text-jlm-dark tracking-tight">Configurações</h1>
        <p className="text-gray-500">Gerencie sua segurança e dados de acesso.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 md:p-10">
           <div className="flex items-center gap-6 mb-10 pb-10 border-b border-gray-50">
             <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-jlm-blue to-blue-700 flex items-center justify-center text-white text-3xl font-black shadow-lg">
               {user?.name?.charAt(0) || '?'}
             </div>
             <div>
               <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
               <p className="text-gray-500 font-medium">{user.email}</p>
               <div className="flex gap-2 mt-2">
                  <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-3 py-1 rounded-full uppercase tracking-widest border">
                    {user.role}
                  </span>
                  {user.condo_name && (
                    <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100">
                      {user.condo_name}
                    </span>
                  )}
               </div>
             </div>
           </div>

           <div>
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl flex items-center gap-3 text-gray-900">
                  <Icons.Lock size={22} className="text-jlm-blue" />
                  Segurança da Conta
                </h3>
                <button 
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="text-xs font-bold text-jlm-blue bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition"
                >
                  {showPasswords ? 'Ocultar Digitação' : 'Ver Digitação'}
                </button>
             </div>

             {message && (
               <div className={`p-5 rounded-2xl mb-8 text-sm flex items-center gap-4 border-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
                 message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
               }`}>
                 {message.type === 'success' ? <Icons.CheckCircle size={24} /> : <Icons.AlertTriangle size={24} />}
                 <span className="font-bold">{message.text}</span>
               </div>
             )}

             <form onSubmit={handleChangePassword} className="space-y-5 max-w-lg">
               <div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Senha Atual</label>
                 <input 
                   type={showPasswords ? 'text' : 'password'}
                   required
                   className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-jlm-blue outline-none transition-all font-medium"
                   placeholder="Confirme sua senha atual"
                   value={currentPassword}
                   onChange={(e) => setCurrentPassword(e.target.value)}
                 />
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nova Senha</label>
                   <input 
                     type={showPasswords ? 'text' : 'password'}
                     required
                     className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-jlm-blue outline-none transition-all font-medium"
                     placeholder="Mín. 3 caracteres"
                     value={newPassword}
                     onChange={(e) => setNewPassword(e.target.value)}
                   />
                 </div>
                 <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Confirmar Nova</label>
                   <input 
                     type={showPasswords ? 'text' : 'password'}
                     required
                     className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-jlm-blue outline-none transition-all font-medium"
                     placeholder="Repita a nova senha"
                     value={confirmPassword}
                     onChange={(e) => setConfirmPassword(e.target.value)}
                   />
                 </div>
               </div>
               
               <div className="pt-6">
                 <button 
                   type="submit" 
                   disabled={loading}
                   className="px-10 py-4 bg-jlm-dark text-white font-black rounded-2xl hover:bg-black transition-all disabled:opacity-70 flex items-center gap-3 shadow-xl active:scale-95 uppercase tracking-widest text-xs"
                 >
                   {loading ? <Icons.Loader className="animate-spin" /> : 'Atualizar Credenciais'}
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
