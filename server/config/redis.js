import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL,

  socket: {
    reconnectStrategy: (retries) => {
      return Math.min(retries * 100, 3000);
    },
    connectTimeout: 10000,
    keepAlive: 5000,
  },
});

// ─────────────────────────────
// Connection Events
// ─────────────────────────────
redisClient.on("connect");
redisClient.on("ready");
redisClient.on("reconnecting");
redisClient.on("end");

redisClient.on("error", (err) => {
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
  }
}

await connectRedis();

export default redisClient;