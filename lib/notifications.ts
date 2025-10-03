import { getAdminSupabaseClient } from "./supabase";
import { lostToOwner, foundToOwner, reportedFoundToFinder, reportedFoundToOwner, type CommonCtx, type Owner, type Pet, type Finder } from "../emails/templates";
import nodemailer from "nodemailer";

type NotifyResult = { ok: boolean; error?: string };

// Utility function to mask email for privacy
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return email;
  const masked = local[0] + '*'.repeat(Math.max(1, local.length - 2)) + local[local.length - 1];
  return `${masked}@${domain}`;
}

// A场景：主人设为丢失
export async function notifyOwnerOnLost(petId: string, opts?: { last_seen_location?: string }): Promise<{ email?: NotifyResult; sms?: NotifyResult }> {
  try {
    const admin = getAdminSupabaseClient();
    const [{ data: pet }, { data: contactPrefs }] = await Promise.all([
      admin.from("pets").select("id,name,tag_code,owner_user_id").eq("id", petId).maybeSingle(),
      admin.from("contact_prefs").select("show_email,email,show_phone,phone,show_sms").eq("pet_id", petId).maybeSingle(),
    ]);

    if (!pet) {
      return { email: { ok: false, error: "Pet not found" }, sms: { ok: false, error: "Pet not found" } };
    }

    // Load owner info
    let ownerEmail: string | undefined;
    let ownerName: string = "Pet Owner";
    try {
      const { data: ownerUser } = await admin.auth.admin.getUserById(pet.owner_user_id);
      ownerEmail = ownerUser?.user?.email || undefined;
      ownerName = ownerUser?.user?.user_metadata?.full_name || ownerEmail?.split('@')[0] || "Pet Owner";
    } catch {}

    const ctx: CommonCtx = {
      app_name: process.env.NEXT_PUBLIC_APP_NAME || 'EGGPLANT.FISH',
      timestamp: new Date().toISOString()
    };

    const petData: Pet = {
      name: pet.name || "Your pet",
      last_seen_location: opts?.last_seen_location
    };

    const ownerData: Owner = {
      name: ownerName,
      email: ownerEmail || ""
    };

    const template = lostToOwner(petData, ownerData, ctx);

    const shouldEmail = !!contactPrefs?.show_email && !!(contactPrefs?.email || ownerEmail);
    const shouldSms = !!contactPrefs?.show_sms && !!contactPrefs?.phone;

    const [emailResult, smsResult] = await Promise.all([
      shouldEmail
        ? sendEmail({
            to: contactPrefs?.email || ownerEmail!,
            subject: template.subject,
            content: template.text,
          })
        : Promise.resolve<NotifyResult | undefined>(undefined),
      shouldSms
        ? sendSms({
            to: contactPrefs!.phone!,
            message: `${template.subject}\n\n${template.text.substring(0, 140)}...`,
          })
        : Promise.resolve<NotifyResult | undefined>(undefined),
    ]);

    return { email: emailResult, sms: smsResult };
  } catch (e) {
    return { email: { ok: false, error: (e as Error).message }, sms: { ok: false, error: (e as Error).message } };
  }
}

