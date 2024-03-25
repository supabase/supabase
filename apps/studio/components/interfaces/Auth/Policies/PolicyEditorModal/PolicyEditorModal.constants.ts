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
on ${schema}.${table}
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
  auth.jwt() ->> 'email' = email
) with check (
  auth.jwt() ->> 'email' = email
);`.trim(),
    name: 'Enable update for users based on email',
    definition: `auth.jwt() ->> 'email' = email`,
    check: `auth.jwt() ->> 'email' = email`,
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
  auth.uid() = user_id
);`.trim(),
    name: 'Enable delete for users based on user_id',
    definition: 'auth.uid() = user_id',
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
  auth.uid() = user_id
);`.trim(),
    name: 'Enable insert for users based on user_id',
    definition: '',
    check: 'auth.uid() = user_id',
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
  auth.uid() in (
    select user_id from members where team_id = id
  )
);
`.trim(),
    definition: `auth.uid() in (select user_id from members where team_id = id)`,
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
