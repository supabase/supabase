CREATE TABLE IF NOT EXISTS event_upgrades (
    id SERIAL PRIMARY KEY,
    event_id text NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id)
);