import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { db } from '../../services/mockSupabase';
import { Icons } from '../../components/Icons';

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');

  useEffect(() => {
    if (!token) {
      setError('Token de recuperação inválido ou ausente.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 3) {
      setError('A senha deve ter no mínimo 3 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const result = await db.confirmPasswordReset(token, newPassword);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-jlm-darker p-8 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-jlm-blue rounded-full blur-[60px] opacity-20"></div>
           <div className="relative z-10">
             <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 text-white">
                <Icons.Key size={32} />
             </div>
             <h1 className="text-2xl font-bold font-heading text-white">Redefinir Senha</h1>
             <p className="text-gray-400 text-sm mt-2">Crie uma nova credencial segura para seu acesso.</p>
           </div>
        </div>

        <div className="p-8">
          {!token ? (
            <div className="text-center space-y-4">
               <div className="bg-red-50 text-red-600 p-4 rounded-xl flex flex-col items-center gap-2">
                 <Icons.AlertTriangle size={32} />
                 <span className="font-bold">Link Inválido</span>
               </div>
               <p className="text-gray-500 text-sm">O link de recuperação parece estar quebrado ou incompleto.</p>
               <Link to="/login" className="block w-full bg-gray-100 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition">
                 Voltar ao Login
               </Link>
            </div>
          ) : success ? (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 animate-in zoom-in duration-300">
                <Icons.CheckCircle size={40} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Senha Alterada!</h3>
                <p className="text-gray-500 mt-2">Sua senha foi atualizada com sucesso. Redirecionando para o login...</p>
              </div>
              <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 animate-[width_3s_ease-in-out_forwards]" style={{width: '0%'}}></div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-3 border border-red-100">
                  <Icons.AlertTriangle size={20} />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
                <div className="relative">
                  <Icons.Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input
                    type="password"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-jlm-blue focus:border-jlm-blue outline-none transition"
                    placeholder="Nova senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Senha</label>
                <div className="relative">
                  <Icons.Check className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input
                    type="password"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-jlm-blue focus:border-jlm-blue outline-none transition"
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-jlm-blue hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {loading ? 'Salvando...' : 'Redefinir Senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;