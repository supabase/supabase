/* auth_migration: 20251104100000 */
alter table {{ index .Options "Namespace" }}.oauth_authorizations
    add column if not exists nonce text null;

/* auth_migration: 20251104100000 */
alter table {{ index .Options "Namespace" }}.oauth_authorizations
    add constraint oauth_authorizations_nonce_length check (char_length(nonce) <= 255);
