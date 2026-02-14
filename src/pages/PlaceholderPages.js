import React from "react";
import Layout from "../components/Layout";

const IconCalendar = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#0f2044" strokeWidth="1.4">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconStar = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.4">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconDollar = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.4">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconWrench = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92730a" strokeWidth="2" style={{ flexShrink: 0 }}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

function ComingSoon({ title, icon, description }) {
  return (
    <Layout>
      <div style={{
        padding: "36px 40px",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 100,
            height: 100,
            borderRadius: 24,
            background: "rgba(15,32,68,0.06)",
            marginBottom: 24,
          }}>
            {icon}
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 28,
            fontWeight: 700,
            color: "#0f2044",
            margin: "0 0 12px 0",
          }}>
            {title}
          </h1>
          <p style={{ color: "rgba(0,0,0,0.45)", lineHeight: 1.6 }}>{description}</p>
          <div style={{
            marginTop: 24,
            padding: "12px 20px",
            background: "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: 12,
            fontSize: 13,
            color: "#92730a",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}>
            <IconWrench />
            Módulo em desenvolvimento — daqui a pouco rola
          </div>
        </div>
      </div>
    </Layout>
  );
}

export function ReunioesPage() {
  return (
    <ComingSoon
      title="Reuniões"
      icon={<IconCalendar />}
      description="Registre e gerencie as reuniões semanais do clube, com lista de chamada completa para cada encontro."
    />
  );
}

export function EventosPage() {
  return (
    <ComingSoon
      title="Eventos"
      icon={<IconStar />}
      description="Crie e acompanhe os eventos do clube, com lista de presença específica para cada ação realizada."
    />
  );
}

export function FinancasPage() {
  return (
    <ComingSoon
      title="Finanças"
      icon={<IconDollar />}
      description="Controle o saldo do clube, registre receitas e despesas mensais com histórico completo."
    />
  );
}