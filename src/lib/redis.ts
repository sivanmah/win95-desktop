import { Redis } from "ioredis";
import { attachDatabasePool } from "@vercel/functions";
import type { Message } from "@/types/chat";

export const CHAT_CHANNEL = "chat:messages";

const HISTORY_KEY = "chat:history";
const HISTORY_LIMIT = 50;
const HISTORY_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Upstash provisions both a REST endpoint and a Redis-protocol one. The REST
// client cannot SUBSCRIBE, so pub/sub needs this TCP url and ioredis.
function connectionUrl() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error(
      "REDIS_URL is not set. Run `vercel env pull` after adding the Upstash integration."
    );
  }
  return url;
}

// Read lazily rather than at module scope: Next evaluates top-level code during
// `next build`, where the env var isn't necessarily present yet.
function createClient() {
  const client = new Redis(connectionUrl());
  // Lets Fluid compute release the connection when the instance suspends.
  attachDatabasePool(client);
  client.on("error", (error) => console.error("Redis error:", error));
  return client;
}

let publisher: Redis | null = null;

// A connection in subscriber mode can't issue other commands, so publishing and
// history need their own.
export function getPublisher() {
  if (!publisher) publisher = createClient();
  return publisher;
}

let subscriber: Redis | null = null;

/**
 * Subscribes this function instance to the chat channel exactly once. `onMessage`
 * receives every message published by any instance, including our own.
 */
export function ensureSubscribed(onMessage: (raw: string) => void) {
  if (subscriber) return;

  subscriber = createClient();
  subscriber.on("message", (_channel, raw: string) => onMessage(raw));
  subscriber.subscribe(CHAT_CHANNEL).catch((error) => {
    console.error("Failed to subscribe to chat channel:", error);
    subscriber = null;
  });
}

/**
 * Sorted set rather than a list so the count cap and the age cutoff can both
 * apply. Scored by timestamp; members are unique because each message carries an id.
 */
export async function appendToHistory(message: Message) {
  const redis = getPublisher();
  const score = new Date(message.timestamp).getTime();

  await redis
    .multi()
    .zadd(HISTORY_KEY, score, JSON.stringify(message))
    .zremrangebyscore(HISTORY_KEY, 0, Date.now() - HISTORY_MAX_AGE_MS)
    .zremrangebyrank(HISTORY_KEY, 0, -(HISTORY_LIMIT + 1))
    .expire(HISTORY_KEY, HISTORY_MAX_AGE_MS / 1000)
    .exec();
}

export async function readHistory(): Promise<Message[]> {
  const redis = getPublisher();

  // Bound by score as well as by the stored trim, so a message can never be
  // replayed once it's over the age limit even if the trim hasn't run since.
  const raw = await redis.zrangebyscore(
    HISTORY_KEY,
    Date.now() - HISTORY_MAX_AGE_MS,
    "+inf"
  );

  return raw.flatMap((entry) => {
    try {
      return [JSON.parse(entry) as Message];
    } catch {
      return [];
    }
  });
}
