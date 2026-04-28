/**
 * `export` command — scan + normalize + idempotent write.
 */

import os from "node:os";
import fs from "fs-extra";
import path from "node:path";
import crypto from "node:crypto";
import { scanAllTools } from "../../core/scan.js";
import { normalizeAll, SCHEMA_VERSION } from "../../core/normalize.js";
import { collectAllVscdbRecords } from "../../core/cursor_sqlite.js";
import { toMarkdown, assignRecordDisplayNames, recordFileName } from "../../core/convert.js";
import log from "../logger.js";

const EXPORTER_VERSION = "2.0.0";

function threadHash(record) {
  const { __cardLabel, ...stableRecord } = record || {};
  return crypto.createHash("sha1").update(JSON.stringify(stableRecord)).digest("hex").slice(0, 12);
}
/**
 * @param {object} opts
 * @param {string}   [opts.output="./agent-backup"]
 * @param {string}   [opts.format="json"]  "json"|"jsonl"|"markdown"
 * @param {string}   [opts.since]          ISO8601 — only export records after this date
 * @param {number}   [opts.workers=8]
 * @param {Function} [opts.onProgress]
 */
export async function runExport(opts = {}) {
  const {
    output = "./agent-backup",
    format = "json",
    since = null,
    workers = 8,
    onProgress = null,
  } = opts;
  if (!["json", "jsonl", "markdown"].includes(format)) {
    throw new Error(`Unsupported export format: ${format}. Use "json", "jsonl", or "markdown".`);
  }

  const progress = (p, t, msg) => {
    if (onProgress) onProgress(p, t, msg);
    else log.info(msg);
  };

  // ── Load previous manifest ────────────────────────────────────────────────
  const manifestPath = path.join(output, "manifest.json");
  let prevManifest = null;
  if (await fs.pathExists(manifestPath)) {
    prevManifest = await fs.readJson(manifestPath).catch(() => null);
  }
  const prevManifestFormat = prevManifest?.format;
  const prevItems = prevManifest?.items || [];
  const prevItemsByHash = new Map(prevItems.map((item) => [item.hash, item]));
  const prevHashes = new Set(
    prevItems
      .filter((i) => prevManifestFormat === format || i.file?.endsWith(`.${format === "markdown" ? "md" : format}`))
      .map((i) => i.hash)
  );
  const sinceCutoff = since ? new Date(since).getTime() : null;

  // ── Scan ──────────────────────────────────────────────────────────────────
  progress(5, 100, "Scanning file-based sources…");
  const rawFiles = await scanAllTools({ workers, onProgress: (d, t, p) => progress(Math.round((d / Math.max(t, 1)) * 30) + 5, 100, `Scanning ${path.basename(p)}`) });
  log.info(`Found ${rawFiles.length} candidate files`);

  progress(40, 100, "Scanning IDE workspace databases (*.vscdb)…");
  const sqliteRecords = await collectAllVscdbRecords();
  log.info(`SQLite (all IDEs): ${sqliteRecords.length} records`);

  // ── Normalize ─────────────────────────────────────────────────────────────
  progress(60, 100, "Normalizing records…");
  const fileRecords = normalizeAll(rawFiles);
  let allRecords = [...fileRecords, ...sqliteRecords];

  // Apply --since filter
  if (sinceCutoff) {
    allRecords = allRecords.filter((r) => {
      const ts = r.meta?.created_at ? new Date(r.meta.created_at).getTime() : 0;
      return ts >= sinceCutoff;
    });
    log.info(`After --since filter: ${allRecords.length} records`);
  }

  // ── Write ─────────────────────────────────────────────────────────────────
  progress(70, 100, "Writing output…");
  await fs.ensureDir(output);
  allRecords = assignRecordDisplayNames(allRecords);
  const exportedAt = new Date().toISOString();
  const manifestItems = [];
  const sourcesSeen = new Set();
  let newCount = 0, skippedCount = 0;

  for (const record of allRecords) {
    const hash = threadHash(record);
    const source = record.meta?.source || "unknown";
    sourcesSeen.add(source);

    if (prevHashes.has(hash)) {
      skippedCount++;
      const prevItem = prevItemsByHash.get(hash) || {};
      manifestItems.push({
        ...prevItem,
        hash,
        source,
        thread_id: record.thread_id,
      });
      continue;
    }

    const toolDir = path.join(output, source);
    await fs.ensureDir(toolDir);
    const filename = recordFileName(record, format);
    const filePath = path.join(toolDir, filename);
    if (format === "jsonl") {
      await fs.writeFile(filePath, JSON.stringify(record) + "\n", "utf-8");
    } else if (format === "markdown") {
      await fs.writeFile(filePath, toMarkdown(record), "utf-8");
    } else {
      await fs.writeJson(filePath, record, { spaces: 2 });
    }

    const fileContent = await fs.readFile(filePath);
    const sha256 = crypto.createHash("sha256").update(fileContent).digest("hex");
    manifestItems.push({ hash, sha256, source, thread_id: record.thread_id, file: path.relative(output, filePath) });
    newCount++;
  }

  // ── Manifest ──────────────────────────────────────────────────────────────
  progress(95, 100, "Writing manifest…");
  const manifest = {
    exporter_version: EXPORTER_VERSION,
    schema_version: SCHEMA_VERSION,
    exported_at: exportedAt,
    sources_seen: [...sourcesSeen].sort(),
    total_items: allRecords.length,
    new_items: newCount,
    skipped_items: skippedCount,
    items: manifestItems,
    format,
  };
  await fs.writeJson(manifestPath, manifest, { spaces: 2 });

  progress(100, 100, "Done");
  log.info(`Export complete — new: ${newCount}, skipped: ${skippedCount}`);
  return { output, new_items: newCount, skipped_items: skippedCount, total: allRecords.length, sources_seen: [...sourcesSeen].sort(), manifest_path: manifestPath };
}
