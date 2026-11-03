-- retr0 budget · D1 schema
DROP TABLE IF EXISTS audit;
DROP TABLE IF EXISTS budgets;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  pass          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member',
  status        TEXT NOT NULL DEFAULT 'pending',   -- pending | active | blocked
  base_currency TEXT NOT NULL DEFAULT 'USD',
  sp_rate       REAL NOT NULL DEFAULT 13500,
  lang          TEXT NOT NULL DEFAULT 'ar',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  approved_at   TEXT
);
CREATE INDEX idx_users_status ON users(status);

CREATE TABLE transactions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  kind        TEXT NOT NULL,              -- in | out
  amount      REAL NOT NULL,
  currency    TEXT NOT NULL,              -- USD | SP
  category    TEXT NOT NULL DEFAULT 'other',
  note        TEXT NOT NULL DEFAULT '',
  occurred_on TEXT NOT NULL,              -- YYYY-MM-DD
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX idx_tx_user_date ON transactions(user_id, occurred_on);

CREATE TABLE budgets (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  category     TEXT NOT NULL,
  limit_amount REAL NOT NULL,
  currency     TEXT NOT NULL DEFAULT 'USD',
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, category),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE audit (
  id         TEXT PRIMARY KEY,
  actor_id   TEXT,
  action     TEXT NOT NULL,
  detail     TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
