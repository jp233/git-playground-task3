const test = require("node:test");
const assert = require("node:assert");

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const { matches } = require("../lib/store");

function runCount(noteTexts) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "notes-test-"));
  const file = path.join(dir, "notes.json");
  const data = {
    nextId: noteTexts.length + 1,
    notes: noteTexts.map((text, i) => ({ id: i + 1, text })),
  };
  fs.writeFileSync(file, JSON.stringify(data));
  try {
    return execFileSync(process.execPath, [path.join(__dirname, "..", "notes.js"), "count"], {
      env: { ...process.env, NOTES_FILE: file },
      encoding: "utf8",
    }).trim();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const notes = [
  { id: 1, text: "buy milk" },
  { id: 2, text: "call the bank" },
  { id: 3, text: "milk the almonds" },
];

test("search finds every note that contains the term", () => {
  const result = matches(notes, "milk");
  assert.strictEqual(result.length, 2);
});

test("search finds a single containing note", () => {
  const result = matches(notes, "bank");
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, 2);
});

test("search returns nothing when no note contains the term", () => {
  const result = matches(notes, "xyz");
  assert.strictEqual(result.length, 0);
});

test("count reports the number of notes", () => {
  assert.strictEqual(runCount(["a", "b", "c"]), "You have 3 notes.");
});

test("count uses the singular for one note", () => {
  assert.strictEqual(runCount(["a"]), "You have 1 note.");
});

test("count reports zero when there are no notes", () => {
  assert.strictEqual(runCount([]), "You have 0 notes.");
});
