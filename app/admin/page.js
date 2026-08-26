"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { COLORS, CARD_SHADOW, FONT_MONO } from "../../lib/theme";

export default function AdminPage() {
  const [carregando, setCarregando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [minhaEmpresaId, setMinhaEmpresaId] = useState(null);
  const [novoNome, setNovoNome] = useState("");
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState(null);

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    const { data: admin } = await supabase.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!admin) {
      window.location.href = "/obras";
      return;
    }
    setAutorizado(true);

    const { data: vinculo } = await supabase.from("usuarios_empresas").select("empresa_id").eq("user_id", user.id).maybeSingle();
    setMinhaEmpresaId(vinculo?.empresa_id || null);

    const { data: empresasData } = await supabase.from("empresas").select("*").order("criado_em", { ascending: true });

    const comContagens = await Promise.all(
      (empresasData || []).map(async (e) => {
        const { count: obrasCount } = await supabase.from("obras").select("id", { count: "exact", head: true }).eq("empresa_id", e.id);
        const { count: membrosCount } = await supabase.from("usuarios_empresas").select("user_id", { count: "exact", head: true }).eq("empresa_id", e.id);
        return { ...e, obrasCount: obrasCount || 0, membrosCount: membrosCount || 0 };
      })
    );

    setEmpresas(comContagens);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const criarEmpresa = async (e) => {
    e.preventDefault();
    if (!novoNome.trim()) return;
    setCriando(true);
    setErro(null);
    const { error } = await supabase.from("empresas").insert({ nome: novoNome.trim() });
    setCriando(false);
    if (error) {
      setErro("Não foi possível criar a empresa: " + error.message);
      return;
    }
    setNovoNome("");
    carregar();
  };

  if (carregando || !autorizado) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textSoft, fontFamily: "'Manrope', system-ui, sans-serif" }}>Carregando…</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, background: COLORS.paper, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="20" height="22" viewBox="0 0 24 26" fill="none">
            <line x1="12" y1="2" x2="12" y2="11" stroke={COLORS.text} strokeWidth="2" />
            <path d="M12 11L17 20H7L12 11Z" fill={COLORS.action} />
          </svg>
          <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.text }}>Prumo — Painel do Administrador</div>
        </div>
        <button
          onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
          style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "7px 12px", fontSize: 12.5, color: COLORS.textSoft, cursor: "pointer" }}
        >
          Sair
        </button>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 16px" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, marginBottom: 6 }}>Empresas usando o Prumo</div>
        <div style={{ fontSize: 13, color: COLORS.textSoft, marginBottom: 24 }}>
          Aqui você vê e gerencia todas as empresas cadastradas. Clique em uma para ver detalhes, membros e obras.
        </div>

        <form onSubmit={criarEmpresa} style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20, marginBottom: 24, boxShadow: CARD_SHADOW }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>+ Adicionar nova empresa</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Nome da empresa (ex: Rocha&Blasque)"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13.5 }}
            />
            <button
              type="submit"
              disabled={criando}
              style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: COLORS.action, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13.5, whiteSpace: "nowrap" }}
            >
              {criando ? "Criando…" : "Criar empresa"}
            </button>
          </div>
          {erro && <div style={{ marginTop: 10, fontSize: 12.5, color: COLORS.bad }}>{erro}</div>}
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {empresas.map((emp) => {
            const souMembro = emp.id === minhaEmpresaId;
            return (
              <div
                key={emp.id}
                style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "16px 20px", boxShadow: CARD_SHADOW, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{emp.nome}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSoft, marginTop: 3, fontFamily: FONT_MONO }}>
                    {emp.obrasCount} {emp.obrasCount === 1 ? "obra" : "obras"} · {emp.membrosCount} {emp.membrosCount === 1 ? "membro" : "membros"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {souMembro && (
                    <a
                      href="/obras"
                      style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 12.5, color: COLORS.textSoft, textDecoration: "none", fontWeight: 600 }}
                    >
                      Abrir workspace
                    </a>
                  )}
                  <a
                    href={`/admin/empresa/${emp.id}`}
                    style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: COLORS.actionSoft, fontSize: 12.5, color: COLORS.action, textDecoration: "none", fontWeight: 700 }}
                  >
                    Gerenciar →
                  </a>
                </div>
              </div>
            );
          })}
          {empresas.length === 0 && (
            <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 40, textAlign: "center", color: COLORS.textSoft, fontSize: 13.5 }}>
              Nenhuma empresa cadastrada ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
