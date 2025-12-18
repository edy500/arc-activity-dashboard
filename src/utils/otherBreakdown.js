// src/utils/otherBreakdown.js

function lc(s) {
  return (s ?? "").toString().toLowerCase();
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function getToAddr(tx) {
  return (
    tx?.to?.hash ||
    tx?.to?.address ||
    tx?.to_address ||
    tx?.to ||
    ""
  );
}

function getToName(tx) {
  return tx?.to?.name || tx?.to?.smart_contract?.name || "";
}

function getMethod(tx) {
  return (
    tx?.method ||
    tx?.method_id ||
    tx?.method_name ||
    tx?.decoded_input?.method_call ||
    tx?.decoded_input?.method ||
    ""
  );
}

function getHash(tx) {
  return tx?.hash || tx?.tx_hash || tx?.transaction_hash || "";
}

// pega "qualquer valor string" dentro de um objeto (deep scan)
// usado para detectar gateway addresses dentro de decoded_input/params
function collectStringsDeep(obj, out = []) {
  if (!obj) return out;

  const t = typeof obj;
  if (t === "string" || t === "number" || t === "boolean" || t === "bigint") {
    out.push(String(obj));
    return out;
  }

  if (Array.isArray(obj)) {
    for (const it of obj) collectStringsDeep(it, out);
    return out;
  }

  if (t === "object") {
    for (const k of Object.keys(obj)) {
      collectStringsDeep(obj[k], out);
    }
    return out;
  }

  return out;
}

// === Gateway addresses (Arc domain 26) ===
// (iguais aos do seu classifyTx.js)
const ARC_GATEWAY_WALLET = "0x0077777d7eba4688bdef3e311b846f25870a19b9";
const ARC_GATEWAY_MINTER = "0x0022222abe238cc2c7bb1f21003f0a260052475b";
const GATEWAY_ADDRS = [ARC_GATEWAY_WALLET, ARC_GATEWAY_MINTER].map(lc);

function isGatewayDirect(tx) {
  const to = lc(getToAddr(tx));
  return GATEWAY_ADDRS.includes(to);
}

function isGatewayRelated(tx) {
  // Heurística forte e bem “segura”:
  // 1) se o nome do contrato contém "gateway"
  // 2) OU se o decoded_input menciona um dos endereços do gateway
  const toName = lc(getToName(tx));
  if (toName.includes("gateway")) return true;

  const decoded = tx?.decoded_input;
  if (!decoded) return false;

  const strings = collectStringsDeep(decoded, []);
  const blob = lc(strings.join(" | "));
  return GATEWAY_ADDRS.some((a) => blob.includes(a));
}

function topNByCount(map, limit = 12, sampleSize = 3) {
  const arr = Array.from(map.entries()).map(([key, v]) => ({
    key,
    count: v.count,
    samples: v.samples.slice(0, sampleSize),
  }));
  arr.sort((a, b) => b.count - a.count);
  return arr.slice(0, limit);
}

function bump(map, key, hash) {
  const k = key || "unknown";
  if (!map.has(k)) map.set(k, { count: 0, samples: [] });
  const cur = map.get(k);
  cur.count += 1;
  if (hash && cur.samples.length < 5) cur.samples.push(hash);
}

export function otherBreakdown(txs, opts = {}) {
  const items = safeArray(txs);

  const limit = Number(opts.limit ?? 12);
  const sampleSize = Number(opts.sampleSize ?? 3);

  const destMap = new Map();
  const methodMap = new Map();

  // gateway
  let gatewayDirect = 0;
  let gatewayRelated = 0;
  const gatewayRelatedSamples = [];
  const gatewayDirectSamples = [];

  for (const tx of items) {
    const to = getToAddr(tx);
    const toName = getToName(tx);
    const method = getMethod(tx);
    const hash = getHash(tx);

    // Destinations / methods (geral)
    const destKey = toName ? `${toName} — ${to}` : (to || "unknown");
    bump(destMap, destKey, hash);

    const mKey = method ? lc(method) : "unknown";
    bump(methodMap, mKey, hash);

    // Gateway direct/related
    if (isGatewayDirect(tx)) {
      gatewayDirect += 1;
      if (hash && gatewayDirectSamples.length < 5) gatewayDirectSamples.push(hash);
    } else if (isGatewayRelated(tx)) {
      gatewayRelated += 1;
      if (hash && gatewayRelatedSamples.length < 5) gatewayRelatedSamples.push(hash);
    }
  }

  return {
    total: items.length,

    topDestinations: topNByCount(destMap, limit, sampleSize),
    topMethods: topNByCount(methodMap, limit, sampleSize),

    gateway: {
      direct: gatewayDirect,
      related: gatewayRelated,
      directSamples: gatewayDirectSamples,
      relatedSamples: gatewayRelatedSamples,
      addresses: {
        wallet: ARC_GATEWAY_WALLET,
        minter: ARC_GATEWAY_MINTER,
      },
    },
  };
}
