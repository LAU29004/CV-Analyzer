import { createClient } from "redis";
import { logAI } from "./logger.js";

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
redisClient.on("connect", () => logAI("Redis connected"));
redisClient.on("ready", () => logAI("Redis ready"));
redisClient.on("reconnecting", () => logAI("Redis reconnecting"));
redisClient.on("end", () => logAI("Redis connection ended"));
redisClient.on("error", (err) => logAI("Redis error", { err }));

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