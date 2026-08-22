"use client";
import { COLORS, fmtBRL, statusEtapa } from "../lib/theme";

export default function Etapas({ obra, stages, entries, onUpdatePct }) {
  const orcamentoTotal = Number(obra?.orcamento_total || 0);
  const totalPct = stages.reduce((a, s) => a + s.pct, 0);

  const linhas = stages.map((s) => {
    const gasto = entries.filter((e) => e.etapa === s.id).reduce((a, e) => a + e.valor, 0);
    const orcado = (orcamentoTotal * s.pct) / 100;
    const pu = orcado > 0 ? (gasto / orcado) * 100 : 0;
    return { ...s, gasto, orcado, pu };
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: COLORS.textSoft }}>Distribuição do orçamento por etapa</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: totalPct === 100 ? COLORS.good : COLORS.warn }}>
          soma das % = {totalPct}%
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {linhas.map((s) => {
          const st = statusEtapa(s.pu);
          return (
            <div key={s.id} style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: COLORS.text }}>{s.nome}</div>
                  <div style={{ fontSize: 12, color: st.color, fontWeight: 600, marginTop: 2 }}>{st.dot} {st.label}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={s.pct}
                    onChange={(e) => onUpdatePct(s.id, Number(e.target.value))}
                    style={{ width: 70 }}
                  />
                  <span style={{ fontSize: 12, color: COLORS.textSoft, fontWeight: 600, width: 32 }}>{s.pct}%</span>
                </div>
              </div>

              <div style={{ height: 7, background: COLORS.border, borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ height: "100%", width: `${Math.min(s.pu, 100)}%`, background: st.color }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, fontSize: 12.5 }}>
                <div>
                  <div style={{ color: COLORS.textSoft }}>Orçado</div>
                  <div style={{ fontWeight: 700, color: COLORS.text }}>{fmtBRL(s.orcado)}</div>
                </div>
                <div>
                  <div style={{ color: COLORS.textSoft }}>Gasto</div>
                  <div style={{ fontWeight: 700, color: COLORS.text }}>{s.gasto > 0 ? fmtBRL(s.gasto) : "Nenhum gasto registrado"}</div>
                </div>
                <div>
                  <div style={{ color: COLORS.textSoft }}>% utilizado</div>
                  <div style={{ fontWeight: 700, color: st.color }}>{s.pu.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
