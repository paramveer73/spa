/**
 * Converts the studio's Vagaro export (src/data/ktln_services.json) into the
 * `catalog` node the site now reads its menu from — see src/data/catalog.ts
 * for the shape and why it's flat.
 *
 *   node scripts/build-catalog-import.mjs [--out catalog-import.json]
 *
 * It only writes a file; it never touches the database. Import the file in
 * the Firebase console on the `catalog` node (⋮ → Import JSON). An import
 * replaces the node it's run on, so run it on `catalog`, not the root — and
 * only once: after that the admin panel's Services screen owns this data,
 * and a re-import would undo every edit made there.
 */
import { readFileSync, writeFileSync } from "node:fs";

const source = JSON.parse(readFileSync(new URL("../src/data/ktln_services.json", import.meta.url)));

const outFlag = process.argv.indexOf("--out");
const outPath = outFlag > -1 ? process.argv[outFlag + 1] : "catalog-import.json";

// The characters a Realtime Database key can't contain.
const BAD_KEY = /[.#$[\]/]/;

// Only the typed policy fields. `raw_policy_line_items` is the export's
// unparsed text, which nothing reads.
const POLICY_FIELDS = [
  "deposit_percent",
  "deposit_refundable",
  "late_cancellation_fee_percent",
  "late_cancellation_window_hours",
  "no_show_fee_flat",
  "no_show_fee_default_percent",
];

const categories = {};
const services = {};
const problems = [];

function checkKey(id, what) {
  if (!id || BAD_KEY.test(id)) problems.push(`${what} has an unusable id: ${JSON.stringify(id)}`);
  if (categories[id] || services[id]) problems.push(`${what} id is used twice: ${id}`);
}

function addServices(list, categoryId, addOn, startOrder) {
  (list ?? []).forEach((service, index) => {
    checkKey(service.id, `Service "${service.name}"`);
    if (typeof service.price !== "number" || typeof service.duration !== "number") {
      problems.push(`Service ${service.id} needs a numeric price and duration`);
    }
    services[service.id] = {
      name: service.name,
      price: service.price,
      duration: service.duration,
      categoryId,
      // Add-ons are numbered after the category's own services, so they keep
      // their place if one is later turned into a regular service.
      order: startOrder + index,
      ...(addOn ? { addOn: true } : {}),
      ...(service.note ? { note: service.note } : {}),
    };
  });
}

function addCategory(group, order, parentId) {
  checkKey(group.id, `Category "${group.name}"`);
  categories[group.id] = { name: group.name, order, ...(parentId ? { parentId } : {}) };
  const own = group.services ?? [];
  addServices(own, group.id, false, 0);
  addServices(group.addOns, group.id, true, own.length);
  (group.subcategories ?? []).forEach((sub, index) => addCategory(sub, index, group.id));
}

source.categories.forEach((category, index) => addCategory(category, index, null));

if (problems.length > 0) {
  console.error(`Not written — fix these in ${"src/data/ktln_services.json"} first:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}

const policies = Object.fromEntries(POLICY_FIELDS.map((field) => [field, source.policies[field]]));

writeFileSync(outPath, `${JSON.stringify({ policies, categories, services }, null, 2)}\n`);

const addOns = Object.values(services).filter((service) => service.addOn).length;
const subcategories = Object.values(categories).filter((category) => category.parentId).length;
console.log(
  `Wrote ${outPath}: ${Object.keys(categories).length} categories (${subcategories} of them subcategories), ` +
    `${Object.keys(services).length} services (${addOns} add-ons), deposit ${policies.deposit_percent}%.`,
);
