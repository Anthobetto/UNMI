import { SupabaseService } from "../services/SupabaseService";
const supabaseService = new SupabaseService();
/**
 * Middleware para requerir autenticación
 */
export async function requireAuth(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }
    try {
        const { data: { user }, error } = await supabaseService.getClient().auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: "Invalid token" });
        }
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: "Authentication failed" });
    }
}
