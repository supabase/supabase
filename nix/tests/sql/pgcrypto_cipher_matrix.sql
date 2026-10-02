-- CVE-2026-14663: pgcrypto's PGP functions previously did not detect when the
-- requested cipher was unavailable in the server's OpenSSL build. Encryption
-- then silently produced output that was not actually encrypted, and decryption
-- would succeed even with the wrong key. The fix makes encryption fail loudly
-- when the cipher is unavailable, and makes decryption reject such messages.
--
-- Upstream commits: (PG 15.19) / (PG 17.11), fixed 2026-08-13.
--
-- This pins the post-fix contract for the cipher options pgcrypto exposes:
--   * ciphers unavailable in this build (bf/blowfish/cast5) -> encrypt ERRORs
--     rather than silently emitting unencrypted output;
--   * available ciphers (aes*, 3des) round-trip correctly AND reject a wrong
--     passphrase with "Wrong key or corrupt data" (integrity protection intact).
-- The exact set of unavailable ciphers is a function of the OpenSSL build; this
-- suite runs against the image's own OpenSSL, so the assertions below track that
-- build's behavior.
--
-- Refs: PSQL-1110, PSQL-1234.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Unavailable ciphers must fail at encrypt time, not silently pass through.
SAVEPOINT s_bf;
SELECT pgp_sym_encrypt('secret', 'k', 'cipher-algo=bf') IS NOT NULL AS bf_encrypted;
ROLLBACK TO SAVEPOINT s_bf;

SAVEPOINT s_blowfish;
SELECT pgp_sym_encrypt('secret', 'k', 'cipher-algo=blowfish') IS NOT NULL AS blowfish_encrypted;
ROLLBACK TO SAVEPOINT s_blowfish;

SAVEPOINT s_cast5;
SELECT pgp_sym_encrypt('secret', 'k', 'cipher-algo=cast5') IS NOT NULL AS cast5_encrypted;
ROLLBACK TO SAVEPOINT s_cast5;

-- 2) Available ciphers round-trip correctly with the right key.
SELECT pgp_sym_decrypt(pgp_sym_encrypt('secret', 'k', 'cipher-algo=aes128'), 'k') AS aes128_rt;
SELECT pgp_sym_decrypt(pgp_sym_encrypt('secret', 'k', 'cipher-algo=aes192'), 'k') AS aes192_rt;
SELECT pgp_sym_decrypt(pgp_sym_encrypt('secret', 'k', 'cipher-algo=aes256'), 'k') AS aes256_rt;
SELECT pgp_sym_decrypt(pgp_sym_encrypt('secret', 'k', 'cipher-algo=3des'),   'k') AS des3_rt;

-- 3) The security property: a WRONG passphrase must be rejected, not accepted.
SAVEPOINT s_aes_wrong;
SELECT pgp_sym_decrypt(pgp_sym_encrypt('secret', 'k', 'cipher-algo=aes256'), 'WRONG');
ROLLBACK TO SAVEPOINT s_aes_wrong;

SAVEPOINT s_des3_wrong;
SELECT pgp_sym_decrypt(pgp_sym_encrypt('secret', 'k', 'cipher-algo=3des'), 'WRONG');
ROLLBACK TO SAVEPOINT s_des3_wrong;

-- 4) Backend still healthy after the expected errors.
SELECT pgp_sym_decrypt(pgp_sym_encrypt('still-here', 'k'), 'k') AS post_error_ok;

ROLLBACK;
