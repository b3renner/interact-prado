import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: "/membros",
    label: "Membros",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: "/reunioes",
    label: "Reuniões",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    to: "/eventos",
    label: "Eventos",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    to: "/financas",
    label: "Finanças",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate("/login");
  };

  return (
    <aside style={styles.sidebar}>
      {/* logo */}
      <div style={styles.logoArea}>
        <div style={styles.emblem}>
          <img
            src="/interact.png"
            alt="Interact Prado"
            style={{ width: 32, height: 32, objectFit: "contain", filter: "drop-shadow(0 0 6px rgba(212,175,55,0.35))" }}
          />
        </div>
        <div>
          <div style={styles.clubName}>Interact Prado</div>
          <div style={styles.clubSub}>Gravataí</div>
        </div>
      </div>

      {/* nav */}
      <nav style={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
            })}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* cai fora */}
      <button
        onClick={handleLogout}
        style={{ ...styles.logoutBtn, opacity: loggingOut ? 0.6 : 1 }}
        disabled={loggingOut}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Sair
      </button>

      <style>{`
        a.nav-active { background: rgba(212,175,55,0.12) !important; color: #D4AF37 !important; }
        a.nav-active span svg { stroke: #D4AF37 !important; }
      `}</style>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "240px",
    minWidth: "240px",
    height: "100vh",
    background: "#0f2044",
    display: "flex",
    flexDirection: "column",
    padding: "24px 16px",
    boxSizing: "border-box",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    position: "sticky",
    top: 0,
    fontFamily: "'DM Sans', sans-serif",
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "36px",
    paddingLeft: "6px",
  },
  emblem: {
    filter: "drop-shadow(0 0 8px rgba(212,175,55,0.35))",
    flexShrink: 0,
  },
  clubName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "14px",
    fontWeight: 700,
    color: "#ffffff",
    lineHeight: 1.2,
  },
  clubSub: {
    fontSize: "10px",
    color: "#D4AF37",
    letterSpacing: "2px",
    textTransform: "uppercase",
    fontWeight: 500,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "11px 14px",
    borderRadius: "10px",
    color: "rgba(255,255,255,0.55)",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 500,
    transition: "background 0.18s, color 0.18s",
  },
  navItemActive: {
    background: "rgba(212,175,55,0.12)",
    color: "#D4AF37",
  },
  navIcon: {
    display: "flex",
    flexShrink: 0,
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "11px 14px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.45)",
    fontSize: "13px",
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    transition: "background 0.18s, color 0.18s",
    marginTop: "8px",
  },
};