CREATE OR REPLACE FUNCTION public.submit_interfaces_feedback (
  feedback    text,
  user_agent  text  DEFAULT NULL::text,
  user_id     text  DEFAULT NULL::text,
  project_ref text  DEFAULT NULL::text,
  metadata    jsonb DEFAULT NULL::jsonb
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
#variable_conflict use_variable
declare
	token uuid;
begin
	insert into public.interfaces_feedback (feedback, user_agent, user_id, project_ref, metadata)
	values (feedback, user_agent, user_id, project_ref, metadata)
	returning delete_token into token;
	return token;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."submit_interfaces_feedback"(text, text, text, text, jsonb) TO "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."submit_interfaces_feedback"(text, text, text, text, jsonb) TO "service_role";

COMMENT ON FUNCTION "public"."submit_interfaces_feedback"(text, text, text, text, jsonb) IS 'Submits interface feedback and returns the delete token (issued exactly once).';

REVOKE ALL ON FUNCTION "public"."submit_interfaces_feedback"(text, text, text, text, jsonb) FROM PUBLIC;

REVOKE ALL ON FUNCTION "public"."submit_interfaces_feedback"(text, text, text, text, jsonb) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."submit_interfaces_feedback"(text, text, text, text, jsonb) TO "postgres";
