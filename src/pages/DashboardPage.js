import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  collection, getDocs, query, where, orderBy,
} from "firebase/firestore";
import { db } from "../firebase/config";

const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState({ reunioes: 0, eventos: 0, presencaMedia: 0 });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // ajeitando os membros
        const membersSnap = await getDocs(query(collection(db, "members"), where("status", "==", "ativo"), orderBy("nome")));
        const members = membersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // ajeitando as reunioes p mês
        const meetingsSnap = await getDocs(collection(db, "meetings"));
        const meetings = meetingsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((m) => {
            const d = new Date(m.data);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && m.tipo !== "sem-reuniao";
          });

        // ajeitando eventos p mês
        const eventsSnap = await getDocs(collection(db, "events"));
        const events = eventsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((e) => {
            const d = new Date(e.data);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
          });

        // vendo presença
        const attSnap = await getDocs(collection(db, "attendance"));
        const attendance = attSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const totalReunions = meetings.length;
        const totalEvents = events.length;
        const totalSessions = totalReunions + totalEvents;

        // presença de cad aum
        let totalPresPercent = 0;
        const chart = members.map((m) => {
          const memberAtt = attendance.filter(
            (a) => a.membroId === m.id && a.status === "presente" &&
              [...meetings, ...events].some((s) => s.id === a.referenciaId)
          );
          const percent = totalSessions > 0 ? Math.round((memberAtt.length / totalSessions) * 100) : 0;
          totalPresPercent += percent;
          return { nome: m.nome.split(" ")[0], presenca: percent };
        });

        const media = members.length > 0 ? Math.round(totalPresPercent / members.length) : 0;

        setStats({ reunioes: totalReunions, eventos: totalEvents, presencaMedia: media });
        setChartData(chart);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchData();
  }, [selectedMonth, selectedYear]);

  const years = [2025, 2026, 2027];

  return (
    <Layout>
      <div style={styles.page}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Dashboard</h1>
            <p style={styles.pageSubtitle}>Visão geral do mês</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              style={styles.select}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select
              style={styles.select}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {years.map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/*cards*/}
        <div style={styles.statsRow}>
          <StatCard
            icon={
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0f2044" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
            iconBg="rgba(15,32,68,0.08)"
            label="Reuniões"
            value={stats.reunioes}
            color="#0f2044"
          />
          <StatCard
            icon={
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.8">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            }
            iconBg="rgba(212,175,55,0.1)"
            label="Eventos"
            value={stats.eventos}
            color="#D4AF37"
          />
          <StatCard
            icon={
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            }
            iconBg="rgba(34,197,94,0.08)"
            label="Presença Média"
            value={`${stats.presencaMedia}%`}
            color="#22c55e"
          />
        </div>

        {/* grafico barra (q mão) */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Presença por Membro</h3>
          {loading ? (
            <div style={styles.chartPlaceholder}><div style={styles.spinner} /></div>
          ) : chartData.length === 0 ? (
            <div style={styles.chartPlaceholder}>
              <p style={{ color: "rgba(0,0,0,0.3)" }}>Sem dados para este período</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="nome" tick={{ fontSize: 12, fill: "rgba(0,0,0,0.5)" }} angle={-35} textAnchor="end" />
                <YAxis tick={{ fontSize: 12, fill: "rgba(0,0,0,0.5)" }} domain={[0, 100]} />
                <Tooltip
                  formatter={(v) => [`${v}%`, "Presença"]}
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="presenca" fill="#0f2044" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}

function StatCard({ icon, iconBg, label, value, color }) {
  return (
    <div style={styles.statCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={styles.statLabel}>{label}</p>
          <p style={{ ...styles.statValue, color }}>{value}</p>
        </div>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: iconBg || "rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "36px 40px", minHeight: "100vh" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  pageTitle: { fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "#0f2044", margin: "0 0 4px 0" },
  pageSubtitle: { fontSize: 14, color: "rgba(0,0,0,0.4)", margin: 0 },
  select: { padding: "8px 14px", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", background: "#fff", color: "#0f2044", cursor: "pointer" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 },
  statCard: { background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" },
  statLabel: { fontSize: 13, color: "rgba(0,0,0,0.45)", margin: "0 0 8px 0", fontWeight: 500 },
  statValue: { fontSize: 36, fontWeight: 700, margin: 0, fontFamily: "'Playfair Display', serif" },
  card: { background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" },
  cardTitle: { fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: "#0f2044", margin: "0 0 20px 0" },
  chartPlaceholder: { height: 300, display: "flex", alignItems: "center", justifyContent: "center" },
  spinner: { width: 36, height: 36, border: "3px solid rgba(0,0,0,0.08)", borderTop: "3px solid #D4AF37", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};