"use client";
import { useState } from "react";
import { COLORS, CATEGORIA_LABEL } from "../lib/theme";
import ConfirmModal from "./ConfirmModal";

export default function EditarLancamentoModal({ lancamento, stages, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    descricao: lancamento.desc || "",
    valor: lancamento.valor || "",
    etapa_id: lancamento.etapa || "",
    categoria: lancamento.categoria || "material",
    fornecedor: lancamento.fornecedor || "",
    data: lancamento.data || new Date().toISOString().slice(0, 10),
  });
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13.5, color: COLORS.text };
  const labelStyle = { fontSize: 11.5, fontWeight: 600, color: COLORS.textSoft, marginBottom: 5, display: "block" };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.descricao || !form.valor || !form.etapa_id) return;
    setSalvando(true);
    await onSave(form);
    setSalvando(false);
  };

  const confirmarExclusao = async () => {
    setExcluindo(true);
    await onDelete();
    setExcluindo(false);
    setConfirmandoExclusao(false);
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
        <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>Editar lançamento</div>
        {lancamento.fonte === "whatsapp" && (
          <div style={{ fontSize: 12, color: COLORS.textSoft, marginBottom: 16 }}>📱 Este lançamento veio do WhatsApp — registrado por {lancamento.quem}</div>
        )}
        {lancamento.fonte !== "whatsapp" && <div style={{ marginBottom: 16 }} />}

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Descrição</label>
          <input required value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} style={inputStyle} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Valor (R$)</label>
            <input required type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} style={inputStyle} />
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Categoria</label>
            <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} style={inputStyle}>
              {Object.entries(CATEGORIA_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Fornecedor</label>
            <input value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => setConfirmandoExclusao(true)}
            disabled={excluindo}
            style={{ padding: "12px 16px", borderRadius: 8, border: `1px solid ${COLORS.badSoft}`, background: COLORS.badSoft, color: COLORS.bad, fontWeight: 700, cursor: "pointer", fontSize: 13 }}
          >
            {excluindo ? "…" : "Excluir"}
          </button>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "none", color: COLORS.textSoft, fontWeight: 600, cursor: "pointer" }}>
            Cancelar
          </button>
          <button type="submit" disabled={salvando} style={{ flex: 2, padding: 12, borderRadius: 8, border: "none", background: COLORS.action, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>

      {confirmandoExclusao && (
        <ConfirmModal
          titulo="Excluir lançamento"
          mensagem={`Excluir "${form.descricao}" (R$ ${form.valor})? Essa ação não pode ser desfeita.`}
          textoConfirmar="Excluir"
          confirmando={excluindo}
          onConfirm={confirmarExclusao}
          onCancel={() => setConfirmandoExclusao(false)}
        />
      )}
    </div>
  );
}
