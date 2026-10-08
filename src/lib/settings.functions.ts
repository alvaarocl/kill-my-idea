import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LEGAL_NAME_KEY = "legal_name";
const DEFAULT_LEGAL_NAME = "[LEGAL_NAME]";

export const getLegalName = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", LEGAL_NAME_KEY)
    .maybeSingle();
  if (error) {
    console.error("getLegalName error:", error);
    return { legalName: DEFAULT_LEGAL_NAME };
  }
  return { legalName: data?.value ?? DEFAULT_LEGAL_NAME };
});

export const setLegalName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ legalName: z.string().min(1).max(255) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isAdminData, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleError || !isAdminData) {
      throw new Error("Forbidden");
    }

    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert(
        { key: "legal_name", value: data.legalName.trim(), updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    if (error) throw new Error(error.message);

    return { legalName: data.legalName.trim() };
  });
