import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Lenis from 'lenis';

// Layout & UI Contexts
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Canvas3D from './components/three/Canvas3D';

// Pages
import LandingPage from './pages/Landing/LandingPage';
import AuthPage from './pages/Auth/AuthPage';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import PricingPage from './pages/Pricing/PricingPage';
import QueueDetail from './pages/Queue/QueueDetail';

// Store
import { useStore } from './store/useStore';

export default function App() {
  const { initAuth } = useStore();

  // Restore session
  useEffect(() => {
    initAuth();
  }, []);

  // Initialize Lenis Smooth Scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // exponential smoothing
      smoothWheel: true,
      wheelMultiplier: 1.0,
      infinite: false
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <BrowserRouter>
      {/* Visual Overlay layers */}
      <Canvas3D />

      {/* Global Navbar */}
      <Navbar />

      {/* Application Main Router */}
      <main className="min-h-[85vh]">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/queue" element={<QueueDetail />} />
          <Route path="/queue/:slug" element={<QueueDetail />} />
          <Route
            path="*"
            element={
              <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
                <h1 className="text-8xl font-bold tracking-tighter text-white/5 uppercase select-none">404</h1>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white mt-4 mb-2">Flow Interrupted</h2>
                <p className="text-xs text-muted mb-8">The coordinate does not exist in our pipeline system.</p>
                <a href="/" className="text-[10px] uppercase tracking-widest border border-border px-4 py-2 rounded text-white hover:bg-white hover:text-black transition">
                  Return to Origin
                </a>
              </div>
            }
          />
        </Routes>
      </main>

      {/* Global Footer */}
      <Footer />
    </BrowserRouter>
  );
}
