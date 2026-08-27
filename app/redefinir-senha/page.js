"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { COLORS, CARD_SHADOW } from "../../lib/theme";

export default function RedefinirSenhaPage() {
  const [pronto, setPronto] = useState(false);
  const [erroSessao, setErroSessao] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    // O link do e-mail já autentica automaticamente a sessão (via hash da URL)
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setPronto(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setPronto(true);
      else setTimeout(() => { if (!pronto) setErroSessao(true); }, 3000);
    });

    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const labelStyle = { fontSize: 11.5, fontWeight: 600, color: COLORS.textSoft, marginBottom: 5, display: "block" };
  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13.5 };

  const salvarNovaSenha = async (e) => {
    e.preventDefault();
    setErro(null);
    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);
    if (error) {
      setErro("Não foi possível salvar a senha: " + error.message);
      return;
    }
    setSucesso(true);
  };

  if (sucesso) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.bg, fontFamily: "'Manrope', system-ui, sans-serif" }}>
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 32, maxWidth: 380, textAlign: "center", boxShadow: CARD_SHADOW }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.text, marginBottom: 8 }}>Senha redefinida!</div>
          <div style={{ fontSize: 13.5, color: COLORS.textSoft, marginBottom: 20 }}>Já pode entrar com sua nova senha.</div>
          <a href="/login" style={{ color: COLORS.action, fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}>Ir para o login →</a>
        </div>
      </div>
    );
  }

  if (erroSessao) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.bg, fontFamily: "'Manrope', system-ui, sans-serif" }}>
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 32, maxWidth: 380, textAlign: "center", boxShadow: CARD_SHADOW }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.text, marginBottom: 8 }}>Link inválido ou expirado</div>
          <div style={{ fontSize: 13.5, color: COLORS.textSoft, marginBottom: 20 }}>Peça um novo link de recuperação de senha.</div>
          <a href="/login" style={{ color: COLORS.action, fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}>Voltar para o login →</a>
        </div>
      </div>
    );
  }

  if (!pronto) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textSoft, fontFamily: "'Manrope', system-ui, sans-serif" }}>Verificando link…</div>;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.bg, fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <form onSubmit={salvarNovaSenha} style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 32, width: "100%", maxWidth: 380, boxShadow: CARD_SHADOW }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.text, marginBottom: 4 }}>Defina sua nova senha</div>
        <div style={{ fontSize: 13, color: COLORS.textSoft, marginBottom: 20 }}>Escolha uma senha com pelo menos 6 caracteres</div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Nova senha</label>
          <input required type="password" minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Confirmar nova senha</label>
          <input required type="password" minLength={6} value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} style={inputStyle} />
        </div>

        {erro && <div style={{ fontSize: 12.5, color: COLORS.bad, marginBottom: 14 }}>{erro}</div>}

        <button type="submit" disabled={salvando} style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", background: COLORS.action, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
          {salvando ? "Salvando…" : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}
