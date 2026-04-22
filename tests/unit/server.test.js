/**
 * Unit tests for src/server/index.js record listing.
 * Run: node --test tests/unit/server.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { loadRecordsPaginated } from "../../src/server/index.js";

function fixture(thread_id, created_at, patch = {}) {
  return {
    schema_version: "1.0.0",
    thread_id,
    type: "thread",
    messages: [{ role: "user", content: `Prompt ${thread_id}`, timestamp: created_at }],
    context: { files: [], diffs: [] },
    meta: {
      source: "cursor",
      project: "demo",
      created_at,
      updated_at: created_at,
      tokens: 10,
      prompt: `Prompt ${thread_id}`,
      recognition_confidence: "high",
      ...patch.meta,
    },
    ...patch,
  };
}

async function writeFixtureDir(records) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "aex-server-"));
  const sourceDir = path.join(dir, "cursor");
  await fs.ensureDir(sourceDir);
  for (const record of records) {
    await fs.writeJson(path.join(sourceDir, `${record.thread_id}.json`), record);
  }
  return dir;
}

describe("loadRecordsPaginated", () => {
  it("sorts by record date descending by default before pagination", async () => {
    const dir = await writeFixtureDir([
      fixture("old", "2025-01-01T00:00:00.000Z"),
      fixture("new", "2025-03-01T00:00:00.000Z"),
      fixture("middle", "2025-02-01T00:00:00.000Z"),
    ]);

    try {
      const { items, total } = await loadRecordsPaginated(dir, { page: 1, size: 2 });
      assert.equal(total, 3);
      assert.deepEqual(items.map((r) => r.thread_id), ["new", "middle"]);
    } finally {
      await fs.remove(dir);
    }
  });

  it("supports ascending date order and date range filters", async () => {
    const dir = await writeFixtureDir([
      fixture("jan", "2025-01-01T00:00:00.000Z"),
      fixture("feb", "2025-02-01T00:00:00.000Z"),
      fixture("mar", "2025-03-01T00:00:00.000Z"),
    ]);

    try {
      const { items, total } = await loadRecordsPaginated(dir, {
        page: 1,
        size: 10,
        sortOrder: "asc",
        startDate: "2025-02-01",
        endDate: "2025-03-01",
      });
      assert.equal(total, 2);
      assert.deepEqual(items.map((r) => r.thread_id), ["feb", "mar"]);
    } finally {
      await fs.remove(dir);
    }
  });

  it("filters by project before calculating total", async () => {
    const dir = await writeFixtureDir([
      fixture("demo", "2025-01-01T00:00:00.000Z", { meta: { project: "demo" } }),
      fixture("other", "2025-02-01T00:00:00.000Z", { meta: { project: "other" } }),
    ]);

    try {
      const { items, total } = await loadRecordsPaginated(dir, { project: "other" });
      assert.equal(total, 1);
      assert.equal(items[0].thread_id, "other");
    } finally {
      await fs.remove(dir);
    }
  });
});
