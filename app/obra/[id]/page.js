"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { COLORS, STATUS_OBRA_LABEL } from "../../../lib/theme";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import NovoLancamentoModal from "../../../components/NovoLancamentoModal";
import EditarObraModal from "../../../components/EditarObraModal";
import VisaoGeral from "../../../components/VisaoGeral";
import Gastos from "../../../components/Gastos";
import Etapas from "../../../components/Etapas";
import Fornecedores from "../../../components/Fornecedores";

const PAGE_TITLES = {
  geral: "Visão geral",
  gastos: "Gastos",
  etapas: "Etapas",
  fornecedores: "Fornecedores",
};

export default function ObraDashboard() {
  const params = useParams();
  const obraId = params.id;

  const [obra, setObra] = useState(null);
  const [stages, setStages] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [page, setPage] = useState("geral");
  const [showModal, setShowModal] = useState(false);
  const [showEditarObra, setShowEditarObra] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function carregarDados() {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: obraData, error: e1 } = await supabase.from("obras").select("*").eq("id", obraId).single();
      if (e1) throw e1;

      const { data: etapasData, error: e2 } = await supabase
        .from("etapas")
        .select("*")
        .eq("obra_id", obraId)
        .order("ordem", { ascending: true });
      if (e2) throw e2;

      const etapaIds = etapasData.map((e) => e.id);
      const { data: lancamentosData, error: e3 } = await supabase
        .from("lancamentos")
        .select("*")
        .in("etapa_id", etapaIds)
        .order("data", { ascending: false });
      if (e3) throw e3;

      const nomeEtapa = (id) => etapasData.find((s) => s.id === id)?.nome ?? id;

      setObra(obraData);
      setStages(etapasData.map((e) => ({ id: e.id, nome: e.nome, pct: Number(e.percentual_orcamento) })));
      setEntries(
        lancamentosData.map((l) => ({
          id: l.id,
          data: l.data,
          etapa: l.etapa_id,
          stageName: nomeEtapa(l.etapa_id),
          desc: l.descricao,
          valor: Number(l.valor),
          quem: l.quem,
          fonte: l.fonte,
          categoria: l.categoria,
          fornecedor: l.fornecedor,
        }))
      );
      setErro(null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (obraId) carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId]);

  const updatePct = async (id, newPct) => {
    const pct = Math.max(0, Math.min(100, newPct));
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, pct } : s)));
    const { error } = await supabase.from("etapas").update({ percentual_orcamento: pct }).eq("id", id);
    if (error) setErro("Não foi possível salvar a etapa: " + error.message);
  };

  const salvarLancamento = async (form) => {
    const { error } = await supabase.from("lancamentos").insert({
      etapa_id: form.etapa_id,
      descricao: form.descricao,
      valor: Number(form.valor),
      categoria: form.categoria,
      fornecedor: form.fornecedor || null,
      quem: form.quem || "Manual (site)",
      fonte: "manual",
      data: form.data,
    });
    if (error) {
      setErro("Não foi possível salvar o lançamento: " + error.message);
      return;
    }
    setShowModal(false);
    carregarDados();
  };

  const salvarEdicaoObra = async (payload) => {
    const { error } = await supabase.from("obras").update(payload).eq("id", obraId);
    if (error) {
      setErro("Não foi possível salvar as alterações: " + error.message);
      return;
    }
    setShowEditarObra(false);
    carregarDados();
  };

  if (loading) {
    return (
      <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Manrope', system-ui, sans-serif", color: COLORS.textSoft }}>
        Carregando dados da obra…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.bg, fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        button { font-family: inherit; }
        input, select { font-family: inherit; }
        input[type=range] { -webkit-appearance: none; appearance: none; background: transparent; }
        input[type=range]::-webkit-slider-runnable-track { height: 4px; background: ${COLORS.border}; border-radius: 2px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; margin-top: -8px; border-radius: 50%; background: ${COLORS.action}; cursor: pointer; }
        .sidebar-item:hover { background: ${COLORS.sidebarHover} !important; }
        .hover-row:hover { background: #FBFBFA; }
        .page-content { padding: 24px 28px 60px; }
        @media (max-width: 860px) {
          .sidebar { position: fixed !important; left: 0; top: 0; z-index: 50; transform: translateX(-100%); transition: transform 0.2s ease; }
          .sidebar.open { transform: translateX(0); }
          .sidebar-overlay { display: block !important; }
          .menu-btn { display: block !important; }
          .two-col { grid-template-columns: 1fr !important; }
          .app-header { padding: 14px 16px !important; }
          .novo-lancamento-btn { padding: 9px 12px !important; font-size: 12.5px !important; }
          .page-content { padding: 16px 16px 80px !important; }
        }
      `}</style>

      <Sidebar active={page} onNavigate={(p) => { setPage(p); setSidebarOpen(false); }} obraNome={obra ? `${obra.nome}${obra.quadra_lote ? ` - ${obra.quadra_lote}` : ""}` : ""} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <Header onNovoLancamento={() => setShowModal(true)} onMenuClick={() => setSidebarOpen(true)} subtitulo={obra?.endereco || ""} obraNome={obra ? `${obra.nome}${obra.quadra_lote ? ` - ${obra.quadra_lote}` : ""}` : ""} />

        <div className="page-content">
          <a href="/obras" style={{ fontSize: 12.5, color: COLORS.textSoft, textDecoration: "none", display: "inline-block", marginBottom: 10 }}>← Todas as obras</a>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text }}>{PAGE_TITLES[page]}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {obra?.status && (
                <span style={{ fontSize: 12, fontWeight: 700, color: (STATUS_OBRA_LABEL[obra.status] || STATUS_OBRA_LABEL.em_andamento).color }}>
                  {(STATUS_OBRA_LABEL[obra.status] || STATUS_OBRA_LABEL.em_andamento).dot} {(STATUS_OBRA_LABEL[obra.status] || STATUS_OBRA_LABEL.em_andamento).label}
                </span>
              )}
              <button
                onClick={() => setShowEditarObra(true)}
                style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: COLORS.textSoft, cursor: "pointer" }}
              >
                Editar obra
              </button>
            </div>
          </div>

          {erro && (
            <div style={{ background: COLORS.badSoft, color: COLORS.bad, padding: "10px 14px", borderRadius: 8, fontSize: 12.5, marginBottom: 16 }}>
              {erro}
            </div>
          )}

          {page === "geral" && <VisaoGeral obra={obra} stages={stages} entries={entries} />}
          {page === "gastos" && <Gastos entries={entries} stages={stages} />}
          {page === "etapas" && <Etapas obra={obra} stages={stages} entries={entries} onUpdatePct={updatePct} />}
          {page === "fornecedores" && <Fornecedores entries={entries} />}
        </div>
      </div>

      {showModal && (
        <NovoLancamentoModal stages={stages} onClose={() => setShowModal(false)} onSave={salvarLancamento} />
      )}

      {showEditarObra && obra && (
        <EditarObraModal obra={obra} entries={entries} onClose={() => setShowEditarObra(false)} onSave={salvarEdicaoObra} />
      )}
    </div>
  );
}
