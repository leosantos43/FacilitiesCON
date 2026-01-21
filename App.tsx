
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout, AppLayout } from './components/Layout';
import { User, UserRole } from './types';
import { db } from './services/mockSupabase';

// Páginas Públicas
import Home from './pages/public/Home';
import ResidentLogin from './pages/public/Login';
import ResidentRegister from './pages/public/Register';
import AdminLogin from './pages/public/AdminLogin';
import HowItWorks from './pages/public/HowItWorks';
import About from './pages/public/About';

// Páginas Internas
import SyndicDashboard from './pages/app/SyndicDashboard';
import NewRequest from './pages/app/NewRequest';
import RequestDetails from './pages/app/RequestDetails';
import UserSettings from './pages/common/UserSettings';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRequests from './pages/admin/AdminRequests';
import AdminProfessionals from './pages/admin/AdminProfessionals';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCondos from './pages/admin/AdminCondos';
import AdminServices from './pages/admin/AdminServices';
import AdminSettings from './pages/admin/AdminSettings';
import ResidentDashboard from './pages/resident/ResidentDashboard';
import NewResidentRequest from './pages/resident/NewResidentRequest';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica sessão inicial manual
    const checkSession = async () => {
      try {
        const u = await db.getCurrentUser();
        setUser(u);
      } catch (e) {
        console.error("Erro ao recuperar sessão:", e);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
  };

  const handleLogout = async () => {
    await db.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-brand-dark">
         <div className="animate-pulse flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-brand-accent rounded-3xl shadow-glow"></div>
            <p className="text-white font-black uppercase text-[10px] tracking-widest">Iniciando FacilitiesCON Security...</p>
         </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/how-it-works" element={<PublicLayout><HowItWorks /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
        
        {/* Autenticação - Redirecionamento inteligente baseado no Role */}
        <Route path="/login" element={
          !user ? (
            <PublicLayout><ResidentLogin onLogin={handleLogin} /></PublicLayout>
          ) : (
            <Navigate to={user.role === UserRole.RESIDENT ? "/resident" : (user.role === UserRole.ADMIN ? "/admin" : "/app")} />
          )
        } />
        
        <Route path="/register" element={<PublicLayout><ResidentRegister /></PublicLayout>} />
        
        <Route path="/staff" element={
          !user ? (
            <PublicLayout><AdminLogin onLogin={handleLogin} /></PublicLayout>
          ) : (
            <Navigate to={user.role === UserRole.ADMIN ? "/admin" : (user.role === UserRole.SYNDIC ? "/app" : "/resident")} />
          )
        } />

        {/* Área Morador */}
        <Route 
          path="/resident/*"
          element={
            user && user.role === UserRole.RESIDENT ? (
              <AppLayout user={user} onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<ResidentDashboard user={user} />} />
                  <Route path="/new-request" element={<NewResidentRequest user={user} />} />
                  <Route path="/request/:id" element={<RequestDetails user={user} />} />
                  <Route path="/settings" element={<UserSettings user={user} />} />
                  <Route path="*" element={<Navigate to="/resident" />} />
                </Routes>
              </AppLayout>
            ) : <Navigate to="/login" />
          }
        />

        {/* Área Síndico */}
        <Route
          path="/app/*"
          element={
            user && user.role === UserRole.SYNDIC ? (
              <AppLayout user={user} onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<SyndicDashboard user={user} />} />
                  <Route path="/new-request" element={<NewRequest user={user} />} />
                  <Route path="/request/:id" element={<RequestDetails user={user} />} />
                  <Route path="/settings" element={<UserSettings user={user} />} />
                  <Route path="*" element={<Navigate to="/app" />} />
                </Routes>
              </AppLayout>
            ) : <Navigate to="/staff" />
          }
        />

        {/* Área Admin */}
        <Route
          path="/admin/*"
          element={
            user && user.role === UserRole.ADMIN ? (
              <AppLayout user={user} onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/requests" element={<AdminRequests />} />
                  <Route path="/users" element={<AdminUsers />} />
                  <Route path="/condos" element={<AdminCondos />} />
                  <Route path="/services" element={<AdminServices />} />
                  <Route path="/unit-settings" element={<AdminSettings />} />
                  <Route path="/request/:id" element={<RequestDetails user={user} />} />
                  <Route path="/professionals" element={<AdminProfessionals />} />
                  <Route path="/settings" element={<UserSettings user={user} />} />
                  <Route path="*" element={<Navigate to="/admin" />} />
                </Routes>
              </AppLayout>
            ) : <Navigate to="/staff" />
          }
        />

        {/* Catch-all para usuários logados na rota errada */}
        <Route path="*" element={
          user ? (
            <Navigate to={user.role === UserRole.ADMIN ? "/admin" : (user.role === UserRole.SYNDIC ? "/app" : "/resident")} />
          ) : (
            <Navigate to="/" />
          )
        } />
      </Routes>
    </Router>
  );
};

export default App;
