/* auth_migration: 20260911120000 */
-- High-entropy token hash for link (non-typed) OTP flows.
alter table {{ index .Options "Namespace" }}.one_time_tokens
    add column if not exists link_token_hash text;

do $$ begin
  begin
    create index if not exists one_time_tokens_link_token_hash_hash_idx on {{ index .Options "Namespace" }}.one_time_tokens using hash (link_token_hash);
  exception when others then
    -- Fallback to a btree index if hash creation fails
    create index if not exists one_time_tokens_link_token_hash_hash_idx on {{ index .Options "Namespace" }}.one_time_tokens using btree (link_token_hash);
  end;
end $$;
