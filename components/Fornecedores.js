"use client";
import { useState } from "react";
import { COLORS, fmtBRL, fmtDataLonga } from "../lib/theme";

export default function Fornecedores({ entries }) {
  const [selecionado, setSelecionado] = useState(null);

  const porFornecedor = {};
  entries.forEach((e) => {
    const nome = e.fornecedor?.trim();
    if (!nome) return;
    if (!porFornecedor[nome]) porFornecedor[nome] = { nome, total: 0, compras: [] };
    porFornecedor[nome].total += e.valor;
    porFornecedor[nome].compras.push(e);
  });
  const lista = Object.values(porFornecedor).sort((a, b) => b.total - a.total);

  const semFornecedor = entries.filter((e) => !e.fornecedor?.trim()).length;

  if (selecionado) {
    const f = porFornecedor[selecionado];
    return (
      <div>
        <button
          onClick={() => setSelecionado(null)}
          style={{ background: "none", border: "none", color: COLORS.action, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 16, padding: 0 }}
        >
          ← Voltar para fornecedores
        </button>
        <div style={{ fontSize: 19, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>{f.nome}</div>
        <div style={{ fontSize: 13, color: COLORS.textSoft, marginBottom: 20 }}>
          {f.compras.length} {f.compras.length === 1 ? "compra" : "compras"} · Total: {fmtBRL(f.total)}
        </div>
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
          {[...f.compras].sort((a, b) => (a.data < b.data ? 1 : -1)).map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "13px 20px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13.5 }}>
              <div>
                <div style={{ fontWeight: 600, color: COLORS.text }}>{c.desc}</div>
                <div style={{ fontSize: 11.5, color: COLORS.textSoft }}>{fmtDataLonga(c.data)} · {c.stageName}</div>
              </div>
              <div style={{ fontWeight: 700, color: COLORS.text }}>{fmtBRL(c.valor)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {lista.length === 0 && (
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>Nenhum fornecedor registrado ainda</div>
          <div style={{ fontSize: 13, color: COLORS.textSoft }}>Adicione o campo fornecedor ao lançar um gasto para começar a ver esse painel.</div>
        </div>
      )}
      {lista.length > 0 && (
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", padding: "12px 20px", borderBottom: `1px solid ${COLORS.border}`, background: "#FBFBFA" }}>
            {["Fornecedor", "Compras", "Total"].map((h, i) => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSoft, textTransform: "uppercase", textAlign: i === 2 ? "right" : "left" }}>{h}</div>
            ))}
          </div>
          {lista.map((f) => (
            <div
              key={f.nome}
              onClick={() => setSelecionado(f.nome)}
              style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer", alignItems: "center" }}
              className="hover-row"
            >
              <div style={{ fontWeight: 600, fontSize: 13.5, color: COLORS.text }}>{f.nome}</div>
              <div style={{ fontSize: 13, color: COLORS.textSoft }}>{f.compras.length}</div>
              <div style={{ textAlign: "right", fontWeight: 700, fontSize: 13.5, color: COLORS.text }}>{fmtBRL(f.total)}</div>
            </div>
          ))}
        </div>
      )}
      {semFornecedor > 0 && (
        <div style={{ fontSize: 12, color: COLORS.textSoft, marginTop: 12 }}>
          {semFornecedor} {semFornecedor === 1 ? "lançamento não tem" : "lançamentos não têm"} fornecedor informado.
        </div>
      )}
    </div>
  );
}
