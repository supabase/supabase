-- Multi-instance mode (see auth.instances) table intentionally not supported and ignored.

create table if not exists {{ index .Options "Namespace" }}.sso_providers (
	id uuid not null,
	resource_id text null,
	created_at timestamptz null,
	updated_at timestamptz null,
	primary key (id),
	constraint "resource_id not empty" check (resource_id = null or char_length(resource_id) > 0)
);

comment on table {{ index .Options "Namespace" }}.sso_providers is 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';
comment on column {{ index .Options "Namespace" }}.sso_providers.resource_id is 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';

create unique index if not exists sso_providers_resource_id_idx on {{ index .Options "Namespace" }}.sso_providers (lower(resource_id));

create table if not exists {{ index .Options "Namespace" }}.sso_domains (
	id uuid not null,
	sso_provider_id uuid not null,
	domain text not null,
	created_at timestamptz null,
	updated_at timestamptz null,
	primary key (id),
	foreign key (sso_provider_id) references {{ index .Options "Namespace" }}.sso_providers (id) on delete cascade,
	constraint "domain not empty" check (char_length(domain) > 0)
);

create index if not exists sso_domains_sso_provider_id_idx on {{ index .Options "Namespace" }}.sso_domains (sso_provider_id);
create unique index if not exists sso_domains_domain_idx on {{ index .Options "Namespace" }}.sso_domains (lower(domain));

comment on table {{ index .Options "Namespace" }}.sso_domains is 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';

create table if not exists {{ index .Options "Namespace" }}.saml_providers (
	id uuid not null,
	sso_provider_id uuid not null,
	entity_id text not null unique,
	metadata_xml text not null,
	metadata_url text null,
	attribute_mapping jsonb null,
	created_at timestamptz null,
	updated_at timestamptz null,
	primary key (id),
	foreign key (sso_provider_id) references {{ index .Options "Namespace" }}.sso_providers (id) on delete cascade,
	constraint "metadata_xml not empty" check (char_length(metadata_xml) > 0),
	constraint "metadata_url not empty" check (metadata_url = null or char_length(metadata_url) > 0),
	constraint "entity_id not empty" check (char_length(entity_id) > 0)
);

create index if not exists saml_providers_sso_provider_id_idx on {{ index .Options "Namespace" }}.saml_providers (sso_provider_id);

comment on table {{ index .Options "Namespace" }}.saml_providers is 'Auth: Manages SAML Identity Provider connections.';

create table if not exists {{ index .Options "Namespace" }}.saml_relay_states (
	id uuid not null,
	sso_provider_id uuid not null,
	request_id text not null,
	for_email text null,
	redirect_to text null,
	from_ip_address inet null,
	created_at timestamptz null,
	updated_at timestamptz null,
	primary key (id),
	foreign key (sso_provider_id) references {{ index .Options "Namespace" }}.sso_providers (id) on delete cascade,
	constraint "request_id not empty" check(char_length(request_id) > 0)
);

create index if not exists saml_relay_states_sso_provider_id_idx on {{ index .Options "Namespace" }}.saml_relay_states (sso_provider_id);
create index if not exists saml_relay_states_for_email_idx on {{ index .Options "Namespace" }}.saml_relay_states (for_email);

comment on table {{ index .Options "Namespace" }}.saml_relay_states is 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';

create table if not exists {{ index .Options "Namespace" }}.sso_sessions (
	id uuid not null,
	session_id uuid not null,
	sso_provider_id uuid null,
	not_before timestamptz null,
	not_after timestamptz null,
	idp_initiated boolean default false,
	created_at timestamptz null,
	updated_at timestamptz null,
	primary key (id),
	foreign key (session_id) references {{ index .Options "Namespace" }}.sessions (id) on delete cascade,
	foreign key (sso_provider_id) references {{ index .Options "Namespace" }}.sso_providers (id) on delete cascade
);

create index if not exists sso_sessions_session_id_idx on {{ index .Options "Namespace" }}.sso_sessions (session_id);
create index if not exists sso_sessions_sso_provider_id_idx on {{ index .Options "Namespace" }}.sso_sessions (sso_provider_id);

comment on table {{ index .Options "Namespace" }}.sso_sessions is 'Auth: A session initiated by an SSO Identity Provider';

