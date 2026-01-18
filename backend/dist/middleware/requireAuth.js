// Authentication Middleware
// Implementa SRP: Solo valida tokens JWT
import { supabaseAuth } from '../config/database';
export async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'No token provided',
                message: 'Authorization header must be provided in format: Bearer <token>'
            });
            return;
        }
        const token = authHeader.split(' ')[1];
        // Validar token con Supabase
        const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
        if (error || !user) {
            res.status(401).json({
                error: 'Invalid token',
                message: 'The provided token is invalid or expired'
            });
            return;
        }
        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email || '',
            ...user.user_metadata,
        };
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            error: 'Authentication error',
            message: 'An error occurred during authentication'
        });
    }
}
// Optional auth - doesn't fail if no token provided
export async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }
        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
        if (!error && user) {
            req.user = {
                id: user.id,
                email: user.email || '',
                ...user.user_metadata,
            };
        }
        next();
    }
    catch (error) {
        console.error('Optional auth middleware error:', error);
        next(); // Continue even if auth fails
    }
}
