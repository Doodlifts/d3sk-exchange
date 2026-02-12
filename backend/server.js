import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import path from 'path';

import D3SKIndexer from './indexer.js';
import * as store from './db/store.js';
import offersRouter from './routes/offers.js';
import orderbookRouter from './routes/orderbook.js';
import statsRouter from './routes/stats.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const PORT = parseInt(process.env.PORT || '3001', 10);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

// Global state
let indexer = null;
const connectedClients = new Set();

// Logging helper
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const levels = ['debug', 'info', 'warn', 'error'];
  if (levels.indexOf(level) >= levels.indexOf(LOG_LEVEL)) {
    const logMsg = data ? `${message} ${JSON.stringify(data)}` : message;
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${logMsg}`);
  }
}

// Middleware
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    log('debug', `${req.method} ${req.path} - ${res.statusCode}`, { duration: `${duration}ms` });
  });
  next();
});

// Routes
/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: Date.now(),
    indexer: indexer ? indexer.getStatus() : null,
    connectedClients: connectedClients.size,
    uptime: process.uptime()
  };
  res.json(health);
});

/**
 * Indexer status endpoint
 */
app.get('/api/indexer/status', (req, res) => {
  if (!indexer) {
    return res.status(503).json({ error: 'Indexer not initialized' });
  }

  res.json({
    status: indexer.getStatus(),
    timestamp: Date.now()
  });
});

// Mount route modules
app.use('/api/offers', offersRouter);
app.use('/api/orderbook', orderbookRouter);
app.use('/api', statsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// WebSocket server
wss.on('connection', (ws) => {
  const clientId = Math.random().toString(36).substr(2, 9);
  connectedClients.add(clientId);

  log('info', `WebSocket client connected`, { clientId, totalClients: connectedClients.size });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleWebSocketMessage(ws, message, clientId);
    } catch (error) {
      log('warn', 'Invalid WebSocket message', { error: error.message });
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    connectedClients.delete(clientId);
    log('info', `WebSocket client disconnected`, { clientId, totalClients: connectedClients.size });
  });

  ws.on('error', (error) => {
    log('error', 'WebSocket error', { error: error.message });
  });
});

/**
 * Handle WebSocket messages
 */
function handleWebSocketMessage(ws, message, clientId) {
  const { type, payload } = message;

  switch (type) {
    case 'subscribe': {
      const { channel } = payload;
      log('debug', `Client subscribed to channel`, { clientId, channel });
      ws.send(JSON.stringify({
        type: 'subscribed',
        channel,
        timestamp: Date.now()
      }));
      break;
    }

    case 'ping': {
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    }

    default:
      log('warn', `Unknown WebSocket message type`, { type, clientId });
      ws.send(JSON.stringify({
        type: 'error',
        message: `Unknown message type: ${type}`
      }));
  }
}

/**
 * Broadcast message to all connected WebSocket clients
 */
function broadcastToClients(message) {
  if (connectedClients.size === 0) {
    return;
  }

  const payload = JSON.stringify(message);
  let successCount = 0;

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(payload, (error) => {
        if (!error) {
          successCount++;
        } else {
          log('warn', 'Failed to send WebSocket message', { error: error.message });
        }
      });
    }
  });

  log('debug', `Broadcast message sent`, { type: message.type, recipients: successCount });
}

/**
 * Initialize indexer and bind events
 */
function initializeIndexer() {
  try {
    indexer = new D3SKIndexer({
      flowNetwork: process.env.FLOW_NETWORK || 'testnet',
      flowAccessNode: process.env.FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org',
      d3skOfferAddress: process.env.D3SK_OFFER_ADDRESS || '0x0',
      d3skRegistryAddress: process.env.D3SK_REGISTRY_ADDRESS || '0x0'
    });

    // Bind indexer events
    indexer.on('offer_created', (offer) => {
      broadcastToClients({
        type: 'offer_created',
        data: offer,
        timestamp: Date.now()
      });
    });

    indexer.on('offer_filled', (data) => {
      broadcastToClients({
        type: 'offer_filled',
        data,
        timestamp: Date.now()
      });
    });

    indexer.on('offer_cancelled', (data) => {
      broadcastToClients({
        type: 'offer_cancelled',
        data,
        timestamp: Date.now()
      });
    });

    indexer.on('offer_registered', (offer) => {
      broadcastToClients({
        type: 'offer_registered',
        data: offer,
        timestamp: Date.now()
      });
    });

    indexer.on('offer_removed', (data) => {
      broadcastToClients({
        type: 'offer_removed',
        data,
        timestamp: Date.now()
      });
    });

    indexer.on('failed', () => {
      log('error', 'Indexer failed to reconnect');
      broadcastToClients({
        type: 'indexer_status',
        status: 'disconnected',
        timestamp: Date.now()
      });
    });

    indexer.on('started', () => {
      log('info', 'Indexer started');
      broadcastToClients({
        type: 'indexer_status',
        status: 'connected',
        timestamp: Date.now()
      });
    });

    indexer.on('stopped', () => {
      log('info', 'Indexer stopped');
    });

    return true;
  } catch (error) {
    log('error', 'Failed to initialize indexer', { error: error.message });
    return false;
  }
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal) {
  log('info', `Received ${signal}, shutting down gracefully...`);

  // Close all WebSocket connections
  wss.clients.forEach((client) => {
    client.close(1000, 'Server shutting down');
  });

  // Stop the indexer
  if (indexer) {
    await indexer.stop();
  }

  // Close the database
  store.close();

  // Close the HTTP server
  httpServer.close(() => {
    log('info', 'Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    log('error', 'Forced shutdown after 10 seconds');
    process.exit(1);
  }, 10000);
}

// Signal handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  log('error', 'Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
  log('error', 'Uncaught Exception', { error: error.message });
  process.exit(1);
});

/**
 * Start the server
 */
async function startServer() {
  try {
    // Initialize indexer
    if (!initializeIndexer()) {
      throw new Error('Failed to initialize indexer');
    }

    // Start the indexer
    await indexer.start();

    // Start the HTTP server
    httpServer.listen(PORT, () => {
      log('info', `D3SK Indexer API Server listening on port ${PORT}`);
      log('info', 'Server Configuration', {
        PORT,
        FRONTEND_ORIGIN,
        FLOW_NETWORK: process.env.FLOW_NETWORK || 'testnet',
        FLOW_ACCESS_NODE: process.env.FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org'
      });

      console.log(`
╔═══════════════════════════════════════════════════════╗
║           D3SK INDEXER API SERVER STARTED             ║
╠═══════════════════════════════════════════════════════╣
║  API:      http://localhost:${PORT}                       ║
║  WebSocket: ws://localhost:${PORT}/ws                  ║
║  Health:   http://localhost:${PORT}/api/health          ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    log('error', 'Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// Start the server
startServer();

export { app, httpServer, wss };
