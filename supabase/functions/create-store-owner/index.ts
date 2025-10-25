// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_PUBLISHABLE_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
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
      console.error("Auth error:", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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
      return new Response(JSON.stringify({ error: "Role check failed" }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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
      console.error("Missing required fields");
      return new Response(JSON.stringify({ error: "Missing required fields" }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 1) Create user (email confirmed) with metadata
    const { data: created, error: createUserErr } = await service.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
      user_metadata: { full_name: ownerName },
    });
    if (createUserErr || !created?.user) {
      console.error("Create user error:", createUserErr);
      return new Response(
        JSON.stringify({ error: createUserErr?.message || "Failed to create user" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
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
      console.error("Store insert error:", storeErr);
      // Best-effort cleanup: remove user if store insert fails
      try { await service.auth.admin.deleteUser(ownerId); } catch (_) {}
      return new Response(
        JSON.stringify({ error: storeErr.message || "Failed to create store" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 3) Assign role
    const { error: roleAssignErr } = await service.from("user_roles").insert({
      user_id: ownerId,
      role: "store_owner",
    });
    if (roleAssignErr) {
      console.error("Role assignment error:", roleAssignErr);
      return new Response(
        JSON.stringify({ error: roleAssignErr.message || "Failed to assign role" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("Store created successfully for:", ownerEmail);
    return new Response(
      JSON.stringify({ success: true, owner_id: ownerId }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (e: any) {
    console.error("Unexpected error:", e);
    return new Response(
      JSON.stringify({ error: e?.message || "Unexpected error" }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});