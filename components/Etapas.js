"use client";
import { useState } from "react";
import { COLORS, fmtBRL, statusEtapa, CARD_SHADOW, FONT_MONO } from "../lib/theme";

function DefinirOrcadoInline({ etapaId, valorAtual, onUpdateOrcado }) {
  const [valor, setValor] = useState(valorAtual != null ? String(valorAtual) : "");
  const [editando, setEditando] = useState(false);

  if (!editando) {
    return (
      <button
        onClick={() => setEditando(true)}
        style={{ background: "none", border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: COLORS.action, fontWeight: 700, cursor: "pointer" }}
      >
        + Definir orçamento
      </button>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 12, color: COLORS.textSoft }}>R$</span>
      <input
        type="number"
        min={0}
        placeholder="0"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        style={{ width: 100, padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: 12.5 }}
        autoFocus
      />
      <button
        onClick={() => { onUpdateOrcado(etapaId, Number(valor) || 0); setEditando(false); }}
        style={{ background: COLORS.action, border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 11.5, color: "#fff", fontWeight: 700, cursor: "pointer" }}
      >
        Salvar
      </button>
    </div>
  );
}

export default function Etapas({ obra, stages, entries, onUpdateOrcado }) {
  const orcamentoTotal = Number(obra?.orcamento_total || 0);
  const definidas = stages.filter((s) => s.orcadoValor !== null);
  const somaOrcada = definidas.reduce((a, s) => a + s.orcadoValor, 0);

  const linhas = stages.map((s) => {
    const gasto = entries.filter((e) => e.etapa === s.id).reduce((a, e) => a + e.valor, 0);
    if (s.orcadoValor === null) return { ...s, gasto, pu: null };
    const pu = s.orcadoValor > 0 ? (gasto / s.orcadoValor) * 100 : 0;
    return { ...s, gasto, pu };
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 13, color: COLORS.textSoft }}>Distribuição do orçamento por etapa</div>
        {definidas.length > 0 ? (
          <div style={{ fontSize: 12, fontWeight: 700, color: orcamentoTotal > 0 && somaOrcada > orcamentoTotal ? COLORS.warn : COLORS.good, fontFamily: FONT_MONO }}>
            {definidas.length} de {stages.length} definidas · soma = {fmtBRL(somaOrcada)}
            {orcamentoTotal > 0 && ` (${((somaOrcada / orcamentoTotal) * 100).toFixed(0)}% do orçamento)`}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: COLORS.textSoft }}>Nenhuma etapa com orçamento definido ainda</div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {linhas.map((s) => {
          if (s.orcadoValor === null) {
            return (
              <div key={s.id} style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "16px 20px", boxShadow: CARD_SHADOW, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: COLORS.text }}>{s.nome}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSoft, marginTop: 3 }}>
                    Gasto até agora: <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: COLORS.text }}>{fmtBRL(s.gasto)}</span>
                    {" · "}sem orçamento definido
                  </div>
                </div>
                <DefinirOrcadoInline etapaId={s.id} valorAtual={null} onUpdateOrcado={onUpdateOrcado} />
              </div>
            );
          }

          const st = statusEtapa(s.pu);
          return (
            <div key={s.id} style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "16px 20px", boxShadow: CARD_SHADOW }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: COLORS.text }}>{s.nome}</div>
                  <div style={{ fontSize: 12, color: st.color, fontWeight: 600, marginTop: 2 }}>{st.dot} {st.label}</div>
                </div>
                <DefinirOrcadoInline etapaId={s.id} valorAtual={s.orcadoValor} onUpdateOrcado={onUpdateOrcado} />
              </div>

              <div style={{ height: 7, background: COLORS.border, borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ height: "100%", width: `${Math.min(s.pu, 100)}%`, background: st.color }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, fontSize: 12.5 }}>
                <div>
                  <div style={{ color: COLORS.textSoft }}>Orçado{s.pct !== null ? ` (${s.pct.toFixed(1)}%)` : ""}</div>
                  <div style={{ fontWeight: 700, color: COLORS.text, fontFamily: FONT_MONO }}>{fmtBRL(s.orcadoValor)}</div>
                </div>
                <div>
                  <div style={{ color: COLORS.textSoft }}>Gasto</div>
                  <div style={{ fontWeight: 700, color: COLORS.text, fontFamily: s.gasto > 0 ? FONT_MONO : "inherit" }}>{s.gasto > 0 ? fmtBRL(s.gasto) : "Nenhum gasto registrado"}</div>
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
