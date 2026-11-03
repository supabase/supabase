CREATE VIEW "public"."tickets_view" WITH (security_invoker=on) AS  WITH lw12_referrals AS (
         SELECT tickets_1.referred_by,
            count(*) AS referrals
           FROM public.tickets tickets_1
          WHERE (tickets_1.referred_by IS NOT NULL)
          GROUP BY tickets_1.referred_by
        )
 SELECT tickets.id,
    tickets.name,
    tickets.username,
    tickets.ticket_number,
    tickets.created_at,
    tickets.launch_week,
    tickets.shared_on_twitter,
    tickets.shared_on_linkedin,
    tickets.metadata,
    tickets.role,
    tickets.company,
    tickets.location,
        CASE
            WHEN (lw12_referrals.referrals IS NULL) THEN (0)::bigint
            ELSE lw12_referrals.referrals
        END AS referrals,
        CASE
            WHEN ((tickets.shared_on_twitter IS NOT NULL) AND (tickets.shared_on_linkedin IS NOT NULL)) THEN true
            ELSE false
        END AS platinum,
        CASE
            WHEN (tickets.game_won_at IS NOT NULL) THEN true
            ELSE false
        END AS secret
   FROM (public.tickets
     LEFT JOIN lw12_referrals ON ((tickets.username = lw12_referrals.referred_by)));

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tickets_view" TO "anon", "authenticated";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tickets_view" TO "service_role";

REVOKE ALL ON TABLE "public"."tickets_view" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tickets_view" TO "postgres";
