"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { COLORS } from "../lib/theme";

export default function EditarPerfilModal({ userId, perfilAtual, onClose, onSaved }) {
  const [nome, setNome] = useState(perfilAtual?.nome || "");
  const [telefone, setTelefone] = useState(perfilAtual?.telefone || "");
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(perfilAtual?.foto_url || null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const escolherFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const salvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);

    let fotoUrl = perfilAtual?.foto_url || null;
    if (foto) {
      const ext = foto.name.split(".").pop();
      const path = `${userId}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, foto, { upsert: true });
      if (uploadError) {
        setErro("Não foi possível enviar a foto: " + uploadError.message);
        setSalvando(false);
        return;
      }
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      fotoUrl = pub.publicUrl + "?t=" + Date.now(); // evita cache da foto antiga
    }

    const telefoneDigitos = telefone.replace(/[^\d]/g, "");
    const { error } = await supabase
      .from("perfis")
      .upsert({ user_id: userId, nome: nome || null, telefone: telefoneDigitos || null, foto_url: fotoUrl }, { onConflict: "user_id" });

    setSalvando(false);
    if (error) {
      if (error.message.includes("duplicate")) {
        setErro("Esse número de WhatsApp já está vinculado a outra conta.");
      } else {
        setErro("Não foi possível salvar: " + error.message);
      }
      return;
    }

    onSaved({ nome, telefone: telefoneDigitos, foto_url: fotoUrl });
  };

  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13.5, color: COLORS.text };
  const labelStyle = { fontSize: 11.5, fontWeight: 600, color: COLORS.textSoft, marginBottom: 5, display: "block" };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(23,26,28,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={salvar}
        style={{ background: COLORS.paper, borderRadius: 18, padding: 28, width: "100%", maxWidth: 380, boxShadow: "0 24px 64px -12px rgba(24,17,35,0.28)" }}
      >
        <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.text, marginBottom: 20 }}>Editar perfil</div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <label style={{ cursor: "pointer", textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", background: COLORS.bg, border: `1px dashed ${COLORS.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", margin: "0 auto"
            }}>
              {fotoPreview ? (
                <img src={fotoPreview} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 11, color: COLORS.textSoft }}>Foto</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: COLORS.action, marginTop: 6, fontWeight: 600 }}>Trocar foto</div>
            <input type="file" accept="image/*" onChange={escolherFoto} style={{ display: "none" }} />
          </label>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Nome</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>WhatsApp</label>
          <input placeholder="Ex: 19991502305 (com DDD)" value={telefone} onChange={(e) => setTelefone(e.target.value)} style={inputStyle} />
        </div>

        {erro && <div style={{ fontSize: 12.5, color: COLORS.bad, marginBottom: 14 }}>{erro}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "none", color: COLORS.textSoft, fontWeight: 600, cursor: "pointer" }}>
            Cancelar
          </button>
          <button type="submit" disabled={salvando} style={{ flex: 2, padding: 12, borderRadius: 8, border: "none", background: COLORS.action, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
