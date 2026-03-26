import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = Deno.env.get("RESEND_FROM") ?? "support@eggplantfish.net";

serve(async (req: Request) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.error("[send-business-email] RESEND_API_KEY not set");
    return new Response(JSON.stringify({ error: "Email service not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { to: string; subject: string; text: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { to, subject, text } = body;
  if (!to || !subject || !text) {
    return new Response(JSON.stringify({ error: "Missing required fields: to, subject, text" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to, subject, text }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[send-business-email] Resend error (${res.status}):`, err);
      return new Response(JSON.stringify({ ok: false, error: err }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.info(`[send-business-email] Sent to ${to}`);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[send-business-email] Unexpected error:", e);
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
