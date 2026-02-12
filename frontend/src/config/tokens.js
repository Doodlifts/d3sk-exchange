// Token registry for all supported Flow tokens
// Any FungibleToken on Flow can be traded — this registry provides metadata
// for the most common tokens. Unknown tokens are handled gracefully.
// Sources: https://github.com/fixes-world/token-list, https://github.com/onflow/assets

export const TOKEN_REGISTRY = {
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
  PYUSD: {
    // PYUSD (PayPal USD) — EVM-bridged via VM Bridge on Flow Cadence
    // https://developers.flow.com/defi/pyusd0-integration-guide
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
  USDC: {
    // USDCFlow — native Circle USDC on Flow (post-Crescendo)
    testnet: null,
    mainnet: 'A.f1ab99c82dee3526.USDCFlow.Vault',
    label: 'USDC',
    contractName: 'USDCFlow',
    contractAddress: { testnet: null, mainnet: '0xf1ab99c82dee3526' },
    storagePath: '/storage/USDCFlowVault',
    receiverPath: '/public/USDCFlowReceiver',
    vaultType: 'USDCFlow.Vault',
    icon: '$',
    coingeckoId: 'usd-coin',
    isStablecoin: true,
    decimals: 8,
    description: 'Native USDC on Flow (Circle)',
  },
  USDT: {
    testnet: null,
    mainnet: 'A.cfdd90d4a00f7b5b.TeleportedTetherToken.Vault',
    label: 'USDT',
    contractName: 'TeleportedTetherToken',
    contractAddress: { testnet: null, mainnet: '0xcfdd90d4a00f7b5b' },
    storagePath: '/storage/teleportedTetherTokenVault',
    receiverPath: '/public/teleportedTetherTokenReceiver',
    vaultType: 'TeleportedTetherToken.Vault',
    icon: '₮',
    coingeckoId: 'tether',
    isStablecoin: true,
    decimals: 8,
    description: 'Tether USD (Teleported)',
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
    description: 'Staked FLOW (IncrementFi)',
  },

  // ═══════════════════════════════════════════════════
  // Celer Bridge Tokens (all at 0x231cc0dbbcffc4b7)
  // ═══════════════════════════════════════════════════
  ceWETH: {
    testnet: null,
    mainnet: 'A.231cc0dbbcffc4b7.ceWETH.Vault',
    label: 'WETH',
    contractName: 'ceWETH',
    contractAddress: { testnet: null, mainnet: '0x231cc0dbbcffc4b7' },
    storagePath: '/storage/ceWETHVault',
    receiverPath: '/public/ceWETHVault',
    vaultType: 'ceWETH.Vault',
    icon: 'Ξ',
    coingeckoId: 'ethereum',
    decimals: 8,
    description: 'Wrapped Ether (Celer)',
  },
  ceWBTC: {
    testnet: null,
    mainnet: 'A.231cc0dbbcffc4b7.ceWBTC.Vault',
    label: 'WBTC',
    contractName: 'ceWBTC',
    contractAddress: { testnet: null, mainnet: '0x231cc0dbbcffc4b7' },
    storagePath: '/storage/ceWBTCVault',
    receiverPath: '/public/ceWBTCVault',
    vaultType: 'ceWBTC.Vault',
    icon: '₿',
    coingeckoId: 'bitcoin',
    decimals: 8,
    description: 'Wrapped Bitcoin (Celer)',
  },
  ceDAI: {
    testnet: null,
    mainnet: 'A.231cc0dbbcffc4b7.ceDAI.Vault',
    label: 'DAI',
    contractName: 'ceDAI',
    contractAddress: { testnet: null, mainnet: '0x231cc0dbbcffc4b7' },
    storagePath: '/storage/ceDAIVault',
    receiverPath: '/public/ceDAIVault',
    vaultType: 'ceDAI.Vault',
    icon: '◈',
    coingeckoId: 'dai',
    isStablecoin: true,
    decimals: 8,
    description: 'DAI Stablecoin (Celer)',
  },
  ceFTM: {
    testnet: null,
    mainnet: 'A.231cc0dbbcffc4b7.ceFTM.Vault',
    label: 'FTM',
    contractName: 'ceFTM',
    contractAddress: { testnet: null, mainnet: '0x231cc0dbbcffc4b7' },
    storagePath: '/storage/ceFTMVault',
    receiverPath: '/public/ceFTMVault',
    vaultType: 'ceFTM.Vault',
    icon: '◆',
    coingeckoId: 'fantom',
    decimals: 8,
    description: 'Fantom (Celer)',
  },
  ceAVAX: {
    testnet: null,
    mainnet: 'A.231cc0dbbcffc4b7.ceAVAX.Vault',
    label: 'AVAX',
    contractName: 'ceAVAX',
    contractAddress: { testnet: null, mainnet: '0x231cc0dbbcffc4b7' },
    storagePath: '/storage/ceAVAXVault',
    receiverPath: '/public/ceAVAXVault',
    vaultType: 'ceAVAX.Vault',
    icon: '▲',
    coingeckoId: 'avalanche-2',
    decimals: 8,
    description: 'Avalanche (Celer)',
  },
  ceBNB: {
    testnet: null,
    mainnet: 'A.231cc0dbbcffc4b7.ceBNB.Vault',
    label: 'BNB',
    contractName: 'ceBNB',
    contractAddress: { testnet: null, mainnet: '0x231cc0dbbcffc4b7' },
    storagePath: '/storage/ceBNBVault',
    receiverPath: '/public/ceBNBVault',
    vaultType: 'ceBNB.Vault',
    icon: '◇',
    coingeckoId: 'binancecoin',
    decimals: 8,
    description: 'BNB (Celer)',
  },
  ceMATIC: {
    testnet: null,
    mainnet: 'A.231cc0dbbcffc4b7.ceMATIC.Vault',
    label: 'MATIC',
    contractName: 'ceMATIC',
    contractAddress: { testnet: null, mainnet: '0x231cc0dbbcffc4b7' },
    storagePath: '/storage/ceMATICVault',
    receiverPath: '/public/ceMATICVault',
    vaultType: 'ceMATIC.Vault',
    icon: '⬡',
    coingeckoId: 'matic-network',
    decimals: 8,
    description: 'Polygon (Celer)',
  },

  // ═══════════════════════════════════════════════════
  // Flow-native Project Tokens
  // ═══════════════════════════════════════════════════
  DUST: {
    testnet: null,
    mainnet: 'A.921ea449dffec68a.FlovatarDustToken.Vault',
    label: 'DUST',
    contractName: 'FlovatarDustToken',
    contractAddress: { testnet: null, mainnet: '0x921ea449dffec68a' },
    storagePath: '/storage/FlovatarDustTokenVault',
    receiverPath: '/public/FlovatarDustTokenReceiver',
    vaultType: 'FlovatarDustToken.Vault',
    icon: '✦',
    coingeckoId: 'flovatar-dust',
    decimals: 8,
    description: 'Flovatar DUST',
  },
  STARLY: {
    testnet: null,
    mainnet: 'A.142fa6570b62fd97.StarlyToken.Vault',
    label: 'STARLY',
    contractName: 'StarlyToken',
    contractAddress: { testnet: null, mainnet: '0x142fa6570b62fd97' },
    storagePath: '/storage/starlyTokenVault',
    receiverPath: '/public/starlyTokenReceiver',
    vaultType: 'StarlyToken.Vault',
    icon: '★',
    coingeckoId: 'starly',
    decimals: 8,
    description: 'Starly NFT Platform',
  },
  BLT: {
    testnet: null,
    mainnet: 'A.0f9df91c9121c460.BloctoToken.Vault',
    label: 'BLT',
    contractName: 'BloctoToken',
    contractAddress: { testnet: null, mainnet: '0x0f9df91c9121c460' },
    storagePath: '/storage/bloctoTokenVault',
    receiverPath: '/public/bloctoTokenReceiver',
    vaultType: 'BloctoToken.Vault',
    icon: 'Ⓑ',
    coingeckoId: 'blocto-token',
    decimals: 8,
    description: 'Blocto Wallet',
  },
  REVV: {
    testnet: null,
    mainnet: 'A.d01e482eb680ec9f.REVV.Vault',
    label: 'REVV',
    contractName: 'REVV',
    contractAddress: { testnet: null, mainnet: '0xd01e482eb680ec9f' },
    storagePath: '/storage/revvVault',
    receiverPath: '/public/revvReceiver',
    vaultType: 'REVV.Vault',
    icon: 'Ⓡ',
    coingeckoId: 'revv',
    decimals: 8,
    description: 'REVV Motorsport',
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
  // Check against all registered tokens
  for (const [key, token] of Object.entries(TOKEN_REGISTRY)) {
    if (token.testnet === typeIdentifier || token.mainnet === typeIdentifier) {
      return token.label;
    }
  }
  // Fallback: extract contract name from type identifier (A.addr.ContractName.Vault)
  const parts = typeIdentifier.split('.');
  const contractName = parts[2] || typeIdentifier;
  // Common contract name to label mappings
  const nameMap = {
    FlowToken: 'FLOW',
    USDCFlow: 'USDC',
    FiatToken: 'USDC (Legacy)',
    stFlowToken: 'stFLOW',
    TeleportedTetherToken: 'USDT',
    ceWETH: 'WETH',
    ceWBTC: 'WBTC',
    ceDAI: 'DAI',
    ceFTM: 'FTM',
    ceAVAX: 'AVAX',
    ceBNB: 'BNB',
    ceMATIC: 'MATIC',
    FlovatarDustToken: 'DUST',
    StarlyToken: 'STARLY',
    BloctoToken: 'BLT',
    REVV: 'REVV',
    FUSD: 'FUSD',
  };
  // Check for EVM bridged tokens (long contract names)
  if (contractName && contractName.startsWith('EVMVMBridgedToken_')) {
    // Try to match by the full type identifier against registry
    for (const [key, token] of Object.entries(TOKEN_REGISTRY)) {
      if (token.mainnet === typeIdentifier || token.testnet === typeIdentifier) {
        return token.label;
      }
    }
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
  // Fallback: try to match by contract name in the identifier
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
  // Try as type identifier
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
    // Return fallback prices
    return {
      FLOW: { usd: 0.75, change24h: 0 },
      PYUSD: { usd: 1.0, change24h: 0 },
      USDC: { usd: 1.0, change24h: 0 },
      USDT: { usd: 1.0, change24h: 0 },
      DAI: { usd: 1.0, change24h: 0 },
      stFLOW: { usd: 0.79, change24h: 0 },
      WETH: { usd: 3200, change24h: 0 },
      WBTC: { usd: 95000, change24h: 0 },
      FTM: { usd: 0.50, change24h: 0 },
      AVAX: { usd: 35, change24h: 0 },
      BNB: { usd: 600, change24h: 0 },
      MATIC: { usd: 0.50, change24h: 0 },
    };
  }
}
