import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  Building2,
  Users,
  Briefcase,
  Target
} from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/applications', label: 'Applications', icon: Briefcase },
    { path: '/resume-versions', label: 'Resume Versions', icon: FileText },
    { path: '/companies', label: 'Companies', icon: Building2 },
    { path: '/recruiters', label: 'Recruiters', icon: Users },
  ];

  const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    zIndex: 1000,
    padding: '0 16px',
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px',
  };

  const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '700',
    fontSize: '20px',
    color: '#1f2937',
    textDecoration: 'none',
  };

  const navListStyle = {
    display: 'flex',
    gap: '8px',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  };

  const navLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '6px',
    textDecoration: 'none',
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  };

  const activeLinkStyle = {
    ...navLinkStyle,
    background: '#eff6ff',
    color: '#2563eb',
  };

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        <Link to="/" style={logoStyle}>
          <Target size={24} />
          Resume Runner
        </Link>

        <ul style={navListStyle}>
          {navItems.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <Link
                to={path}
                style={location.pathname === path ? activeLinkStyle : navLinkStyle}
              >
                <Icon size={16} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;