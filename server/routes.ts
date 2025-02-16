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
  insertGroupSchema,
  insertContentSchema
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from 'express';

// Ensure uploads directory exists
const uploadsDir = "./uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const multerStorage = multer.diskStorage({
  destination: uploadsDir,
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: multerStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));

  // Content Management Routes
  app.get("/api/contents", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const contents = await storage.getContents(req.user.id);
    res.json(contents);
  });

  app.get("/api/contents/category/:category", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const contents = await storage.getContentsByCategory(req.user.id, req.params.category);
    res.json(contents);
  });

  app.post("/api/contents", upload.single('file'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    try {
      const content = await storage.createContent({
        ...req.body,
        userId: req.user.id,
        url: `/uploads/${req.file.filename}`,
        type: req.file.mimetype.split('/')[0],
      });
      res.status(201).json(content);
    } catch (error) {
      console.error('Error creating content:', error);
      res.status(500).json({ message: "Failed to create content" });
    }
  });

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