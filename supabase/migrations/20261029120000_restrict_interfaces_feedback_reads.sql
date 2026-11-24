-- Clients only submit and delete feedback, so they no longer need to read it.
-- This stops a leaked token from being used to read a submission.

-- Start from no access. Default grants differ between database images, and a
-- table-level select would override any column-level revoke.
revoke all on table public.interfaces_feedback from anon, authenticated;

-- Deletes need both of these. Clients filter on delete_token, and a delete
-- with a filter requires select on the filtered column and passes through the
-- select policy. The token is the only column anon can read.
grant select (delete_token) on table public.interfaces_feedback to anon;
grant delete on table public.interfaces_feedback to anon;

alter policy "Token holders can read their own feedback"
on public.interfaces_feedback
rename to "Token holders can match their own feedback for deletion";

comment on column public.interfaces_feedback.delete_token is
'Returned once by submit_interfaces_feedback(). Send it in the x-feedback-token header to delete the row. If the row has a project_ref or user_id, also send matching x-feedback-project-ref and x-feedback-user-id headers.';
