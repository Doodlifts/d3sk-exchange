// Token registry for all supported Flow tokens
// Any FungibleToken on Flow can be traded — this registry provides metadata
// for the most common tokens. Unknown tokens are handled gracefully.
// Source: Official Flow Token List (onflow/assets)

export const TOKEN_REGISTRY = {
  // ═══════════════════════════════════════════════════
  // Native Flow Tokens
  // ═══════════════════════════════════════════════════
  FLOW: {
    testnet: 'A.7e60df042a9c0868.FlowToken.Vault',
    mainnet: 'A.1654653399040a61.FlowToken.Vault',
    label: 'FLOW',
    contractName: 'FlowToken',
    contractAddress: { testnet: '0x7e60df042a9c0868', mainnet: '0x1654653399040a61' },
    storagePath: '/storage/flowTokenVault',
    receiverPath: '/public/flowTokenReceiver',
    vaultType: 'FlowToken.Vault',
    icon: '◎',
    coingeckoId: 'flow',
    decimals: 8,
    description: 'Native Flow token',
  },
  stFLOW: {
    testnet: null,
    mainnet: 'A.d6f80565193ad727.stFlowToken.Vault',
    label: 'stFLOW',
    contractName: 'stFlowToken',
    contractAddress: { testnet: null, mainnet: '0xd6f80565193ad727' },
    storagePath: '/storage/stFlowTokenVault',
    receiverPath: '/public/stFlowTokenReceiver',
    vaultType: 'stFlowToken.Vault',
    icon: '⚡',
    coingeckoId: null,
    decimals: 8,
    description: 'Liquid Staked Flow (IncrementFi)',
  },
  ankrFLOW: {
    testnet: null,
    mainnet: 'A.1e4aa0b87d10b141.EVMVMBridgedToken_1b97100ea1d7126c4d60027e231ea4cb25314bdb.Vault',
    label: 'ankrFLOW',
    contractName: 'EVMVMBridgedToken_1b97100ea1d7126c4d60027e231ea4cb25314bdb',
    contractAddress: { testnet: null, mainnet: '0x1e4aa0b87d10b141' },
    storagePath: '/storage/EVMVMBridgedToken_1b97100ea1d7126c4d60027e231ea4cb25314bdbVault',
    receiverPath: '/public/EVMVMBridgedToken_1b97100ea1d7126c4d60027e231ea4cb25314bdbReceiver',
    vaultType: 'EVMVMBridgedToken_1b97100ea1d7126c4d60027e231ea4cb25314bdb.Vault',
    icon: '⚓',
    coingeckoId: 'ankr-staked-flow',
    decimals: 8,
    description: 'Ankr Staked FLOW',
  },

  // ═══════════════════════════════════════════════════
  // Stablecoins
  // ═══════════════════════════════════════════════════
  PYUSD: {
    // PYUSD0 — PayPal USD via LayerZero
    testnet: null,
    mainnet: 'A.1e4aa0b87d10b141.EVMVMBridgedToken_99af3eea856556646c98c8b9b2548fe815240750.Vault',
    label: 'PYUSD',
    contractName: 'EVMVMBridgedToken_99af3eea856556646c98c8b9b2548fe815240750',
    contractAddress: { testnet: null, mainnet: '0x1e4aa0b87d10b141' },
    storagePath: '/storage/EVMVMBridgedToken_99af3eea856556646c98c8b9b2548fe815240750Vault',
    receiverPath: '/public/EVMVMBridgedToken_99af3eea856556646c98c8b9b2548fe815240750Receiver',
    vaultType: 'EVMVMBridgedToken_99af3eea856556646c98c8b9b2548fe815240750.Vault',
    icon: '₱',
    coingeckoId: 'paypal-usd',
    isStablecoin: true,
    decimals: 8,
    description: 'PayPal USD on Flow',
  },
  USDC_E: {
    // USDCFlow — Standard Bridged USDC (Circle)
    testnet: null,
    mainnet: 'A.f1ab99c82dee3526.USDCFlow.Vault',
    label: 'USDC.e',
    contractName: 'USDCFlow',
    contractAddress: { testnet: null, mainnet: '0xf1ab99c82dee3526' },
    storagePath: '/storage/usdcFlowVault',
    receiverPath: '/public/usdcFlowReceiver',
    vaultType: 'USDCFlow.Vault',
    icon: '$',
    coingeckoId: 'celer-bridged-usdc-flow-evm',
    isStablecoin: true,
    decimals: 8,
    description: 'Bridged USDC (Circle)',
  },
  USDC: {
    // USDC bridged from EVM on Flow
    testnet: null,
    mainnet: 'A.1e4aa0b87d10b141.EVMVMBridgedToken_f1815bd50389c46847f0bda824ec8da914045d14.Vault',
    label: 'USDC',
    contractName: 'EVMVMBridgedToken_f1815bd50389c46847f0bda824ec8da914045d14',
    contractAddress: { testnet: null, mainnet: '0x1e4aa0b87d10b141' },
    storagePath: '/storage/EVMVMBridgedToken_f1815bd50389c46847f0bda824ec8da914045d14Vault',
    receiverPath: '/public/EVMVMBridgedToken_f1815bd50389c46847f0bda824ec8da914045d14Receiver',
    vaultType: 'EVMVMBridgedToken_f1815bd50389c46847f0bda824ec8da914045d14.Vault',
    icon: '$',
    coingeckoId: 'usd-coin',
    isStablecoin: true,
    decimals: 8,
    description: 'USDC (EVM Bridged)',
  },
  USDF: {
    // USD Flow — stablecoin
    testnet: null,
    mainnet: 'A.1e4aa0b87d10b141.EVMVMBridgedToken_2aabea2058b5ac2d339b163c6ab6f2b6d53aabed.Vault',
    label: 'USDF',
    contractName: 'EVMVMBridgedToken_2aabea2058b5ac2d339b163c6ab6f2b6d53aabed',
    contractAddress: { testnet: null, mainnet: '0x1e4aa0b87d10b141' },
    storagePath: '/storage/EVMVMBridgedToken_2aabea2058b5ac2d339b163c6ab6f2b6d53aabedVault',
    receiverPath: '/public/EVMVMBridgedToken_2aabea2058b5ac2d339b163c6ab6f2b6d53aabedReceiver',
    vaultType: 'EVMVMBridgedToken_2aabea2058b5ac2d339b163c6ab6f2b6d53aabed.Vault',
    icon: 'ƒ',
    coingeckoId: 'flow-bridged-pyusd-flow',
    isStablecoin: true,
    decimals: 8,
    description: 'USD Flow',
  },
  stgUSDT: {
    // Bridged USDT via Stargate
    testnet: null,
    mainnet: 'A.1e4aa0b87d10b141.EVMVMBridgedToken_674843c06ff83502ddb4d37c2e09c01cda38cbc8.Vault',
    label: 'stgUSDT',
    contractName: 'EVMVMBridgedToken_674843c06ff83502ddb4d37c2e09c01cda38cbc8',
    contractAddress: { testnet: null, mainnet: '0x1e4aa0b87d10b141' },
    storagePath: '/storage/EVMVMBridgedToken_674843c06ff83502ddb4d37c2e09c01cda38cbc8Vault',
    receiverPath: '/public/EVMVMBridgedToken_674843c06ff83502ddb4d37c2e09c01cda38cbc8Receiver',
    vaultType: 'EVMVMBridgedToken_674843c06ff83502ddb4d37c2e09c01cda38cbc8.Vault',
    icon: '₮',
    coingeckoId: 'tether',
    isStablecoin: true,
    decimals: 8,
    description: 'Bridged USDT (Stargate)',
  },

  // ═══════════════════════════════════════════════════
  // Major Crypto (EVM Bridged)
  // ═══════════════════════════════════════════════════
  stgWETH: {
    // Bridged WETH via Stargate
    testnet: null,
    mainnet: 'A.1e4aa0b87d10b141.EVMVMBridgedToken_2f6f07cdcf3588944bf4c42ac74ff24bf56e7590.Vault',
    label: 'stgWETH',
    contractName: 'EVMVMBridgedToken_2f6f07cdcf3588944bf4c42ac74ff24bf56e7590',
    contractAddress: { testnet: null, mainnet: '0x1e4aa0b87d10b141' },
    storagePath: '/storage/EVMVMBridgedToken_2f6f07cdcf3588944bf4c42ac74ff24bf56e7590Vault',
    receiverPath: '/public/EVMVMBridgedToken_2f6f07cdcf3588944bf4c42ac74ff24bf56e7590Receiver',
    vaultType: 'EVMVMBridgedToken_2f6f07cdcf3588944bf4c42ac74ff24bf56e7590.Vault',
    icon: 'Ξ',
    coingeckoId: 'stargate-bridged-weth-flow',
    decimals: 8,
    description: 'Bridged WETH (Stargate)',
  },
  WBTC: {
    // Wrapped BTC (EVM bridged)
    testnet: null,
    mainnet: 'A.1e4aa0b87d10b141.EVMVMBridgedToken_717dae2baf7656be9a9b01dee31d571a9d4c9579.Vault',
    label: 'WBTC',
    contractName: 'EVMVMBridgedToken_717dae2baf7656be9a9b01dee31d571a9d4c9579',
    contractAddress: { testnet: null, mainnet: '0x1e4aa0b87d10b141' },
    storagePath: '/storage/EVMVMBridgedToken_717dae2baf7656be9a9b01dee31d571a9d4c9579Vault',
    receiverPath: '/public/EVMVMBridgedToken_717dae2baf7656be9a9b01dee31d571a9d4c9579Receiver',
    vaultType: 'EVMVMBridgedToken_717dae2baf7656be9a9b01dee31d571a9d4c9579.Vault',
    icon: '₿',
    coingeckoId: 'wrapped-bitcoin',
    decimals: 8,
    description: 'Wrapped BTC',
  },
  cbBTC: {
    // Coinbase Wrapped BTC
    testnet: null,
    mainnet: 'A.1e4aa0b87d10b141.EVMVMBridgedToken_a0197b2044d28b08be34d98b23c9312158ea9a18.Vault',
    label: 'cbBTC',
    contractName: 'EVMVMBridgedToken_a0197b2044d28b08be34d98b23c9312158ea9a18',
    contractAddress: { testnet: null, mainnet: '0x1e4aa0b87d10b141' },
    storagePath: '/storage/EVMVMBridgedToken_a0197b2044d28b08be34d98b23c9312158ea9a18Vault',
    receiverPath: '/public/EVMVMBridgedToken_a0197b2044d28b08be34d98b23c9312158ea9a18Receiver',
    vaultType: 'EVMVMBridgedToken_a0197b2044d28b08be34d98b23c9312158ea9a18.Vault',
    icon: '₿',
    coingeckoId: null,
    decimals: 8,
    description: 'Coinbase Wrapped BTC',
  },

  // ═══════════════════════════════════════════════════
  // Memecoins (CryptoKitties / Flow EVM)
  // ═══════════════════════════════════════════════════
  BART: {
    testnet: null,
    mainnet: 'A.1e4aa0b87d10b141.EVMVMBridgedToken_7296ebca325e835eb6c1b690484cf6fb4c396d2c.Vault',
    label: 'Bart',
    contractName: 'EVMVMBridgedToken_7296ebca325e835eb6c1b690484cf6fb4c396d2c',
    contractAddress: { testnet: null, mainnet: '0x1e4aa0b87d10b141' },
    storagePath: '/storage/EVMVMBridgedToken_7296ebca325e835eb6c1b690484cf6fb4c396d2cVault',
    receiverPath: '/public/EVMVMBridgedToken_7296ebca325e835eb6c1b690484cf6fb4c396d2cReceiver',
    vaultType: 'EVMVMBridgedToken_7296ebca325e835eb6c1b690484cf6fb4c396d2c.Vault',
    icon: '🐱',
    coingeckoId: 'bartholowmeow',
    decimals: 8,
    description: 'Bartholomeow',
  },
  GANGGANG: {
    testnet: null,
    mainnet: 'A.1e4aa0b87d10b141.EVMVMBridgedToken_8bd75008361517df04aa3ea033f03ba33c0c0a66.Vault',
    label: 'GangGang',
    contractName: 'EVMVMBridgedToken_8bd75008361517df04aa3ea033f03ba33c0c0a66',
    contractAddress: { testnet: null, mainnet: '0x1e4aa0b87d10b141' },
    storagePath: '/storage/EVMVMBridgedToken_8bd75008361517df04aa3ea033f03ba33c0c0a66Vault',
    receiverPath: '/public/EVMVMBridgedToken_8bd75008361517df04aa3ea033f03ba33c0c0a66Receiver',
    vaultType: 'EVMVMBridgedToken_8bd75008361517df04aa3ea033f03ba33c0c0a66.Vault',
    icon: '🔥',
    coingeckoId: 'ganggang',
    decimals: 8,
    description: 'GangGang',
  },
  HOTCOCOA: {
    testnet: null,
    mainnet: 'A.1e4aa0b87d10b141.EVMVMBridgedToken_6a64e027e3f6a94acbdcf39cf0cbb4bead5f5ecb.Vault',
    label: 'HotCocoa',
    contractName: 'EVMVMBridgedToken_6a64e027e3f6a94acbdcf39cf0cbb4bead5f5ecb',
    contractAddress: { testnet: null, mainnet: '0x1e4aa0b87d10b141' },
    storagePath: '/storage/EVMVMBridgedToken_6a64e027e3f6a94acbdcf39cf0cbb4bead5f5ecbVault',
    receiverPath: '/public/EVMVMBridgedToken_6a64e027e3f6a94acbdcf39cf0cbb4bead5f5ecbReceiver',
    vaultType: 'EVMVMBridgedToken_6a64e027e3f6a94acbdcf39cf0cbb4bead5f5ecb.Vault',
    icon: '☕',
    coingeckoId: 'hotcocoa',
    decimals: 8,
    description: 'HotCocoa',
  },
  PAWDERICK: {
    testnet: null,
    mainnet: 'A.1e4aa0b87d10b141.EVMVMBridgedToken_10448481630fb6d20b597e5b3d7e42dcb1247c8a.Vault',
    label: 'Pawderick',
    contractName: 'EVMVMBridgedToken_10448481630fb6d20b597e5b3d7e42dcb1247c8a',
    contractAddress: { testnet: null, mainnet: '0x1e4aa0b87d10b141' },
    storagePath: '/storage/EVMVMBridgedToken_10448481630fb6d20b597e5b3d7e42dcb1247c8aVault',
    receiverPath: '/public/EVMVMBridgedToken_10448481630fb6d20b597e5b3d7e42dcb1247c8aReceiver',
    vaultType: 'EVMVMBridgedToken_10448481630fb6d20b597e5b3d7e42dcb1247c8a.Vault',
    icon: '🐾',
    coingeckoId: 'pawderick',
    decimals: 8,
    description: 'Pawderick',
  },
  CATSEYE: {
    testnet: null,
    mainnet: 'A.1e4aa0b87d10b141.EVMVMBridgedToken_9b565507858812e8b5ffbfbde9b200a3bc2e8f76.Vault',
    label: 'Catseye',
    contractName: 'EVMVMBridgedToken_9b565507858812e8b5ffbfbde9b200a3bc2e8f76',
    contractAddress: { testnet: null, mainnet: '0x1e4aa0b87d10b141' },
    storagePath: '/storage/EVMVMBridgedToken_9b565507858812e8b5ffbfbde9b200a3bc2e8f76Vault',
    receiverPath: '/public/EVMVMBridgedToken_9b565507858812e8b5ffbfbde9b200a3bc2e8f76Receiver',
    vaultType: 'EVMVMBridgedToken_9b565507858812e8b5ffbfbde9b200a3bc2e8f76.Vault',
    icon: '👁',
    coingeckoId: 'catseye',
    decimals: 8,
    description: 'Catseye',
  },
  PURRZIVAL: {
    testnet: null,
    mainnet: 'A.1e4aa0b87d10b141.EVMVMBridgedToken_e8b7423b80f9af33480d365171c7ceda3586aa35.Vault',
    label: 'Purrzival',
    contractName: 'EVMVMBridgedToken_e8b7423b80f9af33480d365171c7ceda3586aa35',
    contractAddress: { testnet: null, mainnet: '0x1e4aa0b87d10b141' },
    storagePath: '/storage/EVMVMBridgedToken_e8b7423b80f9af33480d365171c7ceda3586aa35Vault',
    receiverPath: '/public/EVMVMBridgedToken_e8b7423b80f9af33480d365171c7ceda3586aa35Receiver',
    vaultType: 'EVMVMBridgedToken_e8b7423b80f9af33480d365171c7ceda3586aa35.Vault',
    icon: '⚔',
    coingeckoId: 'purrzival',
    decimals: 8,
    description: 'Purrzival',
  },
  GWENDOLION: {
    testnet: null,
    mainnet: 'A.1e4aa0b87d10b141.EVMVMBridgedToken_f45cbe30bd953590c9917799142edb05be3f293f.Vault',
    label: 'Gwendolion',
    contractName: 'EVMVMBridgedToken_f45cbe30bd953590c9917799142edb05be3f293f',
    contractAddress: { testnet: null, mainnet: '0x1e4aa0b87d10b141' },
    storagePath: '/storage/EVMVMBridgedToken_f45cbe30bd953590c9917799142edb05be3f293fVault',
    receiverPath: '/public/EVMVMBridgedToken_f45cbe30bd953590c9917799142edb05be3f293fReceiver',
    vaultType: 'EVMVMBridgedToken_f45cbe30bd953590c9917799142edb05be3f293f.Vault',
    icon: '🦁',
    coingeckoId: 'gwendolion',
    decimals: 8,
    description: 'Gwendolion',
  },

  // ═══════════════════════════════════════════════════
  // Deprecated / Legacy tokens (hidden from selector)
  // ═══════════════════════════════════════════════════
  USDC_LEGACY: {
    testnet: 'A.a983fecbed621163.FiatToken.Vault',
    mainnet: 'A.b19436aae4d94622.FiatToken.Vault',
    label: 'USDC (Legacy)',
    contractName: 'FiatToken',
    contractAddress: { testnet: '0xa983fecbed621163', mainnet: '0xb19436aae4d94622' },
    storagePath: '/storage/USDCVault',
    receiverPath: '/public/USDCVaultReceiver',
    vaultType: 'FiatToken.Vault',
    icon: '$',
    coingeckoId: 'usd-coin',
    isStablecoin: true,
    decimals: 8,
    description: 'Legacy USDC (FiatToken)',
    isDeprecated: true,
  },
  FUSD: {
    testnet: 'A.e223d8a629e49c68.FUSD.Vault',
    mainnet: 'A.3c5959b568896393.FUSD.Vault',
    label: 'FUSD',
    contractName: 'FUSD',
    contractAddress: { testnet: '0xe223d8a629e49c68', mainnet: '0x3c5959b568896393' },
    storagePath: '/storage/fusdVault',
    receiverPath: '/public/fusdReceiver',
    vaultType: 'FUSD.Vault',
    icon: 'ƒ',
    coingeckoId: null,
    isStablecoin: true,
    isDeprecated: true,
    decimals: 8,
    description: 'Flow USD (deprecated)',
  },
};

