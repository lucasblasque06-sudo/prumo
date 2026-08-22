"use client";
import { useState } from "react";
import { COLORS, CATEGORIA_LABEL } from "../lib/theme";

export default function NovoLancamentoModal({ stages, onClose, onSave }) {
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    etapa_id: stages[0]?.id || "",
    categoria: "material",
    fornecedor: "",
    quem: "",
    data: new Date().toISOString().slice(0, 10),
  });
  const [salvando, setSalvando] = useState(false);

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    fontSize: 13.5,
    color: COLORS.text,
  };
  const labelStyle = { fontSize: 11.5, fontWeight: 600, color: COLORS.textSoft, marginBottom: 5, display: "block" };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.descricao || !form.valor || !form.etapa_id) return;
    setSalvando(true);
    await onSave(form);
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
        style={{ background: COLORS.paper, borderRadius: 14, padding: 28, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" }}
      >
        <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>Novo lançamento</div>
        <div style={{ fontSize: 12.5, color: COLORS.textSoft, marginBottom: 20 }}>Registre um gasto da obra</div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Descrição</label>
          <input
            required
            autoFocus
            placeholder="Ex: Cimento 10 sacos"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Valor (R$)</label>
            <input
              required
              type="number"
              step="0.01"
              placeholder="0,00"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Data</label>
            <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Etapa</label>
          <select value={form.etapa_id} onChange={(e) => setForm({ ...form, etapa_id: e.target.value })} style={inputStyle}>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Categoria</label>
            <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} style={inputStyle}>
              {Object.entries(CATEGORIA_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Fornecedor (opcional)</label>
            <input placeholder="Ex: Casa do Construtor" value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Quem lançou (opcional)</label>
          <input placeholder="Ex: Pai" value={form.quem} onChange={(e) => setForm({ ...form, quem: e.target.value })} style={inputStyle} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "none", color: COLORS.textSoft, fontWeight: 600, cursor: "pointer" }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            style={{ flex: 2, padding: 12, borderRadius: 8, border: "none", background: COLORS.action, color: "#fff", fontWeight: 700, cursor: "pointer" }}
          >
            {salvando ? "Salvando…" : "Salvar lançamento"}
          </button>
        </div>
      </form>
    </div>
  );
}
