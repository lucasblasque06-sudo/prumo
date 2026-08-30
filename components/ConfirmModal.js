"use client";
import { COLORS } from "../lib/theme";

export default function ConfirmModal({ titulo, mensagem, textoConfirmar = "Confirmar", perigo = true, onConfirm, onCancel, confirmando = false }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(23,26,28,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: COLORS.paper, borderRadius: 16, padding: 26, width: "100%", maxWidth: 380, boxShadow: "0 24px 64px -12px rgba(24,17,35,0.3)" }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text, marginBottom: 8 }}>{titulo}</div>
        <div style={{ fontSize: 13, color: COLORS.textSoft, lineHeight: 1.5, marginBottom: 22 }}>{mensagem}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: 11, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "none", color: COLORS.textSoft, fontWeight: 600, cursor: "pointer", fontSize: 13.5 }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmando}
            style={{ flex: 1, padding: 11, borderRadius: 8, border: "none", background: perigo ? COLORS.bad : COLORS.action, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13.5 }}
          >
            {confirmando ? "…" : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
