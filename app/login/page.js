"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { COLORS, CARD_SHADOW } from "../../lib/theme";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [emailRecuperar, setEmailRecuperar] = useState("");
  const [enviandoRecuperar, setEnviandoRecuperar] = useState(false);
  const [msgRecuperar, setMsgRecuperar] = useState(null);

  const entrar = async (e) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      setCarregando(false);
      setErro("E-mail ou senha incorretos.");
      return;
    }
    // Aplica qualquer convite pendente para este e-mail (cobre o caso de confirmação de
    // e-mail ter atrasado o vínculo automático que tentamos fazer no momento do cadastro)
    await supabase.rpc("aceitar_convite_pendente");
    setCarregando(false);
    window.location.href = "/";
  };

  const enviarRecuperacao = async (e) => {
    e.preventDefault();
    setEnviandoRecuperar(true);
    setMsgRecuperar(null);
    const { error } = await supabase.auth.resetPasswordForEmail(emailRecuperar, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setEnviandoRecuperar(false);
    if (error) {
      setMsgRecuperar({ tipo: "erro", texto: "Não foi possível enviar o e-mail. Tente novamente." });
      return;
    }
    setMsgRecuperar({ tipo: "ok", texto: "Se esse e-mail estiver cadastrado, você vai receber um link para redefinir a senha." });
  };

  const labelStyle = { fontSize: 11.5, fontWeight: 600, color: COLORS.textSoft, marginBottom: 5, display: "block" };
  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13.5 };

  if (modoRecuperar) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.bg, fontFamily: "'Manrope', system-ui, sans-serif" }}>
        <form onSubmit={enviarRecuperacao} style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 32, width: "100%", maxWidth: 380, boxShadow: CARD_SHADOW }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.text, marginBottom: 4 }}>Esqueceu sua senha?</div>
          <div style={{ fontSize: 13, color: COLORS.textSoft, marginBottom: 20 }}>Digite seu e-mail e mandamos um link para redefinir</div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>E-mail</label>
            <input required type="email" value={emailRecuperar} onChange={(e) => setEmailRecuperar(e.target.value)} style={inputStyle} />
          </div>

          {msgRecuperar && (
            <div style={{ fontSize: 12.5, color: msgRecuperar.tipo === "ok" ? COLORS.good : COLORS.bad, marginBottom: 14 }}>{msgRecuperar.texto}</div>
          )}

          <button type="submit" disabled={enviandoRecuperar} style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", background: COLORS.action, color: "#fff", fontWeight: 700, cursor: "pointer", marginBottom: 12 }}>
            {enviandoRecuperar ? "Enviando…" : "Enviar link de recuperação"}
          </button>
          <button type="button" onClick={() => { setModoRecuperar(false); setMsgRecuperar(null); }} style={{ width: "100%", padding: 10, borderRadius: 8, border: "none", background: "none", color: COLORS.textSoft, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
            ← Voltar para o login
          </button>
        </form>
      </div>
    );
  }

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
          <label style={labelStyle}>E-mail</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Senha</label>
          <input
            required
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ textAlign: "right", marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => setModoRecuperar(true)}
            style={{ background: "none", border: "none", color: COLORS.action, fontWeight: 600, fontSize: 12.5, cursor: "pointer", padding: 0 }}
          >
            Esqueci minha senha
          </button>
        </div>

        {erro && <div style={{ fontSize: 12.5, color: COLORS.bad, marginBottom: 14 }}>{erro}</div>}

        <button
          type="submit"
          disabled={carregando}
          style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", background: COLORS.action, color: "#fff", fontWeight: 700, cursor: "pointer" }}
        >
          {carregando ? "Entrando…" : "Entrar"}
        </button>
        <a href="/cadastro" style={{ display: "block", textAlign: "center", marginTop: 14, fontSize: 12.5, color: COLORS.textSoft, textDecoration: "none" }}>
          Não tem conta? <span style={{ color: COLORS.action, fontWeight: 600 }}>Criar conta</span>
        </a>
      </form>
    </div>
  );
}
