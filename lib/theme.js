export const COLORS = {
  bg: "#F6F4FA",
  sidebar: "#0F0A1A",
  sidebarHover: "#211433",
  sidebarText: "#A79AC2",
  sidebarTextActive: "#FFFFFF",
  paper: "#FFFFFF",
  border: "#E4DFF0",
  text: "#181123",
  textSoft: "#6F6584",
  action: "#6B2FD6",
  actionHover: "#5623B0",
  actionSoft: "#EEE6FA",
  good: "#1F8B5C",
  goodSoft: "#E2F4EB",
  bad: "#D6395A",
  badSoft: "#FBE3E9",
  warn: "#C9871F",
  warnSoft: "#FAF0DD",
};

export const CARD_SHADOW = "0 1px 2px rgba(24,17,35,0.04), 0 8px 24px -12px rgba(24,17,35,0.10)";
export const FONT_SANS = "'Manrope', system-ui, sans-serif";
export const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

export const CATEGORIA_LABEL = {
  material: "Material",
  mao_de_obra: "Mão de obra",
  equipamento: "Equipamento",
  taxas: "Taxas",
  outros: "Outros",
};

export const fmtBRL = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const fmtBRLPrecise = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

export const fmtDataCurta = (iso) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

export const fmtDataLonga = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export const STATUS_OBRA_LABEL = {
  em_andamento: { label: "Em andamento", color: COLORS.good, dot: "🟢" },
  em_venda: { label: "Em venda", color: COLORS.warn, dot: "🟡" },
  vendida: { label: "Vendida", color: COLORS.action, dot: "🏁" },
};

// Status de uso do orçamento por etapa — usado em vários lugares
export function statusEtapa(pctUsado) {
  if (pctUsado > 100) return { label: "acima do orçamento", color: COLORS.bad, bg: COLORS.badSoft, dot: "🔴" };
  if (pctUsado > 85) return { label: "atenção", color: COLORS.warn, bg: COLORS.warnSoft, dot: "🟡" };
  return { label: "dentro do orçamento", color: COLORS.good, bg: COLORS.goodSoft, dot: "🟢" };
}
