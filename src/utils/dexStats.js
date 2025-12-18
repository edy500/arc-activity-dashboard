function lc(s) {
  return (s ?? "").toString().toLowerCase();
}

function toNum(amountStr) {
  const n = Number(amountStr);
  return Number.isFinite(n) ? n : 0;
}

// Blockscout costuma trazer value como string inteira (base units) e token.decimals
function transferToFloat(t) {
  const raw = t?.total?.value ?? t?.value ?? "0";
  const decimals = Number(t?.token?.decimals ?? 0);
  const v = BigInt(raw.toString());
  const denom = 10n ** BigInt(decimals);
  // converte com precisão suficiente pro dashboard (float)
  const intPart = Number(v / denom);
  const fracPart = Number(v % denom) / Number(denom);
  return intPart + fracPart;
}

function getTxHash(t) {
  return lc(t?.transaction_hash || t?.tx_hash || t?.hash);
}

export function computeDexStats({ address, txs = [], tokenTransfers = [] }) {
  const me = lc(address);

  // Mapa: txHash -> { outUSDC, inOther, inUSDC, outOther }
  const perTx = new Map();

  for (const tr of tokenTransfers) {
    const h = getTxHash(tr);
    if (!h) continue;

    const from = lc(tr?.from?.hash || tr?.from);
    const to = lc(tr?.to?.hash || tr?.to);

    const symbol = (tr?.token?.symbol || "").toUpperCase();
    const amt = transferToFloat(tr);

    if (!perTx.has(h)) {
      perTx.set(h, { outUSDC: 0, inUSDC: 0, outOther: 0, inOther: 0 });
    }
    const acc = perTx.get(h);

    const isOut = from === me;
    const isIn = to === me;

    if (isOut && symbol === "USDC") acc.outUSDC += amt;
    else if (isIn && symbol === "USDC") acc.inUSDC += amt;
    else if (isOut) acc.outOther += amt;
    else if (isIn) acc.inOther += amt;
  }

  // “Swap” se: sai USDC e entra outro token (ou entra USDC e sai outro token)
  const dexTxHashes = new Set();
  let dexVolumeUSDC = 0;

  for (const [h, v] of perTx.entries()) {
    const looksLikeSwap =
      (v.outUSDC > 0 && v.inOther > 0) ||
      (v.inUSDC > 0 && v.outOther > 0);

    if (looksLikeSwap) {
      dexTxHashes.add(h);
      dexVolumeUSDC += v.outUSDC; // volume em USDC “vendido”
    }
  }

  // quantas das txs visíveis (lista de txs) batem com esses hashes
  const dexCount = txs.filter((t) => dexTxHashes.has(lc(t?.hash))).length;

  return {
    dexCount,
    dexVolumeUSDC: toNum(dexVolumeUSDC.toFixed(6)),
    dexTxHashes,
  };
}
