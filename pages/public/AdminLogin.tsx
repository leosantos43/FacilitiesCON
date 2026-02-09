
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../services/mockSupabase';
import { User, UserRole } from '../../types';
import { Icons } from '../../components/Icons';

interface LoginProps {
  onLogin: (user: User) => void;
}

const AdminLogin: React.FC<LoginProps> = ({ onLogin }) => {
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
      const { user, error } = await db.login(email, password);
      if (error || !user) {
        setError(error || 'Credenciais inválidas.');
        return;
      }
      if (user.role === UserRole.RESIDENT) {
        setError('Este acesso é exclusivo para staff e gestores.');
        return;
      }
      onLogin(user);
      if (user.role === UserRole.ADMIN) navigate('/admin');
      else navigate('/app');
    } catch (err) {
      setError('Erro de autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[40vw] h-[40vw] bg-brand-accent rounded-full blur-[120px] opacity-5"></div>
      
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-premium border border-gray-100 overflow-hidden relative z-10">
        <div className="bg-brand-blue p-10 text-center relative overflow-hidden border-b border-gray-100">
           <Icons.Shield className="mx-auto mb-4 text-brand-accent relative z-10" size={48} />
           <h1 className="text-2xl font-black font-heading text-white relative z-10 tracking-tight italic uppercase">Staff <span className="text-brand-accent">Control</span></h1>
           <p className="text-blue-300 text-[9px] mt-1 relative z-10 font-black uppercase tracking-[0.3em]">Engenharia & Gestão</p>
        </div>
        
        <div className="p-10">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-[10px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-3">
             <Icons.AlertTriangle size={18} /> {error}
          </div>}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">E-mail Staff</label>
              <div className="relative group">
                <Icons.Mail className="absolute left-4 top-3.5 text-gray-300 group-focus-within:text-brand-accent transition-colors" size={18} />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent outline-none transition-all font-bold text-slate-800"
                  placeholder="admin@facilitiescon.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Senha de Acesso</label>
              <div className="relative group">
                <Icons.Lock className="absolute left-4 top-3.5 text-gray-300 group-focus-within:text-brand-accent transition-colors" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent outline-none transition-all font-bold text-slate-800"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-4 top-4 text-gray-300 hover:text-brand-accent transition"
                >
                   {showPassword ? <Icons.Smile size={18} /> : <Icons.Smile size={18} className="opacity-40" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-brand-blue text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 uppercase tracking-widest text-xs">
              {loading ? 'Validando...' : 'Acessar Painel Central'}
            </button>
          </form>
          
          <div className="mt-10 pt-8 border-t border-gray-50 text-center space-y-4">
            <Link to="/login" className="block text-[10px] font-black text-gray-300 hover:text-brand-blue uppercase tracking-widest transition">Voltar ao Portal do Morador</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
