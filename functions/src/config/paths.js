const path = require("path");

// This file lives at functions/src/config/paths.js, so two levels up is the
// functions/ root — resolved once here rather than repeating a fragile
// relative path (`../../views/...`) in every file that needs an asset.
const FUNCTIONS_ROOT = path.resolve(__dirname, "../..");
const VIEWS_DIR = path.join(FUNCTIONS_ROOT, "views");

module.exports = { FUNCTIONS_ROOT, VIEWS_DIR };
