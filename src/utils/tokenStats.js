// src/utils/tokenStats.js

function lc(v) {
  return (v ?? "").toString().toLowerCase();
}

function pickTokenAddr(tf) {
  return lc(
    tf?.token?.address ||
    tf?.token?.contract_address ||
    tf?.token_address ||
    tf?.tokenAddress ||
    ""
  );
}

function pickAmount(tf) {
  const v =
    tf?.total?.value ??
    tf?.value ??
    tf?.amount ??
    "0";
  return Number(v);
}

function pickDecimals(tf, fallback = 6) {
  const d =
    tf?.token?.decimals ??
    tf?.decimals ??
    tf?.tokenDecimals;
  const n = Number(d);
  return Number.isFinite(n) ? n : fallback;
}

function involvesAddress(tf, addr) {
  const from = lc(tf?.from?.hash || tf?.from?.address || tf?.from_address || tf?.from);
  const to = lc(tf?.to?.hash || tf?.to?.address || tf?.to_address || tf?.to);
  return from === addr || to === addr;
}

export function computeTokenTransferStats({ tokenTransfers, address, tokenAddress }) {
  const addr = lc(address);
  const want = lc(tokenAddress);

  let txCount = 0;
  let volume = 0;

  for (const tf of tokenTransfers || []) {
    if (!involvesAddress(tf, addr)) continue;
    if (pickTokenAddr(tf) !== want) continue;

    txCount += 1;

    const raw = pickAmount(tf);
    const decimals = pickDecimals(tf, 6);
    volume += raw / Math.pow(10, decimals);
  }

  return { txCount, volume };
}
