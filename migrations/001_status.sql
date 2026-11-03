-- ترقية قاعدة قائمة: من active (0/1) إلى status (pending|active|blocked)
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN approved_at TEXT;
UPDATE users SET status = CASE WHEN active = 1 THEN 'active' ELSE 'blocked' END;
