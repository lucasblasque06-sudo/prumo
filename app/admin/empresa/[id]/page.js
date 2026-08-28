"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { COLORS, fmtBRL, STATUS_OBRA_LABEL, OBJETIVO_LABEL, CARD_SHADOW, FONT_MONO } from "../../../../lib/theme";

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

export default function AdminEmpresaDetalhe() {
  const params = useParams();
  const empresaId = params.id;

  const [carregando, setCarregando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [empresa, setEmpresa] = useState(null);
  const [membros, setMembros] = useState([]);
  const [obras, setObras] = useState([]);

  const [emailConvite, setEmailConvite] = useState("");
  const [enviandoConvite, setEnviandoConvite] = useState(false);
  const [msgConvite, setMsgConvite] = useState(null);

  const [mostrarNovaObra, setMostrarNovaObra] = useState(false);
  const [formObra, setFormObra] = useState({ nome: "", quadra_lote: "", endereco: "", objetivo: "venda", terreno_valor: "", orcamento_total: "", venda_prevista: "", definirOrcadoPorEtapa: null });
  const [criandoObra, setCriandoObra] = useState(false);
  const [erroObra, setErroObra] = useState(null);
  const [tentouSemEscolherObra, setTentouSemEscolherObra] = useState(false);

  const [obraEditando, setObraEditando] = useState(null);
  const [formEdicao, setFormEdicao] = useState({});
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [excluindoObraId, setExcluindoObraId] = useState(null);
  const [removendoMembroId, setRemovendoMembroId] = useState(null);

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

    const { data: empresaData } = await supabase.from("empresas").select("*").eq("id", empresaId).single();
    setEmpresa(empresaData);

    const { data: membrosData } = await supabase.rpc("admin_listar_membros", { p_empresa_id: empresaId });
    setMembros(membrosData || []);

    const { data: obrasData } = await supabase.from("obras").select("*").eq("empresa_id", empresaId).order("criado_em", { ascending: false });
    setObras(obrasData || []);

    setCarregando(false);
  }

  useEffect(() => {
    if (empresaId) carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  const enviarConvite = async (e) => {
    e.preventDefault();
    setEnviandoConvite(true);
    setMsgConvite(null);
    const { data, error } = await supabase.rpc("admin_convidar_por_email", { p_empresa_id: empresaId, p_email: emailConvite.trim() });
    setEnviandoConvite(false);
    if (error) {
      setMsgConvite({ tipo: "erro", texto: "Erro ao processar convite." });
      return;
    }
    const deuCerto = data?.includes("adicionado") || data?.includes("Convite criado");
    setMsgConvite({ tipo: deuCerto ? "ok" : "erro", texto: data });
    if (deuCerto) {
      setEmailConvite("");
      carregar();
    }
  };

  const criarObra = async (e) => {
    e.preventDefault();
    if (formObra.definirOrcadoPorEtapa === null) {
      setTentouSemEscolherObra(true);
      return;
    }
    setCriandoObra(true);
    setErroObra(null);

    const { data: obra, error: e1 } = await supabase
      .from("obras")
      .insert({
        empresa_id: empresaId,
        nome: formObra.nome,
        quadra_lote: formObra.quadra_lote || null,
        endereco: formObra.endereco,
        objetivo: formObra.objetivo,
        terreno_valor: Number(formObra.terreno_valor) || 0,
        orcamento_total: Number(formObra.orcamento_total) || 0,
        venda_prevista: formObra.objetivo === "venda" ? (Number(formObra.venda_prevista) || 0) : 0,
      })
      .select()
      .single();

    if (e1) {
      setErroObra("Não foi possível criar a obra: " + e1.message);
      setCriandoObra(false);
      return;
    }

    const etapasParaInserir = ETAPAS_PADRAO.map((et) => ({
      obra_id: obra.id,
      nome: et.nome,
      orcado_valor: formObra.definirOrcadoPorEtapa ? (Number(formObra.orcamento_total) || 0) * et.pct / 100 : null,
      ordem: et.ordem,
    }));
    const { error: e2 } = await supabase.from("etapas").insert(etapasParaInserir);

    setCriandoObra(false);
    if (e2) {
      setErroObra("Obra criada, mas houve erro ao criar as etapas: " + e2.message);
      return;
    }

    setFormObra({ nome: "", quadra_lote: "", endereco: "", objetivo: "venda", terreno_valor: "", orcamento_total: "", venda_prevista: "", definirOrcadoPorEtapa: null });
    setTentouSemEscolherObra(false);
    setMostrarNovaObra(false);
    carregar();
  };

  const abrirEdicao = (obra) => {
    setObraEditando(obra.id);
    setFormEdicao({
      nome: obra.nome || "",
      quadra_lote: obra.quadra_lote || "",
      endereco: obra.endereco || "",
      status: obra.status || "em_andamento",
      terreno_valor: obra.terreno_valor || "",
      orcamento_total: obra.orcamento_total || "",
      venda_prevista: obra.venda_prevista || "",
    });
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    setSalvandoEdicao(true);
    const { error } = await supabase
      .from("obras")
      .update({
        nome: formEdicao.nome,
        quadra_lote: formEdicao.quadra_lote || null,
        endereco: formEdicao.endereco,
        status: formEdicao.status,
        terreno_valor: Number(formEdicao.terreno_valor) || 0,
        orcamento_total: Number(formEdicao.orcamento_total) || 0,
        venda_prevista: Number(formEdicao.venda_prevista) || 0,
      })
      .eq("id", obraEditando);
    setSalvandoEdicao(false);
    if (error) {
      alert("Erro ao salvar: " + error.message);
      return;
    }
    setObraEditando(null);
    carregar();
  };

  const excluirObra = async (obraId, nomeObra) => {
    if (!confirm(`Tem certeza que quer excluir a obra "${nomeObra}"? Isso apaga TODOS os lançamentos e etapas dela. Essa ação não pode ser desfeita.`)) return;
    setExcluindoObraId(obraId);
    const { error } = await supabase.from("obras").delete().eq("id", obraId);
    setExcluindoObraId(null);
    if (error) {
      alert("Erro ao excluir: " + error.message);
      return;
    }
    carregar();
  };

  const removerMembro = async (userId, nomeMembro) => {
    if (!confirm(`Remover ${nomeMembro || "este membro"} desta empresa? A conta dele continua existindo, só perde acesso a esta empresa.`)) return;
    setRemovendoMembroId(userId);
    const { error } = await supabase.from("usuarios_empresas").delete().eq("user_id", userId).eq("empresa_id", empresaId);
    setRemovendoMembroId(null);
    if (error) {
      alert("Erro ao remover: " + error.message);
      return;
    }
    carregar();
  };

  if (carregando || !autorizado) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textSoft, fontFamily: "'Manrope', system-ui, sans-serif" }}>Carregando…</div>;
  }

  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13.5 };
  const labelStyle = { fontSize: 11.5, fontWeight: 600, color: COLORS.textSoft, marginBottom: 5, display: "block" };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, background: COLORS.paper, padding: "16px 20px" }}>
        <a href="/admin" style={{ fontSize: 12.5, color: COLORS.textSoft, textDecoration: "none" }}>← Todas as empresas</a>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 16px" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text, marginBottom: 24 }}>{empresa?.nome}</div>

        {/* MEMBROS */}
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: CARD_SHADOW }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: COLORS.text, marginBottom: 14 }}>Membros ({membros.length})</div>
          {membros.length === 0 && <div style={{ fontSize: 13, color: COLORS.textSoft, marginBottom: 16 }}>Nenhum membro ainda.</div>}
          {membros.map((m) => (
            <div key={m.user_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13, gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontWeight: 600, color: COLORS.text }}>{m.nome || "(sem nome)"}</span>
                <span style={{ color: COLORS.textSoft }}> — {m.email}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <div style={{ color: COLORS.textSoft, fontFamily: FONT_MONO, fontSize: 12 }}>{m.telefone || "sem WhatsApp"}</div>
                <button
                  onClick={() => removerMembro(m.user_id, m.nome)}
                  disabled={removendoMembroId === m.user_id}
                  style={{ background: "none", border: "none", color: COLORS.bad, cursor: "pointer", fontSize: 11.5, fontWeight: 600, padding: 0 }}
                >
                  {removendoMembroId === m.user_id ? "…" : "Remover"}
                </button>
              </div>
            </div>
          ))}

          <form onSubmit={enviarConvite} style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <input
              required
              type="email"
              placeholder="e-mail para convidar"
              value={emailConvite}
              onChange={(e) => setEmailConvite(e.target.value)}
              style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13 }}
            />
            <button type="submit" disabled={enviandoConvite} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: COLORS.action, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
              {enviandoConvite ? "…" : "Convidar"}
            </button>
          </form>
          {msgConvite && <div style={{ marginTop: 8, fontSize: 12.5, color: msgConvite.tipo === "ok" ? COLORS.good : COLORS.bad }}>{msgConvite.texto}</div>}
        </div>

        {/* OBRAS */}
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20, boxShadow: CARD_SHADOW }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: COLORS.text }}>Obras ({obras.length})</div>
            <button
              onClick={() => setMostrarNovaObra((v) => !v)}
              style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: COLORS.actionSoft, color: COLORS.action, fontWeight: 700, cursor: "pointer", fontSize: 12.5 }}
            >
              {mostrarNovaObra ? "Cancelar" : "+ Nova obra"}
            </button>
          </div>

          {mostrarNovaObra && (
            <form onSubmit={criarObra} style={{ background: COLORS.bg, borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Nome da obra</label>
                <input required value={formObra.nome} onChange={(e) => setFormObra({ ...formObra, nome: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Quadra e Lote (opcional)</label>
                <input value={formObra.quadra_lote} onChange={(e) => setFormObra({ ...formObra, quadra_lote: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Endereço</label>
                <input value={formObra.endereco} onChange={(e) => setFormObra({ ...formObra, endereco: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Objetivo da obra</label>
                <select value={formObra.objetivo} onChange={(e) => setFormObra({ ...formObra, objetivo: e.target.value })} style={inputStyle}>
                  {Object.entries(OBJETIVO_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {v.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={labelStyle}>Terreno (R$)</label>
                  <input type="number" value={formObra.terreno_valor} onChange={(e) => setFormObra({ ...formObra, terreno_valor: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Orçamento (R$)</label>
                  <input type="number" value={formObra.orcamento_total} onChange={(e) => setFormObra({ ...formObra, orcamento_total: e.target.value })} style={inputStyle} />
                </div>
              </div>
              {formObra.objetivo === "venda" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Venda prevista (R$)</label>
                  <input type="number" value={formObra.venda_prevista} onChange={(e) => setFormObra({ ...formObra, venda_prevista: e.target.value })} style={inputStyle} />
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                <div
                  onClick={() => { setFormObra({ ...formObra, definirOrcadoPorEtapa: true }); setTentouSemEscolherObra(false); }}
                  style={{
                    cursor: "pointer",
                    borderRadius: 8,
                    padding: 10,
                    border: `2px solid ${formObra.definirOrcadoPorEtapa === true ? COLORS.action : (tentouSemEscolherObra ? COLORS.bad : COLORS.border)}`,
                    background: formObra.definirOrcadoPorEtapa === true ? COLORS.actionSoft : COLORS.paper,
                  }}
                >
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: formObra.definirOrcadoPorEtapa === true ? COLORS.action : COLORS.text }}>Definir por etapa</div>
                  <div style={{ fontSize: 10.5, color: COLORS.textSoft, marginTop: 2 }}>Planeja R$ por etapa</div>
                </div>
                <div
                  onClick={() => { setFormObra({ ...formObra, definirOrcadoPorEtapa: false }); setTentouSemEscolherObra(false); }}
                  style={{
                    cursor: "pointer",
                    borderRadius: 8,
                    padding: 10,
                    border: `2px solid ${formObra.definirOrcadoPorEtapa === false ? COLORS.action : (tentouSemEscolherObra ? COLORS.bad : COLORS.border)}`,
                    background: formObra.definirOrcadoPorEtapa === false ? COLORS.actionSoft : COLORS.paper,
                  }}
                >
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: formObra.definirOrcadoPorEtapa === false ? COLORS.action : COLORS.text }}>Só acompanhar gastos</div>
                  <div style={{ fontSize: 10.5, color: COLORS.textSoft, marginTop: 2 }}>Sem orçamento pré-definido</div>
                </div>
              </div>
              {erroObra && <div style={{ fontSize: 12.5, color: COLORS.bad, marginBottom: 10 }}>{erroObra}</div>}
              <button type="submit" disabled={criandoObra} style={{ width: "100%", padding: 11, borderRadius: 8, border: "none", background: COLORS.action, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13.5 }}>
                {criandoObra ? "Criando…" : "Criar obra"}
              </button>
            </form>
          )}

          {obras.length === 0 && <div style={{ fontSize: 13, color: COLORS.textSoft }}>Nenhuma obra cadastrada ainda.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {obras.map((o) => {
              const st = STATUS_OBRA_LABEL[o.status] || STATUS_OBRA_LABEL.em_andamento;
              const editando = obraEditando === o.id;
              return (
                <div key={o.id} style={{ background: COLORS.bg, borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: COLORS.text, fontSize: 13 }}>{o.nome}{o.quadra_lote ? ` - ${o.quadra_lote}` : ""}</div>
                      <div style={{ fontSize: 11.5, color: st.color, marginTop: 2 }}>{st.dot} {st.label}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ fontFamily: FONT_MONO, color: COLORS.textSoft, fontSize: 12.5 }}>{fmtBRL(o.orcamento_total)}</div>
                      <button
                        onClick={() => (editando ? setObraEditando(null) : abrirEdicao(o))}
                        style={{ background: "none", border: "none", color: COLORS.action, cursor: "pointer", fontSize: 11.5, fontWeight: 700, padding: 0 }}
                      >
                        {editando ? "Fechar" : "Editar"}
                      </button>
                      <button
                        onClick={() => excluirObra(o.id, o.nome)}
                        disabled={excluindoObraId === o.id}
                        style={{ background: "none", border: "none", color: COLORS.bad, cursor: "pointer", fontSize: 11.5, fontWeight: 600, padding: 0 }}
                      >
                        {excluindoObraId === o.id ? "…" : "Excluir"}
                      </button>
                    </div>
                  </div>

                  {editando && (
                    <form onSubmit={salvarEdicao} style={{ padding: "0 14px 16px" }}>
                      <div style={{ marginBottom: 8 }}>
                        <label style={labelStyle}>Nome</label>
                        <input required value={formEdicao.nome} onChange={(e) => setFormEdicao({ ...formEdicao, nome: e.target.value })} style={inputStyle} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
                        <div>
                          <label style={labelStyle}>Quadra e Lote</label>
                          <input value={formEdicao.quadra_lote} onChange={(e) => setFormEdicao({ ...formEdicao, quadra_lote: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Status</label>
                          <select value={formEdicao.status} onChange={(e) => setFormEdicao({ ...formEdicao, status: e.target.value })} style={inputStyle}>
                            {Object.entries(STATUS_OBRA_LABEL).map(([k, v]) => (
                              <option key={k} value={k}>{v.dot} {v.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <label style={labelStyle}>Endereço</label>
                        <input value={formEdicao.endereco} onChange={(e) => setFormEdicao({ ...formEdicao, endereco: e.target.value })} style={inputStyle} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                        <div>
                          <label style={labelStyle}>Terreno (R$)</label>
                          <input type="number" value={formEdicao.terreno_valor} onChange={(e) => setFormEdicao({ ...formEdicao, terreno_valor: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Orçamento (R$)</label>
                          <input type="number" value={formEdicao.orcamento_total} onChange={(e) => setFormEdicao({ ...formEdicao, orcamento_total: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Venda prevista (R$)</label>
                          <input type="number" value={formEdicao.venda_prevista} onChange={(e) => setFormEdicao({ ...formEdicao, venda_prevista: e.target.value })} style={inputStyle} />
                        </div>
                      </div>
                      <button type="submit" disabled={salvandoEdicao} style={{ width: "100%", padding: 10, borderRadius: 8, border: "none", background: COLORS.action, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                        {salvandoEdicao ? "Salvando…" : "Salvar alterações"}
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
