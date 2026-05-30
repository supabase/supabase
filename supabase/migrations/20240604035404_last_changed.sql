create table last_changed (
	id bigint primary key generated always as identity,
	checksum text not null,
	parent_page text not null,
	heading text not null,
	last_updated timestamp with time zone default now() not null,
	last_checked timestamp with time zone default now() not null,
	unique (parent_page, heading)
);

comment on table last_changed is
'Records when page sections from docs content were last edited.';
comment on column last_changed.checksum is
'Checksum of most recent section contents.';
comment on column last_changed.parent_page is
'Path of the page containing this section.';
comment on column last_changed.last_updated is
'When the content was last edited.';
comment on column last_changed.last_checked is
'When the content was last checked. Used to identify and delete obsolete sections.';

alter table last_changed enable row level security;

revoke all on last_changed from anon;
revoke all on last_changed from authenticated;

create index idx_last_changed_parent_page_btree
on last_changed (parent_page);
