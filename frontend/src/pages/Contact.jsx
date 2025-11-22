import React, { useState } from 'react';
import { toast } from 'react-toastify';
import PageWrapper from '../components/PageWrapper';
import { motion } from 'framer-motion';
import { Send, Mail, User, MessageSquare, Linkedin, Github } from 'lucide-react';
import SEO from '../components/SEO';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ error: '', success: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ error: '', success: '' });

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Unable to send message right now.');
      }

      setStatus({ error: '', success: data.message || 'Message sent successfully!' });
      toast.success(data.message || 'Message sent successfully!');
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      const msg = err.message || 'Unable to send message right now.';
      setStatus({ error: msg, success: '' });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Contact - CyberSec Toolkit Pro"
        description="Get in touch with the CyberSec Toolkit Pro team. Have questions or feedback? Send us a message."
      />
      <PageWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="w-full max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-cyan-400 glow-text">
                Contact Us
              </h1>
              <p className="text-lg sm:text-xl text-gray-400">
                Have a question or feedback? Send us a message and we'll get back to you.
              </p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              onSubmit={handleSubmit}
              className="hacker-card rounded-2xl p-8 space-y-6"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Response time</p>
                <p className="mt-1">
                  We try to reply within 48 hours. For quick collaboration, reach us via GitHub or LinkedIn below.
                </p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2 text-cyan-400 flex items-center gap-2">
                  <User size={16} />
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[#0F172A] border border-cyan-500/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-cyan-400 flex items-center gap-2">
                  <Mail size={16} />
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[#0F172A] border border-cyan-500/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2 text-cyan-400 flex items-center gap-2">
                  <MessageSquare size={16} />
                  Message
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg bg-[#0F172A] border border-cyan-500/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition resize-none"
                  placeholder="Your message..."
                />
              </div>

              {status.error && <p className="text-sm text-red-300">{status.error}</p>}
              {status.success && <p className="text-sm text-emerald-300">{status.success}</p>}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)' }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-lg shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                <Send size={20} />
                {loading ? 'Sending...' : 'Send Message'}
              </motion.button>
            </motion.form>
            <div className="mt-10 text-center text-slate-400">
              <p>We’d love to hear from you!</p>
              <div className="mt-4 flex items-center justify-center gap-4">
                <a href="https://github.com/" target="_blank" rel="noreferrer" className="rounded-full border border-white/10 p-3 hover:border-cyan-300/60">
                  <Github size={20} />
                </a>
                <a href="https://linkedin.com/" target="_blank" rel="noreferrer" className="rounded-full border border-white/10 p-3 hover:border-cyan-300/60">
                  <Linkedin size={20} />
                </a>
                <a href="mailto:team@cybersectoolkit.pro" className="rounded-full border border-white/10 p-3 hover:border-cyan-300/60">
                  <Mail size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}
