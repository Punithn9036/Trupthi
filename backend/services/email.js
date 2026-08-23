const nodemailer = require("nodemailer");

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  NOTIFY_EMAIL_TO,
  NOTIFY_EMAIL_FROM,
} = process.env;

let transporter = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
} else {
  console.warn(
    "[email] SMTP settings are not fully configured. Notification emails will be skipped " +
      "(the response will still be saved to the database)."
  );
}

/**
 * Sends a notification email whenever a response is submitted.
 * Failing to send an email should never block saving the response,
 * so callers should treat this as best-effort.
 */
async function sendNotification({ response, date, time, message, timestamp }) {
  if (!transporter) return;

  const responseLabel = response === "yes" ? "YES" : "TALK FIRST";

  const lines = [
    `Response: ${responseLabel}`,
    date ? `Date: ${date}` : null,
    time ? `Time: ${time}` : null,
    `Message: ${message || "(none)"}`,
    `Timestamp: ${timestamp}`,
  ].filter(Boolean);

  const subject = "\u2764\ufe0f Trupthi responded to your website";

  await transporter.sendMail({
    from: NOTIFY_EMAIL_FROM || SMTP_USER,
    to: NOTIFY_EMAIL_TO,
    subject,
    text: lines.join("\n"),
    html: `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;">
      <h2>${subject}</h2>
      <p><strong>Response:</strong> ${responseLabel}</p>
      ${date ? `<p><strong>Date:</strong> ${date}</p>` : ""}
      ${time ? `<p><strong>Time:</strong> ${time}</p>` : ""}
      <p><strong>Message:</strong> ${message ? escapeHtml(message) : "(none)"}</p>
      <p><strong>Timestamp:</strong> ${timestamp}</p>
    </div>`,
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

module.exports = { sendNotification };
