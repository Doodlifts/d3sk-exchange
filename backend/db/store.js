import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'd3sk.db');

let db = null;

/**
 * Initialize and return the SQLite database instance
 */
function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    initializeTables();
  }
  return db;
}

/**
 * Create tables if they don't exist
 */
function initializeTables() {
  const database = getDb();

  // Offers table
  database.exec(`
    CREATE TABLE IF NOT EXISTS offers (
      id TEXT PRIMARY KEY,
      maker TEXT NOT NULL,
      sell_type TEXT NOT NULL,
      sell_amount TEXT NOT NULL,
      ask_type TEXT NOT NULL,
      ask_amount TEXT NOT NULL,
      price REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL,
      expires_at INTEGER,
      filled_at INTEGER,
      cancelled_at INTEGER,
      taker TEXT,
      UNIQUE(id)
    );
    CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
    CREATE INDEX IF NOT EXISTS idx_offers_maker ON offers(maker);
    CREATE INDEX IF NOT EXISTS idx_offers_pair ON offers(sell_type, ask_type);
    CREATE INDEX IF NOT EXISTS idx_offers_price ON offers(price);
    CREATE INDEX IF NOT EXISTS idx_offers_created_at ON offers(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_offers_expires_at ON offers(expires_at);
  `);

  // Trades table
  database.exec(`
    CREATE TABLE IF NOT EXISTS trades (
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
    CREATE INDEX IF NOT EXISTS idx_trades_offer_id ON trades(offer_id);
    CREATE INDEX IF NOT EXISTS idx_trades_maker ON trades(maker);
    CREATE INDEX IF NOT EXISTS idx_trades_taker ON trades(taker);
    CREATE INDEX IF NOT EXISTS idx_trades_pair ON trades(sell_type, ask_type);
    CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp DESC);
  `);

  // Sync state table
  database.exec(`
    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      UNIQUE(key)
    );
  `);
}

/**
 * Add a new offer to the database
 */
function addOffer(offer) {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO offers (
      id, maker, sell_type, sell_amount, ask_type, ask_amount,
      price, status, created_at, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    stmt.run(
      offer.id,
      offer.maker,
      offer.sell_type,
      offer.sell_amount.toString(),
      offer.ask_type,
      offer.ask_amount.toString(),
      offer.price,
      'active',
      offer.created_at || Date.now(),
      offer.expires_at || null
    );
    return true;
  } catch (error) {
    console.error('Error adding offer:', error);
    return false;
  }
}

/**
 * Remove/cancel an offer
 */
function removeOffer(id, reason, taker = null) {
  const database = getDb();
  const stmt = database.prepare(`
    UPDATE offers
    SET status = ?, ${reason === 'filled' ? 'filled_at' : 'cancelled_at'} = ?, taker = ?
    WHERE id = ?
  `);

  try {
    const status = reason === 'filled' ? 'filled' : 'cancelled';
    stmt.run(status, Date.now(), taker, id);
    return true;
  } catch (error) {
    console.error('Error removing offer:', error);
    return false;
  }
}

/**
 * Get active offers with optional filters
 */
