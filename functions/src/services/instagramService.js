const logger = require("firebase-functions/logger");

const { IG_USER_ID, IG_ACCESS_TOKEN } = require("../config/env");

const IG_FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
// 30 min — comfortably under Instagram's rate limit, and posts don't change
// often enough to justify fetching on every page load.
const IG_CACHE_TTL_MS = 30 * 60 * 1000;

let cachedFeed = null;
let cachedFeedAt = 0;

async function fetchFromGraphApi() {
  if (!IG_USER_ID || !IG_ACCESS_TOKEN) {
    throw new Error(
      "Missing IG_USER_ID / IG_ACCESS_TOKEN. Add them to functions/.env — see functions/.env.example."
    );
  }

  const url = `https://graph.instagram.com/${IG_USER_ID}/media?fields=${IG_FIELDS}&access_token=${IG_ACCESS_TOKEN}&limit=12`;
  const response = await fetch(url); // Node 18+ has global fetch — no extra dependency needed

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Instagram Graph API error ${response.status}: ${body}`);
  }

  const { data } = await response.json();
  return data;
}

/**
 * Returns cached posts if still fresh, otherwise refetches from the Graph
 * API. Falls back to a stale cache (rather than throwing) if the refetch
 * fails, so a transient Graph API hiccup doesn't take the whole feed down —
 * only throws if there's truly nothing to serve yet.
 */
async function getInstagramFeed() {
  const now = Date.now();
  if (cachedFeed && now - cachedFeedAt < IG_CACHE_TTL_MS) {
    return cachedFeed;
  }

  try {
    const feed = await fetchFromGraphApi();
    cachedFeed = feed;
    cachedFeedAt = now;
    return feed;
  } catch (err) {
    logger.error("Failed to fetch Instagram feed", err);
    if (cachedFeed) return cachedFeed;
    throw err;
  }
}

module.exports = { getInstagramFeed };
