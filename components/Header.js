"use client";
import { COLORS } from "../lib/theme";

export default function Header({ onNovoLancamento, onMenuClick, subtitulo, obraNome }) {
  return (
    <div
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
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onMenuClick}
          className="menu-btn"
          style={{ display: "none", border: "none", background: "none", fontSize: 20, cursor: "pointer", color: COLORS.text }}
        >
          ☰
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, letterSpacing: -0.3 }}>
            {obraNome || "Obra"}
          </div>
          <div style={{ fontSize: 12.5, color: COLORS.textSoft, marginTop: 2 }}>{subtitulo}</div>
        </div>
      </div>
      <button
        onClick={onNovoLancamento}
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
        }}
      >
        + Novo lançamento
      </button>
    </div>
  );
}
