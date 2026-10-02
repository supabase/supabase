-- Install pgjwt in extensions schema
CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA extensions;

-- Set search path to include extensions schema
SET search_path TO extensions, public;

select
  sign(
    payload   := '{"sub":"1234567890","name":"John Doe","iat":1516239022}',
    secret    := 'secret',
    algorithm := 'HS256'
  );

select
  verify(
    token := 'TEST_JWT_REDACTED',
    secret    := 'secret',
    algorithm := 'HS256'
  );
