
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../services/mockSupabase';
import { User, Condominium } from '../../types';
import { Icons } from '../../components/Icons';

interface LoginProps {
  onLogin: (user: User) => void;
}

const ResidentLogin: React.FC<LoginProps> = ({ onLogin }) => {
  const [residentEmail, setResidentEmail] = useState('');
  const [residentStep, setResidentStep] = useState<1 | 2>(1);
  const [residentData, setResidentData] = useState<User | null>(null);
  
  const [condoOptions, setCondoOptions] = useState<string[]>([]);
  const [blockOptions, setBlockOptions] = useState<string[]>([]);
  const [aptOptions, setAptOptions] = useState<string[]>([]);

  const [confirmCondo, setConfirmCondo] = useState('');
  const [confirmBlock, setConfirmBlock] = useState('');
  const [confirmApt, setConfirmApt] = useState('');
  
  const [condosList, setCondosList] = useState<Condominium[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    db.getCondominiums().then(setCondosList);
  }, []);

  const shuffleArray = (array: string[]) => [...array].sort(() => Math.random() - 0.5);

  const generateDecoys = (correctValue: string, type: 'condo' | 'block' | 'apt', allCondos: Condominium[]) => {
    let pool: string[] = [];
    if (type === 'condo') {
      pool = allCondos.map(c => c.name).filter(n => n !== correctValue);
    } else if (type === 'block') {
      pool = ['A', 'B', '1', 'Norte', 'Sul', 'Torre 1', 'Bloco Único'];
    } else if (type === 'apt') {
      pool = ['11', '102', '54', '81', '303', '42', '111'];
    }
    const decoys = pool.filter(v => v !== correctValue).sort(() => 0.5 - Math.random()).slice(0, 2);
    return shuffleArray([correctValue, ...decoys]);
  };

  const handleResidentEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user, error } = await db.getResidentByEmail(residentEmail);
      if (error || !user) {
        setError(error || 'E-mail não cadastrado ou aguardando validação.');
        return;
      }
      setResidentData(user);
      setCondoOptions(generateDecoys(user.condo_name || '', 'condo', condosList));
      setBlockOptions(generateDecoys(user.block || '', 'block', condosList));
      setAptOptions(generateDecoys(user.apartment || '', 'apt', condosList));
      setResidentStep(2);
    } catch (err) {
       setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleResidentConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentData) return;
    setLoading(true);
    
    if (residentData.condo_name === confirmCondo && 
        residentData.block === confirmBlock && 
        residentData.apartment === confirmApt) {
       onLogin(residentData);
       navigate('/resident');
    } else {
       setError('Os dados informados não conferem com o cadastro.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 relative overflow-hidden">
      {/* Background Decorativo */}
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
          
          {residentStep === 1 ? (
            <form onSubmit={handleResidentEmailSubmit} className="space-y-8">
               <div className="space-y-4">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">E-mail Cadastrado</label>
                  <div className="relative group">
                    <Icons.Mail className="absolute left-5 top-4.5 text-gray-300 group-focus-within:text-brand-accent transition-colors" size={20} />
                    <input
                      type="email"
                      required
                      className="w-full pl-14 pr-6 py-4.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-accent/10 focus:border-brand-accent outline-none transition-all font-bold text-gray-700"
                      placeholder="seu@email.com"
                      value={residentEmail}
                      onChange={(e) => setResidentEmail(e.target.value)}
                    />
                  </div>
               </div>
               <button type="submit" disabled={loading} className="w-full bg-brand-blue text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 uppercase tracking-widest text-xs">
                  {loading ? 'Processando...' : 'Verificar Cadastro'}
               </button>
               <div className="text-center mt-8">
                  <p className="text-sm text-gray-500 font-medium">Ainda não tem acesso? <Link to="/register" className="text-brand-accent font-black hover:underline ml-1">Clique aqui</Link></p>
               </div>
            </form>
          ) : (
            <form onSubmit={handleResidentConfirm} className="space-y-8 animate-in slide-in-from-right duration-500">
               <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Escolha o Condomínio</label>
                    <div className="grid grid-cols-1 gap-3">
                      {condoOptions.map(opt => (
                        <button key={opt} type="button" onClick={() => setConfirmCondo(opt)} className={`text-left p-5 rounded-2xl border-2 text-xs font-black transition-all uppercase tracking-widest ${confirmCondo === opt ? 'bg-brand-blue border-brand-blue text-white shadow-xl' : 'bg-white border-gray-100 text-gray-400 hover:border-brand-accent/30'}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bloco</label>
                      <div className="flex flex-col gap-2">
                        {blockOptions.map(opt => (
                          <button key={opt} type="button" onClick={() => setConfirmBlock(opt)} className={`w-full p-4 rounded-xl border-2 text-xs font-black transition-all ${confirmBlock === opt ? 'bg-brand-accent border-brand-accent text-brand-blue shadow-lg' : 'bg-white border-gray-100 text-gray-400'}`}>{opt}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unidade</label>
                      <div className="flex flex-col gap-2">
                        {aptOptions.map(opt => (
                          <button key={opt} type="button" onClick={() => setConfirmApt(opt)} className={`w-full p-4 rounded-xl border-2 text-xs font-black transition-all ${confirmApt === opt ? 'bg-brand-accent border-brand-accent text-brand-blue shadow-lg' : 'bg-white border-gray-100 text-gray-400'}`}>{opt}</button>
                        ))}
                      </div>
                    </div>
                  </div>
               </div>
               <button type="submit" disabled={loading || !confirmCondo || !confirmBlock || !confirmApt} className="w-full bg-brand-green text-white font-black py-5 rounded-2xl shadow-xl hover:scale-105 transition-all uppercase tracking-[0.2em] text-[10px] active:scale-95">
                  Confirmar e Entrar
               </button>
               <button type="button" onClick={() => setResidentStep(1)} className="w-full text-gray-300 text-[10px] font-black uppercase tracking-widest hover:text-brand-blue transition">← Voltar ao início</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResidentLogin;
