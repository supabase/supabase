/**
 * ----------------------------------------------------------------
 * PostgreSQL policy templates for the storage dashboard
 * ----------------------------------------------------------------
 * id: Unique identifier for the monaco editor to dynamically refresh
 * templateName: As a display for a more descriptive title for the policy
 * description: Additional details about the template and how to make it yours
 * statement: SQL statement template for the policy
 *
 * name: Actual policy name that will be used in the editor
 * definition: Actual policy definition that will be used in the editor
 * allowedOperations: Operations to create policies for
 */

export const STORAGE_POLICY_TEMPLATES = [
  {
    id: 'policy-1',
    templateName: 'Allow access to JPG images in a public folder to anonymous users',
    description:
      'This policy uses native postgres functions, functions from auth and storage schema',
    name: 'Give anon users access to JPG images in folder',
    statement: `
CREATE POLICY "policy_name"
ON storage.objects FOR {operation} {USING | WITH CHECK} (
  -- restrict bucket
  bucket_id = {bucket_name}
  -- allow access to only jpg file
  AND storage."extension"(name) = 'jpg'
  -- in the public folder
  AND LOWER((storage.foldername(name))[1]) = 'public'
  -- to anonymous users
  AND auth.role() = 'anon'
);
    `.trim(),
    definition: `bucket_id = {bucket_id} AND storage."extension"(name) = 'jpg' AND LOWER((storage.foldername(name))[1]) = 'public' AND auth.role() = 'anon'`,
    allowedOperations: [],
  },
  {
    id: 'policy-2',
    templateName: 'Give users access to only their own a top level folder named as uid',
    description:
      'For example a user with id d7bed83c-44a0-4a4f-925f-efc384ea1e50 will be able to access anything under the folder d7bed83c-44a0-4a4f-925f-efc384ea1e50/',
    name: 'Give users access to own folder',
    statement: `
CREATE POLICY "policy_name"
ON storage.objects FOR {operation} {USING | WITH CHECK} (
    -- restrict bucket
    bucket_id = {bucket_name}
    and auth.uid()::text = (storage.foldername(name))[1]
);
    `.trim(),
    definition: `bucket_id = {bucket_id} AND auth.uid()::text = (storage.foldername(name))[1]`,
    allowedOperations: [],
  },
  {
    id: 'policy-3',
    templateName: 'Give users access to a folder only to authenticated users',
    description:
      'This policy gives users access to a folder (e.g private) only if they are authenticated',
    name: 'Give users authenticated access to folder',
    statement: `
CREATE POLICY "policy_name"
ON storage.objects FOR {operation} {USING | WITH CHECK} (
    -- restrict bucket
    bucket_id = {bucket_name}
    AND (storage.foldername(name))[1] = 'private'
    AND auth.role() = 'authenticated'
);
    `.trim(),
    definition: `bucket_id = {bucket_id} AND (storage.foldername(name))[1] = 'private' AND auth.role() = 'authenticated'`,
    allowedOperations: [],
  },
  {
    id: 'policy-4',
    templateName: 'Give access to a nested folder called admin/assets only to a specific user',
    description:
      'This policy gives read access to all authenticated users for your project to the folder "public"',
    name: 'Give access to a folder',
    statement: `
CREATE POLICY "policy_name"
ON storage.objects FOR {operation} {USING | WITH CHECK} (
	  -- restrict bucket
    bucket_id = {bucket_name}
    AND (storage.foldername(name))[1] = 'admin' AND (storage.foldername(name))[2] = 'assets'
    AND auth.uid()::text = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50'
);
    `.trim(),
    definition: `bucket_id = {bucket_id} AND (storage.foldername(name))[1] = 'admin' AND (storage.foldername(name))[2] = 'assets' AND auth.uid()::text = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50'`,
    allowedOperations: [],
  },
  {
    id: 'policy-5',
    templateName: 'Give access to a file to a user',
    description: 'This policy gives access to a specific file to a specific user',
    name: 'Give access to a file to user',
    statement: `
CREATE POLICY "policy_name"
ON storage.objects FOR {operation} {USING | WITH CHECK} (
	  -- restrict bucket
    bucket_id = {bucket_name}
    AND name = 'admin/assets/Costa Rican Frog.jpg'
    AND auth.uid()::text = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50'
);
    `.trim(),
    definition: `bucket_id = {bucket_id} AND name = 'admin/assets/Costa Rican Frog.jpg' AND auth.uid()::text = 'd7bed83c-44a0-4a4f-925f-efc384ea1e50'`,
    allowedOperations: [],
  },
]
