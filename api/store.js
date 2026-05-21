import { createClient } from "redis";

let client;
async function getClient() {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL,
    });
    await client.connect();
  }
  return client;
}

export default async function handler(req, res) {
  const redis = await getClient();

  if (req.method === "GET") {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: "Missing key" });
    const value = await redis.get(key);
    return res.status(200).json({ value: value ? JSON.parse(value) : null });
  }

  if (req.method === "POST") {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: "Missing key" });
    await redis.set(key, JSON.stringify(value));
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}
