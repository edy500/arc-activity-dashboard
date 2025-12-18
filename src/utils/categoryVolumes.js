// src/utils/categoryVolumes.js
import { classifyTx } from "./classifyTx";

function lc(s) {
  return (s ?? "").toString().toLowerCase();
}

function safeNum(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

// Converte "valor bruto" (string) + decimals => número em unidades
function toUnits(rawValue, decimals) {
  // rawValue pode vir como "1000000" ou "1.01" dependendo do explorer.
  // Tentativa 1: se for inteiro grande, trata como baseUnits.
  // Tentativa 2: se tiver ponto, assume já é "human-readable".
  const s = (rawValue ?? "0").toString();

  if (s.includes(".")) return safeNum(s);

  // baseUnits -> human
  const d = Number(decimals ?? 6);
  const big = BigInt(s || "0");
  const div = 10n ** BigInt(d);
  const whole = big / div;
  const frac = big % div;

  // monta string com zero padding
  const fracStr = frac.toString().padStart(d, "0").replace(/0+$/, "");
  const out = fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
  return safeNum(out);
}

function pickTxHashFromTransfer(tf) {
  // Blockscout varia: transaction_hash, tx_hash, hash...
  return (
    tf?.transaction_hash ||
    tf?.tx_hash ||
    tf?.transactionHash ||
    tf?.hash ||
    ""
  );
}

function pickTokenSymbol(tf) {
  return (
    tf?.token?.symbol ||
    tf?.token_symbol ||
    tf?.symbol ||
    ""
  );
}

function pickTokenDecimals(tf) {
  return (
    tf?.token?.decimals ??
    tf?.token_decimals ??
    tf?.decimals ??
    6
  );
}

function pickTransferValue(tf) {
  // Blockscout comum: "total.value" (baseUnits) + token.decimals
  // às vezes: "value"
  return (
    tf?.total?.value ??
    tf?.value ??
    "0"
  );
}

function pickFrom(tf) {
  return lc(tf?.from?.hash || tf?.from);
}

function pickTo(tf) {
  return lc(tf?.to?.hash || tf?.to);
}

export function computeCategoryVolumes({ txs = [], tokenTransfers = [], address } = {}) {
  // 1) cria hash -> categoria a partir das txs
  const hashToCategory = new Map();
  for (const tx of txs) {
    const h = lc(tx?.hash);
    if (!h) continue;
    const c = classifyTx(tx);
    hashToCategory.set(h, c.category || "OTHER");
  }

  // 2) acumuladores
  const volumes = {
    TOTAL: 0,
    BRIDGE_KIT: 0,
    CCTP: 0,
    DEX: 0,
    GATEWAY: 0,
    OTHER: 0,
  };

  const addrLc = address ? lc(address) : null;

  // 3) soma por tokenTransfers (USDC)
  for (const tf of tokenTransfers) {
    const sym = (pickTokenSymbol(tf) || "").toUpperCase();
    if (sym !== "USDC") continue;

    // opcional: filtra só transfers envolvendo seu endereço
    if (addrLc) {
      const f = pickFrom(tf);
      const t = pickTo(tf);
      if (f !== addrLc && t !== addrLc) continue;
    }

    const txHash = lc(pickTxHashFromTransfer(tf));
    const cat = hashToCategory.get(txHash) || "OTHER";

    const raw = pickTransferValue(tf);
    const dec = pickTokenDecimals(tf);
    const amt = toUnits(raw, dec);

    volumes.TOTAL += amt;
    volumes[cat] = (volumes[cat] || 0) + amt;
  }

  // arredonda pra UI não ficar “louca”
  for (const k of Object.keys(volumes)) {
    volumes[k] = Number(volumes[k].toFixed(6));
  }

  return volumes;
}
