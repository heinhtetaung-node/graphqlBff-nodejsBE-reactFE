import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import jwt from "jsonwebtoken";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { createLogger } from "../../../shared/src/logger";

const logger = createLogger("document-service");
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const PORT = process.env.PORT || 5000;
const UPLOADS_DIR = path.join(__dirname, "../uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

const app = express();

app.get("/health", (_req: Request, res: Response) =>
  res.json({ status: "ok" }),
);

function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET) as AuthRequest["user"];
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

const ALLOWED_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF and Word documents are allowed"));
  },
});

app.post(
  "/upload",
  cors(),
  requireAuth as express.RequestHandler,
  upload.single("file"),
  (req: AuthRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const url = `/documents/${req.file.filename}`;
    logger.info(
      {
        filename: req.file.filename,
        size: req.file.size,
        userId: req.user?.userId,
      },
      "File uploaded",
    );
    res.json({ url, filename: req.file.filename, size: req.file.size });
  },
  (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ error: err.message }, "File upload failed");
    res.status(400).json({ error: err.message });
  },
);

app.use("/documents", cors(), express.static(UPLOADS_DIR));

app.listen(PORT, () => {
  logger.info({ port: PORT }, "Document service running");
});
