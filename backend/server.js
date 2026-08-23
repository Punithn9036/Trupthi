require("dotenv").config();
const express = require("express");
const cors = require("cors");
const responseRoutes = require("./routes/response");

const app = express();
const PORT = process.env.PORT || 3001;

// ------------------------------------------------------------
// Middleware
// ------------------------------------------------------------
const allowedOriginSetting = process.env.ALLOWED_ORIGIN;
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like local files, curl, postman)
      if (!origin) return callback(null, true);
      if (!allowedOriginSetting || allowedOriginSetting === "*") {
        return callback(null, true);
      }
      const allowed = allowedOriginSetting.split(",").map((s) => s.trim());
      if (
        allowed.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback to allowing during development
    },
  })
);
app.use(express.json({ limit: "50kb" })); // small limit — this only ever receives a short form

// simple in-memory rate limiter to avoid accidental spam / abuse
const rateLimitMap = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 5;
  const record = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - record.start > windowMs) {
    record.count = 0;
    record.start = now;
  }
  record.count += 1;
  rateLimitMap.set(ip, record);
  if (record.count > maxRequests) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment and try again." });
  }
  next();
}

app.use("/api", rateLimit);

// ------------------------------------------------------------
// Routes
// ------------------------------------------------------------
app.use("/api/response", responseRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ------------------------------------------------------------
// Error handling
// ------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
