import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createCloudflareProvider } from "../providers/cloudflare.js";

let savedAccountId;

beforeEach(() => {
  savedAccountId = process.env.COGE_CLOUDFLARE_ACCOUNT_ID;
});

afterEach(() => {
  if (savedAccountId === undefined) delete process.env.COGE_CLOUDFLARE_ACCOUNT_ID;
  else process.env.COGE_CLOUDFLARE_ACCOUNT_ID = savedAccountId;
});

describe("createCloudflareProvider", () => {
  it("throws when API key is not provided", () => {
    process.env.COGE_CLOUDFLARE_ACCOUNT_ID = "acc123";
    assert.throws(() => createCloudflareProvider(undefined, "model"), {
      message: "COGE_CLOUDFLARE_API_KEY not set.",
    });
  });

  it("throws when account ID is not set", () => {
    delete process.env.COGE_CLOUDFLARE_ACCOUNT_ID;
    assert.throws(() => createCloudflareProvider("key", "model"), {
      message: "COGE_CLOUDFLARE_ACCOUNT_ID not set.",
    });
  });

  it("returns provider with correct name", () => {
    process.env.COGE_CLOUDFLARE_ACCOUNT_ID = "acc123";
    const provider = createCloudflareProvider("test-key", "model");
    assert.equal(provider.name, "cloudflare");
  });
});
