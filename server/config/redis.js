import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL,

  socket: {
    reconnectStrategy: (retries) => {
      console.log(`Redis reconnect attempt: ${retries}`);
      return Math.min(retries * 100, 3000);
    },
    connectTimeout: 10000,
    keepAlive: 5000,
  },
});

// ─────────────────────────────
// Connection Events
// ─────────────────────────────
redisClient.on("connect", () => console.log("🔌 Redis connecting..."));
redisClient.on("ready", () => console.log("✅ Redis connected"));
redisClient.on("reconnecting", () => console.log("🔄 Redis reconnecting..."));
redisClient.on("end", () => console.log("❌ Redis connection closed"));

redisClient.on("error", (err) => {
  console.log("❌ Redis Error:", err.message);
});

// ─────────────────────────────
// Safe Connect
// ─────────────────────────────
async function connectRedis() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    console.log("🚨 Redis connection failed:", err.message);
  }
}

await connectRedis();

export default redisClient;