import fs from "fs";
import path from "path";
import { getConfigDir } from "./config.js";

const BANDIT_FILENAME = "bandit.json";
const EPSILON = 0.1;
const COLD_THRESHOLD = 3;
const COLD_REWARD = 0.5;
const DECAY_START_DAYS = 7;
const DECAY_DURATION_DAYS = 30;

/**
 * Returns path to bandit.json in the config directory.
 * @returns {string}
 */
function getBanditPath() {
  return path.join(getConfigDir(), BANDIT_FILENAME);
}

/**
 * Loads bandit state from bandit.json. Returns {} if file missing.
 * @returns {Record<string, {n: number, avg_latency: number, success_rate: number, reward: number, last_used: string}>}
 */
export function loadBanditState() {
  try {
    const raw = fs.readFileSync(getBanditPath(), "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
}

/**
 * Saves bandit state to bandit.json.
 * @param {Record<string, {n: number, avg_latency: number, success_rate: number, reward: number, last_used: string}>} state
 */
export function saveBanditState(state) {
  const dir = getConfigDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getBanditPath(), JSON.stringify(state, null, 2) + "\n", "utf8");
}

/**
 * Recalculates reward for all arms in state (mutates in place).
 * reward = success_rate * (0.3 + 0.7 * normalized_speed)
 * @param {Record<string, {n: number, avg_latency: number, success_rate: number, reward: number}>} state
 */
export function computeReward(state) {
  const arms = Object.values(state);
  if (arms.length === 0) return;

  const latencies = arms.map((a) => a.avg_latency);
  const minLat = Math.min(...latencies);
  const maxLat = Math.max(...latencies);

  for (const arm of arms) {
    const normalized = maxLat === minLat ? 1 : (maxLat - arm.avg_latency) / (maxLat - minLat);
    arm.reward = arm.success_rate * (0.3 + 0.7 * normalized);
  }
}

/**
 * Applies time-based decay to arms not used recently (mutates in place).
 * Arms unused for >7 days drift toward 0.5 over ~30 additional days.
 * @param {Record<string, {reward: number, last_used: string}>} state
 * @param {Date} [now] - current time (for testing)
 */
export function applyDecay(state, now) {
  const currentTime = now ?? new Date();
  for (const arm of Object.values(state)) {
    if (!arm.last_used) continue;
    const daysOld = (currentTime - new Date(arm.last_used)) / (1000 * 60 * 60 * 24);
    if (daysOld > DECAY_START_DAYS) {
      const decay = Math.min((daysOld - DECAY_START_DAYS) / DECAY_DURATION_DAYS, 1);
      arm.reward = arm.reward + (COLD_REWARD - arm.reward) * decay;
    }
  }
}

/**
 * ε-greedy arm selection.
 * Slot 1: with probability (1-ε) pick best reward, else random.
 * Slots 2..n: random from remaining.
 * Cold arms (n < COLD_THRESHOLD) get reward = 0.5 (optimistic).
 * @param {Record<string, {n: number, reward: number}>} state
 * @param {string[]} candidateArms - arm keys to choose from
 * @param {number} [n=3] - how many arms to select
 * @returns {string[]}
 */
export function selectArms(state, candidateArms, n = 3) {
  if (candidateArms.length === 0) return [];
  const count = Math.min(n, candidateArms.length);

  applyDecay(state);

  // Build scored list: cold arms get optimistic reward
  const scored = candidateArms.map((key) => {
    const arm = state[key];
    const reward = !arm || arm.n < COLD_THRESHOLD ? COLD_REWARD : arm.reward;
    return { key, reward };
  });

  const selected = [];
  const remaining = [...scored];

  // Slot 1: exploit or explore
  if (Math.random() < 1 - EPSILON) {
    // Exploit: pick best reward
    remaining.sort((a, b) => b.reward - a.reward);
    selected.push(remaining.shift());
  } else {
    // Explore: pick random
    const idx = Math.floor(Math.random() * remaining.length);
    selected.push(remaining.splice(idx, 1)[0]);
  }

  // Slots 2..n: random from remaining
  for (let i = 1; i < count; i++) {
    const idx = Math.floor(Math.random() * remaining.length);
    selected.push(remaining.splice(idx, 1)[0]);
  }

  return selected.map((s) => s.key);
}

/** Fisher-Yates shuffle (in-place). */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Random race selection: always include preferred provider, fill rest randomly.
 * @param {string[]} configured - providers with API keys
 * @param {string} preferredProvider - user's configured provider
 * @param {number} max - max number of providers to select
 * @returns {string[]}
 */
export function selectRaceProviders(configured, preferredProvider, max) {
  if (configured.length <= max) return [...configured];
  const preferred = configured.includes(preferredProvider) ? preferredProvider : null;
  const others = configured.filter((p) => p !== preferred);
  shuffle(others);
  const slots = preferred ? max - 1 : max;
  const selected = others.slice(0, slots);
  if (preferred) selected.unshift(preferred);
  return selected;
}

/**
 * Top-level provider selection based on strategy.
 * - "manual": use only the user's chosen provider (no racing)
 * - "auto" with >1 configured: bandit-driven selection
 * - fallback: random race selection
 * @param {{ strategy?: string, provider: string, providers?: Record<string, {default: string}> }} config
 * @param {string[]} configured - providers with API keys
 * @param {Record<string, string>} defaultModels - fallback default models per provider
 * @param {number} [max=3]
 * @returns {{ selected: string[], banditArms?: string[] }}
 */
export function pickProviders(config, configured, defaultModels, max = 3) {
  if (config.strategy === "manual") {
    return { selected: [config.provider] };
  }
  if (configured.length > 1) {
    const candidateArms = configured.map((name) => {
      const model = config.providers?.[name]?.default ?? defaultModels[name];
      return `${name}:${model}`;
    });
    const banditState = loadBanditState();
    const chosenArms = selectArms(banditState, candidateArms, max);
    const selected = chosenArms.map((arm) => arm.split(":")[0]);
    return { selected, banditArms: chosenArms };
  }
  return { selected: selectRaceProviders(configured, config.provider, max) };
}

/**
 * Updates an arm's stats incrementally after a race (mutates state).
 * Then recomputes rewards for all arms.
 * @param {Record<string, object>} state
 * @param {string} armKey
 * @param {number} latencyMs
 * @param {boolean} success
 */
export function updateArm(state, armKey, latencyMs, success) {
  const arm = state[armKey] ?? { n: 0, avg_latency: 0, success_rate: 0, reward: COLD_REWARD };
  arm.n += 1;
  arm.avg_latency += (latencyMs - arm.avg_latency) / arm.n;
  arm.success_rate += ((success ? 1 : 0) - arm.success_rate) / arm.n;
  arm.last_used = new Date().toISOString();
  state[armKey] = arm;
  computeReward(state);
}
