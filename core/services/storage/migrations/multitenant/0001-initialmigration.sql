CREATE TABLE IF NOT EXISTS tenants (
  id text PRIMARY KEY,
  anon_key text NOT NULL,
  database_url text NOT NULL,
  jwt_secret text NOT NULL,
  service_key text NOT NULL
);
