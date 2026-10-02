create or replace function storage.enforce_bucket_name_length()
returns trigger as $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$ language plpgsql;


drop trigger if exists enforce_bucket_name_length_trigger on storage.buckets;
create trigger enforce_bucket_name_length_trigger
before insert or update of name on storage.buckets
for each row execute function storage.enforce_bucket_name_length();
