import { Request, Response, NextFunction } from "express";
import { SupabaseService } from "../services/SupabaseService";

const supabaseService = new SupabaseService();

interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Middleware para requerir autenticación
 */
export async function requireAuth(
  _req: AuthenticatedRequest,
  _res: Response,
  _next: NextFunction
) {
  const token = _req.headers.authorization?.split(" ")[1];

  if (!token) {
    return _res.status(401).json({ error: "No token provided" });
  }

  try {
    const { data: { user }, error } = await supabaseService.getClient().auth.getUser(token);

    if (error || !user) {
      return _res.status(401).json({ error: "Invalid token" });
    }

    _req.user = user;
    _next();
  } catch (error) {
    return _res.status(401).json({ error: "Authentication failed" });
  }
}

