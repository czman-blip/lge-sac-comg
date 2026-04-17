import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
};

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1. Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");

    const authClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Authorize: must be editor/admin
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: canEdit, error: roleError } = await adminClient.rpc("can_edit", {
      _user_id: userData.user.id,
    });
    if (roleError || !canEdit) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "DELETE") {
      const { path } = await req.json();
      if (!path || typeof path !== "string") {
        return new Response(JSON.stringify({ error: "Missing path" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Prevent path traversal
      if (path.includes("..") || path.startsWith("/")) {
        return new Response(JSON.stringify({ error: "Invalid path" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await adminClient.storage
        .from("reference-images")
        .remove([path]);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST: upload image
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const fileName = formData.get("fileName") as string;

    if (!file || !fileName) {
      return new Response(JSON.stringify({ error: "Missing file or fileName" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate MIME type
    const contentType = file.type || "image/jpeg";
    if (!ALLOWED_MIME.includes(contentType)) {
      return new Response(JSON.stringify({ error: "Unsupported file type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      return new Response(JSON.stringify({ error: "File too large" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize filename: remove non-ASCII chars, keep extension
    const ext = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const safeName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50) || 'image';
    const filePath = `${Date.now()}-${safeName}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await adminClient.storage
      .from("reference-images")
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = adminClient.storage
      .from("reference-images")
      .getPublicUrl(filePath);

    return new Response(
      JSON.stringify({ url: urlData.publicUrl, path: filePath }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({ error: "Upload failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
