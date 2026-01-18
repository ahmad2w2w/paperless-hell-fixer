import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-change-me";

interface MobileUser {
  userId: string;
  email: string;
}

export function verifyMobileToken(token: string): MobileUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as MobileUser;
    return decoded;
  } catch {
    return null;
  }
}

export function getMobileUserFromRequest(req: Request): MobileUser | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  
  const token = authHeader.slice(7);
  return verifyMobileToken(token);
}



