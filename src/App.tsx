import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Hubs from './pages/Hubs';
import Airports from './pages/Airports';
import Fleet from './pages/Fleet';
import RoutesPage from './pages/Routes';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="hubs" element={<Hubs />} />
          <Route path="airports" element={<Airports />} />
          <Route path="fleet" element={<Fleet />} />
          <Route path="routes" element={<RoutesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
