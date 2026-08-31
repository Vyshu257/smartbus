import jwt from "jsonwebtoken";

// In a real deployment this MUST come from an environment variable / secret
// manager. A hardcoded fallback is only acceptable for local prototyping.
const JWT_SECRET = process.env.JWT_SECRET || "smartbus-dev-secret-change-me";

export function signToken(user) {
  // Never put a password or full profile in the token - id + role is enough.
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "12h",
  });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing bearer token" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Not authorized for this action" });
    }
    next();
  };
}
