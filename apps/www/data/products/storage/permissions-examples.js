export default [
  {
    lang: 'sql',
    title: 'Public access to a bucket',
    code: `create policy "Public Access" 
on storage.objects for all 
using ( bucket_id = 'avatars' );
    `,
    detail_title: 'Allow public CRUD access to a bucket',
    detail_text: "This will allow any user access to the bucket named 'avatars'",
    badges_label: '',
    badges: [],
    url: '',
  },
  {
    lang: 'sql',
    title: 'Public access to a folder',
    code: `create policy "Public access to a folder" 
on storage.objects for all 
using (
  bucket_id = 'avatars' 
  and (storage.foldername(name))[1] = 'public' 
);
    `,
    detail_title: 'Allow public CRUD access to a folder in a bucket',
    detail_text:
      "This will allow any user access to the folder named 'public' in the bucket 'avatars'",
    badges_label: '',
    badges: [],
    url: '',
  },
  {
    lang: 'sql',
    title: 'Authenticated access to a bucket',
    code: `create policy "Logged in access" 
on storage.objects 
for all using (
  bucket_id = 'avatars' 
  and auth.role() = 'authenticated'
);`,
    detail_title: 'Allow any authenticated user access to a folder',
    detail_text:
      "This will allow any authenticated user access to the folder named 'authenticated' in the bucket 'avatars'",
    badges_label: '',
    badges: [],
    url: '',
  },
  {
    lang: 'sql',
    title: 'Individual access to a file',
    code: `create policy "Individual access" 
on storage.objects for all 
using (
  bucket_id = 'avatars' 
  and name = 'folder/only_uid.jpg' 
  and (select auth.uid()) = 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2'
);`,
    detail_title: 'Allow a specific user access to a file',
    detail_text:
      "This will allow a specific user based on the user's UID access to a file named 'only_uid.jpg'",
    badges_label: '',
    badges: [],
    url: '',
  },
]
