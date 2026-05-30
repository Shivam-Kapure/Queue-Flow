import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Launchpad',
      price: '$0',
      period: 'Forever Free',
      description: 'Ideal for small launches, indie hackers, and developer testing environments.',
      features: [
        '1 Active waiting room slot',
        'Up to 500 members per hour',
        'Standard FIFO queue engine',
        'Real-time WebSocket status updates',
        'Basic rate limit filtering',
        'Community channel support'
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Enterprise',
      price: '$149',
      period: 'per month',
      description: 'Built for high-traffic startups, event platforms, and retail drops.',
      features: [
        'Unlimited active waiting rooms',
        'Up to 100,000 members per hour',
        'FIFO, Priority, and VIP engines',
        'Custom bypass passcodes & keys',
        'Granular IP and user rate limits',
        'Interactive 3D network analytics',
        'Webhook alerts and API access',
        '24/7 Priority support SLA'
      ],
      cta: 'Upgrade Flow',
      popular: true
    }
  ];

  return (
    <div className="relative min-h-screen pt-28 pb-20 px-6">
      <div className="absolute inset-0 grid-lines pointer-events-none opacity-[0.25]"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <p className="text-[10px] uppercase tracking-widest text-muted mb-2">// Platform Plans</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white uppercase mb-4">Pricing Ecosystem</h1>
          <p className="text-muted text-[13px] max-w-md mx-auto leading-relaxed font-light">
            Simple monochrome pricing plans tailored to secure your servers during high-concurrency launches.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className={`p-10 border rounded-xl flex flex-col justify-between items-start relative glass-panel ${
                plan.popular ? 'border-white/20 bg-white/5' : 'border-border bg-secondary/15'
              }`}
            >
              {plan.popular && (
                <span className="absolute top-4 right-4 bg-white text-black text-[8px] uppercase font-bold px-2 py-0.5 rounded-full">
                  Standard Choice
                </span>
              )}

              <div className="w-full">
                <span className="text-[9px] uppercase tracking-widest text-muted">{plan.name}</span>
                <div className="flex items-baseline gap-2 mt-2 mb-4">
                  <span className="text-4xl font-bold text-white uppercase">{plan.price}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted font-normal">/ {plan.period}</span>
                </div>
                <p className="text-xs text-muted leading-relaxed font-light mb-8">{plan.description}</p>

                <div className="border-t border-white/5 w-full pt-6 mb-8">
                  <h4 className="text-[9px] uppercase tracking-widest text-white font-semibold mb-4">Included Features</h4>
                  <ul className="space-y-3.5">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-[11px] text-muted leading-tight font-light">
                        <Check size={12} className="text-white mt-0.5 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link
                to="/auth"
                className={`w-full text-center py-4 text-[10px] uppercase tracking-widest font-semibold rounded transition duration-400 border ${
                  plan.popular
                    ? 'bg-white text-black border-white hover:bg-transparent hover:text-white'
                    : 'bg-transparent text-white border-border hover:border-white'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
