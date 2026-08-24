"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { COLORS } from "../../lib/theme";

export default function CadastroPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);
  const [conviteAceito, setConviteAceito] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const escolherFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const cadastrar = async (e) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    if (error) {
      setCarregando(false);
      setErro(error.message.includes("already") ? "Já existe uma conta com esse e-mail." : "Não foi possível criar a conta.");
      return;
    }

    const userId = data.user?.id;
    let fotoUrl = null;
    if (userId && foto) {
      const ext = foto.name.split(".").pop();
      const path = `${userId}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, foto, { upsert: true });
      if (!uploadError) {
        const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
        fotoUrl = pub.publicUrl;
      }
    }

    if (userId) {
      await supabase.from("perfis").insert({ user_id: userId, nome: nome || null, foto_url: fotoUrl });
    }

    // Se havia um convite pendente para este e-mail, vincula automaticamente à empresa
    if (data.session) {
      const { data: resultadoConvite } = await supabase.rpc("aceitar_convite_pendente");
      if (resultadoConvite?.includes("aceito")) {
        setConviteAceito(true);
      }
    }

    setCarregando(false);
    setSucesso(true);
  };

  if (sucesso) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.bg, fontFamily: "Inter, sans-serif", padding: 16 }}>
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 32, maxWidth: 380, textAlign: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.text, marginBottom: 8 }}>Conta criada!</div>
          {conviteAceito ? (
            <div style={{ fontSize: 13.5, color: COLORS.textSoft, lineHeight: 1.5 }}>
              Você já foi adicionado à equipe automaticamente. Pode entrar agora mesmo.
            </div>
          ) : (
            <div style={{ fontSize: 13.5, color: COLORS.textSoft, lineHeight: 1.5 }}>
              Agora peça para quem já usa o Prumo na sua empresa te adicionar na tela de Equipe usando o e-mail <strong>{email}</strong>. Depois disso você já pode entrar normalmente.
            </div>
          )}
          <a href="/login" style={{ display: "inline-block", marginTop: 20, color: COLORS.action, fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}>Ir para o login →</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.bg, fontFamily: "Inter, sans-serif" }}>
      <form onSubmit={cadastrar} style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 32, width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <svg width="22" height="24" viewBox="0 0 24 26" fill="none">
            <line x1="12" y1="2" x2="12" y2="11" stroke={COLORS.text} strokeWidth="2" />
            <path d="M12 11L17 20H7L12 11Z" fill={COLORS.action} />
          </svg>
          <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.text }}>Prumo</div>
        </div>
        <div style={{ fontSize: 13, color: COLORS.textSoft, marginBottom: 20 }}>Crie sua conta</div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <label style={{ cursor: "pointer", textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", background: COLORS.bg, border: `1px dashed ${COLORS.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", margin: "0 auto"
            }}>
              {fotoPreview ? (
                <img src={fotoPreview} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 11, color: COLORS.textSoft }}>Foto</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: COLORS.textSoft, marginTop: 6 }}>Opcional</div>
            <input type="file" accept="image/*" onChange={escolherFoto} style={{ display: "none" }} />
          </label>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.textSoft, marginBottom: 5, display: "block" }}>Nome</label>
          <input required value={nome} onChange={(e) => setNome(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13.5 }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.textSoft, marginBottom: 5, display: "block" }}>E-mail</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13.5 }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.textSoft, marginBottom: 5, display: "block" }}>Senha</label>
          <input required type="password" minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13.5 }} />
        </div>

        {erro && <div style={{ fontSize: 12.5, color: COLORS.bad, marginBottom: 14 }}>{erro}</div>}

        <button type="submit" disabled={carregando} style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", background: COLORS.action, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
          {carregando ? "Criando…" : "Criar conta"}
        </button>
        <a href="/login" style={{ display: "block", textAlign: "center", marginTop: 14, fontSize: 12.5, color: COLORS.textSoft, textDecoration: "none" }}>Já tenho conta</a>
      </form>
    </div>
  );
}
