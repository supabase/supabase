SET check_function_bodies = false;
-- Hide warnings because casts on domains would show a lot of:
--  WARNING:  cast will be ignored because the source data type is a domain
SET client_min_messages = error;

CREATE SCHEMA public;
CREATE SCHEMA postgrest;
CREATE SCHEMA private;
CREATE SCHEMA test;
CREATE SCHEMA تست;
CREATE SCHEMA extensions;
CREATE SCHEMA v1;
CREATE SCHEMA v2;
CREATE SCHEMA "SPECIAL ""@/\#~_-";
CREATE SCHEMA "EXTRA ""@/\#~_-";
CREATE SCHEMA "SCHEMA_v3";

COMMENT ON SCHEMA v1 IS 'v1 schema';
COMMENT ON SCHEMA v2 IS 'v2 schema';
COMMENT ON SCHEMA "SCHEMA_v3" IS 'v3 schema';

COMMENT ON SCHEMA test IS
$$My API title

My API description
that spans
multiple lines$$;
--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;

SET search_path = public, pg_catalog;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

--
-- Name: jwt_token; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.jwt_token AS (
	token text
);


SET search_path = test, pg_catalog;

--
-- Name: enum_menagerie_type; Type: TYPE; Schema: test; Owner: -
--

CREATE TYPE enum_menagerie_type AS ENUM (
    'foo',
    'bar'
);

create type  bit as enum ('one', 'two');

SET search_path = postgrest, pg_catalog;

--
-- Name: check_role_exists(); Type: FUNCTION; Schema: postgrest; Owner: -
--

CREATE FUNCTION check_role_exists() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
if not exists (select 1 from pg_roles as r where r.rolname = new.rolname) then
   raise foreign_key_violation using message = 'Cannot create user with unknown role: ' || new.rolname;
   return null;
 end if;
 return new;
end
$$;


--
-- Name: set_authors_only_owner(); Type: FUNCTION; Schema: postgrest; Owner: -
--

CREATE FUNCTION set_authors_only_owner() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  NEW.owner = current_setting('request.jwt.claims')::json->>'id';
  RETURN NEW;
end
$$;


--
-- Name: update_owner(); Type: FUNCTION; Schema: postgrest; Owner: -
--

CREATE FUNCTION update_owner() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   NEW.owner = current_user;
   RETURN NEW;
END;
$$;


SET search_path = test, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

create domain "text/plain" as text;
create domain "text/html" as text;
create domain "text/xml" as pg_catalog.xml;
create domain "application/octet-stream" as bytea;
create domain "image/png" as bytea;
create domain "application/vnd.twkb" as bytea;
create domain "application/openapi+json" as json;
create domain "application/geo+json" as jsonb;
create domain "application/vnd.geo2+json" as jsonb;
create domain "application/json" as json;
create domain "application/vnd.pgrst.object" as json;
create domain "text/tab-separated-values" as text;
create domain "text/csv" as text;
create domain "*/*" as bytea;

CREATE TABLE items (
    id bigserial primary key
);

CREATE TABLE items2 (
    id bigserial primary key
);

CREATE TABLE items3 (
    id bigserial primary key
);

CREATE FUNCTION search(id BIGINT) RETURNS SETOF items
    LANGUAGE plpgsql
    STABLE
    AS $$BEGIN
        RETURN QUERY SELECT items.id FROM items WHERE items.id=search.id;
    END$$;

CREATE FUNCTION always_true(test.items) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $$ SELECT true $$;

CREATE FUNCTION computed_overload(test.items) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $$ SELECT true $$;

CREATE FUNCTION computed_overload(test.items2) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $$ SELECT true $$;

CREATE FUNCTION is_first(test.items) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $$ SELECT $1.id = 1 $$;


CREATE FUNCTION anti_id(test.items) RETURNS bigint
    LANGUAGE sql IMMUTABLE
    AS $_$ SELECT $1.id * -1 $_$;

SET search_path = public, pg_catalog;

CREATE FUNCTION always_false(test.items) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $$ SELECT false $$;

create table public_consumers (
    id                  serial             not null unique,
    name                text               not null check (name <> ''),
    primary key (id)
);

create table public_orders (
    id                  serial             not null unique,
    consumer            integer            not null references public_consumers(id),
    number              integer            not null,
    primary key (id)
);

SET search_path = تست, pg_catalog;

CREATE TABLE موارد (
    هویت bigint NOT NULL
);


SET search_path = test, pg_catalog;


create view orders_view as
  select * from public.public_orders;

create view consumers_view as
  select * from public.public_consumers;

create view consumers_view_view as
  select * from consumers_view;

create view public.consumers_extra as
  select * from consumers_view;

create view consumers_extra_view as
  select * from public.consumers_extra;

--
-- Name: getitemrange(bigint, bigint); Type: FUNCTION; Schema: test; Owner: -
--

CREATE FUNCTION getitemrange(min bigint, max bigint) RETURNS SETOF items
    LANGUAGE sql
    STABLE
    AS $_$
    SELECT * FROM test.items WHERE id > $1 AND id <= $2;
$_$;

--
-- Name: version(); Type: FUNCTION; Schema: test; Owner: -
--

CREATE FUNCTION noparamsproc() RETURNS text
	LANGUAGE sql
        IMMUTABLE
	AS $$
		SELECT a FROM (VALUES ('Return value of no parameters procedure.')) s(a);
	$$;

--
-- Name: login(text, text); Type: FUNCTION; Schema: test; Owner: -
--

CREATE FUNCTION login(id text, pass text) RETURNS public.jwt_token
    LANGUAGE sql SECURITY DEFINER
    STABLE
    AS $$
SELECT jwt.sign(
    row_to_json(r), 'reallyreallyreallyreallyverysafe'
  ) as token
  FROM (
    SELECT rolname::text, id::text
      FROM postgrest.auth
     WHERE id = id AND pass = pass
  ) r;
$$;


CREATE FUNCTION varied_arguments(
  double double precision,
  "varchar" character varying,
  "boolean" boolean,
  date date,
  money money,
  enum enum_menagerie_type,
  arr text[],
  "integer" integer default 42,
  "json" json default '{}',
  jsonb jsonb default '{}'
) RETURNS json
LANGUAGE sql
IMMUTABLE
AS $_$
  SELECT json_build_object(
    'double', double,
    'varchar', "varchar",
    'boolean', "boolean",
    'date', date,
    'money', money,
    'enum', enum,
    'arr', arr,
    'integer', "integer",
    'json', json,
    'jsonb', jsonb
  );
$_$;

COMMENT ON FUNCTION varied_arguments(double precision, character varying, boolean, date, money, enum_menagerie_type, text[], integer, json, jsonb) IS
$_$An RPC function

Just a test for RPC function arguments$_$;

CREATE FUNCTION varied_arguments_openapi(
  double double precision,
  "varchar" character varying,
  "boolean" boolean,
  date date,
  money money,
  enum enum_menagerie_type,
  text_arr text[],
  int_arr int[],
  bool_arr boolean[],
  char_arr char[],
  varchar_arr varchar[],
  bigint_arr bigint[],
  numeric_arr numeric[],
  json_arr json[],
  jsonb_arr jsonb[],
  "integer" integer default 42,
  "json" json default '{}',
  jsonb jsonb default '{}'
) RETURNS json
  LANGUAGE sql
  IMMUTABLE
AS $_$
SELECT json_build_object(
           'double', double,
           'varchar', "varchar",
           'boolean', "boolean",
           'date', date,
           'money', money,
           'enum', enum,
           'text_arr', text_arr,
           'int_arr', int_arr,
           'bool_arr', bool_arr,
           'char_arr', char_arr,
           'varchar_arr', varchar_arr,
           'bigint_arr', bigint_arr,
           'numeric_arr', numeric_arr,
           'json_arr', json_arr,
           'jsonb_arr', jsonb_arr,
           'integer', "integer",
           'json', json,
           'jsonb', jsonb
         );
$_$;

COMMENT ON FUNCTION varied_arguments_openapi(double precision, character varying, boolean, date, money, enum_menagerie_type, text[], int[], boolean[], char[], varchar[], bigint[], numeric[], json[], jsonb[], integer, json, jsonb) IS
  $_$An RPC function

Just a test for RPC function arguments$_$;


CREATE FUNCTION json_argument(arg json) RETURNS text
LANGUAGE sql
IMMUTABLE
AS $_$
  SELECT json_typeof(arg);
$_$;

--
-- Name: jwt_test(); Type: FUNCTION; Schema: test; Owner: -
--

CREATE FUNCTION jwt_test() RETURNS public.jwt_token
    LANGUAGE sql SECURITY DEFINER
    IMMUTABLE
    AS $$
SELECT jwt.sign(
    row_to_json(r), 'reallyreallyreallyreallyverysafe'
  ) as token
  FROM (
    SELECT 'joe'::text as iss, 'fun'::text as sub, 'everyone'::text as aud,
       1300819380 as exp, 1300819380 as nbf, 1300819380 as iat,
       'foo'::text as jti, 'postgrest_test'::text as role,
       true as "http://postgrest.com/foo"
  ) r;
$$;


CREATE OR REPLACE FUNCTION switch_role() RETURNS void
  LANGUAGE plpgsql
  AS $$
declare
  user_id text;
Begin
  user_id = (current_setting('request.jwt.claims')::json->>'id')::text;
  if user_id = '1'::text then
    execute 'set local role postgrest_test_author';
  elseif user_id = '2'::text then
    execute 'set local role postgrest_test_default_role';
  elseif user_id = '3'::text then
    RAISE EXCEPTION 'Disabled ID --> %', user_id USING HINT = 'Please contact administrator';
  /* else */
  /*   execute 'set local role postgrest_test_anonymous'; */
  end if;
end
$$;

CREATE FUNCTION get_current_user() RETURNS text
  LANGUAGE sql
  STABLE
  AS $$
SELECT current_user::text;
$$;

--
-- Name: reveal_big_jwt(); Type: FUNCTION; Schema: test; Owner: -
--

CREATE FUNCTION reveal_big_jwt() RETURNS TABLE (
      iss text, sub text, exp bigint,
      nbf bigint, iat bigint, jti text, "http://postgrest.com/foo" boolean
    )
AS $$
  SELECT current_setting('request.jwt.claims')::json->>'iss' as iss,
         current_setting('request.jwt.claims')::json->>'sub' as sub,
         (current_setting('request.jwt.claims')::json->>'exp')::bigint as exp,
         (current_setting('request.jwt.claims')::json->>'nbf')::bigint as nbf,
         (current_setting('request.jwt.claims')::json->>'iat')::bigint as iat,
         current_setting('request.jwt.claims')::json->>'jti' as jti,
         (current_setting('request.jwt.claims')::json->>'http://postgrest.com/foo')::boolean as "http://postgrest.com/foo";
$$ LANGUAGE sql SECURITY DEFINER STABLE;


CREATE FUNCTION assert() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
      ASSERT false, 'bad thing';
END;
$$;


--
-- Name: problem(); Type: FUNCTION; Schema: test; Owner: -
--

CREATE FUNCTION problem() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
      RAISE 'bad thing';
END;
$$;


--
-- Name: sayhello(text); Type: FUNCTION; Schema: test; Owner: -
--

CREATE FUNCTION sayhello(name text) RETURNS text
    LANGUAGE sql
    IMMUTABLE
    AS $_$
    SELECT 'Hello, ' || $1;
$_$;


--
-- Name: callcounter(); Type: FUNCTION; Schema: test; Owner: -
--

CREATE SEQUENCE callcounter_count START 1;

CREATE FUNCTION callcounter() RETURNS bigint
    LANGUAGE sql
    AS $_$
    SELECT nextval('test.callcounter_count');
$_$;

CREATE FUNCTION reset_sequence(name TEXT, value INTEGER) RETURNS void
SECURITY DEFINER
LANGUAGE plpgsql AS $_$
BEGIN
  EXECUTE FORMAT($exec$
    ALTER SEQUENCE %s RESTART WITH %s
  $exec$, name, value);
END
$_$;

--
-- Name: singlejsonparam(json); Type: FUNCTION; Schema: test; Owner: -
--

CREATE FUNCTION singlejsonparam(single_param json) RETURNS json
    LANGUAGE sql
    IMMUTABLE
    AS $_$
    SELECT single_param;
$_$;

--
-- Name: test_empty_rowset(); Type: FUNCTION; Schema: test; Owner: -
--

CREATE FUNCTION test_empty_rowset() RETURNS SETOF integer
    LANGUAGE sql
    IMMUTABLE
    AS $$
    SELECT null::int FROM (SELECT 1) a WHERE false;
$$;


SET search_path = postgrest, pg_catalog;

--
-- Name: auth; Type: TABLE; Schema: postgrest; Owner: -
--

CREATE TABLE auth (
    id character varying NOT NULL,
    rolname name DEFAULT 'postgrest_test_author'::name NOT NULL,
    pass character(60) NOT NULL
);

SET search_path = test, pg_catalog;

--
-- Name: authors_only; Type: TABLE; Schema: test; Owner: -
--

CREATE TABLE authors_only (
    owner character varying NOT NULL,
    secret character varying NOT NULL
);


--
-- Name: auto_incrementing_pk; Type: TABLE; Schema: test; Owner: -
--

CREATE TABLE auto_incrementing_pk (
    id integer NOT NULL,
    nullable_string character varying,
    non_nullable_string character varying NOT NULL,
    inserted_at timestamp with time zone DEFAULT now()
);


