// api/store.js — Vercel Serverless Function using Vercel KV
// Vercel KV is available via @vercel/kv which is pre-installed on Vercel

export default async function handler(req, res) {
  // Dynamic import so it only runs on Vercel where the env vars exist
  const { kv } = await import("@vercel/kv");

  if (req.method === "GET") {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: "Missing key" });
    const value = await kv.get(key);
    return res.status(200).json({ value });
  }

  if (req.method === "POST") {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: "Missing key" });
    await kv.set(key, value);
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}
