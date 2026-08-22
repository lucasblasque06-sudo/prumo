export const COLORS = {
  bg: "#F7F7F5",
  sidebar: "#171A1C",
  sidebarHover: "#23282B",
  sidebarText: "#9AA3A8",
  sidebarTextActive: "#FFFFFF",
  paper: "#FFFFFF",
  border: "#E7E6E2",
  text: "#1D252B",
  textSoft: "#6B7378",
  action: "#D66A18",
  actionSoft: "#FBEADB",
  good: "#23845B",
  goodSoft: "#E1F2EA",
  bad: "#D64545",
  badSoft: "#FBE4E4",
  warn: "#D59B25",
  warnSoft: "#FBF0DC",
};

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
