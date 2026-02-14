// src/pages/LoginPage.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (user) navigate(from, { replace: true });
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, [user, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError("Preencha todos os campos.");
      return;
    }
    setLocalError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setLocalError(result.error);
    }
  };

  return (
    <div style={styles.root}>
      {/* Animated background shapes */}
      <div style={styles.bgShape1} />
      <div style={styles.bgShape2} />
      <div style={styles.bgShape3} />

      <div style={{ ...styles.card, opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}>
        {/* Logo area */}
        <div style={styles.logoArea}>
          <div style={styles.emblem}>
            <img
              src="/interact.png"
              alt="Interact Prado"
              style={{
                width: 72,
                height: 72,
                objectFit: "contain",
                animation: "gearSpin 12s linear infinite",
                filter: "drop-shadow(0 0 16px rgba(212,175,55,0.5))",
              }}
            />
          </div>
          <h1 style={styles.clubName}>Interact Prado</h1>
          <p style={styles.clubSub}>Gravataí</p>
        </div>

        <div style={styles.divider} />

        <h2 style={styles.title}>Acesso Restrito</h2>
        <p style={styles.subtitle}>Entre com suas credenciais de organizador</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>E-mail</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="organizador@interactprado.com"
                style={styles.input}
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Senha</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {localError && (
            <div style={styles.errorBox}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {localError}
            </div>
          )}

          <button type="submit" style={{ ...styles.btn, opacity: loading ? 0.75 : 1 }} disabled={loading}>
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={styles.spinner} />
                Entrando...
              </span>
            ) : (
              "Entrar no Sistema"
            )}
          </button>
        </form>

        <p style={styles.footer}>
          Sistema de uso exclusivo da diretoria do Interact Prado Gravataí
        </p>
      </div>

      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(20px,-15px) rotate(5deg)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(-15px,20px) rotate(-4deg)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(10px,10px)} }
        @keyframes spinSmall { to{transform:rotate(360deg)} }
        @keyframes gearSpin {
          0%   { transform: rotate(0deg); filter: drop-shadow(0 0 10px rgba(212,175,55,0.4)); }
          25%  { filter: drop-shadow(0 0 18px rgba(212,175,55,0.7)); }
          50%  { transform: rotate(180deg); filter: drop-shadow(0 0 10px rgba(212,175,55,0.4)); }
          75%  { filter: drop-shadow(0 0 18px rgba(212,175,55,0.7)); }
          100% { transform: rotate(360deg); filter: drop-shadow(0 0 10px rgba(212,175,55,0.4)); }
        }
        input::placeholder { color: rgba(255,255,255,0.3); }
        input:focus { outline: none; border-color: #D4AF37 !important; background: rgba(255,255,255,0.07) !important; }
        button:hover:not(:disabled) { filter: brightness(1.1); }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a1628 0%, #0f2044 50%, #0d1a38 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'DM Sans', sans-serif",
  },
  bgShape1: {
    position: "absolute",
    top: "-120px",
    right: "-80px",
    width: "480px",
    height: "480px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)",
    animation: "float1 8s ease-in-out infinite",
  },
  bgShape2: {
    position: "absolute",
    bottom: "-100px",
    left: "-60px",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(30,80,160,0.25) 0%, transparent 70%)",
    animation: "float2 10s ease-in-out infinite",
  },
  bgShape3: {
    position: "absolute",
    top: "50%",
    left: "15%",
    width: "200px",
    height: "200px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)",
    animation: "float3 6s ease-in-out infinite",
  },
  card: {
    position: "relative",
    zIndex: 10,
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "24px",
    padding: "48px 44px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.08) inset",
  },
  logoArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    marginBottom: "24px",
  },
  emblem: {
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  clubName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "22px",
    fontWeight: 700,
    color: "#ffffff",
    margin: 0,
    letterSpacing: "0.5px",
  },
  clubSub: {
    fontSize: "12px",
    color: "#D4AF37",
    margin: 0,
    letterSpacing: "3px",
    textTransform: "uppercase",
    fontWeight: 500,
  },
  divider: {
    height: "1px",
    background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)",
    marginBottom: "28px",
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "20px",
    fontWeight: 600,
    color: "#ffffff",
    margin: "0 0 6px 0",
    textAlign: "center",
  },
  subtitle: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    margin: "0 0 28px 0",
    fontWeight: 300,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },
  label: {
    fontSize: "12px",
    fontWeight: 600,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    color: "rgba(255,255,255,0.35)",
    display: "flex",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "13px 44px 13px 42px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px",
    color: "#ffffff",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.2s, background 0.2s",
    boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute",
    right: "14px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "rgba(255,255,255,0.35)",
    display: "flex",
    padding: "0",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#fca5a5",
    fontSize: "13px",
  },
  btn: {
    marginTop: "4px",
    padding: "14px",
    background: "linear-gradient(135deg, #D4AF37 0%, #f0cc5a 50%, #D4AF37 100%)",
    backgroundSize: "200% 200%",
    border: "none",
    borderRadius: "10px",
    color: "#0a1628",
    fontSize: "15px",
    fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    transition: "opacity 0.2s, filter 0.2s, transform 0.15s",
    letterSpacing: "0.3px",
    boxShadow: "0 4px 20px rgba(212,175,55,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  spinner: {
    display: "inline-block",
    width: "14px",
    height: "14px",
    border: "2px solid rgba(10,22,40,0.3)",
    borderTop: "2px solid #0a1628",
    borderRadius: "50%",
    animation: "spinSmall 0.7s linear infinite",
  },
  footer: {
    marginTop: "24px",
    fontSize: "11px",
    color: "rgba(255,255,255,0.2)",
    textAlign: "center",
    lineHeight: 1.5,
  },
};