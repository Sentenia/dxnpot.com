export default async function handler(req, res) {
  // ✅ CORS (must be FIRST)
  const origin = req.headers.origin || "";
  const allowlist = new Set([
    "https://dxnpot.com",
    "https://www.dxnpot.com",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
  ]);

  // If origin matches allowlist, echo it back (best practice)
  if (allowlist.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // Optional: you can leave it blank instead of "*"
    // res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  // ✅ Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    const { chain = "eth", address } = req.query;
    if (!address) {
      return res.status(400).json({ ok: false, error: "missing_address" });
    }

    const MORALIS_KEY = process.env.MORALIS_API_KEY;
    if (!MORALIS_KEY) {
      return res.status(500).json({ ok: false, error: "missing_key" });
    }

    const moralisChain = chain === "pulse" ? "0x171" : chain;

    const headers = {
      accept: "application/json",
      "X-API-Key": MORALIS_KEY,
    };

    const txUrl =
      `https://deep-index.moralis.io/api/v2.2/${address}/transactions` +
      `?chain=${encodeURIComponent(moralisChain)}&order=DESC&limit=100`;

    const erc20Url =
      `https://deep-index.moralis.io/api/v2.2/${address}/erc20/transfers` +
      `?chain=${encodeURIComponent(moralisChain)}&order=DESC&limit=200`;

    const internalUrl =
      `https://deep-index.moralis.io/api/v2.2/${address}/internal-transactions` +
      `?chain=${encodeURIComponent(moralisChain)}&order=DESC&limit=200`;

    const [txResp, erc20Resp, internalResp] = await Promise.all([
      fetch(txUrl, { headers }),
      fetch(erc20Url, { headers }),
      fetch(internalUrl, { headers }),
    ]);

    // If Moralis returns HTML errors sometimes, guard it:
    const safeJson = async (r) => {
      const text = await r.text();
      try { return JSON.parse(text); }
      catch { return { __raw: text, __status: r.status }; }
    };

    const [txJson, erc20Json, internalJson] = await Promise.all([
      safeJson(txResp),
      safeJson(erc20Resp),
      safeJson(internalResp),
    ]);

    // If any came back as HTML / non-json, return a clean error
    if (txJson.__raw || erc20Json.__raw || internalJson.__raw) {
      return res.status(502).json({
        ok: false,
        error: "moralis_bad_response",
        status: {
          tx: txJson.__status,
          erc20: erc20Json.__status,
          internal: internalJson.__status,
        },
      });
    }

    const txs = (txJson?.result || txJson?.items || []).map((t) => ({
      hash: t.hash,
      from: t.from_address || t.from,
      to: t.to_address || t.to,
      value: t.value,
      input: t.input,
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
    return res.status(500).json({
      ok: false,
      error: "server_error",
      message: String(e?.message || e),
    });
  }
}
