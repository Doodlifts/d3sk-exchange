import express from 'express';
import * as store from '../db/store.js';

const router = express.Router();

/**
 * GET /api/trades
 * Get recent completed trades
 *
 * Query parameters:
 * - pair: Filter by trading pair (e.g., 'USDC-FLOW')
 * - limit: Number of trades to return (max 1000, default 100)
 *
 * Returns:
 * {
 *   trades: [...],
 *   count: <number>,
 *   timestamp: <unix timestamp>
 * }
 */
router.get('/trades', (req, res) => {
  try {
    const pair = req.query.pair;
    let limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      limit = 100;
    }

    // Validate pair format if provided
    if (pair) {
      const pairRegex = /^[A-Z0-9]+-[A-Z0-9]+$/;
      if (!pairRegex.test(pair)) {
        return res.status(400).json({ error: 'Invalid pair format. Expected SYMBOL-SYMBOL' });
      }
    }

    const trades = store.getRecentTrades(limit, pair);

    res.json({
      success: true,
      data: {
        trades,
        count: trades.length,
        pair: pair || null,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/stats
 * Get aggregate statistics
 *
 * Query parameters:
 * - timeframe: Time window in milliseconds for volume calculation (default 24h)
 *
 * Returns:
 * {
 *   active_offers: <number>,
 *   total_trades: <number>,
 *   trades_24h: <number>,
 *   volume_24h: <number>,
 *   active_pairs: <number>,
 *   timestamp: <unix timestamp>
 * }
 */
router.get('/stats', (req, res) => {
  try {
    let timeframeMs = 24 * 60 * 60 * 1000; // Default 24 hours

    // Parse timeframe if provided
    if (req.query.timeframe) {
      const tf = parseInt(req.query.timeframe, 10);
      if (!isNaN(tf) && tf > 0) {
        // Cap at 30 days
        timeframeMs = Math.min(tf, 30 * 24 * 60 * 60 * 1000);
      }
    }

    const stats = store.getStats(timeframeMs);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
