
import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Icons } from './Icons';
import { User, UserRole, RequestStatus, Notification } from '../types';
import { db } from '../services/mockSupabase';

interface LayoutProps {
  children: React.ReactNode;
  user?: User | null;
  onLogout?: () => void;
}

export const PublicLayout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col font-sans relative selection:bg-brand-accent selection:text-brand-blue">
      <header className="fixed w-full z-[100] py-5 bg-brand-dark border-b border-white/10 shadow-premium">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2.5 bg-brand-accent rounded-xl text-brand-blue shadow-glow group-hover:rotate-12 transition-all duration-500">
              <Icons.Building size={24} />
            </div>
            <span className="text-2xl font-black font-heading tracking-tighter text-white">
              Facilities<span className="text-brand-accent">CON</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
             <Link to="/how-it-works" className="text-[10px] font-black text-white/80 hover:text-brand-accent uppercase tracking-[0.2em] transition">O Método</Link>
             <Link to="/about" className="text-[10px] font-black text-white/80 hover:text-brand-accent uppercase tracking-[0.2em] transition">A Empresa</Link>
             <Link to="/staff" className="text-[10px] font-black text-white/80 hover:text-brand-accent uppercase tracking-[0.2em] transition">Painel Central</Link>
             <Link to="/login" className="bg-brand-accent text-brand-blue px-10 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-glow hover:bg-white transition-all">
                Login Portal
             </Link>
          </nav>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="lg:hidden text-white bg-white/5 p-3.5 rounded-xl border border-white/10"
          >
             {mobileMenuOpen ? <Icons.X size={20} /> : <Icons.Menu size={20} />}
          </button>
        </div>
      </header>

      <div className={`fixed inset-0 z-[110] bg-brand-dark flex flex-col justify-center items-center p-8 transition-all duration-700 ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
          <div className="absolute top-0 right-0 p-10">
            <button onClick={() => setMobileMenuOpen(false)} className="text-white bg-white/5 p-4 rounded-full hover:bg-red-500 transition-colors"><Icons.X size={32} /></button>
          </div>
          <div className="flex flex-col gap-10 items-center text-center">
            <Link to="/" className="text-5xl font-black font-heading text-white hover:text-brand-accent transition">Home</Link>
            <Link to="/how-it-works" className="text-4xl font-black font-heading text-white hover:text-brand-accent transition">O Método</Link>
            <Link to="/about" className="text-4xl font-black font-heading text-white hover:text-brand-accent transition">Empresa</Link>
            <Link to="/staff" className="text-4xl font-black font-heading text-white hover:text-brand-accent transition">Painel Staff</Link>
            <Link to="/login" className="bg-brand-accent text-brand-blue w-72 py-6 rounded-3xl text-center font-black text-xl uppercase shadow-glow mt-8">Acesso Portal</Link>
          </div>
      </div>

      <main className="flex-grow pt-[88px]">{children}</main>

      <a 
        href="https://wa.me/5511988887777" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-[150] bg-brand-green p-5 rounded-2xl shadow-premium hover:scale-110 active:scale-95 transition-all group flex items-center gap-4"
      >
        <Icons.MessageCircle size={32} className="text-white relative z-10" />
        <span className="text-white font-black text-[10px] uppercase tracking-widest hidden md:block relative z-10">WhatsApp Consultor</span>
      </a>
    </div>
  );
};

export const AppLayout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeRequestsCount, setActiveRequestsCount] = useState(0);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const fetchStats = async () => {
    if (!user) return;
    
    try {
      const [reqs, notifs] = await Promise.all([
        db.getServiceRequests(user.id, user.role, user.condo_name),
        db.getNotifications(user.id)
      ]);

      setNotifications(notifs);
      setActiveRequestsCount(reqs.filter(r => r.status !== RequestStatus.COMPLETED && r.status !== RequestStatus.CANCELED).length);
    } catch (e) {
      console.error("Erro ao atualizar dados do layout:", e);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (id: string, link?: string) => {
    await db.markNotificationAsRead(id);
    fetchStats();
    if (link) {
      setShowNotifications(false);
      navigate(link);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await db.markAllNotificationsAsRead(user.id);
    fetchStats();
  };

  const menuItems = user?.role === UserRole.ADMIN ? [
    { label: 'Visão Geral', path: '/admin', icon: Icons.LayoutDashboard },
    { label: 'Chamados', path: '/admin/requests', icon: Icons.ClipboardList, badge: activeRequestsCount },
    { label: 'Condomínios', path: '/admin/condos', icon: Icons.Building2 },
    { label: 'Prestadores', path: '/admin/professionals', icon: Icons.Briefcase },
    { label: 'Equipe', path: '/admin/users', icon: Icons.Users },
    { label: 'Serviços do Site', path: '/admin/services', icon: Icons.Globe },
    { label: 'Dados da Unidade', path: '/admin/unit-settings', icon: Icons.Settings },
  ] : user?.role === UserRole.SYNDIC ? [
    { label: 'Meu Prédio', path: '/app', icon: Icons.LayoutDashboard },
    { label: 'Abrir Chamado', path: '/app/new-request', icon: Icons.PlusCircle },
    { label: 'Configurações', path: '/app/settings', icon: Icons.Settings },
  ] : [
    { label: 'Meu Portal', path: '/resident', icon: Icons.Home },
    { label: 'Solicitar Reparo', path: '/resident/new-request', icon: Icons.PlusCircle },
    { label: 'Meus Dados', path: '/resident/settings', icon: Icons.Settings },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans selection:bg-brand-accent selection:text-brand-blue">
      <aside className={`fixed lg:static inset-y-0 left-0 z-[120] w-80 bg-brand-blue text-white flex flex-col transform transition-transform duration-500 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-28 flex items-center px-10 border-b border-white/5">
           <div className="flex items-center gap-4">
             <div className="bg-brand-accent p-3 rounded-2xl shadow-glow"><Icons.Building size={20} className="text-brand-blue" /></div>
             <span className="text-xl font-black font-heading tracking-tighter">Facilities<span className="text-brand-accent">CON</span></span>
           </div>
        </div>
        <nav className="flex-1 py-10 px-6 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path} className={`flex items-center justify-between px-8 py-5 rounded-2xl transition-all duration-300 ${location.pathname === item.path ? 'bg-brand-accent text-brand-blue font-black shadow-glow' : 'text-slate-400 hover:text-white hover:bg-white/5 font-bold'}`}>
              <div className="flex items-center gap-5">
                <item.icon size={20} />
                <span className="text-[10px] uppercase tracking-widest">{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>
        <div className="p-8 border-t border-white/5">
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 bg-red-500/10 text-red-400 py-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest">
            <Icons.LogOut size={16} /> Encerrar
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-28 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0 print:hidden">
          <div className="flex items-center gap-6">
             <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-4 bg-slate-50 rounded-2xl text-brand-blue"><Icons.Menu size={28} /></button>
             <div className="flex flex-col">
                <h2 className="font-black text-slate-900 uppercase text-[11px] tracking-[0.3em]">{user?.condo_name || 'Central Operacional'}</h2>
                <p className="text-[9px] text-brand-accent font-black uppercase tracking-widest">Painel FacilitiesCON</p>
             </div>
          </div>
          
          <div className="flex items-center gap-6 relative">
             <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-4 rounded-2xl text-slate-400 hover:bg-slate-50 transition-all relative ${showNotifications ? 'bg-slate-100 text-brand-blue' : ''}`}
             >
                <Icons.Bell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute top-3 right-3 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                    {unreadCount}
                  </span>
                )}
             </button>

             {showNotifications && (
               <div className="absolute top-24 right-0 w-96 bg-white rounded-[2.5rem] shadow-premium border border-slate-100 z-[200] overflow-hidden animate-in slide-in-from-top-5">
                  <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                     <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic">Notificações</span>
                     {unreadCount > 0 && (
                       <button onClick={handleMarkAllAsRead} className="text-[8px] font-black uppercase text-brand-accent hover:underline">Limpar Tudo</button>
                     )}
                  </div>
                  <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                     {notifications.length === 0 ? (
                       <div className="p-12 text-center text-slate-400">
                         <Icons.BellOff size={32} className="mx-auto mb-4 opacity-20" />
                         <p className="text-[10px] font-black uppercase tracking-widest italic">Nenhuma notificação por enquanto.</p>
                       </div>
                     ) : (
                       notifications.map(n => (
                         <div 
                           key={n.id} 
                           onClick={() => handleMarkAsRead(n.id, n.link)}
                           className={`p-6 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors relative ${!n.read ? 'bg-brand-accent/5' : 'opacity-60'}`}
                         >
                            {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-accent"></div>}
                            <p className="font-black text-xs text-slate-900 mb-1">{n.title}</p>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{n.message}</p>
                            <span className="text-[8px] text-slate-400 font-black uppercase mt-3 block flex items-center gap-1">
                               <Icons.Clock size={10} /> {new Date(n.created_at).toLocaleString('pt-BR')}
                            </span>
                         </div>
                       ))
                     )}
                  </div>
               </div>
             )}

             <div className="flex items-center gap-5 border-l pl-10 border-slate-100">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-slate-900 leading-none mb-1">{user?.name.split(' ')[0]}</p>
                  <p className="text-[9px] text-brand-green font-black uppercase tracking-widest flex items-center gap-1 justify-end"><span className="w-1 h-1 rounded-full bg-brand-green"></span> Ativo</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-brand-accent flex items-center justify-center text-brand-blue font-black text-lg border-2 border-white shadow-sm">
                   {user?.name?.charAt(0)}
                </div>
             </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-10 bg-[#F8FAFC] print:p-0 print:bg-white">
           {children}
        </main>
      </div>
    </div>
  );
};