// B场景：主人设为找到
export async function notifyOwnerOnFound(petId: string): Promise<{ email?: NotifyResult; sms?: NotifyResult }> {
  try {
    const admin = getAdminSupabaseClient();
    const [{ data: pet }, { data: contactPrefs }] = await Promise.all([
      admin.from("pets").select("id,name,tag_code,owner_user_id").eq("id", petId).maybeSingle(),
      admin.from("contact_prefs").select("show_email,email,show_phone,phone,show_sms").eq("pet_id", petId).maybeSingle(),
    ]);

    if (!pet) {
      return { email: { ok: false, error: "Pet not found" }, sms: { ok: false, error: "Pet not found" } };
    }

    // Load owner info
    let ownerEmail: string | undefined;
    let ownerName: string = "Pet Owner";
    try {
      const { data: ownerUser } = await admin.auth.admin.getUserById(pet.owner_user_id);
      ownerEmail = ownerUser?.user?.email || undefined;
      ownerName = ownerUser?.user?.user_metadata?.full_name || ownerEmail?.split('@')[0] || "Pet Owner";
    } catch {}

    const ctx: CommonCtx = {
      app_name: process.env.NEXT_PUBLIC_APP_NAME || 'EGGPLANT.FISH',
      timestamp: new Date().toISOString()
    };

    const petData: Pet = {
      name: pet.name || "Your pet"
    };

    const ownerData: Owner = {
      name: ownerName,
      email: ownerEmail || ""
    };

    const template = foundToOwner(petData, ownerData, ctx);

    const shouldEmail = !!contactPrefs?.show_email && !!(contactPrefs?.email || ownerEmail);
    const shouldSms = !!contactPrefs?.show_sms && !!contactPrefs?.phone;

    const [emailResult, smsResult] = await Promise.all([
      shouldEmail
        ? sendEmail({
            to: contactPrefs?.email || ownerEmail!,
            subject: template.subject,
            content: template.text,
          })
        : Promise.resolve<NotifyResult | undefined>(undefined),
      shouldSms
        ? sendSms({
            to: contactPrefs!.phone!,
            message: `${template.subject}\n\n${template.text.substring(0, 140)}...`,
          })
        : Promise.resolve<NotifyResult | undefined>(undefined),
    ]);

    return { email: emailResult, sms: smsResult };
  } catch (e) {
    return { email: { ok: false, error: (e as Error).message }, sms: { ok: false, error: (e as Error).message } };
  }
}

// C1/C2场景：别人报告找到
export async function notifyOnFoundReport(
  petId: string, 
  finder: { name?: string; email?: string }, 
  foundLocation?: string
): Promise<{ finderEmail?: NotifyResult; ownerEmail?: NotifyResult; ownerSms?: NotifyResult }> {
  try {
    const admin = getAdminSupabaseClient();
    const [{ data: pet }, { data: contactPrefs }] = await Promise.all([
      admin.from("pets").select("id,name,tag_code,owner_user_id").eq("id", petId).maybeSingle(),
      admin.from("contact_prefs").select("show_email,email,show_phone,phone,show_sms").eq("pet_id", petId).maybeSingle(),
    ]);

    if (!pet) {
      return { finderEmail: { ok: false, error: "Pet not found" }, ownerEmail: { ok: false, error: "Pet not found" } };
    }

    // Load owner info
    let ownerEmail: string | undefined;
    let ownerName: string = "Pet Owner";
    try {
      const { data: ownerUser } = await admin.auth.admin.getUserById(pet.owner_user_id);
      ownerEmail = ownerUser?.user?.email || undefined;
      ownerName = ownerUser?.user?.user_metadata?.full_name || ownerEmail?.split('@')[0] || "Pet Owner";
    } catch {}

    const ctx: CommonCtx = {
      app_name: process.env.NEXT_PUBLIC_APP_NAME || 'EGGPLANT.FISH',
      timestamp: new Date().toISOString()
    };

    const petData: Pet = {
      name: pet.name || "Pet"
    };

    const ownerData: Owner = {
      name: ownerName,
      email: ownerEmail || ""
    };

    const finderData: Finder = {
      name: finder.name,
      email: finder.email
    };

    // C1: Email to finder
    const c1Template = reportedFoundToFinder(petData, finderData, ctx);
    
    // C2: Email to owner with masked contact
    const finderMaskedContact = finder.email ? maskEmail(finder.email) : (finder.name || "Anonymous reporter");
    const c2Template = reportedFoundToOwner(petData, ownerData, finderMaskedContact, foundLocation, ctx);

    const [finderEmailResult, ownerEmailResult, ownerSmsResult] = await Promise.all([
      // Send to finder if email provided
      finder.email
        ? sendEmail({
            to: finder.email,
            subject: c1Template.subject,
            content: c1Template.text,
          })
        : Promise.resolve<NotifyResult | undefined>(undefined),
      // Send to owner via email
      (!!contactPrefs?.show_email && !!(contactPrefs?.email || ownerEmail))
        ? sendEmail({
            to: contactPrefs?.email || ownerEmail!,
            subject: c2Template.subject,
            content: c2Template.text,
          })
        : Promise.resolve<NotifyResult | undefined>(undefined),
      // Send to owner via SMS
      (!!contactPrefs?.show_sms && !!contactPrefs?.phone)
        ? sendSms({
            to: contactPrefs.phone,
            message: `${c2Template.subject}\n\n${c2Template.text.substring(0, 140)}...`,
          })
        : Promise.resolve<NotifyResult | undefined>(undefined),
    ]);

    return { finderEmail: finderEmailResult, ownerEmail: ownerEmailResult, ownerSms: ownerSmsResult };
  } catch (e) {
    const error = (e as Error).message;
    return { finderEmail: { ok: false, error }, ownerEmail: { ok: false, error }, ownerSms: { ok: false, error } };
  }
}

