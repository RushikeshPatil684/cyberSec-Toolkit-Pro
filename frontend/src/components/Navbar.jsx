import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Menu, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const primaryLinks = [
  { label: 'Home', to: '/', exact: true },
  { label: 'Tools', to: '/tools' },
  { label: 'Reports', to: '/reports' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export default function Navbar({ onMenuClick }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
      setDropdownOpen(false);
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const navLinkClass = ({ isActive }) =>
    `relative px-3 py-2 text-sm font-semibold tracking-wide transition-all duration-200 ${
      isActive ? 'text-cyan-300' : 'text-slate-300'
    } group`;

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl bg-[rgba(5,8,22,0.85)] border-b border-cyan-500/20 shadow-[0_0_20px_rgba(0,255,255,0.12)]"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-full border border-white/10 text-slate-200 hover:text-cyan-300 hover:border-cyan-400/50 transition"
              aria-label="Toggle menu"
            >
              <Menu size={22} />
            </button>
            <Link
              to="/"
              className="text-2xl font-black tracking-tight text-cyan-300 hover:text-white transition drop-shadow-[0_0_12px_rgba(0,255,255,0.6)]"
              aria-label="Home - CyberSec Toolkit Pro"
            >
              CyberSec <span className="text-gradient">Toolkit Pro</span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {primaryLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.exact} className={navLinkClass}>
                {link.label}
                <span className="absolute left-3 right-3 -bottom-1 h-0.5 bg-gradient-to-r from-cyan-400 via-cyan-200 to-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-200" />
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-2 py-1 hover:border-cyan-300/60 transition relative"
                  aria-label="User menu"
                >
                  {currentUser.photoURL && (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User avatar'}
                      className="w-10 h-10 rounded-full object-cover border border-cyan-300/40 z-30 relative"
                      onError={(e) => {
                        console.warn('[Navbar] Avatar image failed to load:', currentUser.photoURL);
                        e.target.style.display = 'none';
                        const fallback = e.target.parentElement.querySelector('.navbar-avatar-fallback');
                        if (fallback) {
                          fallback.style.display = 'flex';
                          fallback.classList.remove('hidden');
                        }
                      }}
                    />
                  )}
                  <div className={`navbar-avatar-fallback w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white border border-cyan-300/40 z-30 relative ${currentUser.photoURL ? 'hidden' : 'flex'}`}>
                    {currentUser.displayName?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-3 w-56 rounded-2xl bg-[#070b1d] border border-white/10 shadow-2xl overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-sm font-semibold text-white">{currentUser.displayName || 'Operator'}</p>
                        <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-slate-200 hover:bg-white/5 transition"
                      >
                        <User size={16} className="text-cyan-300" />
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-300 hover:bg-red-500/10 transition"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white transition"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary px-5 py-2 rounded-full shadow-[0_0_18px_rgba(0,255,255,0.28)] text-sm"
                >
                  Join Beta
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="lg:hidden pb-4">
          <div className="flex flex-wrap gap-3">
            {primaryLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                className={({ isActive }) =>
                  `text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full border ${
                    isActive ? 'border-cyan-400 text-cyan-200' : 'border-white/10 text-slate-400'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