export const ALL_TOKEN_KEYS = Object.keys(TOKEN_REGISTRY);

// Get available (non-deprecated) token keys for current network
export function getAvailableTokenKeys(network) {
  return ALL_TOKEN_KEYS.filter(key => {
    const token = TOKEN_REGISTRY[key];
    if (token.isDeprecated) return false;
    const net = network === 'mainnet' ? 'mainnet' : 'testnet';
    return token[net] != null;
  });
}

// Get token type identifier for the current network
export function getTokenTypeId(tokenKey, network) {
  const token = TOKEN_REGISTRY[tokenKey];
  if (!token) return '';
  return token[network] || token.testnet;
}

// Get token config for Cadence transactions
export function getTokenConfig(tokenKey, network) {
  const token = TOKEN_REGISTRY[tokenKey];
  if (!token) return null;
  const net = network === 'mainnet' ? 'mainnet' : 'testnet';
  return {
    contractName: token.contractName,
    contractAddress: token.contractAddress[net],
    storagePath: token.storagePath,
    receiverPath: token.receiverPath,
    vaultType: token.vaultType,
    typeIdentifier: token[net],
  };
}

// Resolve token name from a type identifier string
export function getTokenName(typeIdentifier) {
  if (!typeIdentifier) return 'Unknown';
  // Check against all registered tokens first
  for (const [key, token] of Object.entries(TOKEN_REGISTRY)) {
    if (token.testnet === typeIdentifier || token.mainnet === typeIdentifier) {
      return token.label;
    }
  }
  // Fallback: extract contract name from type identifier (A.addr.ContractName.Vault)
  const parts = typeIdentifier.split('.');
  const contractName = parts[2] || typeIdentifier;
  const nameMap = {
    FlowToken: 'FLOW',
    USDCFlow: 'USDC.e',
    FiatToken: 'USDC (Legacy)',
    stFlowToken: 'stFLOW',
    TeleportedTetherToken: 'USDT',
    FUSD: 'FUSD',
  };
  // Check for EVM bridged tokens (long contract names)
  if (contractName && contractName.startsWith('EVMVMBridgedToken_')) {
    for (const [key, token] of Object.entries(TOKEN_REGISTRY)) {
      if (token.mainnet === typeIdentifier || token.testnet === typeIdentifier) {
        return token.label;
      }
    }
    // Extract short hex for display
    const hex = contractName.replace('EVMVMBridgedToken_', '').slice(0, 8);
    return `EVM:${hex}...`;
  }
  return nameMap[contractName] || contractName;
}

