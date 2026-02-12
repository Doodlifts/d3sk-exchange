import express from 'express';
import * as store from '../db/store.js';

const router = express.Router();

/**
 * GET /api/offers
 * Get all active offers with optional filtering
 *
 * Query parameters:
 * - pair: Trading pair (e.g., 'USDC-FLOW')
 * - maker: Maker address
 * - minPrice: Minimum price
 * - maxPrice: Maximum price
 * - sort: Sort by 'price_asc', 'price_desc', 'newest', 'oldest'
 * - limit: Number of results (max 1000, default 100)
 * - offset: Pagination offset (default 0)
 */
router.get('/', (req, res) => {
  try {
    const filters = {
      pair: req.query.pair,
      maker: req.query.maker,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      sort: req.query.sort || 'newest',
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 100,
      offset: req.query.offset ? parseInt(req.query.offset, 10) : 0
    };

    // Validate filters
    if (filters.minPrice !== undefined && isNaN(filters.minPrice)) {
      return res.status(400).json({ error: 'Invalid minPrice' });
    }
    if (filters.maxPrice !== undefined && isNaN(filters.maxPrice)) {
      return res.status(400).json({ error: 'Invalid maxPrice' });
    }
    if (isNaN(filters.limit) || filters.limit < 1 || filters.limit > 1000) {
      filters.limit = 100;
    }
    if (isNaN(filters.offset) || filters.offset < 0) {
      filters.offset = 0;
    }

    const offers = store.getActiveOffers(filters);

    res.json({
      success: true,
      data: offers,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        count: offers.length
      }
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/offers/:id
 * Get a single offer by ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid offer ID' });
    }

    const offer = store.getOfferById(id);

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    res.json({
      success: true,
      data: offer
    });
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/offers/maker/:maker
 * Get all offers from a specific maker
 */
router.get('/maker/:maker', (req, res) => {
  try {
    const { maker } = req.params;

    if (!maker || typeof maker !== 'string') {
      return res.status(400).json({ error: 'Invalid maker address' });
    }

    const offers = store.getOffersByMaker(maker);

    res.json({
      success: true,
      data: offers,
      count: offers.length
    });
  } catch (error) {
    console.error('Error fetching maker offers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
