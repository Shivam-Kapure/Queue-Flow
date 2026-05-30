import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import QueuePipeline from '../../components/three/QueuePipeline';
import { Zap, Shield, GitMerge, Cpu, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 60, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <div className="relative min-h-screen pt-20 overflow-hidden">
      {/* Grid background overlay */}
      <div className="absolute inset-0 grid-lines pointer-events-none opacity-[0.3]"></div>

      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 border-b border-border">
        <div className="max-w-7xl mx-auto w-full text-center relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-6"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[9px] uppercase tracking-widest text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              Virtual Waiting Rooms Redefined
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="font-display text-[44px] sm:text-[68px] md:text-[90px] font-bold tracking-tighter leading-[0.95] text-gradient max-w-5xl uppercase heading-reveal"
            >
              The Gatekeeper For <br /> High-Traffic Launches
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-muted text-[13px] sm:text-base max-w-xl leading-relaxed font-light mt-4"
            >
              Control traffic surges, prevent server crashes, and keep user experience premium. Re-orchestrating server inflows using ultra low-latency waiting pipelines.
            </motion.p>

            <motion.div variants={itemVariants} className="flex gap-4 mt-8">
              <Link
                to="/auth"
                className="text-[11px] uppercase tracking-widest bg-white text-black font-semibold px-8 py-4 rounded-full border border-white hover:bg-transparent hover:text-white transition-all duration-400"
              >
                Launch Waitroom
              </Link>
              <a
                href="#pipeline"
                className="text-[11px] uppercase tracking-widest bg-transparent text-white font-medium px-8 py-4 rounded-full border border-border hover:border-white transition-all duration-400 inline-flex items-center gap-2"
              >
                Inspect Flow <ArrowRight size={13} />
              </a>
            </motion.div>
          </motion.div>
        </div>

        {/* Ambient Bottom Glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-[120px] bg-white/5 blur-[90px] rounded-full pointer-events-none"></div>
      </section>

      {/* SYSTEM ARCHITECTURE DIAGRAM SECTION */}
      <section className="py-32 px-6 border-b border-border relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-2">Server Topology</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white uppercase">
              Low Latency System Pipeline
            </h2>
            <p className="text-muted text-[12px] max-w-md mx-auto mt-2 font-light">
              Traffic is scrubbed and queue-routed before hitting database nodes.
            </p>
          </div>

          {/* Animated Architecture Map */}
          <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4 bg-secondary/20 border border-border rounded-xl p-8 relative overflow-hidden glass-panel">
            {/* User Node */}
            <div className="flex flex-col items-center justify-center p-6 border border-white/5 rounded-lg bg-black/40 text-center relative">
              <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center mb-3">
                <span className="text-[10px] font-mono text-white">01</span>
              </div>
              <h4 className="text-[12px] uppercase font-bold tracking-wider text-white">User Traffic</h4>
              <p className="text-[10px] text-muted mt-1 leading-relaxed">Request entry via HTTP/WS</p>
            </div>

            {/* Path 1 */}
            <div className="hidden md:flex justify-center items-center">
              <div className="w-full h-[1px] bg-gradient-to-right bg-white/10 relative overflow-hidden">
                <motion.div
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="w-1/3 h-[1px] bg-white absolute top-0 left-0"
                ></motion.div>
              </div>
            </div>

            {/* Rate Limiter Node */}
            <div className="flex flex-col items-center justify-center p-6 border border-white/5 rounded-lg bg-black/40 text-center relative">
              <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center mb-3">
                <span className="text-[10px] font-mono text-white">02</span>
              </div>
              <h4 className="text-[12px] uppercase font-bold tracking-wider text-white">Rate Limiter</h4>
              <p className="text-[10px] text-muted mt-1 leading-relaxed">Scrub scraper/spam hits</p>
            </div>

            {/* Path 2 */}
            <div className="hidden md:flex justify-center items-center">
              <div className="w-full h-[1px] bg-gradient-to-right bg-white/10 relative overflow-hidden">
                <motion.div
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: 'linear' }}
                  className="w-1/3 h-[1px] bg-white absolute top-0 left-0"
                ></motion.div>
              </div>
            </div>

            {/* Queue Engine Node */}
            <div className="flex flex-col items-center justify-center p-6 border border-white/10 rounded-lg bg-white/5 text-center relative">
              <div className="w-10 h-10 rounded-full border border-white/40 bg-white text-black flex items-center justify-center mb-3">
                <span className="text-[10px] font-mono font-bold">03</span>
              </div>
              <h4 className="text-[12px] uppercase font-bold tracking-wider text-white">Queue Engine</h4>
              <p className="text-[10px] text-muted mt-1 leading-relaxed">Stable sorting algorithms</p>
            </div>
          </div>
        </div>
      </section>

      {/* THE MASTER FEATURE: 3D PIPELINE SHOWCASE */}
      <section id="pipeline" className="py-32 px-6 border-b border-border bg-[#0B0B0B]/30 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12 mb-16">
            <div className="max-w-xl">
              <p className="text-[10px] uppercase tracking-widest text-muted mb-2">Network Operations</p>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white uppercase">
                Real-Time Node Pipelines
              </h2>
              <p className="text-muted text-[13px] mt-4 leading-relaxed font-light">
                This is a live interactive simulation of wait room schedules. High-priority or VIP nodes slide forward inside the grid pipeline, maintaining linear sequencing. Drag or click on a node sphere to inspect metadata.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-lg max-w-sm">
              <p className="text-[10px] uppercase tracking-wider text-white mb-2 font-semibold">Memorable Waitroom Logic</p>
              <p className="text-[11px] text-muted leading-relaxed">
                As administrative portals call for the next user, the foremost node enters the server gateway with a particle flash. Remaining nodes slide forward to take their place.
              </p>
            </div>
          </div>

          {/* Render our custom 3D QueuePipeline */}
          <QueuePipeline queueLength={6} />
        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section className="py-32 px-6 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-2">Platform Specs</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white uppercase">
              Engineered for Stability
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-8 bg-secondary/40 border border-border rounded-lg glass-panel glass-panel-hover">
              <Zap className="text-white mb-6" size={24} />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">WebSocket Sync</h3>
              <p className="text-[11px] text-muted leading-relaxed font-light">
                Updates waiting positions inside active queues at sub-second speeds using low-overhead WebSockets.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-secondary/40 border border-border rounded-lg glass-panel glass-panel-hover">
              <Shield className="text-white mb-6" size={24} />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">IP Scrubbing</h3>
              <p className="text-[11px] text-muted leading-relaxed font-light">
                Adaptive rate limits prevent automated requests, scraper attacks, and checkout bot injections.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-secondary/40 border border-border rounded-lg glass-panel glass-panel-hover">
              <GitMerge className="text-white mb-6" size={24} />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">Flexible Sorting</h3>
              <p className="text-[11px] text-muted leading-relaxed font-light">
                Configure FIFO wait times, token priority weights, or VIP bypass rooms inside a single panel.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 bg-secondary/40 border border-border rounded-lg glass-panel glass-panel-hover">
              <Cpu className="text-white mb-6" size={24} />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">Memory Cache</h3>
              <p className="text-[11px] text-muted leading-relaxed font-light">
                Synchronized memory storage answers user queries instantly, protecting databases from high-concurrency crash limits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LOGO INFINITE MARQUEE */}
      <section className="py-24 border-b border-border bg-[#050505] overflow-hidden select-none">
        <div className="flex flex-col gap-4">
          <div className="flex overflow-hidden w-full">
            <div className="flex whitespace-nowrap animate-marquee gap-16 text-[32px] sm:text-[50px] font-bold uppercase tracking-widest text-white/5">
              <span>Synapser Studio</span>
              <span>•</span>
              <span>Stardust Labs</span>
              <span>•</span>
              <span>Next Venture</span>
              <span>•</span>
              <span>QueueFlow</span>
              <span>•</span>
              <span>Etherscale</span>
              <span>•</span>
              {/* Duplicate to ensure continuous loop */}
              <span>Synapser Studio</span>
              <span>•</span>
              <span>Stardust Labs</span>
              <span>•</span>
              <span>Next Venture</span>
              <span>•</span>
              <span>QueueFlow</span>
              <span>•</span>
              <span>Etherscale</span>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING PREVIEW PRESETS */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <p className="text-[10px] uppercase tracking-widest text-muted mb-2">Waitroom tiers</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white uppercase">
            Monochrome Plans
          </h2>
          <p className="text-muted text-[12px] mt-2 font-light">
            Simple options for launches of all sizes.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Plan 1 */}
          <div className="p-10 bg-secondary/20 border border-border rounded-xl flex flex-col items-start text-left glass-panel">
            <span className="text-[10px] uppercase tracking-widest text-muted mb-1">Developer</span>
            <h3 className="text-2xl font-semibold text-white uppercase mb-4">Launchpad</h3>
            <div className="text-3xl font-bold mb-6">$0 <span className="text-[11px] text-muted font-normal uppercase">/ month</span></div>
            <ul className="space-y-3 text-[11px] text-muted mb-8 w-full border-t border-white/5 pt-6">
              <li>1 Active Waiting Room</li>
              <li>Max 500 queued members/hr</li>
              <li>Standard FIFO Engine</li>
              <li>WebSockets synchronization</li>
            </ul>
            <Link
              to="/auth"
              className="w-full text-center py-3 bg-white text-black font-semibold text-[10px] uppercase tracking-wider rounded-md border border-white hover:bg-transparent hover:text-white transition duration-300"
            >
              Get Started
            </Link>
          </div>

          {/* Plan 2 */}
          <div className="p-10 bg-white/5 border border-white/20 rounded-xl flex flex-col items-start text-left relative glass-panel">
            <span className="absolute top-4 right-4 bg-white text-black text-[8px] uppercase font-bold px-2 py-0.5 rounded-full">Popular</span>
            <span className="text-[10px] uppercase tracking-widest text-muted mb-1">Startup</span>
            <h3 className="text-2xl font-semibold text-white uppercase mb-4">Enterprise</h3>
            <div className="text-3xl font-bold mb-6">$149 <span className="text-[11px] text-muted font-normal uppercase">/ month</span></div>
            <ul className="space-y-3 text-[11px] text-muted mb-8 w-full border-t border-white/5 pt-6">
              <li>Unlimited Waitrooms</li>
              <li>Up to 100,000 queued members/hr</li>
              <li>FIFO, Priority, VIP Engine modules</li>
              <li>Custom rate limits and widgets</li>
            </ul>
            <Link
              to="/auth"
              className="w-full text-center py-3 bg-white text-black font-semibold text-[10px] uppercase tracking-wider rounded-md border border-white hover:bg-transparent hover:text-white transition duration-300"
            >
              Upgrade Flow
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
