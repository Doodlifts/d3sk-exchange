import FungibleToken from 0xf233dcee88fe0abe

// Native Flow tokens
import stFlowToken from 0xd6f80565193ad727

// Standard bridged tokens
import USDCFlow from 0xf1ab99c82dee3526

// EVM-bridged tokens
import EVMVMBridgedToken_1b97100ea1d7126c4d60027e231ea4cb25314bdb from 0x1e4aa0b87d10b141
import EVMVMBridgedToken_99af3eea856556646c98c8b9b2548fe815240750 from 0x1e4aa0b87d10b141
import EVMVMBridgedToken_f1815bd50389c46847f0bda824ec8da914045d14 from 0x1e4aa0b87d10b141
import EVMVMBridgedToken_2aabea2058b5ac2d339b163c6ab6f2b6d53aabed from 0x1e4aa0b87d10b141
import EVMVMBridgedToken_674843c06ff83502ddb4d37c2e09c01cda38cbc8 from 0x1e4aa0b87d10b141
import EVMVMBridgedToken_2f6f07cdcf3588944bf4c42ac74ff24bf56e7590 from 0x1e4aa0b87d10b141
import EVMVMBridgedToken_717dae2baf7656be9a9b01dee31d571a9d4c9579 from 0x1e4aa0b87d10b141
import EVMVMBridgedToken_a0197b2044d28b08be34d98b23c9312158ea9a18 from 0x1e4aa0b87d10b141
import EVMVMBridgedToken_7296ebca325e835eb6c1b690484cf6fb4c396d2c from 0x1e4aa0b87d10b141
import EVMVMBridgedToken_8bd75008361517df04aa3ea033f03ba33c0c0a66 from 0x1e4aa0b87d10b141
import EVMVMBridgedToken_6a64e027e3f6a94acbdcf39cf0cbb4bead5f5ecb from 0x1e4aa0b87d10b141
import EVMVMBridgedToken_10448481630fb6d20b597e5b3d7e42dcb1247c8a from 0x1e4aa0b87d10b141
import EVMVMBridgedToken_9b565507858812e8b5ffbfbde9b200a3bc2e8f76 from 0x1e4aa0b87d10b141
import EVMVMBridgedToken_e8b7423b80f9af33480d365171c7ceda3586aa35 from 0x1e4aa0b87d10b141
import EVMVMBridgedToken_f45cbe30bd953590c9917799142edb05be3f293f from 0x1e4aa0b87d10b141

// Legacy tokens
import FiatToken from 0xb19436aae4d94622
import FUSD from 0x3c5959b568896393

/// Transaction to set up fungible token vaults on the treasury account.
/// 
/// This transaction is idempotent and safe to run multiple times. For each token,
/// it checks if a vault already exists in storage, and if not, creates one and
/// publishes the Receiver capability.
///
/// Treasury account: 0x5ec90e3dcf0067c4

