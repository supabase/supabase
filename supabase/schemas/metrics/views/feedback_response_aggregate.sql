CREATE VIEW "metrics"."feedback_response_aggregate" AS  SELECT count(*) FILTER (WHERE (feedback.vote = 'yes'::public.feedback_vote)) AS yes,
    count(*) FILTER (WHERE (feedback.vote = 'no'::public.feedback_vote)) AS no
   FROM public.feedback;
