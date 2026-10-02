CREATE TABLE entries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  fill TEXT NOT NULL,
  tied_to TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX entries_created_at ON entries (created_at DESC);
