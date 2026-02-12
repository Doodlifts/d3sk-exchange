import * as fcl from '@onflow/fcl';
import { EventEmitter } from 'events';
import * as store from './db/store.js';

class D3SKIndexer extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      flowNetwork: process.env.FLOW_NETWORK || 'testnet',
      flowAccessNode: process.env.FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org',
      d3skOfferAddress: process.env.D3SK_OFFER_ADDRESS || '0x0',
      d3skRegistryAddress: process.env.D3SK_REGISTRY_ADDRESS || '0x0',
      pollingInterval: config.pollingInterval || 5000,
      ...config
    };

    this.isRunning = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.baseReconnectDelay = 1000;
    this.subscriptions = [];

    this.setupFCL();
  }

  /**
   * Configure Flow Client Library
   */
  setupFCL() {
    fcl
      .config()
      .put('flow.network', this.config.flowNetwork)
      .put('accessNode.api', this.config.flowAccessNode);
  }

  /**
   * Start the indexer
   */
  async start() {
    if (this.isRunning) {
      console.warn('Indexer is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting D3SK Indexer...');
    console.log(`Network: ${this.config.flowNetwork}`);
    console.log(`Access Node: ${this.config.flowAccessNode}`);

    try {
      await this.subscribeToEvents();
      this.reconnectAttempts = 0;
      console.log('D3SK Indexer started successfully');
      this.emit('started');
    } catch (error) {
      console.error('Error starting indexer:', error);
      this.handleReconnect();
    }
  }

  /**
   * Subscribe to D3SK contract events
   */
  async subscribeToEvents() {
    const eventMap = {
      [`A.${this.config.d3skOfferAddress}.D3SKOffer.OfferCreated`]: this.handleOfferCreated.bind(this),
      [`A.${this.config.d3skOfferAddress}.D3SKOffer.OfferFilled`]: this.handleOfferFilled.bind(this),
      [`A.${this.config.d3skOfferAddress}.D3SKOffer.OfferCancelled`]: this.handleOfferCancelled.bind(this),
      [`A.${this.config.d3skRegistryAddress}.D3SKRegistry.OfferRegistered`]: this.handleOfferRegistered.bind(this),
      [`A.${this.config.d3skRegistryAddress}.D3SKRegistry.OfferRemoved`]: this.handleOfferRemoved.bind(this)
    };

    // Subscribe to each event
    for (const [eventType, handler] of Object.entries(eventMap)) {
      try {
        const subscription = fcl
          .events(eventType)
          .subscribe({
            onNext: handler,
            onComplete: () => {
              console.log(`Event subscription completed: ${eventType}`);
            },
            onError: (error) => {
              console.error(`Event subscription error for ${eventType}:`, error);
              this.handleReconnect();
            }
          });

        this.subscriptions.push(subscription);
        console.log(`Subscribed to ${eventType}`);
      } catch (error) {
        console.error(`Failed to subscribe to ${eventType}:`, error);
      }
    }

    // Poll blockchain for historical events if needed
    await this.pollHistoricalEvents();
  }

  /**
   * Poll for historical events since last synced height
   */
  async pollHistoricalEvents() {
    try {
      const lastHeight = store.getLastSyncedHeight();
      console.log(`Last synced block height: ${lastHeight}`);

      // Get current block height
      const block = await fcl.latestBlock();
      const currentHeight = block.height;

      if (lastHeight < currentHeight) {
        console.log(`Catching up from block ${lastHeight} to ${currentHeight}...`);
        // Note: Actual event query would depend on Flow's event API
        // This is a placeholder for the polling logic
      }

      store.setLastSyncedHeight(currentHeight);
    } catch (error) {
      console.error('Error polling historical events:', error);
    }
  }

  /**
   * Handle OfferCreated event
   */
  async handleOfferCreated(event) {
    try {
      const { id, maker, sellType, sellAmount, askType, askAmount, price } = event.data;

      const offer = {
        id,
        maker,
        sell_type: sellType,
        sell_amount: sellAmount,
        ask_type: askType,
        ask_amount: askAmount,
        price: parseFloat(price),
        created_at: event.timestamp || Date.now()
      };

      store.addOffer(offer);
      console.log(`Offer created: ${id} by ${maker}`);

      this.emit('offer_created', offer);
    } catch (error) {
      console.error('Error handling OfferCreated:', error);
    }
  }

  /**
   * Handle OfferFilled event
   */
  async handleOfferFilled(event) {
    try {
      const { offerId, taker, sellAmount, askAmount, price } = event.data;

      // Mark offer as filled
      store.removeOffer(offerId, 'filled', taker);

      // Add trade record
      const offer = store.getOfferById(offerId);
      if (offer) {
        const trade = {
          offer_id: offerId,
          maker: offer.maker,
          taker,
          sell_type: offer.sell_type,
          sell_amount: sellAmount,
          ask_type: offer.ask_type,
          ask_amount: askAmount,
          price: parseFloat(price),
          timestamp: event.timestamp || Date.now()
        };

        store.addTrade(trade);
        console.log(`Offer filled: ${offerId} by ${taker}`);

        this.emit('offer_filled', {
          offerId,
          taker,
          trade
        });
      }
    } catch (error) {
      console.error('Error handling OfferFilled:', error);
    }
  }

  /**
   * Handle OfferCancelled event
   */
  async handleOfferCancelled(event) {
    try {
      const { offerId } = event.data;

      store.removeOffer(offerId, 'cancelled');
      console.log(`Offer cancelled: ${offerId}`);

      this.emit('offer_cancelled', { offerId });
    } catch (error) {
      console.error('Error handling OfferCancelled:', error);
    }
  }

  /**
   * Handle OfferRegistered event (registry)
   */
  async handleOfferRegistered(event) {
    try {
      const { offerId, maker, sellType, sellAmount, askType, askAmount } = event.data;

      const offer = {
        id: offerId,
        maker,
        sell_type: sellType,
        sell_amount: sellAmount,
        ask_type: askType,
        ask_amount: askAmount,
        price: parseFloat(sellAmount) / parseFloat(askAmount),
        created_at: event.timestamp || Date.now()
      };

      store.addOffer(offer);
      console.log(`Offer registered: ${offerId} by ${maker}`);

      this.emit('offer_registered', offer);
    } catch (error) {
      console.error('Error handling OfferRegistered:', error);
    }
  }

  /**
   * Handle OfferRemoved event (registry)
   */
  async handleOfferRemoved(event) {
    try {
      const { offerId, reason } = event.data;

      store.removeOffer(offerId, reason || 'cancelled');
      console.log(`Offer removed: ${offerId} (${reason})`);

      this.emit('offer_removed', { offerId, reason });
    } catch (error) {
      console.error('Error handling OfferRemoved:', error);
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached. Stopping indexer.');
      this.isRunning = false;
      this.emit('failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    const maxDelay = 60000; // 1 minute max

    console.log(
      `Reconnecting in ${Math.min(delay, maxDelay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      if (this.isRunning) {
        this.start().catch(error => {
          console.error('Reconnection failed:', error);
          this.handleReconnect();
        });
      }
    }, Math.min(delay, maxDelay));
  }

  /**
   * Stop the indexer
   */
  async stop() {
    console.log('Stopping D3SK Indexer...');
    this.isRunning = false;

    // Unsubscribe from all events
    for (const subscription of this.subscriptions) {
      try {
        if (typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    }

    this.subscriptions = [];
    this.removeAllListeners();
    console.log('D3SK Indexer stopped');
    this.emit('stopped');
  }

  /**
   * Get indexer status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      activeSubscriptions: this.subscriptions.length,
      config: {
        flowNetwork: this.config.flowNetwork,
        flowAccessNode: this.config.flowAccessNode
      }
    };
  }
}

export default D3SKIndexer;
