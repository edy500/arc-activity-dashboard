// src/services/blockscout.js

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// Arc / Blockscout: endpoint "flat" (sem ?page=)
export function getAddressTxs(baseUrl, address, params = {}) {
  const url = new URL(`${baseUrl}/api/v2/addresses/${address}/transactions`);
  // paginação do Blockscout costuma vir via next_page_params (block_number, index, items_count)
  for (const [k, v] of Object.entries(params || {})) {
    if (v != null) url.searchParams.set(k, String(v));
  }
  return fetchJSON(url.toString());
}

// Token transfers (ArcScan NÃO aceita ?page= → você já resolveu via All)
export function getAddressTokenTransfers(baseUrl, address) {
  const url = `${baseUrl}/api/v2/addresses/${address}/token-transfers`;
  return fetchJSON(url);
}

// Helper: puxa várias “páginas” de txs usando next_page_params (sem ?page=)
export async function getAddressTxsAll(baseUrl, address, { maxPages = 10 } = {}) {
  const all = [];
  let params = {};

  for (let i = 0; i < maxPages; i++) {
    const res = await getAddressTxs(baseUrl, address, params);
    const items = Array.isArray(res?.items) ? res.items : [];
    all.push(...items);

    const next = res?.next_page_params;
    if (!next) break;

    params = next;
  }

  return { items: all };
}

// O seu helper já existente (mantém)
export async function getAddressTokenTransfersAll(baseUrl, address, { maxPages = 10 } = {}) {
  // como o ArcScan não aceita ?page=, aqui a gente só retorna o endpoint "flat"
  // (se no futuro tiver outro jeito, ajustamos aqui)
  const res = await getAddressTokenTransfers(baseUrl, address);
  return res;
}
