const express = require("express");
const router = express.Router();
const { saveResponse } = require("../services/supabase");
const { sendNotification } = require("../services/email");

const VALID_RESPONSES = ["yes", "talk_first"];

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

router.post("/", async (req, res) => {
  try {
    const { response, date, time, message } = req.body || {};

    // ---- validation ----
    if (!VALID_RESPONSES.includes(response)) {
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

    // ---- persist ----
    const saved = await saveResponse({
      response,
      date: cleanDate,
      time: cleanTime,
      message: cleanMessage,
    });

    // ---- notify (best-effort, never blocks the response to the client) ----
    sendNotification({
      response,
      date: cleanDate,
      time: cleanTime,
      message: cleanMessage,
      timestamp,
    }).catch((err) => {
      console.error("[email] Failed to send notification:", err.message);
    });

    return res.status(201).json({ success: true, id: saved?.id });
  } catch (err) {
    console.error("[response] Error handling submission:", err);
    return res.status(500).json({ error: "Something went wrong saving your response." });
  }
});

module.exports = router;
