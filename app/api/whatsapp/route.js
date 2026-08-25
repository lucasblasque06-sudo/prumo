import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Cliente com privilégio elevado — só usado neste servidor, nunca exposto ao navegador.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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

function negar() {
  return new Response("Forbidden", { status: 403 });
}

// Confirma que a requisição realmente veio da Twilio (evita mensagens forjadas)
function validarAssinaturaTwilio(url, params, assinaturaRecebida) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken || !assinaturaRecebida) return false;
  const dados = Object.keys(params)
    .sort()
    .reduce((acc, chave) => acc + chave + params[chave], url);
  const esperada = crypto.createHmac("sha1", authToken).update(Buffer.from(dados, "utf-8")).digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(esperada), Buffer.from(assinaturaRecebida));
  } catch {
    return false;
  }
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
  const paramsObj = {};
  for (const [chave, valor] of form.entries()) paramsObj[chave] = valor.toString();

  const assinatura = req.headers.get("x-twilio-signature");
  if (!validarAssinaturaTwilio(req.url, paramsObj, assinatura)) {
    return negar();
  }

  const bodyRaw = (paramsObj["Body"] || "").trim();
  const fromRaw = paramsObj["From"] || "";
  const telefone = fromRaw.replace("whatsapp:", "").replace(/[^\d]/g, "");
  const bodyLower = bodyRaw.toLowerCase();

  if (!telefone) {
    return twiml("Não foi possível identificar seu número.");
  }

  // Confirmação / cancelamento
  if (["sim", "confirmar", "confirmo", "s"].includes(bodyLower)) {
    const { data, error } = await supabaseAdmin.rpc("whatsapp_confirmar_pendente", { p_telefone: telefone });
    return twiml(error ? "Erro ao confirmar. Tente novamente." : data);
  }
  if (["cancelar", "cancel", "não", "nao", "n"].includes(bodyLower)) {
    const { data, error } = await supabaseAdmin.rpc("whatsapp_cancelar_pendente", { p_telefone: telefone });
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

  const { data, error } = await supabaseAdmin.rpc("whatsapp_criar_pendente", {
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
