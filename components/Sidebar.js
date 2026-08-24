"use client";
import { useState, useEffect } from "react";
import { COLORS } from "../lib/theme";
import { supabase } from "../lib/supabase";

const NAV = [
  {
    section: "PRINCIPAL",
    items: [{ id: "geral", label: "Visão geral", icon: "◫" }],
  },
  {
    section: "FINANCEIRO",
    items: [
      { id: "gastos", label: "Gastos", icon: "▤" },
      { id: "etapas", label: "Etapas", icon: "▤" },
      { id: "fornecedores", label: "Fornecedores", icon: "▤" },
    ],
  },
  {
    section: "EMPRESA",
    items: [
      { id: "trocar-obra", label: "Trocar obra", icon: "⇄", href: "/obras" },
      { id: "equipe", label: "Equipe", icon: "◍", href: "/equipe" },
    ],
  },
];

export default function Sidebar({ active, onNavigate, obraNome, open, onClose }) {
  const [perfil, setPerfil] = useState(null);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [editandoNome, setEditandoNome] = useState(false);
  const [nomeEdit, setNomeEdit] = useState("");
  const [salvandoNome, setSalvandoNome] = useState(false);

  useEffect(() => {
    async function carregarPerfil() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");
      setUserId(user.id);
      const { data } = await supabase.from("perfis").select("nome, foto_url").eq("user_id", user.id).single();
      if (data) {
        setPerfil(data);
        setNomeEdit(data.nome || "");
      }
    }
    carregarPerfil();
  }, []);

  const salvarNome = async () => {
    if (!userId) return;
    setSalvandoNome(true);
    const novoNome = nomeEdit.trim();
    const { error } = await supabase.from("perfis").upsert({ user_id: userId, nome: novoNome || null }, { onConflict: "user_id" });
    setSalvandoNome(false);
    if (!error) {
      setPerfil((prev) => ({ ...(prev || {}), nome: novoNome }));
      setEditandoNome(false);
    }
  };

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40, display: "none" }}
          className="sidebar-overlay"
        />
      )}
      <div
        className={`sidebar ${open ? "open" : ""}`}
        style={{
          background: COLORS.sidebar,
          color: COLORS.sidebarText,
          width: 240,
          height: "100vh",
          padding: "20px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 0,
          position: "sticky",
          top: 0,
          overflow: "hidden",
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 24, minHeight: 0 }}>
        <div style={{ padding: "6px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="20" height="22" viewBox="0 0 24 26" fill="none">
              <line x1="12" y1="2" x2="12" y2="11" stroke={COLORS.sidebarTextActive} strokeWidth="2" />
              <path d="M12 11L17 20H7L12 11Z" fill={COLORS.action} />
            </svg>
            <div style={{ color: COLORS.sidebarTextActive, fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }}>
              Prumo
            </div>
          </div>
          <div style={{ fontSize: 11.5, marginTop: 14, color: COLORS.sidebarText, lineHeight: 1.4 }}>
            OBRA ATUAL
          </div>
          <div style={{ color: COLORS.sidebarTextActive, fontSize: 13, fontWeight: 600, marginTop: 2 }}>
            {obraNome}
          </div>
        </div>

        {NAV.map((group) => (
          <div key={group.section}>
            <div style={{ fontSize: 10.5, letterSpacing: 1, color: COLORS.sidebarText + "99", padding: "0 10px", marginBottom: 6, fontWeight: 700 }}>
              {group.section}
            </div>
            {group.items.map((item) => {
              const isActive = active === item.id;
              const baseStyle = {
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                textAlign: "left",
                padding: "9px 10px",
                borderRadius: 8,
                border: "none",
                background: isActive ? COLORS.sidebarHover : "transparent",
                color: isActive ? COLORS.sidebarTextActive : COLORS.sidebarText,
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                marginBottom: 2,
                transition: "background 0.15s ease, color 0.15s ease",
                textDecoration: "none",
                boxSizing: "border-box",
              };
              if (item.href) {
                return (
                  <a key={item.id} href={item.href} style={baseStyle} className="sidebar-item">
                    <span style={{ fontSize: 13, opacity: 0.85 }}>{item.icon}</span>
                    {item.label}
                  </a>
                );
              }
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  style={baseStyle}
                  className="sidebar-item"
                >
                  <span style={{ fontSize: 13, opacity: 0.85 }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
        </div>

        {email && (
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10, padding: "10px", borderTop: `1px solid ${COLORS.sidebarHover}` }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", background: COLORS.sidebarHover, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
            }}>
              {perfil?.foto_url ? (
                <img src={perfil.foto_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 12, color: COLORS.sidebarTextActive, fontWeight: 700 }}>
                  {(perfil?.nome || email)[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              {editandoNome ? (
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <input
                    autoFocus
                    value={nomeEdit}
                    onChange={(e) => setNomeEdit(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") salvarNome(); if (e.key === "Escape") { setEditandoNome(false); setNomeEdit(perfil?.nome || ""); } }}
                    style={{ width: "100%", fontSize: 12.5, padding: "3px 6px", borderRadius: 5, border: `1px solid ${COLORS.sidebarHover}`, background: COLORS.sidebar, color: COLORS.sidebarTextActive }}
                  />
                  <button onClick={salvarNome} disabled={salvandoNome} style={{ background: "none", border: "none", color: COLORS.action, cursor: "pointer", fontSize: 13, padding: 2 }} title="Salvar">✓</button>
                </div>
              ) : (
                <div
                  onClick={() => setEditandoNome(true)}
                  style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.sidebarTextActive, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "pointer" }}
                  title="Clique para editar o nome"
                >
                  {perfil?.nome || "Usuário"} <span style={{ opacity: 0.5, fontSize: 10.5 }}>✎</span>
                </div>
              )}
              <div style={{ fontSize: 11, color: COLORS.sidebarText, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {email}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
