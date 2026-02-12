# Z3RO Indexer Backend

A production-quality, read-only indexer and REST API for the Z3RO zero-custody exchange on the Flow blockchain. This backend indexes all offer creation, filling, and cancellation events, providing a queryable database and real-time WebSocket updates.

## Features

- **Event Indexing**: Subscribes to Z3RO contract events on Flow blockchain
- **SQLite Database**: Persistent storage of offers, trades, and sync state
- **REST API**: Comprehensive endpoints for querying offers, order books, and statistics
- **WebSocket Support**: Real-time updates for connected clients
- **Exponential Backoff Reconnection**: Automatic recovery from connection failures
- **Zero Custody**: Purely read-only, no private keys or fund custody
- **Production-Ready**: Comprehensive error handling, logging, and graceful shutdown

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Z3RO Indexer Backend                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │         Flow Blockchain (Events)                   │ │
│  │  - Z3ROOffer.OfferCreated                          │ │
│  │  - Z3ROOffer.OfferFilled                           │ │
│  │  - Z3ROOffer.OfferCancelled                        │ │
│  │  - Z3RORegistry events                             │ │
│  └─────────────────────┬────────────────────────────┘ │
│                        │                                │
│                        ▼                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │        Z3ROIndexer (Event Listener)                │ │
│  │  - FCL Event Subscriptions                         │ │
│  │  - Event Processing & Storage                      │ │
│  │  - Reconnection with Exponential Backoff           │ │
│  └─────────────────────┬────────────────────────────┘ │
│                        │                                │
│                        ▼                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │      SQLite Store (Persistent Database)            │ │
│  │  - offers table                                    │ │
│  │  - trades table                                    │ │
│  │  - sync_state table                                │ │
│  └────────────────────────────────────────────────────┘ │
│                   ▲             ▲                       │
│                   │             │                       │
│  ┌────────────────┴─────────────┴─────────────────────┐ │
│  │            Express REST API Server                 │ │
│  │  - /api/offers      (Query offers)                 │ │
│  │  - /api/orderbook   (Order book data)              │ │
│  │  - /api/trades      (Trade history)                │ │
│  │  - /api/stats       (Aggregate statistics)         │ │
│  │  - /ws              (WebSocket real-time updates)  │ │
│  └────────────────────────────────────────────────────┘ │
│                        ▲                                │
│                        │                                │
│  ┌────────────────────┴─────────────────────────────┐  │
│  │      Frontend & External Clients                 │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Setup

1. Clone the repository and navigate to the backend directory:

```bash
cd z3ro/backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Update `.env` with your configuration:

```env
PORT=3001
FLOW_NETWORK=testnet
FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
Z3RO_OFFER_ADDRESS=0x<YOUR_ADDRESS>
Z3RO_REGISTRY_ADDRESS=0x<YOUR_ADDRESS>
FRONTEND_ORIGIN=http://localhost:3000
```

## Running the Server

### Development

```bash
npm run dev
```

This uses `nodemon` for auto-reload on file changes.

### Production

```bash
npm start
```

The server will start on the configured PORT (default 3001).

## API Endpoints

### Health Check

```
GET /api/health
```

Returns the health status of the server and indexer.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1704067200000,
  "indexer": {
    "isRunning": true,
    "reconnectAttempts": 0,
    "maxReconnectAttempts": 10,
    "activeSubscriptions": 5,
    "config": {
      "flowNetwork": "testnet",
      "flowAccessNode": "https://rest-testnet.onflow.org"
    }
  },
  "connectedClients": 3,
  "uptime": 3600.5
}
```

### Offers

#### Get All Active Offers

```
GET /api/offers
```

