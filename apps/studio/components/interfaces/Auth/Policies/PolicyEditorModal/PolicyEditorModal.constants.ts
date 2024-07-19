import { PolicyTemplate } from '../PolicyTemplates/PolicyTemplates.constants'
/**
 * ----------------------------------------------------------------
 * PostgreSQL policy templates for the auth policies page
 * ----------------------------------------------------------------
 * id: Unique identifier for the monaco editor to dynamically refresh
 * templateName: As a display for a more descriptive title for the policy
 * description: Additional details about the template and how to make it yours
 * statement: SQL statement template for the policy
 *
 * name: Actual policy name that will be used in the editor
 * definition: Actual policy using expression that will be used in the editor
 * check: Actual policy with check expression that will be used in the editor
 * command: Operation to create policy for
 */

export const getGeneralPolicyTemplates = (schema: string, table: string): PolicyTemplate[] => [
  {
    id: 'policy-1',
    preview: false,
    templateName: 'Enable read access to everyone',
    description:
      'This policy gives read access to your table for all users via the SELECT operation.',
    statement: `
create policy "Enable read access for all users"
on "${schema}"."${table}"
for select using (true);`.trim(),
    name: 'Enable read access for all users',
    definition: 'true',
    check: '',
    command: 'SELECT',
    roles: [],
  },
  {
    id: 'policy-2',
    preview: false,
    templateName: 'Enable insert access for authenticated users only',
    description: 'This policy gives insert access to your table for all authenticated users only.',
    statement: `
create policy "Enable insert for authenticated users only"
on "${schema}"."${table}"
for insert to authenticated
with check (true);`.trim(),
    name: 'Enable insert for authenticated users only',
    definition: '',
    check: 'true',
    command: 'INSERT',
    roles: ['authenticated'],
  },
  {
    id: 'policy-3',
    preview: false,
    templateName: 'Enable update access for users based on their email *',
    description:
      'This policy assumes that your table has a column "email", and allows users to update rows which the "email" column matches their email.',
    statement: `
create policy "Enable update for users based on email"
on "${schema}"."${table}"
for update using (
  (select auth.jwt()) ->> 'email' = email
) with check (
  (select auth.jwt()) ->> 'email' = email
);`.trim(),
    name: 'Enable update for users based on email',
    definition: `(select auth.jwt()) ->> 'email' = email`,
    check: `(select auth.jwt()) ->> 'email' = email`,
    command: 'UPDATE',
    roles: [],
  },
  {
    id: 'policy-4',
    preview: false,
    templateName: 'Enable delete access for users based on their user ID *',
    description:
      'This policy assumes that your table has a column "user_id", and allows users to delete rows which the "user_id" column matches their ID',
    statement: `
create policy "Enable delete for users based on user_id"
on "${schema}"."${table}"
for delete using (
  (select auth.uid()) = user_id
);`.trim(),
    name: 'Enable delete for users based on user_id',
    definition: '(select auth.uid()) = user_id',
    check: '',
    command: 'DELETE',
    roles: [],
  },
  {
    id: 'policy-5',
    preview: false,
    templateName: 'Enable insert access for users based on their user ID *',
    description:
      'This policy assumes that your table has a column "user_id", and allows users to insert rows which the "user_id" column matches their ID',
    statement: `
create policy "Enable insert for users based on user_id"
on "${schema}"."${table}"
for insert with check (
  (select auth.uid()) = user_id
);`.trim(),
    name: 'Enable insert for users based on user_id',
    definition: '',
    check: '(select auth.uid()) = user_id',
    command: 'INSERT',
    roles: [],
  },
  {
    id: 'policy-6',
    preview: true,
    name: 'Policy with table joins',
    templateName: 'Policy with table joins',
    description: `
Query across tables to build more advanced RLS rules

Assuming 2 tables called \`teams\` and \`members\`, you can query both tables in the policy to control access to the members table.`,
    statement: `
create policy "Members can update team details if they belong to the team"
on teams for update using (
  (select auth.uid()) in (
    select user_id from members where team_id = id
  )
);
`.trim(),
    definition: `(select auth.uid()) in (select user_id from members where team_id = id)`,
    check: '',
    command: 'UPDATE',
    roles: [],
  },
  {
    id: 'policy-7',
    preview: true,
    templateName: 'Policy with security definer functions',
    description: `
Useful in a many-to-many relationship where you want to restrict access to the linking table.

Assuming 2 tables called \`teams\` and \`members\`, you can use a security definer function in combination with a policy to control access to the members table.`.trim(),
    statement: `
create or replace function get_teams_for_user(user_id uuid)
returns setof bigint as $$
  select team_id from members where user_id = $1
$$ stable language sql security definer;

create policy "Team members can update team members if they belong to the team"
on members
for all using (
  team_id in (select get_teams_for_user(auth.uid()))
);
`.trim(),
    name: 'Policy with security definer functions',
    definition: 'team_id in (select get_teams_for_user(auth.uid()))',
    check: '',
    command: 'ALL',
    roles: [],
  },
  {
    id: 'policy-8',
    preview: true,
    name: 'Policy to implement Time To Live (TTL)',
    templateName: 'Policy to implement Time To Live (TTL)',
    description: `
Implement a TTL-like feature that you see in Instagram stories or Snapchat where messages expire after a day.

Rows under the table are available only if they have been created within the last 24 hours.`,
    statement: `
create policy "Stories are live for a day"
on "${schema}"."${table}"
for select using (
  created_at > (current_timestamp - interval '1 day')
);
`.trim(),
    definition: `created_at > (current_timestamp - interval '1 day')`,
    check: '',
    command: 'SELECT',
    roles: [],
  },
]

