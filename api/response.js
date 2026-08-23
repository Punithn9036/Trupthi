const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  NOTIFY_EMAIL_TO,
  NOTIFY_EMAIL_FROM,
} = process.env;

const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

let transporter = null;
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

function isValidDateString(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(new Date(str).getTime());
}

function isValidTimeString(str) {
  return /^\d{2}:\d{2}$/.test(str);
}

function sanitizeText(input, maxLen) {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, maxLen);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

module.exports = async function handler(req, res) {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { response, date, time, message } = req.body || {};

    if (!["yes", "talk_first"].includes(response)) {
      return res.status(400).json({ error: "Invalid response type." });
    }

    let cleanDate = null;
    let cleanTime = null;

    if (response === "yes") {
      if (!date || !time) {
        return res.status(400).json({ error: "Date and time are required." });
      }
      if (!isValidDateString(date) || !isValidTimeString(time)) {
        return res.status(400).json({ error: "Invalid date or time format." });
      }
      const chosen = new Date(`${date}T${time}`);
      if (chosen.getTime() < Date.now()) {
        return res.status(400).json({ error: "Date/time must be in the future." });
      }
      cleanDate = date;
      cleanTime = time;
    }

    const cleanMessage = sanitizeText(message, response === "yes" ? 500 : 800);
    const timestamp = new Date().toISOString();

    // 1. Save to Supabase
    let savedId = null;
    if (supabase) {
      const { data, error } = await supabase
        .from("responses")
        .insert([
          {
            response,
            date: cleanDate,
            time: cleanTime,
            message: cleanMessage,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
      } else {
        savedId = data?.id;
      }
    }

    // 2. Send email notification
    if (transporter) {
      const responseLabel = response === "yes" ? "YES" : "TALK FIRST";
      const lines = [
        `Response: ${responseLabel}`,
        cleanDate ? `Date: ${cleanDate}` : null,
        cleanTime ? `Time: ${cleanTime}` : null,
        `Message: ${cleanMessage || "(none)"}`,
        `Timestamp: ${timestamp}`,
      ].filter(Boolean);

      const subject = "\u2764\ufe0f Trupthi responded to your website";

      try {
        await transporter.sendMail({
          from: NOTIFY_EMAIL_FROM || SMTP_USER,
          to: NOTIFY_EMAIL_TO,
          subject,
          text: lines.join("\n"),
          html: `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;">
            <h2>${subject}</h2>
            <p><strong>Response:</strong> ${responseLabel}</p>
            ${cleanDate ? `<p><strong>Date:</strong> ${cleanDate}</p>` : ""}
            ${cleanTime ? `<p><strong>Time:</strong> ${cleanTime}</p>` : ""}
            <p><strong>Message:</strong> ${cleanMessage ? escapeHtml(cleanMessage) : "(none)"}</p>
            <p><strong>Timestamp:</strong> ${timestamp}</p>
          </div>`,
        });
      } catch (mailErr) {
        console.error("Email send error:", mailErr);
      }
    }

    return res.status(201).json({ success: true, id: savedId });
  } catch (err) {
    console.error("Serverless handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
