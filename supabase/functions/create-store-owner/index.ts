// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_PUBLISHABLE_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    // Get caller user (admin) from token
    const authClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const callerId = userData.user.id;

    // Service client for privileged operations
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify caller is admin
    const { data: isAdmin, error: roleErr } = await service.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (roleErr) {
      console.error("has_role error", roleErr);
      return new Response(JSON.stringify({ error: "Role check failed" }), { status: 500 });
    }
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const body = await req.json();
    const {
      storeName,
      ownerName,
      ownerEmail,
      ownerPassword,
      phone,
      address,
      gstNumber,
    } = body as {
      storeName: string;
      ownerName: string;
      ownerEmail: string;
      ownerPassword: string;
      phone?: string;
      address?: string;
      gstNumber?: string;
    };

    if (!storeName || !ownerName || !ownerEmail || !ownerPassword) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // 1) Create user (email confirmed) with metadata
    const { data: created, error: createUserErr } = await service.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
      user_metadata: { full_name: ownerName },
    });
    if (createUserErr || !created?.user) {
      return new Response(
        JSON.stringify({ error: createUserErr?.message || "Failed to create user" }),
        { status: 400 }
      );
    }

    const ownerId = created.user.id;

    // 2) Create store
    const { error: storeErr } = await service.from("stores").insert({
      name: storeName,
      owner_id: ownerId,
      phone: phone || null,
      address: address || null,
      gst_number: gstNumber || null,
    });
    if (storeErr) {
      // Best-effort cleanup: remove user if store insert fails
      try { await service.auth.admin.deleteUser(ownerId); } catch (_) {}
      return new Response(
        JSON.stringify({ error: storeErr.message || "Failed to create store" }),
        { status: 400 }
      );
    }

    // 3) Assign role
    const { error: roleAssignErr } = await service.from("user_roles").insert({
      user_id: ownerId,
      role: "store_owner",
    });
    if (roleAssignErr) {
      return new Response(
        JSON.stringify({ error: roleAssignErr.message || "Failed to assign role" }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, owner_id: ownerId }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), { status: 500 });
  }
});