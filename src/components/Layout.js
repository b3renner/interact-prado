// src/components/Layout.js
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setSidebarOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6fb", fontFamily: "'DM Sans', sans-serif" }}>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 198 }} />
      )}

      {/* Desktop sidebar - sticky */}
      <div className="sidebar-desktop" style={{ flexShrink: 0 }}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Mobile sidebar - drawer */}
      <div className="sidebar-mobile" style={{
        position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 199,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowX: "hidden" }}>
        {/* Topbar mobile */}
        <div className="mobile-topbar">
          <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#0f2044", display: "flex", alignItems: "center", borderRadius: 8 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <img src="/interact.png" alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: "#0f2044" }}>
            Interact Prado
          </span>
        </div>

        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {children}
        </main>
      </div>

      <style>{`
        .sidebar-desktop { display: flex; position: sticky; top: 0; height: 100vh; }
        .sidebar-mobile  { display: none; }
        .mobile-topbar   { display: none; }

        @media (max-width: 768px) {
          .sidebar-desktop { display: none; }
          .sidebar-mobile  { display: flex; }
          .mobile-topbar   {
            display: flex; align-items: center; gap: 12px;
            padding: 0 16px; height: 56px; background: #fff;
            border-bottom: 1px solid rgba(0,0,0,0.07);
            position: sticky; top: 0; z-index: 100; flex-shrink: 0;
          }

          .rp-page   { padding: 20px 16px !important; }
          .rp-header { flex-direction: column !important; align-items: flex-start !important; gap: 14px !important; margin-bottom: 18px !important; }
          .rp-header-actions { width: 100%; flex-wrap: wrap; gap: 8px !important; }

          .rp-stats  { grid-template-columns: 1fr 1fr !important; }

          .rp-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 16px; }
          .rp-col-hide   { display: none !important; }

          .rp-card-row     { flex-direction: column !important; align-items: flex-start !important; }
          .rp-card-actions { width: 100%; justify-content: flex-end; margin-top: 4px; }

          .rp-att-row    { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .rp-form-grid  { grid-template-columns: 1fr !important; }
          .rp-search-input { width: 100% !important; box-sizing: border-box !important; }
        }
      `}</style>
    </div>
  );
}