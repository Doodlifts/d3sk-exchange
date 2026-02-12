import express from 'express';
import * as store from '../db/store.js';

const router = express.Router();

/**
 * GET /api/orderbook/:pair
 * Get formatted order book for a trading pair
 *
 * Params:
 * - pair: Trading pair (e.g., 'USDC-FLOW')
 *
 * Returns:
 * {
 *   pair: 'USDC-FLOW',
 *   bids: [{ price, count, amount }, ...],
 *   asks: [{ price, count, amount }, ...],
 *   timestamp: <unix timestamp>
 * }
 */
router.get('/:pair', (req, res) => {
  try {
    const { pair } = req.params;

    if (!pair || typeof pair !== 'string') {
      return res.status(400).json({ error: 'Invalid trading pair' });
    }

    // Validate pair format (SYMBOL-SYMBOL)
    const pairRegex = /^[A-Z0-9]+-[A-Z0-9]+$/;
    if (!pairRegex.test(pair)) {
      return res.status(400).json({ error: 'Invalid pair format. Expected SYMBOL-SYMBOL' });
    }

    const orderBook = store.getOrderBook(pair);

    res.json({
      success: true,
      data: {
        ...orderBook,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error fetching order book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/pairs
 * Get all available trading pairs
 *
 * Returns:
 * {
 *   pairs: ['USDC-FLOW', 'USDC-WBTC', ...],
 *   count: 5
 * }
 */
router.get('/', (req, res) => {
  try {
    const pairs = store.getPairs();

    res.json({
      success: true,
      data: {
        pairs,
        count: pairs.length,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error fetching pairs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
