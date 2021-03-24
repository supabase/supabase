export default [
  {
    lang: 'sql',
    title: 'Public access to a bucket',
    code: `CREATE POLICY open_all_update 
ON storage.objects 
for all WITH CHECK (bucket_id='bucket1');
    `,
    detail_title: 'Allow public CRUD access to a bucket',
    detail_text: "This will allow any user access to the bucket named 'bucket1'",
    badges_label: '',
    badges: [],
    url: '',
  },
  {
    lang: 'sql',
    title: 'Public access to a folder',
    code: `CREATE POLICY crud_public_folder 
ON storage.objects 
for all USING (bucket_id='bucket1' and (storage.foldername(name))[1] = 'public');
    `,
    detail_title: 'Allow public CRUD access to a folder in a bucket',
    detail_text:
      "This will allow any user access to the folder named 'public' in the bucket 'bucket1'",
    badges_label: '',
    badges: [],
    url: '',
  },
  {
    lang: 'sql',
    title: 'Authenticated access to a folder',
    code: `CREATE POLICY authenticated_folder 
ON storage.objects 
for all USING (bucket_id='bucket1' and (storage.foldername(name))[1] = 'authenticated' and auth.role() = 'authenticated');`,
    detail_title: 'Allow any authenticated user access to a folder',
    detail_text:
      "This will allow any authenticated user access to the folder named 'authenticated' in the bucket 'bucket1'",
    badges_label: '',
    badges: [],
    url: '',
  },
  {
    lang: 'sql',
    title: 'User access to a file',
    code: `CREATE POLICY crud_uid_file 
ON storage.objects 
for all USING (bucket_id='bucket2' and name = 'folder/only_uid.jpg' and auth.uid() = 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2');`,
    detail_title: 'Allow a specific user access to a file',
    detail_text:
      "This will allow a specific user based on the user's UID access to a file named 'only_uid.jpg'",
    badges_label: '',
    badges: [],
    url: '',
  },
]
