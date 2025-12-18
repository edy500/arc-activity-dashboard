// src/utils/crossChainProofs.js
// Cross-chain cryptographic proofs linked to ARC EVM identity
// Scope: only actions directly involving the ARC EVM address

export const CROSS_CHAIN_PROOFS = {
  // ARC EVM (source of truth)
  arc_evm: "0x1b12948DEb4405324546F4c6eE90f2aF178505bd",

  // ===== ARC EVM → ALEO =====
  aleo: {
    // Aleo address controlled / linked
    address:
      "aleo1d4umujw9y72czy389za3rzvkeeqpyrvefh3ae28hxkn688k3yufqp807fs",

    // On-chain Aleo transaction registering the link
    tx_register_link:
      "at1ntfequwvc99v3k5nsxy4yllmxc4xf9y07zg99gdz7gw0xkmaxcrqztu8ad",

    // Hashes stored on Aleo (field format)
    arc_hash_field:
      "142241286117310288074195150428977664677832283061185195330198572958655568848field",

    circle_hash_field:
      "127132653485306291266517676860684228182310387955305117587813550508326425309field",

    // 👇 explicit count of proof-related actions on Aleo
    // (registering ARC + Circle hashes on-chain)
    actions_count: 1,
  },

  // ===== ARC EVM → CIRCLE =====
  circle: {
    // Circle Smart Contract Account (custodial EVM wallet)
    wallet_address: "0xc487c25bf4ecc989c35c880b87278c4ab93a854d",

    // Circle internal wallet id
    wallet_id: "78aeb036-d0b2-5cff-a151-115418983994",

    // Hash of the LINK_MSG signed by Circle
    link_msg_hash:
      "0xdc0347bec2594e7dc24cc2680ecab1ae5a13b939f92f89a836a9eb2ee0e69ceb",

    // Signature produced via Circle API (custodial signing)
    signature:
      "0xae17e09add9ad560328fa8f4be7d755f79fc2f296553058850f1188e8c59ce0a3d22b3d666a834aa07179be026ee0cb07f504af96c832d5d7721fd08a03cba421b",

    // 👇 explicit count of proof-related actions on Circle
    // (LINK_MSG_HASH signed via Circle API)
    actions_count: 1,
  },

  // ===== ARC EOA SIGNATURE =====
  // Signature produced directly by the ARC EVM EOA
  arc_signature:
    "0xb8f55c827822075d0ae59d9ba5d0e5d575bed18edbda7836982419dd9604c3e3308ee433a036d3b892587357b67d4c1a4b3017996e53f56bab97e1302b29adce1b",
};
