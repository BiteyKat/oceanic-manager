import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Hubs from './pages/Hubs';
import Airports from './pages/Airports';
import Fleet from './pages/Fleet';
import RoutesPage from './pages/Routes';
import Auth from './pages/Auth';

function AppContent() {
  const { user, loading } = useAuth();
  useSupabaseSync(user?.id);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0f172a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#64748b', fontSize: 14,
      }}>
        ✈ Loading…
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="hubs" element={<Hubs />} />
          <Route path="airports" element={<Airports />} />
          <Route path="fleet" element={<Fleet />} />
          <Route path="routes" element={<RoutesPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
