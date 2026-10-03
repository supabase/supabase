do $$ begin
alter table {{ index .Options "Namespace" }}.flow_state add column if not exists auth_code_issued_at timestamptz null;
end $$
