"use client";
import { COLORS, fmtBRL, fmtDataCurta, CATEGORIA_LABEL, statusEtapa, CARD_SHADOW, FONT_MONO } from "../lib/theme";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

const CATEGORIA_CORES = {
  material: "#6B2FD6",
  mao_de_obra: "#A780F0",
  equipamento: "#241A38",
  taxas: "#C9871F",
  outros: "#C4BAD9",
};

function StatCard({ label, value, sub, subColor }) {
  return (
    <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "18px 20px", boxShadow: CARD_SHADOW }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textSoft, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 23, fontWeight: 700, color: COLORS.text, marginTop: 6, fontFamily: FONT_MONO, letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: subColor || COLORS.textSoft, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

function TooltipCategoria({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12.5, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <div style={{ fontWeight: 700, color: COLORS.text }}>{d.name}</div>
      <div style={{ color: COLORS.textSoft }}>{fmtBRL(d.value)} ({d.pct.toFixed(1)}%)</div>
    </div>
  );
}

function TooltipEtapas({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12.5, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <div style={{ fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>{p.name}: {fmtBRL(p.value)}</div>
      ))}
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
  const dadosPizza = Object.entries(porCategoria)
    .map(([cat, val]) => ({ name: CATEGORIA_LABEL[cat] || cat, value: val, pct: totalGasto > 0 ? (val / totalGasto) * 100 : 0, cor: CATEGORIA_CORES[cat] || COLORS.textSoft }))
    .sort((a, b) => b.value - a.value);

  const dadosEtapas = stages
    .map((s) => {
      const gasto = entries.filter((e) => e.etapa === s.id).reduce((a, e) => a + e.valor, 0);
      const orcado = s.pct !== null ? (orcamentoTotal * s.pct) / 100 : 0;
      return { nome: s.nome.length > 18 ? s.nome.slice(0, 16) + "…" : s.nome, nomeCompleto: s.nome, Orçado: orcado, Gasto: gasto };
    })
    .sort((a, b) => b.Gasto - a.Gasto)
    .slice(0, 6);

  const recentes = [...entries].sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, 5);

  const vendida = obra?.objetivo === "venda" && obra?.status === "vendida";
  const custoReal = Number(obra?.terreno_valor || 0) + totalGasto;
  const lucroReal = vendida ? Number(obra?.lucro ?? (Number(obra?.valor_liquido || 0) - custoReal)) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        {vendida ? (
          <>
            <StatCard label="Valor da venda" value={fmtBRL(obra?.valor_venda_real)} subColor={COLORS.good} />
            <StatCard label="Gasto real" value={fmtBRL(totalGasto)} />
            <StatCard label="Terreno" value={fmtBRL(obra?.terreno_valor)} />
            <StatCard label="Comissão" value={fmtBRL(obra?.valor_comissao)} />
            <StatCard label="Lucro real" value={fmtBRL(lucroReal)} sub="terreno + gastos + comissão já descontados" subColor={lucroReal >= 0 ? COLORS.good : COLORS.bad} />
          </>
        ) : (
          <>
            <StatCard label="Orçamento" value={fmtBRL(orcamentoTotal)} />
            <StatCard
              label="Gasto real"
              value={fmtBRL(totalGasto)}
              sub={`${pctUsado.toFixed(1)}% utilizado`}
              subColor={pctUsado > 100 ? COLORS.bad : pctUsado > 85 ? COLORS.warn : COLORS.good}
            />
            <StatCard label="Disponível" value={fmtBRL(disponivel)} sub={disponivel < 0 ? "orçamento estourado" : "restante"} subColor={disponivel < 0 ? COLORS.bad : COLORS.good} />
            <StatCard label="Terreno" value={fmtBRL(obra?.terreno_valor)} />
            {obra?.objetivo === "venda" && (
              <StatCard label="Venda prevista" value={fmtBRL(obra?.venda_prevista)} subColor={COLORS.good} />
            )}
          </>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }} className="two-col">
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 22, boxShadow: CARD_SHADOW }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Orçado x Gasto por etapa</div>
          <div style={{ fontSize: 12, color: COLORS.textSoft, marginBottom: 16 }}>As 6 etapas com mais movimento</div>
          {dadosEtapas.length === 0 ? (
            <div style={{ fontSize: 13, color: COLORS.textSoft, padding: "20px 0" }}>Nenhum gasto registrado ainda.</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, dadosEtapas.length * 46)}>
              <BarChart data={dadosEtapas} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => fmtBRL(v)} tick={{ fontSize: 11, fill: COLORS.textSoft }} />
                <YAxis type="category" dataKey="nome" width={130} tick={{ fontSize: 11.5, fill: COLORS.text }} />
                <Tooltip content={<TooltipEtapas />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Orçado" fill={COLORS.border} radius={[0, 4, 4, 0]} />
                <Bar dataKey="Gasto" fill={COLORS.action} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 22, boxShadow: CARD_SHADOW }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Para onde está indo o dinheiro</div>
          <div style={{ fontSize: 12, color: COLORS.textSoft, marginBottom: 16 }}>Por categoria</div>
          {dadosPizza.length === 0 ? (
            <div style={{ fontSize: 13, color: COLORS.textSoft, padding: "20px 0" }}>Sem dados suficientes ainda.</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={dadosPizza} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {dadosPizza.map((d, i) => (
                      <Cell key={i} fill={d.cor} />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipCategoria />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {dadosPizza.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: d.cor, display: "inline-block" }} />
                      <span style={{ color: COLORS.text, fontWeight: 600 }}>{d.name}</span>
                    </div>
                    <span style={{ color: COLORS.textSoft }}>{fmtBRL(d.value)} · {d.pct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 22, boxShadow: CARD_SHADOW }}>
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
