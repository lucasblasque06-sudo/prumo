"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { COLORS, CARD_SHADOW, FONT_MONO } from "../../lib/theme";

export default function EquipePage() {
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [membros, setMembros] = useState([]);
  const [convitesPendentes, setConvitesPendentes] = useState([]);
  const [emailNovo, setEmailNovo] = useState("");
  const [mensagem, setMensagem] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    const { data: vinculo } = await supabase.from("usuarios_empresas").select("empresa_id, empresas(*)").eq("user_id", user.id).single();
    setEmpresa(vinculo?.empresas || null);

    const { data: membrosData } = await supabase.rpc("listar_membros_da_minha_empresa");
    setMembros(membrosData || []);

    if (vinculo?.empresa_id) {
      const { data: convites } = await supabase
        .from("convites")
        .select("*")
        .eq("empresa_id", vinculo.empresa_id)
        .eq("aceito", false)
        .order("criado_em", { ascending: false });
      setConvitesPendentes(convites || []);
    }

    setLoading(false);
  }

  useEffect(() => {
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
    const deuCerto = data?.includes("sucesso") || data?.includes("adicionado") || data?.includes("Convite criado");
    setMensagem({ tipo: deuCerto ? "ok" : "erro", texto: data });
    if (deuCerto) {
      setEmailNovo("");
      carregar();
    }
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
        <div style={{ fontSize: 13, color: COLORS.textSoft, marginBottom: 24 }}>Veja quem já faz parte e adicione novas pessoas</div>

        {/* MEMBROS */}
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 22, marginBottom: 16, boxShadow: CARD_SHADOW }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.text, marginBottom: 14 }}>Membros ({membros.length})</div>
          {membros.map((m) => (
            <div key={m.user_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13, gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontWeight: 600, color: COLORS.text }}>{m.nome || "(sem nome)"}</span>
                {m.sou_eu && <span style={{ fontSize: 10.5, color: COLORS.action, fontWeight: 700, marginLeft: 6 }}>VOCÊ</span>}
                <div style={{ color: COLORS.textSoft, fontSize: 11.5 }}>{m.email}</div>
              </div>
              <div style={{ color: COLORS.textSoft, fontFamily: FONT_MONO, fontSize: 11.5, flexShrink: 0 }}>{m.telefone || "sem WhatsApp"}</div>
            </div>
          ))}
        </div>

        {/* CONVITES PENDENTES */}
        {convitesPendentes.length > 0 && (
          <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 22, marginBottom: 16, boxShadow: CARD_SHADOW }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>Convites aguardando cadastro ({convitesPendentes.length})</div>
            {convitesPendentes.map((c) => (
              <div key={c.id} style={{ padding: "7px 0", fontSize: 12.5, color: COLORS.textSoft }}>{c.email}</div>
            ))}
          </div>
        )}

        {/* CONVIDAR */}
        <form onSubmit={adicionar} style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 22, boxShadow: CARD_SHADOW }}>
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
