import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, cubicBezier: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 w-full z-50 border-b border-border bg-[#050505]/45 backdrop-blur-[14px] webkit-backdrop-blur-[14px]"
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-xl font-bold tracking-tight text-white transition-all duration-300 group-hover:tracking-widest">
            QUEUEFLOW
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-white group-hover:animate-pulse"></span>
        </Link>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-wider text-muted font-medium">
          <Link to="/" className="hover:text-white transition duration-300">
            Home
          </Link>
          {user?.role === 'ADMIN' && (
            <Link to="/admin" className="hover:text-white transition duration-300">
              Admin Board
            </Link>
          )}
          <Link to="/queue" className="hover:text-white transition duration-300">
            Join Queue
          </Link>
          <Link to="/pricing" className="hover:text-white transition duration-300">
            Pricing
          </Link>
          <a href="#pipeline" className="hover:text-white transition duration-300">
            Architecture
          </a>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-4">

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-[10px] uppercase tracking-wider text-muted hidden sm:inline">
                [{user.role}] {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="text-[10px] uppercase tracking-wider bg-white text-black px-4 py-2 rounded-full border border-white font-medium hover:bg-transparent hover:text-white transition-all duration-400"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="text-[10px] uppercase tracking-wider bg-transparent text-white px-5 py-2.5 rounded-full border border-border font-medium hover:bg-white hover:text-black hover:border-white transition-all duration-400"
            >
              Enter Flow
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
}
