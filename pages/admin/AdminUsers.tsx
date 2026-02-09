
import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockSupabase';
import { User, UserRole, Condominium } from '../../types';
import { Icons } from '../../components/Icons';

type UserTab = 'all' | 'pending' | 'admin' | 'syndic' | 'resident';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [condos, setCondos] = useState<Condominium[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<UserTab>('all');
  const [filter, setFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    role: UserRole.RESIDENT,
    condo_name: '',
    block: '',
    apartment: '',
    password: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, condoData] = await Promise.all([db.getUsers(), db.getCondominiums()]);
      setUsers(userData);
      setCondos(condoData);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        whatsapp: user.whatsapp || '',
        role: user.role,
        condo_name: user.condo_name || '',
        block: user.block || '',
        apartment: user.apartment || '',
        password: '' 
      });
    } else {
      setEditingUser(null);
      setFormData({ 
        name: '', email: '', whatsapp: '', role: UserRole.RESIDENT, 
        condo_name: '', block: '', apartment: '', password: '' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUser) {
        const updates: any = { ...formData };
        delete updates.password;
        await db.updateUser(editingUser.id, updates);
      } else {
        if (!formData.password || formData.password.length < 6) {
          alert('A senha deve ter pelo menos 6 caracteres.');
          setLoading(false);
          return;
        }
        await db.createUser(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert('Falha ao salvar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (userId: string) => {
    setActionLoading(userId);
    try {
      await db.validateUser(userId);
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao validar usuário. Verifique as permissões de RLS no banco de dados.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (e: React.MouseEvent, u: User) => {
    e.preventDefault();
    e.stopPropagation();
    if (u.role === UserRole.ADMIN) {
      alert('⚠️ Segurança: Não é permitido excluir o administrador mestre.');
      return;
    }
    if (window.confirm(`Deseja excluir permanentemente o usuário ${u.name}?`)) {
      setLoading(true);
      try {
        await db.deleteUser(u.id);
        await loadData();
      } catch (err: any) {
        alert('Falha ao excluir: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const displayedUsers = users.filter(u => {
    const matchesFilter = (u.name || '').toLowerCase().includes(filter.toLowerCase()) || 
                          (u.email || '').toLowerCase().includes(filter.toLowerCase());
    switch (activeTab) {
      case 'pending': return matchesFilter && u.is_validated === false;
      case 'admin': return matchesFilter && u.role === UserRole.ADMIN;
      case 'syndic': return matchesFilter && u.role === UserRole.SYNDIC;
      case 'resident': return matchesFilter && u.role === UserRole.RESIDENT;
      default: return matchesFilter;
    }
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de <span className="text-brand-accent">Equipe</span></h1>
          <p className="text-slate-500 text-sm font-medium">Controle de acessos baseado em Supabase Auth Real.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-brand-blue text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-premium hover:bg-black transition-all">
          <Icons.UserPlus size={18} className="text-brand-accent" /> Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 space-y-8 bg-slate-50/30">
           <div className="flex bg-slate-200 p-1 rounded-2xl w-full lg:w-fit overflow-x-auto custom-scrollbar">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'pending', label: 'Pendentes', count: users.filter(u => u.is_validated === false).length },
                { id: 'admin', label: 'Admins' },
                { id: 'syndic', label: 'Síndicos' },
                { id: 'resident', label: 'Moradores' }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as UserTab)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && <span className="bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] animate-pulse">{tab.count}</span>}
                </button>
              ))}
           </div>
           <div className="relative max-w-md group">
              <Icons.Search className="absolute left-5 top-4.5 text-slate-300 group-focus-within:text-brand-accent transition-colors" size={20} />
              <input type="text" placeholder="Buscar por nome ou e-mail..." className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent font-bold text-slate-700 text-sm shadow-sm" value={filter} onChange={e => setFilter(e.target.value)} />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-8 py-6">Usuário</th>
                <th className="px-8 py-6">Papel</th>
                <th className="px-8 py-6">Condomínio</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && users.length === 0 ? (
                <tr><td colSpan={4} className="px-8 py-20 text-center"><Icons.Loader className="animate-spin inline text-brand-accent" size={32} /></td></tr>
              ) : displayedUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 group transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black group-hover:bg-brand-accent group-hover:text-brand-blue transition-colors">{u.name?.charAt(0)}</div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">{u.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest">{u.role}</span>
                        {!u.is_validated && <span className="text-[9px] font-black text-red-500 uppercase tracking-tight flex items-center gap-1"><Icons.AlertTriangle size={10} /> Aguardando</span>}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-slate-700">{u.condo_name || 'Central'}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end items-center gap-2">
                         {u.is_validated === false && (
                           <button 
                             onClick={() => handleValidate(u.id)} 
                             disabled={actionLoading === u.id}
                             className="p-3 bg-brand-green/10 text-brand-green rounded-xl hover:bg-brand-green hover:text-white transition-all shadow-sm disabled:opacity-50"
                           >
                             {actionLoading === u.id ? <Icons.Loader className="animate-spin" size={18} /> : <Icons.CheckCircle size={18} />}
                           </button>
                         )}
                         <button onClick={() => handleOpenModal(u)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-brand-blue hover:text-white transition-all"><Icons.Edit2 size={18} /></button>
                         {u.role !== UserRole.ADMIN && <button onClick={(e) => handleDeleteUser(e, u)} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Icons.Trash size={18} /></button>}
                       </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-dark/80 backdrop-blur-sm p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-premium relative animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[95vh]">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-8">{editingUser ? 'Editar' : 'Novo'} Usuário</h3>
              <form onSubmit={handleSaveUser} className="space-y-4">
                 <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold" placeholder="Nome Completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                 <input required type="email" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold" placeholder="E-mail" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                 <input required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold" placeholder="WhatsApp (Apenas números)" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
                 <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                    <option value={UserRole.ADMIN}>Administrador</option>
                    <option value={UserRole.SYNDIC}>Síndico</option>
                    <option value={UserRole.RESIDENT}>Morador</option>
                 </select>
                 <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold" value={formData.condo_name} onChange={e => setFormData({...formData, condo_name: e.target.value})}>
                    <option value="">Condomínio...</option>
                    {condos.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                 </select>
                 {!editingUser && (
                   <div className="space-y-2">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Inicial</p>
                     <input required type="password" title="Senha" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold" placeholder="Mínimo 6 caracteres" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                   </div>
                 )}
                 <div className="pt-6 flex flex-col gap-3">
                    <button type="submit" disabled={loading} className="w-full py-5 bg-brand-blue text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-premium">
                       {loading ? 'Salvando...' : 'Confirmar Registro'}
                    </button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-2 text-slate-400 font-black uppercase text-[10px]">Cancelar</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
