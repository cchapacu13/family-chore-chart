export default async function handler(req, res) {
  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  if (req.method === "GET") {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: "Missing key" });
    const value = await redis.get(key);
    return res.status(200).json({ value });
  }

  if (req.method === "POST") {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: "Missing key" });
    await redis.set(key, value);
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}
