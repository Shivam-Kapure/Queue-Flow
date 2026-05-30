import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN'); // Default to ADMIN for dashboard demonstration
  const [errorMsg, setErrorMsg] = useState('');

  const { login, register, authLoading } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (isLogin) {
        const user = await login(email, password);
        if (user.role === 'ADMIN' || user.role === 'MODERATOR') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        const user = await register(name, email, password, role);
        if (user.role === 'ADMIN' || user.role === 'MODERATOR') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center px-6 pt-20">
      <div className="absolute inset-0 grid-lines pointer-events-none opacity-[0.2]"></div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-secondary/30 border border-border p-10 rounded-xl relative z-10 glass-panel"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-white uppercase mb-2">
            {isLogin ? 'Enter Flow' : 'Create Credentials'}
          </h2>
          <p className="text-[10px] uppercase tracking-wider text-muted">
            {isLogin ? 'Access your virtual pipelines' : 'Setup queue flow node keys'}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-950/30 border border-red-500/20 text-red-200 text-[11px] p-3 rounded mb-6 text-center uppercase tracking-wider">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-muted mb-2 font-medium">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/40 border border-border px-4 py-3 rounded text-sm text-white focus:outline-none focus:border-white transition-all font-light"
                placeholder="Eleanor Vance"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-[9px] uppercase tracking-widest text-muted mb-2 font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-border px-4 py-3 rounded text-sm text-white focus:outline-none focus:border-white transition-all font-light"
              placeholder="eleanor@hogwarts.edu"
              required
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-widest text-muted mb-2 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-border px-4 py-3 rounded text-sm text-white focus:outline-none focus:border-white transition-all font-light"
              placeholder="••••••••"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-muted mb-2 font-medium">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-black/40 border border-border px-4 py-3 rounded text-sm text-white focus:outline-none focus:border-white transition-all font-light"
              >
                <option value="ADMIN">Queue Administrator (Create & Serve)</option>
                <option value="USER">Standard User (Join Rooms)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-4 bg-white text-black font-semibold text-[10px] uppercase tracking-widest rounded border border-white hover:bg-transparent hover:text-white transition duration-300 disabled:opacity-50"
          >
            {authLoading ? 'Authorizing...' : isLogin ? 'Authenticate' : 'Register Account'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] uppercase tracking-widest text-muted hover:text-white transition duration-300"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already registered? Sign In'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
