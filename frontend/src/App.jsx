import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import LandRegistry from './pages/LandRegistry';
import Funds from './pages/Funds';

function App() {
  return (
    <div className="min-h-screen bg-brand-dark text-slate-200">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/land" element={<LandRegistry />} />
          <Route path="/funds" element={<Funds />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
