import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import {
  insertLocationSchema,
  insertTemplateSchema,
  insertRoutingRuleSchema,
  insertPhoneNumberSchema,
  insertCallSchema,
  insertGroupSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Group routes
  app.get("/api/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const groups = await storage.getGroups(req.user.id);
    res.json(groups);
  });

  app.post("/api/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const group = await storage.createGroup({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(group);
  });

  // Locations
  app.get("/api/locations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const locations = await storage.getLocations(req.user.id);
    res.json(locations);
  });

  app.get("/api/groups/:groupId/locations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const locations = await storage.getGroupLocations(parseInt(req.params.groupId));
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

  // Phone Numbers with enhanced functionality
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

  app.get("/api/phone-numbers/:number/linked", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const numbers = await storage.getLinkedNumbers(req.params.number);
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

  // Templates with group and location support
  app.get("/api/templates", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const templates = await storage.getTemplates(req.user.id);
    res.json(templates);
  });

  app.get("/api/locations/:locationId/templates", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const templates = await storage.getLocationTemplates(parseInt(req.params.locationId));
    res.json(templates);
  });

  app.get("/api/groups/:groupId/templates", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const templates = await storage.getGroupTemplates(parseInt(req.params.groupId));
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