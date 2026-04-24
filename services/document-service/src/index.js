const express = require("express");
const cors = require("cors");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const { createLogger } = require("../../../shared/logger");

const logger = createLogger("document-service");
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const PORT = process.env.PORT || 5000;
const UPLOADS_DIR = path.join(__dirname, "../uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// --- Auth middleware ---
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// --- Upload config ---
const ALLOWED_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF and Word documents are allowed"));
  },
});

// --- Upload endpoint ---
app.post(
  "/upload",
  cors(),
  requireAuth,
  upload.single("file"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const url = `/documents/${req.file.filename}`;
    logger.info(
      {
        filename: req.file.filename,
        size: req.file.size,
        userId: req.user.id,
      },
      "File uploaded",
    );
    res.json({ url, filename: req.file.filename, size: req.file.size });
  },
  (err, req, res, _next) => {
    logger.error({ error: err.message }, "File upload failed");
    res.status(400).json({ error: err.message });
  },
);

// --- Serve files ---
app.use("/documents", cors(), express.static(UPLOADS_DIR));

app.listen(PORT, () => {
  logger.info({ port: PORT }, "Document service running");
});
