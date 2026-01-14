const CHAIN_MAP = {
  eth: "eth",
  polygon: "polygon",
  pulse: "pulse",
};

function isHexAddress(s) {
  return typeof s === "string" && /^0x[a-fA-F0-9]{40}$/.test(s);
}

export default async function handler(req, res) {
  try {
    // CORS (so GitHub Pages can call Vercel)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "GET") {
      return res.status(405).json({ ok: false, error: "method_not_allowed" });
    }

    const chainKey = String(req.query.chain || "").toLowerCase();
    const address = String(req.query.address || "");

    const chain = CHAIN_MAP[chainKey];
    if (!chain) return res.status(400).json({ ok: false, error: "bad_chain" });
    if (!isHexAddress(address)) return res.status(400).json({ ok: false, error: "bad_address" });

    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) return res.status(500).json({ ok: false, error: "missing_api_key" });

    // ✅ Correct Moralis endpoint: /api/v2.2/:address
    const url =
      `https://deep-index.moralis.io/api/v2.2/${address}` +
      `?chain=${encodeURIComponent(chain)}&order=DESC&limit=50`;

    const r = await fetch(url, {
      headers: {
        accept: "application/json",
        "X-API-Key": apiKey,
      },
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return res.status(502).json({
        ok: false,
        error: "moralis_error",
        status: r.status,
        body: text.slice(0, 500),
      });
    }

    const data = await r.json();

    const items = (data.result || []).map((tx) => ({
      hash: tx.hash,
      from: tx.from_address,
      to: tx.to_address,
      value: String(tx.value ?? ""),
      block: tx.block_number,
      ts: tx.block_timestamp,
      gas: tx.gas,
      gasPrice: tx.gas_price,
      status: tx.receipt_status,
    }));

    return res.status(200).json({ ok: true, chain: chainKey, address, items });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: "server_error",
      message: String(e?.message || e),
    });
  }
}
