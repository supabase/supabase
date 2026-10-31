alter table feedback_comments
add column user_agent text default left(
	nullif(current_setting('request.headers', true), '')::json ->> 'user-agent',
	255
);

comment on column feedback_comments.user_agent is
'User agent of the submitting request, captured server-side and truncated to 255 characters.';

alter table feedback_comments
add constraint feedback_comments_comment_length check (char_length(comment) between 1 and 2000) not valid,
add constraint feedback_comments_page_length check (char_length(page) <= 512) not valid,
add constraint feedback_comments_title_length check (char_length(title) <= 200) not valid,
add constraint feedback_comments_metadata_size check (pg_column_size(metadata) <= 2048) not valid;

alter table feedback
add constraint feedback_page_length check (char_length(page) <= 512) not valid,
add constraint feedback_metadata_size check (pg_column_size(metadata) <= 2048) not valid;

revoke insert on table feedback_comments from anon, authenticated;
revoke insert on table feedback from anon, authenticated;

grant insert (page, vote, title, comment, metadata, user_id)
on table feedback_comments to anon, authenticated;
grant insert (vote, page, metadata)
on table feedback to anon, authenticated;

grant select, delete on table feedback_comments to service_role;
grant select, delete on table feedback to service_role;