export const getRealtimePolicyTemplates = (): PolicyTemplate[] => {
  const results = [
    {
      id: 'policy-broadcast-1',
      preview: false,
      templateName: 'Allow listening for broadcasts for authenticated users only',
      description: 'This policy allows listening for broadcasts for authenticated users only.',
      statement: `
create policy  "Allow listening for broadcasts for authenticated users only"
on realtime.messages for select
to authenticated
using ( realtime.messages.extension = 'broadcast' );`.trim(),
      name: 'Allow listening for broadcasts for authenticated users only',
      definition: "realtime.messages.extension = 'broadcast'",
      check: '',
      command: 'SELECT',
      roles: ['authenticated'],
    },
    {
      id: 'policy-broadcast-2',
      preview: false,
      templateName: 'Allow pushing broadcasts for authenticated users only',
      description: 'This policy allows pushing broadcasts for authenticated users only.',
      statement: `
create policy "Allow pushing broadcasts for authenticated users only"
ON realtime.messages for insert
TO authenticated
with check ( realtime.messages.extension = 'broadcast' );`.trim(),
      name: 'Allow pushing broadcasts for authenticated users only',
      definition: "realtime.messages.extension = 'broadcast'",
      check: "realtime.messages.extension = 'broadcast'",
      command: 'INSERT',
      roles: ['authenticated'],
    },
    {
      id: 'policy-broadcast-3',
      preview: false,
      templateName: 'Allow listening for broadcasts from a specific channel',
      description: 'This policy allows listening for broadcasts from a specific channel.',
      statement: `
create policy "Allow listening for broadcasts from a specific channel"
on realtime.messages for select
using ( realtime.messages.extension = 'broadcast' AND realtime.topic() = 'channel_name' );`.trim(),
      name: 'Allow listening for broadcasts from a specific channel',
      definition: `realtime.messages.extension = 'broadcast' AND realtime.topic() = 'channel_name'`,
      check: '',
      command: 'SELECT',
      roles: [],
    },
    {
      id: 'policy-broadcast-4',
      preview: false,
      templateName: 'Allow pushing broadcasts to specific channel',
      description: 'This policy allow pushing broadcasts to specific channel.',
      statement: `
create policy "Allow pushing broadcasts to specific channel"
ON realtime.messages for insert
with check ( realtime.messages.extension = 'broadcast' AND realtime.topic() = 'channel_name' );`.trim(),
      name: 'Allow pushing broadcasts to specific channel',
      definition: `realtime.messages.extension = 'broadcast' AND realtime.topic() = 'channel_name'`,
      check: `realtime.messages.extension = 'broadcast' AND realtime.topic() = 'channel_name'`,
      command: 'INSERT',
      roles: [],
    },
    {
      id: 'policy-presences-1',
      preview: false,
      templateName: 'Allow listening for presences on all channels for authenticated users only',
      description:
        'This policy enables listening for presences on all channels for all authenticated users only.',
      statement: `
create policy "Allow listening for presences on all channels for authenticated users only"
on realtime.messages for select
to authenticated
using ( realtime.messages.extension = 'presence' );`.trim(),
      name: 'Allow listening for presences on all channels for authenticated users only',
      definition: "realtime.messages.extension = 'presence'",
      check: '',
      command: 'SELECT',
      roles: ['authenticated'],
    },
    {
      id: 'policy-presences-2',
      preview: false,
      templateName: 'Allow broadcasting presences on all channels for authenticated users only',
      description:
        'This policy enables broadcasting presences on all channels for all authenticated users only.',
      statement: `
create policy "Allow broadcasting presences on all channels for authenticated users only"
ON realtime.messages for insert
TO authenticated
with check ( realtime.messages.extension = 'presence' );
  ;`.trim(),
      name: 'Allow broadcasting presences on all channels for authenticated users only',
      definition: "realtime.messages.extension = 'presence'",
      check: "realtime.messages.extension = 'presence'",
      command: 'INSERT',
      roles: ['authenticated'],
    },
    {
      id: 'policy-presences-3',
      preview: false,
      templateName: 'Allow listening for presences from a specific channel',
      description: 'This policy enables listening for presences from a specific channel.',
      statement: `
create policy "Allow listening for presences from a specific channel"
on realtime.messages for select
using ( realtime.messages.extension = 'presence' AND realtime.topic() = 'channel_name' );`.trim(),
      name: 'Allow listening for presences from a specific channel',
      definition: `realtime.messages.extension = 'presence' AND realtime.topic() = 'channel_name'`,
      check: '',
      command: 'SELECT',
      roles: [],
    },
    {
      id: 'policy-presences-4',
      preview: false,
      templateName: 'Publish presence to a specific channel',
      description: 'This policy allows publishing presence to a specific channel.',
      statement: `
create policy "Publish presence to a specific channel"
ON realtime.messages for insert
with check ( realtime.messages.extension = 'presence' AND realtime.topic() = 'channel_name' );
  ;`.trim(),
      name: 'Publish presence to a specific channel',
      definition: `realtime.messages.extension = 'presence' AND realtime.topic() = 'channel_name'`,
      check: `realtime.messages.extension = 'presence' AND realtime.topic() = 'channel_name'`,
      command: 'INSERT',
      roles: [],
    },
  ] as PolicyTemplate[]
  return results
}