transaction {
    prepare(signer: auth(BorrowValue, SaveValue, IssueStorageCapabilityController, PublishCapability) &Account) {
        // ============================================================================
        // stFlowToken - Native Flow token from 0xd6f80565193ad727
        // ============================================================================
        let stFlowStoragePath = /storage/stFlowTokenVault
        let stFlowReceiverPath = /public/stFlowTokenReceiver
        
        if signer.storage.borrow<&{FungibleToken.Receiver}>(from: stFlowStoragePath) == nil {
            let vault <- stFlowToken.createEmptyVault(vaultType: Type<@stFlowToken.Vault>())
            signer.storage.save(<-vault, to: stFlowStoragePath)
            let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(stFlowStoragePath)
            signer.capabilities.publish(cap, at: stFlowReceiverPath)
        }

        // ============================================================================
        // USDCFlow - Standard bridged token from 0xf1ab99c82dee3526
        // ============================================================================
        let usdcFlowStoragePath = /storage/usdcFlowVault
        let usdcFlowReceiverPath = /public/usdcFlowReceiver
        
        if signer.storage.borrow<&{FungibleToken.Receiver}>(from: usdcFlowStoragePath) == nil {
            let vault <- USDCFlow.createEmptyVault(vaultType: Type<@USDCFlow.Vault>())
            signer.storage.save(<-vault, to: usdcFlowStoragePath)
            let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(usdcFlowStoragePath)
            signer.capabilities.publish(cap, at: usdcFlowReceiverPath)
        }

        // ============================================================================
        // EVM-bridged tokens - All from 0x1e4aa0b87d10b141
        // ============================================================================
        
        // ankrFLOW
        let ankrFlowStoragePath = /storage/EVMVMBridgedToken_1b97100ea1d7126c4d60027e231ea4cb25314bdbVault
        let ankrFlowReceiverPath = /public/EVMVMBridgedToken_1b97100ea1d7126c4d60027e231ea4cb25314bdbReceiver
        
        if signer.storage.borrow<&{FungibleToken.Receiver}>(from: ankrFlowStoragePath) == nil {
            let vault <- EVMVMBridgedToken_1b97100ea1d7126c4d60027e231ea4cb25314bdb.createEmptyVault(vaultType: Type<@EVMVMBridgedToken_1b97100ea1d7126c4d60027e231ea4cb25314bdb.Vault>())
            signer.storage.save(<-vault, to: ankrFlowStoragePath)
            let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(ankrFlowStoragePath)
            signer.capabilities.publish(cap, at: ankrFlowReceiverPath)
        }

        // PYUSD
        let pyusdStoragePath = /storage/EVMVMBridgedToken_99af3eea856556646c98c8b9b2548fe815240750Vault
        let pyusdReceiverPath = /public/EVMVMBridgedToken_99af3eea856556646c98c8b9b2548fe815240750Receiver
        
        if signer.storage.borrow<&{FungibleToken.Receiver}>(from: pyusdStoragePath) == nil {
            let vault <- EVMVMBridgedToken_99af3eea856556646c98c8b9b2548fe815240750.createEmptyVault(vaultType: Type<@EVMVMBridgedToken_99af3eea856556646c98c8b9b2548fe815240750.Vault>())
            signer.storage.save(<-vault, to: pyusdStoragePath)
            let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(pyusdStoragePath)
            signer.capabilities.publish(cap, at: pyusdReceiverPath)
        }

        // USDC
        let usdcStoragePath = /storage/EVMVMBridgedToken_f1815bd50389c46847f0bda824ec8da914045d14Vault
        let usdcReceiverPath = /public/EVMVMBridgedToken_f1815bd50389c46847f0bda824ec8da914045d14Receiver
        
        if signer.storage.borrow<&{FungibleToken.Receiver}>(from: usdcStoragePath) == nil {
            let vault <- EVMVMBridgedToken_f1815bd50389c46847f0bda824ec8da914045d14.createEmptyVault(vaultType: Type<@EVMVMBridgedToken_f1815bd50389c46847f0bda824ec8da914045d14.Vault>())
            signer.storage.save(<-vault, to: usdcStoragePath)
            let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(usdcStoragePath)
            signer.capabilities.publish(cap, at: usdcReceiverPath)
        }

        // USDF
        let usdfStoragePath = /storage/EVMVMBridgedToken_2aabea2058b5ac2d339b163c6ab6f2b6d53aabedVault
        let usdfReceiverPath = /public/EVMVMBridgedToken_2aabea2058b5ac2d339b163c6ab6f2b6d53aabedReceiver
        
        if signer.storage.borrow<&{FungibleToken.Receiver}>(from: usdfStoragePath) == nil {
            let vault <- EVMVMBridgedToken_2aabea2058b5ac2d339b163c6ab6f2b6d53aabed.createEmptyVault(vaultType: Type<@EVMVMBridgedToken_2aabea2058b5ac2d339b163c6ab6f2b6d53aabed.Vault>())
            signer.storage.save(<-vault, to: usdfStoragePath)
            let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(usdfStoragePath)
            signer.capabilities.publish(cap, at: usdfReceiverPath)
        }

        // stgUSDT
        let stgUSDTStoragePath = /storage/EVMVMBridgedToken_674843c06ff83502ddb4d37c2e09c01cda38cbc8Vault
        let stgUSDTReceiverPath = /public/EVMVMBridgedToken_674843c06ff83502ddb4d37c2e09c01cda38cbc8Receiver
        
        if signer.storage.borrow<&{FungibleToken.Receiver}>(from: stgUSDTStoragePath) == nil {
            let vault <- EVMVMBridgedToken_674843c06ff83502ddb4d37c2e09c01cda38cbc8.createEmptyVault(vaultType: Type<@EVMVMBridgedToken_674843c06ff83502ddb4d37c2e09c01cda38cbc8.Vault>())
            signer.storage.save(<-vault, to: stgUSDTStoragePath)
            let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(stgUSDTStoragePath)
            signer.capabilities.publish(cap, at: stgUSDTReceiverPath)
        }

        // stgWETH
        let stgWETHStoragePath = /storage/EVMVMBridgedToken_2f6f07cdcf3588944bf4c42ac74ff24bf56e7590Vault
        let stgWETHReceiverPath = /public/EVMVMBridgedToken_2f6f07cdcf3588944bf4c42ac74ff24bf56e7590Receiver
        
        if signer.storage.borrow<&{FungibleToken.Receiver}>(from: stgWETHStoragePath) == nil {
            let vault <- EVMVMBridgedToken_2f6f07cdcf3588944bf4c42ac74ff24bf56e7590.createEmptyVault(vaultType: Type<@EVMVMBridgedToken_2f6f07cdcf3588944bf4c42ac74ff24bf56e7590.Vault>())
            signer.storage.save(<-vault, to: stgWETHStoragePath)
            let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(stgWETHStoragePath)
            signer.capabilities.publish(cap, at: stgWETHReceiverPath)
        }

        // WBTC
        let wbtcStoragePath = /storage/EVMVMBridgedToken_717dae2baf7656be9a9b01dee31d571a9d4c9579Vault
        let wbtcReceiverPath = /public/EVMVMBridgedToken_717dae2baf7656be9a9b01dee31d571a9d4c9579Receiver
        
        if signer.storage.borrow<&{FungibleToken.Receiver}>(from: wbtcStoragePath) == nil {
            let vault <- EVMVMBridgedToken_717dae2baf7656be9a9b01dee31d571a9d4c9579.createEmptyVault(vaultType: Type<@EVMVMBridgedToken_717dae2baf7656be9a9b01dee31d571a9d4c9579.Vault>())
            signer.storage.save(<-vault, to: wbtcStoragePath)
            let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(wbtcStoragePath)
            signer.capabilities.publish(cap, at: wbtcReceiverPath)
        }

        // cbBTC
        let cbBTCStoragePath = /storage/EVMVMBridgedToken_a0197b2044d28b08be34d98b23c9312158ea9a18Vault
        let cbBTCReceiverPath = /public/EVMVMBridgedToken_a0197b2044d28b08be34d98b23c9312158ea9a18Receiver
        
        if signer.storage.borrow<&{FungibleToken.Receiver}>(from: cbBTCStoragePath) == nil {
            let vault <- EVMVMBridgedToken_a0197b2044d28b08be34d98b23c9312158ea9a18.createEmptyVault(vaultType: Type<@EVMVMBridgedToken_a0197b2044d28b08be34d98b23c9312158ea9a18.Vault>())
            signer.storage.save(<-vault, to: cbBTCStoragePath)
            let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(cbBTCStoragePath)
            signer.capabilities.publish(cap, at: cbBTCReceiverPath)
        }

        // Bart
        let bartStoragePath = /storage/EVMVMBridgedToken_7296ebca325e835eb6c1b690484cf6fb4c396d2cVault
        let bartReceiverPath = /public/EVMVMBridgedToken_7296ebca325e835eb6c1b690484cf6fb4c396d2cReceiver
        
        if signer.storage.borrow<&{FungibleToken.Receiver}>(from: bartStoragePath) == nil {
            let vault <- EVMVMBridgedToken_7296ebca325e835eb6c1b690484cf6fb4c396d2c.createEmptyVault(vaultType: Type<@EVMVMBridgedToken_7296ebca325e835eb6c1b690484cf6fb4c396d2c.Vault>())
            signer.storage.save(<-vault, to: bartStoragePath)
            let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(bartStoragePath)
            signer.capabilities.publish(cap, at: bartReceiverPath)
        }

        // GangGang
        let gangGangStoragePath = /storage/EVMVMBridgedToken_8bd75008361517df04aa3ea033f03ba33c0c0a66Vault
        let gangGangReceiverPath = /public/EVMVMBridgedToken_8bd75008361517df04aa3ea033f03ba33c0c0a66Receiver
        
        if signer.storage.borrow<&{FungibleToken.Receiver}>(from: gangGangStoragePath) == nil {
            let vault <- EVMVMBridgedToken_8bd75008361517df04aa3ea033f03ba33c0c0a66.createEmptyVault(vaultType: Type<@EVMVMBridgedToken_8bd75008361517df04aa3ea033f03ba33c0c0a66.Vault>())
            signer.storage.save(<-vault, to: gangGangStoragePath)
            let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(gangGangStoragePath)
            signer.capabilities.publish(cap, at: gangGangReceiverPath)
        }

        // HotCocoa
        let hotCocoaStoragePath = /storage/EVMVMBridgedToken_6a64e027e3f6a94acbdcf39cf0cbb4bead5f5ecbVault
        let hotCocoaReceiverPath = /public/EVMVMBridgedToken_6a64e027e3f6a94acbdcf39cf0cbb4bead5f5ecbReceiver
        
        if signer.storage.borrow<&{FungibleToken.Receiver}>(from: hotCocoaStoragePath) == nil {
            let vault <- EVMVMBridgedToken_6a64e027e3f6a94acbdcf39cf0cbb4bead5f5ecb.createEmptyVault(vaultType: Type<@EVMVMBridgedToken_6a64e027e3f6a94acbdcf39cf0cbb4bead5f5ecb.Vault>())
            signer.storage.save(<-vault, to: hotCocoaStoragePath)
            let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(hotCocoaStoragePath)
            signer.capabilities.publish(cap, at: hotCocoaReceiverPath)
        }

        // Pawderick
        let pawderickStoragePath = /storage/EVMVMBridgedToken_10448481630fb6d20b597e5b3d7e42dcb1247c8aVault
        let pawderickReceiverPath = /public/EVMVMBridgedToken_10448481630fb6d20b597e5b3d7e42dcb1247c8aReceiver
        
        if signer.storage.borrow<&{FungibleToken.Receiver}>(from: pawderickStoragePath) == nil {
            let vault <- EVMVMBridgedToken_10448481630fb6d20b597e5b3d7e42dcb1247c8a.createEmptyVault(vaultType: Type<@EVMVMBridgedToken_10448481630fb6d20b597e5b3d7e42dcb1247c8a.Vault>())
            signer.storage.save(<-vault, to: pawderickStoragePath)
            let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(pawderickStoragePath)
            signer.capabilities.publish(cap, at: pawderickReceiverPath)
        }

        // Catseye
        let catseyeStoragePath = /storage/EVMVMBridgedToken_9b565507858812e8b5ffbfbde9b200a3bc2e8f76Vault
        let catseyeReceiverPath = /public/EVMVMBridgedToken_9b565507858812e8b5ffbfbde9b200a3bc2e8f76Receiver
        
        if signer.storage.borrow<&{FungibleToken.Receiver}>(from: catseyeStoragePath) == nil {
            let vault <- EVMVMBridgedToken_9b565507858812e8b5ffbfbde9b200a3bc2e8f76.createEmptyVault(vaultType: Type<@EVMVMBridgedToken_9b565507858812e8b5ffbfbde9b200a3bc2e8f76.Vault>())
            signer.storage.save(<-vault, to: catseyeStoragePath)
            let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(catseyeStoragePath)
            signer.capabilities.publish(cap, at: catseyeReceiverPath)
        }

        // Purrzival
        let purrzivalStoragePath = /storage/EVMVMBridgedToken_e8b7423b80f9af33480d365171c7ceda3586aa35Vault
        let purrzivalReceiverPath = /public/EVMVMBridgedToken_e8b7423b80f9af33480d365171c7ceda3586aa35Receiver
        
        if signer.storage.borrow<&{FungibleToken.Receiver}>(from: purrzivalStoragePath) == nil {
            let vault <- EVMVMBridgedToken_e8b7423b80f9af33480d365171c7ceda3586aa35.createEmptyVault(vaultType: Type<@EVMVMBridgedToken_e8b7423b80f9af33480d365171c7ceda3586aa35.Vault>())
            signer.storage.save(<-vault, to: purrzivalStoragePath)
            let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(purrzivalStoragePath)
            signer.capabilities.publish(cap, at: purrzivalReceiverPath)
        }

        // Gwendolion
        let gwendolionStoragePath = /storage/EVMVMBridgedToken_f45cbe30bd953590c9917799142edb05be3f293fVault
        let gwendolionReceiverPath = /public/EVMVMBridgedToken_f45cbe30bd953590c9917799142edb05be3f293fReceiver
        
        if signer.storage.borrow<&{FungibleToken.Receiver}>(from: gwendolionStoragePath) == nil {
            let vault <- EVMVMBridgedToken_f45cbe30bd953590c9917799142edb05be3f293f.createEmptyVault(vaultType: Type<@EVMVMBridgedToken_f45cbe30bd953590c9917799142edb05be3f293f.Vault>())
            signer.storage.save(<-vault, to: gwendolionStoragePath)
            let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(gwendolionStoragePath)
            signer.capabilities.publish(cap, at: gwendolionReceiverPath)
        }

        // ============================================================================
        // Legacy tokens - Included for backward compatibility and safety
        // ============================================================================
        
        // FiatToken (USDC Legacy) from 0xb19436aae4d94622
        let fiatTokenStoragePath = /storage/USDCVault
        let fiatTokenReceiverPath = /public/USDCVaultReceiver
        
        if signer.storage.borrow<&{FungibleToken.Receiver}>(from: fiatTokenStoragePath) == nil {
            let vault <- FiatToken.createEmptyVault(vaultType: Type<@FiatToken.Vault>())
            signer.storage.save(<-vault, to: fiatTokenStoragePath)
            let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(fiatTokenStoragePath)
            signer.capabilities.publish(cap, at: fiatTokenReceiverPath)
        }

        // FUSD from 0x3c5959b568896393
        let fusdStoragePath = /storage/fusdVault
        let fusdReceiverPath = /public/fusdReceiver
        
        if signer.storage.borrow<&{FungibleToken.Receiver}>(from: fusdStoragePath) == nil {
            let vault <- FUSD.createEmptyVault(vaultType: Type<@FUSD.Vault>())
            signer.storage.save(<-vault, to: fusdStoragePath)
            let cap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(fusdStoragePath)
            signer.capabilities.publish(cap, at: fusdReceiverPath)
        }
    }
}
