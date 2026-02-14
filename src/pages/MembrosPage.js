import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs, orderBy, query
} from "firebase/firestore";
import { db } from "../firebase/config";

const CARGOS = [
  "Presidente",
  "Vice-Presidente",
  "Diretoria de Projetos",
  "Diretoria Financeira",
  "Comissão de DQA",
  "Comissão de RI",
  "Imagem Pública",
  "Secretaria",
  "Membro",
  "Exchange Student",
];

const LINGUAS_BASE = ["Português", "Inglês", "Espanhol", "Francês", "Alemão", "Italiano", "Outro"];
const NIVEIS = ["A1", "A2", "B1", "B2", "C1", "C2", "Nativo"];
//línguas no forms
const EMPTY_FORM = {
  nome: "",
  aniversario: "",
  contato: "",
  nomeResponsavel: "",
  contatoResponsavel: "",
  linguas: [],
  escola: "",
  cargo: "Membro",
  status: "ativo",
};

function formatLinguas(linguas) {
  if (!linguas || linguas.length === 0) return "—";

  return linguas.map((l) => {
    if (typeof l === "string") return l;
    const nome = l.lingua === "Outro" && l.outro ? l.outro : l.lingua;
    return l.nivel ? `${nome} (${l.nivel})` : nome;
  }).join(", ");
}