function getActiveOffers(filters = {}) {
  const database = getDb();
  let query = 'SELECT * FROM offers WHERE status = "active"';
  const params = [];

  if (filters.pair) {
    const [sellType, askType] = filters.pair.split('-');
    query += ' AND sell_type = ? AND ask_type = ?';
    params.push(sellType, askType);
  }

  if (filters.maker) {
    query += ' AND maker = ?';
    params.push(filters.maker);
  }

  if (filters.minPrice !== undefined) {
    query += ' AND price >= ?';
    params.push(filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    query += ' AND price <= ?';
    params.push(filters.maxPrice);
  }

  // Sorting
  const sortMap = {
    'price_asc': 'price ASC',
    'price_desc': 'price DESC',
    'newest': 'created_at DESC',
    'oldest': 'created_at ASC'
  };
  const sortBy = sortMap[filters.sort] || 'created_at DESC';
  query += ` ORDER BY ${sortBy}`;

  // Pagination
  const limit = Math.min(filters.limit || 100, 1000);
  const offset = filters.offset || 0;
  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const stmt = database.prepare(query);
  return stmt.all(...params);
}

/**
 * Get a single offer by ID
 */
function getOfferById(id) {
  const database = getDb();
  const stmt = database.prepare('SELECT * FROM offers WHERE id = ?');
  return stmt.get(id) || null;
}

/**
 * Get all offers by a maker
 */
function getOffersByMaker(maker) {
  const database = getDb();
  const stmt = database.prepare(
    'SELECT * FROM offers WHERE maker = ? ORDER BY created_at DESC'
  );
  return stmt.all(maker);
}

/**
 * Get formatted order book for a trading pair
 */
function getOrderBook(pair) {
  const database = getDb();
  const [sellType, askType] = pair.split('-');

  const stmt = database.prepare(`
    SELECT price, COUNT(*) as count,
           SUM(CAST(sell_amount AS REAL)) as total_sell_amount
    FROM offers
    WHERE status = 'active' AND sell_type = ? AND ask_type = ?
    GROUP BY price
    ORDER BY price ASC
  `);

  const bids = stmt.all(sellType, askType);

  const asks = stmt.all(askType, sellType);

  return {
    pair,
    bids: bids.map(b => ({
      price: b.price,
      count: b.count,
      amount: b.total_sell_amount
    })),
    asks: asks.map(a => ({
      price: a.price,
      count: a.count,
      amount: a.total_sell_amount
    }))
  };
}

/**
 * Get all distinct trading pairs
 */
function getPairs() {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT DISTINCT CONCAT(sell_type, '-', ask_type) as pair
    FROM offers
    WHERE status = 'active'
    ORDER BY pair ASC
  `);

  return stmt.all().map(row => row.pair);
}

/**
 * Get recent completed trades
 */
function getRecentTrades(limit = 100, pair = null) {
  const database = getDb();
  let query = 'SELECT * FROM trades';
  const params = [];

  if (pair) {
    const [sellType, askType] = pair.split('-');
    query += ' WHERE sell_type = ? AND ask_type = ?';
    params.push(sellType, askType);
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(Math.min(limit, 1000));

  const stmt = database.prepare(query);
  return stmt.all(...params);
}

/**
 * Add a completed trade
 */
function addTrade(trade) {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO trades (
      offer_id, maker, taker, sell_type, sell_amount, ask_type, ask_amount, price, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    stmt.run(
      trade.offer_id,
      trade.maker,
      trade.taker,
      trade.sell_type,
      trade.sell_amount.toString(),
      trade.ask_type,
      trade.ask_amount.toString(),
      trade.price,
      trade.timestamp || Date.now()
    );
    return true;
  } catch (error) {
    console.error('Error adding trade:', error);
    return false;
  }
}

/**
 * Get aggregate statistics
 */
function getStats(timeframeMs = 24 * 60 * 60 * 1000) {
  const database = getDb();
  const since = Date.now() - timeframeMs;

  // Total active offers
  const activeStmt = database.prepare(
    'SELECT COUNT(*) as count FROM offers WHERE status = "active"'
  );
  const activeCount = activeStmt.get().count;

  // Total trades
  const tradeCountStmt = database.prepare(
    'SELECT COUNT(*) as count FROM trades'
  );
  const totalTrades = tradeCountStmt.get().count;

  // Recent trades count
  const recentTradesStmt = database.prepare(
    'SELECT COUNT(*) as count FROM trades WHERE timestamp >= ?'
  );
  const recentTrades = recentTradesStmt.get(since).count;

  // Volume in last 24h
  const volumeStmt = database.prepare(`
    SELECT SUM(CAST(sell_amount AS REAL)) as volume FROM trades WHERE timestamp >= ?
  `);
  const volume = volumeStmt.get(since).volume || 0;

  // Active trading pairs
  const pairsStmt = database.prepare(`
    SELECT COUNT(DISTINCT CONCAT(sell_type, '-', ask_type)) as count FROM offers WHERE status = 'active'
  `);
  const activePairs = pairsStmt.get().count;

  return {
    active_offers: activeCount,
    total_trades: totalTrades,
    trades_24h: recentTrades,
    volume_24h: volume,
    active_pairs: activePairs,
    timestamp: Date.now()
  };
}

/**
 * Get the last synced block height
 */
function getLastSyncedHeight() {
  const database = getDb();
  const stmt = database.prepare('SELECT value FROM sync_state WHERE key = ?');
  const result = stmt.get('last_block_height');
  return result ? parseInt(result.value, 10) : 0;
}

/**
 * Set the last synced block height
 */
function setLastSyncedHeight(height) {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO sync_state (key, value) VALUES (?, ?)
  `);

  try {
    stmt.run('last_block_height', height.toString());
    return true;
  } catch (error) {
    console.error('Error setting sync height:', error);
    return false;
  }
}

/**
 * Close the database connection
 */
function close() {
  if (db) {
    db.close();
    db = null;
  }
}

export {
  getDb,
  addOffer,
  removeOffer,
  getActiveOffers,
  getOfferById,
  getOffersByMaker,
  getOrderBook,
  getPairs,
  getRecentTrades,
  addTrade,
  getStats,
  getLastSyncedHeight,
  setLastSyncedHeight,
  close
};
