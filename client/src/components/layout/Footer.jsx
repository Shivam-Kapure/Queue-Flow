import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-[#050505] py-20 px-6 relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl font-bold tracking-tight text-white">QUEUEFLOW</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          </div>
          <p className="text-[11px] text-muted max-w-sm leading-relaxed">
            Architecting virtual waiting lines for premium brands. Ensuring continuous availability, rate protection, and low-latency client synchronizations during peak demand.
          </p>
        </div>

        <div className="flex flex-wrap gap-12 text-[10px] uppercase tracking-wider text-muted font-medium">
          <div className="flex flex-col gap-2">
            <span className="text-white mb-1 tracking-widest text-[9px] opacity-40">Resources</span>
            <a href="#pipeline" className="hover:text-white transition duration-300">Architecture</a>
            <Link to="/pricing" className="hover:text-white transition duration-300">Pricing</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-white mb-1 tracking-widest text-[9px] opacity-40">System</span>
            <a href="https://neon.tech" target="_blank" rel="noreferrer" className="hover:text-white transition duration-300">Neon DB</a>
            <a href="https://vercel.com" target="_blank" rel="noreferrer" className="hover:text-white transition duration-300">Vercel</a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-white/5 mt-16 pt-8 text-[9px] uppercase tracking-widest text-muted">
        <span>© {new Date().getFullYear()} QueueFlow. All rights reserved.</span>
        <span>Aesthetic Inspired by Synapser Studio.</span>
      </div>
    </footer>
  );
}
