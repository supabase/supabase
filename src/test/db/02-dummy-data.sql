CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION postgres;



-- insert users
INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at") VALUES
('00000000-0000-0000-0000-000000000000', '317eadce-631a-4429-a0bb-f19a7a517b4a', 'authenticated', 'authenticated', 'inian+user2@supabase.io', '', NULL, '2021-02-17 04:41:13.408828+00', '541rn7rTZPGeGCYsp0a38g', '2021-02-17 04:41:13.408828+00', '', NULL, '', '', NULL, NULL, '{"provider": "email"}', 'null', 'f', '2021-02-17 04:41:13.406912+00', '2021-02-17 04:41:13.406919+00'),
('00000000-0000-0000-0000-000000000000', '4d56e902-f0a0-4662-8448-a4d9e643c142', 'authenticated', 'authenticated', 'inian+user1@supabase.io', '', NULL, '2021-02-17 04:40:58.570482+00', 'U1HvzExEO3l7JzP-4tTxJA', '2021-02-17 04:40:58.570482+00', '', NULL, '', '', NULL, NULL, '{"provider": "email"}', 'null', 'f', '2021-02-17 04:40:58.568637+00', '2021-02-17 04:40:58.568642+00'),
('00000000-0000-0000-0000-000000000000', 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2', 'authenticated', 'authenticated', 'inian+admin@supabase.io', '', NULL, '2021-02-17 04:40:42.901743+00', '3EG99GjT_e3NC4eGEBXOjw', '2021-02-17 04:40:42.901743+00', '', NULL, '', '', NULL, NULL, '{"provider": "email"}', 'null', 'f', '2021-02-17 04:40:42.890632+00', '2021-02-17 04:40:42.890637+00');

-- insert buckets
INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "file_size_limit", "allowed_mime_types") VALUES
('bucket2', 'bucket2', '4d56e902-f0a0-4662-8448-a4d9e643c142', '2021-02-17 04:43:32.770206+00', '2021-02-17 04:43:32.770206+00', false, NULL, NULL),
('bucket3', 'bucket3', '4d56e902-f0a0-4662-8448-a4d9e643c142', '2021-02-17 04:43:32.770206+00', '2021-02-17 04:43:32.770206+00', false, NULL, NULL),
('bucket3a', 'bucket3a', '4d56e902-f0a0-4662-8448-a4d9e643c142', '2021-02-17 04:43:32.770206+00', '2021-02-17 04:43:32.770206+00', false, NULL, NULL),
('bucket4', 'bucket4', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-02-25 09:23:01.58385+00', '2021-02-25 09:23:01.58385+00', false, NULL, NULL),
('bucket5', 'bucket5', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-02-27 03:04:25.6386+00', '2021-02-27 03:04:25.6386+00', false, NULL, NULL),
('bucket6', 'bucket6', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-02-27 03:04:25.6386+00', '2021-02-27 03:04:25.6386+00', false, NULL, NULL),
('public-bucket', 'public-bucket', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-02-27 03:04:25.6386+00', '2021-02-27 03:04:25.6386+00', true, NULL, NULL),
('public-bucket-2', 'public-bucket-2', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-02-27 03:04:25.6386+00', '2021-02-27 03:04:25.6386+00', true, NULL, NULL),
('public-limit-max-size', 'public-limit-max-size', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-02-27 03:04:25.6386+00', '2021-02-27 03:04:25.6386+00', true, 10, NULL),
('public-limit-max-size-2', 'public-limit-max-size-2', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-02-27 03:04:25.6386+00', '2021-02-27 03:04:25.6386+00', true, 29526, NULL),
('public-limit-mime-types', 'public-limit-mime-types', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-02-27 03:04:25.6386+00', '2021-02-27 03:04:25.6386+00', true, NULL, '{"image/jpeg"}');


-- insert objects
INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "user_metadata") VALUES
('03e458f9-892f-4db2-8cb9-d3401a689e25', 'bucket2', 'public/sadcat-upload23.png', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-03-04 08:26:08.553748+00', '2021-03-04 08:26:08.553748+00', '2021-03-04 08:26:08.553748+00', '{"mimetype": "image/svg+xml", "size": 1234}', NULL),
('070825af-a11d-44fe-9f1d-abdc76f686f2', 'bucket2', 'public/sadcat-upload.png', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-03-02 16:31:11.115996+00', '2021-03-02 16:31:11.115996+00', '2021-03-02 16:31:11.115996+00', '{"mimetype": "image/png", "size": 1234}', NULL),
('0cac5609-11e1-4f21-b486-d0eeb60909f6', 'bucket2', 'curlimage.jpg', 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2', '2021-02-23 11:05:16.625075+00', '2021-02-23 11:05:16.625075+00', '2021-02-23 11:05:16.625075+00', '{"size": 1234}', NULL),
('147c6795-94d5-4008-9d81-f7ba3b4f8a9f', 'bucket2', 'folder/only_uid.jpg', 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2', '2021-02-17 10:36:01.504227+00', '2021-02-17 11:03:03.049618+00', '2021-02-17 10:36:01.504227+00', '{"size": 1234}', NULL),
('65a3aa9c-0ff2-4adc-85d0-eab673c27443', 'bucket2', 'authenticated/casestudy.png', 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2', '2021-02-17 10:42:19.366559+00', '2021-02-17 11:03:30.025116+00', '2021-02-17 10:42:19.366559+00', '{"size": 1234, "eTag": "abc", "lastModified": "Wed, 12 Oct 2022 11:17:02 GMT", "contentLength": 3746, "cacheControl": "no-cache"}', '{"test1": 1234}'),
('10ABE273-D77A-4BDA-B410-6FC0CA3E6ADC', 'bucket2', 'authenticated/cat.jpg', 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2', '2021-02-17 10:42:19.366559+00', '2021-02-17 11:03:30.025116+00', '2021-02-17 10:42:19.366559+00', '{"size": 1234}', NULL),
('1edccac7-0876-4e9f-89da-a08d2a5f654b', 'bucket2', 'authenticated/delete.png', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-03-02 16:31:11.115996+00', '2021-03-02 16:31:11.115996+00', '2021-03-02 16:31:11.115996+00', '{"mimetype": "image/png", "size": 1234}', NULL),
('1a911f3c-8c1d-4661-93c1-8e065e4d757e', 'bucket2', 'authenticated/delete1.png', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-02-22 22:29:15.14732+00', '2021-02-22 22:29:15.14732+00', '2021-03-02 09:32:17.116+00', '{"mimetype": "image/png", "size": 1234}', NULL),
('372d5d74-e24d-49dc-abe8-47d7eb226a2e', 'bucket2', 'authenticated/delete-multiple1.png', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-02-22 22:29:15.14732+00', '2021-02-22 22:29:15.14732+00', '2021-03-02 09:32:17.116+00', '{"mimetype": "image/png", "size": 1234}', NULL),
('34811c1b-85e5-4eb6-a5e3-d607b2f6986e', 'bucket2', 'authenticated/delete-multiple2.png', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-02-22 22:29:15.14732+00', '2021-02-22 22:29:15.14732+00', '2021-03-02 09:32:17.116+00', '{"mimetype": "image/png", "size": 1234}', NULL),
('45950ff2-d3a8-4add-8e49-bafc01198340', 'bucket2', 'authenticated/delete-multiple3.png', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-02-22 22:29:15.14732+00', '2021-02-22 22:29:15.14732+00', '2021-03-02 09:32:17.116+00', '{"mimetype": "image/png", "size": 1234}', NULL),
('469b0216-5419-41f6-9a37-2abfd7fad29c', 'bucket2', 'authenticated/delete-multiple4.png', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-02-22 22:29:15.14732+00', '2021-02-22 22:29:15.14732+00', '2021-03-02 09:32:17.116+00', '{"mimetype": "image/png", "size": 1234}', NULL),
('55930619-a668-4dbc-aea3-b93dfe101e7f', 'bucket2', 'authenticated/delete-multiple7.png', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-02-22 22:29:15.14732+00', '2021-02-22 22:29:15.14732+00', '2021-03-02 09:32:17.116+00', '{"mimetype": "image/png", "size": 1234}', NULL),
('D1CE4E4F-03E2-473D-858B-301D7989B581', 'bucket2', 'authenticated/move-orig.png', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-02-22 22:29:15.14732+00', '2021-02-22 22:29:15.14732+00', '2021-03-02 09:32:17.116+00', '{"mimetype": "image/png", "size": 1234}', NULL),
('222b3d1e-bc17-414c-b336-47894aa4d697', 'bucket2', 'authenticated/move-orig-2.png', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-02-22 22:29:15.14732+00', '2021-02-22 22:29:15.14732+00', '2021-03-02 09:32:17.116+00', '{"mimetype": "image/png", "size": 1234}', NULL),
('8f7d643d-1e82-4d39-ae39-d9bd6b0cfe9c', 'bucket2', 'authenticated/move-orig-3.png', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-02-22 22:29:15.14732+00', '2021-02-22 22:29:15.14732+00', '2021-03-02 09:32:17.116+00', '{"mimetype": "image/png", "size": 1234}', NULL),
('24f70210-62aa-4daa-9909-693b3febd8fd', 'bucket2', 'authenticated/move-orig-4.png', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-02-22 22:29:15.14732+00', '2021-02-22 22:29:15.14732+00', '2021-03-02 09:32:17.116+00', '{"mimetype": "image/png", "size": 1234}', NULL),
('18dc5e3b-4fb1-45a7-bfa4-d99b0784be31', 'bucket2', 'authenticated/move-orig-5.png', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-02-22 22:29:15.14732+00', '2021-02-22 22:29:15.14732+00', '2021-03-02 09:32:17.116+00', '{"mimetype": "image/png", "size": 1234}', NULL),
('8377527d-3518-4dc8-8290-c6926470e795', 'bucket2', 'folder/subfolder/public-all-permissions.png', 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2', '2021-02-17 10:26:42.791214+00', '2021-02-17 11:03:30.025116+00', '2021-02-17 10:26:42.791214+00', '{"size": 1234}', NULL),
('8377527d-3518-4dc8-8290-c6926470e796', 'bucket2', 'folder/UPPER-folder/public-all-permissions.png', 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2', '2021-02-17 10:26:42.791214+00', '2021-02-17 11:03:30.025116+00', '2021-02-17 10:26:42.791214+00', '{"size": 1234}', NULL),
('b39ae4ab-802b-4c42-9271-3f908c34363c', 'bucket2', 'private/sadcat-upload3.png', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-03-01 08:53:29.567975+00', '2021-03-01 08:53:29.567975+00', '2021-03-01 08:53:29.567975+00', '{"mimetype": "image/svg+xml", "size": 1234}', NULL),
('8098E1AC-C744-4368-86DF-71B60CCDE221', 'bucket3', 'sadcat-upload3.png', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-03-01 08:53:29.567975+00', '2021-03-01 08:53:29.567975+00', '2021-03-01 08:53:29.567975+00', '{"mimetype": "image/svg+xml", "size": 1234}', NULL),
('D3EB488E-94F4-46CD-86D3-242C13B95BAC', 'bucket3', 'sadcat-upload2.png', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-03-01 08:53:29.567975+00', '2021-03-01 08:53:29.567975+00', '2021-03-01 08:53:29.567975+00', '{"mimetype": "image/svg+xml", "size": 1234}', NULL),
('8098E1AC-C744-4368-86DF-71B60CCDE222', 'bucket3a', 'sadcat-upload33.png', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-03-01 08:53:29.567975+00', '2021-03-01 08:53:29.567975+00', '2021-03-01 08:53:29.567975+00', '{"mimetype": "image/svg+xml", "size": 1234}', NULL),
('D3EB488E-94F4-46CD-86D3-242C13B95BAD', 'bucket3a', 'sadcat-upload22.png', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-03-01 08:53:29.567975+00', '2021-03-01 08:53:29.567975+00', '2021-03-01 08:53:29.567975+00', '{"mimetype": "image/svg+xml", "size": 1234}', NULL),
('746180e8-8029-4134-8a21-48ab35485d81', 'public-bucket', 'favicon.ico', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-03-01 08:53:29.567975+00', '2021-03-01 08:53:29.567975+00', '2021-03-01 08:53:29.567975+00', '{"mimetype": "image/svg+xml", "size": 1234}', NULL),
('ea2e2806-9ded-4882-8c26-e172a29ed063', 'public-bucket-2', 'favicon.ico', '317eadce-631a-4429-a0bb-f19a7a517b4a', '2021-03-01 08:53:29.567975+00', '2021-03-01 08:53:29.567975+00', '2021-03-01 08:53:29.567975+00', '{"size": 1234, "mimetype": "image/svg+xml", "eTag": "abc", "lastModified": "Wed, 12 Oct 2022 11:17:02 GMT", "contentLength": 3746, "cacheControl": "no-cache"}', NULL);
;
INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata")
SELECT gen_random_uuid(), 'bucket2', 'authenticated/' || i, '317eadce-631a-4429-a0bb-f19a7a517b4a', now(), now(), now(), '{"size": 1234}'
from generate_series(0, 999) i;

-- add policies
-- allows user to CRUD all buckets
CREATE POLICY crud_buckets ON storage.buckets for all USING (auth.uid() = '317eadce-631a-4429-a0bb-f19a7a517b4a');
-- allow public CRUD acccess to the public folder in bucket2
CREATE POLICY crud_public_folder ON storage.objects for all USING (bucket_id='bucket2' and (storage.foldername(name))[1] = 'public');
-- allow public CRUD acccess to a particular file in bucket2
CREATE POLICY crud_public_file ON storage.objects for all USING (bucket_id='bucket2' and name = 'folder/subfolder/public-all-permissions.png');
-- allow public CRUD acccess to a folder in bucket2 to a user with a given id
CREATE POLICY crud_uid_folder ON storage.objects for all USING (bucket_id='bucket2' and (storage.foldername(name))[1] = 'only_uid' and auth.uid() = 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2');
-- allow public CRUD acccess to a file in bucket2 to a user with a given id
CREATE POLICY crud_uid_file ON storage.objects for all USING (bucket_id='bucket2' and name = 'folder/only_uid.jpg' and auth.uid() = 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2');
-- allow CRUD acccess to a folder in bucket2 to all authenticated users
CREATE POLICY authenticated_folder ON storage.objects for all USING (bucket_id='bucket2' and (storage.foldername(name))[1] = 'authenticated' and auth.role() = 'authenticated');
CREATE POLICY authenticated_folder_bucket_3 ON storage.objects for all USING (bucket_id='bucket3' and (storage.foldername(name))[1] = 'authenticated' and auth.role() = 'authenticated');
-- allow CRUD access to a folder in bucket2 to its owners
CREATE POLICY crud_owner_only ON storage.objects for all USING (bucket_id='bucket2' and (storage.foldername(name))[1] = 'only_owner' and owner = auth.uid());
-- allow CRUD access to bucket4
CREATE POLICY open_all_update ON storage.objects for all WITH CHECK (bucket_id='bucket4');
