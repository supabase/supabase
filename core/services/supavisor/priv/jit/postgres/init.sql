-- Create role with login
CREATE ROLE supabase_admin WITH LOGIN PASSWORD 'TEST_SUPAVISOR_PASSWORD';
-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE postgres TO supabase_admin;

CREATE ROLE user_with_equal WITH LOGIN PASSWORD '56lRXbZStSL9=Y3cJJxLZd5wQxpWvfl9';
-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE postgres TO user_with_equal;
