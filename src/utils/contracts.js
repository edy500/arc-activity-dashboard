// src/utils/contracts.js
// Central registry of known contracts on Arc Testnet

export const CONTRACTS = {
  // ===== Core / Tokens =====
  USDC: {
    category: "USDC_TOKEN",
    addresses: [
      // FiatTokenProxy (USDC)
      "0x3600000000000000000000000000000000000000",
      "0x89b50855aa3be2f677cd6303cec089b5f319d72a",
      // WUSDC
      "0x911b4000d3422f482f4062a913885f7b035382df",
    ],
  },

  // ===== DEX / Routers =====
  DEX_ROUTER: {
    category: "DEX_ROUTER",
    addresses: [
      // Universal Router
      "0xbf4479c07dc6fdc6daa764a0cca06969e894275f",
    ],
  },

  V3_POSITION_MANAGER: {
    category: "V3_POSITION_MANAGER",
    addresses: [
      // NonfungiblePositionManager
      "0x444cc395346428216fb6f2892eb03cb804ae4cd5",
    ],
  },

  SIMPLE_POOL_LP: {
    category: "SIMPLE_POOL_LP",
    addresses: [
      // Known Simple Pool LPs (you can add more as they appear)
      "0xd065a783c362d73b5a62efb2b2e5dede49d16aa3",
      "0xfabb12b18c4b0b79dd97d8ea7c000f7424c76195",
      "0x55b9cbf50dc1171526635d03267f4a0979f1ffbb",
      "0x18eae2e870ec4bc31a41b12773c4f5c40bf19acd",
    ],
  },

  // ===== NFTs =====
  ARCFLOW_NFT: {
    category: "ARCFLOW_NFT",
    addresses: [
      "0x9e05c6075f9e890fc515ef86091414c77036f8fa",
    ],
  },

  ARC_SIMPLE_NFT: {
    category: "ARC_SIMPLE_NFT",
    addresses: [
      "0x746204854dca67f46d6737500cdd2c6d995c83c2",
    ],
  },


  // ===== Gateway =====
  GATEWAY: {
    category: "GATEWAY",
    addresses: [
      // Gateway Wallet
      "0x0077777d7eba4688bdef3e311b846f25870a19b9",
      // Gateway Minter
      "0x0022222abe238cc2c7bb1f21003f0a260052475b",
    ],
  },





};
