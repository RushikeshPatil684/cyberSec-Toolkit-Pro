import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ toolName }) {
  const location = useLocation();
  const pathname = location.pathname;

  // Only show breadcrumb on tool pages
  if (!pathname.startsWith('/tools/') || pathname === '/tools') {
    return null;
  }

  const crumbs = [
    { label: 'Home', to: '/' },
    { label: 'Tools', to: '/tools' },
  ];

  if (toolName) {
    crumbs.push({ label: toolName, to: pathname, isActive: true });
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <React.Fragment key={crumb.to}>
            {isLast ? (
              <span className="text-cyan-200 font-semibold flex items-center gap-1">
                {index === 0 && <Home size={14} />}
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.to}
                className="hover:text-cyan-200 transition flex items-center gap-1"
              >
                {index === 0 && <Home size={14} />}
                {crumb.label}
              </Link>
            )}
            {!isLast && <ChevronRight size={14} className="text-slate-500" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

