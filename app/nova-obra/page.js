"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { COLORS, CARD_SHADOW, OBJETIVO_LABEL } from "../../lib/theme";

const ETAPAS_PADRAO = [
  { nome: "Terraplanagem / Fundação", pct: 8, ordem: 1 },
  { nome: "Estrutura (alvenaria/laje)", pct: 18, ordem: 2 },
  { nome: "Cobertura / Telhado", pct: 8, ordem: 3 },
  { nome: "Instalações (elétrica/hidráulica)", pct: 12, ordem: 4 },
  { nome: "Esquadrias (portas/janelas)", pct: 8, ordem: 5 },
  { nome: "Revestimentos / Acabamento", pct: 20, ordem: 6 },
  { nome: "Pintura", pct: 4, ordem: 7 },
  { nome: "Área externa / Paisagismo", pct: 6, ordem: 8 },
  { nome: "Documentação / Taxas / Projetos", pct: 4, ordem: 9 },
  { nome: "Imprevistos (reserva)", pct: 12, ordem: 10 },
];

export default function NovaObraPage() {
  const [form, setForm] = useState({ nome: "", quadra_lote: "", endereco: "", objetivo: "venda", terreno_valor: "", orcamento_total: "", venda_prevista: "", definirOrcadoPorEtapa: null });
  const [empresaId, setEmpresaId] = useState(null);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tentouSemEscolher, setTentouSemEscolher] = useState(false);

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }
      const { data } = await supabase.from("usuarios_empresas").select("empresa_id").eq("user_id", user.id).single();
      if (!data) {
        setErro("Sua conta não está vinculada a nenhuma empresa.");
      } else {
        setEmpresaId(data.empresa_id);
      }
      setLoading(false);
    }
    carregar();
  }, []);

  const salvar = async (e) => {
    e.preventDefault();
    if (!empresaId) return;
    if (form.definirOrcadoPorEtapa === null) {
      setTentouSemEscolher(true);
      return;
    }
    setSalvando(true);
    setErro(null);

    const { data: obra, error: e1 } = await supabase
      .from("obras")
      .insert({
        empresa_id: empresaId,
        nome: form.nome,
        quadra_lote: form.quadra_lote || null,
        endereco: form.endereco,
        objetivo: form.objetivo,
        terreno_valor: Number(form.terreno_valor) || 0,
        orcamento_total: Number(form.orcamento_total) || 0,
        venda_prevista: form.objetivo === "venda" ? (Number(form.venda_prevista) || 0) : 0,
      })
      .select()
      .single();

    if (e1) {
      setErro("Não foi possível criar a obra: " + e1.message);
      setSalvando(false);
      return;
    }

    const etapasParaInserir = ETAPAS_PADRAO.map((et) => ({
      obra_id: obra.id,
      nome: et.nome,
      orcado_valor: form.definirOrcadoPorEtapa ? (Number(form.orcamento_total) || 0) * et.pct / 100 : null,
      ordem: et.ordem,
    }));
    const { error: e2 } = await supabase.from("etapas").insert(etapasParaInserir);

    setSalvando(false);
    if (e2) {
      setErro("Obra criada, mas houve um erro ao criar as etapas: " + e2.message);
      return;
    }

    window.location.href = `/obra/${obra.id}`;
  };

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textSoft, fontFamily: "'Manrope', system-ui, sans-serif" }}>Carregando…</div>;
  }

  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13.5 };
  const labelStyle = { fontSize: 11.5, fontWeight: 600, color: COLORS.textSoft, marginBottom: 5, display: "block" };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, background: COLORS.paper, padding: "16px 20px" }}>
        <a href="/obras" style={{ fontSize: 12.5, color: COLORS.textSoft, textDecoration: "none" }}>← Voltar para obras</a>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "28px 16px" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, marginBottom: 6 }}>Nova obra</div>
        <div style={{ fontSize: 13, color: COLORS.textSoft, marginBottom: 24 }}>As 10 etapas padrão já entram configuradas — você decide se quer planejar o orçamento por etapa desde já</div>

        <form onSubmit={salvar} style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, boxShadow: CARD_SHADOW }}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Nome da obra</label>
            <input required placeholder="Ex: Casa João Silva" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Quadra e Lote (opcional)</label>
            <input placeholder="Ex: U30" value={form.quadra_lote} onChange={(e) => setForm({ ...form, quadra_lote: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Endereço</label>
            <input placeholder="Ex: Rua X, 123 - Indaiatuba/SP" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Objetivo da obra</label>
            <select value={form.objetivo} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} style={inputStyle}>
              {Object.entries(OBJETIVO_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Terreno (R$)</label>
              <input type="number" placeholder="0" value={form.terreno_valor} onChange={(e) => setForm({ ...form, terreno_valor: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Orçamento (R$)</label>
              <input type="number" placeholder="0" value={form.orcamento_total} onChange={(e) => setForm({ ...form, orcamento_total: e.target.value })} style={inputStyle} />
            </div>
          </div>
          {form.objetivo === "venda" && (
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Venda prevista (R$)</label>
              <input type="number" placeholder="0" value={form.venda_prevista} onChange={(e) => setForm({ ...form, venda_prevista: e.target.value })} style={inputStyle} />
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div
                onClick={() => { setForm({ ...form, definirOrcadoPorEtapa: true }); setTentouSemEscolher(false); }}
                style={{
                  cursor: "pointer",
                  borderRadius: 10,
                  padding: 14,
                  border: `2px solid ${form.definirOrcadoPorEtapa === true ? COLORS.action : (tentouSemEscolher ? COLORS.bad : COLORS.border)}`,
                  background: form.definirOrcadoPorEtapa === true ? COLORS.actionSoft : COLORS.bg,
                  transition: "border-color 0.15s ease",
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 700, color: form.definirOrcadoPorEtapa === true ? COLORS.action : COLORS.text, marginBottom: 4 }}>
                  Definir orçamento por etapa
                </div>
                <div style={{ fontSize: 11.5, color: COLORS.textSoft, lineHeight: 1.4 }}>
                  Planeja quanto (em R$) vai pra cada etapa desde já
                </div>
              </div>
              <div
                onClick={() => { setForm({ ...form, definirOrcadoPorEtapa: false }); setTentouSemEscolher(false); }}
                style={{
                  cursor: "pointer",
                  borderRadius: 10,
                  padding: 14,
                  border: `2px solid ${form.definirOrcadoPorEtapa === false ? COLORS.action : (tentouSemEscolher ? COLORS.bad : COLORS.border)}`,
                  background: form.definirOrcadoPorEtapa === false ? COLORS.actionSoft : COLORS.bg,
                  transition: "border-color 0.15s ease",
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 700, color: form.definirOrcadoPorEtapa === false ? COLORS.action : COLORS.text, marginBottom: 4 }}>
                  Somente acompanhar os gastos
                </div>
                <div style={{ fontSize: 11.5, color: COLORS.textSoft, lineHeight: 1.4 }}>
                  Sem orçamento pré-definido — dá pra adicionar depois, etapa por etapa
                </div>
              </div>
            </div>
          </div>

          {erro && <div style={{ fontSize: 12.5, color: COLORS.bad, marginBottom: 14 }}>{erro}</div>}

          <button type="submit" disabled={salvando || !empresaId} style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", background: COLORS.action, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            {salvando ? "Criando…" : "Criar obra"}
          </button>
        </form>
      </div>
    </div>
  );
}
