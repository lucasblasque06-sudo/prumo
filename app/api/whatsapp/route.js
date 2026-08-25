import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

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

// Extrai "chave: valor" de cada linha da mensagem (formato estruturado, grátis e instantâneo)
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

// Fallback com IA: interpreta texto livre quando o formato estruturado não bate
async function extrairComIA(textoLivre) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Você extrai dados de gastos de obra a partir de mensagens em português informal do Brasil. " +
              "Responda APENAS com um JSON no formato: " +
              '{"valor": número ou null, "descricao": string ou null, "categoria": uma de "material","mao_de_obra","equipamento","taxas","outros" ou null, "fornecedor": string ou null, "etapa": string ou null, "obra": string ou null}. ' +
              "Se a mensagem não parecer ser sobre um gasto de obra, retorne todos os campos null.",
          },
          { role: "user", content: textoLivre },
        ],
        max_tokens: 200,
        temperature: 0,
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const conteudo = data.choices?.[0]?.message?.content;
    if (!conteudo) return null;
    return JSON.parse(conteudo);
  } catch (e) {
    console.error("Erro na extração por IA:", e);
    return null;
  }
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

  if (["sim", "confirmar", "confirmo", "s"].includes(bodyLower)) {
    const { data, error } = await supabaseAdmin.rpc("whatsapp_confirmar_pendente", { p_telefone: telefone });
    return twiml(error ? "Erro ao confirmar. Tente novamente." : data);
  }
  if (["cancelar", "cancel", "não", "nao", "n"].includes(bodyLower)) {
    const { data, error } = await supabaseAdmin.rpc("whatsapp_cancelar_pendente", { p_telefone: telefone });
    return twiml(error ? "Erro ao cancelar." : data);
  }

  if (["oi", "ola", "olá", "ajuda", "help", "menu"].includes(bodyLower)) {
    return twiml(
      "👋 Olá! Sou o assistente do Prumo.\n\n" +
      "Pode me contar naturalmente, tipo:\n" +
      '"gastei 200 reais em cimento na Casa do Construtor"\n\n' +
      "Ou se preferir, no formato:\n\n" +
      "valor: 200\n" +
      "desc: cimento\n" +
      "categoria: material\n" +
      "fornecedor: Casa do Construtor\n" +
      "etapa: fundação"
    );
  }

  // 1ª tentativa: formato estruturado (grátis, instantâneo)
  let campos = parseCampos(bodyRaw);
  let valor = parseValor(campos["valor"]);
  let descricao = campos["desc"] || campos["descricao"];

  // 2ª tentativa: texto livre interpretado por IA
  if (!valor || !descricao) {
    const extraido = await extrairComIA(bodyRaw);
    if (extraido && extraido.valor && extraido.descricao) {
      valor = extraido.valor;
      descricao = extraido.descricao;
      campos = {
        categoria: extraido.categoria || undefined,
        fornecedor: extraido.fornecedor || undefined,
        etapa: extraido.etapa || undefined,
        obra: extraido.obra || undefined,
      };
    }
  }

  if (!valor || !descricao) {
    return twiml(
      "Não entendi. Pode tentar descrever naturalmente (ex: \"gastei 200 em cimento\") ou usar o formato:\n\n" +
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
