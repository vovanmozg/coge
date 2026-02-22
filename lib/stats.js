import fs from "fs";
import path from "path";
import { getConfigDir } from "./config.js";

const STATS_FILENAME = "stats.json";

/**
 * Returns path to stats.json in the config directory.
 * @returns {string}
 */
function getStatsPath() {
  return path.join(getConfigDir(), STATS_FILENAME);
}

/**
 * Loads usage stats from stats.json. Returns {} if file missing.
 * @returns {Record<string, {execute: number, copy: number, cancel: number, last_used: string}>}
 */
export function loadStats() {
  try {
    const raw = fs.readFileSync(getStatsPath(), "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
}

/**
 * Saves usage stats to stats.json.
 * @param {Record<string, {execute: number, copy: number, cancel: number, last_used: string}>} stats
 */
export function saveStats(stats) {
  const dir = getConfigDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getStatsPath(), JSON.stringify(stats, null, 2) + "\n", "utf8");
}

/**
 * Records a user action (execute/copy/cancel) for a provider:model arm.
 * @param {string} armKey - e.g. "gemini:gemini-2.5-flash"
 * @param {"execute"|"copy"|"cancel"} action
 */
export function recordAction(armKey, action) {
  const stats = loadStats();
  if (!stats[armKey]) {
    stats[armKey] = { execute: 0, copy: 0, cancel: 0 };
  }
  stats[armKey][action] += 1;
  stats[armKey].last_used = new Date().toISOString();
  saveStats(stats);
}

/**
 * Formats stats as a table string for --stats output.
 * @param {Record<string, {execute: number, copy: number, cancel: number}>} stats
 * @returns {string}
 */
export function formatStats(stats) {
  const keys = Object.keys(stats);
  if (keys.length === 0) {
    return "No usage stats recorded yet.";
  }

  const header = "Provider/Model                      Exec  Copy  Cancel  Total  Accept%";
  const separator = "-".repeat(header.length);
  const lines = [header, separator];

  for (const key of keys) {
    const s = stats[key];
    const total = s.execute + s.copy + s.cancel;
    const acceptPct = total > 0 ? Math.round(((s.execute + s.copy) / total) * 100) : 0;
    const line = key.padEnd(36)
      + String(s.execute).padStart(4) + "  "
      + String(s.copy).padStart(4) + "  "
      + String(s.cancel).padStart(6) + "  "
      + String(total).padStart(5) + "  "
      + String(acceptPct).padStart(6) + "%";
    lines.push(line);
  }

  return lines.join("\n");
}
