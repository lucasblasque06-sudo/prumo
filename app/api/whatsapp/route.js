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

// Baixa uma mídia do WhatsApp (a Twilio exige autenticação básica pra isso)
async function baixarMidiaTwilio(url) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  try {
    const resp = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
    if (!resp.ok) return null;
    const buffer = Buffer.from(await resp.arrayBuffer());
    const contentType = resp.headers.get("content-type") || "";
    return { buffer, contentType };
  } catch (e) {
    console.error("Erro ao baixar mídia da Twilio:", e);
    return null;
  }
}

// Transcreve uma nota de voz usando Whisper (OpenAI)
async function transcreverAudio(buffer, contentType) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const blob = new Blob([buffer], { type: contentType || "audio/ogg" });
    const form = new FormData();
    form.append("file", blob, "audio.ogg");
    form.append("model", "whisper-1");
    form.append("language", "pt");

    const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!resp.ok) {
      console.error("Erro no Whisper:", resp.status, await resp.text());
      return null;
    }
    const data = await resp.json();
    return data.text || null;
  } catch (e) {
    console.error("Erro ao transcrever áudio:", e);
    return null;
  }
}

// Lê uma foto de nota fiscal/recibo usando IA de visão
async function extrairDeImagem(buffer, contentType) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${contentType || "image/jpeg"};base64,${base64}`;

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
              "Você lê fotos de notas fiscais ou recibos de compras de material/serviço de construção civil. " +
              "Responda APENAS com um JSON: " +
              '{"valor": número ou null, "descricao": string ou null, "categoria": uma de "material","mao_de_obra","equipamento","taxas","outros" ou null, "fornecedor": string ou null, "etapa": string ou null}. ' +
              "O valor deve ser o TOTAL da nota (não itens individuais). A descrição deve resumir os principais itens (ex: 'cimento e areia'). " +
              "O fornecedor é o nome da loja/empresa emissora, geralmente no topo do documento. " +
              "Para 'etapa', escolha a mais provável entre: " + ETAPAS_CONHECIDAS.map((e) => `"${e}"`).join(", ") + ", ou null. " +
              "Se a imagem não parecer ser uma nota fiscal/recibo legível, retorne todos os campos null.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Leia esta nota fiscal e extraia os dados do gasto." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0,
      }),
    });
    if (!resp.ok) {
      console.error("Erro na API da OpenAI (imagem):", resp.status, await resp.text());
      return null;
    }
    const data = await resp.json();
    const conteudo = data.choices?.[0]?.message?.content;
    if (!conteudo) return null;
    return JSON.parse(conteudo);
  } catch (e) {
    console.error("Erro ao processar imagem:", e);
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

  const bodyRaw0 = (paramsObj["Body"] || "").trim();
  const fromRaw = paramsObj["From"] || "";
  const telefone = fromRaw.replace("whatsapp:", "").replace(/[^\d]/g, "");

  if (!telefone) {
    return twiml("Não foi possível identificar seu número.");
  }

  const bodyLowerInicial = bodyRaw0.toLowerCase();

  if (["sim", "confirmar", "confirmo", "s"].includes(bodyLowerInicial)) {
    const { data, error } = await supabaseAdmin.rpc("whatsapp_confirmar_pendente", { p_telefone: telefone });
    return twiml(error ? "Erro ao confirmar. Tente novamente." : data);
  }
  if (["cancelar", "cancel", "não", "nao", "n"].includes(bodyLowerInicial)) {
    await limparRascunho(telefone);
    const { data, error } = await supabaseAdmin.rpc("whatsapp_cancelar_pendente", { p_telefone: telefone });
    return twiml(error ? "Erro ao cancelar." : data);
  }

  if (["oi", "ola", "olá", "ajuda", "help", "menu"].includes(bodyLowerInicial)) {
    return twiml(
      "👋 Olá! Sou o assistente do Prumo.\n\n" +
      "Você pode:\n" +
      '• Me contar naturalmente: "gastei 200 reais em cimento"\n' +
      "• Mandar uma *foto da nota fiscal*\n" +
      "• Mandar um *áudio* contando o gasto\n" +
      "• Ou usar o formato:\n\n" +
      "valor: 200\n" +
      "desc: cimento\n" +
      "categoria: material\n" +
      "fornecedor: Casa do Construtor\n" +
      "etapa: fundação"
    );
  }

  // Processa mídia (foto ou áudio), se houver
  let bodyRaw = bodyRaw0;
  let extraidoDeImagem = null;
  const numMedia = parseInt(paramsObj["NumMedia"] || "0", 10);
  const mediaUrl = paramsObj["MediaUrl0"];
  const mediaType = paramsObj["MediaContentType0"] || "";

  if (numMedia > 0 && mediaUrl) {
    const midia = await baixarMidiaTwilio(mediaUrl);
    if (!midia) {
      return twiml("Não consegui baixar o arquivo enviado. Tente novamente.");
    }
    if (mediaType.startsWith("audio")) {
      const textoTranscrito = await transcreverAudio(midia.buffer, midia.contentType);
      if (!textoTranscrito) {
        return twiml("Não consegui entender o áudio. Pode tentar de novo, ou me contar em texto?");
      }
      bodyRaw = (bodyRaw ? bodyRaw + " " : "") + textoTranscrito;
    } else if (mediaType.startsWith("image")) {
      extraidoDeImagem = await extrairDeImagem(midia.buffer, midia.contentType);
      if (!extraidoDeImagem || (!extraidoDeImagem.valor && !extraidoDeImagem.descricao)) {
        return twiml("Não consegui ler os dados dessa imagem. Pode tentar uma foto mais nítida da nota, ou me contar o gasto em texto?");
      }
    }
  }

  // 1ª tentativa: formato estruturado (pulado se já veio de foto)
  let campos = extraidoDeImagem ? {} : parseCampos(bodyRaw);
  let valor = extraidoDeImagem ? extraidoDeImagem.valor : parseValor(campos["valor"]);
  let descricao = extraidoDeImagem ? extraidoDeImagem.descricao : (campos["desc"] || campos["descricao"]);
  let categoria = extraidoDeImagem ? extraidoDeImagem.categoria : campos["categoria"];
  let fornecedor = extraidoDeImagem ? extraidoDeImagem.fornecedor : campos["fornecedor"];
  let etapa = extraidoDeImagem ? extraidoDeImagem.etapa : campos["etapa"];
  let obraTexto = campos["obra"];

  // Rascunho de uma pergunta anterior do bot (ex: "qual obra?")
  const rascunho = await buscarRascunho(telefone);

  // Caso especial: já tínhamos valor+descrição, só faltava saber a obra.
  // Tratamos a mensagem inteira como possível nome de obra diretamente,
  // sem depender da IA genérica decidir se "isso parece um gasto".
  if (rascunho && rascunho.valor && rascunho.descricao && !valor && !descricao) {
    const obrasTeste = await obrasAtivasDoTelefone(telefone);
    const obraDireta = encontrarObraPorNome(obrasTeste, bodyRaw);
    if (obraDireta) {
      await limparRascunho(telefone);
      const { data, error } = await supabaseAdmin.rpc("whatsapp_criar_pendente", {
        p_telefone: telefone,
        p_valor: rascunho.valor,
        p_descricao: rascunho.descricao,
        p_categoria: rascunho.categoria || "outros",
        p_fornecedor: rascunho.fornecedor || null,
        p_etapa_busca: rascunho.etapa_busca || null,
        p_obra_busca: obraDireta.nome,
      });
      return twiml(error ? "Ocorreu um erro ao processar seu lançamento. Tente novamente." : data);
    }
  }

  // 2ª tentativa: texto livre via IA (pula se já veio de uma foto)
  if (!extraidoDeImagem && !valor && !descricao) {
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

  // Junta o que faltar com o rascunho
  if (rascunho) {
    valor = valor ?? rascunho.valor;
    descricao = descricao ?? rascunho.descricao;
    categoria = categoria ?? rascunho.categoria;
    fornecedor = fornecedor ?? rascunho.fornecedor;
    etapa = etapa ?? rascunho.etapa_busca;
    obraTexto = obraTexto ?? rascunho.obra_busca;
  }

  if (!valor || !descricao) {
    await supabaseAdmin.from("whatsapp_falhas").insert({ telefone, mensagem: bodyRaw0 || "(mídia sem legenda)" });
    return twiml(
      "Não entendi. Você pode:\n" +
      '• Descrever naturalmente (ex: "gastei 200 em cimento")\n' +
      "• Mandar uma foto da nota fiscal\n" +
      "• Mandar um áudio\n" +
      "• Ou usar o formato:\n\n" +
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
