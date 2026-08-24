"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { COLORS, CARD_SHADOW } from "../../lib/theme";

export default function EquipePage() {
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailNovo, setEmailNovo] = useState("");
  const [mensagem, setMensagem] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }
      const { data } = await supabase.from("usuarios_empresas").select("empresas(*)").eq("user_id", user.id).single();
      setEmpresa(data?.empresas || null);
      setLoading(false);
    }
    carregar();
  }, []);

  const adicionar = async (e) => {
    e.preventDefault();
    setMensagem(null);
    setEnviando(true);
    const { data, error } = await supabase.rpc("convidar_por_email", { email_alvo: emailNovo });
    setEnviando(false);
    if (error) {
      setMensagem({ tipo: "erro", texto: "Não foi possível processar. Tente novamente." });
      return;
    }
    setMensagem({ tipo: (data?.includes("sucesso") || data?.includes("adicionado") || data?.includes("Convite criado")) ? "ok" : "erro", texto: data });
    if (data?.includes("adicionado") || data?.includes("Convite criado")) setEmailNovo("");
  };

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textSoft, fontFamily: "'Manrope', system-ui, sans-serif" }}>Carregando…</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, background: COLORS.paper, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.text }}>{empresa?.nome || "Prumo"}</div>
        <a href="/obras" style={{ fontSize: 12.5, color: COLORS.textSoft, textDecoration: "none" }}>← Voltar para obras</a>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 16px" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, marginBottom: 6 }}>Equipe</div>
        <div style={{ fontSize: 13, color: COLORS.textSoft, marginBottom: 24 }}>Adicione pessoas da sua empresa ao Prumo</div>

        <form onSubmit={adicionar} style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 22, marginBottom: 20, boxShadow: CARD_SHADOW }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Convidar por e-mail</div>
          <div style={{ fontSize: 12, color: COLORS.textSoft, marginBottom: 14 }}>
            Se a pessoa já tem conta, ela é adicionada na hora. Se ainda não tem, fica um convite pendente — assim que ela criar a conta em <a href="/cadastro" style={{ color: COLORS.action }}>/cadastro</a> com esse mesmo e-mail, entra automaticamente na equipe.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              required
              type="email"
              placeholder="email@exemplo.com"
              value={emailNovo}
              onChange={(e) => setEmailNovo(e.target.value)}
              style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13.5 }}
            />
            <button type="submit" disabled={enviando} style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: COLORS.action, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13.5 }}>
              {enviando ? "…" : "Adicionar"}
            </button>
          </div>
          {mensagem && (
            <div style={{ marginTop: 12, fontSize: 12.5, color: mensagem.tipo === "ok" ? COLORS.good : COLORS.bad }}>
              {mensagem.texto}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
