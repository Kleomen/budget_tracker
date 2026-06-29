const nodemailer = require('nodemailer');

/* Sends the account-verification email. Builds an SMTP transport from the
   SMTP_* env vars; if they're not set (local dev, or before you wire a
   provider) it just logs the link to the console so the flow still works.
   Set SMTP_HOST/SMTP_USER/SMTP_PASS (and optionally SMTP_PORT, MAIL_FROM) to
   send for real — works with Gmail app passwords or any SMTP provider.

   ponytail: console fallback instead of failing hard when unconfigured —
   matches the CORS env pattern. Swap in a transactional API (Resend/SES) here
   if SMTP ever proves limiting; only this file changes. */
const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

const transport = hasSmtp
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465, // 465 = implicit TLS
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

async function sendVerificationEmail(to, link) {
  if (!transport) {
    console.log(`[mailer] SMTP not configured — verification link for ${to}:\n  ${link}`);
    return;
  }
  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: 'Verify your email',
    text: `Confirm your account by opening this link:\n\n${link}\n\nThe link expires in 24 hours. If you didn't sign up, you can ignore this email.`,
    html: `<p>Confirm your account by clicking the link below:</p>
           <p><a href="${link}">Verify my email</a></p>
           <p>The link expires in 24 hours. If you didn't sign up, you can ignore this email.</p>`,
  });
}

module.exports = { sendVerificationEmail };
