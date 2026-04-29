import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  countUserMessages,
  filterRecordsByMinUserMessages,
  filterRecordsWithAssistantMessages,
  hasAssistantMessage,
  runExport,
} from "../../src/commands/export.js";

describe("export filtering", () => {
  const records = [
    {
      thread_id: "assistant-only",
      messages: [{ role: "assistant", content: "bootstrap" }],
    },
    {
      thread_id: "one-user",
      messages: [
        { role: "user", content: "hello" },
        { role: "assistant", content: "hi" },
      ],
    },
    {
      thread_id: "user-only",
      messages: [{ role: "user", content: "still waiting..." }],
    },
    {
      thread_id: "two-users",
      messages: [
        { role: "user", content: "first" },
        { role: "assistant", content: "ack" },
        { role: "user", content: "second" },
      ],
    },
  ];

  it("counts user messages per record", () => {
    assert.equal(countUserMessages(records[0]), 0);
    assert.equal(countUserMessages(records[1]), 1);
    assert.equal(countUserMessages(records[2]), 1);
    assert.equal(countUserMessages(records[3]), 2);
  });

  it("detects assistant replies per record", () => {
    assert.equal(hasAssistantMessage(records[0]), true);
    assert.equal(hasAssistantMessage(records[1]), true);
    assert.equal(hasAssistantMessage(records[2]), false);
    assert.equal(hasAssistantMessage(records[3]), true);
  });

  it("filters records without assistant replies by default", () => {
    assert.deepEqual(
      filterRecordsWithAssistantMessages(records).map((record) => record.thread_id),
      ["assistant-only", "one-user", "two-users"]
    );
  });

  it("filters records below the minimum user-message threshold", () => {
    assert.deepEqual(
      filterRecordsByMinUserMessages(records, 1).map((record) => record.thread_id),
      ["one-user", "user-only", "two-users"]
    );
    assert.deepEqual(
      filterRecordsByMinUserMessages(records, 2).map((record) => record.thread_id),
      ["two-users"]
    );
  });

  it("keeps all records when the threshold is zero", () => {
    assert.equal(filterRecordsByMinUserMessages(records, 0).length, records.length);
  });

  it("rejects negative minUserMessages values", async () => {
    await assert.rejects(
      () => runExport({ minUserMessages: -1 }),
      /Invalid minUserMessages/
    );
  });
});
