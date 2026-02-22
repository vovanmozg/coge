#!/usr/bin/env node

/**
 * Syncs model lists from user config (~/.config/coge/config.json)
 * into the shipped default-config.json.
 *
 * Only updates `available` arrays; never touches `default`, `provider`, or `model`.
 * Warns when the default model is missing from the available list.
 *
 * Usage: node bin/sync-defaults.js
 */

import { readFileSync, writeFileSync } from "fs";
import { getConfigPath } from "../lib/config.js";
import { classifyModel, sortByCategory } from "../lib/model-classify.js";

const defaultConfigPath = new URL("../lib/default-config.json", import.meta.url).pathname;

const userConfig = JSON.parse(readFileSync(getConfigPath(), "utf8"));
const defConfig = JSON.parse(readFileSync(defaultConfigPath, "utf8"));

let updated = 0;
let skipped = 0;

for (const name of Object.keys(defConfig.providers)) {
  const userProv = (userConfig.providers || {})[name];
  if (!userProv) {
    console.log(`  skip  ${name} (not in user config)`);
    skipped++;
    continue;
  }

  const userIds = [...new Set(userProv.available || [])];
  const defIds = defConfig.providers[name].available;
  const defModel = defConfig.providers[name].default;

  if (defModel && !userIds.includes(defModel)) {
    console.log(`  warn  ${name}: default model "${defModel}" not in available list`);
  }

  const sorted = sortByCategory(userIds.map((id) => ({ id, category: classifyModel(id) }))).map((m) => m.id);

  if (JSON.stringify(sorted) === JSON.stringify(defIds)) {
    console.log(`  ok    ${name} (${defIds.length} models, unchanged)`);
    continue;
  }

  defConfig.providers[name].available = sorted;
  console.log(`  sync  ${name}: ${defIds.length} → ${sorted.length} models`);
  updated++;
}

if (updated > 0) {
  writeFileSync(defaultConfigPath, JSON.stringify(defConfig, null, 2) + "\n");
  console.log(`\nWrote ${defaultConfigPath}`);
} else {
  console.log("\nAlready in sync, nothing to write.");
}

console.log(`${updated} updated, ${skipped} skipped`);
