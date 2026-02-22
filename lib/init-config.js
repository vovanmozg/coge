#!/usr/bin/env node
import { writeDefaultConfigIfMissing, getConfigPath } from "./config.js";

try {
  const created = writeDefaultConfigIfMissing();
  if (created) {
    console.log("coge: created default config at", getConfigPath());
  }
} catch (err) {
  console.error("coge: failed to init config:", err.message);
  process.exit(1);
}
