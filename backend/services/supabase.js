const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    "[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. " +
      "Using local fallback storage (backend/responses.json) for development."
  );
}

// Server-side client using the service role key.
// This key must NEVER be exposed to the frontend — it only ever
// lives here, on the backend, read from an environment variable.
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Local fallback path for development when Supabase isn't configured.
const FALLBACK_PATH = path.join(__dirname, "..", "responses.json");

/**
 * Saves a response row to the `responses` table.
 * Expected table schema (see README.md for the SQL to create it):
 *   id           uuid, primary key, default gen_random_uuid()
 *   response     text            -- "yes" | "talk_first"
 *   date         date, nullable
 *   time         time, nullable
 *   message      text, nullable
 *   created_at   timestamptz, default now()
 */
async function saveResponse({ response, date, time, message }) {
  if (!supabase) {
    // Fallback: append to a local JSON file for development.
    try {
      let list = [];
      if (fs.existsSync(FALLBACK_PATH)) {
        const raw = fs.readFileSync(FALLBACK_PATH, "utf8");
        list = raw ? JSON.parse(raw) : [];
      }
      const entry = {
        id: `local-${Date.now()}`,
        response,
        date: date || null,
        time: time || null,
        message: message || null,
        created_at: new Date().toISOString(),
      };
      list.push(entry);
      fs.writeFileSync(FALLBACK_PATH, JSON.stringify(list, null, 2), "utf8");
      return entry;
    } catch (err) {
      throw new Error("Failed to write local fallback responses.json: " + err.message);
    }
  }

  const { data, error } = await supabase
    .from("responses")
    .insert([
      {
        response,
        date: date || null,
        time: time || null,
        message: message || null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

module.exports = { saveResponse };
