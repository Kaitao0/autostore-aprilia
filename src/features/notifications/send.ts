import "server-only";

/**
 * Transactional email via Resend — SERVER ONLY.
 * When RESEND_API_KEY (or the sender address) is missing the caller gets
 * an explicit "not_configured" outcome: data is already saved, nothing is
 * simulated. Every attempt is logged in email_notifications.
 */

export type NotificationOutcome = "sent" | "not_configured" | "error";

export type NotificationInput = {
  subject: string;
  /** Simple pre-rendered text body (no marketing layout needed). */
  text: string;
  type: "lead" | "trade_in";
  relatedLeadId?: string | null;
};

function isConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

async function logAttempt(entry: {
  to_email: string;
  subject: string;
  type: string;
  related_lead_id?: string | null;
  status: string;
  provider_id?: string | null;
  error?: string | null;
}): Promise<void> {
  // Logging requires the service role; skip silently when absent.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    await createAdminClient().from("email_notifications").insert(entry);
  } catch {
    // Never let logging break the user flow.
  }
}

export async function sendStaffNotification(
  input: NotificationInput,
): Promise<NotificationOutcome> {
  // Recipient: the operational business email from the database.
  let toEmail: string | null = null;
  try {
    const { getBusinessInformation, isPlaceholder } = await import(
      "@/features/site/queries"
    );
    const business = await getBusinessInformation();
    toEmail =
      business.email && !isPlaceholder(business.email) ? business.email : null;
  } catch {
    toEmail = null;
  }

  if (!isConfigured() || !toEmail) {
    await logAttempt({
      to_email: toEmail ?? "(nessun destinatario configurato)",
      subject: input.subject,
      type: input.type,
      related_lead_id: input.relatedLeadId ?? null,
      status: "not_configured",
    });
    return "not_configured";
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL as string,
      to: toEmail,
      subject: input.subject,
      text: input.text,
    });
    if (error) throw new Error(error.message);
    await logAttempt({
      to_email: toEmail,
      subject: input.subject,
      type: input.type,
      related_lead_id: input.relatedLeadId ?? null,
      status: "sent",
      provider_id: data?.id ?? null,
    });
    return "sent";
  } catch (e) {
    await logAttempt({
      to_email: toEmail,
      subject: input.subject,
      type: input.type,
      related_lead_id: input.relatedLeadId ?? null,
      status: "error",
      error: e instanceof Error ? e.message : String(e),
    });
    return "error";
  }
}
