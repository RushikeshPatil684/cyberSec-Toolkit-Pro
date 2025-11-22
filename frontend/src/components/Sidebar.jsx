import React from 'react';
import { NavLink } from 'react-router-dom';
import { Wrench, FileText, X, Bug } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-400/40 shadow-[0_0_18px_rgba(0,255,255,0.25)]'
        : 'text-slate-300 hover:text-white border border-white/5 hover:border-cyan-300/40'
    }`;

  const links = [
    { to: '/tools', label: 'Tools', icon: Wrench },
    { to: '/reports', label: 'Reports', icon: FileText },
  ];

  if (process.env.REACT_APP_ENABLE_DEBUG_SAVE === 'true' || process.env.NODE_ENV !== 'production') {
    links.push({ to: '/debug', label: 'Debug', icon: Bug });
  }

  return (
    <motion.aside
      initial={false}
      animate={{
        x: isOpen ? 0 : -280,
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 left-0 z-50 w-64 bg-[#050b1f]/95 border-r border-white/5 backdrop-blur-xl shadow-[20px_0_45px_rgba(0,0,0,0.35)]"
      aria-label="Sidebar navigation"
    >
      <div className="flex items-center justify-between p-4 border-b border-white/5 md:hidden">
        <h2 className="text-lg font-semibold text-cyan-200">Menu</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full border border-white/10 text-slate-200 hover:text-white hover:border-cyan-300/60 transition"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="p-4 flex flex-col gap-3" role="navigation">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={linkClass}
              onClick={() => {
                if (window.innerWidth < 768) onClose();
              }}
            >
              <Icon size={18} className="text-cyan-300" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </motion.aside>
  );
}