export default function MembrosPage() {
  const [membros, setMembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState("");
  const [birthdayModal, setBirthdayModal] = useState(false);
// codigo p calcular semana
  const aniversariantesSemana = React.useMemo(() => {
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - diaSemana);
    inicioSemana.setHours(0, 0, 0, 0);
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);

    return membros
      .filter((m) => {
        if (!m.aniversario) return false;
        const [, mes, dia] = m.aniversario.split("-").map(Number);
        const aniEsteAno = new Date(hoje.getFullYear(), mes - 1, dia);
        return aniEsteAno >= inicioSemana && aniEsteAno <= fimSemana;
      })
      .sort((a, b) => {
        const [, ma, da] = a.aniversario.split("-").map(Number);
        const [, mb, db] = b.aniversario.split("-").map(Number);
        return ma !== mb ? ma - mb : da - db;
      });
  }, [membros]);

  const fetchMembros = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "members"), orderBy("nome"));
      const snap = await getDocs(q);
      setMembros(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMembros(); }, []);

  const openNew = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setEditId(m.id);
    setForm({
      nome: m.nome || "",
      aniversario: m.aniversario || "",
      contato: m.contato || "",
      nomeResponsavel: m.nomeResponsavel || "",
      contatoResponsavel: m.contatoResponsavel || "",
      linguas: m.linguas || [],
      escola: m.escola || "",
      cargo: m.cargo || "Membro",
      status: m.status || "ativo",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "members", editId), form);
      } else {
        await addDoc(collection(db, "members"), { ...form, criadoEm: new Date().toISOString() });
      }
      setModalOpen(false);
      fetchMembros();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "members", id));
      setDeleteConfirm(null);
      fetchMembros();
    } catch (e) {
      console.error(e);
    }
  };

  const addLingua = (lingua) => {
    const jaExiste = form.linguas.some((l) =>
      (typeof l === "string" ? l : l.lingua) === lingua
    );
    if (jaExiste) return;
    setForm((f) => ({
      ...f,
      linguas: [...f.linguas, { lingua, nivel: "B1", outro: "" }],
    }));
  };

  const removeLingua = (idx) => {
    setForm((f) => ({
      ...f,
      linguas: f.linguas.filter((_, i) => i !== idx),
    }));
  };

  const updateLingua = (idx, field, value) => {
    setForm((f) => {
      const updated = [...f.linguas];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...f, linguas: updated };
    });
  };

 
  const linguasNormalizadas = form.linguas.map((l) =>
    typeof l === "string" ? { lingua: l, nivel: "B1", outro: "" } : l
  );

  const filtered = membros.filter((m) =>
    m.nome?.toLowerCase().includes(search.toLowerCase()) ||
    m.cargo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div style={styles.page}>
        {/* header */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Membros</h1>
            <p style={styles.pageSubtitle}>{membros.length} integrante{membros.length !== 1 ? "s" : ""} cadastrado{membros.length !== 1 ? "s" : ""}</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={styles.searchWrapper}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                placeholder="Buscar membro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <button onClick={() => setBirthdayModal(true)} style={styles.btnBirthday}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
                <path d="M12 3 C12 3 10 1 10 1 C10 0 11 0 12 0 C13 0 14 0 14 1 Z" fill="currentColor"/>
              </svg>
              Aniversariantes
              {aniversariantesSemana.length > 0 && (
                <span style={styles.birthdayBadge}>{aniversariantesSemana.length}</span>
              )}
            </button>
            <button onClick={openNew} style={styles.btnPrimary}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Novo Membro
            </button>
          </div>
        </div>

        {/* tabela */}
        <div style={styles.card}>
          {loading ? (
            <div style={styles.emptyState}>
              <div style={styles.spinner} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p style={{ color: "rgba(0,0,0,0.3)", marginTop: 12 }}>Nenhum membro encontrado</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Nome", "Aniversário", "Contato", "Responsável", "Línguas", "Escola", "Cargo", "Status", "Ações"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.id} style={{ ...styles.tr, background: i % 2 === 0 ? "#fff" : "#fafbff" }}>
                    <td style={{ ...styles.td, fontWeight: 600, color: "#0f2044" }}>{m.nome}</td>
                    <td style={styles.td}>{m.aniversario ? formatDate(m.aniversario) : "—"}</td>
                    <td style={styles.td}>{m.contato || "—"}</td>
                    <td style={styles.td}>
                      <div style={{ fontSize: 13 }}>{m.nomeResponsavel || "—"}</div>
                      {m.contatoResponsavel && <div style={{ fontSize: 11, color: "rgba(0,0,0,0.4)" }}>{m.contatoResponsavel}</div>}
                    </td>
                    <td style={styles.td}>{formatLinguas(m.linguas)}</td>
                    <td style={styles.td}>{m.escola || "—"}</td>
                    <td style={styles.td}>
                      <span style={styles.badge}>{m.cargo || "Membro"}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={m.status === "ativo" ? styles.statusAtivo : styles.statusInativo}>
                        {m.status === "ativo" ? "Ativo" : "Desligado"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => openEdit(m)} style={styles.iconBtn} title="Editar">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteConfirm(m)} style={{ ...styles.iconBtn, color: "#ef4444" }} title="Desligar">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* editar ou criar */}
      {modalOpen && (
        <div style={styles.overlay} onClick={() => setModalOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editId ? "Editar Membro" : "Novo Membro"}</h2>
              <button onClick={() => setModalOpen(false)} style={styles.closeBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGrid}>
                <FormField label="Nome completo *">
                  <input style={styles.formInput} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do membro" />
                </FormField>
                <FormField label="Aniversário">
                  <input style={styles.formInput} type="date" value={form.aniversario} onChange={(e) => setForm({ ...form, aniversario: e.target.value })} />
                </FormField>
                <FormField label="Contato (WhatsApp)">
                  <input style={styles.formInput} value={form.contato} onChange={(e) => setForm({ ...form, contato: e.target.value })} placeholder="(51) 99999-9999" />
                </FormField>
                <FormField label="Cargo">
                  <select style={styles.formInput} value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })}>
                    {CARGOS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </FormField>
                <FormField label="Nome do Responsável">
                  <input style={styles.formInput} value={form.nomeResponsavel} onChange={(e) => setForm({ ...form, nomeResponsavel: e.target.value })} placeholder="Nome do responsável" />
                </FormField>
                <FormField label="Contato do Responsável">
                  <input style={styles.formInput} value={form.contatoResponsavel} onChange={(e) => setForm({ ...form, contatoResponsavel: e.target.value })} placeholder="(51) 99999-9999" />
                </FormField>
                <FormField label="Escola">
                  <input style={styles.formInput} value={form.escola} onChange={(e) => setForm({ ...form, escola: e.target.value })} placeholder="Nome da escola" />
                </FormField>
                <FormField label="Status">
                  <select style={styles.formInput} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Desligado</option>
                  </select>
                </FormField>
              </div>

              {/* línguas */}
              <FormField label="Línguas faladas">
                {/* add língua */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4, marginBottom: linguasNormalizadas.length > 0 ? 16 : 0 }}>
                  {LINGUAS_BASE.map((l) => {
                    const jaAdicionada = linguasNormalizadas.some((x) => x.lingua === l);
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => !jaAdicionada && addLingua(l)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: "20px",
                          border: "1px solid",
                          fontSize: 13,
                          cursor: jaAdicionada ? "default" : "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                          transition: "all 0.15s",
                          ...(jaAdicionada
                            ? { background: "#0f2044", borderColor: "#0f2044", color: "#fff", opacity: 0.7 }
                            : { background: "#fff", borderColor: "#e0e0e0", color: "rgba(0,0,0,0.6)" }),
                        }}
                      >
                        {jaAdicionada ? "✓ " : "+ "}{l}
                      </button>
                    );
                  })}
                </div>

                {/* língua + nível + remover" */}
                {linguasNormalizadas.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {linguasNormalizadas.map((l, idx) => (
                      <div key={idx} style={styles.linguaRow}>
                        {/* nome língua */}
                        <div style={styles.linguaNome}>
                          {l.lingua === "Outro" ? (
                            <input
                              placeholder="Qual língua?"
                              value={l.outro || ""}
                              onChange={(e) => updateLingua(idx, "outro", e.target.value)}
                              style={{ ...styles.formInput, fontSize: 13, padding: "7px 10px" }}
                            />
                          ) : (
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#0f2044" }}>{l.lingua}</span>
                          )}
                        </div>

                        {/* nível */}
                        <div style={styles.nivelSelector}>
                          {NIVEIS.map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => updateLingua(idx, "nivel", n)}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                border: "1.5px solid",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                                fontFamily: "'DM Sans', sans-serif",
                                transition: "all 0.12s",
                                borderColor: l.nivel === n ? "#D4AF37" : "rgba(0,0,0,0.12)",
                                background: l.nivel === n ? "rgba(212,175,55,0.12)" : "transparent",
                                color: l.nivel === n ? "#92730a" : "rgba(0,0,0,0.45)",
                              }}
                            >
                              {n}
                            </button>
                          ))}
                        </div>

                        {/* remover */}
                        <button
                          type="button"
                          onClick={() => removeLingua(idx)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "4px", borderRadius: 6, display: "flex", flexShrink: 0 }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </FormField>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={() => setModalOpen(false)} style={styles.btnSecondary}>Cancelar</button>
              <button onClick={handleSave} style={{ ...styles.btnPrimary, opacity: saving ? 0.7 : 1 }} disabled={saving || !form.nome.trim()}>
                {saving ? "Salvando..." : (editId ? "Salvar Alterações" : "Cadastrar Membro")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* cai fora confirmada */}
      {deleteConfirm && (
        <div style={styles.overlay} onClick={() => setDeleteConfirm(null)}>
          <div style={{ ...styles.modal, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ ...styles.modalTitle, color: "#ef4444" }}>Desligar Membro</h2>
              <button onClick={() => setDeleteConfirm(null)} style={styles.closeBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: "20px 28px" }}>
              <p style={{ color: "rgba(0,0,0,0.7)", lineHeight: 1.6 }}>
                Tem certeza que deseja remover <strong>{deleteConfirm.nome}</strong> do sistema? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setDeleteConfirm(null)} style={styles.btnSecondary}>Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} style={{ ...styles.btnPrimary, background: "#ef4444", boxShadow: "0 4px 12px rgba(239,68,68,0.3)" }}>
                Sim, remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* aniversariantes da smn */}
      {birthdayModal && (
        <div style={styles.overlay} onClick={() => setBirthdayModal(false)}>
          <div style={{ ...styles.modal, maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Aniversariantes da Semana</h2>
              <button onClick={() => setBirthdayModal(false)} style={styles.closeBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ padding: "32px 28px", textAlign: "center" }}>
              {aniversariantesSemana.length === 0 ? (
                /* s/ aniversario */
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: "50%",
                    background: "rgba(0,0,0,0.04)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5">
                      <rect x="3" y="10" width="18" height="11" rx="2"/>
                      <path d="M8 10V6a4 4 0 0 1 8 0v4"/>
                      <line x1="12" y1="14" x2="12" y2="17"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: "rgba(0,0,0,0.4)", margin: 0 }}>
                    Não tem aniversariantes essa semana!
                  </p>
                  <p style={{ fontSize: 13, color: "rgba(0,0,0,0.3)", margin: 0 }}>
                    Aproveite para celebrar os próximos
                  </p>
                </div>
              ) : (
                /* c/ aniversario */
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
                  {/* comemoracao */}
                  <div style={{ position: "relative", display: "inline-flex" }}>
                    <div style={{
                      width: 96, height: 96, borderRadius: "50%",
                      background: "linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)",
                      border: "2px solid rgba(212,175,55,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      animation: "birthdayPulse 2s ease-in-out infinite",
                    }}>
                      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                        <path d="M8 3 C8 3 7 1.5 8 1 C9 0.5 9.5 1.5 10 1 C10.5 0.5 11 0 12 0 C13 0 13.5 0.5 14 1 C14.5 1.5 15 0.5 16 1 C17 1.5 16 3 16 3" stroke="#D4AF37" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </div>
                    {/* droga de animacao de estrelinha */}
                    <div style={{ position: "absolute", top: -4, right: -4, animation: "twinkle 1.5s ease-in-out infinite" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#D4AF37">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </div>
                    <div style={{ position: "absolute", bottom: 0, left: -6, animation: "twinkle 1.5s ease-in-out infinite 0.5s" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#D4AF37" opacity="0.6">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </div>
                    <div style={{ position: "absolute", top: 8, left: -8, animation: "twinkle 1.5s ease-in-out infinite 1s" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#D4AF37" opacity="0.4">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </div>
                  </div>

                  <div>
                    <p style={{ fontSize: 13, color: "rgba(0,0,0,0.4)", margin: "0 0 16px 0", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.8px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      
                      Celebrando essa semana
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {aniversariantesSemana.map((m) => {
                        const [, mes, dia] = m.aniversario.split("-").map(Number);
                        const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
                        const hoje = new Date();
                        const aniDate = new Date(hoje.getFullYear(), mes - 1, dia);
                        const isHoje = aniDate.toDateString() === hoje.toDateString();
                        return (
                          <div key={m.id} style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "12px 16px", borderRadius: 12,
                            background: isHoje ? "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.05))" : "#f8f9fc",
                            border: `1px solid ${isHoje ? "rgba(212,175,55,0.35)" : "rgba(0,0,0,0.06)"}`,
                            gap: 16,
                          }}>
                           
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: "50%",
                                background: isHoje ? "rgba(212,175,55,0.15)" : "rgba(15,32,68,0.07)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                              }}>
                                {isHoje ? (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                    <path d="M9 3 C9 3 8 1.5 9 1 C10 0.5 10.5 1.5 11 1 C11.5 0.5 12 0 12 0 C12 0 12.5 0.5 13 1 C13.5 1.5 14 0.5 15 1 C16 1.5 15 3 15 3" strokeWidth="1.5"/>
                                  </svg>
                                ) : (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f2044" strokeWidth="2" opacity="0.5">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                  </svg>
                                )}
                              </div>
                              <div style={{ textAlign: "left" }}>
                                <div style={{ fontWeight: 700, fontSize: 15, color: "#0f2044" }}>{m.nome}</div>
                                {m.cargo && m.cargo !== "Membro" && (
                                  <div style={{ fontSize: 11, color: "rgba(0,0,0,0.4)" }}>{m.cargo}</div>
                                )}
                              </div>
                            </div>
      
                            <div style={{ flexShrink: 0 }}>
                              <div style={{
                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                width: 56, height: 56, borderRadius: "50%",
                                background: isHoje ? "rgba(212,175,55,0.15)" : "rgba(15,32,68,0.07)",
                                border: `1.5px solid ${isHoje ? "rgba(212,175,55,0.4)" : "rgba(0,0,0,0.08)"}`,
                              }}>
                                <div style={{ fontWeight: 800, fontSize: 15, color: isHoje ? "#D4AF37" : "#0f2044", lineHeight: 1 }}>
                                  {String(dia).padStart(2, "0")}
                                </div>
                                <div style={{ fontSize: 10, color: isHoje ? "#D4AF37" : "rgba(0,0,0,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                  {meses[mes - 1]}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ ...styles.modalFooter, justifyContent: "center", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <button onClick={() => setBirthdayModal(false)} style={styles.btnPrimary}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        input:focus, select:focus { outline: 2px solid #D4AF37; outline-offset: 1px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes birthdayPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.3), 0 0 0 8px rgba(212,175,55,0); }
          50% { box-shadow: 0 0 0 8px rgba(212,175,55,0.15), 0 0 0 16px rgba(212,175,55,0); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.4; transform: scale(0.7) rotate(20deg); }
        }
      `}</style>
    </Layout>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(0,0,0,0.5)", textTransform: "uppercase", letterSpacing: "0.6px" }}>{label}</label>
      {children}
    </div>
  );
}

function formatDate(str) {
  if (!str) return "—";
  const [y, m, d] = str.split("-");
  return `${d}/${m}/${y}`;
}

const styles = {
  page: { padding: "36px 40px", minHeight: "100vh" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  pageTitle: { fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "#0f2044", margin: "0 0 4px 0" },
  pageSubtitle: { fontSize: 14, color: "rgba(0,0,0,0.4)", margin: 0 },
  card: { background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" },
  searchWrapper: { position: "relative" },
  searchInput: { paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", fontSize: 14, fontFamily: "'DM Sans', sans-serif", background: "#fff", width: 220 },
  btnPrimary: { display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#0f2044", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", transition: "opacity 0.2s" },
  btnBirthday: { display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "rgba(212,175,55,0.1)", border: "1.5px solid rgba(212,175,55,0.35)", borderRadius: 10, color: "#92730a", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", position: "relative", transition: "background 0.2s" },
  birthdayBadge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 18, height: 18, background: "#D4AF37", color: "#fff", borderRadius: "50%", fontSize: 11, fontWeight: 700, marginLeft: 2 },
  btnSecondary: { padding: "10px 20px", background: "#f4f6fb", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, color: "rgba(0,0,0,0.6)", fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "14px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", borderBottom: "1px solid rgba(0,0,0,0.07)", whiteSpace: "nowrap" },
  tr: { transition: "background 0.15s" },
  td: { padding: "14px 16px", fontSize: 13, color: "rgba(0,0,0,0.7)", borderBottom: "1px solid rgba(0,0,0,0.05)", verticalAlign: "middle" },
  badge: { background: "rgba(15,32,68,0.08)", color: "#0f2044", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" },
  statusAtivo: { background: "rgba(34,197,94,0.1)", color: "#16a34a", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  statusInativo: { background: "rgba(239,68,68,0.1)", color: "#dc2626", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  iconBtn: { background: "none", border: "none", cursor: "pointer", color: "#0f2044", padding: 6, borderRadius: 8, display: "flex", transition: "background 0.15s" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px" },
  spinner: { width: 36, height: 36, border: "3px solid rgba(0,0,0,0.08)", borderTop: "3px solid #D4AF37", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { background: "#fff", borderRadius: 20, width: "100%", maxWidth: 700, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 28px", borderBottom: "1px solid rgba(0,0,0,0.08)" },
  modalTitle: { fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#0f2044", margin: 0 },
  closeBtn: { background: "none", border: "none", cursor: "pointer", color: "rgba(0,0,0,0.4)", padding: 4, borderRadius: 8, display: "flex" },
  modalBody: { padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 12, padding: "20px 28px", borderTop: "1px solid rgba(0,0,0,0.08)" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  formInput: { padding: "10px 12px", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#0f2044", width: "100%", boxSizing: "border-box" },
  linguaRow: { display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#f8f9fc", borderRadius: 10, border: "1px solid rgba(0,0,0,0.07)" },
  linguaNome: { minWidth: 110, flexShrink: 0 },
  nivelSelector: { display: "flex", gap: 4, flexWrap: "wrap", flex: 1 },
};