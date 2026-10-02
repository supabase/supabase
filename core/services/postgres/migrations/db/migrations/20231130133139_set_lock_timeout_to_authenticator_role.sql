-- migrate:up
ALTER ROLE authenticator set lock_timeout to '8s';

-- migrate:down
