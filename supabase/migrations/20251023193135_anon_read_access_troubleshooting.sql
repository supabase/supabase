-- Give anon and authenticated read access to the troubleshooting entries table
-- Allows troubleshooting entries to be generated in local dev

create policy anon_read_troubleshooting_entries
on public.troubleshooting_entries
for select
to anon
using (true);

create policy authenticated_read_troubleshooting_entries
on public.troubleshooting_entries
for select
to authenticated
using (true);
