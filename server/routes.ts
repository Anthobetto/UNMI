import { createClient } from '@supabase/supabase-js';
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from "multer";
import { createPaymentSession } from "./services/stripe";
import { WebSocketServer, WebSocket } from 'ws';
import { handleIncomingCall, getTwilioCallToken, sendMessage } from './services/twilio';
import { staticMockData } from './services/supabase';

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

export async function registerRoutes(app: Express): Server {
  // Basic health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Test endpoint for content data
  app.get('/api/test-content', (req, res) => {
    res.json({ 
      mock_data_available: true,
      sample_content: staticMockData.contents[0],
      total_items: staticMockData.contents.length
    });
  });

  // Content Management Routes
  app.get("/api/contents", async (req, res) => {
    try {
      console.log('Attempting to fetch contents from storage...');
      const contents = await storage.getContents(req.user?.id || 1);
      res.json(contents);
    } catch (error) {
      console.error('Error fetching contents from storage:', error);
      console.log('Falling back to static mock data');
      res.json(staticMockData.contents);
    }
  });

  app.get("/api/contents/category/:category", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const contents = await storage.getContentsByCategory(req.user.id, req.params.category);
    res.json(contents);
  });

  app.post("/api/contents", upload.single('file'), async (req, res) => {
    // Temporarily remove authentication check for testing
    // if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    try {
      const content = await storage.createContent({
        ...req.body,
        userId: 1, // Temporary default user ID
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

    try {
      // Create a Stripe checkout session
      const session = await createPaymentSession(req.user.id);

      // Create the location after successful payment
      const location = await storage.createLocation({
        ...req.body,
        userId: req.user.id
      });

      // Return both the location data and the session URL
      res.status(201).json({
        location,
        sessionUrl: session.url
      });
    } catch (error) {
      console.error('Error in location creation:', error);
      res.status(500).json({ message: "Failed to create location" });
    }
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

  // Call Management APIs
  app.post("/api/calls/webhook", async (req, res) => {
    try {
      const call = await handleIncomingCall({
        From: req.body.From,
        To: req.body.To,
        CallSid: req.body.CallSid,
        CallStatus: req.body.CallStatus
      });

      // Broadcast call update to all connected clients
      const update = {
        type: 'call_received',
        data: call
      };

      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(update));
        }
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in call webhook:', error);
      res.status(500).json({ error: "Failed to process call" });
    }
  });

  app.get("/api/calls/token", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const token = await getTwilioCallToken();
      res.json(token);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate call token" });
    }
  });


  // Get call statistics
  app.get("/api/calls/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const calls = await storage.getCalls(req.user.id);
      const stats = {
        total: calls.length,
        missed: calls.filter(c => c.status === 'missed').length,
        answered: calls.filter(c => c.status === 'answered').length,
        averageDuration: calls.reduce((acc, curr) => acc + (curr.duration || 0), 0) / calls.length
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch call statistics" });
    }
  });

  // Message Management APIs section update
  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const message = await sendMessage({
        userId: req.user.id,
        phoneNumberId: req.body.phoneNumberId,
        type: req.body.type, // 'SMS' or 'WhatsApp'
        content: req.body.content,
        recipient: req.body.recipient,
        template: req.body.template // Optional template
      });

      // Broadcast message to connected clients
      const update = {
        type: 'message_sent',
        message
      };

      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(update));
        }
      });

      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Get message statistics
  app.get("/api/messages/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const stats = await storage.getMessageStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch message statistics" });
    }
  });

  // WebSocket setup for real-time updates
  const wsServer = new WebSocketServer({
    noServer: true,
    path: '/ws',
    perMessageDeflate: false
  });

  wsServer.on('connection', (ws: WebSocket) => {
    clients.add(ws);
    console.log('New WebSocket client connected');

    // Send initial connection confirmation
    ws.send(JSON.stringify({ type: 'connected' }));

    ws.on('message', (data) => {
      try {
        // Parse incoming messages
        const message = JSON.parse(data.toString());
        console.log('Received message:', message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected');
    });

    // Ping/pong to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on('pong', () => {
      // Reset connection timeout on pong
    });

    ws.on('close', () => {
      clearInterval(pingInterval);
    });
  });

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));

  // Serve static documents
  app.use('/documents', express.static(path.join(process.cwd(), 'public/documents')));


  const httpServer = createServer(app);

  // Upgrade HTTP server to WebSocket when requested
  httpServer.on('upgrade', (request, socket, head) => {
    if (request.url?.startsWith('/ws')) {
      wsServer.handleUpgrade(request, socket, head, (ws) => {
        wsServer.emit('connection', ws, request);
      });
    }
  });

  return httpServer;
}