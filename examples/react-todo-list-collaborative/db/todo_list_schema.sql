CREATE TABLE lists (
  uuid text,
  id bigserial PRIMARY KEY,
  inserted_at timestamp without time zone DEFAULT timezone('utc' :: text, now()) NOT NULL,
  updated_at timestamp without time zone DEFAULT timezone('utc' :: text, now()) NOT NULL
);

CREATE TABLE tasks (
  task_text text NOT NULL,
  complete boolean DEFAULT false,
  id bigserial PRIMARY KEY,
  list_id bigint REFERENCES lists NOT NULL,
  inserted_at timestamp without time zone DEFAULT timezone('utc' :: text, now()) NOT NULL,
  updated_at timestamp without time zone DEFAULT timezone('utc' :: text, now()) NOT NULL
);

