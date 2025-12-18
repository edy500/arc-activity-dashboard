// src/utils/classifyTx.js
// Rule-based tx classification using a central contracts registry

import { CONTRACTS } from "./contracts";

// === Arc Docs (Contract Addresses) ===
// https://docs.arc.network/arc/references/contract-addresses

// CCTP v2 (Arc domain 26)
const ARC_CCTP_TOKEN_MESSENGER = "0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa";
const ARC_CCTP_MESSAGE_TRANSMITTER = "0xe737e5cebeeba77efe34d4aa090756590b1ce275";

// Bridge Kit
const ARC_BRIDGE_KIT_CONTRACT = "0xc5567a5e3370d4dbfb0540025078e283e36a363d";

// Gateway
const ARC_GATEWAY_WALLET = "0x0077777d7eba4688bdef3e311b846f25870a19b9";
const ARC_GATEWAY_MINTER = "0x0022222abe238cc2c7bb1f21003f0a260052475b";

// USYC
const ARC_USYC_TOKEN = "0xe9185f0c5f296ed1797aae4238d26ccabeadb86c";
const ARC_USYC_ENTITLEMENTS = "0xcc205224862c7641930c87679e98999d23c26113";
const ARC_USYC_TELLER = "0x9fdf14c5b14173d74c08af27aebff39240dc105a";

// Permit2
const ARC_PERMIT2 = "0x000000000022d473030f116ddee9f6b43ac78ba3";

// CCTP method hints
const CCTP_METHOD_HINTS = [
  "depositforburn",
  "depositforburnwithcaller",
  "receivemessage",
  "sendmessage",
  "replace",
];

// ---------------- helpers ----------------
function lc(v) {
  return (v ?? "").toString().toLowerCase();
}

function pickTo(tx) {
  return lc(tx?.to?.hash || tx?.to);
}

function pickFrom(tx) {
  return lc(tx?.from?.hash || tx?.from);
}

function pickMethod(tx) {
  return lc(
    tx?.method ||
      tx?.method_name ||
      tx?.decoded_input?.method_call ||
      tx?.decoded_input?.method ||
      tx?.method_id ||
      ""
  );
}

function matchRegistry(to) {
  for (const key of Object.keys(CONTRACTS)) {
    const entry = CONTRACTS[key];
    if (entry.addresses.includes(to)) {
      return entry.category;
    }
  }
  return null;
}

// ---------------- main classifier ----------------
export function classifyTx(tx) {
  const to = pickTo(tx);
  const from = pickFrom(tx);
  const method = pickMethod(tx);

  // Approvals
  if (method === "approve" || method === "increaseallowance") {
    return { category: "APPROVAL", reason: "approval method", to, from, method };
  }

  // Bridge Kit
  if (to === ARC_BRIDGE_KIT_CONTRACT) {
    return { category: "BRIDGE_KIT", reason: "BridgeKit contract", to, from, method };
  }

  // CCTP
  if (to === ARC_CCTP_TOKEN_MESSENGER || to === ARC_CCTP_MESSAGE_TRANSMITTER) {
    return { category: "CCTP", reason: "CCTP core contract", to, from, method };
  }
  if (CCTP_METHOD_HINTS.some((h) => method.includes(h))) {
    return { category: "CCTP", reason: "CCTP method hint", to, from, method };
  }

  // Gateway
  if (to === ARC_GATEWAY_WALLET || to === ARC_GATEWAY_MINTER) {
    return { category: "GATEWAY", reason: "Gateway contract", to, from, method };
  }

  // USYC
  if (
    to === ARC_USYC_TOKEN ||
    to === ARC_USYC_ENTITLEMENTS ||
    to === ARC_USYC_TELLER
  ) {
    return { category: "USYC", reason: "USYC contract", to, from, method };
  }

  // Permit2
  if (to === ARC_PERMIT2) {
    return { category: "PERMIT2", reason: "Permit2", to, from, method };
  }

  // 🧠 Registry-based categories (NEW)
  const reg = matchRegistry(to);
  if (reg) {
    return { category: reg, reason: "registry match", to, from, method };
  }

  return { category: "OTHER", reason: "no rule matched", to, from, method };
}

// ---------------- summarizer ----------------
export function summarizeTxs(txs = []) {
  const counts = { TOTAL: 0 };
  const examples = {};
  const bucketed = {};

  for (const tx of txs) {
    const c = classifyTx(tx);

    counts.TOTAL += 1;
    counts[c.category] = (counts[c.category] || 0) + 1;

    if (!bucketed[c.category]) bucketed[c.category] = [];
    bucketed[c.category].push(tx);

    if (!examples[c.category]) {
      examples[c.category] = {
        hash: tx?.hash,
        to: c.to,
        method: c.method,
        reason: c.reason,
      };
    }
  }

  return { counts, examples, bucketed };
}
