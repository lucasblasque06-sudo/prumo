"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { COLORS, CARD_SHADOW } from "../../lib/theme";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const entrar = async (e) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      setErro("E-mail ou senha incorretos.");
      return;
    }
    window.location.href = "/";
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.bg, fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <form onSubmit={entrar} style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 32, width: "100%", maxWidth: 380, boxShadow: CARD_SHADOW }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <svg width="22" height="24" viewBox="0 0 24 26" fill="none">
            <line x1="12" y1="2" x2="12" y2="11" stroke={COLORS.text} strokeWidth="2" />
            <path d="M12 11L17 20H7L12 11Z" fill={COLORS.action} />
          </svg>
          <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.text }}>Prumo</div>
        </div>
        <div style={{ fontSize: 13, color: COLORS.textSoft, marginBottom: 20 }}>Entre para acessar suas obras</div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.textSoft, marginBottom: 5, display: "block" }}>E-mail</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13.5 }}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.textSoft, marginBottom: 5, display: "block" }}>Senha</label>
          <input
            required
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13.5 }}
          />
        </div>

        {erro && <div style={{ fontSize: 12.5, color: COLORS.bad, marginBottom: 14 }}>{erro}</div>}

        <button
          type="submit"
          disabled={carregando}
          style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", background: COLORS.action, color: "#fff", fontWeight: 700, cursor: "pointer" }}
        >
          {carregando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
