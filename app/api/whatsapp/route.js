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

const ETAPAS_CONHECIDAS = [
  "Terraplanagem / Fundação",
  "Estrutura (alvenaria/laje)",
  "Cobertura / Telhado",
  "Instalações (elétrica/hidráulica)",
  "Esquadrias (portas/janelas)",
  "Revestimentos / Acabamento",
  "Pintura",
  "Área externa / Paisagismo",
  "Documentação / Taxas / Projetos",
  "Imprevistos (reserva)",
];

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
              "Responda APENAS com um JSON: " +
              '{"valor": número ou null, "descricao": string ou null, "categoria": uma de "material","mao_de_obra","equipamento","taxas","outros" ou null, "fornecedor": string ou null, "etapa": string ou null, "obra": string ou null}. ' +
              "Para 'etapa', escolha a mais provável entre exatamente estas opções (ou null se genuinamente não souber): " +
              ETAPAS_CONHECIDAS.map((e) => `"${e}"`).join(", ") + ". " +
              "Use conhecimento geral de construção civil para inferir a etapa e categoria mesmo que não estejam explícitas — " +
              "ex: chuveiro/torneira/fiação/tomada → Instalações (elétrica/hidráulica); tijolo/laje/viga → Estrutura; telha → Cobertura/Telhado; tinta → Pintura. " +
              "Se a mensagem não parecer ser sobre um gasto de obra, retorne todos os campos null.",
          },
          { role: "user", content: textoLivre },
        ],
        max_tokens: 200,
        temperature: 0,
      }),
    });
    if (!resp.ok) {
      console.error("Erro na API da OpenAI:", resp.status, await resp.text());
      return null;
    }
    const data = await resp.json();
    const conteudo = data.choices?.[0]?.message?.content;
    if (!conteudo) return null;
    return JSON.parse(conteudo);
  } catch (e) {
    console.error("Erro na extração por IA:", e);
    return null;
  }
}

async function buscarRascunho(telefone) {
  const { data } = await supabaseAdmin
    .from("whatsapp_rascunhos")
    .select("*")
    .eq("telefone", telefone)
    .gte("atualizado_em", new Date(Date.now() - 15 * 60 * 1000).toISOString())
    .maybeSingle();
  return data;
}

async function salvarRascunho(telefone, dados) {
  await supabaseAdmin
    .from("whatsapp_rascunhos")
    .upsert({ telefone, ...dados, atualizado_em: new Date().toISOString() });
}

async function limparRascunho(telefone) {
  await supabaseAdmin.from("whatsapp_rascunhos").delete().eq("telefone", telefone);
}

// Descobre quantas/quais obras ativas a empresa do telefone tem
async function obrasAtivasDoTelefone(telefone) {
  const { data: perfil } = await supabaseAdmin.from("perfis").select("user_id").eq("telefone", telefone).maybeSingle();
  if (!perfil) return [];
  const { data: vinculo } = await supabaseAdmin.from("usuarios_empresas").select("empresa_id").eq("user_id", perfil.user_id).maybeSingle();
  if (!vinculo) return [];
  const { data: obras } = await supabaseAdmin.from("obras").select("id, nome").eq("empresa_id", vinculo.empresa_id).neq("status", "vendida");
  return obras || [];
}

function encontrarObraPorNome(obras, textoBusca) {
  if (!textoBusca) return null;
  const alvo = textoBusca.toLowerCase();
  return obras.find((o) => o.nome.toLowerCase().includes(alvo)) || null;
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
    await limparRascunho(telefone);
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

  // 1ª tentativa: formato estruturado
  let campos = parseCampos(bodyRaw);
  let valor = parseValor(campos["valor"]);
  let descricao = campos["desc"] || campos["descricao"];
  let categoria = campos["categoria"];
  let fornecedor = campos["fornecedor"];
  let etapa = campos["etapa"];
  let obraTexto = campos["obra"];

  // 2ª tentativa: texto livre via IA
  if (!valor && !descricao) {
    const extraido = await extrairComIA(bodyRaw);
    if (extraido) {
      valor = valor || extraido.valor;
      descricao = descricao || extraido.descricao;
      categoria = categoria || extraido.categoria;
      fornecedor = fornecedor || extraido.fornecedor;
      etapa = etapa || extraido.etapa;
      obraTexto = obraTexto || extraido.obra;
    }
  }

  // Junta com rascunho pendente (resposta a uma pergunta anterior do bot)
  const rascunho = await buscarRascunho(telefone);
  if (rascunho) {
    valor = valor ?? rascunho.valor;
    descricao = descricao ?? rascunho.descricao;
    categoria = categoria ?? rascunho.categoria;
    fornecedor = fornecedor ?? rascunho.fornecedor;
    etapa = etapa ?? rascunho.etapa_busca;
    obraTexto = obraTexto ?? rascunho.obra_busca;
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

  // Checa ambiguidade de obra ANTES de criar o pendente de verdade
  const obras = await obrasAtivasDoTelefone(telefone);
  if (obras.length > 1) {
    const obraEncontrada = encontrarObraPorNome(obras, obraTexto);
    if (!obraEncontrada) {
      await salvarRascunho(telefone, { valor, descricao, categoria, fornecedor, etapa_busca: etapa, obra_busca: obraTexto });
      return twiml(
        `Você tem mais de uma obra em andamento (${obras.map((o) => o.nome).join(", ")}). ` +
        `Só me diga o nome da obra que eu completo o lançamento de "${descricao}" (R$ ${valor}).`
      );
    }
    obraTexto = obraEncontrada.nome;
  }

  await limparRascunho(telefone);

  const { data, error } = await supabaseAdmin.rpc("whatsapp_criar_pendente", {
    p_telefone: telefone,
    p_valor: valor,
    p_descricao: descricao,
    p_categoria: categoria || "outros",
    p_fornecedor: fornecedor || null,
    p_etapa_busca: etapa || null,
    p_obra_busca: obraTexto || null,
  });

  if (error) {
    return twiml("Ocorreu um erro ao processar seu lançamento. Tente novamente.");
  }
  return twiml(data);
}
