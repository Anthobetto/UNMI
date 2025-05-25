import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from "multer";
import { createPaymentSession } from "./services/stripe";
import { WebSocketServer, WebSocket } from 'ws';
import { handleIncomingCall, getTwilioCallToken } from './services/twilio';
import { supabase } from "./db";
import { makeOutgoingCall } from "./services/twilio";


// Ensure uploads directory exists
const uploadsDir = "./uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Ensure documents directory exists
const documentsDir = "./public/documents";
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
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

interface AuthenticatedRequest extends Request {
  user?: any;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Extraemos el token del header (suponiendo el formato "Bearer <token>")
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = user;
  next();
}

// WebSocket clients for real-time updates
const clients = new Set<WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));

  // Serve static documents
  app.use('/documents', express.static(path.join(process.cwd(), 'public/documents')));

  // Content Management Routes
  app.get('/api/contents', requireAuth, async (req: any, res) => {
    const contents = await storage.getContents(req.user.id);
    res.json(contents);
  });

  app.get("/api/contents/category/:category", requireAuth, async (req: any, res) => {
    const contents = await storage.getContentsByCategory(req.user.id, req.params.category);
    res.json(contents);
  });

  app.post("/api/contents", upload.single('file'), requireAuth, async (req: any, res) => {
    // Temporarily remove authentication check for testing
    
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
  app.get("/api/groups", requireAuth, async (req: any, res) => {
    const groups = await storage.getGroups(req.user.id);
    res.json(groups);
  });

  app.post("/api/groups", requireAuth, async (req: any, res) => {
    const group = await storage.createGroup({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(group);
  });

  // Locations
  app.get("/api/locations", requireAuth, async (req: any, res) => {
    const locations = await storage.getLocations(req.user.id);
    res.json(locations);
  });

  app.get("/api/groups/:groupId/locations", requireAuth, async (req: any, res) => {
    const locations = await storage.getGroupLocations(parseInt(req.params.groupId));
    res.json(locations);
  });

  app.post("/api/locations", requireAuth, async (req: any, res) => {

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
  app.get("/api/phone-numbers", requireAuth, async (req: any, res) => {
    const numbers = await storage.getPhoneNumbers(req.user.id);
    res.json(numbers);
  });

  app.get("/api/locations/:locationId/phone-numbers", requireAuth, async (req: any, res) => {
    const numbers = await storage.getLocationPhoneNumbers(parseInt(req.params.locationId));
    res.json(numbers);
  });

  app.get("/api/phone-numbers/:number/linked", requireAuth, async (req: any, res) => {
    console.log("Authenticated:", req.isAuthenticated());
    const numbers = await storage.getLinkedNumbers(req.params.number);
    res.json(numbers);
  });

  app.post("/api/phone-numbers", requireAuth, async (req: any, res) => {
    console.log("Authenticated:", req.isAuthenticated());
    console.log("User:", req.user);


    const phoneNumber = await storage.createPhoneNumber({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(phoneNumber);
  });


  // Templates with group and location support
  app.get("/api/templates", requireAuth, async (req: any, res) => {
    const templates = await storage.getTemplates(req.user.id);
    res.json(templates);
  });

  app.get("/api/locations/:locationId/templates", requireAuth, async (req: any, res) => {
    const templates = await storage.getLocationTemplates(parseInt(req.params.locationId));
    res.json(templates);
  });

  app.get("/api/groups/:groupId/templates", requireAuth, async (req: any, res) => {
    const templates = await storage.getGroupTemplates(parseInt(req.params.groupId));
    res.json(templates);
  });

  app.post("/api/templates", requireAuth, async (req: any, res) => {
    const template = await storage.createTemplate({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(template);
  });

  // Calls
  app.get("/api/calls", requireAuth, async (req: any, res) => {
    const calls = await storage.getCalls(req.user.id);
    res.json(calls);
  });

  app.get("/api/phone-numbers/:phoneNumberId/calls", requireAuth, async (req: any, res) => {
    const calls = await storage.getCallsByPhoneNumber(parseInt(req.params.phoneNumberId));
    res.json(calls);
  });

  app.post("/api/calls", requireAuth, async (req: any, res) => {
    const call = await storage.createCall({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(call);
  });

  app.get("/api/calls/missed", requireAuth, async (req: any, res) => {
    const missedCalls = await storage.getLostCalls(req.user.id); //  uso getLostCalls directamente
    res.json(missedCalls);
  });
  // Routing Rules
  app.get("/api/routing-rules", requireAuth, async (req: any, res) => {
    const rules = await storage.getRoutingRules(req.user.id);
    res.json(rules);
  });

  app.post("/api/routing-rules", requireAuth, async (req: any, res) => {
    const rule = await storage.createRoutingRule({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(rule);
  });

  // Call Management APIs
  app.post("/api/calls/webhook", requireAuth, async (req: any, res) => {
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

  app.get("/api/calls/token", requireAuth, async (req: any, res) => {

    try {
      const token = await getTwilioCallToken();
      res.json(token);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate call token" });
    }
  });

  app.post("/api/calls/outgoing", requireAuth, async (req, res) => {
    const { to, from, url } = req.body;
    if (!to || !from || !url) {
      return res.status(400).json({ error: 'Missing required fields: to, from, url' });
    }

    try {
      const result = await makeOutgoingCall(to, from, url);
      res.status(200).json({ success: true, callSid: result.sid });
    } catch (error) {
      console.error('Error making outgoing call:', error);
      res.status(500).json({ error: 'Failed to make outgoing call' });
    }
  });




  // Get call statistics
  app.get("/api/calls/stats", requireAuth, async (req: any, res) => {

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


  // Message Management APIs

  // Send WhatsApp message
  app.post("/api/messages/whatsapp", requireAuth, async (req: any, res) => {

    try {
      const message = await storage.createMessage({
        userId: req.user.id,
        phoneNumberId: req.body.phoneNumberId,
        type: 'WhatsApp',
        content: req.body.content,
        recipient: req.body.recipient,
        status: 'pending',
        createdAt: new Date()
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
      res.status(500).json({ error: "Failed to send WhatsApp message" });
    }
  });

  // Get message statistics
  app.get("/api/messages/stats", requireAuth, async (req: any, res) => {

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