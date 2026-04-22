/**
 * Unit tests for core/scan.js
 * Run: node --test tests/unit/scan.test.js
 */

import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { resolveScanRoots } from "../../core/scan.js";

describe("resolveScanRoots", () => {
  const oldCodexHome = process.env.CODEX_HOME;

  afterEach(() => {
    if (oldCodexHome === undefined) delete process.env.CODEX_HOME;
    else process.env.CODEX_HOME = oldCodexHome;
  });

  it("includes custom absolute source directories", () => {
    const custom = path.resolve("D:/Custom/Codex/.codex/sessions");
    const roots = resolveScanRoots({ extraRoots: [custom] });
    assert.ok(roots.some((entry) => entry.root === custom));
  });

  it("keeps relative extra patterns under home", () => {
    const roots = resolveScanRoots({ extraPatterns: [".custom-agent"] });
    assert.ok(roots.some((entry) => entry.root === path.join(os.homedir(), ".custom-agent")));
  });

  it("splits pasted multiline and semicolon-separated custom roots", () => {
    const first = path.resolve("D:/CodexA/.codex");
    const second = path.resolve("D:/CodexB/.codex/sessions");
    const roots = resolveScanRoots({ extraRoots: [`${first}\n${second};${second}`] });

    assert.equal(roots.filter((entry) => entry.root === first).length, 1);
    assert.equal(roots.filter((entry) => entry.root === second).length, 1);
  });

  it("includes CODEX_HOME and CODEX_HOME sessions automatically", () => {
    const codexHome = path.resolve("D:/Portable/CodexHome/.codex");
    process.env.CODEX_HOME = codexHome;

    const roots = resolveScanRoots();

    assert.ok(roots.some((entry) => entry.root === codexHome));
    assert.ok(roots.some((entry) => entry.root === path.join(codexHome, "sessions")));
  });
});
