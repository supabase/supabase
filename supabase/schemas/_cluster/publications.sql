CREATE PUBLICATION "pub_data_engineering" FOR TABLE "public"."feedback", "public"."feedback_comments", "public"."interfaces_feedback" WITH (
  publish = 'insert, update, delete, truncate'
);

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."meetups";

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."tickets";
