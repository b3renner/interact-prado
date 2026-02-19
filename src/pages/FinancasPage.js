// src/pages/FinancasPage.js
import React, { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import {
  collection, addDoc, deleteDoc, doc, getDocs, query, where, setDoc, getDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const CATEGORIAS_RECEITA = ["Mensalidade", "Doação", "Evento", "Outros"];
const CATEGORIAS_DESPESA = ["Evento", "Material", "Alimentação", "Transporte", "Outros"];

// FIX 1: parse date string manually to avoid UTC timezone shift
// new Date("2025-02-19") is treated as UTC midnight, which in UTC-3 becomes Feb 18
const parseDateLocal = (dateStr) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

// icones
const IconArrowUp = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>);
const IconArrowDown = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>);
const IconDollar = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const IconTrash = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>);
const IconCheck = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>);

export default function FinancasPage() {
  const [view, setView] = useState("dashboard");

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [finances, setFinances] = useState([]);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [valorMensalidade, setValorMensalidade] = useState(15);
  const [stats, setStats] = useState({ saldo: 0, receitas: 0, despesas: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");

  const [form, setForm] = useState({ valor: "", descricao: "", categoria: "", outroDescricao: "", data: "" });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // FIX 3: track which cell is being toggled for optimistic UI
  const [togglingPayment, setTogglingPayment] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const fSnap = await getDocs(collection(db, "finances"));
      const allFinances = fSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFinances(allFinances);

      const mSnap = await getDocs(query(collection(db, "members"), where("status", "==", "ativo")));
      const allMembers = mSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMembers(allMembers);

      const pSnap = await getDocs(collection(db, "memberPayments"));
      const allPayments = pSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPayments(allPayments);

      const settingsDoc = await getDoc(doc(db, "settings", "config"));
      if (settingsDoc.exists()) {
        setValorMensalidade(settingsDoc.data().valorMensalidade || 15);
      }

      const thisMonthFinances = allFinances.filter((f) => f.mes === selectedMonth && f.ano === selectedYear);
      const receitas = thisMonthFinances.filter((f) => f.tipo === "receita").reduce((acc, f) => acc + f.valor, 0);
      const despesas = thisMonthFinances.filter((f) => f.tipo === "despesa").reduce((acc, f) => acc + f.valor, 0);

      const totalReceitas = allFinances.filter((f) => f.tipo === "receita").reduce((acc, f) => acc + f.valor, 0);
      const totalDespesas = allFinances.filter((f) => f.tipo === "despesa").reduce((acc, f) => acc + f.valor, 0);
      const saldo = totalReceitas - totalDespesas;

      setStats({ saldo, receitas, despesas });
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [selectedMonth, selectedYear]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openModal = (tipo) => {
    const hoje = new Date();
    setModalType(tipo);
    setForm({
      valor: "",
      descricao: "",
      categoria: tipo === "receita" ? CATEGORIAS_RECEITA[0] : CATEGORIAS_DESPESA[0],
      outroDescricao: "",
      data: `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`,
    });
    setModalOpen(true);
  };

  const handleSaveTransaction = async () => {
    if (!form.valor || !form.data) return;
    setSaving(true);
    try {
      const [ano, mes] = form.data.split("-").map(Number);
      // FIX 4: append custom description when categoria is "Outros"
      const categoriaFinal = form.categoria === "Outros" && form.outroDescricao.trim()
        ? `Outros — ${form.outroDescricao.trim()}`
        : form.categoria;

      await addDoc(collection(db, "finances"), {
        tipo: modalType,
        valor: parseFloat(form.valor),
        descricao: form.descricao || (modalType === "receita" ? "Receita" : "Despesa"),
        categoria: categoriaFinal,
        data: form.data,
        mes: mes - 1,
        ano,
        origem: "manual",
        criadoEm: new Date().toISOString(),
      });
      setModalOpen(false);
      await fetchAll();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "finances", id));
      setDeleteConfirm(null);
      await fetchAll();
    } catch (e) { console.error(e); }
  };

  // FIX 2: query Firestore directly to avoid stale local state causing duplicates
  // FIX 3: optimistic local update so UI responds instantly, no flicker
  const togglePayment = async (membroId, mes, ano) => {
    const paymentId = `${membroId}_${mes}_${ano}`;
    const key = `${membroId}_${mes}_${ano}`;
    setTogglingPayment(key);

    try {
      const paymentRef = doc(db, "memberPayments", paymentId);
      const paymentSnap = await getDoc(paymentRef);
      const exists = paymentSnap.exists();

      if (exists) {
        // Optimistic removal before async ops
        setPayments((prev) => prev.filter(
          (p) => !(p.membroId === membroId && p.mes === mes && p.ano === ano)
        ));
        await deleteDoc(paymentRef);
        const financeEntry = finances.find(
          (f) => f.origem === "mensalidade" && f.membroId === membroId && f.mes === mes && f.ano === ano
        );
        if (financeEntry) await deleteDoc(doc(db, "finances", financeEntry.id));
      } else {
        // Optimistic addition before async ops
        const newPayment = { id: paymentId, membroId, mes, ano, pago: true, dataPagamento: new Date().toISOString() };
        setPayments((prev) => [...prev, newPayment]);

        await setDoc(paymentRef, {
          membroId, mes, ano, pago: true, dataPagamento: new Date().toISOString(),
        });

        const membro = members.find((m) => m.id === membroId);
        // FIX 1: build today's date as a local string to avoid timezone shift
        const hoje = new Date();
        const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
        await addDoc(collection(db, "finances"), {
          tipo: "receita",
          valor: valorMensalidade,
          descricao: `Mensalidade — ${membro?.nome || "Membro"}`,
          categoria: "Mensalidade",
          data: dataHoje,
          mes, ano,
          origem: "mensalidade",
          membroId,
          criadoEm: new Date().toISOString(),
        });
      }

      // Refresh in background after UI already updated
      await fetchAll();
    } catch (e) { console.error(e); }

    setTogglingPayment(null);
  };

  const updateValorMensalidade = async (novoValor) => {
    try {
      await setDoc(doc(db, "settings", "config"), { valorMensalidade: novoValor }, { merge: true });
      setValorMensalidade(novoValor);
      setModalOpen(false);
    } catch (e) { console.error(e); }
  };

  const years = [2025, 2026, 2027];
  const monthFinances = finances.filter((f) => f.mes === selectedMonth && f.ano === selectedYear);

  if (view === "dashboard") {
    return (
      <Layout>
        <div style={styles.page} className="rp-page">
          <div style={styles.pageHeader} className="rp-header">
            <div>
              <h1 style={styles.pageTitle}>Finanças</h1>
              <p style={styles.pageSubtitle}>Controle financeiro do clube</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }} className="rp-header-actions">
              <button onClick={() => setView("mensalidades")} style={styles.btnSecondary}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <line x1="20" y1="8" x2="20" y2="14"/>
                  <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                Mensalidades
              </button>
              <button onClick={() => openModal("receita")} style={styles.btnSuccess}>
                <IconArrowUp /> Receita
              </button>
              <button onClick={() => openModal("despesa")} style={styles.btnDanger}>
                <IconArrowDown /> Despesa
              </button>
            </div>
          </div>

          <div style={styles.statsRow} className="rp-stats">
            <div style={styles.statCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={styles.statLabel}>Saldo Atual</p>
                  <p style={{ ...styles.statValue, color: stats.saldo >= 0 ? "#0f2044" : "#ef4444" }}>
                    R$ {stats.saldo.toFixed(2).replace(".", ",")}
                  </p>
                </div>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(15,32,68,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconDollar />
                </div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={styles.statLabel}>Receitas do Mês</p>
                  <p style={{ ...styles.statValue, color: "#22c55e" }}>
                    R$ {stats.receitas.toFixed(2).replace(".", ",")}
                  </p>
                </div>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#22c55e" }}>
                  <IconArrowUp />
                </div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={styles.statLabel}>Despesas do Mês</p>
                  <p style={{ ...styles.statValue, color: "#ef4444" }}>
                    R$ {stats.despesas.toFixed(2).replace(".", ",")}
                  </p>
                </div>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
                  <IconArrowDown />
                </div>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <h3 style={{ ...styles.cardTitle, margin: 0 }}>Histórico</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <select style={styles.select} value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <select style={styles.select} value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                  {years.map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <div style={styles.emptyState}><div style={styles.spinner} /></div>
            ) : monthFinances.length === 0 ? (
              <div style={styles.emptyState}>
                <IconDollar />
                <p style={{ color: "rgba(0,0,0,0.3)", marginTop: 12 }}>Nenhuma transação neste mês</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {monthFinances.sort((a, b) => parseDateLocal(b.data) - parseDateLocal(a.data)).map((f) => {
                  const isReceita = f.tipo === "receita";
                  return (
                    <div key={f.id} style={styles.transactionCard}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: isReceita ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: isReceita ? "#22c55e" : "#ef4444",
                          flexShrink: 0,
                        }}>
                          {isReceita ? <IconArrowUp /> : <IconArrowDown />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#0f2044" }}>{f.descricao}</div>
                          <div style={{ fontSize: 12, color: "rgba(0,0,0,0.4)", marginTop: 2 }}>
                            {/* FIX 1: parseDateLocal avoids UTC→local timezone date shift */}
                            {f.categoria} • {parseDateLocal(f.data).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: isReceita ? "#22c55e" : "#ef4444" }}>
                          {isReceita ? "+" : "-"} R$ {f.valor.toFixed(2).replace(".", ",")}
                        </span>
                        {f.origem !== "mensalidade" && (
                          <button onClick={() => setDeleteConfirm(f)} style={styles.iconBtn}>
                            <IconTrash />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* modal nova transacao */}
        {modalOpen && modalType !== "config" && (
          <div style={styles.overlay} onClick={() => setModalOpen(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Nova {modalType === "receita" ? "Receita" : "Despesa"}</h2>
                <button onClick={() => setModalOpen(false)} style={styles.closeBtn}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Valor *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Descrição</label>
                  <input
                    placeholder="Ex: Compra de materiais"
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Categoria</label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value, outroDescricao: "" })}
                    style={styles.formInput}
                  >
                    {(modalType === "receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                {/* FIX 4: conditional field when "Outros" is selected */}
                {form.categoria === "Outros" && (
                  <div style={{ ...styles.fieldGroup, animation: "fadeIn 0.15s ease" }}>
                    <label style={styles.label}>Qual outro tipo?</label>
                    <input
                      placeholder="Descreva o tipo..."
                      value={form.outroDescricao}
                      onChange={(e) => setForm({ ...form, outroDescricao: e.target.value })}
                      style={{ ...styles.formInput, borderColor: "#0f2044" }}
                      autoFocus
                    />
                  </div>
                )}
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Data *</label>
                  <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} style={styles.formInput} />
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button onClick={() => setModalOpen(false)} style={styles.btnSecondarySmall}>Cancelar</button>
                <button
                  onClick={handleSaveTransaction}
                  style={{ ...styles.btnPrimary, opacity: saving || !form.valor || !form.data ? 0.7 : 1 }}
                  disabled={saving || !form.valor || !form.data}
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* modal deletar */}
        {deleteConfirm && (
          <div style={styles.overlay} onClick={() => setDeleteConfirm(null)}>
            <div style={{ ...styles.modal, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={{ ...styles.modalTitle, color: "#ef4444" }}>Remover Transação</h2>
                <button onClick={() => setDeleteConfirm(null)} style={styles.closeBtn}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div style={{ padding: "20px 28px" }}>
                <p style={{ color: "rgba(0,0,0,0.7)", lineHeight: 1.6 }}>
                  Tem certeza que deseja remover <strong>{deleteConfirm.descricao}</strong> no valor de <strong>R$ {deleteConfirm.valor.toFixed(2)}</strong>?
                </p>
              </div>
              <div style={styles.modalFooter}>
                <button onClick={() => setDeleteConfirm(null)} style={styles.btnSecondarySmall}>Cancelar</button>
                <button onClick={() => handleDelete(deleteConfirm.id)} style={{ ...styles.btnPrimary, background: "#ef4444" }}>
                  Sim, remover
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </Layout>
    );
  }

  // ─── Mensalidades view ────────────────────────────────────────
  return (
    <Layout>
      <div style={styles.page} className="rp-page">
        <div style={styles.pageHeader} className="rp-header">
          <div>
            <h1 style={styles.pageTitle}>Mensalidades</h1>
            <p style={styles.pageSubtitle}>Controle de pagamentos mensais</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }} className="rp-header-actions">
            <button onClick={() => setView("dashboard")} style={styles.btnSecondary}>
              ← Voltar
            </button>
            <button
              onClick={() => {
                setModalType("config");
                setForm({ valor: String(valorMensalidade), descricao: "", categoria: "", outroDescricao: "", data: "" });
                setModalOpen(true);
              }}
              style={styles.btnSecondary}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6M5.2 5.2l4.2 4.2m5.2 5.2l4.2 4.2M1 12h6m6 0h6M5.2 18.8l4.2-4.2m5.2-5.2l4.2-4.2"/>
              </svg>
              Valor: R$ {valorMensalidade.toFixed(2).replace(".", ",")}
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <div className="rp-table-wrap">
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Membro</th>
                  {MONTHS.map((m, i) => <th key={i} style={styles.th}>{m.substring(0, 3)}</th>)}
                </tr>
              </thead>
              <tbody>
                {members.sort((a, b) => a.nome.localeCompare(b.nome)).map((m) => (
                  <tr key={m.id} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: 600, color: "#0f2044" }}>{m.nome}</td>
                    {MONTHS.map((_, i) => {
                      const pago = payments.some((p) => p.membroId === m.id && p.mes === i && p.ano === selectedYear);
                      const isToggling = togglingPayment === `${m.id}_${i}_${selectedYear}`;
                      return (
                        <td key={i} style={{ ...styles.td, textAlign: "center" }}>
                          {/* FIX 3: instant visual feedback via optimistic state, smooth CSS transition */}
                          <button
                            onClick={() => !isToggling && togglePayment(m.id, i, selectedYear)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              border: "2px solid",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: isToggling ? "wait" : "pointer",
                              background: pago ? "#22c55e" : "transparent",
                              borderColor: pago ? "#22c55e" : "#d1d5db",
                              transition: "background 0.2s ease, border-color 0.2s ease",
                              opacity: isToggling ? 0.7 : 1,
                            }}
                          >
                            {pago && <IconCheck />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* modal configurar valor */}
        {modalOpen && modalType === "config" && (
          <div style={styles.overlay} onClick={() => setModalOpen(false)}>
            <div style={{ ...styles.modal, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Valor da Mensalidade</h2>
                <button onClick={() => setModalOpen(false)} style={styles.closeBtn}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div style={{ padding: "20px 28px" }}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Valor em R$</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button onClick={() => setModalOpen(false)} style={styles.btnSecondarySmall}>Cancelar</button>
                <button onClick={() => updateValorMensalidade(parseFloat(form.valor))} style={styles.btnPrimary}>
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </Layout>
  );
}

const styles = {
  page: { padding: "36px 40px", minHeight: "100vh" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  pageTitle: { fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "#0f2044", margin: "0 0 4px 0" },
  pageSubtitle: { fontSize: 14, color: "rgba(0,0,0,0.4)", margin: 0 },
  card: { background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" },
  cardTitle: { fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: "#0f2044", margin: 0 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 },
  statCard: { background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" },
  statLabel: { fontSize: 13, color: "rgba(0,0,0,0.45)", margin: "0 0 8px 0", fontWeight: 500 },
  statValue: { fontSize: 32, fontWeight: 700, margin: 0, fontFamily: "'Playfair Display', serif" },
  transactionCard: { background: "#fafbff", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, border: "1px solid rgba(0,0,0,0.04)" },
  btnPrimary: { display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#0f2044", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" },
  btnSecondary: { display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#fff", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 10, color: "rgba(0,0,0,0.6)", fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" },
  btnSecondarySmall: { padding: "10px 20px", background: "#f4f6fb", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, color: "rgba(0,0,0,0.6)", fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" },
  btnSuccess: { display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#22c55e", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" },
  btnDanger: { display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#ef4444", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" },
  select: { padding: "8px 14px", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", background: "#fff", color: "#0f2044", cursor: "pointer" },
  iconBtn: { background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 6, borderRadius: 8, display: "flex" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", color: "rgba(0,0,0,0.2)" },
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
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "14px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", borderBottom: "1px solid rgba(0,0,0,0.07)", whiteSpace: "nowrap" },
  tr: { transition: "background 0.15s" },
  td: { padding: "14px 16px", fontSize: 13, color: "rgba(0,0,0,0.7)", borderBottom: "1px solid rgba(0,0,0,0.05)", verticalAlign: "middle" },
};