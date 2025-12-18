// src/utils/dayDelta.js

function toMs(v) {
  if (!v) return null;
  // Blockscout v2 costuma retornar ISO string em `timestamp`
  const ms = Date.parse(v);
  return Number.isFinite(ms) ? ms : null;
}

function pctChange(today, yesterday) {
  if (yesterday === 0) return today === 0 ? 0 : null; // null => "N/A"
  return ((today - yesterday) / yesterday) * 100;
}

function splitLast48hByTimestamp(items, getTsMs) {
  const now = Date.now();
  const t24 = now - 24 * 60 * 60 * 1000;
  const t48 = now - 48 * 60 * 60 * 1000;

  const today = [];
  const yesterday = [];

  for (const it of items) {
    const ts = getTsMs(it);
    if (!ts) continue;
    if (ts >= t24) today.push(it);
    else if (ts >= t48) yesterday.push(it);
  }
  return { today, yesterday };
}

function filterTransfersByTxHashes(tokenTransfers, txs) {
  const hs = new Set(txs.map((t) => t?.hash).filter(Boolean));
  return tokenTransfers.filter((tf) => hs.has(tf?.tx_hash));
}

/**
 * computeDayDelta({ txs, tokenTransfers, computeCategoryVolumes })
 * Retorna:
 *  - txToday, txYesterday, upTxPct
 *  - volToday, volYesterday, upVolPct
 */
export function computeDayDelta({ txs, tokenTransfers, computeCategoryVolumes }) {
  const { today: txTodayArr, yesterday: txYesterdayArr } = splitLast48hByTimestamp(
    txs,
    (t) => toMs(t?.timestamp)
  );

  const tfToday = filterTransfersByTxHashes(tokenTransfers, txTodayArr);
  const tfYesterday = filterTransfersByTxHashes(tokenTransfers, txYesterdayArr);

  const volTodayObj = computeCategoryVolumes({ txs: txTodayArr, tokenTransfers: tfToday });
  const volYesterdayObj = computeCategoryVolumes({ txs: txYesterdayArr, tokenTransfers: tfYesterday });

  const txToday = txTodayArr.length;
  const txYesterday = txYesterdayArr.length;

  const volToday = Number(volTodayObj?.TOTAL ?? 0);
  const volYesterday = Number(volYesterdayObj?.TOTAL ?? 0);

  return {
    txToday,
    txYesterday,
    upTxPct: pctChange(txToday, txYesterday),

    volToday,
    volYesterday,
    upVolPct: pctChange(volToday, volYesterday),
  };
}