**Query Parameters:**
- `pair` (string): Trading pair (e.g., "USDC-FLOW")
- `maker` (string): Filter by maker address
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `sort` (string): Sort order - `price_asc`, `price_desc`, `newest`, `oldest`
- `limit` (number): Results per page (max 1000, default 100)
- `offset` (number): Pagination offset (default 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "offer_123",
      "maker": "0x1234...",
      "sell_type": "USDC",
      "sell_amount": "100.00",
      "ask_type": "FLOW",
      "ask_amount": "1000.00",
      "price": 0.1,
      "status": "active",
      "created_at": 1704067200000,
      "filled_at": null,
      "cancelled_at": null,
      "taker": null
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "count": 1
  }
}
```

#### Get Single Offer

```
GET /api/offers/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "offer_123",
    "maker": "0x1234...",
    "sell_type": "USDC",
    "sell_amount": "100.00",
    "ask_type": "FLOW",
    "ask_amount": "1000.00",
    "price": 0.1,
    "status": "active",
    "created_at": 1704067200000,
    "filled_at": null,
    "cancelled_at": null,
    "taker": null
  }
}
```

#### Get Offers by Maker

```
GET /api/offers/maker/:maker
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 5
}
```

### Order Book

#### Get Order Book for a Pair

```
GET /api/orderbook/:pair
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pair": "USDC-FLOW",
    "bids": [
      {
        "price": 0.10,
        "count": 5,
        "amount": 500
      }
    ],
    "asks": [
      {
        "price": 0.12,
        "count": 3,
        "amount": 300
      }
    ],
    "timestamp": 1704067200000
  }
}
```

#### Get Available Trading Pairs

```
GET /api/orderbook
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pairs": ["USDC-FLOW", "USDC-WBTC", "FLOW-USDT"],
    "count": 3,
    "timestamp": 1704067200000
  }
}
```

### Trades & Statistics

#### Get Recent Trades

```
GET /api/trades
```

**Query Parameters:**
- `pair` (string): Filter by trading pair
- `limit` (number): Number of trades to return (max 1000, default 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "trades": [
      {
        "id": 1,
        "offer_id": "offer_123",
        "maker": "0x1234...",
        "taker": "0x5678...",
        "sell_type": "USDC",
        "sell_amount": "100.00",
        "ask_type": "FLOW",
        "ask_amount": "1000.00",
        "price": 0.1,
        "timestamp": 1704067200000
      }
    ],
    "count": 1,
    "pair": null,
    "timestamp": 1704067200000
  }
}
```

#### Get Aggregate Statistics

```
GET /api/stats
```

**Query Parameters:**
- `timeframe` (number): Time window in milliseconds (default 24h, max 30 days)

**Response:**
```json
{
  "success": true,
  "data": {
    "active_offers": 45,
    "total_trades": 1250,
    "trades_24h": 120,
    "volume_24h": 15000.50,
    "active_pairs": 8,
    "timestamp": 1704067200000
  }
}
```

## WebSocket API

Connect to `ws://localhost:3001/ws` for real-time updates.

### Message Format

All WebSocket messages are JSON objects with the following structure:

```json
{
  "type": "message_type",
  "data": {},
  "timestamp": 1704067200000
}
```

### Supported Message Types

#### Client -> Server

**Subscribe to Channel**
```json
{
  "type": "subscribe",
  "payload": {
    "channel": "offers"
  }
}
```

**Ping (Heartbeat)**
```json
{
  "type": "ping"
}
```

#### Server -> Client

**Offer Created**
```json
{
  "type": "offer_created",
  "data": {
    "id": "offer_123",
    "maker": "0x1234...",
    "sell_type": "USDC",
    "sell_amount": "100.00",
    "ask_type": "FLOW",
    "ask_amount": "1000.00",
    "price": 0.1,
    "created_at": 1704067200000
  },
  "timestamp": 1704067200000
}
```

**Offer Filled**
```json
{
  "type": "offer_filled",
  "data": {
    "offerId": "offer_123",
    "taker": "0x5678...",
    "trade": {
      "offer_id": "offer_123",
      "maker": "0x1234...",
      "taker": "0x5678...",
      "sell_type": "USDC",
      "sell_amount": "100.00",
      "ask_type": "FLOW",
      "ask_amount": "1000.00",
      "price": 0.1,
      "timestamp": 1704067200000
    }
  },
  "timestamp": 1704067200000
}
```

**Offer Cancelled**
```json
{
  "type": "offer_cancelled",
  "data": {
    "offerId": "offer_123"
  },
  "timestamp": 1704067200000
}
```

**Indexer Status**
```json
{
  "type": "indexer_status",
  "status": "connected",
  "timestamp": 1704067200000
}
```

## Database Schema

### Offers Table

```sql
CREATE TABLE offers (
  id TEXT PRIMARY KEY,
  maker TEXT NOT NULL,
  sell_type TEXT NOT NULL,
  sell_amount TEXT NOT NULL,
  ask_type TEXT NOT NULL,
  ask_amount TEXT NOT NULL,
  price REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, filled, cancelled
  created_at INTEGER NOT NULL,
  filled_at INTEGER,
  cancelled_at INTEGER,
  taker TEXT
);
```

### Trades Table

