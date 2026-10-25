CREATE EXTENSION "vector" SCHEMA "public";

COMMENT ON EXTENSION "vector" IS 'vector data type and ivfflat access method';

REVOKE ALL ON FUNCTION "public"."avg"(public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."avg"(public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."avg"(public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."avg"(public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."avg"(public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."avg"(public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "public"."cosine_distance"(public.vector, public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."cosine_distance"(public.vector, public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."cosine_distance"(public.vector, public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."cosine_distance"(public.vector, public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."cosine_distance"(public.vector, public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."cosine_distance"(public.vector, public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."inner_product"(public.vector, public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."inner_product"(public.vector, public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."inner_product"(public.vector, public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."inner_product"(public.vector, public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."inner_product"(public.vector, public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."inner_product"(public.vector, public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."ivfflathandler"(internal) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."ivfflathandler"(internal) TO "anon";

REVOKE ALL ON FUNCTION "public"."ivfflathandler"(internal) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."ivfflathandler"(internal) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."ivfflathandler"(internal) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."ivfflathandler"(internal) TO "service_role";

REVOKE ALL ON FUNCTION "public"."l2_distance"(public.vector, public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."l2_distance"(public.vector, public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."l2_distance"(public.vector, public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."l2_distance"(public.vector, public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."l2_distance"(public.vector, public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."l2_distance"(public.vector, public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector"(public.vector, integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector"(public.vector, integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector"(public.vector, integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector"(public.vector, integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector"(public.vector, integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector"(public.vector, integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_accum"(double precision[], public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_accum"(double precision[], public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_accum"(double precision[], public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_accum"(double precision[], public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_accum"(double precision[], public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_accum"(double precision[], public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_add"(public.vector, public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_add"(public.vector, public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_add"(public.vector, public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_add"(public.vector, public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_add"(public.vector, public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_add"(public.vector, public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_avg"(double precision[]) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_avg"(double precision[]) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_avg"(double precision[]) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_cmp"(public.vector, public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_cmp"(public.vector, public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_cmp"(public.vector, public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_cmp"(public.vector, public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_cmp"(public.vector, public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_cmp"(public.vector, public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_dims"(public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_dims"(public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_dims"(public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_dims"(public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_dims"(public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_dims"(public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_eq"(public.vector, public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_eq"(public.vector, public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_eq"(public.vector, public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_eq"(public.vector, public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_eq"(public.vector, public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_eq"(public.vector, public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_ge"(public.vector, public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_ge"(public.vector, public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_ge"(public.vector, public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_ge"(public.vector, public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_ge"(public.vector, public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_ge"(public.vector, public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_gt"(public.vector, public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_gt"(public.vector, public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_gt"(public.vector, public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_gt"(public.vector, public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_gt"(public.vector, public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_gt"(public.vector, public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_in"(cstring, oid, integer) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_in"(cstring, oid, integer) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_in"(cstring, oid, integer) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_in"(cstring, oid, integer) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_in"(cstring, oid, integer) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_in"(cstring, oid, integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_l2_squared_distance"(public.vector, public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_l2_squared_distance"(public.vector, public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_l2_squared_distance"(public.vector, public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_l2_squared_distance"(public.vector, public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_l2_squared_distance"(public.vector, public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_l2_squared_distance"(public.vector, public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_le"(public.vector, public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_le"(public.vector, public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_le"(public.vector, public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_le"(public.vector, public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_le"(public.vector, public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_le"(public.vector, public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_lt"(public.vector, public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_lt"(public.vector, public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_lt"(public.vector, public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_lt"(public.vector, public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_lt"(public.vector, public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_lt"(public.vector, public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_ne"(public.vector, public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_ne"(public.vector, public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_ne"(public.vector, public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_ne"(public.vector, public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_ne"(public.vector, public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_ne"(public.vector, public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_negative_inner_product"(public.vector, public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_negative_inner_product"(public.vector, public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_negative_inner_product"(public.vector, public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_negative_inner_product"(public.vector, public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_negative_inner_product"(public.vector, public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_negative_inner_product"(public.vector, public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_norm"(public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_norm"(public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_norm"(public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_norm"(public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_norm"(public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_norm"(public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_out"(public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_out"(public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_out"(public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_out"(public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_out"(public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_out"(public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_recv"(internal, oid, integer) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_recv"(internal, oid, integer) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_recv"(internal, oid, integer) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_recv"(internal, oid, integer) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_recv"(internal, oid, integer) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_recv"(internal, oid, integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_send"(public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_send"(public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_send"(public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_send"(public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_send"(public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_send"(public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_spherical_distance"(public.vector, public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_spherical_distance"(public.vector, public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_spherical_distance"(public.vector, public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_spherical_distance"(public.vector, public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_spherical_distance"(public.vector, public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_spherical_distance"(public.vector, public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_sub"(public.vector, public.vector) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_sub"(public.vector, public.vector) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_sub"(public.vector, public.vector) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_sub"(public.vector, public.vector) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_sub"(public.vector, public.vector) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_sub"(public.vector, public.vector) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_to_float4"(public.vector, integer, boolean) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_to_float4"(public.vector, integer, boolean) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_to_float4"(public.vector, integer, boolean) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_to_float4"(public.vector, integer, boolean) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_to_float4"(public.vector, integer, boolean) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_to_float4"(public.vector, integer, boolean) TO "service_role";

REVOKE ALL ON FUNCTION "public"."vector_typmod_in"(cstring[]) FROM "anon";

GRANT EXECUTE ON FUNCTION "public"."vector_typmod_in"(cstring[]) TO "anon";

REVOKE ALL ON FUNCTION "public"."vector_typmod_in"(cstring[]) FROM "authenticated";

GRANT EXECUTE ON FUNCTION "public"."vector_typmod_in"(cstring[]) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."vector_typmod_in"(cstring[]) FROM "service_role";

GRANT EXECUTE ON FUNCTION "public"."vector_typmod_in"(cstring[]) TO "service_role";
