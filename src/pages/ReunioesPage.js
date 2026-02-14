// src/pages/ReunioesPage.js
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
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);
const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
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
  const days = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];
  const months = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  const dt = new Date(y, m - 1, d);
  return `${days[dt.getDay()]}, ${d} de ${months[m - 1]} de ${y}`;
}

function statusLabel(s) {
  if (s === "presente") return { label: "Presente", color: "#22c55e", bg: "rgba(34,197,94,0.1)", Icon: IconCheck };
  if (s === "ausente")  return { label: "Ausente",  color: "#ef4444", bg: "rgba(239,68,68,0.1)",  Icon: IconClose };
  return { label: "Justificado", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", Icon: IconWarning };
}

// ─── Main Component ───────────────────────────────────────────
export default function ReunioesPage() {
  const [view, setView] = useState("list"); // list | chamada
  const [meetings, setMeetings] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [attendance, setAttendance] = useState({}); // { membroId: { status, observacao } }
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // nova | sem-reuniao
  const [form, setForm] = useState({ data: "", descricao: "", motivo: "" });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch members
  const fetchMembers = useCallback(async () => {
    const q = query(collection(db, "members"), where("status", "==", "ativo"), orderBy("nome"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }, []);

  // Fetch meetings
  const fetchMeetings = useCallback(async () => {
    const q = query(collection(db, "meetings"), orderBy("data", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [m, mt] = await Promise.all([fetchMembers(), fetchMeetings()]);
    setMembers(m);
    setMeetings(mt);
    setLoading(false);
  }, [fetchMembers, fetchMeetings]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Open attendance sheet
  const openChamada = async (meeting) => {
    setSelectedMeeting(meeting);
    // Load existing attendance
    const q = query(
      collection(db, "attendance"),
      where("referenciaId", "==", meeting.id),
      where("tipoReferencia", "==", "reuniao")
    );
    const snap = await getDocs(q);
    const existing = {};
    snap.docs.forEach((d) => {
      const data = d.data();
      existing[data.membroId] = { status: data.status, observacao: data.observacao || "", docId: d.id };
    });
    // Default to "presente" for members without record
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
        const docId = `${selectedMeeting.id}_${memberId}`;
        await setDoc(doc(db, "attendance", docId), {
          membroId: memberId,
          referenciaId: selectedMeeting.id,
          tipoReferencia: "reuniao",
          status: att.status,
          observacao: att.observacao || "",
          atualizadoEm: new Date().toISOString(),
        });
      }
      // Update meeting status to "realizada"
      await updateDoc(doc(db, "meetings", selectedMeeting.id), { status: "realizada" });
      await loadAll();
      setView("list");
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  // Create meeting
  const handleCreate = async () => {
    if (!form.data) return;
    setSaving(true);
    try {
      if (modalType === "nova") {
        await addDoc(collection(db, "meetings"), {
          data: form.data,
          descricao: form.descricao,
          tipo: "reuniao",
          status: "pendente",
          criadoEm: new Date().toISOString(),
        });
      } else {
        await addDoc(collection(db, "meetings"), {
          data: form.data,
          motivo: form.motivo,
          tipo: "sem-reuniao",
          status: "sem-reuniao",
          criadoEm: new Date().toISOString(),
        });
      }
      setModalOpen(false);
      setForm({ data: "", descricao: "", motivo: "" });
      await loadAll();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  // Delete meeting
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "meetings", id));
      setDeleteConfirm(null);
      await loadAll();
    } catch (e) { console.error(e); }
  };

  // Update attendance for one member
  const setMemberStatus = (memberId, field, value) => {
    setAttendance((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], [field]: value },
    }));
  };

  // ─── Chamada View ─────────────────────────────────────────
  if (view === "chamada") {
    const presentes = Object.values(attendance).filter((a) => a.status === "presente").length;
    const total = members.length;

    return (
      <Layout>
        <div style={styles.page}>
          <button onClick={() => setView("list")} style={styles.backBtn}>
            <IconArrowLeft /> Voltar
          </button>

          <div style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={styles.cardTitle}>Lista de Chamada</h2>
                <p style={{ fontSize: 14, color: "rgba(0,0,0,0.45)", marginTop: 4 }}>
                  {formatDateBR(selectedMeeting?.data)}
                  {selectedMeeting?.descricao && ` — ${selectedMeeting.descricao}`}
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
                {saving ? "Salvando..." : "Salvar Chamada"}
              </button>
            </div>

            {/* Quick actions */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <button
                style={styles.quickBtn}
                onClick={() => {
                  const updated = {};
                  members.forEach((m) => { updated[m.id] = { ...attendance[m.id], status: "presente" }; });
                  setAttendance(updated);
                }}
              >
                Marcar todos como presentes
              </button>
              <button
                style={styles.quickBtn}
                onClick={() => {
                  const updated = {};
                  members.forEach((m) => { updated[m.id] = { ...attendance[m.id], status: "ausente" }; });
                  setAttendance(updated);
                }}
              >
                Marcar todos como ausentes
              </button>
            </div>

            {/* Attendance table */}
            <div style={styles.attTable}>
              <div style={styles.attHeader}>
                <span style={{ flex: 2 }}>Membro</span>
                <span style={{ flex: 2 }}>Status</span>
                <span style={{ flex: 3 }}>Observação</span>
              </div>
              {members.map((member) => {
                const att = attendance[member.id] || { status: "presente", observacao: "" };
                return (
                  <div key={member.id} style={styles.attRow}>
                    <div style={{ flex: 2 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#0f2044" }}>{member.nome}</div>
                      {member.cargo && member.cargo !== "Membro" && (
                        <div style={{ fontSize: 11, color: "rgba(0,0,0,0.4)" }}>{member.cargo}</div>
                      )}
                    </div>
                    <div style={{ flex: 2, display: "flex", gap: 6 }}>
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
                              fontFamily: "'DM Sans', sans-serif",
                              transition: "all 0.15s",
                              borderColor: active ? info.color : "rgba(0,0,0,0.12)",
                              background: active ? info.bg : "transparent",
                              color: active ? info.color : "rgba(0,0,0,0.4)",
                            }}
                          >
                            <info.Icon />
                            {info.label}
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
        <style>{`input:focus { outline: 2px solid #D4AF37; outline-offset: 1px; }`}</style>
      </Layout>
    );
  }

  // ─── List View ────────────────────────────────────────────
  return (
    <Layout>
      <div style={styles.page}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Reuniões</h1>
            <p style={styles.pageSubtitle}>{meetings.filter(m => m.tipo === "reuniao").length} reunião(ões) registrada(s)</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { setModalType("sem-reuniao"); setForm({ data: "", descricao: "", motivo: "" }); setModalOpen(true); }}
              style={styles.btnSecondary}
            >
              <IconX /> Sem Reunião
            </button>
            <button
              onClick={() => { setModalType("nova"); setForm({ data: "", descricao: "", motivo: "" }); setModalOpen(true); }}
              style={styles.btnPrimary}
            >
              <IconPlus /> Nova Reunião
            </button>
          </div>
        </div>

        {loading ? (
          <div style={styles.emptyState}><div style={styles.spinner} /></div>
        ) : meetings.length === 0 ? (
          <div style={styles.emptyState}>
            <IconCalendar />
            <p style={{ color: "rgba(0,0,0,0.3)", marginTop: 12 }}>Nenhuma reunião registrada</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {meetings.map((meeting) => {
              const isCancelled = meeting.tipo === "sem-reuniao";
              const isPending = meeting.status === "pendente";
              return (
                <div key={meeting.id} style={{
                  ...styles.meetingCard,
                  opacity: isCancelled ? 0.65 : 1,
                  borderLeft: `4px solid ${isCancelled ? "#e5e7eb" : isPending ? "#D4AF37" : "#22c55e"}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: isCancelled ? "rgba(0,0,0,0.05)" : isPending ? "rgba(212,175,55,0.1)" : "rgba(34,197,94,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: isCancelled ? "rgba(0,0,0,0.3)" : isPending ? "#D4AF37" : "#22c55e",
                      flexShrink: 0,
                    }}>
                      <IconCalendar />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#0f2044" }}>
                        {formatDateBR(meeting.data)}
                      </div>
                      <div style={{ fontSize: 13, color: "rgba(0,0,0,0.45)", marginTop: 2 }}>
                        {isCancelled
                          ? `Sem reunião${meeting.motivo ? ` — ${meeting.motivo}` : ""}`
                          : meeting.descricao || "Reunião semanal"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {!isCancelled && (
                      <span style={{
                        padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: isPending ? "rgba(212,175,55,0.12)" : "rgba(34,197,94,0.1)",
                        color: isPending ? "#92730a" : "#16a34a",
                      }}>
                        {isPending ? "Pendente" : "Realizada"}
                      </span>
                    )}
                    {!isCancelled && (
                      <button
                        onClick={() => openChamada(meeting)}
                        style={styles.chamadaBtn}
                      >
                        <IconEdit /> {isPending ? "Fazer Chamada" : "Ver / Editar Chamada"}
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteConfirm(meeting)}
                      style={{ ...styles.iconBtn, color: "#ef4444" }}
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Nova reunião / Sem reunião */}
      {modalOpen && (
        <div style={styles.overlay} onClick={() => setModalOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {modalType === "nova" ? "Nova Reunião" : "Registrar Sem Reunião"}
              </h2>
              <button onClick={() => setModalOpen(false)} style={styles.closeBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Data *</label>
                <input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  style={styles.formInput}
                />
              </div>
              {modalType === "nova" ? (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Pauta / Descrição</label>
                  <input
                    placeholder="Ex: Reunião de planejamento"
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
              ) : (
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Motivo</label>
                  <input
                    placeholder="Ex: Feriado, recesso escolar..."
                    value={form.motivo}
                    onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setModalOpen(false)} style={styles.btnSecondarySmall}>Cancelar</button>
              <button
                onClick={handleCreate}
                style={{ ...styles.btnPrimary, opacity: saving || !form.data ? 0.7 : 1 }}
                disabled={saving || !form.data}
              >
                {saving ? "Salvando..." : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete confirm */}
      {deleteConfirm && (
        <div style={styles.overlay} onClick={() => setDeleteConfirm(null)}>
          <div style={{ ...styles.modal, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ ...styles.modalTitle, color: "#ef4444" }}>Remover Registro</h2>
              <button onClick={() => setDeleteConfirm(null)} style={styles.closeBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: "20px 28px" }}>
              <p style={{ color: "rgba(0,0,0,0.7)", lineHeight: 1.6 }}>
                Tem certeza que deseja remover o registro de <strong>{formatDateBR(deleteConfirm.data)}</strong>? Os dados de presença também serão perdidos.
              </p>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setDeleteConfirm(null)} style={styles.btnSecondarySmall}>Cancelar</button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                style={{ ...styles.btnPrimary, background: "#ef4444", boxShadow: "0 4px 12px rgba(239,68,68,0.3)" }}
              >
                Sim, remover
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        input:focus { outline: 2px solid #D4AF37; outline-offset: 1px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
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
  meetingCard: { background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.04)", transition: "box-shadow 0.2s" },
  btnPrimary: { display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#0f2044", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" },
  btnSecondary: { display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#fff", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 10, color: "rgba(0,0,0,0.6)", fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" },
  btnSecondarySmall: { padding: "10px 20px", background: "#f4f6fb", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, color: "rgba(0,0,0,0.6)", fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" },
  chamadaBtn: { display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "rgba(15,32,68,0.07)", border: "none", borderRadius: 8, color: "#0f2044", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" },
  iconBtn: { background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, display: "flex" },
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
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: "rgba(0,0,0,0.5)", textTransform: "uppercase", letterSpacing: "0.6px" },
  formInput: { padding: "10px 12px", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#0f2044", width: "100%", boxSizing: "border-box" },
};