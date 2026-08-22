import { createClient } from "@supabase/supabase-js";

// As variáveis vêm do ambiente da Vercel (configuradas no deploy),
// nunca ficam hardcoded no código-fonte.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ID fixo da obra do seu pai — quando isso virar multi-obra (Rocha&Blasque),
// isso deixa de ser uma constante e passa a vir da URL (ex: /obra/[id]).
export const OBRA_ID = "a666b510-a759-416d-8a35-9913f053900d";