// 新增场景：给报告丢失的人发确认邮件 (C1)
export async function notifyReporterOnLostReport(
  petId: string,
  reporter: { name?: string; email?: string },
  lastSeenLocation?: string
): Promise<{ email?: NotifyResult }> {
  try {
    if (!reporter.email) {
      return { email: { ok: true } }; // No email to send to
    }

    const admin = getAdminSupabaseClient();
    const { data: pet } = await admin
      .from("pets")
      .select("id,name,tag_code,owner_user_id")
      .eq("id", petId)
      .maybeSingle();

    if (!pet) {
      return { email: { ok: false, error: "Pet not found" } };
    }

    const ctx: CommonCtx = {
      app_name: process.env.NEXT_PUBLIC_APP_NAME || 'EGGPLANT.FISH',
      timestamp: new Date().toISOString()
    };

    const petData: Pet = {
      name: pet.name || "Pet"
    };

    const finderData: Finder = {
      name: reporter.name,
      email: reporter.email
    };

    // Use C1 template but modify for "lost report" scenario
    const template = reportedFoundToFinder(petData, finderData, ctx);
    const modifiedTemplate = {
      subject: template.subject.replace("You have reported finding", "You have reported that this pet is lost:"),
      text: template.text
        .replace("Thank you for your help! You have reported that you found the pet", "Thank you for your help! You have reported that the pet")
        .replace("is possibly lost. We have notified the owner", "may be lost. We have notified the owner")
    };

    const emailResult = await sendEmail({
      to: reporter.email,
      subject: modifiedTemplate.subject,
      content: modifiedTemplate.text,
    });

    return { email: emailResult };
  } catch (e) {
    return { email: { ok: false, error: (e as Error).message } };
  }
}

