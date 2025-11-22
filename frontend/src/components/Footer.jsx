import React from 'react';
import { Github, Linkedin, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const sections = [
  {
    title: 'Product',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Tools', to: '/tools' },
      { label: 'Reports', to: '/reports' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-16 bg-[#040616] text-slate-300 border-t border-transparent">
      <div className="absolute inset-x-0 -top-[1px] h-[1px] bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <p className="text-xl font-bold text-cyan-200 mb-4">CyberSec Toolkit Pro</p>
            <p className="text-sm text-slate-400">
              Open-source intelligence & AI hardening suite built for teams securing the modern web.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <a
                href="https://github.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="inline-flex h-10 w-10 min-w-[40px] items-center justify-center rounded-full border border-white/10 hover:border-cyan-300/60 hover:text-white transition"
              >
                <Github size={18} />
              </a>
              <a
                href="https://linkedin.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="inline-flex h-10 w-10 min-w-[40px] items-center justify-center rounded-full border border-white/10 hover:border-cyan-300/60 hover:text-white transition"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="mailto:team@cybersectoolkit.pro"
                aria-label="Email CyberSec Toolkit Pro"
                className="inline-flex h-10 w-10 min-w-[40px] items-center justify-center rounded-full border border-white/10 hover:border-cyan-300/60 hover:text-white transition"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2 text-sm">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-slate-300 hover:text-white transition-colors inline-flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-cyan-400" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4">
              Connect
            </h4>
            <p className="text-sm text-slate-400 mb-6">
              Signal intelligence, training, and red-team friendly research for defenders.
            </p>
            <p className="text-xs tracking-wide text-center text-slate-500 border border-white/10 rounded-xl px-4 py-3">
              © 2025 CyberSec Toolkit Pro — Open Source for a Safer Web.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
