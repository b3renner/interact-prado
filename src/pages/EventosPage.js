// src/pages/EventosPage.js
import React, { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  getDocs, query, orderBy, where, setDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

// ─── Icons ───────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IconPin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconWarning = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const IconSave = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </svg>
);
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

// ─── Helpers ─────────────────────────────────────────────────
function formatDateBR(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const months = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  return `${d} de ${months[m - 1]} de ${y}`;
}

function statusLabel(s) {
  if (s === "presente")    return { label: "Presente",    color: "#22c55e", bg: "rgba(34,197,94,0.1)",   Icon: IconCheck };
  if (s === "ausente")     return { label: "Ausente",     color: "#ef4444", bg: "rgba(239,68,68,0.1)",   Icon: IconClose };
  return                          { label: "Justificado", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", Icon: IconWarning };
}

const EMPTY_FORM = { nome: "", data: "", local: "", parcerias: "", descricao: "" };

// ─── Main Component ───────────────────────────────────────────
export default function EventosPage() {
  const [view, setView] = useState("list"); // list | chamada | form
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchMembers = useCallback(async () => {
    const q = query(collection(db, "members"), where("status", "==", "ativo"), orderBy("nome"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }, []);

  const fetchEvents = useCallback(async () => {
    const q = query(collection(db, "events"), orderBy("data", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [m, ev] = await Promise.all([fetchMembers(), fetchEvents()]);
    setMembers(m);
    setEvents(ev);
    setLoading(false);
  }, [fetchMembers, fetchEvents]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Open attendance for event
  const openChamada = async (event) => {
    setSelectedEvent(event);
    const q = query(
      collection(db, "attendance"),
      where("referenciaId", "==", event.id),
      where("tipoReferencia", "==", "evento")
    );
    const snap = await getDocs(q);
    const existing = {};
    snap.docs.forEach((d) => {
      const data = d.data();
      existing[data.membroId] = { status: data.status, observacao: data.observacao || "", docId: d.id };
    });
    const allMembers = await fetchMembers();
    const full = {};
    allMembers.forEach((m) => {
      full[m.id] = existing[m.id] || { status: "presente", observacao: "" };
    });
    setMembers(allMembers);
    setAttendance(full);
    setView("chamada");
  };

  // Save attendance
  const saveChamada = async () => {
    setSaving(true);
    try {
      for (const memberId of Object.keys(attendance)) {
        const att = attendance[memberId];
        const docId = `evt_${selectedEvent.id}_${memberId}`;
        await setDoc(doc(db, "attendance", docId), {
          membroId: memberId,
          referenciaId: selectedEvent.id,
          tipoReferencia: "evento",
          status: att.status,
          observacao: att.observacao || "",
          atualizadoEm: new Date().toISOString(),
        });
      }
      await loadAll();
      setView("list");
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  // Create / Edit event
  const handleSaveEvent = async () => {
    if (!form.nome || !form.data) return;
    setSaving(true);
    try {
      if (editingEvent) {
        await updateDoc(doc(db, "events", editingEvent.id), { ...form, atualizadoEm: new Date().toISOString() });
      } else {
        await addDoc(collection(db, "events"), { ...form, criadoEm: new Date().toISOString() });
      }
      setView("list");
      setForm(EMPTY_FORM);
      setEditingEvent(null);
      await loadAll();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const openNewEvent = () => {
    setEditingEvent(null);
    setForm(EMPTY_FORM);
    setView("form");
  };

  const openEditEvent = (event) => {
    setEditingEvent(event);
    setForm({
      nome: event.nome || "",
      data: event.data || "",
      local: event.local || "",
      parcerias: event.parcerias || "",
      descricao: event.descricao || "",
    });
    setView("form");
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "events", id));
      setDeleteConfirm(null);
      await loadAll();
    } catch (e) { console.error(e); }
  };

  const setMemberStatus = (memberId, field, value) => {
    setAttendance((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], [field]: value },
    }));
  };

  // ─── Form View ────────────────────────────────────────────
  if (view === "form") {
    return (
      <Layout>
        <div style={styles.page} className="rp-page">
          <button onClick={() => { setView("list"); setForm(EMPTY_FORM); setEditingEvent(null); }} style={styles.backBtn}>
            <IconArrowLeft /> Voltar
          </button>
          <div style={styles.card}>
            <h2 style={{ ...styles.cardTitle, marginBottom: 24 }}>
              {editingEvent ? "Editar Evento" : "Novo Evento"}
            </h2>
            <div style={styles.formGrid} className="rp-form-grid">
              <div style={{ ...styles.fieldGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Nome do Evento *</label>
                <input
                  placeholder="Ex: Acamparact, Feira de Ciências..."
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Data *</label>
                <input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Local</label>
                <input
                  placeholder="Ex: Gravataí, Porto Alegre..."
                  value={form.local}
                  onChange={(e) => setForm({ ...form, local: e.target.value })}
                  style={styles.formInput}
                />
              </div>
              <div style={{ ...styles.fieldGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Parcerias</label>
                <input
                  placeholder="Ex: Rotary Club, Prefeitura..."
                  value={form.parcerias}
                  onChange={(e) => setForm({ ...form, parcerias: e.target.value })}
                  style={styles.formInput}
                />
              </div>
              <div style={{ ...styles.fieldGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Descrição da ação</label>
                <textarea
                  placeholder="Descreva o objetivo e detalhes do evento..."
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  rows={4}
                  style={{ ...styles.formInput, resize: "vertical" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <button onClick={() => { setView("list"); setForm(EMPTY_FORM); setEditingEvent(null); }} style={styles.btnSecondary}>
                Cancelar
              </button>
              <button
                onClick={handleSaveEvent}
                style={{ ...styles.btnPrimary, opacity: saving || !form.nome || !form.data ? 0.7 : 1 }}
                disabled={saving || !form.nome || !form.data}
              >
                <IconSave />
                {saving ? "Salvando..." : (editingEvent ? "Salvar Alterações" : "Criar Evento")}
              </button>
            </div>
          </div>
        </div>
        <style>{`input:focus, textarea:focus { outline: 2px solid #D4AF37; outline-offset: 1px; }`}</style>
      </Layout>
    );
  }

  // ─── Chamada View ─────────────────────────────────────────
  if (view === "chamada") {
    const presentes = Object.values(attendance).filter((a) => a.status === "presente").length;
    const total = members.length;

    return (
      <Layout>
        <div style={styles.page} className="rp-page">
          <button onClick={() => setView("list")} style={styles.backBtn}>
            <IconArrowLeft /> Voltar
          </button>
          <div style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={styles.cardTitle}>Lista de Presença</h2>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#D4AF37", marginTop: 4 }}>
                  {selectedEvent?.nome}
                </p>
                <p style={{ fontSize: 13, color: "rgba(0,0,0,0.45)", marginTop: 2 }}>
                  {formatDateBR(selectedEvent?.data)}
                  {selectedEvent?.local && ` — ${selectedEvent.local}`}
                </p>
                <p style={{ fontSize: 13, color: "#0f2044", fontWeight: 600, marginTop: 6 }}>
                  {presentes}/{total} presentes
                </p>
              </div>
              <button
                onClick={saveChamada}
                style={{ ...styles.btnPrimary, opacity: saving ? 0.7 : 1 }}
                disabled={saving}
              >
                <IconSave />
                {saving ? "Salvando..." : "Salvar Presença"}
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <button style={styles.quickBtn} onClick={() => {
                const u = {};
                members.forEach((m) => { u[m.id] = { ...attendance[m.id], status: "presente" }; });
                setAttendance(u);
              }}>Marcar todos como presentes</button>
              <button style={styles.quickBtn} onClick={() => {
                const u = {};
                members.forEach((m) => { u[m.id] = { ...attendance[m.id], status: "ausente" }; });
                setAttendance(u);
              }}>Marcar todos como ausentes</button>
            </div>

            <div style={styles.attTable}>
              <div style={styles.attHeader}>
                <span style={{ flex: 2 }}>Membro</span>
                <span style={{ flex: 2 }}>Status</span>
                <span style={{ flex: 3 }}>Observação</span>
              </div>
              {members.map((member) => {
                const att = attendance[member.id] || { status: "presente", observacao: "" };
                return (
                  <div key={member.id} style={styles.attRow} className="rp-att-row">
                    <div style={{ flex: 2 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#0f2044" }}>{member.nome}</div>
                      {member.cargo && member.cargo !== "Membro" && (
                        <div style={{ fontSize: 11, color: "rgba(0,0,0,0.4)" }}>{member.cargo}</div>
                      )}
                    </div>
                    <div style={{ flex: 2, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {["presente", "ausente", "justificado"].map((st) => {
                        const info = statusLabel(st);
                        const active = att.status === st;
                        return (
                          <button
                            key={st}
                            onClick={() => setMemberStatus(member.id, "status", st)}
                            style={{
                              display: "flex", alignItems: "center", gap: 4,
                              padding: "5px 10px", borderRadius: 20, border: "1.5px solid",
                              fontSize: 12, fontWeight: 600, cursor: "pointer",
                              fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                              borderColor: active ? info.color : "rgba(0,0,0,0.12)",
                              background: active ? info.bg : "transparent",
                              color: active ? info.color : "rgba(0,0,0,0.4)",
                            }}
                          >
                            <info.Icon />{info.label}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ flex: 3 }}>
                      <input
                        placeholder={att.status === "justificado" ? "Motivo da justificativa..." : "Observação opcional..."}
                        value={att.observacao}
                        onChange={(e) => setMemberStatus(member.id, "observacao", e.target.value)}
                        style={styles.obsInput}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <style>{`input:focus { outline: 2px solid #D4AF37; outline-offset: 1px; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </Layout>
    );
  }

  // ─── List View ────────────────────────────────────────────
  return (
    <Layout>
      <div style={styles.page} className="rp-page">
        <div style={styles.pageHeader} className="rp-header">
          <div>
            <h1 style={styles.pageTitle}>Eventos</h1>
            <p style={styles.pageSubtitle}>{events.length} evento(s) registrado(s)</p>
          </div>
          <button onClick={openNewEvent} style={styles.btnPrimary}>
            <IconPlus /> Novo Evento
          </button>
        </div>

        {loading ? (
          <div style={styles.emptyState}><div style={styles.spinner} /></div>
        ) : events.length === 0 ? (
          <div style={styles.emptyState}>
            <IconStar />
            <p style={{ color: "rgba(0,0,0,0.3)", marginTop: 12 }}>Nenhum evento registrado</p>
            <button onClick={openNewEvent} style={{ ...styles.btnPrimary, marginTop: 16 }}>
              <IconPlus /> Criar primeiro evento
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {events.map((event) => (
              <div key={event.id} style={styles.eventCard} className="rp-card-row">
                <div style={styles.eventIconWrap}>
                  <IconStar />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#0f2044" }}>{event.nome}</div>
                  <div style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", marginTop: 3 }}>
                    {formatDateBR(event.data)}
                    {event.local && (
                      <span style={{ marginLeft: 10, display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <IconPin /> {event.local}
                      </span>
                    )}
                  </div>
                  {event.descricao && (
                    <div style={{ fontSize: 13, color: "rgba(0,0,0,0.4)", marginTop: 4 }}>{event.descricao}</div>
                  )}
                  {event.parcerias && (
                    <div style={{ fontSize: 12, color: "#D4AF37", marginTop: 4, fontWeight: 500 }}>
                      Parcerias: {event.parcerias}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => openChamada(event)} style={styles.chamadaBtn}>
                    <IconEdit /> Lista de Presença
                  </button>
                  <button onClick={() => openEditEvent(event)} style={styles.iconBtn} title="Editar">
                    <IconEdit />
                  </button>
                  <button onClick={() => setDeleteConfirm(event)} style={{ ...styles.iconBtn, color: "#ef4444" }} title="Remover">
                    <IconTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={styles.overlay} onClick={() => setDeleteConfirm(null)}>
          <div style={{ ...styles.modal, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ ...styles.modalTitle, color: "#ef4444" }}>Remover Evento</h2>
              <button onClick={() => setDeleteConfirm(null)} style={styles.closeBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: "20px 28px" }}>
              <p style={{ color: "rgba(0,0,0,0.7)", lineHeight: 1.6 }}>
                Tem certeza que deseja remover o evento <strong>{deleteConfirm.nome}</strong>? Os dados de presença também serão perdidos.
              </p>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setDeleteConfirm(null)} style={styles.btnSecondary}>Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} style={{ ...styles.btnPrimary, background: "#ef4444" }}>
                Sim, remover
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}

const styles = {
  page: { padding: "36px 40px", minHeight: "100vh" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  pageTitle: { fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "#0f2044", margin: "0 0 4px 0" },
  pageSubtitle: { fontSize: 14, color: "rgba(0,0,0,0.4)", margin: 0 },
  card: { background: "#fff", borderRadius: 16, padding: "28px", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" },
  cardTitle: { fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#0f2044", margin: 0 },
  eventCard: { background: "#fff", borderRadius: 14, padding: "20px", border: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "flex-start", gap: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" },
  eventIconWrap: { width: 44, height: 44, borderRadius: 12, background: "rgba(212,175,55,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#D4AF37", flexShrink: 0 },
  btnPrimary: { display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#0f2044", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" },
  btnSecondary: { display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#f4f6fb", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, color: "rgba(0,0,0,0.6)", fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" },
  chamadaBtn: { display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "rgba(212,175,55,0.1)", border: "none", borderRadius: 8, color: "#92730a", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" },
  iconBtn: { background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, display: "flex", color: "#0f2044" },
  backBtn: { display: "flex", alignItems: "center", gap: 8, background: "none", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 10, padding: "8px 16px", color: "rgba(0,0,0,0.6)", fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", marginBottom: 20 },
  quickBtn: { padding: "6px 14px", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, fontSize: 12, fontWeight: 500, color: "rgba(0,0,0,0.55)", fontFamily: "'DM Sans', sans-serif", cursor: "pointer" },
  attTable: { border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, overflow: "hidden" },
  attHeader: { display: "flex", padding: "12px 16px", background: "#f8f9fc", fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", gap: 16 },
  attRow: { display: "flex", alignItems: "center", padding: "14px 16px", borderTop: "1px solid rgba(0,0,0,0.05)", gap: 16, background: "#fff" },
  obsInput: { width: "100%", padding: "7px 10px", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#0f2044", boxSizing: "border-box" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", color: "rgba(0,0,0,0.2)" },
  spinner: { width: 36, height: 36, border: "3px solid rgba(0,0,0,0.08)", borderTop: "3px solid #D4AF37", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 28px", borderBottom: "1px solid rgba(0,0,0,0.08)" },
  modalTitle: { fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#0f2044", margin: 0 },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 12, padding: "20px 28px", borderTop: "1px solid rgba(0,0,0,0.08)" },
  closeBtn: { background: "none", border: "none", cursor: "pointer", color: "rgba(0,0,0,0.4)", padding: 4, borderRadius: 8, display: "flex" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: "rgba(0,0,0,0.5)", textTransform: "uppercase", letterSpacing: "0.6px" },
  formInput: { padding: "10px 12px", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#0f2044", width: "100%", boxSizing: "border-box" },
};