// 新增场景：别人报告丢失
export async function notifyOwnerOnReportedLost(
  petId: string, 
  reporter: { name?: string; email?: string }, 
  lastSeenLocation?: string
): Promise<{ email?: NotifyResult; sms?: NotifyResult }> {
  try {
    const admin = getAdminSupabaseClient();
    const [{ data: pet }, { data: contactPrefs }] = await Promise.all([
      admin.from("pets").select("id,name,tag_code,owner_user_id").eq("id", petId).maybeSingle(),
      admin.from("contact_prefs").select("show_email,email,show_phone,phone,show_sms").eq("pet_id", petId).maybeSingle(),
    ]);

    if (!pet) {
      return { email: { ok: false, error: "Pet not found" }, sms: { ok: false, error: "Pet not found" } };
    }

    // Load owner info
    let ownerEmail: string | undefined;
    let ownerName: string = "Pet Owner";
    try {
      const { data: ownerUser } = await admin.auth.admin.getUserById(pet.owner_user_id);
      ownerEmail = ownerUser?.user?.email || undefined;
      ownerName = ownerUser?.user?.user_metadata?.full_name || ownerEmail?.split('@')[0] || "Pet Owner";
    } catch {}

    const ctx: CommonCtx = {
      app_name: process.env.NEXT_PUBLIC_APP_NAME || 'EGGPLANT.FISH',
      timestamp: new Date().toISOString()
    };

    const petData: Pet = {
      name: pet.name || "Your pet",
      last_seen_location: lastSeenLocation
    };

    const ownerData: Owner = {
      name: ownerName,
      email: ownerEmail || ""
    };

    // Reuse C2 template but modify subject/content for "reported lost"
    const reporterMaskedContact = reporter.email ? maskEmail(reporter.email) : (reporter.name || "Anonymous reporter");
    const template = reportedFoundToOwner(petData, ownerData, reporterMaskedContact, lastSeenLocation, ctx);
    
    // Modify subject and content for "lost" scenario
    const modifiedTemplate = {
      subject: template.subject.replace("Someone reported finding", "Someone reported that your pet is lost:"),
      text: template.text
        .replace("We received a lead: someone has reported possibly finding", "Alert: Someone has reported that your pet is possibly lost")
        .replace("Please contact the reporter", "Please verify this report and take action as needed")
        .replace("Found location:", "Last seen location:")
    };

    const shouldEmail = !!contactPrefs?.show_email && !!(contactPrefs?.email || ownerEmail);
    const shouldSms = !!contactPrefs?.show_sms && !!contactPrefs?.phone;

    const [emailResult, smsResult] = await Promise.all([
      shouldEmail
        ? sendEmail({
            to: contactPrefs?.email || ownerEmail!,
            subject: modifiedTemplate.subject,
            content: modifiedTemplate.text,
          })
        : Promise.resolve<NotifyResult | undefined>(undefined),
      shouldSms
        ? sendSms({
            to: contactPrefs!.phone!,
            message: `${modifiedTemplate.subject}\n\n${modifiedTemplate.text.substring(0, 140)}...`,
          })
        : Promise.resolve<NotifyResult | undefined>(undefined),
    ]);

    return { email: emailResult, sms: smsResult };
  } catch (e) {
    return { email: { ok: false, error: (e as Error).message }, sms: { ok: false, error: (e as Error).message } };
  }
}

// Create Gmail SMTP transporter
function createGmailTransporter() {
  const user = process.env.GMAIL_SMTP_USER;
  const pass = process.env.GMAIL_SMTP_PASSWORD;
  
  if (!user || !pass) {
    throw new Error("Gmail SMTP credentials missing");
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass
    }
  });
}

async function sendEmail(params: { to: string; subject: string; content: string }): Promise<NotifyResult> {
  const user = process.env.GMAIL_SMTP_USER;
  const pass = process.env.GMAIL_SMTP_PASSWORD;
  const from = process.env.GMAIL_SMTP_FROM || user;
  
  if (!user || !pass) {
    console.info("[notify] Gmail SMTP credentials missing; skipping email");
    return { ok: true };
  }

  try {
    const transporter = createGmailTransporter();
    
    await transporter.sendMail({
      from: from,
      to: params.to,
      subject: params.subject,
      text: params.content,
    });
    
    console.info(`[notify] Email sent successfully to ${params.to}`);
    return { ok: true };
  } catch (e) {
    console.error(`[notify] Failed to send email to ${params.to}:`, e);
    return { ok: false, error: (e as Error).message };
  }
}

async function sendSms(params: { to: string; message: string }): Promise<NotifyResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    console.info("[notify] Twilio env missing; skipping SMS");
    return { ok: true };
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`;
  const body = new URLSearchParams({ To: params.to, From: from, Body: params.message });
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      },
      body: body.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}


