export default async function handler(req, res) {
  // ===============================
  // CORS (allow dxnpot.com + local dev)
  // ===============================
  const origin = req.headers.origin || "";
  const allowlist = new Set([
    "https://dxnpot.com",
    "https://www.dxnpot.com",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
  ]);

  if (allowlist.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  // ===============================

  try {
    const { chain = "eth", address } = req.query;
    if (!address) return res.status(400).json({ ok: false, error: "missing_address" });

    const MORALIS_KEY = process.env.MORALIS_API_KEY;
    if (!MORALIS_KEY) return res.status(200).json({ ok: false, error: "missing_key" });

    // Normalize chain key for Moralis
    // Moralis EVM chain examples: "eth", "polygon", "bsc", "avalanche", "base"
    // PulseChain may need "0x171" or may not be supported on your Moralis plan.
    const moralisChain = chain === "pulse" ? "0x171" : chain; // keep for now

    const headers = {
      accept: "application/json",
      "X-API-Key": MORALIS_KEY,
    };

    // 1) Normal transactions (includes input so we can decode burnBatch)
    const txUrl =
      `https://deep-index.moralis.io/api/v2.2/${address}/transactions` +
      `?chain=${encodeURIComponent(moralisChain)}&order=DESC&limit=100`;

    // 2) ERC20 transfers (we’ll filter for DXN on frontend)
    const erc20Url =
      `https://deep-index.moralis.io/api/v2.2/${address}/erc20/transfers` +
      `?chain=${encodeURIComponent(moralisChain)}&order=DESC&limit=200`;

    // 3) Internal transactions (this is where claimFees ETH shows up)
    const internalUrl =
      `https://deep-index.moralis.io/api/v2.2/${address}/internal-transactions` +
      `?chain=${encodeURIComponent(moralisChain)}&order=DESC&limit=200`;

    const [txResp, erc20Resp, internalResp] = await Promise.all([
      fetch(txUrl, { headers }),
      fetch(erc20Url, { headers }),
      fetch(internalUrl, { headers }),
    ]);

    // If Moralis returns HTML or an error page, json() will throw.
    const [txJson, erc20Json, internalJson] = await Promise.all([
      txResp.json(),
      erc20Resp.json(),
      internalResp.json(),
    ]);

    // Return trimmed payloads to keep it light
    const txs = (txJson?.result || txJson?.items || []).map((t) => ({
      hash: t.hash,
      from: t.from_address || t.from,
      to: t.to_address || t.to,
      value: t.value,
      input: t.input, // IMPORTANT
      block: t.block_number || t.block,
      ts: t.block_timestamp || t.ts,
    }));

    const erc20 = (erc20Json?.result || erc20Json?.items || []).map((t) => ({
      tx_hash: t.transaction_hash || t.tx_hash,
      from: t.from_address || t.from,
      to: t.to_address || t.to,
      value: t.value,
      token_address: t.address || t.token_address,
      token_symbol: t.token_symbol,
      token_decimals: t.token_decimals,
      ts: t.block_timestamp || t.ts,
    }));

    const internals = (internalJson?.result || internalJson?.items || []).map((t) => ({
      hash: t.transaction_hash || t.hash,
      from: t.from_address || t.from,
      to: t.to_address || t.to,
      value: t.value,
      ts: t.block_timestamp || t.ts,
    }));

    return res.status(200).json({
      ok: true,
      chain: moralisChain,
      address,
      txs,
      erc20,
      internals,
    });
  } catch (e) {
    return res.status(200).json({
      ok: false,
      error: "server_error",
      message: String(e?.message || e),
    });
  }
}
