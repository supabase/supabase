-- migrate:up
grant pg_read_all_data, pg_signal_backend to postgres;

-- migrate:down
