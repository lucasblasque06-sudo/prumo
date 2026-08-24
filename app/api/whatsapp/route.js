import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

async function enviarWhatsApp(paraTelefone, mensagem) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const de = process.env.TWILIO_WHATSAPP_NUMBER;

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const body = new URLSearchParams({
    To: `whatsapp:+${paraTelefone}`,
    From: `whatsapp:${de}`,
    Body: mensagem,
  });

  const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!resp.ok) {
    const erro = await resp.text();
    console.error("Erro ao enviar WhatsApp:", resp.status, erro);
  }
}

function ok() {
  return new Response("OK", { status: 200 });
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
    return ok();
  }

  // Confirmação / cancelamento
  if (["sim", "confirmar", "confirmo", "s", "ok"].includes(bodyLower)) {
    const { data, error } = await supabase.rpc("whatsapp_confirmar_pendente", { p_telefone: telefone });
    await enviarWhatsApp(telefone, error ? "Erro ao confirmar. Tente novamente." : data);
    return ok();
  }
  if (["cancelar", "cancel", "não", "nao", "n"].includes(bodyLower)) {
    const { data, error } = await supabase.rpc("whatsapp_cancelar_pendente", { p_telefone: telefone });
    await enviarWhatsApp(telefone, error ? "Erro ao cancelar." : data);
    return ok();
  }

  // Mensagem de ajuda / primeiro contato
  if (["oi", "ola", "olá", "ajuda", "help", "menu"].includes(bodyLower)) {
    await enviarWhatsApp(
      telefone,
      "👋 Olá! Sou o assistente do Prumo.\n\n" +
      "Para lançar um gasto, envie assim:\n\n" +
      "valor: 200\n" +
      "desc: cimento\n" +
      "categoria: material\n" +
      "fornecedor: Casa do Construtor\n" +
      "etapa: fundação\n\n" +
      "(fornecedor e etapa são opcionais)"
    );
    return ok();
  }

  const campos = parseCampos(bodyRaw);
  const valor = parseValor(campos["valor"]);
  const descricao = campos["desc"] || campos["descricao"];

  if (!valor || !descricao) {
    await enviarWhatsApp(
      telefone,
      "Não entendi. Envie no formato:\n\n" +
      "valor: 200\n" +
      "desc: cimento\n" +
      "categoria: material\n" +
      "fornecedor: Casa do Construtor\n" +
      "etapa: fundação\n\n" +
      "Digite *ajuda* a qualquer momento para ver este exemplo de novo."
    );
    return ok();
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

  await enviarWhatsApp(telefone, error ? "Ocorreu um erro ao processar seu lançamento. Tente novamente." : data);
  return ok();
}