--
-- Name: auto_incrementing_pk_id_seq; Type: SEQUENCE; Schema: test; Owner: -
--

CREATE SEQUENCE auto_incrementing_pk_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: auto_incrementing_pk_id_seq; Type: SEQUENCE OWNED BY; Schema: test; Owner: -
--

ALTER SEQUENCE auto_incrementing_pk_id_seq OWNED BY auto_incrementing_pk.id;


--
-- Name: clients; Type: TABLE; Schema: test; Owner: -
--

CREATE TABLE clients (
    id integer primary key,
    name text NOT NULL
);

--
-- Name: complex_items; Type: TABLE; Schema: test; Owner: -
--

CREATE TABLE complex_items (
    id bigint NOT NULL,
    name text,
    settings json,
    arr_data integer[],
		"field-with_sep" integer default 1 not null
);


--
-- Name: compound_pk; Type: TABLE; Schema: test; Owner: -
--

CREATE TABLE compound_pk (
    -- those columns should not be referenced to in a foreign key anywhere
    -- to allow the InsertSpec.Inserting into VIEWs.returns a location header
    -- to test properly
    PRIMARY KEY (k1, k2),
    k1 integer NOT NULL,
    k2 text NOT NULL,
    extra integer
);


CREATE VIEW compound_pk_view AS
SELECT * FROM compound_pk;

--
-- Name: empty_table; Type: TABLE; Schema: test; Owner: -
--

CREATE TABLE empty_table (
    k character varying NOT NULL,
    extra character varying NOT NULL
);


--
-- Name: private_table; Type: TABLE; Schema: test; Owner: -
--

CREATE TABLE private_table ();


--
-- Name: has_count_column; Type: VIEW; Schema: test; Owner: -
--

CREATE VIEW has_count_column AS
 SELECT 1 AS count;


--
-- Name: has_fk; Type: TABLE; Schema: test; Owner: -
--

CREATE TABLE has_fk (
    id bigint NOT NULL,
    auto_inc_fk integer,
    simple_fk character varying(255)
);


--
-- Name: has_fk_id_seq; Type: SEQUENCE; Schema: test; Owner: -
--

CREATE SEQUENCE has_fk_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: has_fk_id_seq; Type: SEQUENCE OWNED BY; Schema: test; Owner: -
--

ALTER SEQUENCE has_fk_id_seq OWNED BY has_fk.id;


--
-- Name: insertable_view_with_join; Type: VIEW; Schema: test; Owner: -
--

CREATE VIEW insertable_view_with_join AS
 SELECT has_fk.id,
    has_fk.auto_inc_fk,
    has_fk.simple_fk,
    auto_incrementing_pk.nullable_string,
    auto_incrementing_pk.non_nullable_string,
    auto_incrementing_pk.inserted_at
   FROM (has_fk
     JOIN auto_incrementing_pk USING (id));

--
-- Name: json_table; Type: TABLE; Schema: test; Owner: -
--

CREATE TABLE json_table (
    data json
);


--
-- Name: materialized_view; Type: MATERIALIZED VIEW; Schema: test; Owner: -
--

CREATE MATERIALIZED VIEW materialized_view AS
 SELECT version() AS version
  WITH NO DATA;


--
-- Name: menagerie; Type: TABLE; Schema: test; Owner: -
--

CREATE TABLE menagerie (
    "integer" integer NOT NULL,
    double double precision NOT NULL,
    "varchar" character varying NOT NULL,
    "boolean" boolean NOT NULL,
    date date NOT NULL,
    money money NOT NULL,
    enum enum_menagerie_type NOT NULL
);


--
-- Name: no_pk; Type: TABLE; Schema: test; Owner: -
--

CREATE TABLE no_pk (
    a character varying,
    b character varying
);

CREATE TABLE only_pk (
    id integer primary key
);

--
-- Name: nullable_integer; Type: TABLE; Schema: test; Owner: -
--

CREATE TABLE nullable_integer (
    a integer
);


--
-- Name: insertonly; Type: TABLE; Schema: test; Owner: -
--

CREATE TABLE insertonly (
    v text NOT NULL
);


--
-- Name: projects; Type: TABLE; Schema: test; Owner: -
--

CREATE TABLE projects (
    id integer primary key,
    name text NOT NULL,
    client_id integer REFERENCES clients(id)
);
alter table projects rename constraint projects_client_id_fkey to client;

--
-- Name: projects_view; Type: VIEW; Schema: test; Owner: -
--

CREATE VIEW projects_view AS
 SELECT projects.id,
    projects.name,
    projects.client_id
   FROM projects;


CREATE VIEW projects_view_alt AS
 SELECT projects.id as t_id,
    projects.name,
    projects.client_id as t_client_id
   FROM projects;

CREATE TABLE sponsors (
    id integer primary key,
    name varchar(20) not null
);

CREATE TABLE competitors (
    id integer primary key,
    sponsor_id integer references sponsors(id),
    full_name varchar(40) not null
);

CREATE VIEW test_null_pk_competitors_sponsors  AS
SELECT c.id, s.id as sponsor_id
FROM competitors c
    LEFT JOIN sponsors s on c.sponsor_id = s.id;

CREATE RULE test_null_pk_competitors_sponsors  AS
    ON INSERT TO test_null_pk_competitors_sponsors DO INSTEAD
    INSERT INTO competitors(id, full_name, sponsor_id)
    VALUES (new.id, 'Competitor without sponsor', new.sponsor_id)
    RETURNING id, sponsor_id;

--
-- Name: simple_pk; Type: TABLE; Schema: test; Owner: -
--

CREATE TABLE simple_pk (
    PRIMARY KEY (k),
    k character varying NOT NULL,
    extra character varying NOT NULL
);

CREATE TABLE simple_pk2 (
    PRIMARY KEY (k),
    k character varying NOT NULL,
    extra character varying NOT NULL
);

CREATE TABLE users (
    id integer primary key,
    name text NOT NULL
);

CREATE TABLE users_projects (
    user_id integer NOT NULL REFERENCES users(id),
    project_id integer NOT NULL REFERENCES projects(id),
    PRIMARY KEY (project_id, user_id)
);

CREATE TABLE tasks (
    id integer primary key,
    name text NOT NULL,
    project_id integer REFERENCES projects(id)
);
alter table tasks rename constraint tasks_project_id_fkey to project;

CREATE OR REPLACE VIEW filtered_tasks AS
SELECT id AS "myId", name, project_id AS "projectID"
FROM tasks
WHERE project_id IN (
	SELECT id FROM projects WHERE id = 1
) AND
project_id IN (
	SELECT project_id FROM users_projects WHERE user_id = 1
);

CREATE TABLE users_tasks (
  user_id integer NOT NULL REFERENCES users(id),
  task_id integer NOT NULL REFERENCES tasks(id),
  primary key (task_id, user_id)
);

CREATE TABLE comments (
    id integer primary key,
    commenter_id integer NOT NULL,
    user_id integer NOT NULL,
    task_id integer NOT NULL,
    content text NOT NULL
);
alter table only comments
    add constraint "user" foreign key (commenter_id) references users(id),
    add constraint comments_task_id_fkey foreign key (task_id, user_id) references users_tasks(task_id, user_id);

CREATE TABLE files (
    project_id integer NOT NULL,
    filename text NOT NULL,
    content text NOT NULL,
    PRIMARY KEY (project_id, filename)
);

CREATE TABLE touched_files (
  user_id integer NOT NULL,
  task_id integer NOT NULL,
  project_id integer NOT NULL,
  filename text NOT NULL,
  constraint fk_users_tasks foreign key (user_id, task_id) references users_tasks (user_id, task_id) on delete cascade on update cascade,
  constraint fk_upload foreign key (project_id, filename) references files (project_id,filename) on delete cascade on update cascade,
  primary key(user_id, task_id, project_id, filename)
);

create table private.articles (
    id integer primary key,
    body text,
    owner name not null
);

create table private.article_stars (
    article_id integer not null,
    user_id integer not null,
    created_at timestamp without time zone default now() not null,
    primary key (article_id, user_id)
);
alter table only private.article_stars
  add constraint article foreign key (article_id) references private.articles(id),
  add constraint "user" foreign key (user_id) references test.users(id);

CREATE VIEW limited_article_stars AS
  SELECT article_id, user_id, created_at FROM private.article_stars;

CREATE VIEW "articleStars" AS
 SELECT article_stars.article_id AS "articleId",
    article_stars.user_id AS "userId",
    article_stars.created_at AS "createdAt"
   FROM private.article_stars;

CREATE VIEW articles AS
 SELECT articles.id,
    articles.body,
    articles.owner
   FROM private.articles;

--
-- Name: tsearch; Type: TABLE; Schema: test; Owner: -
--

CREATE TABLE tsearch (
    text_search_vector tsvector
);

CREATE TABLE "Escap3e;" (
		"so6meIdColumn" integer primary key
);

CREATE TABLE "ghostBusters" (
		"escapeId" integer not null references "Escap3e;"("so6meIdColumn")
);

CREATE TABLE "withUnique" (
    uni text UNIQUE,
    extra text
);

CREATE TABLE clashing_column (
    t text
);

--
-- Name: id; Type: DEFAULT; Schema: test; Owner: -
--

