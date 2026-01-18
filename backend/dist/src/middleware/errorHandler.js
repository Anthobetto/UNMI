// Global Error Handler Middleware
// Implementa SRP: Solo manejo centralizado de errores
import { ZodError } from 'zod';
export class ValidationError extends Error {
    statusCode = 400;
    isOperational = true;
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
export class NotFoundError extends Error {
    statusCode = 404;
    isOperational = true;
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
    }
}
export class UnauthorizedError extends Error {
    statusCode = 401;
    isOperational = true;
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}
export class ForbiddenError extends Error {
    statusCode = 403;
    isOperational = true;
    constructor(message = 'Forbidden') {
        super(message);
        this.name = 'ForbiddenError';
    }
}
export function errorHandler(err, _req, _res, _next) {
    // Log error for debugging
    console.error('Error occurred:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        url: _req.url,
        method: _req.method,
    });
    // Handle Zod validation errors
    if (err instanceof ZodError) {
        _res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid request data',
            details: err.errors.map(e => ({
                path: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }
    // Handle custom app errors
    const statusCode = err.statusCode || 500;
    const message = err.isOperational
        ? err.message
        : 'An unexpected error occurred';
    _res.status(statusCode).json({
        error: err.name || 'Error',
        message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
        }),
    });
}
// Async error wrapper
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
// 404 handler
export function notFoundHandler(req, res) {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} not found`,
    });
}
