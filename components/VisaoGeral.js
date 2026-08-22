"use client";
import { COLORS, fmtBRL, fmtDataCurta, CATEGORIA_LABEL, statusEtapa } from "../lib/theme";

function StatCard({ label, value, sub, subColor }) {
  return (
    <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "18px 20px" }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textSoft, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.text, marginTop: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: subColor || COLORS.textSoft, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

export default function VisaoGeral({ obra, stages, entries }) {
  const orcamentoTotal = Number(obra?.orcamento_total || 0);
  const totalGasto = entries.reduce((a, e) => a + e.valor, 0);
  const pctUsado = orcamentoTotal > 0 ? (totalGasto / orcamentoTotal) * 100 : 0;
  const disponivel = orcamentoTotal - totalGasto;

  const porCategoria = {};
  entries.forEach((e) => {
    porCategoria[e.categoria] = (porCategoria[e.categoria] || 0) + e.valor;
  });
  const categoriasOrdenadas = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);

  const etapasComGasto = stages
    .map((s) => {
      const gasto = entries.filter((e) => e.etapa === s.id).reduce((a, e) => a + e.valor, 0);
      const orcado = (orcamentoTotal * s.pct) / 100;
      const pu = orcado > 0 ? (gasto / orcado) * 100 : 0;
      return { ...s, gasto, orcado, pu };
    })
    .sort((a, b) => b.gasto - a.gasto)
    .slice(0, 4);

  const recentes = [...entries].sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <StatCard label="Orçamento" value={fmtBRL(orcamentoTotal)} />
        <StatCard
          label="Gasto real"
          value={fmtBRL(totalGasto)}
          sub={`${pctUsado.toFixed(1)}% utilizado`}
          subColor={pctUsado > 100 ? COLORS.bad : pctUsado > 85 ? COLORS.warn : COLORS.good}
        />
        <StatCard label="Disponível" value={fmtBRL(disponivel)} sub={disponivel < 0 ? "orçamento estourado" : "restante"} subColor={disponivel < 0 ? COLORS.bad : COLORS.good} />
        <StatCard label="Terreno" value={fmtBRL(obra?.terreno_valor)} />
        <StatCard label="Venda prevista" value={fmtBRL(obra?.venda_prevista)} subColor={COLORS.good} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }} className="two-col">
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Etapas com mais gasto</div>
          <div style={{ fontSize: 12, color: COLORS.textSoft, marginBottom: 16 }}>Onde o dinheiro está indo primeiro</div>
          {etapasComGasto.length === 0 && (
            <div style={{ fontSize: 13, color: COLORS.textSoft, padding: "20px 0" }}>Nenhum gasto registrado ainda.</div>
          )}
          {etapasComGasto.map((s) => {
            const st = statusEtapa(s.pu);
            return (
              <div key={s.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, color: COLORS.text }}>{s.nome}</span>
                  <span style={{ color: COLORS.textSoft }}>{fmtBRL(s.gasto)} <span style={{ color: st.color }}>({s.pu.toFixed(0)}%)</span></span>
                </div>
                <div style={{ height: 6, background: COLORS.border, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(s.pu, 100)}%`, background: st.color }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Para onde está indo o dinheiro</div>
          <div style={{ fontSize: 12, color: COLORS.textSoft, marginBottom: 16 }}>Por categoria</div>
          {categoriasOrdenadas.length === 0 && (
            <div style={{ fontSize: 13, color: COLORS.textSoft, padding: "20px 0" }}>Sem dados suficientes ainda.</div>
          )}
          {categoriasOrdenadas.map(([cat, val]) => {
            const pct = totalGasto > 0 ? (val / totalGasto) * 100 : 0;
            return (
              <div key={cat} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, color: COLORS.text }}>{CATEGORIA_LABEL[cat] || cat}</span>
                  <span style={{ color: COLORS.textSoft }}>{pct.toFixed(0)}%</span>
                </div>
                <div style={{ height: 6, background: COLORS.border, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: COLORS.action }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>Lançamentos recentes</div>
        {recentes.length === 0 && <div style={{ fontSize: 13, color: COLORS.textSoft }}>Nenhum lançamento ainda. Registre o primeiro gasto para começar.</div>}
        {recentes.map((e) => (
          <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.text }}>{e.desc}</div>
              <div style={{ fontSize: 11.5, color: COLORS.textSoft }}>{fmtDataCurta(e.data)} · {e.stageName}{e.fornecedor ? ` · ${e.fornecedor}` : ""}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{fmtBRL(e.valor)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
