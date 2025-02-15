import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import {
  insertLocationSchema,
  insertTemplateSchema,
  insertRoutingRuleSchema,
  insertPhoneNumberSchema,
  insertCallSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Locations
  app.get("/api/locations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const locations = await storage.getLocations(req.user.id);
    res.json(locations);
  });

  app.post("/api/locations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const location = await storage.createLocation({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(location);
  });

  // Phone Numbers
  app.get("/api/phone-numbers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const numbers = await storage.getPhoneNumbers(req.user.id);
    res.json(numbers);
  });

  app.get("/api/locations/:locationId/phone-numbers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const numbers = await storage.getLocationPhoneNumbers(parseInt(req.params.locationId));
    res.json(numbers);
  });

  app.post("/api/phone-numbers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const phoneNumber = await storage.createPhoneNumber({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(phoneNumber);
  });

  // Calls
  app.get("/api/calls", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const calls = await storage.getCalls(req.user.id);
    res.json(calls);
  });

  app.get("/api/phone-numbers/:phoneNumberId/calls", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const calls = await storage.getCallsByPhoneNumber(parseInt(req.params.phoneNumberId));
    res.json(calls);
  });

  app.post("/api/calls", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const call = await storage.createCall({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(call);
  });

  // Templates
  app.get("/api/templates", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const templates = await storage.getTemplates(req.user.id);
    res.json(templates);
  });

  app.post("/api/templates", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const template = await storage.createTemplate({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(template);
  });

  // Routing Rules
  app.get("/api/routing-rules", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const rules = await storage.getRoutingRules(req.user.id);
    res.json(rules);
  });

  app.post("/api/routing-rules", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const rule = await storage.createRoutingRule({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(rule);
  });

  const httpServer = createServer(app);
  return httpServer;
}