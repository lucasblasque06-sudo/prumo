"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { COLORS, fmtBRL, STATUS_OBRA_LABEL, CARD_SHADOW, FONT_MONO } from "../../lib/theme";

export default function ObrasPage() {
  const [loading, setLoading] = useState(true);
  const [empresa, setEmpresa] = useState(null);
  const [obras, setObras] = useState([]);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: vinculo, error: e1 } = await supabase
        .from("usuarios_empresas")
        .select("empresa_id, empresas(*)")
        .eq("user_id", user.id)
        .single();

      if (e1 || !vinculo) {
        setErro("Sua conta ainda não está vinculada a nenhuma empresa.");
        setLoading(false);
        return;
      }

      setEmpresa(vinculo.empresas);

      const { data: obrasData, error: e2 } = await supabase
        .from("obras")
        .select("*")
        .eq("empresa_id", vinculo.empresa_id)
        .order("criado_em", { ascending: false });

      if (e2) {
        setErro(e2.message);
      } else {
        setObras(obrasData);
      }
      setLoading(false);
    }
    carregar();
  }, []);

  const sair = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textSoft, fontFamily: "'Manrope', system-ui, sans-serif" }}>
        Carregando…
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, background: COLORS.paper, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="20" height="22" viewBox="0 0 24 26" fill="none">
            <line x1="12" y1="2" x2="12" y2="11" stroke={COLORS.text} strokeWidth="2" />
            <path d="M12 11L17 20H7L12 11Z" fill={COLORS.action} />
          </svg>
          <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.text }}>{empresa?.nome || "Prumo"}</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/equipe" style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "7px 12px", fontSize: 12.5, color: COLORS.textSoft, textDecoration: "none" }}>
            Equipe
          </a>
          <button onClick={sair} style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "7px 12px", fontSize: 12.5, color: COLORS.textSoft, cursor: "pointer" }}>
            Sair
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, marginBottom: 6 }}>Suas obras</div>
            <div style={{ fontSize: 13, color: COLORS.textSoft }}>Selecione uma obra para ver o controle financeiro</div>
          </div>
          {!erro && (
            <a href="/nova-obra" style={{ background: COLORS.action, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13.5, fontWeight: 700, textDecoration: "none" }}>
              + Nova obra
            </a>
          )}
        </div>

        {erro && <div style={{ background: COLORS.badSoft, color: COLORS.bad, padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>{erro}</div>}

        {!erro && obras.length === 0 && (
          <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 40, textAlign: "center", color: COLORS.textSoft, fontSize: 13.5 }}>
            Nenhuma obra cadastrada ainda.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {obras.map((o) => {
            const st = STATUS_OBRA_LABEL[o.status] || STATUS_OBRA_LABEL.em_andamento;
            return (
              <a
                key={o.id}
                href={`/obra/${o.id}`}
                style={{ display: "block", background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "18px 22px", textDecoration: "none", boxShadow: CARD_SHADOW, transition: "border-color 0.15s ease" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>
                      {o.nome}{o.quadra_lote ? ` - ${o.quadra_lote}` : ""}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.textSoft, marginTop: 2 }}>{o.endereco}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11.5, color: st.color, fontWeight: 600 }}>{st.dot} {st.label}</div>
                    <div style={{ fontSize: 12.5, color: COLORS.textSoft, marginTop: 4, fontFamily: FONT_MONO }}>
                      {o.objetivo === "venda" && o.status === "vendida"
                        ? `Venda: ${fmtBRL(o.valor_venda_real)}`
                        : `Orçamento: ${fmtBRL(o.orcamento_total)}`}
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