// Get token key from type identifier
export function getTokenKeyFromType(typeIdentifier) {
  for (const [key, token] of Object.entries(TOKEN_REGISTRY)) {
    if (token.testnet === typeIdentifier || token.mainnet === typeIdentifier) {
      return key;
    }
  }
  if (typeIdentifier) {
    const parts = typeIdentifier.split('.');
    const contractName = parts[2];
    for (const [key, token] of Object.entries(TOKEN_REGISTRY)) {
      if (token.contractName === contractName) {
        return key;
      }
    }
  }
  return null;
}

// Get token icon from key or type identifier
export function getTokenIcon(tokenKeyOrType) {
  const token = TOKEN_REGISTRY[tokenKeyOrType];
  if (token) return token.icon;
  const key = getTokenKeyFromType(tokenKeyOrType);
  if (key) return TOKEN_REGISTRY[key].icon;
  return '?';
}

// Build CoinGecko price URL for all tokens with known IDs
export function getCoinGeckoIds() {
  const ids = [];
  for (const token of Object.values(TOKEN_REGISTRY)) {
    if (token.coingeckoId && !ids.includes(token.coingeckoId)) {
      ids.push(token.coingeckoId);
    }
  }
  return ids;
}

// Fetch USD prices for all tokens in registry
export async function fetchAllTokenPrices() {
  const ids = getCoinGeckoIds();
  if (ids.length === 0) return {};

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24hr_change=true`
    );
    const data = await res.json();

    const prices = {};
    for (const [key, token] of Object.entries(TOKEN_REGISTRY)) {
      if (token.isStablecoin) {
        prices[token.label] = { usd: 1.0, change24h: 0 };
      } else if (token.coingeckoId && data[token.coingeckoId]) {
        prices[token.label] = {
          usd: data[token.coingeckoId].usd || 0,
          change24h: data[token.coingeckoId].usd_24h_change || 0,
        };
      }
    }

    // stFLOW is ~1.05x FLOW price (staking premium)
    if (prices['FLOW'] && !prices['stFLOW']) {
      prices['stFLOW'] = {
        usd: prices['FLOW'].usd * 1.05,
        change24h: prices['FLOW'].change24h,
      };
    }

    return prices;
  } catch (err) {
    console.warn('Could not fetch token prices:', err);
    return {
      FLOW: { usd: 0.05, change24h: 0 },
      PYUSD: { usd: 1.0, change24h: 0 },
      'USDC.e': { usd: 1.0, change24h: 0 },
      USDC: { usd: 1.0, change24h: 0 },
      USDF: { usd: 1.0, change24h: 0 },
      stgUSDT: { usd: 1.0, change24h: 0 },
      stFLOW: { usd: 0.053, change24h: 0 },
      stgWETH: { usd: 1980, change24h: 0 },
      WBTC: { usd: 68000, change24h: 0 },
      cbBTC: { usd: 68000, change24h: 0 },
    };
  }
}
