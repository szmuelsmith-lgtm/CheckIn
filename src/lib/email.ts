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
}: {
  to: string;
}): Promise<void> {
  const roleLabel = 'psychiatrist';
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

// Sent to clinical staff (support/admin/psychiatrist) when the silence sweep
// flags one or more athletes who went quiet after a concerning check-in or
// after a long absence. FERPA-safe: no athlete identity, no scores — only the
// team name, a count, and a link to the authenticated dashboard.
export async function sendSilenceDigestEmail({
  to,
  teamName,
  count,
}: {
  to: string;
  teamName: string;
  count: number;
}) {
  try {
    const noun = count === 1 ? "an athlete" : `${count} athletes`;
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Check-In: athlete(s) may need a proactive reach-out",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
          <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #92400E; margin: 0 0 8px 0; font-size: 18px;">Quiet check-in flag</h2>
            <p style="color: #78350F; margin: 0; font-size: 14px;">
              On <strong>${teamName}</strong>, ${noun} stopped checking in after a period of concern, or has been silent for an extended time. Consider a proactive reach-out.
            </p>
          </div>
          <p style="color: #64748B; font-size: 14px; line-height: 1.6;">
            For privacy, no athlete names or wellness details are included in this email. Please log in to the Check-In dashboard to review and take appropriate action.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://app.athleteanchor.com"}/admin/alerts"
             style="display: inline-block; background: #0F172A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 16px;">
            Review in Dashboard
          </a>
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 32px 0 16px 0;" />
          <p style="color: #94A3B8; font-size: 12px;">
            Check-In by Athlete Anchor — Privacy-first athlete wellness.
          </p>
        </div>
      `,
    });
    if (error) {
      console.error("Failed to send silence digest email:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: err };
  }
}

// Sent to org admins when a red alert has gone unacknowledged past the SLA
// window. FERPA-safe: no athlete identity, no scores — only the team name and
// a link to the authenticated dashboard.
export async function sendEscalationEmail({
  to,
  teamName,
  hoursOpen,
}: {
  to: string;
  teamName: string;
  hoursOpen: number;
}) {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "🔴 Escalation: an urgent alert is still unaddressed",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
          <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #991B1B; margin: 0 0 8px 0; font-size: 18px;">Unaddressed urgent alert</h2>
            <p style="color: #7F1D1D; margin: 0; font-size: 14px;">
              An urgent alert on <strong>${teamName}</strong> has been open for about ${hoursOpen} hours without acknowledgement. It is being escalated to you for immediate attention.
            </p>
          </div>
          <p style="color: #64748B; font-size: 14px; line-height: 1.6;">
            For privacy, athlete details are not included in this email. Please log in to the Check-In dashboard to review and respond.
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
      console.error("Failed to send escalation email:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: err };
  }
}
