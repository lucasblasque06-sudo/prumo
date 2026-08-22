"use client";
import { useState, useMemo } from "react";
import { COLORS, fmtBRL, fmtDataLonga, CATEGORIA_LABEL } from "../lib/theme";

export default function Gastos({ entries, stages }) {
  const [busca, setBusca] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  const filtrados = useMemo(() => {
    return entries
      .filter((e) => !busca || e.desc.toLowerCase().includes(busca.toLowerCase()) || (e.fornecedor || "").toLowerCase().includes(busca.toLowerCase()))
      .filter((e) => !filtroEtapa || e.etapa === filtroEtapa)
      .filter((e) => !filtroCategoria || e.categoria === filtroCategoria)
      .sort((a, b) => (a.data < b.data ? 1 : -1));
  }, [entries, busca, filtroEtapa, filtroCategoria]);

  const total = filtrados.reduce((a, e) => a + e.valor, 0);

  const selectStyle = { padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.text, background: COLORS.paper };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input
          placeholder="Buscar gasto ou fornecedor..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "9px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13.5 }}
        />
        <select value={filtroEtapa} onChange={(e) => setFiltroEtapa(e.target.value)} style={selectStyle}>
          <option value="">Todas as etapas</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} style={selectStyle}>
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORIA_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "90px 1.6fr 1fr 1fr 1fr 100px", padding: "12px 20px", borderBottom: `1px solid ${COLORS.border}`, background: "#FBFBFA" }}>
          {["Data", "Descrição", "Etapa", "Categoria", "Fornecedor", "Valor"].map((h, i) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSoft, textTransform: "uppercase", textAlign: i === 5 ? "right" : "left" }}>{h}</div>
          ))}
        </div>
        {filtrados.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 13.5, color: COLORS.textSoft }}>
            Nenhum gasto encontrado com esses filtros.
          </div>
        )}
        {filtrados.map((e) => (
          <div key={e.id} style={{ display: "grid", gridTemplateColumns: "90px 1.6fr 1fr 1fr 1fr 100px", padding: "13px 20px", borderBottom: `1px solid ${COLORS.border}`, alignItems: "center", fontSize: 13.5 }}>
            <div style={{ color: COLORS.textSoft, fontSize: 12.5 }}>{fmtDataLonga(e.data)}</div>
            <div style={{ fontWeight: 600, color: COLORS.text }}>{e.desc}</div>
            <div style={{ color: COLORS.textSoft }}>{e.stageName}</div>
            <div style={{ color: COLORS.textSoft }}>{CATEGORIA_LABEL[e.categoria] || e.categoria}</div>
            <div style={{ color: COLORS.textSoft }}>{e.fornecedor || "—"}</div>
            <div style={{ textAlign: "right", fontWeight: 700, color: COLORS.text }}>{fmtBRL(e.valor)}</div>
          </div>
        ))}
        {filtrados.length > 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 20px", fontSize: 13.5, fontWeight: 700, color: COLORS.text, background: "#FBFBFA" }}>
            Total: {fmtBRL(total)}
          </div>
        )}
      </div>
    </div>
  );
}
