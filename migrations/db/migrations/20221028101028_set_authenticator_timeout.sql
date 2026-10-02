-- migrate:up
alter role authenticator set statement_timeout = '8s';

-- migrate:down

