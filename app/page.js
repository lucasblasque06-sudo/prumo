"use client";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function RootPage() {
  useEffect(() => {
    async function decidir() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }
      const { data: admin } = await supabase.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle();
      window.location.href = admin ? "/admin" : "/obras";
    }
    decidir();
  }, []);
  return null;
}
