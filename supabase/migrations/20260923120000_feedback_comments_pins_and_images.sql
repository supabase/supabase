alter table feedback_comments
add column pins jsonb,
add column images text[],
add column user_agent text default left(
	nullif(current_setting('request.headers', true), '')::json ->> 'user-agent',
	255
);

comment on column feedback_comments.pins is
'Page elements the user pinned: an array of element descriptors (tag, role, name, text, heading, pathname). Attacker-controlled plain text.';
comment on column feedback_comments.images is
'Object paths of images the user attached, in the docs-feedback-images storage bucket. Attacker-controlled plain text: a path may not exist.';
comment on column feedback_comments.user_agent is
'User agent of the submitting request, captured server-side and truncated to 255 characters.';

alter table feedback_comments
add constraint feedback_comments_pins_is_bounded_array check (
	pins is null or (
		case when jsonb_typeof(pins) = 'array' then jsonb_array_length(pins) <= 10 else false end
	)
),
add constraint feedback_comments_images_is_bounded check (
	images is null or cardinality(images) <= 5
),
add constraint feedback_comments_pins_size check (pg_column_size(pins) <= 16384),
add constraint feedback_comments_images_size check (pg_column_size(images) <= 1024);

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

grant insert (page, vote, title, comment, pins, images, metadata, user_id)
on table feedback_comments to anon, authenticated;
grant insert (vote, page, metadata)
on table feedback to anon, authenticated;

grant select, delete on table feedback_comments to service_role;
grant select, delete on table feedback to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
	'docs-feedback-images',
	'docs-feedback-images',
	false,
	5242880,
	array['image/png', 'image/jpeg', 'image/webp']
);

create policy "Anyone can upload docs feedback images"
on storage.objects
as permissive for insert
to anon, authenticated
with check (
	bucket_id = 'docs-feedback-images'
	and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$'
);

create view metrics.feedback_response_aggregate_dock
as select
  count(*) filter (where vote = 'yes') as yes,
  count(*) filter (where vote = 'no') as no
from feedback
where metadata ->> 'source' = 'dock';
