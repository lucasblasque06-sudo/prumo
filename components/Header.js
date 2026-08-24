"use client";
import { COLORS } from "../lib/theme";

export default function Header({ onNovoLancamento, onMenuClick, subtitulo, obraNome }) {
  return (
    <div
      className="app-header"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "18px 28px",
        borderBottom: `1px solid ${COLORS.border}`,
        background: COLORS.paper,
        position: "sticky",
        top: 0,
        zIndex: 10,
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <button
          onClick={onMenuClick}
          className="menu-btn"
          style={{ display: "none", border: "none", background: "none", fontSize: 22, cursor: "pointer", color: COLORS.text, flexShrink: 0, padding: "4px 2px" }}
        >
          ☰
        </button>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, letterSpacing: -0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {obraNome || "Obra"}
          </div>
          <div style={{ fontSize: 12.5, color: COLORS.textSoft, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subtitulo}</div>
        </div>
      </div>
      <button
        onClick={onNovoLancamento}
        className="novo-lancamento-btn"
        style={{
          background: COLORS.action,
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 16px",
          fontSize: 13.5,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        + Novo lançamento
      </button>
    </div>
  );
}
