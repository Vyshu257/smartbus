import { Router } from "express";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { nanoid } from "nanoid";
import { signToken } from "../middleware/auth.js";

const router = Router();

// In-memory user store for the prototype only - replace with a real DB
// table (see backend README / section 25 Users table) before going live.
const users = [
  // a seeded admin + conductor so the prototype is usable out of the box
  seedUser("admin@smartbus.dev", "admin123", "ADMIN"),
  seedUser("conductor@smartbus.dev", "conductor123", "CONDUCTOR"),
];

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const candidate = scryptSync(password, salt, 64);
  return timingSafeEqual(Buffer.from(hash, "hex"), candidate);
}

function seedUser(email, password, role) {
  return { id: nanoid(10), email, passwordHash: hashPassword(password), role };
}

router.post("/register", (req, res) => {
  const { email, password, role = "USER" } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }
  if (!["USER", "CONDUCTOR", "ADMIN"].includes(role)) {
    return res.status(400).json({ error: "invalid role" });
  }
  if (users.some((u) => u.email === email)) {
    return res.status(409).json({ error: "an account with that email already exists" });
  }

  const user = { id: nanoid(10), email, passwordHash: hashPassword(password), role };
  users.push(user);
  const token = signToken(user);
  res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  const user = users.find((u) => u.email === email);
  if (!user || !verifyPassword(password || "", user.passwordHash)) {
    return res.status(401).json({ error: "invalid email or password" });
  }
  const token = signToken(user);
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

export default router;
