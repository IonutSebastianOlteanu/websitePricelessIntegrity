CREATE TABLE IF NOT EXISTS relay_threads (
    code TEXT PRIMARY KEY,
    correspondent_email TEXT NOT NULL,
    created_at TEXT NOT NULL
);
