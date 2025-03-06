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

export async function setupAuth(app: Express) {
  try {
    // Basic session configuration with in-memory store
    app.use(session({
      secret: process.env.SESSION_SECRET || 'dev-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid credentials" });
        }

        const isValid = await comparePasswords(password, user.password_hash);
        if (!isValid) {
          return done(null, false, { message: "Invalid credentials" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));

    passport.serializeUser((user: User, done) => {
      done(null, user.id);
    });

    passport.deserializeUser(async (id: number, done) => {
      try {
        const user = await storage.getUser(id);
        done(null, user || false);
      } catch (error) {
        done(error);
      }
    });

    // Registration endpoint
    app.post("/api/register", async (req, res) => {
      try {
        const { username, email, password, company_name } = req.body;

        if (!username || !email || !password || !company_name) {
          return res.status(400).json({ error: "All fields are required" });
        }

        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ error: "Username already exists" });
        }

        const user = await storage.createUser({
          username,
          email,
          password_hash: await hashPassword(password),
          company_name,
          created_at: new Date()
        });

        req.login(user, (err) => {
          if (err) {
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
          return res.status(500).json({ error: "Authentication failed" });
        }
        if (!user) {
          return res.status(401).json({ error: info.message || "Invalid credentials" });
        }
        req.login(user, (err) => {
          if (err) {
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
          return res.status(500).json({ error: "Logout failed" });
        }
        res.json({ message: "Logged out successfully" });
      });
    });

  } catch (error) {
    console.error('Error setting up authentication:', error);
    throw error;
  }
}