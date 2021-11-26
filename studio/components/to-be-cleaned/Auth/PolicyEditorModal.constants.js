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

export const getGeneralPolicyTemplates = (schema, table) => [
  {
    id: 'policy-1',
    templateName: 'Enable read access to everyone',
    description:
      'This policy gives read access to your table for all users via the SELECT operation.',
    statement: `
CREATE POLICY "policy_name"
ON ${schema}.${table}
FOR SELECT USING (
  true
);`.trim(),
    name: 'Enable access to all users',
    definition: 'true',
    check: '',
    command: 'SELECT',
  },
  {
    id: 'policy-2',
    templateName: 'Enable insert access for authenticated users only',
    description: 'This policy gives insert access to your table for all authenticated users only.',
    statement: `
CREATE POLICY "policy_name"
ON ${schema}.${table}
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);`.trim(),
    name: 'Enable insert for authenticated users only',
    definition: '',
    check: `auth.role() = 'authenticated'`,
    command: 'INSERT',
  },
  {
    id: 'policy-3',
    templateName: 'Enable update access for users based on their email *',
    description:
      'This policy assumes that your table has a column "email", and allows users to update rows which the "email" column matches their email.',
    statement: `
CREATE POLICY "policy_name"
ON ${schema}.${table}
FOR UPDATE USING (
  auth.email() = email
) WITH CHECK (
  auth.email() = email
);`.trim(),
    name: 'Enable update for users based on email',
    definition: 'auth.email() = email',
    check: 'auth.email() = email',
    command: 'UPDATE',
  },
  {
    id: 'policy-4',
    templateName: 'Enable delete access for users based on their user ID *',
    description:
      'This policy assumes that your table has a column "user_id", and allows users to delete rows which the "user_id" column matches their ID',
    statement: `
CREATE POLICY "policy_name"
ON ${schema}.${table}
FOR DELETE USING (
  auth.uid() = user_id
);`.trim(),
    name: 'Enable delete for users based on user_id',
    definition: 'auth.uid() = user_id',
    check: '',
    command: 'DELETE',
  },
]
