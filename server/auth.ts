import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { supabase } from "./db";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser { }
  }
}

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
  const sessionSettings: session.SessionOptions = {
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();


      if (error || !user || !(await comparePasswords(password, user.password_hash))) {
        return done(null, false);
      } else {
        console.log("📩 Email recibido:", username);
        console.log("🔑 Password recibido:", password);
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    console.log("Se alcanzó la ruta de registro");
    const { data: existingUser, error: getUserError } = await supabase
      .from('users')
      .select('*')
      .eq('email', req.body.email)
      .single();

    if (existingUser) {
      return res.status(400).send("Email already exists.");
    }

    const hashedPassword = await hashPassword(req.body.password);

    const { data, error } = await supabase
      .from('users')
      .insert([
        { username: req.body.username, email: req.body.email, password_hash: hashedPassword }
      ]);

    if (error) {
      console.error('Error al insertar usuario:', error);
      return res.status(500).send(error.message);
    }
    console.log('Registing user:', req.body.username, req.body.email);
    res.status(204).end()
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Se alcanzó la ruta de login 🔌");
    req.logout((err) => {
      if (err) return next(err);
      console.log('User successfully connected ✅:', req.body.username);
      res.sendStatus(200);
    });
  });

  app.post("/api/logout", (req, res, next) => {
    console.log("Se alcanzó la ruta de logout 🚀");
    req.logout((err) => {
      if (err) return next(err);
      console.log('User logged out successfully 🚪:', req.body.username);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}