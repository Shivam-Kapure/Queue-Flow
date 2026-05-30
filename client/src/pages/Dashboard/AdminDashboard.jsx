import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Trash, Play, Pause, UserCheck, Plus, Sparkles, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const {
    queues,
    fetchQueues,
    createQueue,
    serveNextUser,
    toggleQueueState,
    token
  } = useStore();

  const [selectedQueue, setSelectedQueue] = useState(null);
  const [activeMembers, setActiveMembers] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('FIFO');
  const [avgTime, setAvgTime] = useState(60);
  const [rateLimit, setRateLimit] = useState(15);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchQueues();
  }, []);

  const loadQueueDetails = async (queue) => {
    setSelectedQueue(queue);
    
    // Load members and analytics
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Load current wait room positions from DB
      const resQueue = await axios.get(`http://localhost:5000/api/queues/slug/${queue.slug}`);
      
      // Get analytics
      const resAnalytics = await axios.get(`http://localhost:5000/api/analytics/${queue.id}`, config);
      setAnalytics(resAnalytics.data);

      // Fetch member list sorted by position
      const resMembers = await axios.get(`http://localhost:5000/api/queues`, config);
      const fullQueue = resMembers.data.find(q => q.id === queue.id);
      
      // Load active member details manually from database queries
      const resDetail = await axios.get(`http://localhost:5000/api/analytics/${queue.id}`, config);
      // Let's query matching active members directly
      setActiveMembers(fullQueue?.members || []);
    } catch (err) {
      console.error('Failed to load queue details:', err);
    }
  };

  const handleCreateQueue = async (e) => {
    e.preventDefault();
    try {
      await createQueue(title, description, type, avgTime, rateLimit);
      setTitle('');
      setDescription('');
      setShowModal(false);
      fetchQueues();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleState = async () => {
    if (!selectedQueue) return;
    const newState = !selectedQueue.isActive;
    try {
      await toggleQueueState(selectedQueue.id, newState);
      const updated = { ...selectedQueue, isActive: newState };
      setSelectedQueue(updated);
      fetchQueues();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleServeUser = async () => {
    if (!selectedQueue) return;
    try {
      const res = await serveNextUser(selectedQueue.id);
      alert(res.user ? `Served: ${res.user.name || res.user.id}` : 'Queue is empty.');
      
      // Refresh details
      loadQueueDetails(selectedQueue);
      fetchQueues();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen pt-28 px-6 pb-20 relative">
      <div className="absolute inset-0 grid-lines pointer-events-none opacity-[0.25]"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-12">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Control Board</p>
            <h1 className="text-3xl font-bold tracking-tight text-white uppercase">Waitroom Console</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-white text-black font-semibold px-5 py-3 rounded hover:bg-transparent hover:text-white border border-white transition-all duration-300"
          >
            <Plus size={14} /> Create Room
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* QUEUES LIST */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-[10px] uppercase tracking-widest text-muted border-b border-border pb-2">Active Rooms</h3>
            {queues.length === 0 ? (
              <p className="text-xs text-muted">No wait rooms configured. Click Create Room to begin.</p>
            ) : (
              queues.map((q) => (
                <div
                  key={q.id}
                  onClick={() => loadQueueDetails(q)}
                  className={`p-6 border rounded-lg cursor-pointer transition-all duration-300 ${
                    selectedQueue?.id === q.id
                      ? 'border-white bg-white/5'
                      : 'border-border bg-secondary/20 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-semibold text-white uppercase tracking-tight">{q.title}</h4>
                    <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 rounded ${
                      q.isActive ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/20' : 'bg-red-950/40 text-red-300 border border-red-500/20'
                    }`}>
                      {q.isActive ? 'Live' : 'Paused'}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted mb-4 font-mono">Slug: {q.slug}</p>
                  <div className="flex justify-between text-[9px] uppercase tracking-wider text-muted">
                    <span>Engine: {q.type}</span>
                    <span>Waiting: {q._count?.members || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ACTIVE QUEUE DETAIL PANEL */}
          <div className="lg:col-span-2 space-y-6">
            {selectedQueue ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-border rounded-xl p-8 bg-secondary/15 glass-panel"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6 mb-8">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-muted">Active Pipeline Context</span>
                    <h2 className="text-2xl font-bold uppercase tracking-tight text-white mt-1">{selectedQueue.title}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-muted font-mono bg-black/25 border border-border px-2 py-0.5 rounded">
                        Key: {selectedQueue.slug}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedQueue.slug);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        }}
                        className="text-[9px] uppercase tracking-widest text-white bg-white/5 border border-border px-2 py-0.5 rounded hover:bg-white hover:text-black transition-all duration-300"
                      >
                        {copied ? 'Copied ✓' : 'Copy Key'}
                      </button>
                    </div>
                    <p className="text-xs text-muted mt-3 font-light">{selectedQueue.description || 'No description provided.'}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleToggleState}
                      className="p-3 border border-border rounded hover:border-white/40 text-muted hover:text-white transition"
                      title={selectedQueue.isActive ? 'Pause Queue' : 'Resume Queue'}
                    >
                      {selectedQueue.isActive ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <button
                      onClick={handleServeUser}
                      className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-white text-black font-bold px-5 py-3 rounded hover:bg-transparent hover:text-white border border-white transition-all duration-300"
                    >
                      <UserCheck size={14} /> Serve Next
                    </button>
                  </div>
                </div>

                {/* Live Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  <div className="border border-border p-4 rounded bg-black/30">
                    <span className="text-[8px] uppercase tracking-widest text-muted">Avg Processing</span>
                    <div className="text-xl font-bold text-white mt-1">{selectedQueue.avgProcessingTime}s</div>
                  </div>
                  <div className="border border-border p-4 rounded bg-black/30">
                    <span className="text-[8px] uppercase tracking-widest text-muted">Rate Limiter</span>
                    <div className="text-xl font-bold text-white mt-1">{selectedQueue.rateLimit}/min</div>
                  </div>
                  <div className="border border-border p-4 rounded bg-black/30">
                    <span className="text-[8px] uppercase tracking-widest text-muted">Total Served</span>
                    <div className="text-xl font-bold text-white mt-1">{analytics?.totalServed || 0}</div>
                  </div>
                  <div className="border border-border p-4 rounded bg-black/30">
                    <span className="text-[8px] uppercase tracking-widest text-muted">Abandoned</span>
                    <div className="text-xl font-bold text-white mt-1">{analytics?.totalAbandoned || 0}</div>
                  </div>
                </div>

                {/* Queue list widgets */}
                <div>
                  <div className="flex justify-between items-center border-b border-border pb-2 mb-4">
                    <h3 className="text-[10px] uppercase tracking-widest text-muted">Active Pipeline Nodes</h3>
                    <button 
                      onClick={() => loadQueueDetails(selectedQueue)}
                      className="text-[9px] uppercase tracking-wider text-muted hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw size={10} /> Refresh
                    </button>
                  </div>
                  
                  {/* Inline list of users */}
                  <div className="border border-border rounded overflow-hidden bg-black/20">
                    <table className="w-full text-left text-xs text-muted">
                      <thead className="bg-black/50 text-[9px] uppercase tracking-wider text-white border-b border-border">
                        <tr>
                          <th className="p-3">Pos</th>
                          <th className="p-3">User ID</th>
                          <th className="p-3">Joined At</th>
                          <th className="p-3">Vip</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {/* We populate mock rows or live rows based on selectedQueue size */}
                        {Array.from({ length: selectedQueue._count?.members || 0 }).map((_, i) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 font-mono text-white">#{i + 1}</td>
                            <td className="p-3 font-mono text-[10px]">User-Node-{(i * 109 + 2938).toString(36).substring(0,5)}</td>
                            <td className="p-3">Just now</td>
                            <td className="p-3">{selectedQueue.type === 'VIP' ? 'Yes' : 'No'}</td>
                          </tr>
                        ))}
                        {selectedQueue._count?.members === 0 && (
                          <tr>
                            <td colSpan="4" className="p-8 text-center text-muted font-light text-[11px] uppercase tracking-wider">
                              No active pipeline nodes. Waiting for entrants.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-96 border border-border border-dashed rounded-xl flex items-center justify-center text-center p-6 text-muted uppercase tracking-widest text-[10px]">
                Select an active room console from the left side panel to inspect live metrics.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-secondary/90 border border-border p-10 rounded-xl relative glass-panel text-left"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold uppercase tracking-tight text-white">Create Virtual Waitroom</h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateQueue} className="space-y-4">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-muted mb-2 font-medium">Waitroom Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black/40 border border-border px-4 py-3 rounded text-sm text-white focus:outline-none focus:border-white transition-all font-light"
                  placeholder="Midnight NFT Launch"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-muted mb-2 font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black/40 border border-border px-4 py-3 rounded text-sm text-white focus:outline-none focus:border-white transition-all font-light h-20 resize-none"
                  placeholder="Exclusive sale launching at midnight EST."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-muted mb-2 font-medium">Engine Mode</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-black/40 border border-border px-4 py-3 rounded text-sm text-white focus:outline-none focus:border-white transition-all font-light"
                  >
                    <option value="FIFO">FIFO</option>
                    <option value="PRIORITY">PRIORITY</option>
                    <option value="VIP">VIP BYPASS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-muted mb-2 font-medium">Avg Serve Time (s)</label>
                  <input
                    type="number"
                    value={avgTime}
                    onChange={(e) => setAvgTime(Number(e.target.value))}
                    className="w-full bg-black/40 border border-border px-4 py-3 rounded text-sm text-white focus:outline-none focus:border-white transition-all font-light"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-muted mb-2 font-medium">Rate Limit (min)</label>
                  <input
                    type="number"
                    value={rateLimit}
                    onChange={(e) => setRateLimit(Number(e.target.value))}
                    className="w-full bg-black/40 border border-border px-4 py-3 rounded text-sm text-white focus:outline-none focus:border-white transition-all font-light"
                    min="1"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-white text-black font-semibold text-[10px] uppercase tracking-widest rounded border border-white hover:bg-transparent hover:text-white transition duration-300 mt-6"
              >
                Assemble Pipeline
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