```sql
CREATE TABLE trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id TEXT NOT NULL,
  maker TEXT NOT NULL,
  taker TEXT NOT NULL,
  sell_type TEXT NOT NULL,
  sell_amount TEXT NOT NULL,
  ask_type TEXT NOT NULL,
  ask_amount TEXT NOT NULL,
  price REAL NOT NULL,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (offer_id) REFERENCES offers(id)
);
```

### Sync State Table

```sql
CREATE TABLE sync_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |
| `FLOW_NETWORK` | testnet | Flow network (testnet, mainnet) |
| `FLOW_ACCESS_NODE` | https://rest-testnet.onflow.org | Flow access node URL |
| `Z3RO_OFFER_ADDRESS` | 0x0 | Z3RO Offer contract address |
| `Z3RO_REGISTRY_ADDRESS` | 0x0 | Z3RO Registry contract address |
| `FRONTEND_ORIGIN` | http://localhost:3000 | CORS origin for frontend |
| `LOG_LEVEL` | info | Logging level (debug, info, warn, error) |

## Error Handling

The server includes comprehensive error handling:

- **Network Errors**: Automatic reconnection with exponential backoff
- **Database Errors**: Logged and gracefully handled
- **Invalid Requests**: Validated input with clear error messages
- **WebSocket Errors**: Automatic connection cleanup on error

Example error responses:

```json
{
  "error": "Invalid pair format. Expected SYMBOL-SYMBOL"
}
```

## Logging

The server logs all significant events:

```
[2024-01-01T12:00:00.000Z] [INFO] Z3RO Indexer API Server listening on port 3001
[2024-01-01T12:00:01.000Z] [INFO] Indexer started
[2024-01-01T12:00:02.000Z] [DEBUG] GET /api/offers - 200 { duration: '45ms' }
[2024-01-01T12:00:03.000Z] [INFO] WebSocket client connected { clientId: 'abc123', totalClients: 1 }
```

Control logging verbosity with the `LOG_LEVEL` environment variable:
- `debug`: All messages
- `info`: Info level and above (default)
- `warn`: Warnings and errors only
- `error`: Errors only

## Graceful Shutdown

The server handles graceful shutdown on `SIGTERM` and `SIGINT` signals:

1. Closes all WebSocket connections
2. Stops the event indexer
3. Closes the database connection
4. Exits cleanly (or forces exit after 10 seconds)

## Performance Considerations

- **Database Indexing**: Offers table includes indexes on status, maker, pair, and price for fast queries
- **Query Limits**: Maximum 1000 results per API request to prevent memory issues
- **Connection Pooling**: SQLite uses WAL mode for concurrent access
- **WebSocket Broadcasts**: Only sent to connected clients with error handling per recipient

## Security Notes

**This is a read-only indexer with NO private keys and NO fund custody.**

Security best practices:
- Never commit `.env` file with actual contract addresses
- Use environment variables for all sensitive configuration
- CORS is configured to only accept requests from `FRONTEND_ORIGIN`
- All input is validated and sanitized
- WebSocket messages are validated before processing

## Testing

Run tests with:

```bash
npm test
```

## Development

### Project Structure

```
z3ro/backend/
├── server.js              # Main Express server
├── indexer.js             # Event indexer and listener
├── db/
│   └── store.js          # SQLite database interface
├── routes/
│   ├── offers.js         # Offer endpoints
│   ├── orderbook.js      # Order book endpoints
│   └── stats.js          # Statistics endpoints
├── package.json          # Dependencies
├── .env.example          # Example environment file
└── README.md             # This file
```

### Adding New Endpoints

1. Create a new file in `routes/`
2. Define Express router with endpoints
3. Import and mount in `server.js`

Example:

```javascript
// routes/newroute.js
import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, data: [] });
});

export default router;
```

```javascript
// server.js
import newRouter from './routes/newroute.js';
app.use('/api/newroute', newRouter);
```

## Troubleshooting

### Indexer Not Receiving Events

- Verify contract addresses in `.env`
- Check Flow network is accessible
- Review logs for connection errors
- Ensure FCL is configured with correct access node

### Database Lock Errors

- These are typically temporary with WAL mode
- Server will retry operations automatically
- Increase `pragma synchronous` if needed

### WebSocket Connection Failed

- Verify CORS origin configuration
- Check firewall/proxy settings
- Ensure WebSocket path is `/ws`

## License

MIT

## Support

For issues or questions, please refer to the Z3RO documentation or open an issue in the repository.
