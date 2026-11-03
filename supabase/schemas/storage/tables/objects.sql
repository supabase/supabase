CREATE POLICY "Allow anon users to select and insert files oi12w6_0" ON "storage"."objects"
  FOR SELECT
  TO "anon"
  USING ((bucket_id = 'integrations-images'::text));

CREATE POLICY "Allow anon users to select and insert files oi12w6_1" ON "storage"."objects"
  FOR INSERT
  TO "anon"
  WITH CHECK ((bucket_id = 'integrations-images'::text));

CREATE POLICY "Allow anon users to upload and view images 7lkd21_0" ON "storage"."objects"
  FOR INSERT
  TO "anon"
  WITH CHECK ((bucket_id = 'temp-for-testing-integrations'::text));

CREATE POLICY "Allow anon users to upload and view images 7lkd21_1" ON "storage"."objects"
  FOR SELECT
  TO "anon"
  USING ((bucket_id = 'temp-for-testing-integrations'::text));
