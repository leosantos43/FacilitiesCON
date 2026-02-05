
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../services/mockSupabase';
import { User } from '../../types';
import { Icons } from '../../components/Icons';

interface LoginProps {
  onLogin: (user: User) => void;
}

const ResidentLogin: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { user, error: authError } = await db.login(email, password);
      
      if (authError || !user) {
        setError(authError || 'E-mail ou senha inválidos.');
        return;
      }

      if (!user.is_validated) {
        setError('Seu cadastro ainda está em análise pelo síndico.');
        return;
      }

      onLogin(user);
      navigate(user.role === 'resident' ? '/resident' : (user.role === 'admin' ? '/admin' : '/app'));
    } catch (err) {
       setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-brand-accent rounded-full blur-[150px] opacity-10"></div>
      <div className="absolute bottom-0 left-0 w-[30vw] h-[30vw] bg-brand-blue rounded-full blur-[150px] opacity-10"></div>

      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-premium border border-gray-100 overflow-hidden relative z-10">
        <div className="bg-brand-dark p-12 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
           <div className="relative z-10 flex flex-col items-center">
             <div className="w-16 h-16 bg-brand-accent rounded-2xl flex items-center justify-center text-brand-blue mb-6 shadow-glow">
                <Icons.Home size={32} />
             </div>
             <h1 className="text-3xl font-black font-heading text-white tracking-tighter">Portal do <span className="text-brand-accent">Morador</span></h1>
             <p className="text-gray-400 text-[10px] uppercase font-black tracking-[0.3em] mt-3">Segurança e Agilidade</p>
           </div>
        </div>
        
        <div className="p-12">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 text-[11px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-3">
             <Icons.AlertTriangle size={20} className="shrink-0" /> {error}
          </div>}
          
          <form onSubmit={handleLogin} className="space-y-6">
             <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">E-mail</label>
                <div className="relative group">
                  <Icons.Mail className="absolute left-5 top-4.5 text-gray-300 group-focus-within:text-brand-accent transition-colors" size={20} />
                  <input
                    type="email"
                    required
                    className="w-full pl-14 pr-6 py-4.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-accent/10 focus:border-brand-accent outline-none transition-all font-bold text-gray-700"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
             </div>

             <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Senha</label>
                <div className="relative group">
                  <Icons.Lock className="absolute left-5 top-4.5 text-gray-300 group-focus-within:text-brand-accent transition-colors" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full pl-14 pr-14 py-4.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-accent/10 focus:border-brand-accent outline-none transition-all font-bold text-gray-700"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-5 text-gray-300 hover:text-brand-accent">
                    {showPassword ? <Icons.Smile size={20} /> : <Icons.Smile size={20} className="opacity-40" />}
                  </button>
                </div>
             </div>

             <button type="submit" disabled={loading} className="w-full bg-brand-blue text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 uppercase tracking-widest text-xs">
                {loading ? 'Autenticando...' : 'Acessar Portal'}
             </button>
             
             <div className="text-center mt-8 space-y-4">
                <p className="text-sm text-gray-500 font-medium">Ainda não tem acesso? <Link to="/register" className="text-brand-accent font-black hover:underline ml-1">Cadastre-se</Link></p>
                <Link to="/staff" className="block text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-brand-blue">Acesso Gestão / Staff</Link>
             </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResidentLogin;
