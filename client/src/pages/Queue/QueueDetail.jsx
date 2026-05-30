import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { ShieldCheck, LogOut, Loader2, Award, KeyRound } from 'lucide-react';

export default function QueueDetail() {
  const { slug } = useParams();
  
  const {
    user,
    activeMemberState,
    servedAlert,
    joinQueue,
    leaveQueue,
    fetchMemberStatus,
    disconnectSocket
  } = useStore();

  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [priority, setPriority] = useState(0);
  const [vipPasscode, setVipPasscode] = useState('');
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [inputSlug, setInputSlug] = useState('');

  // Fetch Queue configurations by slug on mount
  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    const loadQueue = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/queues/slug/${slug}`);
        setQueue(res.data);
        
        // If user logged in, check if they are already in the queue
        if (user) {
          await fetchMemberStatus(res.data.id, slug);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadQueue();

    return () => {
      disconnectSocket();
    };
  }, [slug, user]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Please authenticate first to enter the flow.');
      return;
    }
    
    setJoining(true);
    setErrorMsg('');
    
    try {
      await joinQueue(queue.id, slug, priority, vipPasscode);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to join the waitroom.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!queue || !activeMemberState) return;
    if (window.confirm('Are you sure you want to leave the waiting room? You will lose your position.')) {
      await leaveQueue(queue.id);
    }
  };

  if (!slug) {
    return (
      <div className="relative min-h-[90vh] flex items-center justify-center px-6 pt-20">
        <div className="absolute inset-0 grid-lines pointer-events-none opacity-[0.25]"></div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-secondary/30 border border-border p-10 rounded-xl relative z-10 glass-panel"
        >
          <div className="text-center mb-8">
            <span className="text-[10px] uppercase tracking-widest text-muted mb-2 inline-block">Pipeline Connection</span>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-white font-display">Enter Waitroom Key</h2>
            <p className="text-xs text-muted mt-2 font-light">
              Enter the unique waitroom identifier key below to sync your device and request slot access.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputSlug.trim()) {
                window.location.href = `/queue/${inputSlug.trim().toLowerCase()}`;
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-muted mb-2 font-medium">Waitroom Key (Slug)</label>
              <input
                type="text"
                value={inputSlug}
                onChange={(e) => setInputSlug(e.target.value)}
                className="w-full bg-black/40 border border-border px-4 py-3 rounded text-sm text-white focus:outline-none focus:border-white transition-all font-light"
                placeholder="midnight-nft-drop-x29f"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-white text-black font-semibold text-[10px] uppercase tracking-widest rounded border border-white hover:bg-transparent hover:text-white transition duration-300"
            >
              Connect to Pipeline
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted uppercase tracking-widest text-xs">
        <Loader2 className="animate-spin mr-2" size={16} /> Resolving Pipeline...
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-2xl font-bold uppercase tracking-tight text-white mb-2">Room Not Found</h2>
        <p className="text-xs text-muted mb-6">The requested waiting room slug does not exist on our servers.</p>
        <Link to="/" className="text-xs uppercase tracking-widest border border-border px-4 py-2 rounded text-white hover:bg-white hover:text-black transition">
          Return Home
        </Link>
      </div>
    );
  }

  // Format estimated wait time nicely
  const formatWaitTime = (seconds) => {
    if (seconds <= 0) return 'Less than a minute';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes === 0) return `${secs} seconds`;
    return `${minutes} min ${secs} sec`;
  };

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center px-6 pt-20">
      <div className="absolute inset-0 grid-lines pointer-events-none opacity-[0.25]"></div>

      <AnimatePresence mode="wait">
        {/* CASE 1: USER IS SERVED (ACCESS GRANTED) */}
        {servedAlert ? (
          <motion.div
            key="served"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-lg bg-emerald-950/20 border border-emerald-500/20 p-12 rounded-xl text-center relative z-10 glass-panel"
          >
            {/* Particles glow */}
            <div className="absolute inset-0 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none"></div>

            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center mx-auto mb-6 text-emerald-400">
              <ShieldCheck size={32} />
            </div>

            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Gateway Open</span>
            <h2 className="text-3xl font-bold uppercase tracking-tight text-white mt-2 mb-4">Access Granted</h2>
            
            <p className="text-xs text-muted leading-relaxed max-w-sm mx-auto mb-8 font-light">
              Your waiting room token was validated. You are now being redirected to the target application portal.
            </p>

            <a
              href="https://www.synapserstudio.com"
              target="_blank"
              rel="noreferrer"
              className="inline-block py-4 px-8 bg-white text-black font-semibold text-[10px] uppercase tracking-widest rounded border border-white hover:bg-transparent hover:text-white transition duration-300"
            >
              Proceed to Destination
            </a>
          </motion.div>
        ) : activeMemberState?.inQueue ? (
          /* CASE 2: USER IS ACTIVELY WAITING IN LINE */
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md bg-secondary/30 border border-border p-10 rounded-xl text-center relative z-10 glass-panel"
          >
            {/* Spinning load ring */}
            <div className="w-20 h-20 rounded-full border-2 border-white/5 border-t-white animate-spin mx-auto mb-8 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center text-xs font-mono font-bold text-white">
                #{activeMemberState.position}
              </div>
            </div>

            <span className="text-[9px] uppercase tracking-widest text-muted font-medium">Active Position</span>
            <h3 className="text-xl font-bold uppercase tracking-tight text-white mt-1 mb-2">{queue.title}</h3>
            
            <div className="space-y-4 my-8 border-y border-white/5 py-6">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">Estimated Wait:</span>
                <span className="text-white font-medium">{formatWaitTime(activeMemberState.estimatedWaitTime)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">Queue Mode:</span>
                <span className="text-white font-mono uppercase">{queue.type}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted">Average Speed:</span>
                <span className="text-white">{queue.avgProcessingTime}s per serve</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleLeave}
                className="flex items-center justify-center gap-2 w-full py-3 bg-transparent text-red-400 font-medium text-[10px] uppercase tracking-wider rounded border border-red-500/20 hover:border-red-500/50 hover:bg-red-950/20 transition duration-300"
              >
                <LogOut size={13} /> Leave Waiting Room
              </button>
              <p className="text-[9px] text-muted leading-relaxed font-light mt-2">
                Do not refresh or close this tab. Your position is synced in real-time.
              </p>
            </div>
          </motion.div>
        ) : (
          /* CASE 3: USER IS NOT IN QUEUE AND NEEDS TO JOIN */
          <motion.div
            key="join-form"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md bg-secondary/30 border border-border p-10 rounded-xl relative z-10 glass-panel"
          >
            <div className="text-center mb-8">
              <span className="text-[10px] uppercase tracking-widest text-muted mb-2 inline-block">Access Portal</span>
              <h2 className="text-2xl font-bold uppercase tracking-tight text-white">{queue.title}</h2>
              <p className="text-[11px] text-muted mt-2 font-light">
                {queue.description || 'Join the virtual line to gain secure access.'}
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-950/20 border border-red-500/20 text-red-200 text-[10px] p-3 rounded mb-6 text-center uppercase tracking-wider">
                {errorMsg}
              </div>
            )}

            {!user ? (
              <div className="text-center border border-border p-6 rounded bg-black/20">
                <p className="text-xs text-muted mb-4">You must authenticate to enter this queue.</p>
                <Link
                  to="/auth"
                  className="inline-block py-3 px-6 bg-white text-black font-semibold text-[10px] uppercase tracking-widest rounded border border-white hover:bg-transparent hover:text-white transition duration-300"
                >
                  Sign In / Register
                </Link>
              </div>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                {queue.type === 'PRIORITY' && (
                  <div>
                    <label className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-muted mb-2 font-medium">
                      <Award size={10} /> Priority Rating (1-100)
                    </label>
                    <input
                      type="number"
                      value={priority}
                      onChange={(e) => setPriority(Number(e.target.value))}
                      className="w-full bg-black/40 border border-border px-4 py-3 rounded text-sm text-white focus:outline-none focus:border-white transition-all font-light"
                      min="0"
                      max="100"
                    />
                    <p className="text-[9px] text-muted mt-1 leading-relaxed">Higher ratings are sorted closer to the front of the queue.</p>
                  </div>
                )}

                {queue.type === 'VIP' && (
                  <div>
                    <label className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-muted mb-2 font-medium">
                      <KeyRound size={10} /> VIP Passcode
                    </label>
                    <input
                      type="password"
                      value={vipPasscode}
                      onChange={(e) => setVipPasscode(e.target.value)}
                      className="w-full bg-black/40 border border-border px-4 py-3 rounded text-sm text-white focus:outline-none focus:border-white transition-all font-light"
                      placeholder="Enter 'VIPFLOW' for demo access"
                      required
                    />
                    <p className="text-[9px] text-muted mt-1 leading-relaxed">Enter your VIP bypass passcode to access the priority waiting list.</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={joining}
                  className="w-full py-4 bg-white text-black font-semibold text-[10px] uppercase tracking-widest rounded border border-white hover:bg-transparent hover:text-white transition duration-300 disabled:opacity-50"
                >
                  {joining ? 'Requesting Access...' : 'Request Queue Slot'}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
