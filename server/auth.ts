import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import type { User } from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  try {
    console.log('Setting up authentication...');

    // Use in-memory session store for debugging
    app.use(session({
      secret: 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 
      }
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new LocalStrategy(async (username, password, done) => {
      try {
        console.log('Login attempt for:', username);
        const user = await storage.getUserByUsername(username);

        if (!user) {
          console.log('User not found:', username);
          return done(null, false, { message: "Invalid credentials" });
        }

        const isValid = await comparePasswords(password, user.password_hash);
        if (!isValid) {
          console.log('Invalid password for:', username);
          return done(null, false, { message: "Invalid credentials" });
        }

        console.log('Login successful for:', username);
        return done(null, user);
      } catch (error) {
        console.error('Login error:', error);
        return done(error);
      }
    }));

    passport.serializeUser((user, done) => {
      console.log('Serializing user:', user.id);
      done(null, user.id);
    });

    passport.deserializeUser(async (id: number, done) => {
      try {
        console.log('Deserializing user:', id);
        const user = await storage.getUser(id);
        if (!user) {
          return done(null, false);
        }
        done(null, user);
      } catch (error) {
        console.error('Deserialization error:', error);
        done(error);
      }
    });

    // Registration endpoint
    app.post("/api/register", async (req, res) => {
      try {
        console.log('Registration attempt:', { ...req.body, password: '[REDACTED]' });
        const { username, email, password, company_name } = req.body;

        if (!username || !email || !password || !company_name) {
          return res.status(400).json({ error: "All fields are required" });
        }

        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ error: "Username already exists" });
        }

        const hashedPassword = await hashPassword(password);
        const user = await storage.createUser({
          username,
          email,
          password_hash: hashedPassword,
          company_name,
          created_at: new Date()
        });

        console.log('User created successfully:', user.id);

        req.login(user, (err) => {
          if (err) {
            console.error('Auto-login error after registration:', err);
            return res.status(500).json({ error: "Error during auto-login" });
          }
          res.status(201).json(user);
        });
      } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: "Registration failed" });
      }
    });

    // Login endpoint
    app.post("/api/login", (req, res, next) => {
      passport.authenticate("local", (err, user, info) => {
        if (err) {
          console.error('Authentication error:', err);
          return res.status(500).json({ error: "Authentication failed" });
        }
        if (!user) {
          return res.status(401).json({ error: info.message || "Invalid credentials" });
        }
        req.login(user, (err) => {
          if (err) {
            console.error('Session creation error:', err);
            return res.status(500).json({ error: "Login failed" });
          }
          res.json(user);
        });
      })(req, res, next);
    });

    // Get current user
    app.get("/api/user", (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.json(req.user);
    });

    // Logout endpoint
    app.post("/api/logout", (req, res) => {
      req.logout((err) => {
        if (err) {
          console.error('Logout error:', err);
          return res.status(500).json({ error: "Logout failed" });
        }
        res.json({ message: "Logged out successfully" });
      });
    });

    console.log('Authentication setup completed');
  } catch (error) {
    console.error('Fatal error during auth setup:', error);
    throw error;
  }
}