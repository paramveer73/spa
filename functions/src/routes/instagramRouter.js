const express = require("express");
const logger = require("firebase-functions/logger");

const { getInstagramFeed } = require("../services/instagramService");

const router = express.Router();

router.get("/instagramFeed", async (req, res) => {
  try {
    const feed = await getInstagramFeed();
    res.json(feed);
  } catch (err) {
    logger.error("Instagram feed endpoint failed", err);
    res.status(502).json({ error: "Instagram feed unavailable" });
  }
});

module.exports = router;
