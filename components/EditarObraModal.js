"use client";
import { useState } from "react";
import { COLORS, fmtBRL, STATUS_OBRA_LABEL, CARD_SHADOW, FONT_MONO } from "../lib/theme";

export default function EditarObraModal({ obra, entries, onClose, onSave }) {
  const [form, setForm] = useState({
    nome: obra.nome || "",
    quadra_lote: obra.quadra_lote || "",
    endereco: obra.endereco || "",
    status: obra.status || "em_andamento",
    valor_venda_real: obra.valor_venda_real || "",
    comissao_percentual: obra.comissao_percentual || "",
  });
  const [confirmaLancamentos, setConfirmaLancamentos] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13.5, color: COLORS.text };
  const labelStyle = { fontSize: 11.5, fontWeight: 600, color: COLORS.textSoft, marginBottom: 5, display: "block" };

  const totalGastoReal = (entries || []).reduce((a, e) => a + e.valor, 0);

  const valorVenda = Number(form.valor_venda_real) || 0;
  const pctComissao = Number(form.comissao_percentual) || 0;
  const valorComissao = valorVenda * (pctComissao / 100);
  const valorLiquido = valorVenda - valorComissao;
  // Custo real = terreno + soma de todos os lançamentos já registrados (não o orçamento previsto)
  const custoTotal = Number(obra.terreno_valor || 0) + totalGastoReal;
  const lucro = valorLiquido - custoTotal;

  const mudouParaVendida = form.status === "vendida" && obra.status !== "vendida";
  const podeSalvar = !mudouParaVendida || confirmaLancamentos;

  const submit = async (e) => {
    e.preventDefault();
    if (!podeSalvar) return;
    setSalvando(true);
    const payload = {
      nome: form.nome,
      quadra_lote: form.quadra_lote || null,
      endereco: form.endereco,
      status: form.status,
    };
    if (form.status === "vendida") {
      payload.valor_venda_real = valorVenda;
      payload.comissao_percentual = pctComissao;
      payload.valor_comissao = valorComissao;
      payload.valor_liquido = valorLiquido;
      payload.lucro = lucro;
      payload.data_venda = new Date().toISOString().slice(0, 10);
    }
    await onSave(payload);
    setSalvando(false);
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(23,26,28,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        style={{ background: COLORS.paper, borderRadius: 18, padding: 28, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px -12px rgba(24,17,35,0.28)" }}
      >
        <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.text, marginBottom: 20 }}>Editar obra</div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Nome</label>
          <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Quadra e Lote</label>
          <input value={form.quadra_lote} onChange={(e) => setForm({ ...form, quadra_lote: e.target.value })} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Endereço</label>
          <input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} style={inputStyle} />
        </div>

        {obra.objetivo === "venda" && (
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>
              {Object.entries(STATUS_OBRA_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v.dot} {v.label}</option>
              ))}
            </select>
          </div>
        )}

        {form.status === "vendida" && obra.objetivo === "venda" && (
          <div style={{ background: COLORS.actionSoft, borderRadius: 10, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>Dados da venda</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Valor da venda (R$)</label>
                <input type="number" placeholder="0" value={form.valor_venda_real} onChange={(e) => setForm({ ...form, valor_venda_real: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Comissão corretor (%)</label>
                <input type="number" step="0.1" placeholder="0" value={form.comissao_percentual} onChange={(e) => setForm({ ...form, comissao_percentual: e.target.value })} style={inputStyle} />
              </div>
            </div>
            {valorVenda > 0 && (
              <div style={{ fontSize: 12.5, color: COLORS.textSoft, lineHeight: 1.8 }}>
                <div>Comissão: <strong style={{ color: COLORS.text, fontFamily: FONT_MONO }}>{fmtBRL(valorComissao)}</strong></div>
                <div>Valor líquido: <strong style={{ color: COLORS.text, fontFamily: FONT_MONO }}>{fmtBRL(valorLiquido)}</strong></div>
                <div>Custo real (terreno + todos os lançamentos): <strong style={{ color: COLORS.text, fontFamily: FONT_MONO }}>{fmtBRL(custoTotal)}</strong></div>
                <div style={{ marginTop: 6, fontSize: 14 }}>
                  Lucro real: <strong style={{ color: lucro >= 0 ? COLORS.good : COLORS.bad, fontFamily: FONT_MONO }}>{fmtBRL(lucro)}</strong>
                </div>
              </div>
            )}

            {mudouParaVendida && (
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 14, fontSize: 12.5, color: COLORS.text, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={confirmaLancamentos}
                  onChange={(e) => setConfirmaLancamentos(e.target.checked)}
                  style={{ marginTop: 2 }}
                />
                <span>Confirmo que todos os lançamentos (gastos) desta obra já foram registrados, para que o lucro real seja calculado corretamente.</span>
              </label>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "none", color: COLORS.textSoft, fontWeight: 600, cursor: "pointer" }}>
            Cancelar
          </button>
          <button type="submit" disabled={salvando || !podeSalvar} style={{ flex: 2, padding: 12, borderRadius: 8, border: "none", background: podeSalvar ? COLORS.action : COLORS.border, color: "#fff", fontWeight: 700, cursor: podeSalvar ? "pointer" : "not-allowed" }}>
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
