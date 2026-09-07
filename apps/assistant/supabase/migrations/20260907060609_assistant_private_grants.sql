REVOKE ALL ON TABLE "public"."oauth_connections" FROM "anon";

REVOKE ALL ON TABLE "public"."oauth_states" FROM "anon";

REVOKE ALL ON TABLE "public"."oauth_states" FROM "authenticated";

REVOKE ALL ON TABLE "public"."platform_identities" FROM "anon";

REVOKE ALL ON TABLE "public"."project_permissions" FROM "anon";

REVOKE ALL ON TABLE "public"."oauth_connections" FROM "authenticated";

GRANT SELECT ON TABLE "public"."oauth_connections" TO "authenticated";

REVOKE ALL ON TABLE "public"."platform_identities" FROM "authenticated";

GRANT SELECT ON TABLE "public"."platform_identities" TO "authenticated";
