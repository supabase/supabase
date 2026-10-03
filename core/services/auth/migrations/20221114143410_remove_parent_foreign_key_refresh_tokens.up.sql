alter table only {{ index .Options "Namespace" }}.refresh_tokens
  drop constraint refresh_tokens_parent_fkey;
