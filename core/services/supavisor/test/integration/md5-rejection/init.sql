-- Manager user with scram-sha-256 password (used for auth_query connection)
SET password_encryption = 'scram-sha-256';
CREATE ROLE manager_user WITH LOGIN PASSWORD 'manager_password';
GRANT ALL PRIVILEGES ON DATABASE postgres TO manager_user;
GRANT SELECT ON pg_authid TO manager_user;

-- User with MD5 password - the one we'll try to connect as via auth_query
SET password_encryption = 'md5';
CREATE ROLE md5_user WITH LOGIN PASSWORD 'md5_password';
GRANT ALL PRIVILEGES ON DATABASE postgres TO md5_user;
