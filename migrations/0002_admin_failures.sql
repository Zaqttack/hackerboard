CREATE TABLE admin_failures (
  ip TEXT NOT NULL,
  at INTEGER NOT NULL
);

CREATE INDEX admin_failures_ip_at ON admin_failures (ip, at);
