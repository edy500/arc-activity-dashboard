// src/utils/gatewayBreakdown.js
import { CONTRACTS } from "./contracts";

function getToAddr(tx) {
  return tx?.to?.hash || tx?.to?.address || tx?.to_address || tx?.to || "";
}

function getFromAddr(tx) {
  return (
    tx?.from?.hash ||
    tx?.from?.address ||
    tx?.from_address ||
    tx?.from ||
    ""
  );
}

function getMethodName(tx) {
  return (
    tx?.decoded_input?.method ||
    tx?.decoded_input?.method_name ||
    tx?.method_name ||
    ""
  );
}

function lower(s) {
  return (s || "").toString().toLowerCase();
}

// Fallbacks conhecidos (se seu contracts.js não tiver GATEWAY completo)
const ARC_GATEWAY_WALLET = "0x0077777d7eba4688bdef3e311b846f25870a19b9";
const ARC_GATEWAY_MINTER = "0x0022222abe238cc2c7bb1f21003f0a260052475b";

function getGatewayAddrs() {
  const fromRegistry = Array.isArray(CONTRACTS?.GATEWAY?.addresses)
    ? CONTRACTS.GATEWAY.addresses
    : [];

  const merged = [
    ...fromRegistry,
    ARC_GATEWAY_WALLET,
    ARC_GATEWAY_MINTER,
  ].map(lower);

  // remove duplicados e vazios
  return Array.from(new Set(merged.filter(Boolean)));
}

export function gatewayBreakdown(input) {
  // aceita tanto array quanto { txs, address }
  const txs = Array.isArray(input) ? input : input?.txs || [];
  const address = lower(input?.address || "");

  const gatewayAddrs = getGatewayAddrs();
  const gatewaySet = new Set(gatewayAddrs);

  let direct = 0;
  let related = 0;

  const directTxs = [];
  const relatedTxs = [];

  for (const tx of txs) {
    const to = lower(getToAddr(tx));
    const from = lower(getFromAddr(tx));
    const methodName = lower(getMethodName(tx));
    const hash = tx?.hash || tx?.tx_hash || tx?.transaction_hash || "";

    const touchesGateway = (to && gatewaySet.has(to)) || (from && gatewaySet.has(from));
    const involvesMe = address && (from === address || to === address);

    // DIRECT: tx cujo "to" é um contrato do gateway
    if (to && gatewaySet.has(to)) {
      direct += 1;
      if (hash) directTxs.push(hash);
      continue;
    }

    // RELATED: só conta se realmente toca Gateway (to/from é Gateway)
    // (isso evita contaminar com CCTP depositForBurn, approvals, etc.)
    if (involvesMe && touchesGateway) {
      related += 1;
      if (hash) relatedTxs.push(hash);
      continue;
    }

    // Extra: alguns explorers decodam como gatewayMint/gatewayBurn/etc
    // Mesmo se não tocar gatewaySet por algum motivo, podemos considerar RELATED,
    // mas sem usar "deposit" genérico (pra não misturar CCTP).
    const looksLikeGatewayMethod =
      methodName.includes("gateway") ||
      methodName.includes("gatewaymint") ||
      methodName.includes("gatewayburn") ||
      methodName.includes("mint") && methodName.includes("gateway") ||
      methodName.includes("burn") && methodName.includes("gateway");

    if (involvesMe && looksLikeGatewayMethod) {
      related += 1;
      if (hash) relatedTxs.push(hash);
    }
  }

  return {
    direct,
    related,
    directTxs,
    relatedTxs,
    gatewayAddrs,
  };
}
