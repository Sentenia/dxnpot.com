export default async function handler(req, res) {
  // ---------- CORS ----------
  const origin = req.headers.origin || "";
  const allowlist = new Set([
    "https://dxnpot.com",
    "https://www.dxnpot.com",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:3000",
  ]);

  // If origin is in allowlist, echo it. Otherwise allow all (you can tighten later).
  const allowOrigin = allowlist.has(origin) ? origin : "*";

  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { chain = "eth", address } = req.query;
    if (!address) {
      return res.status(400).json({ ok: false, error: "missing_address" });
    }

    const MORALIS_KEY = process.env.MORALIS_API_KEY;
    if (!MORALIS_KEY) {
      return res.status(200).json({ ok: false, error: "missing_key" });
    }

    // Moralis chain values are like: eth, polygon, bsc, avalanche, base...
    // (PulseChain may not be supported depending on Moralis plan.)
    const moralisChain = chain === "pulse" ? "0x171" : chain;

    const headers = {
      accept: "application/json",
      "X-API-Key": MORALIS_KEY,
    };

    // ✅ Native transactions by wallet (CORRECT ENDPOINT)
    // Docs show: GET https://deep-index.moralis.io/api/v2.2/:address?chain=eth 
    const txUrl =
      `https://deep-index.moralis.io/api/v2.2/${address}` +
      `?chain=${encodeURIComponent(moralisChain)}&order=DESC&limit=100`;

    // ✅ ERC20 transfers by wallet (this one you already had right)
    // GET https://deep-index.moralis.io/api/v2.2/:address/erc20/transfers :contentReference[oaicite:1]{index=1}
    const erc20Url =
      `https://deep-index.moralis.io/api/v2.2/${address}/erc20/transfers` +
      `?chain=${encodeURIComponent(moralisChain)}&order=DESC&limit=200`;

    // NOTE: “internal transactions by wallet” is not reliably available as a simple v2.2 wallet endpoint.
    // So we return an empty internals array for now (no more 404 breaking your whole response).
    const [txResp, erc20Resp] = await Promise.all([
      fetch(txUrl, { headers }),
      fetch(erc20Url, { headers }),
    ]);

    // If Moralis returns non-JSON HTML error pages, guard it.
    const txText = await txResp.text();
    const erc20Text = await erc20Resp.text();

    let txJson, erc20Json;
    try { txJson = JSON.parse(txText); } catch { txJson = null; }
    try { erc20Json = JSON.parse(erc20Text); } catch { erc20Json = null; }

    if (!txResp.ok || !txJson) {
      return res.status(200).json({
        ok: false,
        error: "moralis_bad_response",
        status: { tx: txResp.status },
        bodyPreview: String(txText).slice(0, 200),
        url: txUrl,
      });
    }

    if (!erc20Resp.ok || !erc20Json) {
      return res.status(200).json({
        ok: false,
        error: "moralis_bad_response",
        status: { erc20: erc20Resp.status },
        bodyPreview: String(erc20Text).slice(0, 200),
        url: erc20Url,
      });
    }

    const txs = (txJson?.result || txJson?.items || []).map((t) => ({
      hash: t.hash,
      from: t.from_address || t.from,
      to: t.to_address || t.to,
      value: t.value,
      input: t.input, // IMPORTANT for decoding burnBatch
      block: t.block_number,
      ts: t.block_timestamp,
    }));

    const erc20 = (erc20Json?.result || erc20Json?.items || []).map((t) => ({
      tx_hash: t.transaction_hash,
      from: t.from_address,
      to: t.to_address,
      value: t.value,
      token_address: t.address,
      token_symbol: t.token_symbol,
      token_decimals: t.token_decimals,
      ts: t.block_timestamp,
    }));

    return res.status(200).json({
      ok: true,
      chain: moralisChain,
      address,
      txs,
      erc20,
      internals: [], // not used for now
    });
  } catch (e) {
    return res.status(200).json({
      ok: false,
      error: "server_error",
      message: String(e?.message || e),
    });
  }
}