ALTER TABLE ONLY auto_incrementing_pk ALTER COLUMN id SET DEFAULT nextval('auto_incrementing_pk_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: test; Owner: -
--

ALTER TABLE ONLY has_fk ALTER COLUMN id SET DEFAULT nextval('has_fk_id_seq'::regclass);


SET search_path = postgrest, pg_catalog;

--
-- Name: auth_pkey; Type: CONSTRAINT; Schema: postgrest; Owner: -
--

ALTER TABLE ONLY auth
    ADD CONSTRAINT auth_pkey PRIMARY KEY (id);


SET search_path = test, pg_catalog;

--
-- Name: authors_only_pkey; Type: CONSTRAINT; Schema: test; Owner: -
--

ALTER TABLE ONLY authors_only
    ADD CONSTRAINT authors_only_pkey PRIMARY KEY (secret);


--
-- Name: auto_incrementing_pk_pkey; Type: CONSTRAINT; Schema: test; Owner: -
--

ALTER TABLE ONLY auto_incrementing_pk
    ADD CONSTRAINT auto_incrementing_pk_pkey PRIMARY KEY (id);

--
-- Name: complex_items_pkey; Type: CONSTRAINT; Schema: test; Owner: -
--

ALTER TABLE ONLY complex_items
    ADD CONSTRAINT complex_items_pkey PRIMARY KEY (id);

--
-- Name: has_fk_pkey; Type: CONSTRAINT; Schema: test; Owner: -
--

ALTER TABLE ONLY has_fk
    ADD CONSTRAINT has_fk_pkey PRIMARY KEY (id);

--
-- Name: menagerie_pkey; Type: CONSTRAINT; Schema: test; Owner: -
--

ALTER TABLE ONLY menagerie
    ADD CONSTRAINT menagerie_pkey PRIMARY KEY ("integer");


SET search_path = postgrest, pg_catalog;

--
-- Name: ensure_auth_role_exists; Type: TRIGGER; Schema: postgrest; Owner: -
--

CREATE CONSTRAINT TRIGGER ensure_auth_role_exists AFTER INSERT OR UPDATE ON auth NOT DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE PROCEDURE check_role_exists();


SET search_path = private, pg_catalog;

--
-- Name: articles_owner_track; Type: TRIGGER; Schema: private; Owner: -
--

CREATE TRIGGER articles_owner_track BEFORE INSERT OR UPDATE ON articles FOR EACH ROW EXECUTE PROCEDURE postgrest.update_owner();


SET search_path = test, pg_catalog;

--
-- Name: secrets_owner_track; Type: TRIGGER; Schema: test; Owner: -
--

CREATE TRIGGER secrets_owner_track BEFORE INSERT OR UPDATE ON authors_only FOR EACH ROW EXECUTE PROCEDURE postgrest.set_authors_only_owner();

SET search_path = test, pg_catalog;

--
-- Name: has_fk_fk_fkey; Type: FK CONSTRAINT; Schema: test; Owner: -
--

ALTER TABLE ONLY has_fk
    ADD CONSTRAINT has_fk_fk_fkey FOREIGN KEY (auto_inc_fk) REFERENCES auto_incrementing_pk(id);


--
-- Name: has_fk_simple_fk_fkey; Type: FK CONSTRAINT; Schema: test; Owner: -
--

ALTER TABLE ONLY has_fk
    ADD CONSTRAINT has_fk_simple_fk_fkey FOREIGN KEY (simple_fk) REFERENCES simple_pk(k);

create table addresses (
	id                   int not null unique,
	address              text not null
);

create table orders (
	id                   int not null unique,
	name                 text not null,
	billing_address_id   int references addresses(id),
	shipping_address_id  int references addresses(id)
);
alter table orders rename constraint orders_billing_address_id_fkey to billing;
alter table orders rename constraint orders_shipping_address_id_fkey to shipping;

CREATE FUNCTION getproject(id int) RETURNS SETOF projects
    LANGUAGE sql
    AS $_$
    SELECT * FROM test.projects WHERE id = $1;
$_$;

CREATE FUNCTION get_projects_below(id int) RETURNS SETOF projects
    LANGUAGE sql
    AS $_$
    SELECT * FROM test.projects WHERE id < $1;
$_$;

CREATE FUNCTION get_projects_above(id int) RETURNS SETOF projects
    LANGUAGE sql
    AS $_$
    SELECT * FROM test.projects WHERE id > $1;
$_$ ROWS 1;

CREATE FUNCTION getallprojects() RETURNS SETOF projects
    LANGUAGE sql
    AS $_$
    SELECT * FROM test.projects;
$_$ ROWS 2019;

CREATE FUNCTION setprojects(id_l int, id_h int, name text) RETURNS SETOF projects
    LANGUAGE sql
    AS $_$
    update test.projects set name = $3 WHERE id >= $1 AND id <= $2 returning *;
$_$;

CREATE DOMAIN projects_domain AS projects;

CREATE FUNCTION getproject_domain(id int) RETURNS SETOF projects_domain
    LANGUAGE sql
    STABLE
    AS $_$
    SELECT projects::projects_domain FROM test.projects WHERE id = $1;
$_$;

create table images (
	name text  not null,
	img  bytea not null
);

create view images_base64 as (
  -- encoding in base64 puts a '\n' after every 76 character due to legacy reasons, this is isn't necessary here so it's removed
  select name, replace(encode(img, 'base64'), E'\n', '') as img from images
);

create function test.ret_enum(val text) returns test.enum_menagerie_type as $$
  select val::test.enum_menagerie_type;
$$ language sql;

create domain one_nine as integer check (value >= 1 and value <= 9);

create function test.ret_array() returns integer[] as $$
  select '{1,2,3}'::integer[];
$$ language sql;

create function test.ret_domain(val integer) returns test.one_nine as $$
  select val::test.one_nine;
$$ language sql;

create function test.ret_range(low integer, up integer) returns int4range as $$
  select int4range(low, up);
$$ language sql;

create function test.ret_setof_integers() returns setof integer as $$
  values (1), (2), (3);
$$ language sql;

-- this function does not have named arguments and should be ignored
-- if it's not ignored, it will break the test for the function before
create function test.ret_setof_integers(int, int) returns integer AS $$
  values (1);
$$ language sql;

create function test.ret_scalars() returns table(
  a text, b test.enum_menagerie_type, c test.one_nine, d int4range
) as $$
  select row('scalars'::text, enum_first(null::test.enum_menagerie_type),
              1::test.one_nine, int4range(10, 20));
$$ language sql;

create type test.point_2d as (x integer, y integer);

create function test.ret_point_2d() returns test.point_2d as $$
  select row(10, 5)::test.point_2d;
$$ language sql;

create function test.ret_point_overloaded(x int, y int) returns test.point_2d as $$
  select row(x, y)::test.point_2d;
$$ language sql;

create function test.ret_point_overloaded(x json) returns json as $$
  select $1;
$$ language sql;

create domain test.composite_domain as test.point_2d;

create function test.ret_composite_domain() returns test.composite_domain as $$
  select row(10, 5)::test.composite_domain;
$$ language sql;

create type private.point_3d as (x integer, y integer, z integer);

create function test.ret_point_3d() returns private.point_3d as $$
  select row(7, -3, 4)::private.point_3d;
$$ language sql;

create function test.ret_void() returns void as '' language sql;

create or replace function test.ret_null() returns int as $$
  select null::int;
$$ language sql;

create function test.ret_image() returns "image/png" as $$
  select i.img::"image/png" from test.images i where i.name = 'A.png';
$$ language sql;

create function test.single_article(id integer) returns test.articles as $$
  select a.* from test.articles a where a.id = $1;
$$ language sql;

create function test.get_guc_value(name text) returns text as $$
  select nullif(current_setting(name), '')::text;
$$ language sql;

-- Get the JSON type GUC values
create function test.get_guc_value(prefix text, name text) returns text as $$
select nullif(current_setting(prefix)::json->>name, '')::text;
$$ language sql;

create table w_or_wo_comma_names ( name text );

create table items_with_different_col_types (
  int_data integer,
  text_data text,
  bool_data bool,
  bin_data bytea,
  char_data character varying,
  date_data date,
  real_data real,
  time_data time
);

-- Tables used for testing complex boolean logic with and/or query params

create table entities (
  id integer primary key,
  name text,
  arr integer[],
  text_search_vector tsvector
);

create table child_entities (
  id integer primary key,
  name text,
  parent_id integer references entities(id)
);

create view child_entities_view as table child_entities;

create table grandchild_entities (
  id integer primary key,
  name text,
  parent_id integer references child_entities(id),
  or_starting_col text,
  and_starting_col text,
  jsonb_col jsonb
);

-- Table used for testing range operators

create table ranges (
    id integer primary key,
    range numrange
);


-- OpenAPI description tests

comment on table child_entities is 'child_entities comment';
comment on column child_entities.id is 'child_entities id comment';
comment on column child_entities.name is 'child_entities name comment. Can be longer than sixty-three characters long';

comment on view child_entities_view is 'child_entities_view comment';
comment on column child_entities_view.id is 'child_entities_view id comment';
comment on column child_entities_view.name is 'child_entities_view name comment. Can be longer than sixty-three characters long';

comment on table grandchild_entities is
$$grandchild_entities summary

grandchild_entities description
that spans
multiple lines$$;

-- Used for testing that having the same return column name as the proc name
-- doesn't conflict with the required output, details in #901
create function test.test() returns table(test text, value int) as $$
  values ('hello', 1);
$$ language sql;

create function test.privileged_hello(name text) returns text as $$
  select 'Privileged hello to ' || $1;
$$ language sql;

create function test.get_tsearch() returns setof test.tsearch AS $$
  SELECT * FROM test.tsearch;
$$ language sql;

create table test.being (
  being int primary key not null
);

create table test.descendant (
  descendant int primary key not null,
  being int references test.being(being)
);

create table test.part (
  part int primary key not null
);

create table test.being_part (
  being int not null references test.being(being),
  part int not null references test.part(part),
  primary key(being, part)
);

create function test.single_out_param(num int, OUT num_plus_one int) AS $$
  select num + 1;
$$ language sql;

create function test.single_json_out_param(a int, b text, OUT my_json json) AS $$
  select json_build_object('a', a, 'b', b);
$$ language sql;

create function test.many_out_params(OUT my_json json, OUT num int, OUT str text) AS $$
  select '{"a": 1, "b": "two"}'::json, 3, 'four'::text;
$$ language sql;

create function test.single_inout_param(INOUT num int) AS $$
  select num + 1;
$$ language sql;

create function test.many_inout_params(INOUT num int, INOUT str text, INOUT b bool DEFAULT true) AS $$
  select num, str, b;
$$ language sql;

create function test.single_column_table_return () returns table (a text) AS $$
  select 'A'::text;
$$ language sql;

create function test.multi_column_table_return () returns table (a text, b text) AS $$
  select 'A'::text, 'B'::text;
$$ language sql;

CREATE FUNCTION test.variadic_param(VARIADIC v TEXT[] DEFAULT '{}') RETURNS text[]
IMMUTABLE
LANGUAGE SQL AS $$
  SELECT v
$$;

CREATE FUNCTION test.sayhello_variadic(name TEXT, VARIADIC v TEXT[]) RETURNS text
IMMUTABLE
LANGUAGE SQL AS $$
  SELECT 'Hello, ' || name
$$;

create or replace function test.raise_pt402() returns void as $$
begin
  raise sqlstate 'PT402' using message = 'Payment Required',
                               detail = 'Quota exceeded',
                               hint = 'Upgrade your plan';
end;
$$ language plpgsql;

create or replace function test.raise_bad_pt() returns void as $$
begin
  raise sqlstate 'PT40A' using message = 'Wrong';
end;
$$ language plpgsql;

create or replace function test.send_body_status_403() returns json as $$
begin
  perform set_config('response.status', '403', true);
  return json_build_object('message', 'invalid user or password');
end;
$$ language plpgsql;

create or replace function test.send_bad_status() returns json as $$
begin
  perform set_config('response.status', 'bad', true);
  return null;
end;
$$ language plpgsql;

create or replace function test.get_projects_and_guc_headers() returns setof test.projects as $$
  set local "response.headers" = '[{"X-Test": "key1=val1; someValue; key2=val2"}, {"X-Test-2": "key1=val1"}]';
  select * from test.projects;
$$ language sql;

create or replace function test.get_int_and_guc_headers(num int) returns integer as $$
  set local "response.headers" = '[{"X-Test":"key1=val1; someValue; key2=val2"},{"X-Test-2":"key1=val1"}]';
  select num;
$$ language sql;

create or replace function test.bad_guc_headers_1() returns void as $$
  set local "response.headers" = '{"X-Test": "invalid structure for headers"}';
$$ language sql;

create or replace function test.bad_guc_headers_2() returns void as $$
  set local "response.headers" = '["invalid", "structure", "for", "headers"]';
$$ language sql;

create or replace function test.bad_guc_headers_3() returns void as $$
  set local "response.headers" = '{"X-Test": "invalid", "X-Test-2": "structure", "X-Test-3": "for headers"}';
$$ language sql;

create or replace function test.set_cookie_twice() returns void as $$
  set local "response.headers" = '[{"Set-Cookie": "sessionid=38afes7a8; HttpOnly; Path=/"}, {"Set-Cookie": "id=a3fWa; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Secure; HttpOnly"}]';
$$ language sql;

create or replace function test.three_defaults(a int default 1, b int default 2, c int default 3) returns int as $$
select a + b + c
$$ language sql;

create or replace function test.overloaded() returns setof int as $$
  values (1), (2), (3);
$$ language sql;

create or replace function test.overloaded(json) returns table(x int, y text) as $$
  select * from json_to_recordset($1) as r(x int, y text);
$$ language sql;

create or replace function test.overloaded(a int, b int) returns int as $$
  select a + b
$$ language sql;

create or replace function test.overloaded(a text, b text, c text) returns text as $$
  select a || b || c
$$ language sql;

create or replace function test.overloaded_default(opt_param text default 'Code w7') returns setof test.tasks as $$
select * from test.tasks where name like opt_param;
$$ language sql;

create or replace function test.overloaded_default(must_param int) returns jsonb as $$
select row_to_json(r)::jsonb from (select must_param as val) as r;
$$ language sql;

create or replace function test.overloaded_default(a int, opt_param text default 'Design IOS') returns setof test.tasks as $$
select * from test.tasks where name like opt_param and id > a;
$$ language sql;

create or replace function test.overloaded_default(a int, must_param int) returns jsonb as $$
select row_to_json(r)::jsonb from (select a, must_param as val) as r;
$$ language sql;

create or replace function test.overloaded_html_form() returns setof int as $$
values (1), (2), (3);
$$ language sql;

create or replace function test.overloaded_html_form(single_param json) returns json as $$
select single_param;
$$ language sql;

create or replace function test.overloaded_html_form(a int, b int) returns int as $$
select a + b
$$ language sql;

create or replace function test.overloaded_html_form(a text, b text, c text) returns text as $$
select a || b || c
$$ language sql;

create or replace function test.overloaded_same_args(arg integer) returns json as $$
select json_build_object(
    'type', pg_typeof(arg),
    'value', arg
  );
$$ language sql;

create or replace function test.overloaded_same_args(arg xml) returns json as $$
select json_build_object(
    'type', pg_typeof(arg),
    'value', arg
  );
$$ language sql;

create or replace function test.overloaded_same_args(arg text, num integer default 0) returns json as $$
select json_build_object(
    'type', pg_typeof(arg),
    'value', arg
  );
$$ language sql;

create table test.leak(
  id serial primary key,
  blob bytea
);

create function test.leak(blob bytea) returns void as $$ begin end; $$ language plpgsql;

create table test.perf_articles(
  id integer not null,
  body text not null
);

create table test.employees(
  first_name text,
  last_name text,
  salary money,
  company text,
  occupation text,
  primary key(first_name, last_name)
);

create table test.tiobe_pls(
  name text primary key,
  rank smallint
);

create table test.single_unique(
  unique_key integer unique not null,
  value text
);

create table test.compound_unique(
  key1 integer not null,
  key2 integer not null,
  value text,
  unique(key1, key2)
);

create table test.family_tree (
  id text not null primary key,
  name text not null,
  parent text
);
alter table only test.family_tree add constraint pptr foreign key (parent) references test.family_tree(id);

create table test.managers (
  id integer primary key,
  name text
);

create table test.organizations (
  id integer primary key,
  name text,
  referee integer references organizations(id),
  auditor integer references organizations(id),
  manager_id integer references managers(id)
);
alter table only test.organizations rename constraint organizations_manager_id_fkey to manager;

create table private.authors(
  id integer primary key,
  name text
);

create table private.publishers(
  id integer primary key,
  name text
);

create table private.books(
  id integer primary key,
  title text,
  publication_year smallint,
  author_id integer references private.authors(id),
  first_publisher_id integer references private.publishers(id)
);

create view test.authors as select id, name from private.authors;
create view test.publishers as select id, name from private.publishers;

create view test.books as select id, title, publication_year, author_id, first_publisher_id from private.books;
create view test.forties_books as select id, title, publication_year, author_id from private.books where publication_year >= 1940 and publication_year < 1950;
create view test.fifties_books as select id, title, publication_year, author_id from private.books where publication_year >= 1950 and publication_year < 1960;
create view test.sixties_books as select id, title, publication_year, author_id from private.books where publication_year >= 1960 and publication_year < 1970;

create table person (
  id integer primary key,
  name character varying not null);

create table message (
  id integer primary key,
  body text not null default '',
  sender bigint not null references person(id),
  recipient bigint not null references person(id));

create view person_detail as
  select p.id, p.name, s.count as sent, r.count as received
  from person p
  join lateral (select message.sender, count(message.id) as count from message group by message.sender) s on s.sender = p.id
  join lateral (select message.recipient, count(message.id) as count from message group by message.recipient) r on r.recipient = p.id;

create table space(
  id integer primary key,
  name text);

create table zone(
  id integer primary key,
  name text,
  zone_type_id integer,
  space_id integer references space(id));

-- foreign table tests
create extension file_fdw;

create server import_csv foreign data wrapper file_fdw;

create foreign table projects_dump (
  id integer,
  name text,
  client_id integer
) server import_csv options ( filename '/tmp/projects_dump.csv', format 'csv');

comment on foreign table projects_dump is
$$A temporary projects dump

Just a test for foreign tables$$;

create table "UnitTest"(
  "idUnitTest" integer primary key,
  "nameUnitTest" text
);

create table json_arr(
  id integer primary key,
  data json
);

create table jsonb_test(
  id integer primary key,
  data jsonb
);

create view test.authors_books_number as
select
  id,
  name,
  (
    select
      count(*)
    from forties_books where author_id = authors.id
  ) as num_in_forties,
  (
    select
      count(*)
    from fifties_books where author_id = authors.id
  ) as num_in_fifties,
  (
    select
      count(*)
    from sixties_books where author_id = authors.id
  ) as num_in_sixties,
  (
    select
      count(*)
    from (
      select id
      from forties_books where author_id = authors.id
      union
      select id
      from fifties_books where author_id = authors.id
      union
      select id
      from sixties_books where author_id = authors.id
    ) _
  ) as num_in_all_decades
from private.authors;

create view test.authors_have_book_in_decade as
select
  id,
  name,
  case
    when (x.id in (select author_id from test.forties_books))
    then true
    else false
  end as has_book_in_forties,
  case
    when (x.id in (select author_id from test.fifties_books))
    then true
    else false
  end as has_book_in_fifties,
  case
    when (x.id in (select author_id from test.sixties_books))
    then true
    else false
  end as has_book_in_sixties
from private.authors x;

create view test.authors_have_book_in_decade2 as
select
  id,
  name,
  coalesce(
    (select true from test.forties_books where author_id=x.id limit 1),
    false
  ) as has_book_in_forties,
  coalesce(
    (select true from test.fifties_books where author_id=x.id limit 1),
    false
  ) as has_book_in_fifties,
  coalesce(
    (select true from test.sixties_books where author_id=x.id limit 1),
    false
  ) as has_book_in_sixties
from private.authors x;

create view test.forties_and_fifties_books as
select x.id, x.title, x.publication_year, y.name as first_publisher, x.author_id
from (
  select id, title, publication_year, author_id, first_publisher_id from private.books
  where publication_year >= 1940 and publication_year < 1960) x
join private.publishers y on y.id = x.first_publisher_id;

create view test.odd_years_publications as
with
odd_years_books as(
  select id, title, publication_year, author_id, first_publisher_id
  from private.books
  where publication_year % 2 <> 0
)
select
  x.id, x.title, x.publication_year,
  y.name as first_publisher, x.author_id
from odd_years_books x
join private.publishers y on y.id = x.first_publisher_id;

create view test.projects_count_grouped_by as
select
  client_id,
  count(id) as number_of_projects
from projects
group by client_id;

create view test.authors_w_entities as
select
  id,
  name,
  (
    select json_agg(id)
    from test.entities
    where id not in (
      select parent_id from test.child_entities
    )
  ) as entities
from private.authors;

CREATE TABLE test."Foo"(
  id int primary key,
  name text
);

CREATE TABLE test.bar(
  id int primary key,
  name text,
  "fooId" int references "Foo"(id)
);

CREATE VIEW test.foos as select id,name from "Foo";
CREATE VIEW test.bars as select id, "fooId", name from bar;

create materialized view materialized_projects as
select id, name, client_id from projects;

comment on materialized view materialized_projects is
$$A materialized view for projects

Just a test for materialized views$$;

-- Tests for updatable, insertable and deletable views
create view test.projects_auto_updatable_view_with_pk as
select id, name, client_id from test.projects;

create view test.projects_auto_updatable_view_without_pk as
select name, client_id from test.projects;

create view test.projects_view_without_triggers as
select distinct id, name, client_id from test.projects;

create or replace function test.test_for_views_with_triggers() returns trigger as $$
begin
    return null;
end;
$$ language plpgsql;

create view test.projects_view_with_all_triggers_with_pk as
select distinct id, name, client_id from test.projects;

create trigger projects_view_with_all_triggers_with_pk_insert
    instead of insert on test.projects_view_with_all_triggers_with_pk
    for each row execute procedure test_for_views_with_triggers();

create trigger projects_view_with_all_triggers_with_pk_update
    instead of update on test.projects_view_with_all_triggers_with_pk
    for each row execute procedure test_for_views_with_triggers();

create trigger projects_view_with_all_triggers_with_pk_delete
    instead of delete on test.projects_view_with_all_triggers_with_pk
    for each row execute procedure test_for_views_with_triggers();

create view test.projects_view_with_all_triggers_without_pk as
select distinct name, client_id from test.projects;

create trigger projects_view_with_all_triggers_without_pk_insert
    instead of insert on test.projects_view_with_all_triggers_without_pk
    for each row execute procedure test_for_views_with_triggers();

create trigger projects_view_with_all_triggers_without_pk_update
    instead of update on test.projects_view_with_all_triggers_without_pk
    for each row execute procedure test_for_views_with_triggers();

create trigger projects_view_with_all_triggers_without_pk_delete
    instead of delete on test.projects_view_with_all_triggers_without_pk
    for each row execute procedure test_for_views_with_triggers();

create view test.projects_view_with_insert_trigger as
select distinct id, name, client_id from test.projects;

create trigger projects_view_with_insert_trigger_insert
    instead of insert on test.projects_view_with_insert_trigger
    for each row execute procedure test_for_views_with_triggers();

create view test.projects_view_with_update_trigger as
select distinct id, name, client_id from test.projects;

create trigger projects_view_with_update_trigger_update
    instead of update on test.projects_view_with_update_trigger
    for each row execute procedure test_for_views_with_triggers();

create view test.projects_view_with_delete_trigger as
select distinct id, name, client_id from test.projects;

create trigger projects_view_with_delete_trigger_delete
    instead of delete on test.projects_view_with_delete_trigger
    for each row execute procedure test_for_views_with_triggers();

create or replace function test."quotedFunction"("user" text, "fullName" text, "SSN" text)
returns jsonb AS $$
  select format('{"user": "%s", "fullName": "%s", "SSN": "%s"}', "user", "fullName", "SSN")::jsonb;
$$ language sql;

create table private.player (
  id integer not null,
  first_name text not null,
  last_name text not null,
  birth_date date,
  primary key (last_name, id, first_name, birth_date) -- just for testing a long compound pk
);

create table test.contract (
  tournament text not null,
  time tsrange not null,
  purchase_price int not null,
  id integer not null,
  first_name text not null,
  last_name text not null,
  birth_date date,
  foreign key (last_name, id, first_name, birth_date) references private.player
);

create view test.player_view as select * from private.player;

create view test.contract_view as select * from test.contract;

create type public.my_type AS enum ('something');

create function test.test_arg(my_arg public.my_type) returns text as $$
  select 'foobar'::text;
$$ language sql;

create extension if not exists ltree with schema public;

create table test.ltree_sample (
  path public.ltree
);

CREATE FUNCTION test.number_of_labels(test.ltree_sample) RETURNS integer AS $$
  SELECT nlevel($1.path)
$$ language sql;

create extension if not exists isn with schema extensions;

create table test.isn_sample (
  id extensions.isbn,
  name text
);

create function test.is_valid_isbn(input text) returns boolean as $$
  select is_valid(input::isbn);
$$ language sql;

create table "Server Today"(
  "cHostname" text,
  "Just A Server Model" text
);

create table test.pgrst_reserved_chars (
  "*id*" integer,
  ":arr->ow::cast" text,
  "(inside,parens)" text,
  "a.dotted.column" text,
  "  col  w  space  " text
);

CREATE TABLE test.openapi_types(
  "a_character_varying" character varying,
  "a_character" character(1),
  "a_text" text,
  "a_boolean" boolean,
  "a_smallint" smallint,
  "a_integer" integer,
  "a_bigint" bigint,
  "a_numeric" numeric,
  "a_real" real,
  "a_double_precision" double precision,
  "a_json" json,
  "a_jsonb" jsonb,
  "a_text_arr" text[],
  "a_int_arr" int[],
  "a_bool_arr" boolean[],
  "a_char_arr" char[],
  "a_varchar_arr" varchar[],
  "a_bigint_arr" bigint[],
  "a_numeric_arr" numeric[],
  "a_json_arr" json[],
  "a_jsonb_arr" jsonb[]
);

CREATE TABLE test.openapi_defaults(
  "text" text default 'default',
  "boolean" boolean default false,
  "integer" integer default 42,
  "numeric" numeric default 42.2,
  "date" date default '1900-01-01'::date,
  "time" time default '13:00:00'::time without time zone
);

create function add_them(a integer, b integer)
returns integer as $$
  select a + b;
$$ language sql;

create or replace function root() returns "application/openapi+json" as $_$
declare
openapi json = $$
  {
    "swagger": "2.0",
    "info":{
      "title":"PostgREST API",
      "description":"This is a dynamic API generated by PostgREST"
    }
  }
$$;
begin
  return openapi;
end
$_$ language plpgsql;

create or replace function welcome() returns "text/plain" as $$
select 'Welcome to PostgREST'::"text/plain";
$$ language sql;

create or replace function welcome_twice() returns setof "text/plain" as $$
select 'Welcome to PostgREST'
union all
select 'Welcome to PostgREST';
$$ language sql;

create or replace function "welcome.html"() returns "text/html" as $_$
select $$
<html>
  <head>
    <title>PostgREST</title>
  </head>
  <body>
    <h1>Welcome to PostgREST</h1>
  </body>
</html>
$$::"text/html";
$_$ language sql;

create view getallprojects_view as
select * from getallprojects();

create view get_projects_above_view as
select * from get_projects_above(1);

CREATE TABLE web_content (
  id integer,
  name text,
  p_web_id integer references web_content(id),
  primary key (id)
);

CREATE FUNCTION getallusers() RETURNS SETOF users AS $$
  SELECT * FROM test.users;
$$ LANGUAGE sql STABLE;

create table app_users (
  id       integer    primary key,
  email    text       unique not null,
  password text       not null
);

create table private.pages (
  link int not null unique
, url text
);

create table private.referrals (
  site text
, link int references private.pages(link) not null
);

create view test.pages as select * from private.pages;

create view test.referrals as select * from private.referrals;

create table big_projects (
  big_project_id  serial  primary key,
  name text
);

create table sites (
  site_id         serial  primary key
, name text
, main_project_id int     null references big_projects (big_project_id)
);
alter table sites rename constraint sites_main_project_id_fkey to main_project;

create table jobs (
  job_id          uuid
, name text
, site_id         int     not null references sites (site_id)
, big_project_id  int     not null references big_projects (big_project_id)
, primary key(job_id, site_id, big_project_id)
);

create view main_jobs as
select * from jobs
where site_id in (select site_id from sites where main_project_id is not null);

-- junction in a private schema, just to make sure we don't leak it on resource embedding
-- if it leaks it would show on the disambiguation error tests
create view private.priv_jobs as
  select * from jobs;

-- tables to show our limitation when trying to do an m2m embed
-- with a junction table that has more than two foreign keys
create table whatev_projects (
  id  serial  primary key,
  name text
);

create table whatev_sites (
  id              serial  primary key
, name text
);

create table whatev_jobs (
  job_id        uuid
, name text
, site_id_1     int not null references whatev_sites (id)
, project_id_1  int not null references whatev_projects (id)
, site_id_2     int not null references whatev_sites (id)
, project_id_2  int not null references whatev_projects (id)
, primary key(job_id, site_id_1, project_id_1, site_id_2, project_id_2)
);

-- circular reference
create table agents (
  id int primary key
, name text
, department_id int
);

create table departments (
  id int primary key
, name text
, head_id int references agents(id)
);

ALTER TABLE agents
    ADD CONSTRAINT agents_department_id_fkey foreign key (department_id) REFERENCES departments(id);

-- composite key disambiguation
create table schedules (
  id        int primary key
, name      text
, start_at  timetz
, end_at    timetz
);

create table activities (
  id             int
, schedule_id    int
, car_id         text
, camera_id      text
, primary key (id, schedule_id)
);
alter table activities
add constraint schedule foreign key          (schedule_id)
                        references schedules (id);

create table unit_workdays (
  unit_id int
, day date
, fst_shift_activity_id int
, fst_shift_schedule_id int
, snd_shift_activity_id int
, snd_shift_schedule_id int
, primary key (unit_id, day)
);
alter table unit_workdays
add constraint fst_shift foreign key           (fst_shift_activity_id, fst_shift_schedule_id)
                         references activities (id, schedule_id),
add constraint snd_shift foreign key           (snd_shift_activity_id, snd_shift_schedule_id)
                         references activities (id, schedule_id);

create view unit_workdays_fst_shift as
select unit_id, day, fst_shift_activity_id, fst_shift_schedule_id
from unit_workdays
where fst_shift_activity_id is not null
  and fst_shift_schedule_id is not null;

-- for a pre-request function
create or replace function custom_headers() returns void as $$
declare
  user_agent text := current_setting('request.headers', true)::json->>'user-agent';
  req_path   text := current_setting('request.path', true);
  req_accept text := current_setting('request.headers', true)::json->>'accept';
  req_method text := current_setting('request.method', true);
begin
  if user_agent similar to 'MSIE (6.0|7.0)' then
    perform set_config('response.headers',
      '[{"Cache-Control": "no-cache, no-store, must-revalidate"}]', true);
  elsif req_path similar to '/(items|projects)' and req_accept = 'text/csv' then
    perform set_config('response.headers',
      format('[{"Content-Disposition": "attachment; filename=%s.csv"}]', trim('/' from req_path)), true);
  elsif req_path similar to '/(clients|rpc/getallprojects)' then
    perform set_config('response.headers',
      '[{"Content-Type": "application/custom+json"}]', true);
  elsif req_path = '/items' and
        req_method similar to 'POST|PATCH|PUT|DELETE' then
    perform set_config('response.headers',
      '[{"X-Custom-Header": "mykey=myval"}]', true);
  end if;
end; $$ language plpgsql;

create table private.stuff(
  id integer primary key
, name text
);

create view test.stuff as select * from private.stuff;

create or replace function location_for_stuff() returns trigger as $$
begin
    insert into private.stuff values (new.id, new.name);
    if new.id is not null
    then
      perform set_config(
        'response.headers'
      , format('[{"Location": "/%s?id=eq.%s&overriden=true"}]', tg_table_name, new.id)
      , true
      );
    end if;
    return new;
end
$$ language plpgsql security definer;
create trigger location_for_stuff instead of insert on test.stuff for each row execute procedure test.location_for_stuff();

create or replace function status_205_for_updated_stuff() returns trigger as $$
begin
    update private.stuff set id = new.id, name = new.name;
    perform set_config('response.status' , '205' , true);
    return new;
end
$$ language plpgsql security definer;
create trigger status_205_for_updated_stuff instead of update on test.stuff for each row execute procedure test.status_205_for_updated_stuff();

create table loc_test (
  id int primary key
, c text
);

-- tables to test multi schema access in one instance
create table v1.parents (
  id    int primary key
, name text
);

create table v1.children (
  id int primary key
, name text
, parent_id int
, constraint parent foreign key(parent_id)
  references v1.parents(id)
);

create function v1.get_parents_below(id int)
returns setof v1.parents as $$
  select * from v1.parents where id < $1;
$$ language sql;

create table v2.parents (
  id    int primary key
, name text
);

create table v2.children (
  id int primary key
, name text
, parent_id int
, constraint parent foreign key(parent_id)
  references v2.parents(id)
);

create table v2.another_table (
  id            int primary key
, another_value text
);

create function v2.get_parents_below(id int)
returns setof v2.parents as $$
  select * from v2.parents where id < $1;
$$ language sql;

create function v2.get_plain_text()
returns test."text/plain" as $$
  select 'plain'::test."text/plain";
$$ language sql;

create domain v2."text/special" as text;

create function v2.get_special_text()
returns v2."text/special" as $$
  select 'special'::v2."text/special";
$$ language sql;

create or replace function v2.special_trans (state v2."text/special", next v2.another_table)
returns v2."text/special" as $$
  select 'special'::v2."text/special";
$$ language sql;

drop aggregate if exists v2.special_agg(v2.another_table);
create aggregate v2.special_agg (v2.another_table) (
  initcond = ''
, stype = v2."text/special"
, sfunc = v2.special_trans
);

create or replace function v2.plain_trans (state test."text/plain", next v2.another_table)
returns test."text/plain" as $$
  select 'plain'::test."text/plain";
$$ language sql;

drop aggregate if exists v2.plain_agg(v2.another_table);
create aggregate v2.plain_agg (v2.another_table) (
  initcond = ''
, stype = test."text/plain"
, sfunc = v2.plain_trans
);

create table private.screens (
  id serial primary key,
  name text not null default 'new screen'
);

create table private.labels (
  id serial primary key,
  name text not null default 'new label'
);

create table private.label_screen (
  label_id int not null references private.labels(id) on update cascade on delete cascade,
  screen_id int not null references private.screens(id) on update cascade on delete cascade,
  constraint label_screen_pkey primary key (label_id, screen_id)
);

create view test.labels as
select * from private.labels;

create view test.screens as
select * from private.screens;

create view test.label_screen as
select * from private.label_screen;

create table private.actors (
  id int,
  name text,
  constraint actors_id primary key (id)
);

create table private.films (
  id integer,
  title text,
  constraint films_id primary key (id)
);

create table private.personnages (
  film_id int not null,
  role_id int not null,
  character text not null,
  constraint personnages_film_id_role_id primary key (film_id, role_id),
  constraint personnages_film_id_fkey foreign key (film_id) references private.films(id) not deferrable,
  constraint personnages_role_id_fkey foreign key (role_id) references private.actors(id) not deferrable
);

create view test.actors as
select * from private.actors;

create view test.films as
select * from private.films;

create view test.personnages as
select * from private.personnages;

create table test.end_1(
  id int primary key,
  name text
);

create table test.end_2(
  id int primary key,
  name text
);

create table private.junction(
  end_1_id int not null references test.end_1(id) on update cascade on delete cascade,
  end_2_id int not null references test.end_2(id) on update cascade on delete cascade,
  primary key (end_1_id, end_2_id)
);

create table test.schauspieler (
  id int primary key,
  name text
);

create table test.filme (
  id int primary key,
  titel text
);

create table test.rollen ();

create table private.rollen (
  film_id int not null,
  rolle_id int not null,
  charakter text not null,
  primary key (film_id, rolle_id),
  foreign key (film_id) references test.filme(id),
  foreign key (rolle_id) references test.schauspieler(id)
);

-- Tables used for testing embedding between partitioned tables
create table test.car_models(
  name varchar(64) not null,
  year int not null
) partition by list (year);

comment on table test.car_models is
$$A partitioned table

A test for partitioned tables$$;

create table test.car_models_2021 partition of test.car_models
  for values in (2021);
create table test.car_models_default partition of test.car_models
  for values in (1981,1997,2001,2013);

create table test.car_brands (
  name varchar(64) primary key
);

alter table test.car_models add primary key (name, year);
alter table test.car_models add column car_brand_name varchar(64) references test.car_brands(name);

create table test.car_model_sales(
  date varchar(64) not null,
  quantity int not null,
  car_model_name varchar(64),
  car_model_year int,
  primary key (date, car_model_name, car_model_year),
  foreign key (car_model_name, car_model_year) references test.car_models (name, year)
) partition by range (date);

create table test.car_model_sales_202101 partition of test.car_model_sales
  for values from ('2021-01-01') to ('2021-01-31');

create table test.car_model_sales_default partition of test.car_model_sales
  default;

create table test.car_racers (
  name varchar(64) not null primary key,
  car_model_name varchar(64),
  car_model_year int,
  foreign key (car_model_name, car_model_year) references test.car_models (name, year)
);

create table test.car_dealers (
  name varchar(64) not null,
  city varchar(64) not null,
  primary key (name, city)
) partition by list (city);

create table test.car_dealers_springfield partition of test.car_dealers
  for values in ('Springfield');

create table test.car_dealers_default partition of test.car_dealers
  default;

create table test.car_models_car_dealers (
  car_model_name varchar(64) not null,
  car_model_year int not null,
  car_dealer_name varchar(64) not null,
  car_dealer_city varchar(64) not null,
  quantity int not null,
  foreign key (car_model_name, car_model_year) references test.car_models (name, year),
  foreign key (car_dealer_name, car_dealer_city) references test.car_dealers (name, city),
  primary key (car_model_name, car_model_year, car_dealer_name, car_dealer_city, quantity)
) partition by range (quantity);

create table test.car_models_car_dealers_10to20 partition of test.car_models_car_dealers
  for values from (10) to (20);

create table test.car_models_car_dealers_default partition of test.car_models_car_dealers
  default;

create or replace function test.unnamed_json_param(json) returns json as $$
  select $1;
$$ language sql;

-- Function with a NAMED json parameter (for testing single param fallback behavior)
create or replace function test.named_json_param(data json) returns json as $$
  select data;
$$ language sql;

create or replace function test.unnamed_text_param(text) returns "text/plain" as $$
  select $1::"text/plain";
$$ language sql;

create or replace function test.unnamed_xml_param(pg_catalog.xml) returns "text/xml" as $$
  select $1::"text/xml";
$$ language sql;

create or replace function test.unnamed_bytea_param(bytea) returns "application/octet-stream" as $$
  select $1::"application/octet-stream";
$$ language sql;

create or replace function test.unnamed_int_param(int) returns int as $$
  select $1;
$$ language sql;

create or replace function test.overloaded_unnamed_param(json) returns json as $$
  select $1;
$$ language sql;

create or replace function test.overloaded_unnamed_param(bytea) returns "application/octet-stream" as $$
select $1::"application/octet-stream";
$$ language sql;

create or replace function test.overloaded_unnamed_param(text) returns "text/plain" as $$
select $1::"text/plain";
$$ language sql;

create or replace function test.overloaded_unnamed_param() returns int as $$
select 1;
$$ language sql;

create or replace function test.overloaded_unnamed_param(x int, y int) returns int as $$
  select x + y;
$$ language sql;

create or replace function test.overloaded_unnamed_json_jsonb_param(json) returns json as $$
select $1;
$$ language sql;

create or replace function test.overloaded_unnamed_json_jsonb_param(jsonb) returns jsonb as $$
select $1;
$$ language sql;

create or replace function test.overloaded_unnamed_json_jsonb_param(x int, y int) returns int as $$
select x + y;
$$ language sql;

create table products(
  id int primary key
, name text
);

create table suppliers(
  id int primary key
, name text
);

create table products_suppliers(
  product_id int references products(id),
  supplier_id int references suppliers(id),
  primary key (product_id, supplier_id)
);

create table trade_unions(
  id int primary key
, name text
);

create table suppliers_trade_unions(
  supplier_id int references suppliers(id),
  trade_union_id int references trade_unions(id),
  primary key (supplier_id, trade_union_id)
);


CREATE TABLE client (
  id int primary key
, name text
);

CREATE TABLE contact (
  id int primary key
, name text
, clientid int references client(id)
);

CREATE TABLE clientinfo (
  id serial primary key
, clientid int references client(id)
, other text
);

CREATE TABLE chores (
  id int primary key
, name text
, done bool
);

CREATE TABLE deferrable_unique_constraint (
  col INT UNIQUE DEFERRABLE INITIALLY IMMEDIATE
);

CREATE FUNCTION raise_constraint(deferred BOOL DEFAULT FALSE) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF deferred THEN
    SET CONSTRAINTS ALL DEFERRED;
  END IF;

  INSERT INTO deferrable_unique_constraint VALUES (1), (1);
END$$;

-- This view is not used in any requests but just parsed by the pfkSourceColumns query.
CREATE VIEW test.xml AS
SELECT *
  FROM (SELECT ''::xml AS data) _,
       XMLTABLE(
         ''
         PASSING data
         COLUMNS id int PATH '@id',
                 premier_name text PATH 'PREMIER_NAME' DEFAULT 'not specified'
       );

-- https://github.com/PostgREST/postgrest/issues/1543
CREATE TYPE complex AS (
 r double precision,
 i double precision
);

CREATE TABLE test.fav_numbers (
 num    complex,
 person text
);

-- https://github.com/PostgREST/postgrest/issues/2075
create table test.arrays (
  id int primary key,
  numbers int[],
  numbers_mult int[][]
);

-- This procedure is to confirm that procedures don't show up in the OpenAPI output right now.
-- Procedures are not supported, yet.
CREATE PROCEDURE test.unsupported_proc ()
LANGUAGE SQL AS '';

CREATE FUNCTION public.dummy(int) RETURNS int
LANGUAGE SQL AS $$ SELECT 1 $$;

-- This aggregate is to confirm that aggregates don't show up in the OpenAPI output.
CREATE AGGREGATE test.unsupported_agg (*) (
  SFUNC = public.dummy,
  STYPE = int
);

create function reset_table(tbl_name text default '', tbl_data json default '[]') returns void as $_$ begin
  execute format(
  $$
    delete from %I where true; -- WHERE is required for pg-safeupdate tests
    insert into %I
    select * from json_populate_recordset(null::%I, $1);
  $$::text,
  tbl_name, tbl_name, tbl_name)
  using tbl_data;
end; $_$ language plpgsql volatile;

-- tables for ensuring we generate real junctions for many-to-many relationships
create table plate (
    plate_id int primary key
);

create table well (
    well_id int primary key,
    plate_id int not null,
    parent_well_id int,
   CONSTRAINT well_parent_well_id_fkey
      FOREIGN KEY(parent_well_id)
	  REFERENCES well(well_id),
   CONSTRAINT well_plate_id_fkey
      FOREIGN KEY(plate_id)
	  REFERENCES plate(plate_id)
);

create table plate_plan_step (
    plate_plan_step_id int primary key,
    from_well_id int,
    to_well_id int,
    to_plate_id int,
   CONSTRAINT plate_plan_step_from_well_id_fkey
      FOREIGN KEY(from_well_id)
	  REFERENCES well(well_id),
   CONSTRAINT plate_plan_step_to_plate_id_fkey
      FOREIGN KEY(to_plate_id)
	  REFERENCES plate(plate_id),
   CONSTRAINT plate_plan_step_to_well_id_fkey
      FOREIGN KEY(to_well_id)
	  REFERENCES well(well_id)
);

CREATE FUNCTION test.return_scalar_xml() RETURNS "text/xml"
LANGUAGE sql AS $$
  SELECT '<my-xml-tag/>'::"text/xml"
$$;

CREATE OR REPLACE FUNCTION "welcome.xml"() RETURNS "text/xml"
LANGUAGE sql AS $_$
select $$
<html>
  <head>
    <title>PostgREST</title>
  </head>
  <body>
    <h1>Welcome to PostgREST</h1>
  </body>
</html>$$::"text/xml";
$_$;

CREATE TABLE test.xmltest (
    id integer primary key,
    xml pg_catalog.xml NOT NULL
);

create or replace function test.xml_handler_transition (state "text/xml", next test.xmltest)
returns "text/xml" as $$
  select xmlconcat2(state, next.xml)::"text/xml";
$$ language sql;

create or replace function test.xml_handler_final (data "text/xml")
returns "text/xml" as $$
  select data;
$$ language sql;

drop aggregate if exists test.text_xml_agg(test.xmltest);
create aggregate test.text_xml_agg (test.xmltest) (
  stype = "text/xml"
, sfunc = test.xml_handler_transition
, finalfunc = test.xml_handler_final
);

CREATE TABLE oid_test(
  id int,
  oid_col oid,
  oid_array_col oid[]);

CREATE TABLE private.internal_job
(
    id integer NOT NULL,
    parent_id integer,
    CONSTRAINT internal_job_pkey PRIMARY KEY (id),
    CONSTRAINT parent_fk FOREIGN KEY (parent_id) REFERENCES private.internal_job (id)
);

CREATE VIEW test.job AS
SELECT j.id, j.parent_id
FROM private.internal_job j;

-- https://github.com/PostgREST/postgrest/issues/2238
CREATE TABLE series (
    id bigint PRIMARY KEY,
    title text NOT NULL
);

CREATE TABLE adaptation_notifications (
    id bigint PRIMARY KEY,
    series bigint REFERENCES series(id),
    status text
);

CREATE VIEW series_popularity AS
SELECT id, random() AS popularity_score
FROM series;

-- https://github.com/PostgREST/postgrest/issues/1643
CREATE TABLE test.test (
  id BIGINT NOT NULL PRIMARY KEY,
  parent_id BIGINT CONSTRAINT parent_test REFERENCES test(id)
);

CREATE OR REPLACE VIEW test.view_test AS
  SELECT id FROM test.test;

create extension if not exists postgis with schema extensions;

create table shops (
  id        int primary key
, address   text
, shop_geom extensions.geometry(POINT, 4326)
);

create table shop_bles (
  id         int primary key
, name       text
, coords     extensions.geometry(POINT, 4326)
, range_area extensions.geometry(POLYGON, 4326)
, shop_id    int references shops(id)
);

create function get_shop(id int) returns shops as $$
  select * from shops where id = $1;
$$ language sql;

CREATE TABLE "SPECIAL ""@/\#~_-".languages(
  id INT PRIMARY KEY,
  name TEXT
);

CREATE TABLE "SPECIAL ""@/\#~_-".names(
  id INT PRIMARY KEY,
  name TEXT,
  language_id INT REFERENCES "SPECIAL ""@/\#~_-".languages(id)
);

CREATE FUNCTION "SPECIAL ""@/\#~_-".computed_languages("SPECIAL ""@/\#~_-".names) RETURNS SETOF "SPECIAL ""@/\#~_-".languages ROWS 1 AS $$
  SELECT * FROM "SPECIAL ""@/\#~_-".languages where id = $1.language_id;
$$ LANGUAGE sql;

CREATE FUNCTION "EXTRA ""@/\#~_-".get_val_special(val text) RETURNS text AS $$
  SELECT val;
$$ LANGUAGE sql;

CREATE FUNCTION test.special_extended_schema(val text) RETURNS text AS $$
  SELECT get_val_special(val);
$$ LANGUAGE sql;

CREATE TABLE do$llar$s (
  a$num$ numeric
);

-- Tables and functions to test the pg-safeupdate library

CREATE TABLE test.safe_update_items(
  id INT PRIMARY KEY,
  name TEXT,
  observation TEXT
);

CREATE TABLE test.safe_delete_items(
  id INT PRIMARY KEY,
  name TEXT,
  observation TEXT
);

CREATE TABLE test.unsafe_update_items(
  id INT PRIMARY KEY,
  name TEXT,
  observation TEXT
);

CREATE TABLE test.unsafe_delete_items(
  id INT PRIMARY KEY,
  name TEXT,
  observation TEXT
);

CREATE OR REPLACE FUNCTION test.load_safeupdate() RETURNS VOID AS $$
BEGIN
  LOAD 'safeupdate';
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- This tests data representations over computed joins: even a lower case title should come back title cased.
DROP DOMAIN IF EXISTS public.titlecasetext CASCADE;
CREATE DOMAIN public.titlecasetext AS text;

CREATE OR REPLACE FUNCTION "json"(public.titlecasetext) RETURNS json AS $$
  SELECT to_json(INITCAP($1::text));
$$ LANGUAGE SQL IMMUTABLE;

CREATE CAST (public.titlecasetext AS json) WITH FUNCTION "json"(public.titlecasetext) AS IMPLICIT;
-- End of data representations specific stuff except for where the domain is used in the table.

CREATE TABLE designers (
  id int primary key
, name public.titlecasetext
);

CREATE TABLE videogames (
  id int primary key
, name text
, designer_id int references designers(id)
);

-- computed relationships
CREATE FUNCTION test.computed_designers(test.videogames) RETURNS SETOF test.designers AS $$
  SELECT * FROM test.designers WHERE id = $1.designer_id;
$$ LANGUAGE sql STABLE ROWS 1;

CREATE FUNCTION test.computed_designers_noset(test.videogames) RETURNS test.designers AS $$
  SELECT * FROM test.designers WHERE id = $1.designer_id;
$$ LANGUAGE sql STABLE;

CREATE FUNCTION test.computed_videogames(test.designers) RETURNS SETOF test.videogames AS $$
  SELECT * FROM test.videogames WHERE designer_id = $1.id;
$$ LANGUAGE sql STABLE;

CREATE FUNCTION test.getallvideogames() RETURNS SETOF test.videogames AS $$
  SELECT * FROM test.videogames;
$$ LANGUAGE sql STABLE;

CREATE FUNCTION test.getalldesigners() RETURNS SETOF test.designers AS $$
  SELECT * FROM test.designers;
$$ LANGUAGE sql STABLE;

-- self join for computed relationships
CREATE FUNCTION test.child_web_content(test.web_content) RETURNS SETOF test.web_content AS $$
  SELECT * FROM test.web_content WHERE $1.id = p_web_id;
$$ LANGUAGE sql STABLE;

CREATE FUNCTION test.parent_web_content(test.web_content) RETURNS SETOF test.web_content AS $$
  SELECT * FROM test.web_content WHERE $1.p_web_id = id;
$$ LANGUAGE sql STABLE ROWS 1;

-- overriding computed rels that empty the results
CREATE FUNCTION test.designers(test.videogames) RETURNS SETOF test.designers AS $$
  SELECT * FROM test.designers WHERE FALSE;
$$ LANGUAGE sql STABLE ROWS 1;

CREATE FUNCTION test.videogames(test.designers) RETURNS SETOF test.videogames AS $$
  SELECT * FROM test.videogames WHERE FALSE;
$$ LANGUAGE sql STABLE;

CREATE TABLE test.students(
  id int
, code text
, name text
, primary key(id, code)
);

CREATE TABLE test.students_info(
  id int
, code text
, address text
, primary key(id, code)
, foreign key (code, id) references test.students(code, id) on delete cascade
);

CREATE TABLE test.country(
  id int primary key
, name text
);

CREATE TABLE test.capital(
  id int primary key
, name text
, country_id int unique
, foreign key (country_id) references test.country(id)
);

CREATE FUNCTION test.allcountries() RETURNS SETOF test.country AS $$
  SELECT * FROM test.country;
$$ LANGUAGE sql STABLE;

CREATE FUNCTION test.allcapitals() RETURNS SETOF test.capital AS $$
  SELECT * FROM test.capital;
$$ LANGUAGE sql STABLE;

create view students_view as
select * from students;

create view students_info_view as
select * from students_info;

create table test.second (
  id int primary key,
  name text
);

create table test.first (
  id int primary key,
  name text,
  second_id_1 int references test.second unique,
  second_id_2 int references test.second unique
);

create table test.second_1 (
  id int primary key,
  name text
);

create table test.first_1 (
  id int primary key,
  name text,
  second_id_1 int references test.second unique,
  second_id_2 int references test.second unique
);

CREATE FUNCTION test.second_1(test.first_1) RETURNS SETOF test.second_1 AS $$
  SELECT * FROM test.second_1 WHERE id = $1.second_id_1;
$$ LANGUAGE sql STABLE ROWS 1;

CREATE FUNCTION test.first_1(test.second_1) RETURNS SETOF test.first_1 AS $$
  SELECT * FROM test.first_1 WHERE second_id_1 = $1.id;
$$ LANGUAGE sql STABLE ROWS 1;


create table fee (
  fee_id int primary key
);
create table baz (
  baz_id int primary key
);

create table janedoe (
  janedoe_id int primary key,
  baz_id int references baz(baz_id)
);

create table johnsmith (
  johnsmith_id int primary key,
  fee_id int references fee(fee_id),
  baz_id int references baz(baz_id)
);

create or replace function jsbaz(fee) returns setof baz as $$
    select b.*
    from baz b
    join johnsmith js on js.baz_id = b.baz_id
    where js.fee_id = $1.fee_id
$$ stable language sql;


-- issue https://github.com/PostgREST/postgrest/issues/2518
create table a (
  primary key (c1, c2),
  c1 int,
  c2 bool
);

create table b (
  c2 bool,
  c1 int,
  foreign key (c1, c2) references a
);

create view test.v1 as table test.a;

create view test.v2 as table test.b;

-- issue https://github.com/PostgREST/postgrest/issues/2458
create table with_pk1 (pk1 int primary key);
create table with_pk2 (pk2 int primary key);

create view with_multiple_pks as
  select * from with_pk1, with_pk2;

create function with_multiple_pks_insert() returns trigger
language plpgsql as $$
begin
  insert into with_pk1 values (new.pk1) on conflict do nothing;
  insert into with_pk2 values (new.pk2) on conflict do nothing;
  return new;
end
$$;

create trigger ins instead of insert on with_multiple_pks
  for each row execute procedure with_multiple_pks_insert();

-- issue https://github.com/PostgREST/postgrest/issues/2283
create view self_recursive_view as table projects;
create or replace view self_recursive_view as table self_recursive_view;

CREATE FUNCTION test.computed_clients(test.projects) RETURNS SETOF test.clients ROWS 1 AS $$
  SELECT * FROM test.clients WHERE id = $1.client_id;
$$ LANGUAGE sql STABLE;

CREATE FUNCTION test.computed_projects(test.clients) RETURNS SETOF test.projects ROWS 1 AS $$
  SELECT * FROM test.projects WHERE client_id = $1.id;
$$ LANGUAGE sql STABLE;

-- issue https://github.com/PostgREST/postgrest/issues/2459
create table public.i2459_simple_t1 (
  id int primary key
);

create table public.i2459_simple_t2 (
  t1_id int references public.i2459_simple_t1
);

create view i2459_simple_v1 as table public.i2459_simple_t1;

create view i2459_simple_v2 as
  select t1_id as t1_id1, t1_id as t1_id2 from public.i2459_simple_t2;


create table public.i2459_composite_t1 (
  primary key (a,b),
  a int,
  b int
);

create table public.i2459_composite_t2 (
  t1_a int,
  t1_b int,
  constraint i2459_composite_t2_t1_a_t1_b_fkey foreign key (t1_a, t1_b) references public.i2459_composite_t1
);

create view i2459_composite_v1 as table public.i2459_composite_t1;

create view i2459_composite_v2 as
  select t1_a as t1_a1,
         t1_b as t1_b1,
         t1_a as t1_a2,
         t1_b as t1_b2
    from public.i2459_composite_t2;


create table public.i2459_self_t (
  id int primary key,
  parent int references public.i2459_self_t,
  type text
);


create view i2459_self_v1 as
select parent.parent as grandparent,
       child.parent,
       child.id
  from public.i2459_self_t as parent
       join public.i2459_self_t as child
         on child.parent = parent.id
 where child.type = 'A';

create view i2459_self_v2 as
select parent.parent as grandparent,
       child.parent,
       child.id
  from public.i2459_self_t as parent
       join public.i2459_self_t as child
         on child.parent = parent.id
 where child.type = 'B';

-- issue https://github.com/PostgREST/postgrest/issues/2548
CREATE TABLE public.ta (
  a1 INT PRIMARY KEY,
  a2 INT,
  UNIQUE (a1, a2)
);

CREATE TABLE public.tb (
  b1 INT REFERENCES public.ta (a1),
  b2 INT,
  FOREIGN KEY (b1, b2) REFERENCES public.ta (a1, a2)
);

CREATE VIEW test.va AS SELECT a1 FROM public.ta;
CREATE VIEW test.vb AS SELECT b1 FROM public.tb;

create table test.trash(
  id int primary key
);

create table test.trash_details(
  id int primary key references test.trash(id),
  jsonb_col jsonb
);

CREATE TABLE test.groups (
    name text PRIMARY KEY
);

CREATE TABLE test.yards (
    id bigint PRIMARY KEY
);

CREATE TABLE test.group_yard (
    id bigint NOT NULL,
    group_id text NOT NULL REFERENCES test.groups(name),
    yard_id bigint NOT NULL REFERENCES test.yards(id),
    PRIMARY KEY (id, group_id, yard_id)
);

CREATE FUNCTION test.get_yards() RETURNS SETOF test.yards
LANGUAGE sql
AS $$
  select * from test.yards;
$$;

create table test.posters(
  id int primary key,
  name text
);

create table test.subscriptions(
  subscriber int references test.posters(id),
  subscribed int references test.posters(id),
  primary key(subscriber, subscribed)
);

-- Data representations feature
DROP DOMAIN IF EXISTS public.color CASCADE;
CREATE DOMAIN public.color AS INTEGER CHECK (VALUE >= 0 AND VALUE <= 16777215);

CREATE OR REPLACE FUNCTION color(json) RETURNS public.color AS $$
  SELECT color($1 #>> '{}');
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION color(text) RETURNS public.color AS $$
  SELECT (('x' || lpad((CASE WHEN SUBSTRING($1::text, 1, 1) = '#' THEN SUBSTRING($1::text, 2) ELSE $1::text END), 8, '0'))::bit(32)::int)::public.color;
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION "json"(public.color) RETURNS json AS $$
  SELECT
    CASE WHEN $1 IS NULL THEN to_json(''::text)
    ELSE to_json('#' || lpad(upper(to_hex($1)), 6, '0'))
  END;
$$ LANGUAGE SQL IMMUTABLE;

CREATE CAST (public.color AS json) WITH FUNCTION "json"(public.color) AS IMPLICIT;
CREATE CAST (json AS public.color) WITH FUNCTION color(json) AS IMPLICIT;
CREATE CAST (text AS public.color) WITH FUNCTION color(text) AS IMPLICIT;

DROP DOMAIN IF EXISTS public.isodate CASCADE;
CREATE DOMAIN public.isodate AS timestamp with time zone;

CREATE OR REPLACE FUNCTION isodate(json) RETURNS public.isodate AS $$
  SELECT isodate($1 #>> '{}');
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION isodate(text) RETURNS public.isodate AS $$
  SELECT (replace($1, 'Z', '+00:00')::timestamp with time zone)::public.isodate;
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION "json"(public.isodate) RETURNS json AS $$
  SELECT to_json(replace(to_json($1)#>>'{}', '+00:00', 'Z'));
$$ LANGUAGE SQL IMMUTABLE;

CREATE CAST (public.isodate AS json) WITH FUNCTION "json"(public.isodate) AS IMPLICIT;
CREATE CAST (json AS public.isodate) WITH FUNCTION isodate(json) AS IMPLICIT;
-- We intentionally don't have this in order to test query string parsing doesn't try to fall back on JSON parsing.
-- CREATE CAST (text AS public.isodate) WITH FUNCTION isodate(text) AS IMPLICIT;

-- bytea_b64 is a base64-encoded binary string
DROP DOMAIN IF EXISTS public.bytea_b64 CASCADE;
CREATE DOMAIN public.bytea_b64 AS bytea;

CREATE OR REPLACE FUNCTION bytea_b64(json) RETURNS public.bytea_b64 AS $$
  SELECT bytea_b64($1 #>> '{}');
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION bytea_b64(text) RETURNS public.bytea_b64 AS $$
  -- allow unpadded base64
  SELECT decode($1 || repeat('=', 4 - (length($1) % 4)), 'base64')::public.bytea_b64;
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION "json"(public.bytea_b64) RETURNS json AS $$
  SELECT to_json(translate(encode($1, 'base64'), E'\n', ''));
$$ LANGUAGE SQL IMMUTABLE;

CREATE CAST (public.bytea_b64 AS json) WITH FUNCTION "json"(public.bytea_b64) AS IMPLICIT;
CREATE CAST (json AS public.bytea_b64) WITH FUNCTION bytea_b64(json) AS IMPLICIT;
CREATE CAST (text AS public.bytea_b64) WITH FUNCTION bytea_b64(text) AS IMPLICIT;

-- unixtz is a timestamptz represented as an integer number of seconds since the Unix epoch
DROP DOMAIN IF EXISTS public.unixtz CASCADE;
CREATE DOMAIN public.unixtz AS timestamp with time zone;

CREATE OR REPLACE FUNCTION unixtz(json) RETURNS public.unixtz AS $$
  SELECT unixtz($1 #>> '{}');
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION unixtz(text) RETURNS public.unixtz AS $$
  SELECT (to_timestamp($1::numeric)::public.unixtz);
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION "json"(public.unixtz) RETURNS json AS $$
  SELECT to_json(extract(epoch from $1)::bigint);
$$ LANGUAGE SQL IMMUTABLE;


CREATE CAST (public.unixtz AS json) WITH FUNCTION "json"(public.unixtz) AS IMPLICIT;
CREATE CAST (json AS public.unixtz) WITH FUNCTION unixtz(json) AS IMPLICIT;
CREATE CAST (text AS public.unixtz) WITH FUNCTION unixtz(text) AS IMPLICIT;

DROP DOMAIN IF EXISTS public.monetary CASCADE;
CREATE DOMAIN public.monetary AS numeric(17,2);

CREATE OR REPLACE FUNCTION monetary(json) RETURNS public.monetary AS $$
  SELECT monetary($1 #>> '{}');
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION monetary(text) RETURNS public.monetary AS $$
  SELECT ($1::numeric)::public.monetary;
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION "json"(public.monetary) RETURNS json AS $$
  SELECT to_json($1::text);
$$ LANGUAGE SQL IMMUTABLE;

CREATE CAST (public.monetary AS json) WITH FUNCTION "json"(public.monetary) AS IMPLICIT;
CREATE CAST (json AS public.monetary) WITH FUNCTION monetary(json) AS IMPLICIT;
CREATE CAST (text AS public.monetary) WITH FUNCTION monetary(text) AS IMPLICIT;

CREATE TABLE datarep_todos (
  id bigint primary key,
  name text,
  label_color public.color default 0,
  due_at public.isodate default '2018-01-01'::date,
  icon_image public.bytea_b64,
  created_at public.unixtz default '2017-12-14 01:02:30'::timestamptz,
  budget public.monetary default 0
);

CREATE TABLE datarep_next_two_todos (
  id bigint primary key,
  first_item_id bigint references datarep_todos(id),
  second_item_id bigint references datarep_todos(id),
  name text
);

CREATE VIEW datarep_todos_computed as (
  SELECT id,
    name,
    label_color,
    due_at,
    (label_color / 2)::public.color as dark_color
  FROM datarep_todos
);

-- view's name is alphabetically before projects
create view test.alpha_projects as
  select c.id, p.name as pro_name, c.name as cli_name
  from projects p join clients c on p.client_id = c.id;

-- view's name is alphabetically after projects
create view test.zeta_projects as
  select c.id, p.name as pro_name, c.name as cli_name
  from projects p join clients c on p.client_id = c.id;

CREATE VIEW test.complex_items_view AS
SELECT * FROM test.complex_items;

ALTER VIEW test.complex_items_view ALTER COLUMN name SET DEFAULT 'Default';

create table test.tbl_w_json(
  id int,
  data json
);

CREATE TABLE test.channels (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  data jsonb DEFAULT '{"foo": "bar"}',
  slug text
);

CREATE FUNCTION test.is_superuser() RETURNS boolean
LANGUAGE sql
AS $$
  select current_setting('is_superuser')::boolean;
$$;

CREATE TABLE test.foo (
  a text,
  b text GENERATED ALWAYS AS (
      case WHEN a = 'telegram' THEN 'im'
           WHEN a = 'proton' THEN 'email'
           WHEN a = 'infinity' THEN 'idea'
           ELSE 'bad idea'
      end) stored
);

create domain devil_int as int
  default 666;

create table evil_friends(
  id   devil_int
, name text
);

create table evil_friends_with_column_default(
  id   devil_int default 420
, name text
);

create table bets (
  id int
, data_json  json
, data_jsonb jsonb
);

create index bets_data_json  on bets ((data_json  ->>'contractId'));
create index bets_data_jsonb on bets ((data_jsonb ->>'contractId'));

--- https://github.com/PostgREST/postgrest/issues/2862
create table profiles (
  id uuid primary key,
  username text null
);

create table user_friend (
  id bigint primary key,
  user1 uuid references profiles (id),
  user2 uuid references profiles (id)
);

create table status(
  id bigint primary key
);

create table tournaments(
  id bigint primary key,
  status bigint references status(id)
);

-- https://github.com/PostgREST/postgrest/issues/2861
CREATE TABLE bitchar_with_length (
  bit bit(5),
  char char(5),
  bit_arr bit(5)[],
  char_arr char(5)[]
);

-- https://github.com/PostgREST/postgrest/issues/1586
create or replace function char_param_select(char_ char(4), char_arr char(4)[])
returns table(char_ char, char_arr char[]) as $$
  select $1, $2;
$$ language sql;

create or replace function bit_param_select(bit_ char(4), bit_arr char(4)[])
returns table(bit_ char, bit_arr char[]) as $$
  select $1, $2;
$$ language sql;

create or replace function char_param_insert(char_ char(4), char_arr char(4)[])
returns void as $$
  insert into bitchar_with_length(char, char_arr) values($1, $2);
$$ language sql;

create or replace function bit_param_insert(bit_ bit(4), bit_arr bit(4)[])
returns void as $$
insert into bitchar_with_length(bit, bit_arr) values($1, $2);
$$ language sql;

create function returns_record() returns record as $$
select * from projects limit 1;
$$ language sql;

create function returns_record_params(id int, name text) returns record as $$
select * from projects p where p.id = $1 and p.name like $2;
$$ language sql;

create function returns_setof_record() returns setof record as $$
select * from projects limit 2;
$$ language sql;

create function returns_setof_record_params(id int, name text) returns setof record as $$
select * from projects p where p.id >= $1 and p.name like $2;
$$ language sql;

create function raise_sqlstate_test1() returns void
  language plpgsql
  as $$
begin
    raise sqlstate 'PGRST' USING
      message = '{"code":"123","message":"ABC","details":"DEF","hint":"XYZ"}',
      detail = '{"status":332,"status_text":"My Custom Status","headers":{"X-Header":"str"}}';
end
$$;

create function raise_sqlstate_test2() returns void
  language plpgsql
  as $$
begin
    raise sqlstate 'PGRST' USING
      message = '{"code":"123","message":"ABC"}',
      detail = '{"status":332,"headers":{"X-Header":"str"}}';
end
$$;

create function raise_sqlstate_test3() returns void
  language plpgsql
  as $$
begin
    raise sqlstate 'PGRST' USING
      message = '{"code":"123","message":"ABC"}',
      detail = '{"status":404,"headers":{"X-Header":"str"}}';
end
$$;

create function raise_sqlstate_test4() returns void
  language plpgsql
  as $$
begin
    raise sqlstate 'PGRST' USING
      message = '{"code":"123","message":"ABC"}',
      detail = '{"status":404,"status_text":"My Not Found","headers":{"X-Header":"str"}}';
end
$$;

create function raise_sqlstate_invalid_json_message() returns void
  language plpgsql
  as $$
begin
    raise sqlstate 'PGRST' USING
      message = 'INVALID',
      detail = '{"status":332,"headers":{"X-Header":"str"}}';
end
$$;

create function raise_sqlstate_invalid_json_details() returns void
  language plpgsql
  as $$
begin
    raise sqlstate 'PGRST' USING
      message = '{"code":"123","message":"ABC","details":"DEF"}',
      detail = 'INVALID';
end
$$;

create function raise_sqlstate_missing_details() returns void
  language plpgsql
  as $$
begin
    raise sqlstate 'PGRST' USING
      message = '{"code":"123","message":"ABC","details":"DEF"}';
end
$$;

create table table_a (
  id int primary key,
  name text
);

create table table_b (
  table_a_id int references table_a(id),
  name text
);

create or replace function test.returns_complex()
returns table(id int, val complex) as $$
  select 1, row(0.1, 0.5)::complex as val
  union
  select 2, row(0.2, 0.6)::complex as val
  union
  select 3, row(0.3, 0.7)::complex as val;
$$ language sql;

create function computed_rel_overload(items) returns setof items2 as $$
  select * from items2 limit 1
$$ language sql;

create function computed_rel_overload(items2) returns setof items2 as $$
  select * from items2 limit 2
$$ language sql;

create function search2(id bigint) returns setof items2
language plpgsql
stable
as $$ begin
  return query select items2.id from items2 where items2.id=search2.id;
end$$;

create table test.lines (
  id   int primary key
, name text
, geom extensions.geometry(LINESTRING, 4326)
);

create or replace function test.get_lines ()
returns setof test.lines as $$
  select * from lines;
$$ language sql;

create or replace function test.get_line (id int)
returns "application/vnd.twkb" as $$
  select extensions.st_astwkb(geom)::"application/vnd.twkb" from lines where id = get_line.id;
$$ language sql;

create or replace function test.get_shop_bles ()
returns setof test.shop_bles as $$
  select * from shop_bles;
$$ language sql;

-- it can work without a final function too if the stype is already the media type
create or replace function test.twkb_handler_transition (state "application/vnd.twkb", next test.lines)
returns "application/vnd.twkb" as $$
  select (state || extensions.st_astwkb(next.geom)) :: "application/vnd.twkb";
$$ language sql;

drop aggregate if exists test.twkb_agg(test.lines);
create aggregate test.twkb_agg (test.lines) (
  initcond = ''
, stype = "application/vnd.twkb"
, sfunc = test.twkb_handler_transition
);

create or replace function test.geo2json_trans (state "application/vnd.geo2+json", next anyelement)
returns "application/vnd.geo2+json" as $$
  select (state || extensions.ST_AsGeoJSON(next)::jsonb)::"application/vnd.geo2+json";
$$ language sql;

create or replace function test.geo2json_final (data "application/vnd.geo2+json")
returns "application/vnd.geo2+json" as $$
  select (jsonb_build_object('type', 'FeatureCollection', 'hello', 'world'))::"application/vnd.geo2+json";
$$ language sql;

drop aggregate if exists test.geo2json_agg_any(anyelement);
create aggregate test.geo2json_agg_any(anyelement) (
  initcond = '[]'
, stype = "application/vnd.geo2+json"
, sfunc = geo2json_trans
, finalfunc = geo2json_final
);

create or replace function test.geo2json_trans (state "application/vnd.geo2+json", next test.shop_bles)
returns "application/vnd.geo2+json" as $$
  select '"anyelement overridden"'::"application/vnd.geo2+json";
$$ language sql;

drop aggregate if exists test.geo2json_agg(test.shop_bles);
create aggregate test.geo2json_agg(test.shop_bles) (
  initcond = '[]'
, stype = "application/vnd.geo2+json"
, sfunc = geo2json_trans
);

create table ov_json ();

-- override application/json
create or replace function test.ov_json_trans (state "application/json", next ov_json)
returns "application/json" as $$
  select null;
$$ language sql;

drop aggregate if exists test.ov_json_agg(ov_json);
create aggregate test.ov_json_agg(ov_json) (
  initcond = '{"overridden": "true"}'
, stype = "application/json"
, sfunc = ov_json_trans
);

-- override application/geo+json
create or replace function test.lines_geojson_trans (state jsonb, next test.lines)
returns "application/geo+json" as $$
  select (state || extensions.ST_AsGeoJSON(next)::jsonb)::"application/geo+json";
$$ language sql;

create or replace function test.lines_geojson_final (data jsonb)
returns "application/geo+json" as $$
  select jsonb_build_object(
    'type', 'FeatureCollection',
    'crs',  json_build_object(
        'type',      'name',
        'properties', json_build_object(
            'name', 'EPSG:4326'
         )
     ),
    'features', data
  )::"application/geo+json";
$$ language sql;

drop aggregate if exists test.lines_geojson_agg(test.lines);
create aggregate test.lines_geojson_agg (test.lines) (
  initcond = '[]'
, stype = "application/geo+json"
, sfunc = lines_geojson_trans
, finalfunc = lines_geojson_final
);

-- override application/vnd.pgrst.object
create or replace function test.pgrst_obj_json_trans (state "application/vnd.pgrst.object", next anyelement)
returns "application/vnd.pgrst.object" as $$
  select null;
$$ language sql;

drop aggregate if exists test.pgrst_obj_agg(anyelement);
create aggregate test.pgrst_obj_agg(anyelement) (
  initcond = '{"overridden": "true"}'
, stype = "application/vnd.pgrst.object"
, sfunc = pgrst_obj_json_trans
);

-- create a "text/tab-separated-values" media type
create or replace function test.tsv_trans (state text, next test.projects)
returns "text/tab-separated-values" as $$
  select (state || next.id::text || E'\t' || next.name || E'\t' || coalesce(next.client_id::text, '') || E'\n')::"text/tab-separated-values";
$$ language sql;


create or replace function test.tsv_final (data "text/tab-separated-values")
returns "text/tab-separated-values" as $$
  select (E'id\tname\tclient_id\n' || data)::"text/tab-separated-values";
$$ language sql;

drop aggregate if exists test.tsv_agg(test.projects);
create aggregate test.tsv_agg (test.projects) (
  initcond = ''
, stype = "text/tab-separated-values"
, sfunc = tsv_trans
, finalfunc = tsv_final
);

-- override CSV with BOM plus attachment
create or replace function test.bom_csv_trans (state text, next test.lines)
returns "text/csv" as $$
  select (state || next.id::text || ',' || next.name || ',' || next.geom::text || E'\n')::"text/csv";
$$ language sql;

create or replace function test.bom_csv_final (data "text/csv")
returns "text/csv" as $$
  select set_config('response.headers', '[{"Content-Disposition": "attachment; filename=\"lines.csv\""}]', true);
  -- EFBBBF is the BOM in UTF8 https://en.wikipedia.org/wiki/Byte_order_mark#UTF-8
  select (convert_from (decode (E'EFBBBF', 'hex'),'UTF8') || (E'id,name,geom\n' || data))::"text/csv";
$$ language sql;

drop aggregate if exists test.bom_csv_agg(test.lines);
create aggregate test.bom_csv_agg (test.lines) (
  initcond = ''
, stype = "text/csv"
, sfunc = bom_csv_trans
, finalfunc = bom_csv_final
);

create table empty_string as select 1 as id, ''::text as string;

create table timestamps (
  t timestamp with time zone
);

create table project_invoices (
  id int primary key
, invoice_total numeric
, project_id integer references projects(id)
);

create table budget_categories (
  id int primary key
, category_name text
, budget_owner text
, budget_amount numeric
);

create table budget_expenses (
  id int primary key
, expense_amount numeric
, budget_category_id integer references budget_categories(id)
);

create or replace function ret_any_mt ()
returns "*/*" as $$
  select 'any'::"*/*";
$$ language sql;

create or replace function ret_some_mt ()
returns "*/*" as $$
declare
  req_accept text := current_setting('request.headers', true)::json->>'accept';
  resp bytea;
begin
  case req_accept
    when 'app/chico'   then
      perform set_config('response.headers', json_build_array(json_build_object('Content-Type', req_accept))::text, true);
      resp := 'chico';
    when 'app/harpo'   then
      perform set_config('response.headers', json_build_array(json_build_object('Content-Type', req_accept))::text, true);
      resp := 'harpo';
    when '*/*'         then
      perform set_config('response.headers', json_build_array(json_build_object('Content-Type', 'app/groucho'))::text, true);
      resp := 'groucho';
    else
      raise sqlstate 'PT406' using message = 'Not Acceptable';
  end case;
  return resp;
end; $$ language plpgsql;

create table some_numbers as select x::int as val from generate_series(1,10) x;

create or replace function some_trans (state "*/*", next some_numbers)
returns "*/*" as $$
  select (state || E'\n' || next.val::text::bytea)::"*/*";
$$ language sql;

create or replace function some_final (data "*/*")
returns "*/*" as $$
declare
  req_accept text := current_setting('request.headers', true)::json->>'accept';
  prefix bytea;
begin
  case req_accept
    when 'magic/number' then
      perform set_config('response.headers', json_build_array(json_build_object('Content-Type', req_accept))::text, true);
      prefix := 'magic';
    when 'crazy/bingo'  then
      perform set_config('response.headers', json_build_array(json_build_object('Content-Type', req_accept))::text, true);
      prefix := 'crazy';
    else
      prefix := 'anything';
  end case;
  return (prefix || data)::"*/*";
end; $$ language plpgsql;

drop aggregate if exists some_agg (some_numbers);
create aggregate test.some_agg (some_numbers) (
  initcond = ''
, stype = "*/*"
, sfunc = some_trans
, finalfunc = some_final
);

create view bad_subquery as
select * from projects where id = (select id from projects);

-- custom generic mimetype
create domain "pg/outfunc" as text;
create function test.outfunc_trans (state text, next anyelement)
returns "pg/outfunc" as $$
  select (state || next::text || E'\n')::"pg/outfunc";
$$ language sql;

create aggregate test.outfunc_agg (anyelement) (
  initcond = ''
, stype = "pg/outfunc"
, sfunc = outfunc_trans
);

-- used for manual testing
create or replace function test.sleep(seconds double precision default 5) returns void as $$
  select pg_sleep(seconds);
$$ language sql;

-- https://github.com/PostgREST/postgrest/issues/3256
create view test.infinite_recursion as
select * from test.projects;

create or replace view test.infinite_recursion as
select * from test.infinite_recursion;


create or replace function temp_file_limit()
returns bigint as $$
  select COUNT(*) FROM generate_series('-infinity'::TIMESTAMP, 'epoch'::TIMESTAMP, INTERVAL '1 DAY');
$$ language sql security definer set temp_file_limit to '1kB';

-- https://github.com/PostgREST/postgrest/issues/3255
create table test.infinite_inserts(
  id int
, name text
);

create or replace function infinite_inserts()
returns trigger as $$ begin
  insert into infinite_inserts values (NEW.id, NEW.name);
end $$ language plpgsql;

create trigger do_infinite_inserts
after insert
on infinite_inserts
for each row
execute procedure infinite_inserts();

create table factories (
  id int primary key,
  name text
);

create table process_categories (
  id int primary key,
  name text
);

create table processes (
  id int primary key,
  name text,
  factory_id int references factories(id),
  category_id int references process_categories(id)
);

create table process_costs (
  process_id int references processes(id) primary key,
  cost numeric
);

create table supervisors (
  id int primary key,
  name text
);

create table process_supervisor (
  process_id int references processes(id),
  supervisor_id int references supervisors(id),
  primary key (process_id, supervisor_id)
);

create table surr_serial_upsert (
  id serial primary key,
  name text,
  extra text
);

create table surr_gen_default_upsert (
  id int generated by default as identity primary key,
  name text,
  extra text
);

-- test for case-sensitive table name and sequence name, see #3712
create table "Surr_Gen_Default_Upsert" (
  id int generated by default as identity primary key,
  name text,
  extra text
);

create domain tsvector_not_null as tsvector
  constraint "tsvector is required" check (value is not null);

create domain tsvector_not_empty as tsvector_not_null
  constraint "tsvector is required and not empty" check (value <> '');

create table tsearch_to_tsvector (
  text_search text,
  jsonb_search jsonb,
  text_search_domain tsvector_not_null default '',
  text_search_rec_domain tsvector_not_empty default '.'
);

create function test.get_tsearch_to_tsvector() returns setof test.tsearch_to_tsvector AS $$
  select * from test.tsearch_to_tsvector;
$$ language sql;

create function test.text_search_vector(test.tsearch_to_tsvector) returns tsvector AS $$
  select to_tsvector('simple', $1.text_search)
$$ language sql;

-- to test ordering with mutations
CREATE TABLE test.artists (
  id int PRIMARY KEY,
  name text
);

CREATE TABLE test.albums (
  id int PRIMARY KEY,
  title text,
  artist_id int,

  CONSTRAINT fk_artist
    FOREIGN KEY (artist_id) REFERENCES artists (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

create table operators (
  id int primary key,
  name text,
  status jsonb
);

create table process_operator (
  process_id int references processes(id),
  operator_id int references operators(id),
  primary key (process_id, operator_id)
);

create table factory_buildings (
  id int primary key,
  code char(4),
  size numeric,
  "type" char(1),
  factory_id int references factories(id),
  inspections jsonb
);

-- collision test as occured in https://github.com/PostgREST/postgrest/issues/4052
create table test.collision_test_table (id integer);
comment on table collision_test_table is 'foobarbaz';

create function test.collision_test_func(id integer)
returns int language sql as $$
  select 1;
$$;

update pg_proc
set oid = 'test.collision_test_table'::regclass::oid
where oid = 'test.collision_test_func'::regproc::oid;

comment on function test.collision_test_func(id integer) is 'fizzbuzz';


create or replace function test.delete_items_returns_setof() returns setof items as $$
  delete from items where id <= 15 returning *; -- deletes 15 items, then return them
$$ language sql;

create or replace function test.delete_items_returns_table() returns table(id bigint) as $$
  delete from items where id <= 15 returning *;
$$ language sql;

create or replace function test.delete_items_returns_void() returns void as $$
  delete from items;
$$ language sql;

create function do_nothing() returns void as $_$
$_$ language sql;

create or replace function test.get_tiobe_pls() returns setof test.tiobe_pls as $$
  select * from test.tiobe_pls;
$$ language sql;

create type visit_type as enum ('vacation', 'work');

create table places (
  id int primary key generated always as identity,
  name text not null
);

create table visits (
  id int primary key generated always as identity,
  place_id int not null references places(id),
  start_time timestamp,
  end_time timestamp,
  visit_type visit_type
);


create or replace function custom_vary_hdr() returns void as $$
  begin
    perform set_config('response.headers', '[{"Vary": "X-Test-Accept"}]', false);
  end
$$ language plpgsql;

create or replace function "true"() returns boolean as $_$
  select true;
$_$ language sql;

create function uses_prepared_statements() returns bool as $$
  select count(*) > 0 from pg_catalog.pg_prepared_statements;
$$ language sql;

create table never_prepared (id int);

create function never_uses_prepared_statements() returns bool as $$
  select count(*) = 0 from pg_catalog.pg_prepared_statements
  where statement ilike '%never_prepared%';
$$ language sql;
