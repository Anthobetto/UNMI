import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/locations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const locations = await storage.getLocations(req.user!.id);
    res.json(locations);
  });

  app.post("/api/locations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const location = await storage.createLocation({
      ...req.body,
      userId: req.user!.id,
    });
    res.json(location);
  });

  app.get("/api/rules", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const rules = await storage.getRules(req.user!.id);
    res.json(rules);
  });

  app.post("/api/rules", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const rule = await storage.createRule({
      ...req.body,
      userId: req.user!.id,
    });
    res.json(rule);
  });

  const httpServer = createServer(app);
  return httpServer;
}
