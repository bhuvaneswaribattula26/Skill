// src/lib/email.ts — Email via Resend with console fallback for dev
import { config } from '../config';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendViaResend(opts: EmailOptions): Promise<void> {
  const { Resend } = await import('resend');
  const resend = new Resend(config.resend.apiKey);
  const { error } = await resend.emails.send({
    from: config.resend.from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

function sendToConsole(opts: EmailOptions): void {
  console.log('\n━━━━━━━━━━ [EMAIL — DEV CONSOLE] ━━━━━━━━━━');
  console.log(`TO:      ${opts.to}`);
  console.log(`SUBJECT: ${opts.subject}`);
  console.log(`BODY:\n${opts.html.replace(/<[^>]+>/g, '')}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

export async function sendEmail(opts: EmailOptions): Promise<void> {
  if (config.resend.apiKey) {
    await sendViaResend(opts);
  } else {
    sendToConsole(opts);
  }
}

export function verificationEmailHtml(name: string, verifyUrl: string): string {
  return `
<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;background:#f9f9f9">
<div style="max-width:480px;margin:auto;background:#fff;border-radius:12px;padding:32px">
  <h2 style="color:#6d28d9">✦ SkillSwap Campus</h2>
  <h3>Verify your email, ${name}!</h3>
  <p style="color:#666">Click the button below to verify your college email and start swapping skills.</p>
  <a href="${verifyUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
    Verify my email
  </a>
  <p style="color:#999;font-size:12px;margin-top:24px">Link expires in 24 hours. If you didn't sign up, ignore this email.</p>
</div></body></html>`;
}

export function sessionReminderHtml(name: string, sessionTitle: string, scheduledAt: Date): string {
  return `
<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;background:#f9f9f9">
<div style="max-width:480px;margin:auto;background:#fff;border-radius:12px;padding:32px">
  <h2 style="color:#6d28d9">✦ SkillSwap Campus</h2>
  <h3>Session reminder, ${name}!</h3>
  <p style="color:#666">Your session <strong>${sessionTitle}</strong> is scheduled for:</p>
  <p style="font-size:18px;font-weight:600;color:#6d28d9">${scheduledAt.toLocaleString()}</p>
  <a href="${config.frontendUrl}#/sessions" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
    View session
  </a>
</div></body></html>`;
}
