import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
  }
  return _resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL || "Check-In <notifications@athleteanchor.com>";

export async function sendRedAlertEmail({
  to,
  teamName,
}: {
  to: string;
  teamName: string;
  alertId?: string;
}) {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "🔴 Urgent: Athlete flagged for follow-up",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
          <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #991B1B; margin: 0 0 8px 0; font-size: 18px;">Urgent Follow-Up Needed</h2>
            <p style="color: #7F1D1D; margin: 0; font-size: 14px;">
              An athlete on <strong>${teamName}</strong> has been flagged for urgent follow-up.
            </p>
          </div>
          <p style="color: #64748B; font-size: 14px; line-height: 1.6;">
            For privacy, athlete details are not included in this email. Please log in to the Check-In dashboard to review the alert and take appropriate action.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://app.athleteanchor.com"}/admin/alerts"
             style="display: inline-block; background: #0F172A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 16px;">
            Review Alert
          </a>
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 32px 0 16px 0;" />
          <p style="color: #94A3B8; font-size: 12px;">
            Check-In by Athlete Anchor — Privacy-first athlete wellness.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send RED alert email:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: err };
  }
}

export async function sendSupportRequestEmail({
  to,
  scope,
}: {
  to: string;
  scope: 'psychiatrist' | 'trusted_adult';
}): Promise<void> {
  const roleLabel = scope === 'psychiatrist' ? 'counselor' : 'trusted adult';
  await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? 'Check-In <notifications@athleteanchor.com>',
    to,
    subject: 'An athlete has requested support',
    text: `An athlete in your program has requested to connect with you as their ${roleLabel} through Check-In.\n\nPlease log in to see their shared check-in when you are available.\n\nNo scores or personal details are included in this email to protect athlete privacy.`,
  });
}

export async function sendWeeklyReminderEmail({
  to,
  athleteName,
}: {
  to: string;
  athleteName: string;
}) {
  try {
    const firstName = athleteName.split(" ")[0] || "there";

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Time for your weekly check-in",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #0F172A; margin: 0 0 8px 0; font-size: 20px;">Hey ${firstName} 👋</h2>
          <p style="color: #64748B; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            It's time for your weekly check-in. It only takes about 2 minutes, and it helps your program support you better.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://app.athleteanchor.com"}/athlete/checkin"
             style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
            Start Check-In
          </a>
          <p style="color: #94A3B8; font-size: 13px; margin-top: 24px;">
            Your responses are private by default. Only you can see your notes and journal entries.
          </p>
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 32px 0 16px 0;" />
          <p style="color: #94A3B8; font-size: 12px;">
            Check-In by Athlete Anchor — Privacy-first athlete wellness.<br/>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://app.athleteanchor.com"}/athlete/preferences" style="color: #94A3B8;">Manage email preferences</a>
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send reminder email:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: err };
  }
}
