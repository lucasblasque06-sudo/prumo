import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

function twiml(mensagem) {
  const escapada = mensagem
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapada}</Message></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}

// Extrai "chave: valor" de cada linha da mensagem
function parseCampos(texto) {
  const campos = {};
  texto.split("\n").forEach((linha) => {
    const m = linha.match(/^\s*([a-zA-Zçãáéíóúõâêô ]+)\s*:\s*(.+)$/);
    if (m) {
      const chave = m[1].trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      campos[chave] = m[2].trim();
    }
  });
  return campos;
}

function parseValor(txt) {
  if (!txt) return null;
  const limpo = txt.replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3},)/g, "").replace(",", ".");
  const n = parseFloat(limpo);
  return isNaN(n) ? null : n;
}

export async function POST(req) {
  const form = await req.formData();
  const bodyRaw = (form.get("Body") || "").toString().trim();
  const fromRaw = (form.get("From") || "").toString();
  const telefone = fromRaw.replace("whatsapp:", "").replace(/[^\d]/g, "");
  const bodyLower = bodyRaw.toLowerCase();

  if (!telefone) {
    return twiml("Não foi possível identificar seu número.");
  }

  // Confirmação / cancelamento
  if (["sim", "confirmar", "confirmo", "s", "ok"].includes(bodyLower)) {
    const { data, error } = await supabase.rpc("whatsapp_confirmar_pendente", { p_telefone: telefone });
    return twiml(error ? "Erro ao confirmar. Tente novamente." : data);
  }
  if (["cancelar", "cancel", "não", "nao", "n"].includes(bodyLower)) {
    const { data, error } = await supabase.rpc("whatsapp_cancelar_pendente", { p_telefone: telefone });
    return twiml(error ? "Erro ao cancelar." : data);
  }

  // Mensagem de ajuda / primeiro contato
  if (["oi", "ola", "olá", "ajuda", "help", "menu"].includes(bodyLower)) {
    return twiml(
      "👋 Olá! Sou o assistente do Prumo.\n\n" +
      "Para lançar um gasto, envie assim:\n\n" +
      "valor: 200\n" +
      "desc: cimento\n" +
      "categoria: material\n" +
      "fornecedor: Casa do Construtor\n" +
      "etapa: fundação\n\n" +
      "(fornecedor e etapa são opcionais)"
    );
  }

  const campos = parseCampos(bodyRaw);
  const valor = parseValor(campos["valor"]);
  const descricao = campos["desc"] || campos["descricao"];

  if (!valor || !descricao) {
    return twiml(
      "Não entendi. Envie no formato:\n\n" +
      "valor: 200\n" +
      "desc: cimento\n" +
      "categoria: material\n" +
      "fornecedor: Casa do Construtor\n" +
      "etapa: fundação\n\n" +
      "Digite *ajuda* a qualquer momento para ver este exemplo de novo."
    );
  }

  const { data, error } = await supabase.rpc("whatsapp_criar_pendente", {
    p_telefone: telefone,
    p_valor: valor,
    p_descricao: descricao,
    p_categoria: campos["categoria"] || "outros",
    p_fornecedor: campos["fornecedor"] || null,
    p_etapa_busca: campos["etapa"] || null,
    p_obra_busca: campos["obra"] || null,
  });

  if (error) {
    return twiml("Ocorreu um erro ao processar seu lançamento. Tente novamente.");
  }
  return twiml(data);
}
