\ir ../../orioledb.sql

/*
This is a 2018 version of the apflora schema https://github.com/barbalex/apf2/tree/master/sql/apflora - latest version likely has differing contents

We use it to test our metadata generation because it contains a good amount of db objects.

Custom roles and privileges were removed.

postgrest-with-pg-14 -f test/io/big_schema.sql psql

Has 12 functions:

select count(*)  from information_schema.routines where specific_schema = 'apflora';
 count
-------
    12

Has 45 tables:

select count(*)  from information_schema.tables where table_schema = 'apflora' and table_type = 'BASE TABLE';
 count
-------
    45
(1 row)

Has 281 views:

select count(*)  from information_schema.views where table_schema = 'apflora';
 count
-------
   281
(1 row)

Has 45 pkcols where none of them is a composite primary key:

with pkcols as (
  select kcu.table_schema,
         kcu.table_name,
         tco.constraint_name,
         array_agg(kcu.column_name order by kcu.ordinal_position) as key_columns
  from information_schema.table_constraints tco
  join information_schema.key_column_usage kcu
       on kcu.constraint_name = tco.constraint_name
       and kcu.constraint_schema = tco.constraint_schema
       and kcu.constraint_name = tco.constraint_name
  where tco.constraint_type = 'PRIMARY KEY' and kcu.table_schema = 'apflora'
  group by kcu.table_schema, kcu.table_name, tco.constraint_name
)
select count(*) from pkcols
where array_length(key_columns, 1) > 1;
 count
-------
     0
(1 row)

Has 50 foreign key relationships:

with fk_rel as (
  select ns1.nspname as table_schema,
             tab.relname as table_name,
             ns2.nspname as foreign_table_schema,
             other.relname as foreign_table_name,
             conname     as constraint_name,
             column_info.cols as columns
  from pg_constraint,
  lateral (
    select array_agg(row(cols.attname, refs.attname) order by cols.attnum) as cols
    from ( select unnest(conkey) as col, unnest(confkey) as ref) k,
    lateral (select * from pg_attribute where attrelid = conrelid and attnum = col) as cols,
    lateral (select * from pg_attribute where attrelid = confrelid and attnum = ref) as refs) as column_info,
  lateral (select * from pg_namespace where pg_namespace.oid = connamespace) as ns1,
  lateral (select * from pg_class where pg_class.oid = conrelid) as tab,
  lateral (select * from pg_class where pg_class.oid = confrelid) as other,
  lateral (select * from pg_namespace where pg_namespace.oid = other.relnamespace) as ns2
  where contype = 'f' and conparentid = 0
)
select count(*) from fk_rel;

 count
-------
    50
(1 row)
*/

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

CREATE SCHEMA apflora;

CREATE SCHEMA auth;

CREATE SCHEMA request;


CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;



COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';



CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;



COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';



CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;



COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';



CREATE TYPE apflora.qk_pop_ohne_popber AS (
	proj_id uuid,
	ap_id uuid,
	hw text,
	url text[],
	text text[]
);




CREATE TYPE apflora.qk_pop_ohne_popmassnber AS (
	proj_id uuid,
	ap_id uuid,
	hw text,
	url text[],
	text text[]
);




CREATE TYPE apflora.qk_tpop_ohne_massnber AS (
	proj_id uuid,
	ap_id uuid,
	hw text,
	url text[],
	text text[]
);




CREATE TYPE apflora.qk_tpop_ohne_tpopber AS (
	proj_id uuid,
	ap_id uuid,
	hw text,
	url text[],
	text text[]
);




CREATE TYPE auth.jwt_token AS (
	token text
);




CREATE FUNCTION apflora.ap_insert_add_apart() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO
    apflora.apart (ap_id, art_id)
  VALUES (NEW.id, NEW.art_id);
  RETURN NEW;
END;
$$;




CREATE FUNCTION apflora.ap_insert_add_idealbiotop() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO
    apflora.idealbiotop (ap_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;




CREATE FUNCTION apflora.correct_vornach_beginnap_stati(apid uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
 BEGIN


   UPDATE apflora.tpop
   WHERE id IN (
     SELECT
       tpop.id
     FROM
       apflora.tpop
       INNER JOIN apflora.pop
       ON apflora.tpop.pop_id = apflora.pop.id
         INNER JOIN apflora.ap
         ON apflora.pop.ap_id = apflora.ap.id
     WHERE
       AND apflora.ap.start_jahr IS NULL
       AND apflora.ap.id = $1
   );

   UPDATE apflora.pop
   WHERE id IN (
     SELECT
       pop.id
     FROM
       apflora.pop
         INNER JOIN apflora.ap
         ON apflora.pop.ap_id = apflora.ap.id
     WHERE
       AND apflora.ap.start_jahr IS NULL
       AND apflora.ap.id = $1
   );

   UPDATE apflora.tpop
   WHERE id IN (
     SELECT
       tpop.id
     FROM
       apflora.tpop
       INNER JOIN apflora.pop
       ON apflora.tpop.pop_id = apflora.pop.id
         INNER JOIN apflora.ap
         ON apflora.pop.ap_id = apflora.ap.id
     WHERE
       AND apflora.ap.start_jahr <= apflora.tpop.bekannt_seit
       AND apflora.ap.id = $1
   );

   UPDATE apflora.pop
   WHERE id IN (
     SELECT
       pop.id
     FROM
       apflora.pop
         INNER JOIN apflora.ap
         ON apflora.pop.ap_id = apflora.ap.id
     WHERE
       AND apflora.ap.start_jahr <= apflora.pop.bekannt_seit
       AND apflora.ap.id = $1
   );

   UPDATE apflora.tpop
   WHERE id IN (
     SELECT
       tpop.id
     FROM
       apflora.tpop
       INNER JOIN apflora.pop
       ON apflora.tpop.pop_id = apflora.pop.id
         INNER JOIN apflora.ap
         ON apflora.pop.ap_id = apflora.ap.id
     WHERE
       AND apflora.ap.start_jahr > apflora.tpop.bekannt_seit
       AND apflora.ap.id = $1
   );

   UPDATE apflora.pop
   WHERE id IN (
     SELECT
       pop.id
     FROM
       apflora.pop
         INNER JOIN apflora.ap
         ON apflora.pop.ap_id = apflora.ap.id
     WHERE
       AND apflora.ap.start_jahr > apflora.pop.bekannt_seit
       AND apflora.ap.id = $1
   );

   UPDATE apflora.tpop
   WHERE id IN (
     SELECT
       tpop.id
     FROM
       apflora.tpop
       INNER JOIN apflora.pop
       ON apflora.tpop.pop_id = apflora.pop.id
         INNER JOIN apflora.ap
         ON apflora.pop.ap_id = apflora.ap.id
     WHERE
       AND apflora.ap.start_jahr IS NULL
       AND apflora.ap.id = $1
   );

   UPDATE apflora.pop
   WHERE id IN (
     SELECT
       pop.id
     FROM
       apflora.pop
         INNER JOIN apflora.ap
         ON apflora.pop.ap_id = apflora.ap.id
     WHERE
       AND apflora.ap.start_jahr IS NULL
       AND apflora.ap.id = $1
   );

   UPDATE apflora.tpop
   WHERE id IN (
     SELECT
       tpop.id
     FROM
       apflora.tpop
       INNER JOIN apflora.pop
       ON apflora.tpop.pop_id = apflora.pop.id
         INNER JOIN apflora.ap
         ON apflora.pop.ap_id = apflora.ap.id
     WHERE
       AND apflora.ap.start_jahr <= apflora.tpop.bekannt_seit
       AND apflora.ap.id = $1
   );

   UPDATE apflora.pop
   WHERE id IN (
     SELECT
       pop.id
     FROM
       apflora.pop
         INNER JOIN apflora.ap
         ON apflora.pop.ap_id = apflora.ap.id
     WHERE
       AND apflora.ap.start_jahr <= apflora.pop.bekannt_seit
       AND apflora.ap.id = $1
   );

   UPDATE apflora.tpop
   WHERE id IN (
     SELECT
       tpop.id
     FROM
       apflora.tpop
       INNER JOIN apflora.pop
       ON apflora.tpop.pop_id = apflora.pop.id
         INNER JOIN apflora.ap
         ON apflora.pop.ap_id = apflora.ap.id
     WHERE
       AND apflora.ap.start_jahr > apflora.tpop.bekannt_seit
       AND apflora.ap.id = $1
   );

   UPDATE apflora.pop
   WHERE id IN (
     SELECT
       pop.id
     FROM
       apflora.pop
         INNER JOIN apflora.ap
         ON apflora.pop.ap_id = apflora.ap.id
     WHERE
       AND apflora.ap.start_jahr > apflora.pop.bekannt_seit
       AND apflora.ap.id = $1
   );

 END;
 $_$;




CREATE FUNCTION apflora.login(username text, pass text) RETURNS auth.jwt_token
    LANGUAGE plpgsql
    AS $_$
declare
  _role name;
  result auth.jwt_token;
begin
  select auth.user_role($1, $2) into _role;
  if _role is null then
    raise invalid_password using message = 'invalid user or password';
  end if;

  select auth.sign(
      row_to_json(r), current_setting('app.jwt_secret')
    ) as token
    from (
      select _role as role,
      $1 as username,
      extract(epoch from now())::integer + 60*60*24*30 as exp
    ) r
    into result;
  return result;
end;
$_$;




CREATE FUNCTION apflora.pop_max_one_massnber_per_year() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    IF
      (
        NEW.jahr > 0
        AND NEW.jahr IN
          (
            SELECT
              jahr
            FROM
              apflora.popmassnber
            WHERE
              pop_id = NEW.pop_id
              AND id <> NEW.id
          )
      )
    THEN
      RAISE EXCEPTION 'Pro Population und Jahr darf maximal ein Massnahmenbericht erfasst werden';
    END IF;
    RETURN NEW;
  END;
$$;




CREATE FUNCTION apflora.pop_max_one_popber_per_year() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    IF
      (
        NEW.jahr > 0
        AND NEW.jahr IN
          (
            SELECT
              jahr
            FROM
              apflora.popber
            WHERE
              pop_id = NEW.pop_id
              AND id <> NEW.id
          )
      )
    THEN
      RAISE EXCEPTION 'Pro Population und Jahr darf maximal ein Populationsbericht erfasst werden';
    END IF;
    RETURN NEW;
  END;
$$;




CREATE FUNCTION apflora.qk_pop_ohne_popber(apid uuid, berichtjahr integer) RETURNS SETOF apflora.qk_pop_ohne_popber
    LANGUAGE sql STABLE
    AS $_$
  SELECT DISTINCT
    apflora.ap.proj_id,
    apflora.pop.ap_id,
    'Population mit angesiedelten Teilpopulationen (vor dem Berichtjahr), die (im Berichtjahr) kontrolliert wurden, aber ohne Populations-Bericht (im Berichtjahr):' AS hw,
    ARRAY['Projekte', '4635372c-431c-11e8-bb30-e77f6cdd35a6' , 'Aktionspläne', apflora.ap.id, 'Populationen', apflora.pop.id]::text[] AS "url",
    ARRAY[concat('Population (Nr.): ', apflora.pop.nr)]::text[] AS text
  FROM
    apflora.ap
    INNER JOIN
      apflora.pop
      ON apflora.pop.ap_id = apflora.ap.id
  WHERE
    apflora.pop.id IN (
      SELECT
        apflora.tpop.pop_id
      FROM
        apflora.tpop
      WHERE
        apflora.tpop.apber_relevant = 1
      GROUP BY
        apflora.tpop.pop_id
    )
    AND apflora.pop.id IN (
      SELECT DISTINCT
        apflora.tpop.pop_id
      FROM
        apflora.tpop
      WHERE
        apflora.tpop.id IN (
          SELECT DISTINCT
          apflora.tpopmassn.tpop_id
          FROM
            apflora.tpopmassn
          WHERE
            apflora.tpopmassn.typ in (1, 2, 3)
            AND apflora.tpopmassn.jahr < $2
        )
        AND apflora.tpop.id IN (
          SELECT DISTINCT
            apflora.tpopkontr.tpop_id
          FROM
            apflora.tpopkontr
          WHERE
            apflora.tpopkontr.typ NOT IN ('Zwischenziel', 'Ziel')
            AND apflora.tpopkontr.jahr = $2
        )
    )
    AND apflora.pop.id NOT IN (
      SELECT DISTINCT
        apflora.popber.pop_id
      FROM
        apflora.popber
      WHERE
        apflora.popber.jahr = $2
    )
    AND apflora.pop.ap_id = $1
  $_$;




CREATE FUNCTION apflora.qk_pop_ohne_popmassnber(apid uuid, berichtjahr integer) RETURNS SETOF apflora.qk_pop_ohne_popmassnber
    LANGUAGE sql STABLE
    AS $_$
  SELECT DISTINCT
    apflora.ap.proj_id,
    apflora.pop.ap_id,
    'Population mit angesiedelten Teilpopulationen (vor dem Berichtjahr), die (im Berichtjahr) kontrolliert wurden, aber ohne Massnahmen-Bericht (im Berichtjahr):' AS hw,
    ARRAY['Projekte', '4635372c-431c-11e8-bb30-e77f6cdd35a6' , 'Aktionspläne', apflora.ap.id, 'Populationen', apflora.pop.id]::text[] AS "url",
    ARRAY[concat('Population (Nr.): ', apflora.pop.nr)]::text[] AS text
  FROM
    apflora.ap
    INNER JOIN
      apflora.pop
      ON apflora.pop.ap_id = apflora.ap.id
  WHERE
    apflora.pop.id IN (
      SELECT
        apflora.tpop.pop_id
      FROM
        apflora.tpop
      WHERE
        apflora.tpop.apber_relevant = 1
      GROUP BY
        apflora.tpop.pop_id
    )
    AND apflora.pop.id IN (
      SELECT DISTINCT
        apflora.tpop.pop_id
      FROM
        apflora.tpop
      WHERE
        apflora.tpop.id IN (
          SELECT DISTINCT
            apflora.tpopmassn.tpop_id
          FROM
            apflora.tpopmassn
          WHERE
            apflora.tpopmassn.typ IN (1, 2, 3)
            AND apflora.tpopmassn.jahr < $2
        )
        AND apflora.tpop.id IN (
          SELECT DISTINCT
            apflora.tpopkontr.tpop_id
          FROM
            apflora.tpopkontr
          WHERE
            apflora.tpopkontr.typ NOT IN ('Zwischenziel', 'Ziel')
            AND apflora.tpopkontr.jahr = $2
        )
    )
    AND apflora.pop.id NOT IN (
      SELECT DISTINCT
        apflora.popmassnber.pop_id
      FROM
        apflora.popmassnber
      WHERE
        apflora.popmassnber.jahr = $2
    )
    AND apflora.pop.ap_id = $1
  $_$;




CREATE FUNCTION apflora.qk_tpop_ohne_massnber(apid uuid, berichtjahr integer) RETURNS SETOF apflora.qk_tpop_ohne_massnber
    LANGUAGE sql STABLE
    AS $_$
  SELECT DISTINCT
    '4635372c-431c-11e8-bb30-e77f6cdd35a6'::uuid AS proj_id,
    apflora.pop.ap_id,
    'Teilpopulation mit Ansiedlung (vor dem Berichtjahr) und Kontrolle (im Berichtjahr) aber ohne Massnahmen-Bericht (im Berichtjahr):' AS hw,
    ARRAY['Projekte', '4635372c-431c-11e8-bb30-e77f6cdd35a6' , 'Aktionspläne', apflora.pop.ap_id, 'Populationen', apflora.pop.id, 'Teil-Populationen', apflora.tpop.id]::text[] AS "url",
    ARRAY[concat('Population (Nr.): ', apflora.pop.nr), concat('Teil-Population (Nr.): ', apflora.tpop.nr)]::text[] AS text
  FROM
    apflora.pop
    INNER JOIN
      apflora.tpop
      ON apflora.pop.id = apflora.tpop.pop_id
  WHERE
    apflora.tpop.apber_relevant = 1
    AND apflora.tpop.id IN (
      SELECT DISTINCT
        apflora.tpopmassn.tpop_id
      FROM
        apflora.tpopmassn
      WHERE
        apflora.tpopmassn.typ IN (1, 2, 3)
        AND apflora.tpopmassn.jahr < $2
    )
    AND apflora.tpop.id IN (
      SELECT DISTINCT
        apflora.tpopkontr.tpop_id
      FROM
        apflora.tpopkontr
      WHERE
        apflora.tpopkontr.typ NOT IN ('Zwischenziel', 'Ziel')
        AND apflora.tpopkontr.jahr = $2
    )
    AND apflora.tpop.id NOT IN (
      SELECT DISTINCT
        apflora.tpopmassnber.tpop_id
      FROM
        apflora.tpopmassnber
      WHERE
        apflora.tpopmassnber.jahr = $2
    )
    AND apflora.pop.ap_id = $1
  $_$;




CREATE FUNCTION apflora.qk_tpop_ohne_tpopber(apid uuid, berichtjahr integer) RETURNS SETOF apflora.qk_tpop_ohne_tpopber
    LANGUAGE sql STABLE
    AS $_$
  SELECT DISTINCT
    apflora.ap.proj_id,
    apflora.pop.ap_id,
    'Teilpopulation mit Kontrolle (im Berichtjahr) aber ohne Teilpopulations-Bericht (im Berichtjahr):' AS hw,
    ARRAY['Projekte', '4635372c-431c-11e8-bb30-e77f6cdd35a6' , 'Aktionspläne', apflora.ap.id, 'Populationen', apflora.pop.id, 'Teil-Populationen', apflora.tpop.id]::text[] AS "url",
    ARRAY[concat('Population (Nr.): ', apflora.pop.nr), concat('Teil-Population (Nr.): ', apflora.tpop.nr)]::text[] AS text
  FROM
    apflora.ap
    INNER JOIN
      apflora.pop
      INNER JOIN
        apflora.tpop
        ON apflora.pop.id = apflora.tpop.pop_id
    ON apflora.pop.ap_id = apflora.ap.id
  WHERE
    apflora.tpop.apber_relevant = 1
    AND apflora.tpop.id IN (
      SELECT DISTINCT
        apflora.tpopkontr.tpop_id
      FROM
        apflora.tpopkontr
      WHERE
        apflora.tpopkontr.typ NOT IN ('Zwischenziel', 'Ziel')
        AND apflora.tpopkontr.jahr = $2
    )
    AND apflora.tpop.id NOT IN (
      SELECT DISTINCT
        apflora.tpopber.tpop_id
      FROM
        apflora.tpopber
      WHERE
        apflora.tpopber.jahr = $2
    )
    AND apflora.pop.ap_id = $1
  $_$;




CREATE FUNCTION apflora.tpop_max_one_massnber_per_year() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    IF
      (
        NEW.jahr > 0
        AND NEW.jahr IN
          (
            SELECT
              jahr
            FROM
              apflora.tpopmassnber
            WHERE
              tpop_id = NEW.tpop_id
              AND id <> NEW.id
          )
      )
    THEN
      RAISE EXCEPTION  'Pro Teilpopulation und Jahr darf maximal ein Massnahmenbericht erfasst werden';
    END IF;
    RETURN NEW;
  END;
$$;




CREATE FUNCTION apflora.tpop_max_one_tpopber_per_year() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    IF
      (
        NEW.jahr > 0
        AND NEW.jahr IN
        (
          SELECT
            jahr
          FROM
            apflora.tpopber
          WHERE
            tpop_id = NEW.tpop_id
            AND id <> NEW.id
        )
      )
    THEN
      RAISE EXCEPTION 'Pro Teilpopulation und Jahr darf maximal ein Teilpopulationsbericht erfasst werden';
    END IF;
    RETURN NEW;
  END;
$$;




CREATE FUNCTION auth.algorithm_sign(signables text, secret text, algorithm text) RETURNS text
    LANGUAGE sql
    AS $$
WITH
  alg AS (
    SELECT CASE
      WHEN algorithm = 'HS256' THEN 'sha256'
      WHEN algorithm = 'HS384' THEN 'sha384'
      WHEN algorithm = 'HS512' THEN 'sha512'
SELECT auth.url_encode(hmac(signables, secret, alg.id)) FROM alg;
$$;




CREATE FUNCTION auth.check_role_exists() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if not exists (select 1 from pg_roles as r where r.rolname = new.role) then
    raise foreign_key_violation using message =
      'unknown database role: ' || new.role;
    return null;
  end if;
  return new;
end
$$;




CREATE FUNCTION auth.encrypt_pass() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if tg_op = 'INSERT' or new.pass <> old.pass then
    new.pass = crypt(new.pass, gen_salt('bf'));
  end if;
  return new;
end
$$;




CREATE FUNCTION auth.sign(payload json, secret text, algorithm text DEFAULT 'HS256'::text) RETURNS text
    LANGUAGE sql
    AS $$
WITH
  header AS (
    SELECT auth.url_encode(convert_to('{"alg":"' || algorithm || '","typ":"JWT"}', 'utf8')) AS data
    ),
  payload AS (
    SELECT auth.url_encode(convert_to(payload::text, 'utf8')) AS data
    ),
  signables AS (
    SELECT header.data || '.' || payload.data AS data FROM header, payload
    )
SELECT
    signables.data || '.' ||
    auth.algorithm_sign(signables.data, secret, algorithm) FROM signables;
$$;




CREATE FUNCTION auth.url_decode(data text) RETURNS bytea
    LANGUAGE sql
    AS $$
WITH t AS (SELECT translate(data, '-_', '+/') AS trans),
    SELECT decode(
        t.trans ||
        CASE WHEN rem.remainder > 0
           THEN repeat('=', (4 - rem.remainder))
           ELSE '' END,
    'base64') FROM t, rem;
$$;




CREATE FUNCTION auth.url_encode(data bytea) RETURNS text
    LANGUAGE sql
    AS $$
    SELECT translate(encode(data, 'base64'), E'+/=\n', '-_');
$$;




CREATE FUNCTION auth.user_role(username text, pass text) RETURNS name
    LANGUAGE plpgsql
    AS $_$
begin
  return (
  select role from apflora.user
   where apflora.user.name = $1
     and apflora.user.pass = crypt($2, apflora.user.pass)
  );
end;
$_$;




CREATE FUNCTION auth.verify(token text, secret text, algorithm text DEFAULT 'HS256'::text) RETURNS TABLE(header json, payload json, valid boolean)
    LANGUAGE sql
    AS $$
  SELECT
    convert_from(auth.url_decode(r[1]), 'utf8')::json AS header,
    convert_from(auth.url_decode(r[2]), 'utf8')::json AS payload,
    r[3] = auth.algorithm_sign(r[1] || '.' || r[2], secret, algorithm) AS valid
  FROM regexp_split_to_array(token, '\.') r;
$$;



CREATE FUNCTION public.adresse_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.ap_bearbstand_werte_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.ap_erfbeurtkrit_werte_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.ap_erfkrit_werte_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.ap_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.ap_umsetzung_werte_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.apber_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.apberuebersicht_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.assozart_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.beob_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.beob_zuordnung_set_quelleid_on_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    IF
      length(NEW."NO_NOTE") > 10
    THEN
      NEW."QuelleId" = '1';
    ELSE
      NEW."QuelleId" = '2';
    END IF;
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.beobzuordnung_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.ber_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.current_user_name() RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  select nullif(current_setting('jwt.claims.username', true), '')::text;
$$;




CREATE FUNCTION public.dsql2(i_text text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
Declare
  v_val int;
BEGIN
  execute i_text into v_val;
  return v_val;
END;
$$;




COMMENT ON FUNCTION public.dsql2(i_text text) IS 'get number of rows per table';



CREATE FUNCTION public.erfkrit_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.idealbiotop_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.pop_entwicklung_werte_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW."MutWer" = current_setting('request.jwt.claim.username', true);
    NEW."MutWann" = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.pop_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.pop_status_werte_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.popber_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.popmassnber_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.projekt_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.tabelle_delete_notify() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  PERFORM pg_notify('tabelle_update', json_build_object('table', TG_TABLE_NAME, 'type', TG_OP, 'row', row_to_json(OLD))::text);
  RETURN OLD;
END;
$$;




CREATE FUNCTION public.tabelle_insert_notify() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  PERFORM pg_notify('tabelle_update', json_build_object('table', TG_TABLE_NAME, 'type', TG_OP, 'row', row_to_json(NEW))::text);
  RETURN NEW;
END;
$$;




CREATE FUNCTION public.tabelle_update_notify() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  PERFORM pg_notify('tabelle_update', json_build_object('table', TG_TABLE_NAME, 'type', TG_OP, 'row', row_to_json(NEW))::text);
  RETURN NEW;
END;
$$;




CREATE FUNCTION public.tpop_apberrelevant_werte_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.tpop_entwicklung_werte_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.tpop_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.tpopber_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.tpopkontr_idbiotuebereinst_werte_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.tpopkontr_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.tpopkontr_typ_werte_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.tpopkontrzaehl_einheit_werte_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.tpopkontrzaehl_methode_werte_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.tpopkontrzaehl_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.tpopmassn_erfbeurt_werte_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.tpopmassn_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.tpopmassn_typ_werte_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.tpopmassnber_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.ziel_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.ziel_typ_werte_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION public.zielber_on_update_set_mut() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
    NEW.changed_by = current_setting('request.jwt.claim.username', true);
    NEW.changed = NOW();
    RETURN NEW;
  END;
$$;




CREATE FUNCTION request.cookie(c text) RETURNS text
    LANGUAGE sql STABLE
    AS $$
    select request.env_var('request.cookie.' || c);
$$;




CREATE FUNCTION request.env_var(v text) RETURNS text
    LANGUAGE sql STABLE
    AS $$
    select current_setting(v, true);
$$;




CREATE FUNCTION request.header(h text) RETURNS text
    LANGUAGE sql STABLE
    AS $$
    select request.env_var('request.header.' || h);
$$;




CREATE FUNCTION request.jwt_claim(c text) RETURNS text
    LANGUAGE sql STABLE
    AS $$
    select request.env_var('request.jwt.claim.' || c);
$$;




CREATE FUNCTION request.user_name() RETURNS text
    LANGUAGE sql STABLE
    AS $$
    select case request.jwt_claim('username')
    when '' then ''
    else request.jwt_claim('username')::text
 end
$$;




CREATE FUNCTION request.user_role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
    select request.jwt_claim('role')::text;
$$;



SET default_tablespace = '';

SET default_with_oids = false;


CREATE TABLE apflora._variable (
    "KonstId" integer NOT NULL,
    apber_jahr smallint,
    "ApArtId" integer
);




COMMENT ON COLUMN apflora._variable.apber_jahr IS 'Von Access aus ein Berichtsjahr wählen, um die Erstellung des Jahresberichts zu beschleunigen';



COMMENT ON COLUMN apflora._variable."ApArtId" IS 'Von Access aus eine Art wählen, um views zu beschleunigen';



CREATE SEQUENCE apflora."_variable_KonstId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora."_variable_KonstId_seq" OWNED BY apflora._variable."KonstId";



CREATE TABLE apflora.adresse (
    id_old integer,
    name text,
    adresse text,
    telefon text,
    email text,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    evab_id_person uuid,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    freiw_erfko boolean DEFAULT false,
    evab_nachname character varying(50) DEFAULT NULL::character varying,
    evab_vorname character varying(50) DEFAULT NULL::character varying,
    evab_ort character varying(50) DEFAULT NULL::character varying
);




COMMENT ON COLUMN apflora.adresse.id_old IS 'Frühere id';



COMMENT ON COLUMN apflora.adresse.name IS 'Vor- und Nachname';



COMMENT ON COLUMN apflora.adresse.adresse IS 'Strasse, PLZ und Ort';



COMMENT ON COLUMN apflora.adresse.telefon IS 'Telefonnummer';



COMMENT ON COLUMN apflora.adresse.email IS 'Email';



COMMENT ON COLUMN apflora.adresse.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.adresse.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.adresse.evab_id_person IS 'Personen werden in EvAB separat und mit eigener ID erfasst. Daher muss die passende Person hier gewählt werden';



COMMENT ON COLUMN apflora.adresse.id IS 'Primärschlüssel';



COMMENT ON COLUMN apflora.adresse.freiw_erfko IS 'Ist die Person freiwillige(r) Kontrolleur(in)';



CREATE SEQUENCE apflora."adresse_AdrId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora."adresse_AdrId_seq" OWNED BY apflora.adresse.id_old;



CREATE TABLE apflora.ae_eigenschaften (
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    taxid integer,
    familie character varying(100) DEFAULT NULL::character varying,
    artname character varying(100) DEFAULT NULL::character varying,
    namedeutsch character varying(100) DEFAULT NULL::character varying,
    status character varying(47) DEFAULT NULL::character varying,
    artwert smallint,
    kefkontrolljahr smallint,
    fnsjahresartjahr smallint,
    kefart boolean DEFAULT false
);




COMMENT ON COLUMN apflora.ae_eigenschaften.id IS 'Primärschlüssel';



CREATE TABLE apflora.ae_lrdelarze (
    sort integer NOT NULL,
    label character varying(50) DEFAULT NULL::character varying,
    einheit character varying(255) DEFAULT NULL::character varying,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL
);




COMMENT ON COLUMN apflora.ae_lrdelarze.sort IS 'Primärschlüssel der Tabelle ArtenDb_LR';



COMMENT ON COLUMN apflora.ae_lrdelarze.id IS 'Primärschlüssel';



CREATE TABLE apflora.ap (
    id_old integer,
    bearbeitung integer,
    start_jahr smallint,
    umsetzung integer,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    art_id uuid,
    bearbeiter uuid,
    proj_id uuid
);




COMMENT ON COLUMN apflora.ap.id_old IS 'Frühere id. = SISF2-Nr';



COMMENT ON COLUMN apflora.ap.bearbeitung IS 'In welchem Bearbeitungsstand befindet sich der AP?';



COMMENT ON COLUMN apflora.ap.start_jahr IS 'Wann wurde mit der Umsetzung des Aktionsplans begonnen?';



COMMENT ON COLUMN apflora.ap.umsetzung IS 'In welchem Umsetzungsstand befindet sich der AP?';



COMMENT ON COLUMN apflora.ap.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.ap.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.ap.id IS 'Primärschlüssel';



COMMENT ON COLUMN apflora.ap.art_id IS 'Namensgebende Art. Unter ihrem Namen bzw. Nummer werden Kontrollen an InfoFlora geliefert';



COMMENT ON COLUMN apflora.ap.bearbeiter IS 'Zugehöriger Bearbeiter. Fremdschlüssel aus der Tabelle "adresse"';



COMMENT ON COLUMN apflora.ap.proj_id IS 'Zugehöriger Aktionsplan. Fremdschlüssel aus der Tabelle "projekt"';



CREATE SEQUENCE apflora."ap_ApArtId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora."ap_ApArtId_seq" OWNED BY apflora.ap.id_old;



CREATE TABLE apflora.ap_bearbstand_werte (
    code integer,
    text character varying(50) DEFAULT NULL::character varying,
    sort smallint,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true) NOT NULL,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL
);




COMMENT ON COLUMN apflora.ap_bearbstand_werte.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.ap_bearbstand_werte.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.ap_bearbstand_werte.id IS 'Primärschlüssel';



CREATE TABLE apflora.ap_erfbeurtkrit_werte (
    code integer,
    text character varying(50) DEFAULT NULL::character varying,
    sort smallint,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true) NOT NULL,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL
);




COMMENT ON COLUMN apflora.ap_erfbeurtkrit_werte.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.ap_erfbeurtkrit_werte.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.ap_erfbeurtkrit_werte.id IS 'Primärschlüssel';



CREATE TABLE apflora.ap_erfkrit_werte (
    code integer,
    text character varying(50) DEFAULT NULL::character varying,
    sort smallint,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true) NOT NULL,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL
);




COMMENT ON COLUMN apflora.ap_erfkrit_werte.text IS 'Wie werden die durchgefuehrten Massnahmen beurteilt?';



COMMENT ON COLUMN apflora.ap_erfkrit_werte.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.ap_erfkrit_werte.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.ap_erfkrit_werte.id IS 'Primärschlüssel';



CREATE TABLE apflora.ap_umsetzung_werte (
    code integer,
    text character varying(50) DEFAULT NULL::character varying,
    sort smallint,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true) NOT NULL,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL
);




COMMENT ON COLUMN apflora.ap_umsetzung_werte.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.ap_umsetzung_werte.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.ap_umsetzung_werte.id IS 'Primärschlüssel';



CREATE TABLE apflora.apart (
    id_old integer,
    changed date,
    changed_by character varying(20) DEFAULT NULL::character varying,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    ap_id uuid,
    art_id uuid
);




COMMENT ON COLUMN apflora.apart.id_old IS 'frühere id';



COMMENT ON COLUMN apflora.apart.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.apart.changed_by IS 'Wer hat den Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.apart.id IS 'Primärschlüssel';



COMMENT ON COLUMN apflora.apart.ap_id IS 'Zugehöriger Aktionsplan. Fremdschlüssel aus der Tabelle "ap"';



CREATE TABLE apflora.apber (
    id_old integer,
    jahr smallint,
    situation text,
    vergleich_vorjahr_gesamtziel text,
    beurteilung integer,
    veraenderung_zum_vorjahr character varying(2) DEFAULT NULL::character varying,
    apber_analyse text,
    konsequenzen_umsetzung text,
    konsequenzen_erfolgskontrolle text,
    biotope_neue text,
    biotope_optimieren text,
    massnahmen_optimieren text,
    wirkung_auf_art text,
    datum date,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    massnahmen_ap_bearb text,
    massnahmen_planung_vs_ausfuehrung text,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    ap_id uuid,
    bearbeiter uuid
);




COMMENT ON COLUMN apflora.apber.id_old IS 'frühere id';



COMMENT ON COLUMN apflora.apber.jahr IS 'Für welches Jahr gilt der Bericht?';



COMMENT ON COLUMN apflora.apber.situation IS 'Beschreibung der Situation im Berichtjahr. Seit 2017 nicht mehr verwendet: Früher wurden hier die Massnahmen aufgelistet';



COMMENT ON COLUMN apflora.apber.vergleich_vorjahr_gesamtziel IS 'Vergleich zu Vorjahr und Ausblick auf das Gesamtziel';



COMMENT ON COLUMN apflora.apber.beurteilung IS 'Beurteilung des Erfolgs des Aktionsplans bisher';



COMMENT ON COLUMN apflora.apber.veraenderung_zum_vorjahr IS 'Veränderung gegenüber dem Vorjahr: plus heisst aufgestiegen, minus heisst abgestiegen';



COMMENT ON COLUMN apflora.apber.apber_analyse IS 'Was sind die Ursachen fuer die beobachtete Entwicklung?';



COMMENT ON COLUMN apflora.apber.konsequenzen_umsetzung IS 'Konsequenzen für die Umsetzung';



COMMENT ON COLUMN apflora.apber.konsequenzen_erfolgskontrolle IS 'Konsequenzen für die Erfolgskontrolle';



COMMENT ON COLUMN apflora.apber.biotope_neue IS 'Bemerkungen zum Aussagebereich A: Grundmengen und getroffene Massnahmen';



COMMENT ON COLUMN apflora.apber.biotope_optimieren IS 'Bemerkungen zum Aussagebereich B: Bestandeskontrolle';



COMMENT ON COLUMN apflora.apber.massnahmen_optimieren IS 'Bemerkungen zum Aussagebereich C: Zwischenbilanz zur Wirkung von Massnahmen';



COMMENT ON COLUMN apflora.apber.wirkung_auf_art IS 'Bemerkungen zum Aussagebereich D: Einschätzung der Wirkung des AP insgesamt pro Art';



COMMENT ON COLUMN apflora.apber.datum IS 'Datum der Nachführung';



COMMENT ON COLUMN apflora.apber.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.apber.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.apber.massnahmen_ap_bearb IS 'Bemerkungen zum Aussagebereich C: Weitere Aktivitäten der Aktionsplan-Verantwortlichen';



COMMENT ON COLUMN apflora.apber.massnahmen_planung_vs_ausfuehrung IS 'Bemerkungen zum Aussagebereich C: Vergleich Ausführung/Planung';



COMMENT ON COLUMN apflora.apber.id IS 'Primärschlüssel';



COMMENT ON COLUMN apflora.apber.ap_id IS 'Zugehöriger Aktionsplan. Fremdschlüssel aus der Tabelle "ap"';



COMMENT ON COLUMN apflora.apber.bearbeiter IS 'Zugehöriger Bearbeiter. Fremdschlüssel aus der Tabelle "adresse"';



CREATE SEQUENCE apflora."apber_JBerId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora."apber_JBerId_seq" OWNED BY apflora.apber.id_old;



CREATE TABLE apflora.apberuebersicht (
    jahr smallint,
    bemerkungen text,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    id_old integer,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    proj_id uuid
);




COMMENT ON COLUMN apflora.apberuebersicht.jahr IS 'Berichtsjahr. Zusammen mit proj_id eindeutig';



COMMENT ON COLUMN apflora.apberuebersicht.bemerkungen IS 'Bemerkungen zur Artübersicht';



COMMENT ON COLUMN apflora.apberuebersicht.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.apberuebersicht.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.apberuebersicht.id_old IS 'frühere id';



COMMENT ON COLUMN apflora.apberuebersicht.id IS 'Primärschlüssel';



COMMENT ON COLUMN apflora.apberuebersicht.proj_id IS 'Zugehöriger Aktionsplan. Fremdschlüssel aus der Tabelle "projekt"';



CREATE SEQUENCE apflora.apberuebersicht_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora.apberuebersicht_id_seq OWNED BY apflora.apberuebersicht.id_old;



CREATE TABLE apflora.assozart (
    id_old integer,
    bemerkungen text,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    ae_id uuid,
    ap_id uuid
);




COMMENT ON COLUMN apflora.assozart.id_old IS 'frühere id';



COMMENT ON COLUMN apflora.assozart.bemerkungen IS 'Bemerkungen zur Assoziation';



COMMENT ON COLUMN apflora.assozart.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.assozart.changed_by IS 'Wer hat den Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.assozart.id IS 'Primärschlüssel';



COMMENT ON COLUMN apflora.assozart.ap_id IS 'Zugehöriger Aktionsplan. Fremdschlüssel aus der Tabelle "ap"';



CREATE SEQUENCE apflora."assozart_AaId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora."assozart_AaId_seq" OWNED BY apflora.assozart.id_old;



CREATE TABLE apflora.beob (
    id_old integer,
    id_field character varying(38) DEFAULT NULL::character varying,
    art_id_old integer,
    datum date,
    autor character varying(100) DEFAULT NULL::character varying,
    x integer,
    y integer,
    data jsonb,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    art_id uuid,
    tpop_id uuid,
    nicht_zuordnen boolean DEFAULT false,
    bemerkungen text,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    quelle_id uuid
);




COMMENT ON COLUMN apflora.beob.id_old IS 'Frühere id';



COMMENT ON COLUMN apflora.beob.art_id_old IS 'Frühere Art id (=SISF2-Nr)';



COMMENT ON COLUMN apflora.beob.id IS 'Primärschlüssel';



COMMENT ON COLUMN apflora.beob.tpop_id IS 'Dieser Teilpopulation wurde die Beobachtung zugeordnet. Fremdschlüssel aus der Tabelle "tpop"';



COMMENT ON COLUMN apflora.beob.nicht_zuordnen IS 'Wird ja gesetzt, wenn eine Beobachtung keiner Teilpopulation zugeordnet werden kann. Sollte im Bemerkungsfeld begründet werden. In der Regel ist die Artbestimmung zweifelhaft. Oder die Beobachtung ist nicht (genau genug) lokalisierbar';



COMMENT ON COLUMN apflora.beob.bemerkungen IS 'Bemerkungen zur Zuordnung';



COMMENT ON COLUMN apflora.beob.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.beob.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.beob.quelle_id IS 'Zugehörige Beobachtungs-Quelle. Fremdschlüssel aus der Tabelle "beob_quelle_werte"';



CREATE SEQUENCE apflora.beob_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora.beob_id_seq OWNED BY apflora.beob.id_old;



CREATE TABLE apflora.beob_quelle_werte (
    id_old integer,
    name character varying(255) DEFAULT NULL::character varying,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL
);




CREATE SEQUENCE apflora."beobart_BeobArtId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora."beobart_BeobArtId_seq" OWNED BY apflora.apart.id_old;



CREATE TABLE apflora.ber (
    id_old integer,
    autor character varying(150) DEFAULT NULL::character varying,
    jahr smallint,
    titel text,
    url text,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    ap_id uuid
);




COMMENT ON COLUMN apflora.ber.id_old IS 'Primärschlüssel der Tabelle "ber"';



COMMENT ON COLUMN apflora.ber.autor IS 'Autor des Berichts';



COMMENT ON COLUMN apflora.ber.jahr IS 'Jahr der Publikation';



COMMENT ON COLUMN apflora.ber.titel IS 'Titel des Berichts';



COMMENT ON COLUMN apflora.ber.url IS 'Link zum Bericht';



COMMENT ON COLUMN apflora.ber.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.ber.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.ber.id IS 'Primärschlüssel';



COMMENT ON COLUMN apflora.ber.ap_id IS 'Zugehöriger Aktionsplan. Fremdschlüssel aus der Tabelle "ap"';



CREATE SEQUENCE apflora."ber_BerId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora."ber_BerId_seq" OWNED BY apflora.ber.id_old;



CREATE TABLE apflora.erfkrit (
    id_old integer,
    erfolg integer,
    kriterien text,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    ap_id uuid
);




COMMENT ON COLUMN apflora.erfkrit.id_old IS 'frühere id';



COMMENT ON COLUMN apflora.erfkrit.erfolg IS 'Wie gut werden die Ziele erreicht? Auswahl aus der Tabelle "ap_erfkrit_werte"';



COMMENT ON COLUMN apflora.erfkrit.kriterien IS 'Beschreibung der Kriterien für den Erfolg';



COMMENT ON COLUMN apflora.erfkrit.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.erfkrit.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.erfkrit.id IS 'Primärschlüssel';



COMMENT ON COLUMN apflora.erfkrit.ap_id IS 'Zugehöriger Aktionsplan. Fremdschlüssel aus der Tabelle "ap"';



CREATE SEQUENCE apflora."erfkrit_ErfkritId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora."erfkrit_ErfkritId_seq" OWNED BY apflora.erfkrit.id_old;



CREATE TABLE apflora.evab_typologie (
    "TYPO" character varying(9) NOT NULL,
    "LEBENSRAUM" character varying(100),
    "Alliance" character varying(100)
);




CREATE TABLE apflora.gemeinde (
    name character varying(50) DEFAULT NULL::character varying,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL
);




CREATE TABLE apflora.idealbiotop (
    erstelldatum date,
    hoehenlage text,
    region text,
    exposition text,
    besonnung text,
    hangneigung text,
    boden_typ text,
    boden_kalkgehalt text,
    boden_durchlaessigkeit text,
    boden_humus text,
    boden_naehrstoffgehalt text,
    wasserhaushalt text,
    konkurrenz text,
    moosschicht text,
    krautschicht text,
    strauchschicht text,
    baumschicht text,
    bemerkungen text,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    ap_id uuid
);




COMMENT ON COLUMN apflora.idealbiotop.erstelldatum IS 'Erstelldatum';



COMMENT ON COLUMN apflora.idealbiotop.hoehenlage IS 'Höhenlage';



COMMENT ON COLUMN apflora.idealbiotop.region IS 'Region';



COMMENT ON COLUMN apflora.idealbiotop.exposition IS 'Exposition';



COMMENT ON COLUMN apflora.idealbiotop.besonnung IS 'Besonnung';



COMMENT ON COLUMN apflora.idealbiotop.hangneigung IS 'Hangneigung';



COMMENT ON COLUMN apflora.idealbiotop.boden_typ IS 'Bodentyp';



COMMENT ON COLUMN apflora.idealbiotop.boden_kalkgehalt IS 'Kalkgehalt im Boden';



COMMENT ON COLUMN apflora.idealbiotop.boden_durchlaessigkeit IS 'Bodendurchlässigkeit';



COMMENT ON COLUMN apflora.idealbiotop.boden_humus IS 'Bodenhumusgehalt';



COMMENT ON COLUMN apflora.idealbiotop.boden_naehrstoffgehalt IS 'Bodennährstoffgehalt';



COMMENT ON COLUMN apflora.idealbiotop.wasserhaushalt IS 'Wasserhaushalt';



COMMENT ON COLUMN apflora.idealbiotop.konkurrenz IS 'Konkurrenz';



COMMENT ON COLUMN apflora.idealbiotop.moosschicht IS 'Moosschicht';



COMMENT ON COLUMN apflora.idealbiotop.krautschicht IS 'Krautschicht';



COMMENT ON COLUMN apflora.idealbiotop.strauchschicht IS 'Strauchschicht';



COMMENT ON COLUMN apflora.idealbiotop.baumschicht IS 'Baumschicht';



COMMENT ON COLUMN apflora.idealbiotop.bemerkungen IS 'Bemerkungen';



COMMENT ON COLUMN apflora.idealbiotop.changed IS 'Wann wurde der Datensatz zuletzt verändert?';



COMMENT ON COLUMN apflora.idealbiotop.changed_by IS 'Wer hat den Datensatz zuletzt verändert?';



COMMENT ON COLUMN apflora.idealbiotop.id IS 'Primärschlüssel';



COMMENT ON COLUMN apflora.idealbiotop.ap_id IS 'Zugehöriger Aktionsplan. Fremdschlüssel aus der Tabelle "ap"';



CREATE TABLE apflora.message (
    id_old integer,
    message text NOT NULL,
    "time" timestamp without time zone DEFAULT now() NOT NULL,
    active boolean DEFAULT true NOT NULL,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL
);




COMMENT ON COLUMN apflora.message.message IS 'Nachricht an die Benutzer';



CREATE SEQUENCE apflora.message_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora.message_id_seq OWNED BY apflora.message.id_old;



CREATE TABLE apflora.pop (
    id_old integer,
    nr integer,
    name character varying(150) DEFAULT NULL::character varying,
    status integer,
    status_unklar_begruendung text,
    bekannt_seit smallint,
    x integer,
    y integer,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    ap_id uuid,
    status_unklar boolean DEFAULT false,
    CONSTRAINT zulaessige_x_koordinate CHECK (((x IS NULL) OR ((x > 2485071) AND (x < 2828516)))),
    CONSTRAINT zulaessige_y_koordinate CHECK (((y IS NULL) OR ((y > 1075346) AND (y < 1299942))))
);




COMMENT ON COLUMN apflora.pop.id_old IS 'frühere id';



COMMENT ON COLUMN apflora.pop.nr IS 'Nummer der Population';



COMMENT ON COLUMN apflora.pop.name IS 'Bezeichnung der Population';



COMMENT ON COLUMN apflora.pop.status IS 'Herkunft der Population: autochthon oder angesiedelt? Auswahl aus der Tabelle "pop_status_werte"';



COMMENT ON COLUMN apflora.pop.status_unklar_begruendung IS 'Begründung, wieso die Herkunft unklar ist';



COMMENT ON COLUMN apflora.pop.bekannt_seit IS 'Seit wann ist die Population bekannt?';



COMMENT ON COLUMN apflora.pop.x IS 'Wird in der Regel von einer Teilpopulation übernommen';



COMMENT ON COLUMN apflora.pop.y IS 'Wird in der Regel von einer Teilpopulation übernommen';



COMMENT ON COLUMN apflora.pop.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.pop.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.pop.id IS 'Primärschlüssel der Tabelle "pop"';



COMMENT ON COLUMN apflora.pop.ap_id IS 'Zugehöriger Aktionsplan. Fremdschlüssel aus der Tabelle "ap"';



COMMENT ON COLUMN apflora.pop.status_unklar IS 'true = die Herkunft der Population ist unklar';



CREATE SEQUENCE apflora."pop_PopId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora."pop_PopId_seq" OWNED BY apflora.pop.id_old;



CREATE TABLE apflora.pop_status_werte (
    code integer,
    text character varying(60) DEFAULT NULL::character varying,
    sort smallint,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL
);




COMMENT ON COLUMN apflora.pop_status_werte.text IS 'Beschreibung der Herkunft';



COMMENT ON COLUMN apflora.pop_status_werte.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.pop_status_werte.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.pop_status_werte.id IS 'Primärschlüssel';



CREATE TABLE apflora.popber (
    id_old integer,
    jahr smallint,
    entwicklung integer,
    bemerkungen text,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    pop_id uuid
);




COMMENT ON COLUMN apflora.popber.id_old IS 'frühere id';



COMMENT ON COLUMN apflora.popber.jahr IS 'Für welches Jahr gilt der Bericht?';



COMMENT ON COLUMN apflora.popber.entwicklung IS 'Beurteilung der Populationsentwicklung: Auswahl aus Tabelle "tpop_entwicklung_werte"';



COMMENT ON COLUMN apflora.popber.bemerkungen IS 'Bemerkungen zur Beurteilung';



COMMENT ON COLUMN apflora.popber.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.popber.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.popber.id IS 'Primärschlüssel';



COMMENT ON COLUMN apflora.popber.pop_id IS 'Zugehörige Population. Fremdschlüssel aus der Tabelle "pop"';



CREATE SEQUENCE apflora."popber_PopBerId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora."popber_PopBerId_seq" OWNED BY apflora.popber.id_old;



CREATE TABLE apflora.popmassnber (
    id_old integer,
    jahr smallint,
    beurteilung integer,
    bemerkungen text,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    pop_id uuid
);




COMMENT ON COLUMN apflora.popmassnber.id_old IS 'frühere id';



COMMENT ON COLUMN apflora.popmassnber.jahr IS 'Für welches Jahr gilt der Bericht?';



COMMENT ON COLUMN apflora.popmassnber.beurteilung IS 'Wie wird die Wirkung aller im Rahmen des AP durchgeführten Massnahmen beurteilt?';



COMMENT ON COLUMN apflora.popmassnber.bemerkungen IS 'Bemerkungen zur Beurteilung';



COMMENT ON COLUMN apflora.popmassnber.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.popmassnber.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.popmassnber.id IS 'Primärschlüssel';



COMMENT ON COLUMN apflora.popmassnber.pop_id IS 'Zugehörige Population. Fremdschlüssel aus der Tabelle "pop"';



CREATE SEQUENCE apflora."popmassnber_PopMassnBerId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora."popmassnber_PopMassnBerId_seq" OWNED BY apflora.popmassnber.id_old;



CREATE TABLE apflora.projekt (
    id_old integer,
    name character varying(150) DEFAULT NULL::character varying,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL
);




COMMENT ON COLUMN apflora.projekt.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.projekt.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



CREATE SEQUENCE apflora."projekt_ProjId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora."projekt_ProjId_seq" OWNED BY apflora.projekt.id_old;



CREATE TABLE apflora.tpop (
    id_old integer,
    nr integer,
    gemeinde text,
    flurname text,
    x integer,
    y integer,
    radius smallint,
    hoehe smallint,
    exposition character varying(50) DEFAULT NULL::character varying,
    klima character varying(50) DEFAULT NULL::character varying,
    neigung character varying(50) DEFAULT NULL::character varying,
    beschreibung text,
    kataster_nr text,
    status integer,
    status_unklar_grund text,
    apber_relevant integer,
    bekannt_seit smallint,
    eigentuemer text,
    kontakt text,
    nutzungszone text,
    bewirtschafter text,
    bewirtschaftung text,
    bemerkungen text,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    pop_id uuid,
    status_unklar boolean DEFAULT false,
    CONSTRAINT zulaessige_x_koordinate CHECK (((x IS NULL) OR ((x > 2485071) AND (x < 2828516)))),
    CONSTRAINT zulaessige_y_koordinate CHECK (((y IS NULL) OR ((y > 1075346) AND (y < 1299942))))
);




COMMENT ON COLUMN apflora.tpop.id_old IS 'frühere id';



COMMENT ON COLUMN apflora.tpop.nr IS 'Nummer der Teilpopulation';



COMMENT ON COLUMN apflora.tpop.gemeinde IS 'Gemeinde';



COMMENT ON COLUMN apflora.tpop.flurname IS 'Flurname';



COMMENT ON COLUMN apflora.tpop.x IS 'X-Koordinate';



COMMENT ON COLUMN apflora.tpop.y IS 'Y-Koordinate';



COMMENT ON COLUMN apflora.tpop.radius IS 'Radius der Teilpopulation (m)';



COMMENT ON COLUMN apflora.tpop.hoehe IS 'Höhe über Meer (m)';



COMMENT ON COLUMN apflora.tpop.exposition IS 'Exposition / Besonnung des Standorts';



COMMENT ON COLUMN apflora.tpop.klima IS 'Klima des Standorts';



COMMENT ON COLUMN apflora.tpop.neigung IS 'Hangneigung des Standorts';



COMMENT ON COLUMN apflora.tpop.beschreibung IS 'Beschreibung der Fläche';



COMMENT ON COLUMN apflora.tpop.kataster_nr IS 'Kataster-Nummer';



COMMENT ON COLUMN apflora.tpop.status IS 'Herkunft der Teilpopulation. Auswahl aus Tabelle "pop_status_werte"';



COMMENT ON COLUMN apflora.tpop.status_unklar_grund IS 'Wieso ist der Status unklar?';



COMMENT ON COLUMN apflora.tpop.apber_relevant IS 'Ist die Teilpopulation für den AP-Bericht relevant? Auswahl aus der Tabelle "tpop_apberrelevant_werte"';



COMMENT ON COLUMN apflora.tpop.bekannt_seit IS 'Seit wann ist die Teilpopulation bekannt?';



COMMENT ON COLUMN apflora.tpop.eigentuemer IS 'EigentümerIn';



COMMENT ON COLUMN apflora.tpop.kontakt IS 'Kontaktperson vor Ort';



COMMENT ON COLUMN apflora.tpop.nutzungszone IS 'Nutzungszone';



COMMENT ON COLUMN apflora.tpop.bewirtschafter IS 'Wer bewirtschaftet die Fläche?';



COMMENT ON COLUMN apflora.tpop.bewirtschaftung IS 'Wie wird die Fläche bewirtschaftet?';



COMMENT ON COLUMN apflora.tpop.bemerkungen IS 'Bemerkungen zur Teilpopulation';



COMMENT ON COLUMN apflora.tpop.changed IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpop.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpop.id IS 'Primärschlüssel';



COMMENT ON COLUMN apflora.tpop.pop_id IS 'Zugehörige Population. Fremdschlüssel aus der Tabelle "pop"';



COMMENT ON COLUMN apflora.tpop.status_unklar IS 'Ist der Status der Teilpopulation unklar? (es bestehen keine glaubwuerdigen Beboachtungen)';



CREATE SEQUENCE apflora."tpop_TPopId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora."tpop_TPopId_seq" OWNED BY apflora.tpop.id_old;



CREATE TABLE apflora.tpop_apberrelevant_werte (
    code integer,
    text text,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true) NOT NULL,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL
);




COMMENT ON COLUMN apflora.tpop_apberrelevant_werte.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpop_apberrelevant_werte.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpop_apberrelevant_werte.id IS 'Primärschlüssel';



CREATE TABLE apflora.tpop_entwicklung_werte (
    code integer,
    text character varying(50) DEFAULT NULL::character varying,
    sort smallint,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true) NOT NULL,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL
);




COMMENT ON COLUMN apflora.tpop_entwicklung_werte.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpop_entwicklung_werte.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpop_entwicklung_werte.id IS 'Primärschlüssel';



CREATE TABLE apflora.tpopber (
    id_old integer,
    jahr smallint,
    entwicklung integer,
    bemerkungen text,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    tpop_id uuid
);




COMMENT ON COLUMN apflora.tpopber.id_old IS 'frühere id';



COMMENT ON COLUMN apflora.tpopber.jahr IS 'Für welches Jahr gilt der Bericht?';



COMMENT ON COLUMN apflora.tpopber.entwicklung IS 'Beurteilung der Populationsentwicklung: Auswahl aus Tabelle "tpop_entwicklung_werte"';



COMMENT ON COLUMN apflora.tpopber.bemerkungen IS 'Bemerkungen zur Beurteilung';



COMMENT ON COLUMN apflora.tpopber.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopber.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopber.tpop_id IS 'Zugehörige Teilpopulation. Fremdschlüssel der Tabelle "tpop"';



CREATE SEQUENCE apflora."tpopber_TPopBerId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora."tpopber_TPopBerId_seq" OWNED BY apflora.tpopber.id_old;



CREATE TABLE apflora.tpopkontr (
    id_old integer,
    typ character varying(50) DEFAULT NULL::character varying,
    datum date,
    jahr smallint,
    jungpflanzen_anzahl integer,
    vitalitaet text,
    ueberlebensrate smallint,
    entwicklung integer,
    ursachen text,
    erfolgsbeurteilung text,
    umsetzung_aendern text,
    kontrolle_aendern text,
    bemerkungen text,
    lr_delarze text,
    flaeche integer,
    lr_umgebung_delarze text,
    vegetationstyp character varying(100) DEFAULT NULL::character varying,
    konkurrenz character varying(100) DEFAULT NULL::character varying,
    moosschicht character varying(100) DEFAULT NULL::character varying,
    krautschicht character varying(100) DEFAULT NULL::character varying,
    strauchschicht text,
    baumschicht character varying(100) DEFAULT NULL::character varying,
    boden_typ text,
    boden_kalkgehalt character varying(100) DEFAULT NULL::character varying,
    boden_durchlaessigkeit character varying(100) DEFAULT NULL::character varying,
    boden_humus character varying(100) DEFAULT NULL::character varying,
    boden_naehrstoffgehalt character varying(100) DEFAULT NULL::character varying,
    boden_abtrag text,
    wasserhaushalt text,
    idealbiotop_uebereinstimmung integer,
    handlungsbedarf text,
    flaeche_ueberprueft integer,
    deckung_vegetation smallint,
    deckung_nackter_boden smallint,
    deckung_ap_art smallint,
    vegetationshoehe_maximum smallint,
    vegetationshoehe_mittel smallint,
    gefaehrdung text,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    zeit_id uuid DEFAULT public.uuid_generate_v1mc(),
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    tpop_id uuid,
    bearbeiter uuid,
    plan_vorhanden boolean DEFAULT false,
    jungpflanzen_vorhanden boolean
);




COMMENT ON COLUMN apflora.tpopkontr.id_old IS 'frühere id';



COMMENT ON COLUMN apflora.tpopkontr.typ IS 'Typ der Kontrolle. Auswahl aus Tabelle "tpopkontr_typ_werte"';



COMMENT ON COLUMN apflora.tpopkontr.datum IS 'Wann wurde kontrolliert?';



COMMENT ON COLUMN apflora.tpopkontr.jahr IS 'In welchem Jahr wurde kontrolliert? Für welches Jahr gilt die Beschreibung?';



COMMENT ON COLUMN apflora.tpopkontr.jungpflanzen_anzahl IS 'Anzahl Jungpflanzen';



COMMENT ON COLUMN apflora.tpopkontr.vitalitaet IS 'Vitalität der Pflanzen';



COMMENT ON COLUMN apflora.tpopkontr.ueberlebensrate IS 'Überlebensrate in Prozent';



COMMENT ON COLUMN apflora.tpopkontr.entwicklung IS 'Entwicklung des Bestandes. Auswahl aus Tabelle "tpop_entwicklung_werte"';



COMMENT ON COLUMN apflora.tpopkontr.ursachen IS 'Ursachen der Entwicklung';



COMMENT ON COLUMN apflora.tpopkontr.erfolgsbeurteilung IS 'Erfolgsbeurteilung';



COMMENT ON COLUMN apflora.tpopkontr.umsetzung_aendern IS 'Vorschlag für Änderung der Umsetzung';



COMMENT ON COLUMN apflora.tpopkontr.kontrolle_aendern IS 'Vorschlag für Änderung der Erfolgskontrolle';



COMMENT ON COLUMN apflora.tpopkontr.bemerkungen IS 'Bemerkungen zur Erfolgskontrolle';



COMMENT ON COLUMN apflora.tpopkontr.lr_delarze IS 'Lebensraumtyp nach Delarze';



COMMENT ON COLUMN apflora.tpopkontr.flaeche IS 'Fläche der Teilpopulation';



COMMENT ON COLUMN apflora.tpopkontr.lr_umgebung_delarze IS 'Lebensraumtyp der direkt angrenzenden Umgebung (nach Delarze)';



COMMENT ON COLUMN apflora.tpopkontr.vegetationstyp IS 'Vegetationstyp';



COMMENT ON COLUMN apflora.tpopkontr.konkurrenz IS 'Konkurrenz';



COMMENT ON COLUMN apflora.tpopkontr.moosschicht IS 'Moosschicht';



COMMENT ON COLUMN apflora.tpopkontr.krautschicht IS 'Krautschicht';



COMMENT ON COLUMN apflora.tpopkontr.strauchschicht IS 'Strauchschicht, ehemals Verbuschung (%)';



COMMENT ON COLUMN apflora.tpopkontr.baumschicht IS 'Baumschicht';



COMMENT ON COLUMN apflora.tpopkontr.boden_typ IS 'Bodentyp';



COMMENT ON COLUMN apflora.tpopkontr.boden_kalkgehalt IS 'Kalkgehalt des Bodens';



COMMENT ON COLUMN apflora.tpopkontr.boden_durchlaessigkeit IS 'Durchlässigkeit des Bodens';



COMMENT ON COLUMN apflora.tpopkontr.boden_humus IS 'Humusgehalt des Bodens';



COMMENT ON COLUMN apflora.tpopkontr.boden_naehrstoffgehalt IS 'Nährstoffgehalt des Bodens';



COMMENT ON COLUMN apflora.tpopkontr.boden_abtrag IS 'Oberbodenabtrag';



COMMENT ON COLUMN apflora.tpopkontr.wasserhaushalt IS 'Wasserhaushalt';



COMMENT ON COLUMN apflora.tpopkontr.idealbiotop_uebereinstimmung IS 'Übereinstimmung mit dem Idealbiotop';



COMMENT ON COLUMN apflora.tpopkontr.handlungsbedarf IS 'Handlungsbedarf bezüglich Biotop';



COMMENT ON COLUMN apflora.tpopkontr.flaeche_ueberprueft IS 'Überprüfte Fläche in m2. Nur für Freiwilligen-Erfolgskontrolle';



COMMENT ON COLUMN apflora.tpopkontr.deckung_vegetation IS 'Von Pflanzen, Streu oder Moos bedeckter Boden (%). Nur für Freiwilligen-Erfolgskontrolle. Nur bis 2012 erfasst.';



COMMENT ON COLUMN apflora.tpopkontr.deckung_nackter_boden IS 'Flächenanteil nackter Boden (%). Nur für Freiwilligen-Erfolgskontrolle';



COMMENT ON COLUMN apflora.tpopkontr.deckung_ap_art IS 'Flächenanteil der überprüften Pflanzenart (%). Nur für Freiwilligen-Erfolgskontrolle';



COMMENT ON COLUMN apflora.tpopkontr.vegetationshoehe_maximum IS 'Maximale Vegetationshöhe in cm. Nur für Freiwilligen-Erfolgskontrolle';



COMMENT ON COLUMN apflora.tpopkontr.vegetationshoehe_mittel IS 'Mittlere Vegetationshöhe in cm. Nur für Freiwilligen-Erfolgskontrolle';



COMMENT ON COLUMN apflora.tpopkontr.gefaehrdung IS 'Gefährdung. Nur für Freiwilligen-Erfolgskontrolle';



COMMENT ON COLUMN apflora.tpopkontr.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopkontr.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopkontr.zeit_id IS 'GUID für den Export von Zeiten in EvAB';



COMMENT ON COLUMN apflora.tpopkontr.id IS 'Primärschlüssel. Wird u.a. verwendet für die Identifikation der Beobachtung im nationalen Beobachtungs-Daten-Kreislauf';



COMMENT ON COLUMN apflora.tpopkontr.tpop_id IS 'Zugehörige Teilpopulation. Fremdschlüssel der Tabelle "tpop"';



COMMENT ON COLUMN apflora.tpopkontr.bearbeiter IS 'Zugehöriger Bearbeiter. Fremdschlüssel aus der Tabelle "adresse"';



COMMENT ON COLUMN apflora.tpopkontr.plan_vorhanden IS 'Fläche / Wuchsort auf Plan eingezeichnet? Nur für Freiwilligen-Erfolgskontrolle';



COMMENT ON COLUMN apflora.tpopkontr.jungpflanzen_vorhanden IS 'Gibt es neben alten Pflanzen auch junge? Nur für Freiwilligen-Erfolgskontrolle';



CREATE SEQUENCE apflora."tpopkontr_TPopKontrId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora."tpopkontr_TPopKontrId_seq" OWNED BY apflora.tpopkontr.id_old;



CREATE TABLE apflora.tpopkontr_idbiotuebereinst_werte (
    code integer,
    text character varying(50) DEFAULT NULL::character varying,
    sort smallint,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true) NOT NULL,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL
);




COMMENT ON COLUMN apflora.tpopkontr_idbiotuebereinst_werte.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopkontr_idbiotuebereinst_werte.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopkontr_idbiotuebereinst_werte.id IS 'Primärschlüssel';



CREATE TABLE apflora.tpopkontr_typ_werte (
    code integer,
    text character varying(50) DEFAULT NULL::character varying,
    sort smallint,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true) NOT NULL,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL
);




COMMENT ON COLUMN apflora.tpopkontr_typ_werte.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopkontr_typ_werte.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopkontr_typ_werte.id IS 'Primärschlüssel';



CREATE TABLE apflora.tpopkontrzaehl (
    id_old integer,
    anzahl integer,
    einheit integer,
    methode integer,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    tpopkontr_id uuid
);




COMMENT ON COLUMN apflora.tpopkontrzaehl.id_old IS 'frühere id';



COMMENT ON COLUMN apflora.tpopkontrzaehl.anzahl IS 'Anzahl Zaehleinheiten';



COMMENT ON COLUMN apflora.tpopkontrzaehl.einheit IS 'Verwendete Zaehleinheit. Auswahl aus Tabelle "tpopkontrzaehl_einheit_werte"';



COMMENT ON COLUMN apflora.tpopkontrzaehl.methode IS 'Verwendete Methodik. Auswahl aus Tabelle "tpopkontrzaehl_methode_werte"';



COMMENT ON COLUMN apflora.tpopkontrzaehl.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopkontrzaehl.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



CREATE SEQUENCE apflora."tpopkontrzaehl_TPopKontrZaehlId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora."tpopkontrzaehl_TPopKontrZaehlId_seq" OWNED BY apflora.tpopkontrzaehl.id_old;



CREATE TABLE apflora.tpopkontrzaehl_einheit_werte (
    code integer,
    text character varying(50) DEFAULT NULL::character varying,
    sort smallint,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true) NOT NULL,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL
);




COMMENT ON COLUMN apflora.tpopkontrzaehl_einheit_werte.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopkontrzaehl_einheit_werte.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopkontrzaehl_einheit_werte.id IS 'Primärschlüssel';



CREATE TABLE apflora.tpopkontrzaehl_methode_werte (
    code integer,
    text character varying(50) DEFAULT NULL::character varying,
    sort smallint,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true) NOT NULL,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL
);




COMMENT ON COLUMN apflora.tpopkontrzaehl_methode_werte.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopkontrzaehl_methode_werte.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopkontrzaehl_methode_werte.id IS 'Primärschlüssel';



CREATE TABLE apflora.tpopmassn (
    id_old integer,
    typ integer,
    beschreibung text,
    jahr smallint,
    datum date,
    bemerkungen text,
    plan_bezeichnung text,
    flaeche integer,
    markierung text,
    anz_triebe integer,
    anz_pflanzen integer,
    anz_pflanzstellen integer,
    wirtspflanze text,
    herkunft_pop text,
    sammeldatum character varying(50) DEFAULT NULL::character varying,
    form text,
    pflanzanordnung text,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    tpop_id uuid,
    bearbeiter uuid,
    plan_vorhanden boolean DEFAULT false
);




COMMENT ON COLUMN apflora.tpopmassn.id_old IS 'frühere id';



COMMENT ON COLUMN apflora.tpopmassn.typ IS 'Typ der Massnahme. Auswahl aus Tabelle "tpopmassn_typ_werte"';



COMMENT ON COLUMN apflora.tpopmassn.beschreibung IS 'Was wurde gemacht? V.a. für Typ "Spezial"';



COMMENT ON COLUMN apflora.tpopmassn.jahr IS 'Jahr, in dem die Massnahme durchgeführt wurde';



COMMENT ON COLUMN apflora.tpopmassn.datum IS 'Datum, an dem die Massnahme durchgeführt wurde';



COMMENT ON COLUMN apflora.tpopmassn.bemerkungen IS 'Bemerkungen zur Massnahme';



COMMENT ON COLUMN apflora.tpopmassn.plan_bezeichnung IS 'Bezeichnung auf dem Plan';



COMMENT ON COLUMN apflora.tpopmassn.flaeche IS 'Fläche der Massnahme bzw. Teilpopulation (m2)';



COMMENT ON COLUMN apflora.tpopmassn.markierung IS 'Markierung der Massnahme bzw. Teilpopulation';



COMMENT ON COLUMN apflora.tpopmassn.anz_triebe IS 'Anzahl angesiedelte Triebe';



COMMENT ON COLUMN apflora.tpopmassn.anz_pflanzen IS 'Anzahl angesiedelte Pflanzen';



COMMENT ON COLUMN apflora.tpopmassn.anz_pflanzstellen IS 'Anzahl Töpfe/Pflanzstellen';



COMMENT ON COLUMN apflora.tpopmassn.wirtspflanze IS 'Wirtspflanze';



COMMENT ON COLUMN apflora.tpopmassn.herkunft_pop IS 'Aus welcher Population stammt das Pflanzenmaterial?';



COMMENT ON COLUMN apflora.tpopmassn.sammeldatum IS 'Datum, an dem die angesiedelten Pflanzen gesammelt wurden';



COMMENT ON COLUMN apflora.tpopmassn.form IS 'Form, Grösse der Ansiedlung';



COMMENT ON COLUMN apflora.tpopmassn.pflanzanordnung IS 'Anordnung der Pflanzung';



COMMENT ON COLUMN apflora.tpopmassn.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopmassn.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopmassn.tpop_id IS 'Zugehörige Teilpopulation. Fremdschlüssel der Tabelle "tpop"';



COMMENT ON COLUMN apflora.tpopmassn.bearbeiter IS 'Zugehöriger Bearbeiter. Fremdschlüssel aus der Tabelle "adresse"';



COMMENT ON COLUMN apflora.tpopmassn.plan_vorhanden IS 'Existiert ein Plan?';



CREATE SEQUENCE apflora."tpopmassn_TPopMassnId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora."tpopmassn_TPopMassnId_seq" OWNED BY apflora.tpopmassn.id_old;



CREATE TABLE apflora.tpopmassn_erfbeurt_werte (
    code integer,
    text character varying(50) DEFAULT NULL::character varying,
    sort smallint,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true) NOT NULL,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL
);




COMMENT ON COLUMN apflora.tpopmassn_erfbeurt_werte.text IS 'Wie werden die durchgefuehrten Massnahmen beurteilt?';



COMMENT ON COLUMN apflora.tpopmassn_erfbeurt_werte.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopmassn_erfbeurt_werte.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopmassn_erfbeurt_werte.id IS 'Primärschlüssel';



CREATE TABLE apflora.tpopmassn_typ_werte (
    code integer,
    text character varying(50) DEFAULT NULL::character varying,
    sort smallint,
    ansiedlung smallint NOT NULL,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true) NOT NULL,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL
);




COMMENT ON COLUMN apflora.tpopmassn_typ_werte.ansiedlung IS 'Handelt es sich um eine Ansiedlung?';



COMMENT ON COLUMN apflora.tpopmassn_typ_werte.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopmassn_typ_werte.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopmassn_typ_werte.id IS 'Primärschlüssel';



CREATE TABLE apflora.tpopmassnber (
    id_old integer,
    jahr smallint,
    beurteilung integer,
    bemerkungen text,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    tpop_id uuid
);




COMMENT ON COLUMN apflora.tpopmassnber.id_old IS 'frühere id';



COMMENT ON COLUMN apflora.tpopmassnber.jahr IS 'Jahr, für den der Bericht gilt';



COMMENT ON COLUMN apflora.tpopmassnber.beurteilung IS 'Beurteilung des Erfolgs. Auswahl aus Tabelle "tpopmassn_erfbeurt_werte"';



COMMENT ON COLUMN apflora.tpopmassnber.bemerkungen IS 'Bemerkungen zur Beurteilung';



COMMENT ON COLUMN apflora.tpopmassnber.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopmassnber.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.tpopmassnber.tpop_id IS 'Zugehörige Teilpopulation. Fremdschlüssel der Tabelle "tpop"';



CREATE SEQUENCE apflora."tpopmassnber_TPopMassnBerId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora."tpopmassnber_TPopMassnBerId_seq" OWNED BY apflora.tpopmassnber.id_old;



CREATE TABLE apflora."user" (
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    name text,
    email text,
    role name,
    pass text,
    CONSTRAINT proper_email CHECK ((email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'::text)),
    CONSTRAINT user_pass_check CHECK ((length(pass) > 5)),
    CONSTRAINT user_role_check CHECK ((length((role)::text) < 512))
);




CREATE TABLE apflora.usermessage (
    user_name character varying(30) NOT NULL,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    message_id uuid
);




COMMENT ON COLUMN apflora.usermessage.message_id IS 'Zugehörige Nachricht. Fremdschlüssel aus der Tabelle "message"';



CREATE TABLE apflora.ziel (
    id_old integer,
    typ integer,
    jahr smallint DEFAULT 1 NOT NULL,
    bezeichnung text,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    ap_id uuid
);




COMMENT ON COLUMN apflora.ziel.id_old IS 'frühere id';



COMMENT ON COLUMN apflora.ziel.typ IS 'Typ des Ziels. Z.B. Zwischenziel, Gesamtziel. Auswahl aus Tabelle "ziel_typ_werte"';



COMMENT ON COLUMN apflora.ziel.jahr IS 'In welchem Jahr soll das Ziel erreicht werden?';



COMMENT ON COLUMN apflora.ziel.bezeichnung IS 'Textliche Beschreibung des Ziels';



COMMENT ON COLUMN apflora.ziel.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.ziel.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.ziel.id IS 'Primärschlüssel';



COMMENT ON COLUMN apflora.ziel.ap_id IS 'Zugehöriger Aktionsplan. Fremdschlüssel aus der Tabelle "ap"';



CREATE TABLE apflora.ziel_typ_werte (
    code integer,
    text character varying(50) DEFAULT NULL::character varying,
    sort smallint,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true) NOT NULL,
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL
);




COMMENT ON COLUMN apflora.ziel_typ_werte.text IS 'Beschreibung des Ziels';



COMMENT ON COLUMN apflora.ziel_typ_werte.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.ziel_typ_werte.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.ziel_typ_werte.id IS 'Primärschlüssel';



CREATE VIEW apflora.v_abper_ziel AS
 SELECT ziel.id_old,
    ziel.typ,
    ziel.jahr,
    ziel.bezeichnung,
    ziel.changed,
    ziel.changed_by,
    ziel.id,
    ziel.ap_id,
    ziel_typ_werte.text AS typ_decodiert
   FROM (apflora._variable
     JOIN (apflora.ziel
     JOIN apflora.ziel_typ_werte ON ((ziel.typ = ziel_typ_werte.code))) ON ((_variable.apber_jahr = ziel.jahr)))
  WHERE (ziel.typ = ANY (ARRAY[1, 2, 1170775556]))
  ORDER BY ziel_typ_werte.sort, ziel.bezeichnung;




CREATE VIEW apflora.v_ap AS
 SELECT ap.id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS bearbeitung,
    ap.start_jahr,
    ap_umsetzung_werte.text AS umsetzung,
    adresse.name AS bearbeiter,
    ap.changed,
    ap.changed_by
   FROM ((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.adresse ON ((ap.bearbeiter = adresse.id)))
  ORDER BY ae_eigenschaften.artname;




CREATE VIEW apflora.v_ap_anzkontr AS
 SELECT ap.id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS bearbeitung,
    ap.start_jahr,
    ap_umsetzung_werte.text AS umsetzung,
    count(tpopkontr.id) AS anzahl_kontrollen
   FROM ((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     LEFT JOIN ((apflora.pop
     LEFT JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     LEFT JOIN apflora.tpopkontr ON ((tpop.id = tpopkontr.tpop_id))) ON ((ap.id = pop.ap_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
  GROUP BY ap.id, ae_eigenschaften.artname, ap_bearbstand_werte.text, ap.start_jahr, ap_umsetzung_werte.text
  ORDER BY ae_eigenschaften.artname;




CREATE VIEW apflora.v_ap_anzkontrinjahr AS
 SELECT ap.id,
    ae_eigenschaften.artname,
    tpopkontr.id AS tpopkontr_id,
    tpopkontr.jahr AS tpopkontr_jahr
   FROM ((apflora.ap
     JOIN apflora.ae_eigenschaften ON ((ap.art_id = ae_eigenschaften.id)))
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN apflora.tpopkontr ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3))
  GROUP BY ap.id, ae_eigenschaften.artname, tpopkontr.id, tpopkontr.jahr;




CREATE VIEW apflora.v_ap_anzmassn AS
 SELECT ap.id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS bearbeitung,
    ap.start_jahr,
    ap_umsetzung_werte.text AS umsetzung,
    count(tpopmassn.id) AS anzahl_massnahmen
   FROM ((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     LEFT JOIN ((apflora.pop
     LEFT JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     LEFT JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id))) ON ((ap.id = pop.ap_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
  GROUP BY ap.id, ae_eigenschaften.artname, ap_bearbstand_werte.text, ap.start_jahr, ap_umsetzung_werte.text
  ORDER BY ae_eigenschaften.artname;




CREATE VIEW apflora.v_ap_anzmassnprojahr0 AS
 SELECT ap.id,
    tpopmassn.jahr,
    count(tpopmassn.id) AS "AnzahlvonTPopMassnId"
   FROM (apflora.ap
     JOIN ((apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3) AND (tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY ap.id, tpopmassn.jahr
 HAVING (tpopmassn.jahr IS NOT NULL)
  ORDER BY ap.id, tpopmassn.jahr;




CREATE VIEW apflora.v_massn_jahre AS
 SELECT tpopmassn.jahr
   FROM apflora.tpopmassn
  GROUP BY tpopmassn.jahr
 HAVING ((tpopmassn.jahr >= 1900) AND (tpopmassn.jahr <= 2100))
  ORDER BY tpopmassn.jahr;




CREATE VIEW apflora.v_ap_massnjahre AS
 SELECT ap.id,
    v_massn_jahre.jahr
   FROM apflora.ap,
    apflora.v_massn_jahre
  WHERE (ap.bearbeitung < 4)
  ORDER BY ap.id, v_massn_jahre.jahr;




CREATE VIEW apflora.v_ap_anzmassnprojahr AS
 SELECT v_ap_massnjahre.id,
    v_ap_massnjahre.jahr,
    COALESCE(v_ap_anzmassnprojahr0."AnzahlvonTPopMassnId", (0)::bigint) AS anzahl_massnahmen
   FROM (apflora.v_ap_massnjahre
     LEFT JOIN apflora.v_ap_anzmassnprojahr0 ON (((v_ap_massnjahre.jahr = v_ap_anzmassnprojahr0.jahr) AND (v_ap_massnjahre.id = v_ap_anzmassnprojahr0.id))))
  ORDER BY v_ap_massnjahre.id, v_ap_massnjahre.jahr;




CREATE VIEW apflora.v_ap_anzmassnbisjahr AS
 SELECT v_ap_massnjahre.id,
    v_ap_massnjahre.jahr,
    sum(v_ap_anzmassnprojahr.anzahl_massnahmen) AS anzahl_massnahmen
   FROM (apflora.v_ap_massnjahre
     JOIN apflora.v_ap_anzmassnprojahr ON ((v_ap_massnjahre.id = v_ap_anzmassnprojahr.id)))
  WHERE (v_ap_anzmassnprojahr.jahr <= v_ap_massnjahre.jahr)
  GROUP BY v_ap_massnjahre.id, v_ap_massnjahre.jahr
  ORDER BY v_ap_massnjahre.id, v_ap_massnjahre.jahr;




CREATE VIEW apflora.v_ap_apberrelevant AS
 SELECT ap.id
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY ap.id;




CREATE VIEW apflora.v_ap_apberundmassn AS
 SELECT ap.id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS bearbeitung,
    ap.start_jahr,
    ap_umsetzung_werte.text AS umsetzung,
    adresse.name AS bearbeiter,
    ae_eigenschaften.artwert,
    v_ap_anzmassnprojahr.jahr AS massn_jahr,
    v_ap_anzmassnprojahr.anzahl_massnahmen AS massn_anzahl,
    v_ap_anzmassnbisjahr.anzahl_massnahmen AS massn_anzahl_bisher,
        CASE
            WHEN (apber.jahr > 0) THEN 'ja'::text
            ELSE 'nein'::text
        END AS bericht_erstellt
   FROM (apflora.ae_eigenschaften
     JOIN ((((apflora.ap
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.adresse ON ((ap.bearbeiter = adresse.id)))
     JOIN (apflora.v_ap_anzmassnprojahr
     JOIN (apflora.v_ap_anzmassnbisjahr
     LEFT JOIN apflora.apber ON (((v_ap_anzmassnbisjahr.jahr = apber.jahr) AND (v_ap_anzmassnbisjahr.id = apber.ap_id)))) ON (((v_ap_anzmassnprojahr.jahr = v_ap_anzmassnbisjahr.jahr) AND (v_ap_anzmassnprojahr.id = v_ap_anzmassnbisjahr.id)))) ON ((ap.id = v_ap_anzmassnprojahr.id))) ON ((ae_eigenschaften.id = ap.art_id)))
  ORDER BY ae_eigenschaften.artname, v_ap_anzmassnprojahr.jahr;




CREATE VIEW apflora.v_ap_mitmassninjahr0 AS
 SELECT ae_eigenschaften.artname,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    tpop.nr AS tpop_nr,
    tpop.gemeinde AS tpop_gemeinde,
    tpop.flurname AS tpop_flurname,
    tpopmassn.jahr,
    tpopmassn_typ_werte.text AS typ,
    tpopmassn.beschreibung,
    tpopmassn.datum,
    adresse.name AS bearbeiter,
    tpopmassn.bemerkungen,
    tpopmassn.plan_vorhanden,
    tpopmassn.plan_bezeichnung,
    tpopmassn.flaeche,
    tpopmassn.markierung,
    tpopmassn.anz_triebe,
    tpopmassn.anz_pflanzen,
    tpopmassn.anz_pflanzstellen,
    tpopmassn.wirtspflanze,
    tpopmassn.herkunft_pop,
    tpopmassn.sammeldatum,
    tpopmassn.form,
    tpopmassn.pflanzanordnung
   FROM ((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN ((apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN ((apflora.tpopmassn
     JOIN apflora.tpopmassn_typ_werte ON ((tpopmassn.typ = tpopmassn_typ_werte.code)))
     LEFT JOIN apflora.adresse ON ((tpopmassn.bearbeiter = adresse.id))) ON ((tpop.id = tpopmassn.tpop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3))
  ORDER BY ae_eigenschaften.artname, pop.nr, pop.name, tpop.nr, tpop.gemeinde, tpop.flurname;




CREATE VIEW apflora.v_ap_ohnepop AS
 SELECT ap.id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS bearbeitung,
    ap.start_jahr,
    ap_umsetzung_werte.text AS umsetzung,
    adresse.name AS bearbeiter,
    pop.id AS pop_id
   FROM (((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.adresse ON ((ap.bearbeiter = adresse.id)))
     LEFT JOIN apflora.pop ON ((ap.id = pop.ap_id)))
  WHERE (pop.id IS NULL)
  ORDER BY ae_eigenschaften.artname;




CREATE VIEW apflora.v_ap_tpopmassnjahr0 AS
 SELECT ap.id,
    ae_eigenschaften.artname,
    tpopmassn.id AS tpopmassn_id,
    tpopmassn.jahr AS tpopmassn_jahr
   FROM ((apflora.ap
     JOIN apflora.ae_eigenschaften ON ((ap.art_id = ae_eigenschaften.id)))
     JOIN ((apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3))
  GROUP BY ap.id, ae_eigenschaften.artname, tpopmassn.id, tpopmassn.jahr;




CREATE VIEW apflora.v_apbeob AS
 SELECT beob.id_old,
    beob.id_field,
    beob.art_id_old,
    beob.datum,
    beob.autor,
    beob.x,
    beob.y,
    beob.data,
    beob.id,
    beob.art_id,
    beob.tpop_id,
    beob.nicht_zuordnen,
    beob.bemerkungen,
    beob.changed,
    beob.changed_by,
    beob.quelle_id,
    apart.ap_id,
    beob_quelle_werte.name AS quelle
   FROM ((apflora.beob
     JOIN apflora.apart ON ((apart.art_id = beob.art_id)))
     JOIN apflora.beob_quelle_werte ON ((beob_quelle_werte.id = beob.quelle_id)))
  ORDER BY beob.datum DESC;




CREATE VIEW apflora.v_apber AS
 SELECT ae_eigenschaften.artname,
    apber.id_old,
    apber.jahr,
    apber.situation,
    apber.vergleich_vorjahr_gesamtziel,
    apber.beurteilung,
    apber.veraenderung_zum_vorjahr,
    apber.apber_analyse,
    apber.konsequenzen_umsetzung,
    apber.konsequenzen_erfolgskontrolle,
    apber.biotope_neue,
    apber.biotope_optimieren,
    apber.massnahmen_optimieren,
    apber.wirkung_auf_art,
    apber.datum,
    apber.changed,
    apber.changed_by,
    apber.massnahmen_ap_bearb,
    apber.massnahmen_planung_vs_ausfuehrung,
    apber.id,
    apber.ap_id,
    apber.bearbeiter,
    ap_erfkrit_werte.text AS beurteilung_decodiert,
    adresse.name AS bearbeiter_decodiert
   FROM ((apflora.ap
     JOIN apflora.ae_eigenschaften ON ((ap.art_id = ae_eigenschaften.id)))
     JOIN ((apflora.apber
     LEFT JOIN apflora.ap_erfkrit_werte ON ((apber.beurteilung = ap_erfkrit_werte.code)))
     LEFT JOIN apflora.adresse ON ((apber.bearbeiter = adresse.id))) ON ((ap.id = apber.ap_id)))
  ORDER BY ae_eigenschaften.artname;




CREATE VIEW apflora.v_apber_a10lpop AS
 SELECT pop.ap_id,
    pop.id
   FROM (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE (pop.status = 300)
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_a10ltpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE (tpop.status = 300)
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_a2lpop AS
 SELECT pop.ap_id,
    pop.id
   FROM (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((pop.status = 100) AND (tpop.apber_relevant = 1))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_a2ltpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((pop.status <> 300) AND (tpop.status = 100) AND (tpop.apber_relevant = 1))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_a3lpop AS
 SELECT pop.ap_id,
    pop.id
   FROM ((apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN apflora.ap ON ((pop.ap_id = ap.id)))
  WHERE ((pop.status = ANY (ARRAY[200, 210])) AND (tpop.apber_relevant = 1) AND ((pop.bekannt_seit < ap.start_jahr) OR (pop.bekannt_seit IS NULL) OR (ap.start_jahr IS NULL)))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_a3ltpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((pop.ap_id = ap.id)))
  WHERE ((pop.status <> 300) AND (tpop.status = ANY (ARRAY[200, 210])) AND (tpop.apber_relevant = 1) AND ((tpop.bekannt_seit < ap.start_jahr) OR (tpop.bekannt_seit IS NULL) OR (ap.start_jahr IS NULL)))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_a4lpop AS
 SELECT pop.ap_id,
    pop.id
   FROM ((apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN apflora.ap ON ((pop.ap_id = ap.id)))
  WHERE ((pop.status = ANY (ARRAY[200, 210])) AND (tpop.apber_relevant = 1) AND (pop.bekannt_seit >= ap.start_jahr))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_a4ltpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((pop.ap_id = ap.id)))
  WHERE ((pop.status <> 300) AND (tpop.status = ANY (ARRAY[200, 210])) AND (tpop.apber_relevant = 1) AND (tpop.bekannt_seit >= ap.start_jahr))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_a5lpop AS
 SELECT pop.ap_id,
    pop.id
   FROM (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((pop.status = 201) AND (tpop.apber_relevant = 1))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_a5ltpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((tpop.status = 201) AND (tpop.apber_relevant = 1))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_a8lpop AS
 SELECT pop.ap_id,
    pop.id
   FROM ((apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN apflora.ap ON ((pop.ap_id = ap.id)))
  WHERE (((pop.status = 101) OR ((pop.status = 211) AND ((pop.bekannt_seit < ap.start_jahr) OR (pop.bekannt_seit IS NULL) OR (ap.start_jahr IS NULL)))) AND (tpop.apber_relevant = 1))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_a8ltpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM ((apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN apflora.ap ON ((pop.ap_id = ap.id)))
  WHERE ((pop.status <> 300) AND ((tpop.status = 101) OR ((tpop.status = 211) AND ((tpop.bekannt_seit < ap.start_jahr) OR (tpop.bekannt_seit IS NULL) OR (ap.start_jahr IS NULL)))) AND (tpop.apber_relevant = 1))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_a9lpop AS
 SELECT pop.ap_id,
    pop.id
   FROM ((apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN apflora.ap ON ((pop.ap_id = ap.id)))
  WHERE ((pop.status = ANY (ARRAY[202, 211])) AND (tpop.apber_relevant = 1) AND (pop.bekannt_seit >= ap.start_jahr))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_a9ltpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM ((apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN apflora.ap ON ((pop.ap_id = ap.id)))
  WHERE ((pop.status <> 300) AND (tpop.status = ANY (ARRAY[202, 211])) AND (tpop.apber_relevant = 1) AND (tpop.bekannt_seit >= ap.start_jahr))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_b1lpop AS
 SELECT pop.ap_id,
    pop.id
   FROM ((apflora.pop
     JOIN (apflora.popber
     JOIN apflora._variable ON ((popber.jahr = _variable.apber_jahr))) ON ((pop.id = popber.pop_id)))
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_b1ltpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.pop
     JOIN (apflora.tpop
     JOIN (apflora.tpopber
     JOIN apflora._variable ON ((tpopber.jahr = _variable.apber_jahr))) ON ((tpop.id = tpopber.tpop_id))) ON ((pop.id = tpop.pop_id)))
  WHERE ((tpop.apber_relevant = 1) AND (pop.status <> 300) AND (tpop.status <> 300))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_b1rpop AS
 SELECT pop.ap_id,
    pop.id
   FROM apflora._variable,
    ((apflora.pop
     JOIN apflora.popber ON ((pop.id = popber.pop_id)))
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((tpop.apber_relevant = 1) AND (pop.status <> 300) AND (popber.jahr <= _variable.apber_jahr) AND (popber.entwicklung = ANY (ARRAY[1, 2, 3, 4, 8])))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_b1rtpop AS
 SELECT pop.ap_id,
    tpopber.tpop_id
   FROM apflora._variable,
    (apflora.pop
     JOIN (apflora.tpop
     JOIN apflora.tpopber ON ((tpop.id = tpopber.tpop_id))) ON ((pop.id = tpop.pop_id)))
  WHERE ((tpop.apber_relevant = 1) AND (pop.status <> 300) AND (tpop.status <> 300) AND (tpopber.jahr <= _variable.apber_jahr) AND (tpopber.entwicklung = ANY (ARRAY[1, 2, 3, 4, 8])))
  GROUP BY pop.ap_id, tpopber.tpop_id;




CREATE VIEW apflora.v_apber_b2lpop AS
 SELECT pop.ap_id,
    pop.id
   FROM ((apflora.pop
     JOIN (apflora.popber
     JOIN apflora._variable ON ((popber.jahr = _variable.apber_jahr))) ON ((pop.id = popber.pop_id)))
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((popber.entwicklung = 3) AND (tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_b2ltpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.pop
     JOIN (apflora.tpop
     JOIN (apflora.tpopber
     JOIN apflora._variable ON ((tpopber.jahr = _variable.apber_jahr))) ON ((tpop.id = tpopber.tpop_id))) ON ((pop.id = tpop.pop_id)))
  WHERE ((tpopber.entwicklung = 3) AND (tpop.apber_relevant = 1) AND (pop.status <> 300) AND (tpop.status <> 300))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_pop_letzterpopber0 AS
 SELECT pop.ap_id,
    pop.id,
    popber.jahr
   FROM apflora._variable,
    ((apflora.pop
     JOIN apflora.popber ON ((pop.id = popber.pop_id)))
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((popber.jahr <= _variable.apber_jahr) AND (tpop.apber_relevant = 1) AND (pop.status <> 300));




CREATE VIEW apflora.v_pop_letzterpopber AS
 SELECT v_pop_letzterpopber0.ap_id,
    v_pop_letzterpopber0.id,
    max(v_pop_letzterpopber0.jahr) AS jahr
   FROM apflora.v_pop_letzterpopber0
  GROUP BY v_pop_letzterpopber0.ap_id, v_pop_letzterpopber0.id;




CREATE VIEW apflora.v_apber_b2rpop AS
 SELECT pop.ap_id,
    pop.id
   FROM (((apflora.v_pop_letzterpopber
     JOIN apflora.pop ON ((v_pop_letzterpopber.ap_id = pop.ap_id)))
     JOIN apflora.popber ON (((pop.id = popber.pop_id) AND (v_pop_letzterpopber.id = popber.pop_id) AND (v_pop_letzterpopber.jahr = popber.jahr))))
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((popber.entwicklung = 3) AND (tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_tpop_letztertpopber0 AS
 SELECT pop.ap_id,
    tpop.id,
    tpopber.jahr AS tpopber_jahr
   FROM apflora._variable,
    (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN apflora.tpopber ON ((tpop.id = tpopber.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpopber.jahr <= _variable.apber_jahr) AND (tpop.apber_relevant = 1) AND (pop.status <> 300));




CREATE VIEW apflora.v_tpop_letztertpopber AS
 SELECT v_tpop_letztertpopber0.ap_id,
    v_tpop_letztertpopber0.id,
    max(v_tpop_letztertpopber0.tpopber_jahr) AS jahr
   FROM apflora.v_tpop_letztertpopber0
  GROUP BY v_tpop_letztertpopber0.ap_id, v_tpop_letztertpopber0.id;




CREATE VIEW apflora.v_apber_b2rtpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.tpop
     JOIN (apflora.tpopber
     JOIN (apflora.pop
     JOIN apflora.v_tpop_letztertpopber ON ((pop.ap_id = v_tpop_letztertpopber.ap_id))) ON (((tpopber.tpop_id = v_tpop_letztertpopber.id) AND (tpopber.jahr = v_tpop_letztertpopber.jahr)))) ON (((tpop.pop_id = pop.id) AND (tpop.id = tpopber.tpop_id))))
  WHERE ((tpopber.entwicklung = 3) AND (tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_b3lpop AS
 SELECT pop.ap_id,
    pop.id
   FROM ((apflora.pop
     JOIN (apflora.popber
     JOIN apflora._variable ON ((popber.jahr = _variable.apber_jahr))) ON ((pop.id = popber.pop_id)))
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((popber.entwicklung = 2) AND (tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_b3ltpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.pop
     JOIN (apflora.tpop
     JOIN (apflora.tpopber
     JOIN apflora._variable ON ((tpopber.jahr = _variable.apber_jahr))) ON ((tpop.id = tpopber.tpop_id))) ON ((pop.id = tpop.pop_id)))
  WHERE ((tpopber.entwicklung = 2) AND (tpop.apber_relevant = 1) AND (pop.status <> 300) AND (tpop.status <> 300))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_b3rpop AS
 SELECT pop.ap_id,
    pop.id
   FROM (((apflora.v_pop_letzterpopber
     JOIN apflora.pop ON ((v_pop_letzterpopber.ap_id = pop.ap_id)))
     JOIN apflora.popber ON (((pop.id = popber.pop_id) AND (v_pop_letzterpopber.id = popber.pop_id) AND (v_pop_letzterpopber.jahr = popber.jahr))))
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((popber.entwicklung = 2) AND (tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_b3rtpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.tpop
     JOIN (apflora.tpopber
     JOIN (apflora.pop
     JOIN apflora.v_tpop_letztertpopber ON ((pop.ap_id = v_tpop_letztertpopber.ap_id))) ON (((tpopber.tpop_id = v_tpop_letztertpopber.id) AND (tpopber.jahr = v_tpop_letztertpopber.jahr)))) ON (((tpop.pop_id = pop.id) AND (tpop.id = tpopber.tpop_id))))
  WHERE ((tpopber.entwicklung = 2) AND (tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_b4lpop AS
 SELECT pop.ap_id,
    pop.id
   FROM ((apflora.pop
     JOIN (apflora.popber
     JOIN apflora._variable ON ((popber.jahr = _variable.apber_jahr))) ON ((pop.id = popber.pop_id)))
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((popber.entwicklung = 1) AND (tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_b4ltpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.pop
     JOIN (apflora.tpop
     JOIN (apflora.tpopber
     JOIN apflora._variable ON ((tpopber.jahr = _variable.apber_jahr))) ON ((tpop.id = tpopber.tpop_id))) ON ((pop.id = tpop.pop_id)))
  WHERE ((tpopber.entwicklung = 1) AND (tpop.apber_relevant = 1) AND (pop.status <> 300) AND (tpop.status <> 300))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_b4rpop AS
 SELECT pop.ap_id,
    pop.id
   FROM (((apflora.v_pop_letzterpopber
     JOIN apflora.pop ON ((v_pop_letzterpopber.ap_id = pop.ap_id)))
     JOIN apflora.popber ON (((pop.id = popber.pop_id) AND (v_pop_letzterpopber.id = popber.pop_id) AND (v_pop_letzterpopber.jahr = popber.jahr))))
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((popber.entwicklung = 1) AND (tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_b4rtpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.tpop
     JOIN (apflora.tpopber
     JOIN (apflora.pop
     JOIN apflora.v_tpop_letztertpopber ON ((pop.ap_id = v_tpop_letztertpopber.ap_id))) ON (((tpopber.tpop_id = v_tpop_letztertpopber.id) AND (tpopber.jahr = v_tpop_letztertpopber.jahr)))) ON (((tpop.pop_id = pop.id) AND (tpop.id = tpopber.tpop_id))))
  WHERE ((tpopber.entwicklung = 1) AND (tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_b5lpop AS
 SELECT pop.ap_id,
    pop.id
   FROM ((apflora.pop
     JOIN (apflora.popber
     JOIN apflora._variable ON ((popber.jahr = _variable.apber_jahr))) ON ((pop.id = popber.pop_id)))
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((popber.entwicklung = 4) AND (tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_b5ltpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.pop
     JOIN (apflora.tpop
     JOIN (apflora.tpopber
     JOIN apflora._variable ON ((tpopber.jahr = _variable.apber_jahr))) ON ((tpop.id = tpopber.tpop_id))) ON ((pop.id = tpop.pop_id)))
  WHERE ((tpopber.entwicklung = 4) AND (tpop.apber_relevant = 1) AND (pop.status <> 300) AND (tpop.status <> 300))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_b5rpop AS
 SELECT pop.ap_id,
    pop.id
   FROM (((apflora.v_pop_letzterpopber
     JOIN apflora.pop ON ((v_pop_letzterpopber.ap_id = pop.ap_id)))
     JOIN apflora.popber ON (((pop.id = popber.pop_id) AND (v_pop_letzterpopber.id = popber.pop_id) AND (v_pop_letzterpopber.jahr = popber.jahr))))
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE (((popber.entwicklung = 4) OR (popber.entwicklung = 9)) AND (tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_b5rtpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.tpop
     JOIN (apflora.tpopber
     JOIN (apflora.pop
     JOIN apflora.v_tpop_letztertpopber ON ((pop.ap_id = v_tpop_letztertpopber.ap_id))) ON (((tpopber.tpop_id = v_tpop_letztertpopber.id) AND (tpopber.jahr = v_tpop_letztertpopber.jahr)))) ON (((tpop.pop_id = pop.id) AND (tpop.id = tpopber.tpop_id))))
  WHERE ((tpopber.entwicklung = 4) AND (tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_b6lpop AS
 SELECT pop.ap_id,
    pop.id
   FROM ((apflora.pop
     JOIN (apflora.popber
     JOIN apflora._variable ON ((popber.jahr = _variable.apber_jahr))) ON ((pop.id = popber.pop_id)))
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((popber.entwicklung = 8) AND (tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_b6ltpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.pop
     JOIN (apflora.tpop
     JOIN (apflora.tpopber
     JOIN apflora._variable ON ((tpopber.jahr = _variable.apber_jahr))) ON ((tpop.id = tpopber.tpop_id))) ON ((pop.id = tpop.pop_id)))
  WHERE ((tpopber.entwicklung = 8) AND (tpop.apber_relevant = 1) AND (pop.status <> 300) AND (tpop.status <> 300))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_b6rpop AS
 SELECT pop.ap_id,
    pop.id
   FROM (((apflora.v_pop_letzterpopber
     JOIN apflora.pop ON ((v_pop_letzterpopber.ap_id = pop.ap_id)))
     JOIN apflora.popber ON (((pop.id = popber.pop_id) AND (v_pop_letzterpopber.id = popber.pop_id) AND (v_pop_letzterpopber.jahr = popber.jahr))))
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((popber.entwicklung = 8) AND (tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_b6rtpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.tpop
     JOIN (apflora.tpopber
     JOIN (apflora.pop
     JOIN apflora.v_tpop_letztertpopber ON ((pop.ap_id = v_tpop_letztertpopber.ap_id))) ON (((tpopber.tpop_id = v_tpop_letztertpopber.id) AND (tpopber.jahr = v_tpop_letztertpopber.jahr)))) ON (((tpop.pop_id = pop.id) AND (tpop.id = tpopber.tpop_id))))
  WHERE ((tpopber.entwicklung = 8) AND (tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_b7lpop AS
 SELECT pop.ap_id,
    pop.id
   FROM (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_b7ltpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((tpop.apber_relevant = 1) AND (pop.status <> 300) AND (tpop.status <> 300))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_c1lpop AS
 SELECT pop.ap_id,
    pop.id
   FROM ((apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN (apflora.tpopmassn
     JOIN apflora._variable ON ((tpopmassn.jahr = _variable.apber_jahr))) ON ((tpop.id = tpopmassn.tpop_id)))
  WHERE ((tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_c1ltpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (((apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id)))
     JOIN apflora._variable ON ((tpopmassn.jahr = _variable.apber_jahr)))
  WHERE ((tpop.apber_relevant = 1) AND (pop.status <> 300) AND (tpop.status <> 300))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_c1rpop AS
 SELECT pop.ap_id,
    pop.id
   FROM apflora._variable,
    ((apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id)))
  WHERE ((tpopmassn.jahr <= _variable.apber_jahr) AND (tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_c1rtpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM apflora._variable,
    ((apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id)))
  WHERE ((tpopmassn.jahr <= _variable.apber_jahr) AND (tpop.apber_relevant = 1) AND (pop.status <> 300) AND (tpop.status <> 300))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_pop_letztermassnber0 AS
 SELECT pop.ap_id,
    pop.id,
    popmassnber.jahr
   FROM apflora._variable,
    (((apflora.pop
     JOIN apflora.popmassnber ON ((pop.id = popmassnber.pop_id)))
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id)))
  WHERE ((popmassnber.jahr <= _variable.apber_jahr) AND (tpop.apber_relevant = 1) AND (tpopmassn.jahr <= _variable.apber_jahr) AND (pop.status <> 300));




CREATE VIEW apflora.v_pop_letztermassnber AS
 SELECT v_pop_letztermassnber0.ap_id,
    v_pop_letztermassnber0.id,
    max(v_pop_letztermassnber0.jahr) AS jahr
   FROM apflora.v_pop_letztermassnber0
  GROUP BY v_pop_letztermassnber0.ap_id, v_pop_letztermassnber0.id;




CREATE VIEW apflora.v_apber_c3rpop AS
 SELECT pop.ap_id,
    pop.id
   FROM ((apflora.v_pop_letztermassnber
     JOIN apflora.pop ON ((v_pop_letztermassnber.ap_id = pop.ap_id)))
     JOIN apflora.popmassnber ON (((pop.id = popmassnber.pop_id) AND (v_pop_letztermassnber.jahr = popmassnber.jahr) AND (v_pop_letztermassnber.id = popmassnber.pop_id))))
  WHERE (popmassnber.beurteilung = 1)
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_tpop_letztermassnber0 AS
 SELECT pop.ap_id,
    tpop.id,
    tpopmassnber.jahr
   FROM apflora._variable,
    (((apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN apflora.tpopmassnber ON ((tpop.id = tpopmassnber.tpop_id)))
     JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id)))
  WHERE ((tpopmassnber.jahr <= _variable.apber_jahr) AND (tpop.apber_relevant = 1) AND (tpopmassn.jahr <= _variable.apber_jahr) AND (pop.status <> 300) AND ((tpopmassnber.beurteilung >= 1) AND (tpopmassnber.beurteilung <= 5)));




CREATE VIEW apflora.v_tpop_letztermassnber AS
 SELECT v_tpop_letztermassnber0.ap_id,
    v_tpop_letztermassnber0.id,
    max(v_tpop_letztermassnber0.jahr) AS jahr
   FROM apflora.v_tpop_letztermassnber0
  GROUP BY v_tpop_letztermassnber0.ap_id, v_tpop_letztermassnber0.id;




CREATE VIEW apflora.v_apber_c3rtpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.pop
     JOIN ((apflora.v_tpop_letztermassnber
     JOIN apflora.tpopmassnber ON (((v_tpop_letztermassnber.id = tpopmassnber.tpop_id) AND (v_tpop_letztermassnber.jahr = tpopmassnber.jahr))))
     JOIN apflora.tpop ON ((tpopmassnber.tpop_id = tpop.id))) ON ((pop.id = tpop.pop_id)))
  WHERE (tpopmassnber.beurteilung = 1)
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_c4rpop AS
 SELECT pop.ap_id,
    pop.id
   FROM ((apflora.v_pop_letztermassnber
     JOIN apflora.pop ON ((v_pop_letztermassnber.ap_id = pop.ap_id)))
     JOIN apflora.popmassnber ON (((pop.id = popmassnber.pop_id) AND (v_pop_letztermassnber.jahr = popmassnber.jahr) AND (v_pop_letztermassnber.id = popmassnber.pop_id))))
  WHERE (popmassnber.beurteilung = 2)
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_c4rtpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.pop
     JOIN ((apflora.v_tpop_letztermassnber
     JOIN apflora.tpopmassnber ON (((v_tpop_letztermassnber.id = tpopmassnber.tpop_id) AND (v_tpop_letztermassnber.jahr = tpopmassnber.jahr))))
     JOIN apflora.tpop ON ((tpopmassnber.tpop_id = tpop.id))) ON ((pop.id = tpop.pop_id)))
  WHERE (tpopmassnber.beurteilung = 2)
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_c5rpop AS
 SELECT pop.ap_id,
    pop.id
   FROM ((apflora.v_pop_letztermassnber
     JOIN apflora.pop ON ((v_pop_letztermassnber.ap_id = pop.ap_id)))
     JOIN apflora.popmassnber ON (((pop.id = popmassnber.pop_id) AND (v_pop_letztermassnber.jahr = popmassnber.jahr) AND (v_pop_letztermassnber.id = popmassnber.pop_id))))
  WHERE (popmassnber.beurteilung = 3)
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_c5rtpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.pop
     JOIN ((apflora.v_tpop_letztermassnber
     JOIN apflora.tpopmassnber ON (((v_tpop_letztermassnber.id = tpopmassnber.tpop_id) AND (v_tpop_letztermassnber.jahr = tpopmassnber.jahr))))
     JOIN apflora.tpop ON ((tpopmassnber.tpop_id = tpop.id))) ON ((pop.id = tpop.pop_id)))
  WHERE (tpopmassnber.beurteilung = 3)
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_c6rpop AS
 SELECT pop.ap_id,
    pop.id
   FROM ((apflora.v_pop_letztermassnber
     JOIN apflora.pop ON ((v_pop_letztermassnber.ap_id = pop.ap_id)))
     JOIN apflora.popmassnber ON (((pop.id = popmassnber.pop_id) AND (v_pop_letztermassnber.id = popmassnber.pop_id) AND (v_pop_letztermassnber.jahr = popmassnber.jahr))))
  WHERE (popmassnber.beurteilung = 4)
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_c6rtpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.pop
     JOIN ((apflora.v_tpop_letztermassnber
     JOIN apflora.tpopmassnber ON (((v_tpop_letztermassnber.id = tpopmassnber.tpop_id) AND (v_tpop_letztermassnber.jahr = tpopmassnber.jahr))))
     JOIN apflora.tpop ON ((tpopmassnber.tpop_id = tpop.id))) ON ((pop.id = tpop.pop_id)))
  WHERE (tpopmassnber.beurteilung = 4)
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_apber_c7rpop AS
 SELECT pop.ap_id,
    pop.id
   FROM ((apflora.v_pop_letztermassnber
     JOIN apflora.pop ON ((v_pop_letztermassnber.ap_id = pop.ap_id)))
     JOIN apflora.popmassnber ON (((pop.id = popmassnber.pop_id) AND (v_pop_letztermassnber.id = popmassnber.pop_id) AND (v_pop_letztermassnber.jahr = popmassnber.jahr))))
  WHERE (popmassnber.beurteilung = 5)
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apber_c7rtpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.pop
     JOIN ((apflora.v_tpop_letztermassnber
     JOIN apflora.tpopmassnber ON (((v_tpop_letztermassnber.id = tpopmassnber.tpop_id) AND (v_tpop_letztermassnber.jahr = tpopmassnber.jahr))))
     JOIN apflora.tpop ON ((tpopmassnber.tpop_id = tpop.id))) ON ((pop.id = tpop.pop_id)))
  WHERE (tpopmassnber.beurteilung = 5)
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_erstemassnproap AS
 SELECT ap.id AS ap_id,
    min(tpopmassn.jahr) AS jahr
   FROM (((apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id)))
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id)))
  GROUP BY ap.id;




CREATE VIEW apflora.v_apber_injahr AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    apber.id,
    concat(adresse.name, ', ', adresse.adresse) AS bearbeiter,
    apberuebersicht.jahr AS apberuebersicht_jahr,
    apberuebersicht.bemerkungen,
    v_erstemassnproap.jahr AS jahr_erste_massnahme
   FROM ((apflora.ae_eigenschaften
     JOIN (apflora.ap
     LEFT JOIN apflora.v_erstemassnproap ON ((ap.id = v_erstemassnproap.ap_id))) ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN (((apflora.apber
     LEFT JOIN apflora.adresse ON ((apber.bearbeiter = adresse.id)))
     LEFT JOIN apflora.apberuebersicht ON ((apber.jahr = apberuebersicht.jahr)))
     JOIN apflora._variable ON ((apber.jahr = _variable.apber_jahr))) ON ((ap.id = apber.ap_id)))
  WHERE (ap.bearbeitung < 4)
  ORDER BY ae_eigenschaften.artname;




CREATE VIEW apflora.v_apber_pop_uebersicht AS
 SELECT ap.id,
    ae_eigenschaften.artname AS "Art",
    ( SELECT count(*) AS count
           FROM apflora.pop pop_1
          WHERE ((pop_1.ap_id = ae_eigenschaften.id) AND (pop_1.status = 100) AND (pop_1.id IN ( SELECT DISTINCT tpop.pop_id
                   FROM apflora.tpop
                  WHERE (tpop.apber_relevant = 1))))) AS "aktuellUrspruenglich",
    ( SELECT count(*) AS count
           FROM apflora.pop pop_1
          WHERE ((pop_1.ap_id = ae_eigenschaften.id) AND (pop_1.status = ANY (ARRAY[200, 210])) AND (pop_1.id IN ( SELECT DISTINCT tpop.pop_id
                   FROM apflora.tpop
                  WHERE (tpop.apber_relevant = 1))))) AS "aktuellAngesiedelt",
    ( SELECT count(*) AS count
           FROM apflora.pop pop_1
          WHERE ((pop_1.ap_id = ae_eigenschaften.id) AND (pop_1.status = ANY (ARRAY[100, 200, 210])) AND (pop_1.id IN ( SELECT DISTINCT tpop.pop_id
                   FROM apflora.tpop
                  WHERE (tpop.apber_relevant = 1))))) AS aktuell
   FROM (apflora.ae_eigenschaften
     JOIN (apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id))) ON ((ae_eigenschaften.id = ap.art_id)))
  WHERE ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3))
  GROUP BY ap.id, ae_eigenschaften.id, ae_eigenschaften.artname
  ORDER BY ae_eigenschaften.artname;




CREATE VIEW apflora.v_apber_uebe AS
 SELECT apber.id_old,
    apber.jahr,
    apber.situation,
    apber.vergleich_vorjahr_gesamtziel,
    apber.beurteilung,
    apber.veraenderung_zum_vorjahr,
    apber.apber_analyse,
    apber.konsequenzen_umsetzung,
    apber.konsequenzen_erfolgskontrolle,
    apber.biotope_neue,
    apber.biotope_optimieren,
    apber.massnahmen_optimieren,
    apber.wirkung_auf_art,
    apber.datum,
    apber.changed,
    apber.changed_by,
    apber.massnahmen_ap_bearb,
    apber.massnahmen_planung_vs_ausfuehrung,
    apber.id,
    apber.ap_id,
    apber.bearbeiter,
    ae_eigenschaften.artname,
    v_ap_anzmassnbisjahr.anzahl_massnahmen
   FROM (apflora._variable "tblKonstanten_1"
     JOIN ((apflora.ae_eigenschaften
     JOIN (apflora.ap
     JOIN apflora.v_ap_apberrelevant ON ((ap.id = v_ap_apberrelevant.id))) ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN (apflora._variable
     JOIN (apflora.apber
     JOIN apflora.v_ap_anzmassnbisjahr ON ((apber.ap_id = v_ap_anzmassnbisjahr.id))) ON ((_variable.apber_jahr = apber.jahr))) ON ((ap.id = apber.ap_id))) ON (("tblKonstanten_1".apber_jahr = v_ap_anzmassnbisjahr.jahr)))
  WHERE ((v_ap_anzmassnbisjahr.anzahl_massnahmen > (0)::numeric) AND (apber.beurteilung = 1) AND ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3)))
  ORDER BY ae_eigenschaften.artname;




CREATE VIEW apflora.v_apber_uebe_apid AS
 SELECT ap.id
   FROM (apflora._variable "tblKonstanten_1"
     JOIN ((apflora.ae_eigenschaften
     JOIN (apflora.ap
     JOIN apflora.v_ap_apberrelevant ON ((ap.id = v_ap_apberrelevant.id))) ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN (apflora._variable
     JOIN (apflora.apber
     JOIN apflora.v_ap_anzmassnbisjahr ON ((apber.ap_id = v_ap_anzmassnbisjahr.id))) ON ((_variable.apber_jahr = apber.jahr))) ON ((ap.id = apber.ap_id))) ON (("tblKonstanten_1".apber_jahr = v_ap_anzmassnbisjahr.jahr)))
  WHERE ((v_ap_anzmassnbisjahr.anzahl_massnahmen > (0)::numeric) AND (apber.beurteilung = 1) AND ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3)));




CREATE VIEW apflora.v_apber_uebkm AS
 SELECT ae_eigenschaften.artname,
        CASE
            WHEN (ae_eigenschaften.kefart = true) THEN 'Ja'::text
            ELSE ''::text
        END AS "FnsKefArt2",
        CASE
            WHEN (round((((_variable.apber_jahr - ae_eigenschaften.kefkontrolljahr) / 4))::numeric, 0) = (((_variable.apber_jahr - ae_eigenschaften.kefkontrolljahr) / 4))::numeric) THEN 'Ja'::text
            ELSE ''::text
        END AS "FnsKefKontrJahr2"
   FROM ((apflora.ae_eigenschaften
     JOIN ((apflora.v_ap_anzmassnbisjahr "vApAnzMassnBisJahr_1"
     JOIN apflora.ap ON (("vApAnzMassnBisJahr_1".id = ap.id)))
     JOIN apflora.v_ap_apberrelevant ON ((ap.id = v_ap_apberrelevant.id))) ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN (apflora.apber
     JOIN apflora._variable ON ((apber.jahr = _variable.apber_jahr))) ON (((_variable.apber_jahr = "vApAnzMassnBisJahr_1".jahr) AND (ap.id = apber.ap_id))))
  WHERE ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3) AND ("vApAnzMassnBisJahr_1".anzahl_massnahmen = '0'::numeric))
  ORDER BY ae_eigenschaften.artname;




CREATE VIEW apflora.v_apber_uebma AS
 SELECT ae_eigenschaften.artname,
    v_ap_anzmassnbisjahr.anzahl_massnahmen
   FROM (apflora._variable
     JOIN ((apflora.ae_eigenschaften
     JOIN (apflora.ap
     JOIN apflora.v_ap_apberrelevant ON ((ap.id = v_ap_apberrelevant.id))) ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN apflora.v_ap_anzmassnbisjahr ON ((ap.id = v_ap_anzmassnbisjahr.id))) ON ((_variable.apber_jahr = v_ap_anzmassnbisjahr.jahr)))
  WHERE ((v_ap_anzmassnbisjahr.anzahl_massnahmen > (0)::numeric) AND ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3)))
  ORDER BY ae_eigenschaften.artname;




CREATE VIEW apflora.v_apber_uebma_apid AS
 SELECT ap.id
   FROM (apflora._variable
     JOIN ((apflora.ae_eigenschaften
     JOIN (apflora.ap
     JOIN apflora.v_ap_apberrelevant ON ((ap.id = v_ap_apberrelevant.id))) ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN apflora.v_ap_anzmassnbisjahr ON ((ap.id = v_ap_anzmassnbisjahr.id))) ON ((_variable.apber_jahr = v_ap_anzmassnbisjahr.jahr)))
  WHERE ((v_ap_anzmassnbisjahr.anzahl_massnahmen > (0)::numeric) AND ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3)));




CREATE VIEW apflora.v_apber_uebme AS
 SELECT apber.id_old,
    apber.jahr,
    apber.situation,
    apber.vergleich_vorjahr_gesamtziel,
    apber.beurteilung,
    apber.veraenderung_zum_vorjahr,
    apber.apber_analyse,
    apber.konsequenzen_umsetzung,
    apber.konsequenzen_erfolgskontrolle,
    apber.biotope_neue,
    apber.biotope_optimieren,
    apber.massnahmen_optimieren,
    apber.wirkung_auf_art,
    apber.datum,
    apber.changed,
    apber.changed_by,
    apber.massnahmen_ap_bearb,
    apber.massnahmen_planung_vs_ausfuehrung,
    apber.id,
    apber.ap_id,
    apber.bearbeiter,
    ae_eigenschaften.artname
   FROM (apflora._variable "tblKonstanten_1"
     JOIN ((apflora.ae_eigenschaften
     JOIN (apflora.ap
     JOIN apflora.v_ap_apberrelevant ON ((ap.id = v_ap_apberrelevant.id))) ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN ((apflora.apber
     JOIN apflora.v_ap_anzmassnbisjahr ON ((apber.ap_id = v_ap_anzmassnbisjahr.id)))
     JOIN apflora._variable ON ((apber.jahr = _variable.apber_jahr))) ON ((ap.id = apber.ap_id))) ON (("tblKonstanten_1".apber_jahr = v_ap_anzmassnbisjahr.jahr)))
  WHERE ((apber.beurteilung = 5) AND (v_ap_anzmassnbisjahr.anzahl_massnahmen > (0)::numeric) AND ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3)))
  ORDER BY ae_eigenschaften.artname;




CREATE VIEW apflora.v_apber_uebme_apid AS
 SELECT ap.id
   FROM (apflora._variable "tblKonstanten_1"
     JOIN ((apflora.ae_eigenschaften
     JOIN (apflora.ap
     JOIN apflora.v_ap_apberrelevant ON ((ap.id = v_ap_apberrelevant.id))) ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN ((apflora.apber
     JOIN apflora.v_ap_anzmassnbisjahr ON ((apber.ap_id = v_ap_anzmassnbisjahr.id)))
     JOIN apflora._variable ON ((apber.jahr = _variable.apber_jahr))) ON ((ap.id = apber.ap_id))) ON (("tblKonstanten_1".apber_jahr = v_ap_anzmassnbisjahr.jahr)))
  WHERE ((apber.beurteilung = 5) AND (v_ap_anzmassnbisjahr.anzahl_massnahmen > (0)::numeric) AND ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3)));




CREATE VIEW apflora.v_apber_uebne_apid AS
 SELECT ap.id
   FROM (apflora._variable "tblKonstanten_1"
     JOIN ((apflora.ae_eigenschaften
     JOIN (apflora.ap
     JOIN apflora.v_ap_apberrelevant ON ((ap.id = v_ap_apberrelevant.id))) ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN ((apflora.apber
     JOIN apflora.v_ap_anzmassnbisjahr ON ((apber.ap_id = v_ap_anzmassnbisjahr.id)))
     JOIN apflora._variable ON ((apber.jahr = _variable.apber_jahr))) ON ((ap.id = apber.ap_id))) ON (("tblKonstanten_1".apber_jahr = v_ap_anzmassnbisjahr.jahr)))
  WHERE ((apber.beurteilung = 3) AND ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3)) AND (v_ap_anzmassnbisjahr.anzahl_massnahmen > (0)::numeric));




CREATE VIEW apflora.v_apber_uebse_apid AS
 SELECT ap.id
   FROM (apflora._variable "tblKonstanten_1"
     JOIN ((apflora.ae_eigenschaften
     JOIN (apflora.ap
     JOIN apflora.v_ap_apberrelevant ON ((ap.id = v_ap_apberrelevant.id))) ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN ((apflora.apber
     JOIN apflora.v_ap_anzmassnbisjahr ON ((apber.ap_id = v_ap_anzmassnbisjahr.id)))
     JOIN apflora._variable ON ((apber.jahr = _variable.apber_jahr))) ON ((ap.id = apber.ap_id))) ON (("tblKonstanten_1".apber_jahr = v_ap_anzmassnbisjahr.jahr)))
  WHERE ((apber.beurteilung = 4) AND (v_ap_anzmassnbisjahr.anzahl_massnahmen > (0)::numeric) AND ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3)));




CREATE VIEW apflora.v_apber_uebun_apid AS
 SELECT ap.id
   FROM (apflora._variable "tblKonstanten_1"
     JOIN ((apflora.ae_eigenschaften
     JOIN (apflora.ap
     JOIN apflora.v_ap_apberrelevant ON ((ap.id = v_ap_apberrelevant.id))) ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN ((apflora.apber
     JOIN apflora.v_ap_anzmassnbisjahr ON ((apber.ap_id = v_ap_anzmassnbisjahr.id)))
     JOIN apflora._variable ON ((apber.jahr = _variable.apber_jahr))) ON ((ap.id = apber.ap_id))) ON (("tblKonstanten_1".apber_jahr = v_ap_anzmassnbisjahr.jahr)))
  WHERE ((apber.beurteilung = 1168274204) AND (v_ap_anzmassnbisjahr.anzahl_massnahmen > (0)::numeric) AND ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3)));




CREATE VIEW apflora.v_apber_uebwe_apid AS
 SELECT ap.id
   FROM (apflora._variable "tblKonstanten_1"
     JOIN ((apflora.ae_eigenschaften
     JOIN (apflora.ap
     JOIN apflora.v_ap_apberrelevant ON ((ap.id = v_ap_apberrelevant.id))) ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN ((apflora.apber
     JOIN apflora.v_ap_anzmassnbisjahr ON ((apber.ap_id = v_ap_anzmassnbisjahr.id)))
     JOIN apflora._variable ON ((apber.jahr = _variable.apber_jahr))) ON ((ap.id = apber.ap_id))) ON (("tblKonstanten_1".apber_jahr = v_ap_anzmassnbisjahr.jahr)))
  WHERE ((apber.beurteilung = 6) AND (v_ap_anzmassnbisjahr.anzahl_massnahmen > (0)::numeric) AND ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3)));




CREATE VIEW apflora.v_apber_uebnb AS
 SELECT ap.id,
    ae_eigenschaften.artname
   FROM (apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
  WHERE ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3) AND (NOT (ap.id IN ( SELECT v_apber_uebse_apid.id
           FROM apflora.v_apber_uebse_apid))) AND (NOT (ap.id IN ( SELECT v_apber_uebe_apid.id
           FROM apflora.v_apber_uebe_apid))) AND (NOT (ap.id IN ( SELECT v_apber_uebme_apid.id
           FROM apflora.v_apber_uebme_apid))) AND (NOT (ap.id IN ( SELECT v_apber_uebwe_apid.id
           FROM apflora.v_apber_uebwe_apid))) AND (NOT (ap.id IN ( SELECT v_apber_uebne_apid.id
           FROM apflora.v_apber_uebne_apid))) AND (NOT (ap.id IN ( SELECT v_apber_uebun_apid.id
           FROM apflora.v_apber_uebun_apid))) AND (ap.id IN ( SELECT v_apber_uebma_apid.id
           FROM apflora.v_apber_uebma_apid)))
  ORDER BY ae_eigenschaften.artname;




CREATE VIEW apflora.v_apber_uebnb00 AS
 SELECT ap.id,
    apber.jahr
   FROM (apflora._variable "tblKonstanten_1"
     JOIN (((apflora.ap
     JOIN apflora.v_ap_anzmassnbisjahr ON ((ap.id = v_ap_anzmassnbisjahr.id)))
     JOIN apflora.v_ap_apberrelevant ON ((ap.id = v_ap_apberrelevant.id)))
     JOIN (apflora.apber
     JOIN apflora._variable ON ((apber.jahr = _variable.apber_jahr))) ON ((ap.id = apber.ap_id))) ON (("tblKonstanten_1".apber_jahr = v_ap_anzmassnbisjahr.jahr)))
  WHERE ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3) AND (apber.beurteilung IS NULL));




CREATE VIEW apflora.v_apber_uebnb000 AS
 SELECT ap.id,
    apber.jahr
   FROM ((((apflora.ap
     JOIN apflora.v_ap_anzmassnbisjahr ON ((ap.id = v_ap_anzmassnbisjahr.id)))
     JOIN apflora.v_ap_apberrelevant ON ((ap.id = v_ap_apberrelevant.id)))
     LEFT JOIN apflora.apber ON ((ap.id = apber.ap_id)))
     JOIN apflora._variable ON ((v_ap_anzmassnbisjahr.jahr = _variable.apber_jahr)))
  WHERE ((apber.ap_id IS NULL) AND ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3)));




CREATE VIEW apflora.v_apber_uebnb0 AS
 SELECT v_apber_uebnb000.id,
    v_apber_uebnb000.jahr
   FROM apflora.v_apber_uebnb000
UNION
 SELECT v_apber_uebnb00.id,
    v_apber_uebnb00.jahr
   FROM apflora.v_apber_uebnb00;




CREATE VIEW apflora.v_apber_uebne AS
 SELECT apber.id_old,
    apber.jahr,
    apber.situation,
    apber.vergleich_vorjahr_gesamtziel,
    apber.beurteilung,
    apber.veraenderung_zum_vorjahr,
    apber.apber_analyse,
    apber.konsequenzen_umsetzung,
    apber.konsequenzen_erfolgskontrolle,
    apber.biotope_neue,
    apber.biotope_optimieren,
    apber.massnahmen_optimieren,
    apber.wirkung_auf_art,
    apber.datum,
    apber.changed,
    apber.changed_by,
    apber.massnahmen_ap_bearb,
    apber.massnahmen_planung_vs_ausfuehrung,
    apber.id,
    apber.ap_id,
    apber.bearbeiter,
    ae_eigenschaften.artname
   FROM (apflora._variable "tblKonstanten_1"
     JOIN ((apflora.ae_eigenschaften
     JOIN (apflora.ap
     JOIN apflora.v_ap_apberrelevant ON ((ap.id = v_ap_apberrelevant.id))) ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN ((apflora.apber
     JOIN apflora.v_ap_anzmassnbisjahr ON ((apber.ap_id = v_ap_anzmassnbisjahr.id)))
     JOIN apflora._variable ON ((apber.jahr = _variable.apber_jahr))) ON ((ap.id = apber.ap_id))) ON (("tblKonstanten_1".apber_jahr = v_ap_anzmassnbisjahr.jahr)))
  WHERE ((apber.beurteilung = 3) AND ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3)) AND (v_ap_anzmassnbisjahr.anzahl_massnahmen > (0)::numeric))
  ORDER BY ae_eigenschaften.artname;




CREATE VIEW apflora.v_apber_uebse AS
 SELECT apber.id_old,
    apber.jahr,
    apber.situation,
    apber.vergleich_vorjahr_gesamtziel,
    apber.beurteilung,
    apber.veraenderung_zum_vorjahr,
    apber.apber_analyse,
    apber.konsequenzen_umsetzung,
    apber.konsequenzen_erfolgskontrolle,
    apber.biotope_neue,
    apber.biotope_optimieren,
    apber.massnahmen_optimieren,
    apber.wirkung_auf_art,
    apber.datum,
    apber.changed,
    apber.changed_by,
    apber.massnahmen_ap_bearb,
    apber.massnahmen_planung_vs_ausfuehrung,
    apber.id,
    apber.ap_id,
    apber.bearbeiter,
    ae_eigenschaften.artname
   FROM (apflora._variable "tblKonstanten_1"
     JOIN ((apflora.ae_eigenschaften
     JOIN (apflora.ap
     JOIN apflora.v_ap_apberrelevant ON ((ap.id = v_ap_apberrelevant.id))) ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN ((apflora.apber
     JOIN apflora.v_ap_anzmassnbisjahr ON ((apber.ap_id = v_ap_anzmassnbisjahr.id)))
     JOIN apflora._variable ON ((apber.jahr = _variable.apber_jahr))) ON ((ap.id = apber.ap_id))) ON (("tblKonstanten_1".apber_jahr = v_ap_anzmassnbisjahr.jahr)))
  WHERE ((apber.beurteilung = 4) AND (v_ap_anzmassnbisjahr.anzahl_massnahmen > (0)::numeric) AND ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3)))
  ORDER BY ae_eigenschaften.artname;




CREATE VIEW apflora.v_apber_uebun AS
 SELECT apber.id_old,
    apber.jahr,
    apber.situation,
    apber.vergleich_vorjahr_gesamtziel,
    apber.beurteilung,
    apber.veraenderung_zum_vorjahr,
    apber.apber_analyse,
    apber.konsequenzen_umsetzung,
    apber.konsequenzen_erfolgskontrolle,
    apber.biotope_neue,
    apber.biotope_optimieren,
    apber.massnahmen_optimieren,
    apber.wirkung_auf_art,
    apber.datum,
    apber.changed,
    apber.changed_by,
    apber.massnahmen_ap_bearb,
    apber.massnahmen_planung_vs_ausfuehrung,
    apber.id,
    apber.ap_id,
    apber.bearbeiter,
    ae_eigenschaften.artname
   FROM (apflora._variable "tblKonstanten_1"
     JOIN ((apflora.ae_eigenschaften
     JOIN (apflora.ap
     JOIN apflora.v_ap_apberrelevant ON ((ap.id = v_ap_apberrelevant.id))) ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN ((apflora.apber
     JOIN apflora.v_ap_anzmassnbisjahr ON ((apber.ap_id = v_ap_anzmassnbisjahr.id)))
     JOIN apflora._variable ON ((apber.jahr = _variable.apber_jahr))) ON ((ap.id = apber.ap_id))) ON (("tblKonstanten_1".apber_jahr = v_ap_anzmassnbisjahr.jahr)))
  WHERE ((apber.beurteilung = 1168274204) AND (v_ap_anzmassnbisjahr.anzahl_massnahmen > (0)::numeric) AND ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3)))
  ORDER BY ae_eigenschaften.artname;




CREATE VIEW apflora.v_apber_uebwe AS
 SELECT apber.id_old,
    apber.jahr,
    apber.situation,
    apber.vergleich_vorjahr_gesamtziel,
    apber.beurteilung,
    apber.veraenderung_zum_vorjahr,
    apber.apber_analyse,
    apber.konsequenzen_umsetzung,
    apber.konsequenzen_erfolgskontrolle,
    apber.biotope_neue,
    apber.biotope_optimieren,
    apber.massnahmen_optimieren,
    apber.wirkung_auf_art,
    apber.datum,
    apber.changed,
    apber.changed_by,
    apber.massnahmen_ap_bearb,
    apber.massnahmen_planung_vs_ausfuehrung,
    apber.id,
    apber.ap_id,
    apber.bearbeiter,
    ae_eigenschaften.artname
   FROM (apflora._variable "tblKonstanten_1"
     JOIN ((apflora.ae_eigenschaften
     JOIN (apflora.ap
     JOIN apflora.v_ap_apberrelevant ON ((ap.id = v_ap_apberrelevant.id))) ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN ((apflora.apber
     JOIN apflora.v_ap_anzmassnbisjahr ON ((apber.ap_id = v_ap_anzmassnbisjahr.id)))
     JOIN apflora._variable ON ((apber.jahr = _variable.apber_jahr))) ON ((ap.id = apber.ap_id))) ON (("tblKonstanten_1".apber_jahr = v_ap_anzmassnbisjahr.jahr)))
  WHERE ((apber.beurteilung = 6) AND (v_ap_anzmassnbisjahr.anzahl_massnahmen > (0)::numeric) AND ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3)))
  ORDER BY ae_eigenschaften.artname;




CREATE VIEW apflora.v_apber_uet01 AS
 SELECT ap.id,
    ae_eigenschaften.artname,
        CASE
            WHEN (NOT (ap.id IN ( SELECT v_apber_uebma_apid.id
               FROM apflora.v_apber_uebma_apid))) THEN 1
            ELSE 0
        END AS "keineMassnahmen",
        CASE
            WHEN (ae_eigenschaften.kefart = true) THEN 1
            ELSE 0
        END AS "FnsKefArt",
        CASE
            WHEN (round((((_variable.apber_jahr - ae_eigenschaften.kefkontrolljahr) / 4))::numeric, 0) = (((_variable.apber_jahr - ae_eigenschaften.kefkontrolljahr) / 4))::numeric) THEN 1
            ELSE 0
        END AS "FnsKefKontrJahr"
   FROM (apflora.ae_eigenschaften
     JOIN ((apflora.ap
     JOIN (apflora.v_ap_anzmassnbisjahr
     JOIN apflora._variable ON ((v_ap_anzmassnbisjahr.jahr = _variable.apber_jahr))) ON ((ap.id = v_ap_anzmassnbisjahr.id)))
     JOIN apflora.v_ap_apberrelevant ON ((ap.id = v_ap_apberrelevant.id))) ON ((ae_eigenschaften.id = ap.art_id)))
  WHERE ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3))
  ORDER BY ae_eigenschaften.artname;




CREATE VIEW apflora.v_apber_uet_veraengegenvorjahr AS
 SELECT ap.id,
    apber.veraenderung_zum_vorjahr,
    apber.jahr
   FROM (apflora.ap
     LEFT JOIN apflora.apber ON ((ap.id = apber.ap_id)))
  WHERE ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3) AND ((apber.jahr IN ( SELECT _variable.apber_jahr
           FROM apflora._variable)) OR (apber.jahr IS NULL)));




CREATE TABLE apflora.zielber (
    id_old integer,
    jahr smallint,
    erreichung text,
    bemerkungen text,
    changed date DEFAULT now(),
    changed_by character varying(20) DEFAULT current_setting('request.jwt.claim.username'::text, true),
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    ziel_id uuid
);




COMMENT ON COLUMN apflora.zielber.id_old IS 'frühere id';



COMMENT ON COLUMN apflora.zielber.jahr IS 'Für welches Jahr gilt der Bericht?';



COMMENT ON COLUMN apflora.zielber.erreichung IS 'Beurteilung der Zielerreichung';



COMMENT ON COLUMN apflora.zielber.bemerkungen IS 'Bemerkungen zur Zielerreichung';



COMMENT ON COLUMN apflora.zielber.changed IS 'Wann wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.zielber.changed_by IS 'Von wem wurde der Datensatz zuletzt geändert?';



COMMENT ON COLUMN apflora.zielber.id IS 'Primärschlüssel';



COMMENT ON COLUMN apflora.zielber.ziel_id IS 'Zugehöriges Ziel. Fremdschlüssel aus der Tabelle "ziel"';



CREATE VIEW apflora.v_apber_zielber AS
 SELECT zielber.id_old,
    zielber.jahr,
    zielber.erreichung,
    zielber.bemerkungen,
    zielber.changed,
    zielber.changed_by,
    zielber.id,
    zielber.ziel_id
   FROM (apflora.zielber
     JOIN apflora._variable ON ((zielber.jahr = _variable.apber_jahr)));




CREATE VIEW apflora.v_apbera1lpop AS
 SELECT pop.ap_id,
    pop.id
   FROM (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, pop.id;




CREATE VIEW apflora.v_apbera1ltpop AS
 SELECT pop.ap_id,
    tpop.id
   FROM (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((tpop.apber_relevant = 1) AND (pop.status IS NOT NULL) AND (pop.status <> 300) AND (tpop.status <> 300) AND (tpop.status IS NOT NULL))
  GROUP BY pop.ap_id, tpop.id;




CREATE VIEW apflora.v_assozart AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    adresse.name AS ap_bearbeiter,
    assozart.id,
    "ArtenDb_Arteigenschaften_1".artname AS artname_assoziiert,
    assozart.bemerkungen,
    assozart.changed,
    assozart.changed_by
   FROM (apflora.ae_eigenschaften "ArtenDb_Arteigenschaften_1"
     RIGHT JOIN (((((apflora.ae_eigenschaften
     RIGHT JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.adresse ON ((ap.bearbeiter = adresse.id)))
     RIGHT JOIN apflora.assozart ON ((ap.id = assozart.ap_id))) ON (("ArtenDb_Arteigenschaften_1".id = assozart.ae_id)))
  ORDER BY ae_eigenschaften.artname;




CREATE VIEW apflora.v_auswapbearbmassninjahr0 AS
 SELECT adresse.name AS bearbeiter,
    ae_eigenschaften.artname,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    tpop.nr AS tpop_nr,
    tpop.gemeinde AS tpop_gemeinde,
    tpop.flurname AS tpop_flurname,
    tpopmassn.jahr,
    tpopmassn_typ_werte.text AS typ,
    tpopmassn.beschreibung,
    tpopmassn.datum,
    tpopmassn.bemerkungen,
    tpopmassn.plan_vorhanden,
    tpopmassn.plan_bezeichnung,
    tpopmassn.flaeche,
    tpopmassn.markierung,
    tpopmassn.anz_triebe,
    tpopmassn.anz_pflanzen,
    tpopmassn.anz_pflanzstellen,
    tpopmassn.wirtspflanze,
    tpopmassn.herkunft_pop,
    tpopmassn.sammeldatum,
    tpopmassn.form,
    tpopmassn.pflanzanordnung
   FROM ((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN ((apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN ((apflora.tpopmassn
     LEFT JOIN apflora.adresse ON ((tpopmassn.bearbeiter = adresse.id)))
     JOIN apflora.tpopmassn_typ_werte ON ((tpopmassn.typ = tpopmassn_typ_werte.code))) ON ((tpop.id = tpopmassn.tpop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3))
  ORDER BY adresse.name, ae_eigenschaften.artname, pop.nr, pop.name, tpop.nr, tpop.gemeinde, tpop.flurname;




CREATE VIEW apflora.v_beob AS
 SELECT beob.id,
    beob_quelle_werte.name AS quelle,
    beob.id_field,
    (beob.data ->> (( SELECT beob_1.id_field
           FROM apflora.beob beob_1
          WHERE (beob_1.id = beob2.id)))::text) AS "OriginalId",
    beob.art_id,
    ae_eigenschaften.artname AS "Artname",
    pop.id AS pop_id,
    pop.nr AS pop_nr,
    tpop.id AS tpop_id,
    tpop.nr AS tpop_nr,
    beob.x,
    beob.y,
        CASE
            WHEN ((beob.x > 0) AND (tpop.x > 0) AND (beob.y > 0) AND (tpop.y > 0)) THEN round(sqrt((power(((beob.x - tpop.x))::double precision, (2)::double precision) + power(((beob.y - tpop.y))::double precision, (2)::double precision))))
            ELSE NULL::double precision
        END AS distanz_zur_teilpopulation,
    beob.datum,
    beob.autor,
    beob.nicht_zuordnen,
    beob.bemerkungen,
    beob.changed,
    beob.changed_by
   FROM (((((apflora.beob
     JOIN apflora.beob beob2 ON ((beob2.id = beob.id)))
     JOIN (apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ap.art_id = ae_eigenschaften.id))) ON ((beob.art_id = ae_eigenschaften.id)))
     JOIN apflora.beob_quelle_werte ON ((beob.quelle_id = beob_quelle_werte.id)))
     LEFT JOIN apflora.tpop ON ((tpop.id = beob.tpop_id)))
     LEFT JOIN apflora.pop ON ((pop.id = tpop.pop_id)))
  WHERE (ae_eigenschaften.taxid > 150)
  ORDER BY ae_eigenschaften.artname, pop.nr, tpop.nr, beob.datum DESC;




CREATE VIEW apflora.v_beob__mit_data AS
 SELECT beob.id,
    beob_quelle_werte.name AS quelle,
    beob.id_field,
    (beob.data ->> (( SELECT beob_1.id_field
           FROM apflora.beob beob_1
          WHERE (beob_1.id = beob2.id)))::text) AS "OriginalId",
    beob.art_id,
    ae_eigenschaften.artname AS "Artname",
    pop.id AS pop_id,
    pop.nr AS pop_nr,
    tpop.id AS tpop_id,
    tpop.nr AS tpop_nr,
    beob.x,
    beob.y,
        CASE
            WHEN ((beob.x > 0) AND (tpop.x > 0) AND (beob.y > 0) AND (tpop.y > 0)) THEN round(sqrt((power(((beob.x - tpop.x))::double precision, (2)::double precision) + power(((beob.y - tpop.y))::double precision, (2)::double precision))))
            ELSE NULL::double precision
        END AS "Distanz zur Teilpopulation (m)",
    beob.datum,
    beob.autor,
    beob.nicht_zuordnen,
    beob.bemerkungen,
    beob.changed,
    beob.changed_by,
    beob.data AS "Originaldaten"
   FROM (((((apflora.beob
     JOIN apflora.beob beob2 ON ((beob2.id = beob.id)))
     JOIN (apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ap.art_id = ae_eigenschaften.id))) ON ((beob.art_id = ae_eigenschaften.id)))
     JOIN apflora.beob_quelle_werte ON ((beob.quelle_id = beob_quelle_werte.id)))
     LEFT JOIN apflora.tpop ON ((tpop.id = beob.tpop_id)))
     LEFT JOIN apflora.pop ON ((pop.id = tpop.pop_id)))
  WHERE (ae_eigenschaften.taxid > 150)
  ORDER BY ae_eigenschaften.artname, pop.nr, tpop.nr, beob.datum DESC;




CREATE VIEW apflora.v_ber AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    adresse.name AS ap_bearbeiter,
    ber.id,
    ber.autor,
    ber.jahr,
    ber.titel,
    ber.url,
    ber.changed,
    ber.changed_by
   FROM (((((apflora.ae_eigenschaften
     RIGHT JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.adresse ON ((ap.bearbeiter = adresse.id)))
     RIGHT JOIN apflora.ber ON ((ap.id = ber.ap_id)))
  ORDER BY ae_eigenschaften.artname;




CREATE VIEW apflora.v_bertpopfuerangezeigteap0 AS
 SELECT ap.id AS ap_id,
    pop.id AS pop_id,
    tpop.id AS tpop_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    pop_status_werte.text AS pop_status,
    pop.bekannt_seit,
    tpop.nr AS tpop_nr,
    tpop.gemeinde AS tpop_gemeinde,
    tpop.flurname AS tpop_flurname,
    tpop.x AS tpop_x,
    tpop.y AS tpop_y,
    tpop.bekannt_seit AS tpop_bekannt_seit,
    pop_status_werte_2.text AS tpop_status,
    tpop.apber_relevant
   FROM (((((apflora.ae_eigenschaften
     JOIN ((apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id)))
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ae_eigenschaften.id = ap.art_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     LEFT JOIN apflora.pop_status_werte pop_status_werte_2 ON ((tpop.status = pop_status_werte_2.code)));




CREATE VIEW apflora.v_datenstruktur AS
 SELECT tables.table_schema AS "Tabelle: Schema",
    tables.table_name AS "Tabelle: Name",
    public.dsql2((((('select count(*) from "'::text || (tables.table_schema)::text) || '"."'::text) || (tables.table_name)::text) || '"'::text)) AS "Tabelle: Anzahl Datensaetze",
    columns.column_name AS "Feld: Name",
    columns.column_default AS "Feld: Standardwert",
    columns.data_type AS "Feld: Datentyp",
    columns.is_nullable AS "Feld: Nullwerte"
   FROM (information_schema.tables
     JOIN information_schema.columns ON ((((tables.table_name)::text = (columns.table_name)::text) AND ((tables.table_schema)::text = (columns.table_schema)::text))))
  WHERE ((tables.table_schema)::text = 'apflora'::text)
  ORDER BY tables.table_schema, tables.table_name, columns.column_name;




CREATE VIEW apflora.v_erfkrit AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    adresse.name AS ap_bearbeiter,
    erfkrit.id,
    ap_erfkrit_werte.text AS beurteilung,
    erfkrit.kriterien,
    erfkrit.changed,
    erfkrit.changed_by
   FROM ((((((apflora.ae_eigenschaften
     RIGHT JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.adresse ON ((ap.bearbeiter = adresse.id)))
     RIGHT JOIN apflora.erfkrit ON ((ap.id = erfkrit.ap_id)))
     LEFT JOIN apflora.ap_erfkrit_werte ON ((erfkrit.erfolg = ap_erfkrit_werte.code)))
  ORDER BY ae_eigenschaften.artname;




CREATE VIEW apflora.v_exportevab_beob AS
SELECT
    NULL::uuid AS "fkZeitpunkt",
    NULL::uuid AS "idBeobachtung",
    NULL::uuid AS fkautor,
    NULL::uuid AS fkart,
    NULL::integer AS fkartgruppe,
    NULL::integer AS fkaa1,
    NULL::integer AS "fkAAINTRODUIT",
    NULL::integer AS "fkAAPRESENCE",
    NULL::text AS "MENACES",
    NULL::text AS "VITALITE_PLANTE",
    NULL::text AS "STATION",
    NULL::text AS "ABONDANCE",
    NULL::text AS "EXPERTISE_INTRODUIT",
    NULL::text AS "EXPERTISE_INTRODUITE_NOM";




CREATE VIEW apflora.v_tpopkontr_maxanzahl AS
 SELECT tpopkontr.id,
    max(tpopkontrzaehl.anzahl) AS anzahl
   FROM (apflora.tpopkontr
     JOIN apflora.tpopkontrzaehl ON ((tpopkontr.id = tpopkontrzaehl.tpopkontr_id)))
  GROUP BY tpopkontr.id
  ORDER BY tpopkontr.id;




CREATE VIEW apflora.v_exportevab_projekt AS
 SELECT ap.id AS "idProjekt",
    concat('AP Flora ZH: ', ae_eigenschaften.artname) AS "Name",
        CASE
            WHEN (ap.start_jahr IS NOT NULL) THEN concat('01.01.', ap.start_jahr)
            ELSE to_char((('now'::text)::date)::timestamp with time zone, 'DD.MM.YYYY'::text)
        END AS "Eroeffnung",
    '7c71b8af-df3e-4844-a83b-55735f80b993'::uuid AS "fkAutor",
    concat('Aktionsplan: ', ap_bearbstand_werte.text,
        CASE
            WHEN (ap.start_jahr IS NOT NULL) THEN concat('; Start im Jahr: ', ap.start_jahr)
            ELSE ''::text
        END,
        CASE
            WHEN (ap.umsetzung IS NOT NULL) THEN concat('; Stand Umsetzung: ', ap_umsetzung_werte.text)
            ELSE ''::text
        END, '') AS "Bemerkungen"
   FROM ((((apflora.ap
     JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     JOIN apflora.ae_eigenschaften ON ((ap.art_id = ae_eigenschaften.id)))
     JOIN ((apflora.pop
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     JOIN (apflora.tpop
     JOIN ((apflora.tpopkontr
     JOIN apflora.v_tpopkontr_maxanzahl ON ((v_tpopkontr_maxanzahl.id = tpopkontr.id)))
     LEFT JOIN apflora.adresse ON ((tpopkontr.bearbeiter = adresse.id))) ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((ae_eigenschaften.taxid > 150) AND (ae_eigenschaften.taxid < 1000000) AND (tpop.x IS NOT NULL) AND (tpop.y IS NOT NULL) AND ((tpopkontr.typ)::text = ANY (ARRAY[('Ausgangszustand'::character varying)::text, ('Zwischenbeurteilung'::character varying)::text, ('Freiwilligen-Erfolgskontrolle'::character varying)::text])) AND (tpop.status <> 201) AND (tpopkontr.bearbeiter IS NOT NULL) AND (tpopkontr.bearbeiter <> 'a1146ae4-4e03-4032-8aa8-bc46ba02f468'::uuid) AND (tpopkontr.jahr IS NOT NULL) AND ((tpopkontr.jahr)::double precision <> date_part('year'::text, ('now'::text)::date)) AND (tpop.bekannt_seit IS NOT NULL) AND ((tpop.status = ANY (ARRAY[100, 101])) OR ((tpopkontr.jahr - tpop.bekannt_seit) > 5)) AND (tpop.flurname IS NOT NULL))
  GROUP BY ae_eigenschaften.artname, ap.id, ap.start_jahr, ap.umsetzung, ap_bearbstand_werte.text, ap_umsetzung_werte.text;




CREATE VIEW apflora.v_exportevab_raum AS
 SELECT ap.id AS "fkProjekt",
    pop.id AS "idRaum",
    concat(pop.name,
        CASE
            WHEN (pop.nr IS NOT NULL) THEN concat(' (Nr. ', pop.nr, ')')
            ELSE ''::text
        END) AS "Name",
    to_char((('now'::text)::date)::timestamp with time zone, 'DD.MM.YYYY'::text) AS "Erfassungsdatum",
    '7c71b8af-df3e-4844-a83b-55735f80b993'::uuid AS "fkAutor",
        CASE
            WHEN (pop.status IS NOT NULL) THEN concat('Status: ', "popHerkunft".text,
            CASE
                WHEN (pop.bekannt_seit IS NOT NULL) THEN concat('; Bekannt seit: ', pop.bekannt_seit)
                ELSE ''::text
            END)
            ELSE ''::text
        END AS "Bemerkungen"
   FROM ((apflora.ap
     JOIN ((apflora.pop
     LEFT JOIN apflora.pop_status_werte "popHerkunft" ON ((pop.status = "popHerkunft".code)))
     JOIN (apflora.tpop
     JOIN ((apflora.tpopkontr
     JOIN apflora.v_tpopkontr_maxanzahl ON ((v_tpopkontr_maxanzahl.id = tpopkontr.id)))
     LEFT JOIN apflora.adresse ON ((tpopkontr.bearbeiter = adresse.id))) ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
     JOIN apflora.ae_eigenschaften ON ((ae_eigenschaften.id = ap.art_id)))
  WHERE ((ae_eigenschaften.taxid > 150) AND (ae_eigenschaften.taxid < 1000000) AND (tpop.x IS NOT NULL) AND (tpop.y IS NOT NULL) AND ((tpopkontr.typ)::text = ANY (ARRAY[('Ausgangszustand'::character varying)::text, ('Zwischenbeurteilung'::character varying)::text, ('Freiwilligen-Erfolgskontrolle'::character varying)::text])) AND (tpop.status <> 201) AND (tpopkontr.bearbeiter IS NOT NULL) AND (tpopkontr.bearbeiter <> 'a1146ae4-4e03-4032-8aa8-bc46ba02f468'::uuid) AND (tpopkontr.jahr IS NOT NULL) AND ((tpopkontr.jahr)::double precision <> date_part('year'::text, ('now'::text)::date)) AND (tpop.bekannt_seit IS NOT NULL) AND ((tpop.status = ANY (ARRAY[100, 101])) OR ((tpopkontr.jahr - tpop.bekannt_seit) > 5)) AND (tpop.flurname IS NOT NULL) AND (ap.id IN ( SELECT v_exportevab_projekt."idProjekt"
           FROM apflora.v_exportevab_projekt)))
  GROUP BY ap.id, pop.id, pop.name, pop.nr, pop.status, "popHerkunft".text, pop.bekannt_seit;




CREATE VIEW apflora.v_exportevab_ort AS
 SELECT tpop.id AS "TPopGuid",
    pop.id AS "fkRaum",
    tpop.id AS "idOrt",
    "substring"(concat(tpop.flurname,
        CASE
            WHEN (tpop.nr IS NOT NULL) THEN concat(' (Nr. ', tpop.nr, ')')
            ELSE ''::text
        END), 1, 40) AS "Name",
    to_char((('now'::text)::date)::timestamp with time zone, 'DD.MM.YYYY'::text) AS "Erfassungsdatum",
    '7c71b8af-df3e-4844-a83b-55735f80b993'::uuid AS "fkAutor",
    ("substring"(max((evab_typologie."TYPO")::text), 1, 9))::character varying(10) AS "fkLebensraumtyp",
    1 AS "fkGenauigkeitLage",
    1 AS "fkGeometryType",
        CASE
            WHEN (tpop.hoehe IS NOT NULL) THEN (tpop.hoehe)::integer
            ELSE 0
        END AS "obergrenzeHoehe",
    4 AS "fkGenauigkeitHoehe",
    tpop.x AS "X",
    tpop.y AS "Y",
    "substring"(tpop.gemeinde, 1, 25) AS "NOM_COMMUNE",
    "substring"(tpop.flurname, 1, 255) AS "DESC_LOCALITE",
    max(tpopkontr.lr_umgebung_delarze) AS "ENV",
        CASE
            WHEN (tpop.status IS NOT NULL) THEN concat('Status: ', pop_status_werte.text,
            CASE
                WHEN (tpop.bekannt_seit IS NOT NULL) THEN concat('; Bekannt seit: ', tpop.bekannt_seit)
                ELSE ''::text
            END)
            ELSE ''::text
        END AS "Bemerkungen"
   FROM ((apflora.ap
     JOIN (apflora.pop
     JOIN ((apflora.tpop
     LEFT JOIN apflora.pop_status_werte ON ((tpop.status = pop_status_werte.code)))
     JOIN (((apflora.tpopkontr
     JOIN apflora.v_tpopkontr_maxanzahl ON ((v_tpopkontr_maxanzahl.id = tpopkontr.id)))
     LEFT JOIN apflora.adresse ON ((tpopkontr.bearbeiter = adresse.id)))
     LEFT JOIN apflora.evab_typologie ON ((tpopkontr.lr_delarze = (evab_typologie."TYPO")::text))) ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
     JOIN apflora.ae_eigenschaften ON ((ae_eigenschaften.id = ap.art_id)))
  WHERE ((ae_eigenschaften.taxid > 150) AND (ae_eigenschaften.taxid < 1000000) AND (tpop.x IS NOT NULL) AND (tpop.y IS NOT NULL) AND ((tpopkontr.typ)::text = ANY (ARRAY[('Ausgangszustand'::character varying)::text, ('Zwischenbeurteilung'::character varying)::text, ('Freiwilligen-Erfolgskontrolle'::character varying)::text])) AND (tpop.status <> 201) AND (tpopkontr.bearbeiter IS NOT NULL) AND (tpopkontr.bearbeiter <> 'a1146ae4-4e03-4032-8aa8-bc46ba02f468'::uuid) AND (tpopkontr.jahr IS NOT NULL) AND ((tpopkontr.jahr)::double precision <> date_part('year'::text, ('now'::text)::date)) AND (tpop.bekannt_seit IS NOT NULL) AND ((tpop.status = ANY (ARRAY[100, 101])) OR ((tpopkontr.jahr - tpop.bekannt_seit) > 5)) AND (tpop.flurname IS NOT NULL) AND (ap.id IN ( SELECT v_exportevab_projekt."idProjekt"
           FROM apflora.v_exportevab_projekt)) AND (pop.id IN ( SELECT v_exportevab_raum."idRaum"
           FROM apflora.v_exportevab_raum)))
  GROUP BY pop.id, tpop.id, tpop.nr, tpop.bekannt_seit, tpop.flurname, tpop.status, pop_status_werte.text, tpop.hoehe, tpop.x, tpop.y, tpop.gemeinde;




CREATE VIEW apflora.v_exportevab_zeit AS
 SELECT tpop.id AS "fkOrt",
    tpopkontr.zeit_id AS "idZeitpunkt",
        CASE
            WHEN (tpopkontr.datum IS NOT NULL) THEN to_char((tpopkontr.datum)::timestamp with time zone, 'DD.MM.YYYY'::text)
            ELSE concat('01.01.', tpopkontr.jahr)
        END AS "Datum",
        CASE
            WHEN (tpopkontr.datum IS NOT NULL) THEN 'T'::character varying(10)
            ELSE 'J'::character varying(10)
        END AS "fkGenauigkeitDatum",
        CASE
            WHEN (tpopkontr.datum IS NOT NULL) THEN 'P'::character varying(10)
            ELSE 'X'::character varying(10)
        END AS "fkGenauigkeitDatumZDSF",
    "substring"((tpopkontr.moosschicht)::text, 1, 10) AS "COUV_MOUSSES",
    "substring"((tpopkontr.krautschicht)::text, 1, 10) AS "COUV_HERBACEES",
    "substring"(tpopkontr.strauchschicht, 1, 10) AS "COUV_BUISSONS",
    "substring"((tpopkontr.baumschicht)::text, 1, 10) AS "COUV_ARBRES"
   FROM ((apflora.ap
     JOIN (apflora.pop
     JOIN ((apflora.tpop
     LEFT JOIN apflora.pop_status_werte tpop_status_werte ON ((tpop.status = tpop_status_werte.code)))
     JOIN ((apflora.tpopkontr
     JOIN apflora.v_tpopkontr_maxanzahl ON ((v_tpopkontr_maxanzahl.id = tpopkontr.id)))
     LEFT JOIN apflora.adresse ON ((tpopkontr.bearbeiter = adresse.id))) ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
     JOIN apflora.ae_eigenschaften ON ((ae_eigenschaften.id = ap.art_id)))
  WHERE ((ae_eigenschaften.taxid > 150) AND (ae_eigenschaften.taxid < 1000000) AND (tpop.x IS NOT NULL) AND (tpop.y IS NOT NULL) AND ((tpopkontr.typ)::text = ANY (ARRAY[('Ausgangszustand'::character varying)::text, ('Zwischenbeurteilung'::character varying)::text, ('Freiwilligen-Erfolgskontrolle'::character varying)::text])) AND (tpop.status <> 201) AND (tpopkontr.bearbeiter IS NOT NULL) AND (tpopkontr.bearbeiter <> 'a1146ae4-4e03-4032-8aa8-bc46ba02f468'::uuid) AND (tpopkontr.jahr IS NOT NULL) AND ((tpopkontr.jahr)::double precision <> date_part('year'::text, ('now'::text)::date)) AND (tpop.bekannt_seit IS NOT NULL) AND ((tpop.status = ANY (ARRAY[100, 101])) OR ((tpopkontr.jahr - tpop.bekannt_seit) > 5)) AND (tpop.flurname IS NOT NULL) AND (ap.id IN ( SELECT v_exportevab_projekt."idProjekt"
           FROM apflora.v_exportevab_projekt)) AND (pop.id IN ( SELECT v_exportevab_raum."idRaum"
           FROM apflora.v_exportevab_raum)) AND (tpop.id IN ( SELECT v_exportevab_ort."idOrt"
           FROM apflora.v_exportevab_ort)));




CREATE VIEW apflora.v_idealbiotop AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    adresse.name AS ap_bearbeiter,
    ap.changed AS ap_changed,
    ap.changed_by AS ap_changed_by,
    idealbiotop.erstelldatum,
    idealbiotop.hoehenlage,
    idealbiotop.region,
    idealbiotop.exposition,
    idealbiotop.besonnung,
    idealbiotop.hangneigung,
    idealbiotop.boden_typ,
    idealbiotop.boden_kalkgehalt,
    idealbiotop.boden_durchlaessigkeit,
    idealbiotop.boden_humus,
    idealbiotop.boden_naehrstoffgehalt,
    idealbiotop.wasserhaushalt,
    idealbiotop.konkurrenz,
    idealbiotop.moosschicht,
    idealbiotop.krautschicht,
    idealbiotop.strauchschicht,
    idealbiotop.baumschicht,
    idealbiotop.bemerkungen,
    idealbiotop.changed,
    idealbiotop.changed_by
   FROM (apflora.idealbiotop
     LEFT JOIN ((((apflora.ae_eigenschaften
     RIGHT JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.adresse ON ((ap.bearbeiter = adresse.id))) ON ((idealbiotop.ap_id = ap.id)))
  ORDER BY ae_eigenschaften.artname, idealbiotop.erstelldatum;




CREATE VIEW apflora.v_kontrzaehl_anzproeinheit AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    apflora_adresse_1.name AS ap_bearbeiter,
    pop.id AS pop_id,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    pop_status_werte.text AS pop_status,
    pop.bekannt_seit AS pop_bekannt_seit,
    tpop.id AS tpop_id,
    tpop.nr AS tpop_nr,
    tpop.gemeinde AS tpop_gemeinde,
    tpop.flurname AS tpop_flurname,
    tpop_status_werte.text AS tpop_status,
    tpop.bekannt_seit AS tpop_bekannt_seit,
    tpop.status_unklar AS tpop_status_unklar,
    tpop.status_unklar_grund AS tpop_status_unklar_grund,
    tpop.x AS tpop_x,
    tpop.y AS tpop_y,
    tpop.radius AS tpop_radius_m,
    tpop.hoehe AS tpop_hoehe,
    tpop.exposition AS tpop_exposition,
    tpop.klima AS tpop_klima,
    tpop.neigung AS tpop_neigung,
    tpop.beschreibung AS tpop_beschreibung,
    tpop.kataster_nr AS tpop_kataster_nr,
    tpop.apber_relevant AS tpop_apber_relevant,
    tpop.eigentuemer AS tpop_eigentuemer,
    tpop.kontakt AS tpop_kontakt,
    tpop.nutzungszone AS tpop_nutzungszone,
    tpop.bewirtschafter AS tpop_bewirtschafter,
    tpop.bewirtschaftung AS tpop_bewirtschaftung,
    tpopkontr.id AS kontr_id,
    tpopkontr.jahr AS kontr_jahr,
    tpopkontr.datum AS kontr_datum,
    tpopkontr_typ_werte.text AS kontr_typ,
    adresse.name AS kontr_bearbeiter,
    tpopkontr.ueberlebensrate AS kontr_ueberlebensrate,
    tpopkontr.vitalitaet AS kontr_vitalitaet,
    tpop_entwicklung_werte.text AS kontr_entwicklung,
    tpopkontr.ursachen AS kontr_ursachen,
    tpopkontr.erfolgsbeurteilung AS kontr_erfolgsbeurteilung,
    tpopkontr.umsetzung_aendern AS kontr_umsetzung_aendern,
    tpopkontr.kontrolle_aendern AS kontr_kontrolle_aendern,
    tpopkontr.bemerkungen AS kontr_bemerkungen,
    tpopkontr.lr_delarze AS kontr_lr_delarze,
    tpopkontr.lr_umgebung_delarze AS kontr_lr_umgebung_delarze,
    tpopkontr.vegetationstyp AS kontr_vegetationstyp,
    tpopkontr.konkurrenz AS kontr_konkurrenz,
    tpopkontr.moosschicht AS kontr_moosschicht,
    tpopkontr.krautschicht AS kontr_krautschicht,
    tpopkontr.strauchschicht AS kontr_strauchschicht,
    tpopkontr.baumschicht AS kontr_baumschicht,
    tpopkontr.boden_typ AS kontr_boden_typ,
    tpopkontr.boden_kalkgehalt AS kontr_boden_kalkgehalt,
    tpopkontr.boden_durchlaessigkeit AS kontr_boden_durchlaessigkeit,
    tpopkontr.boden_humus AS kontr_boden_humus,
    tpopkontr.boden_naehrstoffgehalt AS kontr_boden_naehrstoffgehalt,
    tpopkontr.boden_abtrag AS kontr_boden_abtrag,
    tpopkontr.wasserhaushalt AS kontr_wasserhaushalt,
    tpopkontr_idbiotuebereinst_werte.text AS kontr_idealbiotop_uebereinstimmung,
    tpopkontr.handlungsbedarf AS kontr_handlungsbedarf,
    tpopkontr.flaeche_ueberprueft AS kontr_flaeche_ueberprueft,
    tpopkontr.flaeche AS kontr_flaeche,
    tpopkontr.plan_vorhanden AS kontr_plan_vorhanden,
    tpopkontr.deckung_vegetation AS kontr_deckung_vegetation,
    tpopkontr.deckung_nackter_boden AS kontr_deckung_nackter_boden,
    tpopkontr.deckung_ap_art AS kontr_deckung_ap_art,
    tpopkontr.jungpflanzen_vorhanden AS kontr_jungpflanzen_vorhanden,
    tpopkontr.vegetationshoehe_maximum AS kontr_vegetationshoehe_maximum,
    tpopkontr.vegetationshoehe_mittel AS kontr_vegetationshoehe_mittel,
    tpopkontr.gefaehrdung AS kontr_gefaehrdung,
    tpopkontr.changed AS kontr_changed,
    tpopkontr.changed_by AS kontr_changed_by,
    tpopkontrzaehl.id,
    tpopkontrzaehl_einheit_werte.text AS einheit,
    tpopkontrzaehl_methode_werte.text AS methode,
    tpopkontrzaehl.anzahl
   FROM (apflora.ae_eigenschaften
     JOIN ((((apflora.ap
     LEFT JOIN apflora.adresse apflora_adresse_1 ON ((ap.bearbeiter = apflora_adresse_1.id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     JOIN ((apflora.pop
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     JOIN ((apflora.tpop
     LEFT JOIN apflora.pop_status_werte tpop_status_werte ON ((tpop_status_werte.code = tpop.status)))
     JOIN (((((apflora.tpopkontr
     LEFT JOIN apflora.tpopkontr_idbiotuebereinst_werte ON ((tpopkontr.idealbiotop_uebereinstimmung = tpopkontr_idbiotuebereinst_werte.code)))
     LEFT JOIN apflora.tpopkontr_typ_werte ON (((tpopkontr.typ)::text = (tpopkontr_typ_werte.text)::text)))
     LEFT JOIN apflora.adresse ON ((tpopkontr.bearbeiter = adresse.id)))
     LEFT JOIN apflora.tpop_entwicklung_werte ON ((tpopkontr.entwicklung = tpop_entwicklung_werte.code)))
     LEFT JOIN ((apflora.tpopkontrzaehl
     LEFT JOIN apflora.tpopkontrzaehl_einheit_werte ON ((tpopkontrzaehl.einheit = tpopkontrzaehl_einheit_werte.code)))
     LEFT JOIN apflora.tpopkontrzaehl_methode_werte ON ((tpopkontrzaehl.methode = tpopkontrzaehl_methode_werte.code))) ON ((tpopkontr.id = tpopkontrzaehl.tpopkontr_id))) ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id))) ON ((ae_eigenschaften.id = ap.art_id)))
  WHERE (ae_eigenschaften.taxid > 150)
  ORDER BY ae_eigenschaften.artname, pop.nr, tpop.nr, tpopkontr.jahr, tpopkontr.datum;




CREATE VIEW apflora.v_massn AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.familie,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    pop.id AS pop_id,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    pop_status_werte.text AS pop_status,
    pop.bekannt_seit AS pop_bekannt_seit,
    pop.status_unklar AS pop_status_unklar,
    pop.status_unklar_begruendung AS pop_status_unklar_begruendung,
    pop.x AS pop_x,
    pop.y AS pop_y,
    tpop.id AS tpop_id,
    tpop.nr AS tpop_nr,
    tpop.gemeinde AS tpop_gemeinde,
    tpop.flurname AS tpop_flurname,
    pop_status_werte_2.text AS tpop_status,
    tpop.bekannt_seit AS tpop_bekannt_seit,
    tpop.status_unklar AS tpop_status_unklar,
    tpop.status_unklar_grund AS tpop_status_unklar_grund,
    tpop.x AS tpop_x,
    tpop.y AS tpop_y,
    tpop.radius AS tpop_radius,
    tpop.hoehe AS tpop_hoehe,
    tpop.exposition AS tpop_exposition,
    tpop.klima AS tpop_klima,
    tpop.neigung AS tpop_neigung,
    tpop.beschreibung AS tpop_beschreibung,
    tpop.kataster_nr AS tpop_kataster_nr,
    tpop.apber_relevant AS tpop_apber_relevant,
    tpop.eigentuemer AS tpop_eigentuemer,
    tpop.kontakt AS tpop_kontakt,
    tpop.nutzungszone AS tpop_nutzungszone,
    tpop.bewirtschafter AS tpop_bewirtschafter,
    tpop.bewirtschaftung AS tpop_bewirtschaftung,
    tpopmassn.id,
    tpopmassn.jahr,
    tpopmassn.datum,
    tpopmassn_typ_werte.text AS typ,
    tpopmassn.beschreibung,
    adresse.name AS bearbeiter,
    tpopmassn.bemerkungen,
    tpopmassn.plan_vorhanden,
    tpopmassn.plan_bezeichnung,
    tpopmassn.flaeche,
    tpopmassn.form,
    tpopmassn.pflanzanordnung,
    tpopmassn.markierung,
    tpopmassn.anz_triebe,
    tpopmassn.anz_pflanzen,
    tpopmassn.anz_pflanzstellen,
    tpopmassn.wirtspflanze,
    tpopmassn.herkunft_pop,
    tpopmassn.sammeldatum,
    tpopmassn.changed,
    tpopmassn.changed_by
   FROM (((((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN ((apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN (apflora.tpopmassn
     LEFT JOIN apflora.tpopmassn_typ_werte ON ((tpopmassn.typ = tpopmassn_typ_werte.code))) ON ((tpop.id = tpopmassn.tpop_id))) ON ((ap.id = pop.ap_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     LEFT JOIN apflora.pop_status_werte pop_status_werte_2 ON ((tpop.status = pop_status_werte_2.code)))
     LEFT JOIN apflora.adresse ON ((tpopmassn.bearbeiter = adresse.id)))
  WHERE (ae_eigenschaften.taxid > 150)
  ORDER BY ae_eigenschaften.artname, pop.nr, tpop.nr, tpopmassn.jahr, tpopmassn.datum, tpopmassn_typ_werte.text;




CREATE VIEW apflora.v_massn_fuergis_read AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    (pop.id)::character varying(50) AS pop_id,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    pop_status_werte.text AS pop_status,
    pop.bekannt_seit AS pop_bekannt_seit,
    pop.x AS pop_x,
    pop.y AS pop_y,
    (tpop.id)::character varying(50) AS tpop_id,
    tpop.nr AS tpop_nr,
    tpop.gemeinde AS tpop_gemeinde,
    tpop.flurname AS tpop_flurname,
    pop_status_werte_2.text AS tpop_status,
    tpop.status_unklar AS tpop_status_unklar,
    tpop.status_unklar_grund AS tpop_status_unklar_grund,
    tpop.x AS tpop_x,
    tpop.y AS tpop_y,
    tpop.radius AS tpop_radius,
    tpop.hoehe AS tpop_hoehe,
    tpop.exposition AS tpop_exposition,
    tpop.klima AS tpop_klima,
    tpop.neigung AS tpop_neigung,
    tpop.beschreibung AS tpop_beschreibung,
    tpop.kataster_nr AS tpop_kataster_nr,
    adresse.name AS tpop_bearbeiter,
    tpop.apber_relevant AS tpop_apber_relevant,
    tpop.bekannt_seit AS tpop_bekannt_seit,
    tpop.eigentuemer AS tpop_eigentuemer,
    tpop.kontakt AS tpop_kontakt,
    tpop.nutzungszone AS tpop_nutzungszone,
    tpop.bewirtschafter AS tpop_bewirtschafter,
    tpop.bewirtschaftung AS tpop_bewirtschaftung,
    (tpopmassn.id)::character varying(50) AS massn_id,
    tpopmassn.jahr AS massn_jahr,
    (tpopmassn.datum)::timestamp without time zone AS massn_datum,
    tpopmassn_typ_werte.text AS massn_typ,
    tpopmassn.beschreibung AS massn_beschreibung,
    adresse.name AS massn_bearbeiter,
    tpopmassn.plan_vorhanden AS massn_plan_vorhanden,
    tpopmassn.plan_bezeichnung AS massn_plan_bezeichnung,
    tpopmassn.flaeche AS massn_flaeche,
    tpopmassn.form AS massn_form,
    tpopmassn.pflanzanordnung AS massn_pflanzanordnung,
    tpopmassn.markierung AS massn_markierung,
    tpopmassn.anz_triebe AS massn_anz_triebe,
    tpopmassn.anz_pflanzen AS massn_anz_pflanzen,
    tpopmassn.anz_pflanzstellen AS massn_anz_pflanzstellen,
    tpopmassn.wirtspflanze AS massn_wirtspflanze,
    tpopmassn.herkunft_pop AS massn_herkunft_pop,
    tpopmassn.sammeldatum AS massn_sammeldatum,
    (tpopmassn.changed)::timestamp without time zone AS massn_changed,
    tpopmassn.changed_by AS massn_changed_by
   FROM (((((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN ((apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN (apflora.tpopmassn
     LEFT JOIN apflora.tpopmassn_typ_werte ON ((tpopmassn.typ = tpopmassn_typ_werte.code))) ON ((tpop.id = tpopmassn.tpop_id))) ON ((ap.id = pop.ap_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     LEFT JOIN apflora.pop_status_werte pop_status_werte_2 ON ((tpop.status = pop_status_werte_2.code)))
     LEFT JOIN apflora.adresse ON ((tpopmassn.bearbeiter = adresse.id)))
  ORDER BY ae_eigenschaften.artname, pop.nr, tpop.nr, tpopmassn.jahr, tpopmassn.datum, tpopmassn_typ_werte.text;




CREATE VIEW apflora.v_massn_fuergis_write AS
 SELECT tpopmassn.tpop_id,
    (tpopmassn.id)::character varying(50) AS massn_id,
    tpopmassn.typ AS massn_typ,
    tpopmassn.jahr AS massn_jahr,
    (tpopmassn.datum)::timestamp without time zone AS massn_datum,
    tpopmassn.bearbeiter AS massn_bearbeiter,
    tpopmassn.beschreibung AS massn_beschreibung,
    tpopmassn.plan_vorhanden AS massn_plan_vorhanden,
    tpopmassn.plan_bezeichnung AS massn_plan_bezeichnung,
    tpopmassn.flaeche AS massn_flaeche,
    tpopmassn.form AS massn_form,
    tpopmassn.pflanzanordnung AS massn_pflanzanordnung,
    tpopmassn.markierung AS massn_markierung,
    tpopmassn.anz_triebe AS massn_anz_triebe,
    tpopmassn.anz_pflanzen AS massn_anz_pflanzen,
    tpopmassn.anz_pflanzstellen AS massn_anz_pflanzstellen,
    tpopmassn.wirtspflanze AS massn_wirtspflanze,
    tpopmassn.herkunft_pop AS massn_herkunft_pop,
    tpopmassn.sammeldatum AS massn_sammeldatum,
    tpopmassn.bemerkungen AS massn_bemerkungen,
    (tpopmassn.changed)::timestamp without time zone AS massn_changed,
    tpopmassn.changed_by AS massn_changed_by
   FROM apflora.tpopmassn;




CREATE VIEW apflora.v_massn_webgisbun AS
 SELECT ap.id AS "APARTID",
    ae_eigenschaften.artname AS "APART",
    pop.id AS "POPGUID",
    pop.nr AS "POPNR",
    tpop.id AS "TPOPGUID",
    tpop.nr AS "TPOPNR",
    tpop.x AS "TPOP_X",
    tpop.y AS "TPOP_Y",
    pop_status_werte_2.text AS "TPOPSTATUS",
    tpopmassn.id AS "MASSNGUID",
    tpopmassn.jahr AS "MASSNJAHR",
    to_char((tpopmassn.datum)::timestamp with time zone, 'DD.MM.YY'::text) AS "MASSNDAT",
    tpopmassn_typ_werte.text AS "MASSTYP",
    tpopmassn.beschreibung AS "MASSNMASSNAHME",
    adresse.name AS "MASSNBEARBEITER",
    (tpopmassn.bemerkungen)::character(1) AS "MASSNBEMERKUNG",
    tpopmassn.plan_vorhanden AS "MASSNPLAN",
    tpopmassn.plan_bezeichnung AS "MASSPLANBEZ",
    tpopmassn.flaeche AS "MASSNFLAECHE",
    tpopmassn.form AS "MASSNFORMANSIEDL",
    tpopmassn.pflanzanordnung AS "MASSNPFLANZANORDNUNG",
    tpopmassn.markierung AS "MASSNMARKIERUNG",
    tpopmassn.anz_triebe AS "MASSNANZTRIEBE",
    tpopmassn.anz_pflanzen AS "MASSNANZPFLANZEN",
    tpopmassn.anz_pflanzstellen AS "MASSNANZPFLANZSTELLEN",
    tpopmassn.wirtspflanze AS "MASSNWIRTSPFLANZEN",
    tpopmassn.herkunft_pop AS "MASSNHERKUNFTSPOP",
    tpopmassn.sammeldatum AS "MASSNSAMMELDAT",
    to_char((tpopmassn.changed)::timestamp with time zone, 'DD.MM.YY'::text) AS "MASSNCHANGEDAT",
    tpopmassn.changed_by AS "MASSNCHANGEBY"
   FROM (((((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN ((apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN (apflora.tpopmassn
     LEFT JOIN apflora.tpopmassn_typ_werte ON ((tpopmassn.typ = tpopmassn_typ_werte.code))) ON ((tpop.id = tpopmassn.tpop_id))) ON ((ap.id = pop.ap_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     LEFT JOIN apflora.pop_status_werte pop_status_werte_2 ON ((tpop.status = pop_status_werte_2.code)))
     LEFT JOIN apflora.adresse ON ((tpopmassn.bearbeiter = adresse.id)))
  WHERE (ae_eigenschaften.taxid > 150)
  ORDER BY ae_eigenschaften.artname, pop.nr, tpop.nr, tpopmassn.jahr, tpopmassn.datum, tpopmassn_typ_werte.text;




CREATE VIEW apflora.v_pop AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    pop.id,
    pop.nr,
    pop.name,
    pop_status_werte.text AS status,
    pop.bekannt_seit,
    pop.status_unklar,
    pop.status_unklar_begruendung,
    pop.x,
    pop.y,
    pop.changed,
    pop.changed_by
   FROM (apflora.ae_eigenschaften
     JOIN (((apflora.ap
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     JOIN (apflora.pop
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code))) ON ((ap.id = pop.ap_id))) ON ((ae_eigenschaften.id = ap.art_id)))
  ORDER BY ae_eigenschaften.artname, pop.nr;




CREATE VIEW apflora.v_pop_anzkontr AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    pop.id,
    pop.nr,
    pop.name,
    pop_status_werte.text AS status,
    pop.bekannt_seit,
    pop.status_unklar,
    pop.status_unklar_begruendung,
    pop.x,
    pop.y,
    count(tpopkontr.id) AS anzahl_kontrollen
   FROM (((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN ((apflora.pop
     LEFT JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     LEFT JOIN apflora.tpopkontr ON ((tpop.id = tpopkontr.tpop_id))) ON ((ap.id = pop.ap_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
  GROUP BY ap.id, ae_eigenschaften.artname, ap_bearbstand_werte.text, ap.start_jahr, ap_umsetzung_werte.text, pop.id, pop.nr, pop.name, pop_status_werte.text, pop.status_unklar, pop.status_unklar_begruendung, pop.bekannt_seit, pop.x, pop.y
  ORDER BY ae_eigenschaften.artname, pop.nr;




CREATE VIEW apflora.v_pop_anzmassn AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    pop.id,
    pop.nr,
    pop.name,
    pop_status_werte.text AS status,
    pop.bekannt_seit,
    pop.status_unklar,
    pop.status_unklar_begruendung,
    pop.x,
    pop.y,
    count(tpopmassn.id) AS anzahl_massnahmen
   FROM (((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN ((apflora.pop
     LEFT JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     LEFT JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id))) ON ((ap.id = pop.ap_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
  GROUP BY ap.id, ae_eigenschaften.artname, ap_bearbstand_werte.text, ap.start_jahr, ap_umsetzung_werte.text, pop.id, pop.nr, pop.name, pop_status_werte.text, pop.status_unklar, pop.status_unklar_begruendung, pop.bekannt_seit, pop.x, pop.y
  ORDER BY ae_eigenschaften.artname, pop.nr;




CREATE VIEW apflora.v_tpop_berjahrundmassnjahr AS
 SELECT tpop.id,
    tpopber.jahr
   FROM (apflora.tpop
     JOIN apflora.tpopber ON ((tpop.id = tpopber.tpop_id)))
UNION
 SELECT tpop.id,
    tpopmassnber.jahr
   FROM (apflora.tpop
     JOIN apflora.tpopmassnber ON ((tpop.id = tpopmassnber.tpop_id)))
  ORDER BY 2;




CREATE VIEW apflora.v_pop_berjahrundmassnjahrvontpop AS
 SELECT tpop.pop_id,
    v_tpop_berjahrundmassnjahr.jahr
   FROM (apflora.v_tpop_berjahrundmassnjahr
     JOIN apflora.tpop ON ((v_tpop_berjahrundmassnjahr.id = tpop.id)))
  GROUP BY tpop.pop_id, v_tpop_berjahrundmassnjahr.jahr;




CREATE VIEW apflora.v_pop_berundmassnjahre AS
 SELECT pop.id,
    popber.jahr
   FROM (apflora.pop
     JOIN apflora.popber ON ((pop.id = popber.pop_id)))
UNION
 SELECT pop.id,
    popmassnber.jahr
   FROM (apflora.pop
     JOIN apflora.popmassnber ON ((pop.id = popmassnber.pop_id)))
  ORDER BY 2;




CREATE VIEW apflora.v_pop_fuergis_read AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    (pop.id)::text AS id,
    pop.nr,
    pop.name,
    pop_status_werte.text AS status,
    pop.bekannt_seit,
    pop.status_unklar,
    pop.status_unklar_begruendung,
    pop.x,
    pop.y,
    (pop.changed)::timestamp without time zone AS changed,
    pop.changed_by
   FROM (((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN apflora.pop ON ((ap.id = pop.ap_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
  WHERE ((pop.x > 0) AND (pop.y > 0))
  ORDER BY ae_eigenschaften.artname, pop.nr;




CREATE VIEW apflora.v_pop_fuergis_write AS
 SELECT (pop.ap_id)::text AS ap_id,
    (pop.id)::text AS id,
    pop.nr,
    pop.name,
    pop.status,
    pop.status_unklar,
    pop.status_unklar_begruendung,
    pop.bekannt_seit,
    pop.x,
    pop.y,
    (pop.changed)::timestamp without time zone AS changed,
    pop.changed_by
   FROM apflora.pop;




CREATE VIEW apflora.v_pop_kml AS
 SELECT ae_eigenschaften.artname AS "Art",
    pop.nr AS "Label",
    "substring"(concat('Population: ', pop.nr, ' ', pop.name), 1, 225) AS "Inhalte",
    round(((((((2.6779094 + (4.728982 * (((pop.x - 600000))::numeric / (1000000)::numeric))) + ((0.791484 * (((pop.x - 600000))::numeric / (1000000)::numeric)) * (((pop.y - 200000))::numeric / (1000000)::numeric))) + (((0.1306 * (((pop.x - 600000))::numeric / (1000000)::numeric)) * (((pop.y - 200000))::numeric / (1000000)::numeric)) * (((pop.y - 200000))::numeric / (1000000)::numeric))) - (((0.0436 * (((pop.x - 600000))::numeric / (1000000)::numeric)) * (((pop.x - 600000))::numeric / (1000000)::numeric)) * (((pop.x - 600000))::numeric / (1000000)::numeric))) * (100)::numeric) / (36)::numeric), 10) AS "Laengengrad",
    round((((((((16.9023892 + (3.238272 * (((pop.y - 200000))::numeric / (1000000)::numeric))) - ((0.270978 * (((pop.x - 600000))::numeric / (1000000)::numeric)) * (((pop.x - 600000))::numeric / (1000000)::numeric))) - ((0.002528 * (((pop.y - 200000))::numeric / (1000000)::numeric)) * (((pop.y - 200000))::numeric / (1000000)::numeric))) - (((0.0447 * (((pop.x - 600000))::numeric / (1000000)::numeric)) * (((pop.x - 600000))::numeric / (1000000)::numeric)) * (((pop.y - 200000))::numeric / (1000000)::numeric))) - (((0.014 * (((pop.y - 200000))::numeric / (1000000)::numeric)) * (((pop.y - 200000))::numeric / (1000000)::numeric)) * (((pop.y - 200000))::numeric / (1000000)::numeric))) * (100)::numeric) / (36)::numeric), 10) AS "Breitengrad",
    concat('http://www.apflora.ch/Projekte/4635372c-431c-11e8-bb30-e77f6cdd35a6/Aktionspläne/', ap.id, '/Populationen/', pop.id) AS url
   FROM (apflora.ae_eigenschaften
     JOIN (apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id))) ON ((ae_eigenschaften.id = ap.art_id)))
  WHERE ((pop.y IS NOT NULL) AND (pop.y IS NOT NULL))
  ORDER BY ae_eigenschaften.artname, pop.nr, pop.name;




CREATE VIEW apflora.v_pop_kmlnamen AS
 SELECT ae_eigenschaften.artname AS "Art",
    concat(ae_eigenschaften.artname, ' ', pop.nr) AS "Label",
    "substring"(concat('Population: ', pop.nr, ' ', pop.name), 1, 225) AS "Inhalte",
    round(((((((2.6779094 + (4.728982 * (((pop.x - 600000))::numeric / (1000000)::numeric))) + ((0.791484 * (((pop.x - 600000))::numeric / (1000000)::numeric)) * (((pop.y - 200000))::numeric / (1000000)::numeric))) + (((0.1306 * (((pop.x - 600000))::numeric / (1000000)::numeric)) * (((pop.y - 200000))::numeric / (1000000)::numeric)) * (((pop.y - 200000))::numeric / (1000000)::numeric))) - (((0.0436 * (((pop.x - 600000))::numeric / (1000000)::numeric)) * (((pop.x - 600000))::numeric / (1000000)::numeric)) * (((pop.x - 600000))::numeric / (1000000)::numeric))) * (100)::numeric) / (36)::numeric), 10) AS "Laengengrad",
    round((((((((16.9023892 + (3.238272 * (((pop.y - 200000))::numeric / (1000000)::numeric))) - ((0.270978 * (((pop.x - 600000))::numeric / (1000000)::numeric)) * (((pop.x - 600000))::numeric / (1000000)::numeric))) - ((0.002528 * (((pop.y - 200000))::numeric / (1000000)::numeric)) * (((pop.y - 200000))::numeric / (1000000)::numeric))) - (((0.0447 * (((pop.x - 600000))::numeric / (1000000)::numeric)) * (((pop.x - 600000))::numeric / (1000000)::numeric)) * (((pop.y - 200000))::numeric / (1000000)::numeric))) - (((0.014 * (((pop.y - 200000))::numeric / (1000000)::numeric)) * (((pop.y - 200000))::numeric / (1000000)::numeric)) * (((pop.y - 200000))::numeric / (1000000)::numeric))) * (100)::numeric) / (36)::numeric), 10) AS "Breitengrad",
    concat('http://www.apflora.ch/Projekte/4635372c-431c-11e8-bb30-e77f6cdd35a6/Aktionspläne/', ap.id, '/Populationen/', pop.id) AS url
   FROM (apflora.ae_eigenschaften
     JOIN (apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id))) ON ((ae_eigenschaften.id = ap.art_id)))
  WHERE ((pop.y IS NOT NULL) AND (pop.y IS NOT NULL))
  ORDER BY ae_eigenschaften.artname, pop.nr, pop.name;




CREATE VIEW apflora.v_pop_letzterpopber0_overall AS
 SELECT popber.pop_id,
    max(popber.jahr) AS jahr
   FROM apflora.popber
  WHERE (popber.jahr IS NOT NULL)
  GROUP BY popber.pop_id;




CREATE VIEW apflora.v_pop_letzterpopber_overall AS
 SELECT pop.ap_id,
    pop.id,
    v_pop_letzterpopber0_overall.jahr
   FROM ((apflora.pop
     JOIN apflora.v_pop_letzterpopber0_overall ON ((pop.id = v_pop_letzterpopber0_overall.pop_id)))
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((tpop.apber_relevant = 1) AND (pop.status <> 300))
  GROUP BY pop.ap_id, pop.id, v_pop_letzterpopber0_overall.jahr;




CREATE VIEW apflora.v_pop_letzterpopbermassn AS
 SELECT popmassnber.pop_id AS id,
    max(popmassnber.jahr) AS jahr
   FROM apflora.popmassnber
  WHERE (popmassnber.jahr IS NOT NULL)
  GROUP BY popmassnber.pop_id;




CREATE VIEW apflora.v_pop_massnseitbeginnap AS
 SELECT tpopmassn.tpop_id
   FROM (apflora.ap
     JOIN ((apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id))) ON ((ap.id = pop.ap_id)))
  WHERE (tpopmassn.jahr >= ap.start_jahr)
  GROUP BY tpopmassn.tpop_id;




CREATE VIEW apflora.v_pop_mit_letzter_popber AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_status,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    pop.id AS pop_id,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    pop_status_werte.text AS pop_status,
    pop.bekannt_seit AS pop_bekannt_seit,
    pop.status_unklar AS pop_status_unklar,
    pop.status_unklar_begruendung AS pop_status_unklar_begruendung,
    pop.x AS pop_x,
    pop.y AS pop_y,
    pop.changed AS pop_changed,
    pop.changed_by AS pop_changed_by,
    popber.id AS popber_id,
    popber.jahr AS popber_jahr,
    tpop_entwicklung_werte.text AS popber_entwicklung,
    popber.bemerkungen AS popber_bemerkungen,
    popber.changed AS popber_changed,
    popber.changed_by AS popber_changed_by
   FROM (apflora.ae_eigenschaften
     JOIN (((apflora.ap
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     JOIN ((apflora.pop
     LEFT JOIN (apflora.v_pop_letzterpopber0_overall
     LEFT JOIN (apflora.popber
     LEFT JOIN apflora.tpop_entwicklung_werte ON ((popber.entwicklung = tpop_entwicklung_werte.code))) ON (((v_pop_letzterpopber0_overall.jahr = popber.jahr) AND (v_pop_letzterpopber0_overall.pop_id = popber.pop_id)))) ON ((pop.id = v_pop_letzterpopber0_overall.pop_id)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code))) ON ((ap.id = pop.ap_id))) ON ((ae_eigenschaften.id = ap.art_id)))
  WHERE (ae_eigenschaften.taxid > 150)
  ORDER BY ae_eigenschaften.artname, pop.nr, v_pop_letzterpopber0_overall.jahr;




CREATE VIEW apflora.v_pop_mit_letzter_popmassnber AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_status,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    pop.id AS pop_id,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    pop_status_werte.text AS pop_status,
    pop.bekannt_seit AS pop_bekannt_seit,
    pop.status_unklar AS pop_status_unklar,
    pop.status_unklar_begruendung AS pop_status_unklar_begruendung,
    pop.x AS pop_x,
    pop.y AS pop_y,
    pop.changed AS pop_changed,
    pop.changed_by AS pop_changed_by,
    popmassnber.id AS popmassnber_id,
    popmassnber.jahr AS popmassnber_jahr,
    tpopmassn_erfbeurt_werte.text AS popmassnber_entwicklung,
    popmassnber.bemerkungen AS popmassnber_bemerkungen,
    popmassnber.changed AS popmassnber_changed,
    popmassnber.changed_by AS popmassnber_changed_by
   FROM (apflora.ae_eigenschaften
     JOIN (((apflora.ap
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     JOIN ((apflora.pop
     LEFT JOIN (apflora.v_pop_letzterpopbermassn
     LEFT JOIN (apflora.popmassnber
     LEFT JOIN apflora.tpopmassn_erfbeurt_werte ON ((popmassnber.beurteilung = tpopmassn_erfbeurt_werte.code))) ON (((v_pop_letzterpopbermassn.jahr = popmassnber.jahr) AND (v_pop_letzterpopbermassn.id = popmassnber.pop_id)))) ON ((pop.id = v_pop_letzterpopbermassn.id)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code))) ON ((ap.id = pop.ap_id))) ON ((ae_eigenschaften.id = ap.art_id)))
  WHERE (ae_eigenschaften.taxid > 150)
  ORDER BY ae_eigenschaften.artname, pop.nr, v_pop_letzterpopbermassn.jahr;




CREATE VIEW apflora.v_pop_ohnekoord AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    pop.id,
    pop.nr,
    pop.name,
    pop_status_werte.text AS status,
    pop.bekannt_seit,
    pop.status_unklar,
    pop.status_unklar_begruendung,
    pop.x,
    pop.y,
    pop.changed,
    pop.changed_by
   FROM (((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN apflora.pop ON ((ap.id = pop.ap_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
  WHERE ((pop.x IS NULL) OR (pop.y IS NULL))
  ORDER BY ae_eigenschaften.artname, pop.nr;




CREATE VIEW apflora.v_pop_popberundmassnber AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    pop.id AS pop_id,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    pop_status_werte.text AS pop_status,
    pop.bekannt_seit AS pop_bekannt_seit,
    pop.status_unklar AS pop_status_unklar,
    pop.status_unklar_begruendung AS pop_status_unklar_begruendung,
    pop.x AS pop_x,
    pop.y AS pop_y,
    pop.changed AS pop_changed,
    pop.changed_by AS pop_changed_by,
    v_pop_berundmassnjahre.jahr,
    popber.id AS popber_id,
    popber.jahr AS popber_jahr,
    tpop_entwicklung_werte.text AS popber_entwicklung,
    popber.bemerkungen AS popber_bemerkungen,
    popber.changed AS popber_changed,
    popber.changed_by AS popber_changed_by,
    popmassnber.id AS popmassnber_id,
    popmassnber.jahr AS popmassnber_jahr,
    tpopmassn_erfbeurt_werte.text AS popmassnber_entwicklung,
    popmassnber.bemerkungen AS popmassnber_bemerkungen,
    popmassnber.changed AS popmassnber_changed,
    popmassnber.changed_by AS popmassnber_changed_by
   FROM (apflora.ae_eigenschaften
     JOIN (((apflora.ap
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     JOIN (((apflora.pop
     LEFT JOIN (apflora.v_pop_berundmassnjahre
     LEFT JOIN (apflora.popmassnber
     LEFT JOIN apflora.tpopmassn_erfbeurt_werte ON ((popmassnber.beurteilung = tpopmassn_erfbeurt_werte.code))) ON (((v_pop_berundmassnjahre.jahr = popmassnber.jahr) AND (v_pop_berundmassnjahre.id = popmassnber.pop_id)))) ON ((pop.id = v_pop_berundmassnjahre.id)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     LEFT JOIN (apflora.popber
     LEFT JOIN apflora.tpop_entwicklung_werte ON ((popber.entwicklung = tpop_entwicklung_werte.code))) ON (((v_pop_berundmassnjahre.jahr = popber.jahr) AND (v_pop_berundmassnjahre.id = popber.pop_id)))) ON ((ap.id = pop.ap_id))) ON ((ae_eigenschaften.id = ap.art_id)))
  WHERE (ae_eigenschaften.taxid > 150)
  ORDER BY ae_eigenschaften.artname, pop.nr, v_pop_berundmassnjahre.jahr;




CREATE VIEW apflora.v_pop_vonapohnestatus AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap.bearbeitung AS ap_bearbeitung,
    pop.id,
    pop.nr,
    pop.name,
    pop.status
   FROM (apflora.ae_eigenschaften
     JOIN (apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id))) ON ((ae_eigenschaften.id = ap.art_id)))
  WHERE ((ap.bearbeitung = 3) AND (pop.status IS NULL))
  ORDER BY ae_eigenschaften.artname, pop.nr;




CREATE VIEW apflora.v_popber AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    pop.id AS pop_id,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    pop_status_werte.text AS pop_status,
    pop.bekannt_seit AS pop_bekannt_seit,
    pop.status_unklar AS pop_status_unklar,
    pop.status_unklar_begruendung AS pop_status_unklar_begruendung,
    pop.x AS pop_x,
    pop.y AS pop_y,
    popber.id,
    popber.jahr,
    tpop_entwicklung_werte.text AS entwicklung,
    popber.bemerkungen,
    popber.changed,
    popber.changed_by
   FROM (((((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN apflora.pop ON ((ap.id = pop.ap_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     JOIN apflora.popber ON ((pop.id = popber.pop_id)))
     LEFT JOIN apflora.tpop_entwicklung_werte ON ((popber.entwicklung = tpop_entwicklung_werte.code)))
  ORDER BY ae_eigenschaften.artname, pop.nr, popber.jahr, tpop_entwicklung_werte.text;




CREATE VIEW apflora.v_popber_angezapbestjahr0 AS
 SELECT ap.id AS ap_id,
    pop.id AS pop_id,
    popber.id,
    ae_eigenschaften.artname AS "Artname",
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    pop_status_werte.text AS status,
    popber.jahr AS "PopBerJahr",
    tpop_entwicklung_werte.text AS "PopBerEntwicklung",
    popber.bemerkungen AS "PopBerTxt"
   FROM (((apflora.ae_eigenschaften
     JOIN ((apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id)))
     JOIN apflora.popber ON ((pop.id = popber.pop_id))) ON ((ae_eigenschaften.id = ap.art_id)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     LEFT JOIN apflora.tpop_entwicklung_werte ON ((popber.entwicklung = tpop_entwicklung_werte.code)));




CREATE VIEW apflora.v_popmassnber AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    pop.id AS pop_id,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    pop_status_werte.text AS pop_status,
    pop.bekannt_seit AS pop_bekannt_seit,
    pop.status_unklar AS pop_status_unklar,
    pop.status_unklar_begruendung AS pop_status_unklar_begruendung,
    pop.x AS pop_x,
    pop.y AS pop_y,
    pop.changed AS pop_changed,
    pop.changed_by AS pop_changed_by,
    popmassnber.id,
    popmassnber.jahr,
    tpopmassn_erfbeurt_werte.text AS beurteilung,
    popmassnber.bemerkungen,
    popmassnber.changed,
    popmassnber.changed_by
   FROM (((((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN apflora.pop ON ((ap.id = pop.ap_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     JOIN apflora.popmassnber ON ((pop.id = popmassnber.pop_id)))
     LEFT JOIN apflora.tpopmassn_erfbeurt_werte ON ((popmassnber.beurteilung = tpopmassn_erfbeurt_werte.code)))
  ORDER BY ae_eigenschaften.artname, pop.nr;




CREATE VIEW apflora.v_popmassnber_anzmassn0 AS
 SELECT popmassnber.pop_id,
    popmassnber.jahr,
    count(tpopmassn.id) AS anzahl_massnahmen
   FROM (apflora.popmassnber
     JOIN (apflora.tpop
     LEFT JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id))) ON ((popmassnber.pop_id = tpop.pop_id)))
  WHERE ((tpopmassn.jahr = popmassnber.jahr) OR (tpopmassn.jahr IS NULL))
  GROUP BY popmassnber.pop_id, popmassnber.jahr
  ORDER BY popmassnber.pop_id, popmassnber.jahr;




CREATE VIEW apflora.v_popmassnber_anzmassn AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_status,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    pop.id AS pop_id,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    pop_status_werte.text AS pop_status,
    pop.bekannt_seit AS pop_bekannt_seit,
    pop.status_unklar AS pop_status_unklar,
    pop.status_unklar_begruendung AS pop_status_unklar_begruendung,
    pop.x AS pop_x,
    pop.y AS pop_y,
    pop.changed AS pop_changed,
    pop.changed_by AS pop_changed_by,
    popmassnber.id AS popmassnber_id,
    popmassnber.jahr AS popmassnber_jahr,
    tpopmassn_erfbeurt_werte.text AS popmassnber_entwicklung,
    popmassnber.bemerkungen AS popmassnber_bemerkungen,
    popmassnber.changed AS popmassnber_changed,
    popmassnber.changed_by AS popmassnber_changed_by,
    v_popmassnber_anzmassn0.anzahl_massnahmen
   FROM (((((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN apflora.pop ON ((ap.id = pop.ap_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     JOIN (apflora.popmassnber
     LEFT JOIN apflora.v_popmassnber_anzmassn0 ON (((v_popmassnber_anzmassn0.pop_id = popmassnber.pop_id) AND (v_popmassnber_anzmassn0.jahr = popmassnber.jahr)))) ON ((pop.id = popmassnber.pop_id)))
     LEFT JOIN apflora.tpopmassn_erfbeurt_werte ON ((popmassnber.beurteilung = tpopmassn_erfbeurt_werte.code)))
  ORDER BY ae_eigenschaften.artname, pop.nr;




CREATE VIEW apflora.v_q_ziel_ohnejahr AS
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    ziel.id
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN apflora.ziel ON ((ap.id = ziel.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE (ziel.jahr IS NULL)
  ORDER BY ziel.id;




CREATE VIEW apflora.v_q_ziel_ohnetyp AS
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    ziel.id,
    ziel.jahr
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN apflora.ziel ON ((ap.id = ziel.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE (ziel.typ IS NULL)
  ORDER BY ziel.jahr;




CREATE VIEW apflora.v_q_ziel_ohneziel AS
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    ziel.id,
    ziel.jahr
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN apflora.ziel ON ((ap.id = ziel.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE (ziel.bezeichnung IS NULL)
  ORDER BY ziel.jahr;




CREATE VIEW apflora.v_qk_apber_ohnebeurteilung AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'AP-Bericht ohne Beurteilung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'AP-Berichte'::text, (apber.id)::text] AS url,
    ARRAY[concat('AP-Bericht (Jahr): ', apber.jahr)] AS text,
    apber.jahr AS "Berichtjahr"
   FROM (apflora.ap
     JOIN apflora.apber ON ((ap.id = apber.ap_id)))
  WHERE ((apber.beurteilung IS NULL) AND (apber.jahr IS NOT NULL))
  ORDER BY apber.jahr;




CREATE VIEW apflora.v_qk_apber_ohnejahr AS
SELECT
    NULL::uuid AS proj_id,
    NULL::uuid AS ap_id,
    NULL::text AS hw,
    NULL::text[] AS url,
    NULL::text[] AS text;




CREATE VIEW apflora.v_qk_apber_ohnevergleichvorjahrgesamtziel AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'AP-Bericht ohne Vergleich Vorjahr - Gesamtziel:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'AP-Berichte'::text, (apber.id)::text] AS url,
    ARRAY[concat('AP-Bericht (Jahr): ', apber.jahr)] AS text,
    apber.jahr AS "Berichtjahr"
   FROM (apflora.ap
     JOIN apflora.apber ON ((ap.id = apber.ap_id)))
  WHERE ((apber.vergleich_vorjahr_gesamtziel IS NULL) AND (apber.jahr IS NOT NULL))
  ORDER BY apber.jahr;




CREATE VIEW apflora.v_qk_assozart_ohneart AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Assoziierte Art ohne Art:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'assoziierte-Arten'::text, (assozart.id)::text] AS url,
    ARRAY[concat('Assoziierte Art (id): ', assozart.id)] AS text
   FROM (apflora.ap
     JOIN apflora.assozart ON ((ap.id = assozart.ap_id)))
  WHERE (assozart.ae_id IS NULL)
  ORDER BY assozart.id;




CREATE VIEW apflora.v_qk_erfkrit_ohnebeurteilung AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Erfolgskriterium ohne Beurteilung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Erfolgskriterien'::text, (erfkrit.id)::text] AS url,
    ARRAY[concat('Erfolgskriterium (id): ', erfkrit.id)] AS text
   FROM (apflora.ap
     JOIN apflora.erfkrit ON ((ap.id = erfkrit.ap_id)))
  WHERE (erfkrit.erfolg IS NULL)
  ORDER BY erfkrit.id;




CREATE VIEW apflora.v_qk_erfkrit_ohnekriterien AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Erfolgskriterium ohne Kriterien:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Erfolgskriterien'::text, (erfkrit.id)::text] AS url,
    ARRAY[concat('Erfolgskriterium (id): ', erfkrit.id)] AS text
   FROM (apflora.ap
     JOIN apflora.erfkrit ON ((ap.id = erfkrit.ap_id)))
  WHERE (erfkrit.kriterien IS NULL)
  ORDER BY erfkrit.id;




CREATE VIEW apflora.v_qk_feldkontr_ohnebearb AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Feldkontrolle ohne BearbeiterIn:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text, 'Feld-Kontrollen'::text, (tpopkontr.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr), concat('Kontrolle (id): ', tpopkontr.id)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN apflora.tpopkontr ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpopkontr.bearbeiter IS NULL) AND ((tpopkontr.typ)::text <> 'Freiwilligen-Erfolgskontrolle'::text))
  ORDER BY pop.nr, tpop.nr, tpopkontr.id;




CREATE VIEW apflora.v_qk_feldkontr_ohnejahr AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Feldkontrolle ohne Jahr:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text, 'Feld-Kontrollen'::text, (tpopkontr.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr), concat('Feld-Kontrolle (Jahr): ', tpopkontr.jahr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN apflora.tpopkontr ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpopkontr.jahr IS NULL) AND ((tpopkontr.typ)::text <> 'Freiwilligen-Erfolgskontrolle'::text))
  ORDER BY pop.nr, tpop.nr, tpopkontr.jahr;




CREATE VIEW apflora.v_qk_feldkontr_ohnetyp AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Feldkontrolle ohne Typ:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text, 'Feld-Kontrollen'::text, (tpopkontr.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr), concat('Feld-Kontrolle (Jahr): ', tpopkontr.jahr)] AS text,
    tpopkontr.jahr AS "Berichtjahr"
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN apflora.tpopkontr ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE (((tpopkontr.typ IS NULL) OR ((tpopkontr.typ)::text = 'Erfolgskontrolle'::text)) AND (tpopkontr.jahr IS NOT NULL))
  ORDER BY pop.nr, tpop.nr, tpopkontr.jahr;




CREATE VIEW apflora.v_qk_feldkontr_ohnezaehlung AS
SELECT
    NULL::uuid AS proj_id,
    NULL::uuid AS ap_id,
    NULL::text AS hw,
    NULL::text[] AS url,
    NULL::text[] AS text,
    NULL::smallint AS "Berichtjahr";




CREATE VIEW apflora.v_qk_feldkontrzaehlung_ohneanzahl AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Zaehlung ohne Anzahl (Feldkontrolle):'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text, 'Feld-Kontrollen'::text, (tpopkontr.id)::text, 'Zählungen'::text, (tpopkontrzaehl.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr), concat('Feld-Kontrolle (Jahr): ', tpopkontr.jahr), concat('Zählung (id): ', tpopkontrzaehl.id)] AS text,
    tpopkontr.jahr AS "Berichtjahr"
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN (apflora.tpopkontr
     JOIN apflora.tpopkontrzaehl ON ((tpopkontr.id = tpopkontrzaehl.tpopkontr_id))) ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpopkontrzaehl.anzahl IS NULL) AND (tpopkontr.jahr IS NOT NULL) AND ((tpopkontr.typ)::text <> 'Freiwilligen-Erfolgskontrolle'::text))
  ORDER BY pop.nr, tpop.nr, tpopkontr.jahr;




CREATE VIEW apflora.v_qk_feldkontrzaehlung_ohneeinheit AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Zaehlung ohne Zaehleinheit (Feldkontrolle):'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text, 'Feld-Kontrollen'::text, (tpopkontr.id)::text, 'Zählungen'::text, (tpopkontrzaehl.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr), concat('Feld-Kontrolle (Jahr): ', tpopkontr.jahr), concat('Zählung (id): ', tpopkontrzaehl.id)] AS text,
    tpopkontr.jahr AS "Berichtjahr"
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN (apflora.tpopkontr
     JOIN apflora.tpopkontrzaehl ON ((tpopkontr.id = tpopkontrzaehl.tpopkontr_id))) ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpopkontrzaehl.einheit IS NULL) AND (tpopkontr.jahr IS NOT NULL) AND ((tpopkontr.typ)::text <> 'Freiwilligen-Erfolgskontrolle'::text))
  ORDER BY pop.nr, tpop.nr, tpopkontr.jahr;




CREATE VIEW apflora.v_qk_feldkontrzaehlung_ohnemethode AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Zaehlung ohne Methode (Feldkontrolle):'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text, 'Feld-Kontrollen'::text, (tpopkontr.id)::text, 'Zählungen'::text, (tpopkontrzaehl.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr), concat('Feld-Kontrolle (Jahr): ', tpopkontr.jahr), concat('Zählung (id): ', tpopkontrzaehl.id)] AS text,
    tpopkontr.jahr AS "Berichtjahr"
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN (apflora.tpopkontr
     JOIN apflora.tpopkontrzaehl ON ((tpopkontr.id = tpopkontrzaehl.tpopkontr_id))) ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpopkontrzaehl.methode IS NULL) AND (tpopkontr.jahr IS NOT NULL) AND ((tpopkontr.typ)::text <> 'Freiwilligen-Erfolgskontrolle'::text))
  ORDER BY pop.nr, tpop.nr, tpopkontr.jahr;




CREATE VIEW apflora.v_qk_freiwkontr_ohnebearb AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Freiwilligen-Kontrolle ohne BearbeiterIn:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text, 'Freiwilligen-Kontrollen'::text, (tpopkontr.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr), concat('Feld-Kontrolle (id): ', tpopkontr.id)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN apflora.tpopkontr ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpopkontr.bearbeiter IS NULL) AND ((tpopkontr.typ)::text = 'Freiwilligen-Erfolgskontrolle'::text))
  ORDER BY ap.id, pop.nr, tpop.nr, tpopkontr.bearbeiter;




CREATE VIEW apflora.v_qk_freiwkontr_ohnejahr AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Freiwilligen-Kontrolle ohne Jahr:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text, 'Freiwilligen-Kontrollen'::text, (tpopkontr.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr), concat('Feld-Kontrolle (id): ', tpopkontr.id)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN apflora.tpopkontr ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpopkontr.jahr IS NULL) AND ((tpopkontr.typ)::text = 'Freiwilligen-Erfolgskontrolle'::text))
  ORDER BY ap.id, pop.nr, tpop.nr, tpopkontr.jahr;




CREATE VIEW apflora.v_qk_freiwkontr_ohnezaehlung AS
SELECT
    NULL::uuid AS proj_id,
    NULL::uuid AS ap_id,
    NULL::text AS hw,
    NULL::text[] AS url,
    NULL::text[] AS text,
    NULL::smallint AS "Berichtjahr";




CREATE VIEW apflora.v_qk_freiwkontrzaehlung_ohneanzahl AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Zaehlung ohne Anzahl (Freiwilligen-Kontrolle):'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text, 'Freiwilligen-Kontrollen'::text, (tpopkontr.id)::text, 'Zählungen'::text, (tpopkontrzaehl.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr), concat('Feld-Kontrolle (Jahr): ', tpopkontr.jahr), concat('Zählung (id): ', tpopkontrzaehl.id)] AS text,
    tpopkontr.jahr AS "Berichtjahr"
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN (apflora.tpopkontr
     JOIN apflora.tpopkontrzaehl ON ((tpopkontr.id = tpopkontrzaehl.tpopkontr_id))) ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpopkontrzaehl.anzahl IS NULL) AND (tpopkontr.jahr IS NOT NULL) AND ((tpopkontr.typ)::text = 'Freiwilligen-Erfolgskontrolle'::text))
  ORDER BY pop.nr, tpop.nr, tpopkontr.jahr;




CREATE VIEW apflora.v_qk_freiwkontrzaehlung_ohneeinheit AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Zaehlung ohne Zaehleinheit (Freiwilligen-Kontrolle):'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text, 'Freiwilligen-Kontrollen'::text, (tpopkontr.id)::text, 'Zählungen'::text, (tpopkontrzaehl.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr), concat('Feld-Kontrolle (Jahr): ', tpopkontr.jahr), concat('Zählung (id): ', tpopkontrzaehl.id)] AS text,
    tpopkontr.jahr AS "Berichtjahr"
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN (apflora.tpopkontr
     JOIN apflora.tpopkontrzaehl ON ((tpopkontr.id = tpopkontrzaehl.tpopkontr_id))) ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpopkontrzaehl.einheit IS NULL) AND (tpopkontr.jahr IS NOT NULL) AND ((tpopkontr.typ)::text = 'Freiwilligen-Erfolgskontrolle'::text))
  ORDER BY pop.nr, tpop.nr, tpopkontr.jahr;




CREATE VIEW apflora.v_qk_freiwkontrzaehlung_ohnemethode AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Zaehlung ohne Methode (Freiwilligen-Kontrolle):'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text, 'Freiwilligen-Kontrollen'::text, (tpopkontr.id)::text, 'Zählungen'::text, (tpopkontrzaehl.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr), concat('Feld-Kontrolle (Jahr): ', tpopkontr.jahr), concat('Zählung (id): ', tpopkontrzaehl.id)] AS text,
    tpopkontr.jahr AS "Berichtjahr"
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN (apflora.tpopkontr
     JOIN apflora.tpopkontrzaehl ON ((tpopkontr.id = tpopkontrzaehl.tpopkontr_id))) ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpopkontrzaehl.methode IS NULL) AND (tpopkontr.jahr IS NOT NULL) AND ((tpopkontr.typ)::text = 'Freiwilligen-Erfolgskontrolle'::text))
  ORDER BY pop.nr, tpop.nr, tpopkontr.jahr;




CREATE VIEW apflora.v_qk_massn_ohnebearb AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Massnahme ohne BearbeiterIn:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text, 'Massnahmen'::text, (tpopmassn.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr), concat('Massnahme (id): ', tpopmassn.id)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE (tpopmassn.bearbeiter IS NULL)
  ORDER BY ap.id, pop.nr, tpop.nr, tpopmassn.id;




CREATE VIEW apflora.v_qk_massn_ohnejahr AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Massnahme ohne Jahr:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text, 'Massnahmen'::text, (tpopmassn.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr), concat('Massnahme: ', tpopmassn.jahr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE (tpopmassn.jahr IS NULL)
  ORDER BY ap.id, pop.nr, tpop.nr, tpopmassn.id;




CREATE VIEW apflora.v_qk_massn_ohnetyp AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Massnahmen ohne Typ:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text, 'Massnahmen'::text, (tpopmassn.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr), concat('Massnahme (Jahr): ', tpopmassn.jahr)] AS text,
    tpopmassn.jahr AS "Berichtjahr"
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpopmassn.typ IS NULL) AND (tpopmassn.jahr IS NOT NULL))
  ORDER BY pop.nr, tpop.nr, tpopmassn.jahr;




CREATE VIEW apflora.v_qk_massnber_ohneerfbeurt AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Massnahmen-Bericht ohne Entwicklung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text, 'Massnahmen-Berichte'::text, (tpopmassnber.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr), concat('Massnahmen-Bericht (Jahr): ', tpopmassnber.jahr)] AS text,
    tpopmassnber.jahr AS "Berichtjahr"
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN apflora.tpopmassnber ON ((tpop.id = tpopmassnber.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpopmassnber.beurteilung IS NULL) AND (tpopmassnber.jahr IS NOT NULL))
  ORDER BY pop.nr, tpop.nr, tpopmassnber.jahr;




CREATE VIEW apflora.v_qk_massnber_ohnejahr AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Massnahmen-Bericht ohne Jahr:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text, 'Massnahmen-Berichte'::text, (tpopmassnber.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr), concat('Massnahmen-Bericht (Jahr): ', tpopmassnber.jahr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN apflora.tpopmassnber ON ((tpop.id = tpopmassnber.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE (tpopmassnber.jahr IS NULL)
  ORDER BY pop.nr, tpop.nr, tpopmassnber.jahr, tpopmassnber.id;




CREATE VIEW apflora.v_qk_pop_koordentsprechenkeinertpop AS
 SELECT DISTINCT ap.proj_id,
    pop.ap_id,
    'Population: Koordinaten entsprechen keiner Teilpopulation:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr): ', pop.nr)] AS text,
    pop.x AS "XKoord",
    pop.y AS "YKoord"
   FROM (apflora.ap
     JOIN apflora.pop ON ((pop.ap_id = ap.id)))
  WHERE ((pop.x IS NOT NULL) AND (pop.y IS NOT NULL) AND (NOT (pop.id IN ( SELECT tpop.pop_id
           FROM apflora.tpop
          WHERE ((tpop.x = tpop.x) AND (tpop.y = tpop.y))))))
  ORDER BY ap.proj_id, pop.ap_id;




CREATE VIEW apflora.v_qk_pop_mit_ber_abnehmend_ohne_tpopber_abnehmend AS
 SELECT DISTINCT ap.proj_id,
    ap.id AS ap_id,
    pop.id AS pop_id,
    popber.jahr AS "Berichtjahr",
    'Populationen mit Bericht "abnehmend" ohne Teil-Population mit Bericht "abnehmend":'::text AS hw,
    ARRAY['Projekte'::text, (ap.proj_id)::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.popber ON ((pop.id = popber.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((popber.entwicklung = 1) AND (NOT (popber.pop_id IN ( SELECT DISTINCT tpop.pop_id
           FROM (apflora.tpop
             JOIN apflora.tpopber ON ((tpop.id = tpopber.tpop_id)))
          WHERE ((tpopber.entwicklung = 1) AND (tpopber.jahr = popber.jahr))))))
  ORDER BY ap.proj_id, ap.id, pop.id, popber.jahr;




CREATE VIEW apflora.v_qk_pop_mit_ber_erloschen_ohne_tpopber_erloschen AS
 SELECT DISTINCT ap.proj_id,
    ap.id AS ap_id,
    pop.id AS pop_id,
    popber.jahr AS "Berichtjahr",
    'Populationen mit Bericht "erloschen" ohne Teil-Population mit Bericht "erloschen":'::text AS hw,
    ARRAY['Projekte'::text, (ap.proj_id)::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.popber ON ((pop.id = popber.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((popber.entwicklung = 8) AND (NOT (popber.pop_id IN ( SELECT DISTINCT tpop.pop_id
           FROM (apflora.tpop
             JOIN apflora.tpopber ON ((tpop.id = tpopber.tpop_id)))
          WHERE ((tpopber.entwicklung = 8) AND (tpopber.jahr = popber.jahr))))))
  ORDER BY ap.proj_id, ap.id, pop.id, popber.jahr;




CREATE VIEW apflora.v_qk_pop_mit_ber_erloschen_und_tpopber_nicht_erloschen AS
 SELECT DISTINCT ap.proj_id,
    ap.id AS ap_id,
    pop.id AS pop_id,
    popber.jahr AS "Berichtjahr",
    'Populationen mit Bericht "erloschen" und mindestens einer gemäss Bericht nicht erloschenen Teil-Population:'::text AS hw,
    ARRAY['Projekte'::text, (ap.proj_id)::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.popber ON ((pop.id = popber.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((popber.entwicklung = 8) AND (popber.pop_id IN ( SELECT DISTINCT tpop.pop_id
           FROM (apflora.tpop
             JOIN apflora.tpopber ON ((tpop.id = tpopber.tpop_id)))
          WHERE ((tpopber.entwicklung < 8) AND (tpopber.jahr = popber.jahr)))))
  ORDER BY ap.proj_id, ap.id, pop.id, popber.jahr;




CREATE VIEW apflora.v_qk_pop_mit_ber_zunehmend_ohne_tpopber_zunehmend AS
 SELECT DISTINCT ap.proj_id,
    ap.id AS ap_id,
    pop.id AS pop_id,
    popber.jahr AS "Berichtjahr",
    'Populationen mit Bericht "zunehmend" ohne Teil-Population mit Bericht "zunehmend":'::text AS hw,
    ARRAY['Projekte'::text, (ap.proj_id)::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.popber ON ((pop.id = popber.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((popber.entwicklung = 3) AND (NOT (popber.pop_id IN ( SELECT DISTINCT tpop.pop_id
           FROM (apflora.tpop
             JOIN apflora.tpopber ON ((tpop.id = tpopber.tpop_id)))
          WHERE ((tpopber.entwicklung = 3) AND (tpopber.jahr = popber.jahr))))))
  ORDER BY ap.proj_id, ap.id, pop.id, popber.jahr;




CREATE VIEW apflora.v_qk_pop_mitstatusunklarohnebegruendung AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Population mit "Status unklar", ohne Begruendung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id)))
  WHERE ((pop.status_unklar = true) AND (pop.status_unklar_begruendung IS NULL))
  ORDER BY ap.id, pop.nr;




CREATE VIEW apflora.v_qk_pop_ohnebekanntseit AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Population ohne "bekannt seit":'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id)))
  WHERE (pop.bekannt_seit IS NULL)
  ORDER BY ap.id, pop.nr;




CREATE VIEW apflora.v_qk_pop_ohnekoord AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Population: Mindestens eine Koordinate fehlt:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id)))
  WHERE ((pop.x IS NULL) OR (pop.y IS NULL))
  ORDER BY ap.id, pop.nr;




CREATE VIEW apflora.v_qk_pop_ohnepopname AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Population ohne Name:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population: ', pop.nr)] AS text
   FROM (apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id)))
  WHERE (pop.name IS NULL)
  ORDER BY ap.id, pop.nr;




CREATE VIEW apflora.v_qk_pop_ohnepopnr AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Population ohne Nr.:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Name): ', pop.name)] AS text
   FROM (apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id)))
  WHERE (pop.nr IS NULL)
  ORDER BY ap.id, pop.name;




CREATE VIEW apflora.v_qk_pop_ohnepopstatus AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Population ohne Status:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id)))
  WHERE (pop.status IS NULL)
  ORDER BY ap.id, pop.nr;




CREATE VIEW apflora.v_qk_pop_ohnetpop AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Population ohne Teilpopulation:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     LEFT JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE (tpop.id IS NULL)
  ORDER BY ap.id, pop.nr;




CREATE VIEW apflora.v_qk_pop_ohnetpopmitgleichemstatus AS
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Population: Keine Teil-Population hat den Status der Population:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE (NOT (pop.id IN ( SELECT DISTINCT tpop.pop_id
           FROM apflora.tpop
          WHERE ((tpop.pop_id = pop.id) AND ((tpop.status = pop.status) OR ((tpop.status = 200) AND (pop.status = 210)) OR ((tpop.status = 210) AND (pop.status = 200)) OR ((tpop.status = 202) AND (pop.status = 211)) OR ((tpop.status = 211) AND (pop.status = 202)))))));




CREATE VIEW apflora.v_qk_pop_popnrmehrdeutig AS
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Population: Die Nr. ist mehrdeutig:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN apflora.pop ON ((pop.ap_id = ap.id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((pop.ap_id IN ( SELECT DISTINCT pop_1.ap_id
           FROM apflora.pop pop_1
          GROUP BY pop_1.ap_id, pop_1.nr
         HAVING (count(*) > 1))) AND (pop.nr IN ( SELECT DISTINCT pop_1.nr
           FROM apflora.pop pop_1
          GROUP BY pop_1.ap_id, pop_1.nr
         HAVING (count(*) > 1))))
  ORDER BY projekt.id, ap.id, pop.nr;




CREATE VIEW apflora.v_qk_pop_status101tpopstatusanders AS
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Population: Status ist "ursprünglich, erloschen". Es gibt Teil-Populationen (ausser potentiellen Wuchs-/Ansiedlungsorten) mit abweichendem Status:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((pop.status = 101) AND (pop.id IN ( SELECT DISTINCT tpop.pop_id
           FROM apflora.tpop
          WHERE ((tpop.pop_id = pop.id) AND (tpop.status <> ALL (ARRAY[101, 300]))))));




CREATE VIEW apflora.v_qk_pop_status200tpopstatusunzulaessig AS
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Population: Status ist "angesiedelt nach Beginn AP, aktuell". Es gibt Teil-Populationen mit nicht zulässigen Stati ("ursprünglich", "angesiedelt vor Beginn AP, aktuell"):'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((pop.status = 200) AND (pop.id IN ( SELECT DISTINCT tpop.pop_id
           FROM apflora.tpop
          WHERE ((tpop.pop_id = pop.id) AND (tpop.status = ANY (ARRAY[100, 101, 210]))))));




CREATE VIEW apflora.v_qk_pop_status201tpopstatusunzulaessig AS
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Population: Status ist "Ansaatversuch". Es gibt Teil-Populationen mit nicht zulässigen Stati ("ursprünglich" oder "angesiedelt, aktuell"):'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((pop.status = 201) AND (pop.id IN ( SELECT DISTINCT tpop.pop_id
           FROM apflora.tpop
          WHERE ((tpop.pop_id = pop.id) AND (tpop.status = ANY (ARRAY[100, 101, 200, 210]))))));




CREATE VIEW apflora.v_qk_pop_status202tpopstatusanders AS
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Population: Status ist "angesiedelt nach Beginn AP, erloschen/nicht etabliert". Es gibt Teil-Populationen mit abweichendem Status:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((pop.status = 202) AND (pop.id IN ( SELECT DISTINCT tpop.pop_id
           FROM apflora.tpop
          WHERE ((tpop.pop_id = pop.id) AND (tpop.status <> 202)))));




CREATE VIEW apflora.v_qk_pop_status210tpopstatusunzulaessig AS
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Population: Status ist "angesiedelt vor Beginn AP, aktuell". Es gibt Teil-Populationen mit nicht zulässigen Stati ("ursprünglich"):'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((pop.status = 210) AND (pop.id IN ( SELECT DISTINCT tpop.pop_id
           FROM apflora.tpop
          WHERE ((tpop.pop_id = pop.id) AND (tpop.status = ANY (ARRAY[100, 101]))))));




CREATE VIEW apflora.v_qk_pop_status211tpopstatusunzulaessig AS
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Population: Status ist "angesiedelt vor Beginn AP, erloschen/nicht etabliert". Es gibt Teil-Populationen mit nicht zulässigen Stati ("ursprünglich", "angesiedelt, aktuell", "Ansaatversuch", "potentieller Wuchsort"):'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((pop.status = 211) AND (pop.id IN ( SELECT DISTINCT tpop.pop_id
           FROM apflora.tpop
          WHERE ((tpop.pop_id = pop.id) AND (tpop.status = ANY (ARRAY[100, 101, 210, 200, 201, 300]))))));




CREATE VIEW apflora.v_qk_pop_status300tpopstatusanders AS
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Population: Status ist "potentieller Wuchs-/Ansiedlungsort". Es gibt aber Teil-Populationen mit abweichendem Status:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((pop.status = 300) AND (pop.id IN ( SELECT DISTINCT tpop.pop_id
           FROM apflora.tpop
          WHERE ((tpop.pop_id = pop.id) AND (tpop.status <> 300)))));




CREATE VIEW apflora.v_qk_pop_statusaktuellletzterpopbererloschen AS
 WITH lastpopber AS (
         SELECT DISTINCT ON (popber.pop_id) popber.pop_id,
            popber.jahr,
            popber.entwicklung
           FROM apflora.popber
          WHERE (popber.jahr IS NOT NULL)
          ORDER BY popber.pop_id, popber.jahr DESC
        )
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Population: Status ist "aktuell" (ursprünglich oder angesiedelt) oder potentieller Wuchsort; der letzte Populations-Bericht meldet aber "erloschen" und es gab seither keine Ansiedlung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN (apflora.pop
     JOIN lastpopber ON ((pop.id = lastpopber.pop_id))) ON ((ap.id = pop.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((pop.status = ANY (ARRAY[100, 200, 210, 300])) AND (lastpopber.entwicklung = 8) AND (NOT (pop.id IN ( SELECT DISTINCT tpop.pop_id
           FROM (apflora.tpop
             JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id)))
          WHERE ((tpopmassn.typ >= 1) AND (tpopmassn.typ <= 3) AND (tpopmassn.jahr > lastpopber.jahr))))));




CREATE VIEW apflora.v_qk_pop_statusangesiedeltmittpopurspruenglich AS
 SELECT DISTINCT ap.proj_id,
    pop.ap_id,
    'Population: Status ist "angesiedelt", es gibt aber eine Teilpopulation mit Status "urspruenglich":'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr): ', pop.nr)] AS text
   FROM (apflora.ap
     JOIN apflora.pop ON ((pop.ap_id = ap.id)))
  WHERE ((pop.status = ANY (ARRAY[200, 201, 202, 210, 211])) AND (pop.id IN ( SELECT DISTINCT tpop.pop_id
           FROM apflora.tpop
          WHERE (tpop.status = 100))));




CREATE VIEW apflora.v_qk_pop_statusansaatversuchalletpoperloschen AS
 SELECT DISTINCT ap.proj_id,
    pop.ap_id,
    'Population: Status ist "angesiedelt, Ansaatversuch", alle Teilpopulationen sind gemäss Status erloschen:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr): ', pop.nr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((tpop.pop_id = pop.id))) ON ((pop.ap_id = ap.id)))
  WHERE ((pop.status = 201) AND (EXISTS ( SELECT 1
           FROM apflora.tpop tpop_1
          WHERE ((tpop_1.status = ANY (ARRAY[101, 202, 211])) AND (tpop_1.pop_id = pop.id)))) AND (NOT (EXISTS ( SELECT 1
           FROM apflora.tpop tpop_1
          WHERE ((tpop_1.status <> ALL (ARRAY[101, 202, 211])) AND (tpop_1.pop_id = pop.id))))));




CREATE VIEW apflora.v_qk_pop_statusansaatversuchmitaktuellentpop AS
 SELECT DISTINCT ap.proj_id,
    pop.ap_id,
    'Population: Status ist "angesiedelt, Ansaatversuch", es gibt aber eine aktuelle Teilpopulation oder eine ursprüngliche erloschene:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr): ', pop.nr)] AS text
   FROM (apflora.ap
     JOIN apflora.pop ON ((pop.ap_id = ap.id)))
  WHERE ((pop.status = 201) AND (pop.id IN ( SELECT DISTINCT tpop.pop_id
           FROM apflora.tpop
          WHERE (tpop.status = ANY (ARRAY[100, 101, 200, 210])))));




CREATE VIEW apflora.v_qk_pop_statusansaatversuchmittpopursprerloschen AS
 SELECT DISTINCT ap.proj_id,
    pop.ap_id,
    'Population: Status ist "angesiedelt, Ansaatversuch", es gibt aber eine Teilpopulation mit Status "urspruenglich, erloschen":'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr): ', pop.nr)] AS text
   FROM (apflora.ap
     JOIN apflora.pop ON ((pop.ap_id = ap.id)))
  WHERE ((pop.status = 201) AND (pop.id IN ( SELECT DISTINCT tpop.pop_id
           FROM apflora.tpop
          WHERE (tpop.status = 101))));




CREATE VIEW apflora.v_qk_pop_statuserloschenletzterpopberabnehmend AS
 WITH lastpopber AS (
         SELECT DISTINCT ON (popber.pop_id) popber.pop_id,
            popber.jahr,
            popber.entwicklung
           FROM apflora.popber
          WHERE (popber.jahr IS NOT NULL)
          ORDER BY popber.pop_id, popber.jahr DESC
        )
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Population: Status ist "erloschen" (ursprünglich oder angesiedelt), Ansaatversuch oder potentieller Wuchsort; der letzte Populations-Bericht meldet aber "abnehmend" und es gab seither keine Ansiedlung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN (apflora.pop
     JOIN lastpopber ON ((pop.id = lastpopber.pop_id))) ON ((ap.id = pop.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((pop.status = ANY (ARRAY[101, 201, 202, 211, 300])) AND (lastpopber.entwicklung = 1) AND (NOT (pop.id IN ( SELECT DISTINCT tpop.pop_id
           FROM (apflora.tpop
             JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id)))
          WHERE ((tpopmassn.typ >= 1) AND (tpopmassn.typ <= 3) AND (tpopmassn.jahr > lastpopber.jahr))))));




CREATE VIEW apflora.v_qk_pop_statuserloschenletzterpopberaktuell AS
 SELECT DISTINCT ap.proj_id,
    pop.ap_id,
    'Population: Status ist "erloschen", der letzte Populations-Bericht meldet aber "aktuell":'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.ap
     JOIN ((apflora.pop
     JOIN (apflora.popber
     JOIN apflora.v_pop_letzterpopber0_overall ON (((v_pop_letzterpopber0_overall.jahr = popber.jahr) AND (v_pop_letzterpopber0_overall.pop_id = popber.pop_id)))) ON ((popber.pop_id = pop.id)))
     JOIN apflora.tpop ON ((tpop.pop_id = pop.id))) ON ((pop.ap_id = ap.id)))
  WHERE ((popber.entwicklung < 8) AND (pop.status = ANY (ARRAY[101, 202, 211])) AND (tpop.apber_relevant = 1));




CREATE VIEW apflora.v_qk_pop_statuserloschenletzterpopbererloschenmitansiedlung AS
 WITH lastpopber AS (
         SELECT DISTINCT ON (popber.pop_id) popber.pop_id,
            popber.jahr,
            popber.entwicklung
           FROM apflora.popber
          WHERE (popber.jahr IS NOT NULL)
          ORDER BY popber.pop_id, popber.jahr DESC
        )
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Population: Status ist "erloschen" (ursprünglich oder angesiedelt); der letzte Populations-Bericht meldet "erloschen". Seither gab es aber eine Ansiedlung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN (apflora.pop
     JOIN lastpopber ON ((pop.id = lastpopber.pop_id))) ON ((ap.id = pop.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((pop.status = ANY (ARRAY[101, 202, 211])) AND (lastpopber.entwicklung = 8) AND (pop.id IN ( SELECT DISTINCT tpop.pop_id
           FROM (apflora.tpop
             JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id)))
          WHERE ((tpopmassn.typ >= 1) AND (tpopmassn.typ <= 3) AND (tpopmassn.jahr > lastpopber.jahr)))));




CREATE VIEW apflora.v_qk_pop_statuserloschenletzterpopberstabil AS
 WITH lastpopber AS (
         SELECT DISTINCT ON (popber.pop_id) popber.pop_id,
            popber.jahr,
            popber.entwicklung
           FROM apflora.popber
          WHERE (popber.jahr IS NOT NULL)
          ORDER BY popber.pop_id, popber.jahr DESC
        )
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Population: Status ist "erloschen" (ursprünglich oder angesiedelt), Ansaatversuch oder potentieller Wuchsort; der letzte Populations-Bericht meldet aber "stabil" und es gab seither keine Ansiedlung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN (apflora.pop
     JOIN lastpopber ON ((pop.id = lastpopber.pop_id))) ON ((ap.id = pop.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((pop.status = ANY (ARRAY[101, 201, 202, 211, 300])) AND (lastpopber.entwicklung = 2) AND (NOT (pop.id IN ( SELECT DISTINCT tpop.pop_id
           FROM (apflora.tpop
             JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id)))
          WHERE ((tpopmassn.typ >= 1) AND (tpopmassn.typ <= 3) AND (tpopmassn.jahr > lastpopber.jahr))))));




CREATE VIEW apflora.v_qk_pop_statuserloschenletzterpopberunsicher AS
 WITH lastpopber AS (
         SELECT DISTINCT ON (popber.pop_id) popber.pop_id,
            popber.jahr,
            popber.entwicklung
           FROM apflora.popber
          WHERE (popber.jahr IS NOT NULL)
          ORDER BY popber.pop_id, popber.jahr DESC
        )
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Population: Status ist "erloschen" (ursprünglich oder angesiedelt) oder potentieller Wuchsort; der letzte Populations-Bericht meldet aber "unsicher" und es gab seither keine Ansiedlung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN (apflora.pop
     JOIN lastpopber ON ((pop.id = lastpopber.pop_id))) ON ((ap.id = pop.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((pop.status = ANY (ARRAY[101, 202, 211, 300])) AND (lastpopber.entwicklung = 4) AND (NOT (pop.id IN ( SELECT DISTINCT tpop.pop_id
           FROM (apflora.tpop
             JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id)))
          WHERE ((tpopmassn.typ >= 1) AND (tpopmassn.typ <= 3) AND (tpopmassn.jahr > lastpopber.jahr))))));




CREATE VIEW apflora.v_qk_pop_statuserloschenletzterpopberzunehmend AS
 WITH lastpopber AS (
         SELECT DISTINCT ON (popber.pop_id) popber.pop_id,
            popber.jahr,
            popber.entwicklung
           FROM apflora.popber
          WHERE (popber.jahr IS NOT NULL)
          ORDER BY popber.pop_id, popber.jahr DESC
        )
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Population: Status ist "erloschen" (ursprünglich oder angesiedelt), Ansaatversuch oder potentieller Wuchsort; der letzte Populations-Bericht meldet aber "zunehmend" und es gab seither keine Ansiedlung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN (apflora.pop
     JOIN lastpopber ON ((pop.id = lastpopber.pop_id))) ON ((ap.id = pop.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((pop.status = ANY (ARRAY[101, 201, 202, 211, 300])) AND (lastpopber.entwicklung = 3) AND (NOT (pop.id IN ( SELECT DISTINCT tpop.pop_id
           FROM (apflora.tpop
             JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id)))
          WHERE ((tpopmassn.typ >= 1) AND (tpopmassn.typ <= 3) AND (tpopmassn.jahr > lastpopber.jahr))))));




CREATE VIEW apflora.v_qk_pop_statuserloschenmittpopaktuell AS
 SELECT DISTINCT ap.proj_id,
    pop.ap_id,
    'Population: Status ist "erloschen" (urspruenglich oder angesiedelt), es gibt aber eine Teilpopulation mit Status "aktuell" (urspruenglich oder angesiedelt):'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr): ', pop.nr)] AS text
   FROM (apflora.ap
     JOIN apflora.pop ON ((pop.ap_id = ap.id)))
  WHERE ((pop.status = ANY (ARRAY[101, 202, 211])) AND (pop.id IN ( SELECT DISTINCT tpop.pop_id
           FROM apflora.tpop
          WHERE (tpop.status = ANY (ARRAY[100, 200, 210])))));




CREATE VIEW apflora.v_qk_pop_statuserloschenmittpopansaatversuch AS
 SELECT DISTINCT ap.proj_id,
    pop.ap_id,
    'Population: Status ist "erloschen" (urspruenglich oder angesiedelt), es gibt aber eine Teilpopulation mit Status "angesiedelt, Ansaatversuch":'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr): ', pop.nr)] AS text
   FROM (apflora.ap
     JOIN apflora.pop ON ((pop.ap_id = ap.id)))
  WHERE ((pop.status = ANY (ARRAY[101, 202, 211])) AND (pop.id IN ( SELECT DISTINCT tpop.pop_id
           FROM apflora.tpop
          WHERE (tpop.status = 201))));




CREATE VIEW apflora.v_qk_pop_statuspotwuchsortmittpopanders AS
 SELECT DISTINCT ap.proj_id,
    pop.ap_id,
    'Population: Status ist "potenzieller Wuchs-/Ansiedlungsort", es gibt aber eine Teilpopulation mit Status "angesiedelt" oder "urspruenglich":'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text] AS url,
    ARRAY[concat('Population (Nr): ', pop.nr)] AS text
   FROM (apflora.ap
     JOIN apflora.pop ON ((pop.ap_id = ap.id)))
  WHERE ((pop.status = 300) AND (pop.id IN ( SELECT DISTINCT tpop.pop_id
           FROM apflora.tpop
          WHERE (tpop.status < 300))));




CREATE VIEW apflora.v_qk_popber_ohneentwicklung AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Populations-Bericht ohne Entwicklung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Kontroll-Berichte'::text, (popber.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Populations-Bericht (Jahr): ', popber.jahr)] AS text,
    popber.jahr AS "Berichtjahr"
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.popber ON ((pop.id = popber.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((popber.entwicklung IS NULL) AND (popber.jahr IS NOT NULL))
  ORDER BY pop.nr, popber.jahr;




CREATE VIEW apflora.v_qk_popber_ohnejahr AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Populations-Bericht ohne Jahr:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Kontroll-Berichte'::text, (popber.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Populations-Bericht (Jahr): ', popber.jahr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.popber ON ((pop.id = popber.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE (popber.jahr IS NULL)
  ORDER BY pop.nr, popber.jahr;




CREATE VIEW apflora.v_qk_popmassnber_ohneentwicklung AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Populations-Massnahmen-Bericht ohne Entwicklung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Massnahmen-Berichte'::text, (popmassnber.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Populations-Massnahmen-Bericht (Jahr): ', popmassnber.jahr)] AS text,
    popmassnber.jahr AS "Berichtjahr"
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.popmassnber ON ((pop.id = popmassnber.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((popmassnber.beurteilung IS NULL) AND (popmassnber.jahr IS NOT NULL))
  ORDER BY pop.nr, popmassnber.jahr;




CREATE VIEW apflora.v_qk_popmassnber_ohnejahr AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Populations-Massnahmen-Bericht ohne Jahr:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Massnahmen-Berichte'::text, (popmassnber.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Populations-Massnahmen-Bericht (Jahr): ', popmassnber.jahr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.popmassnber ON ((pop.id = popmassnber.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE (popmassnber.jahr IS NULL)
  ORDER BY pop.nr, popmassnber.jahr;




CREATE VIEW apflora.v_qk_tpop_erloschenundrelevantaberletztebeobvor1950_maxbeobjahr AS
 SELECT beob.tpop_id AS id,
    max(date_part('year'::text, beob.datum)) AS "MaxJahr"
   FROM apflora.beob
  WHERE ((beob.datum IS NOT NULL) AND (beob.tpop_id IS NOT NULL))
  GROUP BY beob.tpop_id;




CREATE VIEW apflora.v_qk_tpop_erloschenundrelevantaberletztebeobvor1950 AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'erloschene Teilpopulation "Fuer AP-Bericht relevant" aber letzte Beobachtung vor 1950:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpop.status = ANY (ARRAY[101, 202, 211])) AND (tpop.apber_relevant = 1) AND (NOT (tpop.id IN ( SELECT DISTINCT tpopkontr.tpop_id
           FROM (apflora.tpopkontr
             JOIN apflora.tpopkontrzaehl ON ((tpopkontr.id = tpopkontrzaehl.tpopkontr_id)))
          WHERE (((tpopkontr.typ)::text <> ALL (ARRAY[('Zwischenziel'::character varying)::text, ('Ziel'::character varying)::text])) AND (tpopkontrzaehl.anzahl > 0))))) AND (tpop.id IN ( SELECT beob.tpop_id
           FROM (apflora.beob
             JOIN apflora.v_qk_tpop_erloschenundrelevantaberletztebeobvor1950_maxbeobjahr ON ((beob.tpop_id = v_qk_tpop_erloschenundrelevantaberletztebeobvor1950_maxbeobjahr.id)))
          WHERE (v_qk_tpop_erloschenundrelevantaberletztebeobvor1950_maxbeobjahr."MaxJahr" < (1950)::double precision))))
  ORDER BY pop.nr, tpop.nr;




CREATE VIEW apflora.v_qk_tpop_mitstatusaktuellundtpopbererloschen_maxtpopberjahr AS
 SELECT tpopber.tpop_id,
    max(tpopber.jahr) AS "MaxTPopBerJahr"
   FROM apflora.tpopber
  GROUP BY tpopber.tpop_id;




CREATE VIEW apflora.v_tpopkontr_letztesjahr AS
 SELECT tpop.id,
    max(tpopkontr.jahr) AS "MaxTPopKontrJahr",
    count(tpopkontr.id) AS "AnzTPopKontr"
   FROM (apflora.tpop
     LEFT JOIN apflora.tpopkontr ON ((tpop.id = tpopkontr.tpop_id)))
  WHERE ((((tpopkontr.typ)::text <> ALL (ARRAY[('Ziel'::character varying)::text, ('Zwischenziel'::character varying)::text])) AND (tpopkontr.jahr IS NOT NULL)) OR ((tpopkontr.typ IS NULL) AND (tpopkontr.jahr IS NULL)))
  GROUP BY tpop.id;




CREATE VIEW apflora.v_tpopkontr_letzteid AS
 SELECT v_tpopkontr_letztesjahr.id,
    max((tpopkontr.id)::text) AS "MaxTPopKontrId",
    max(v_tpopkontr_letztesjahr."AnzTPopKontr") AS "AnzTPopKontr"
   FROM (apflora.tpopkontr
     JOIN apflora.v_tpopkontr_letztesjahr ON (((v_tpopkontr_letztesjahr."MaxTPopKontrJahr" = tpopkontr.jahr) AND (tpopkontr.tpop_id = v_tpopkontr_letztesjahr.id))))
  GROUP BY v_tpopkontr_letztesjahr.id;




CREATE VIEW apflora.v_qk_tpop_mitstatusansaatversuchundzaehlungmitanzahl AS
 SELECT DISTINCT ap.proj_id,
    pop.ap_id,
    pop.id AS pop_id,
    tpop.id,
    'Teilpopulation mit Status "Ansaatversuch", bei denen in der letzten Kontrolle eine Anzahl festgestellt wurde:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((tpop.pop_id = pop.id))) ON ((pop.ap_id = ap.id)))
  WHERE ((tpop.status = 201) AND (tpop.id IN ( SELECT DISTINCT tpopkontr.tpop_id
           FROM ((apflora.tpopkontr
             JOIN apflora.tpopkontrzaehl ON ((tpopkontr.id = tpopkontrzaehl.tpopkontr_id)))
             JOIN apflora.v_tpopkontr_letzteid ON (((v_tpopkontr_letzteid.id = tpopkontr.tpop_id) AND (v_tpopkontr_letzteid."MaxTPopKontrId" = (tpopkontr.id)::text))))
          WHERE (((tpopkontr.typ)::text <> ALL (ARRAY[('Zwischenziel'::character varying)::text, ('Ziel'::character varying)::text])) AND (tpopkontrzaehl.anzahl > 0)))));




CREATE VIEW apflora.v_qk_tpop_mitstatuspotentiellundmassnansiedlung AS
 SELECT DISTINCT ap.proj_id,
    pop.ap_id,
    pop.id AS pop_id,
    tpop.id,
    'Teilpopulation mit Status "potentieller Wuchs-/Ansiedlungsort", bei der eine Massnahme des Typs "Ansiedlung" existiert:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((tpop.pop_id = pop.id))) ON ((pop.ap_id = ap.id)))
  WHERE ((tpop.status = 300) AND (tpop.id IN ( SELECT DISTINCT tpopmassn.tpop_id
           FROM apflora.tpopmassn
          WHERE (tpopmassn.typ < 4))));




CREATE VIEW apflora.v_qk_tpop_mitstatuspotentiellundzaehlungmitanzahl AS
 SELECT DISTINCT projekt.id AS proj_id,
    pop.ap_id,
    pop.id AS pop_id,
    tpop.id,
    'Teilpopulation mit Status "potentieller Wuchs-/Ansiedlungsort", bei denen in einer Kontrolle eine Anzahl festgestellt wurde:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((tpop.pop_id = pop.id))) ON ((pop.ap_id = ap.id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((tpop.status = 300) AND (tpop.id IN ( SELECT DISTINCT tpopkontr.tpop_id
           FROM (apflora.tpopkontr
             JOIN apflora.tpopkontrzaehl ON ((tpopkontr.id = tpopkontrzaehl.tpopkontr_id)))
          WHERE (((tpopkontr.typ)::text <> ALL (ARRAY[('Zwischenziel'::character varying)::text, ('Ziel'::character varying)::text])) AND (tpopkontrzaehl.anzahl > 0)))))
  ORDER BY pop.id, tpop.id;




CREATE VIEW apflora.v_qk_tpop_mitstatusunklarohnebegruendung AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Teilpopulation mit "Status unklar", ohne Begruendung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpop.status_unklar = true) AND (tpop.status_unklar_grund IS NULL))
  ORDER BY ap.id, pop.nr, tpop.nr;




CREATE VIEW apflora.v_qk_tpop_ohneapberrelevant AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Teilpopulation ohne "Fuer AP-Bericht relevant":'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE (tpop.apber_relevant IS NULL)
  ORDER BY ap.id, pop.nr, tpop.nr;




CREATE VIEW apflora.v_qk_tpop_ohnebekanntseit AS
 SELECT ap.id AS ap_id,
    'Teilpopulation ohne "bekannt seit":'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE (tpop.bekannt_seit IS NULL)
  ORDER BY ap.id, pop.nr, tpop.nr;




CREATE VIEW apflora.v_qk_tpop_ohneflurname AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Teilpopulation ohne Flurname:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE (tpop.flurname IS NULL)
  ORDER BY ap.id, pop.nr, tpop.nr;




CREATE VIEW apflora.v_qk_tpop_ohnekoordinaten AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Teilpopulation: Mindestens eine Koordinate fehlt:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpop.x IS NULL) OR (tpop.y IS NULL))
  ORDER BY ap.id, pop.nr, tpop.nr;




CREATE VIEW apflora.v_qk_tpop_ohnenr AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Teilpopulation ohne Nr.:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE (tpop.nr IS NULL)
  ORDER BY ap.id, pop.nr, tpop.nr;




CREATE VIEW apflora.v_qk_tpop_ohnestatus AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Teilpopulation ohne Status:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE (tpop.status IS NULL)
  ORDER BY ap.id, pop.nr, tpop.nr;




CREATE VIEW apflora.v_qk_tpop_popnrtpopnrmehrdeutig AS
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Teilpopulation: Die TPop.-Nr. ist mehrdeutig:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((tpop.pop_id = pop.id))) ON ((pop.ap_id = ap.id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((tpop.pop_id IN ( SELECT DISTINCT tpop_1.pop_id
           FROM apflora.tpop tpop_1
          GROUP BY tpop_1.pop_id, tpop_1.nr
         HAVING (count(*) > 1))) AND (tpop.nr IN ( SELECT tpop_1.nr
           FROM apflora.tpop tpop_1
          GROUP BY tpop_1.pop_id, tpop_1.nr
         HAVING (count(*) > 1))))
  ORDER BY projekt.id, ap.id, pop.nr, tpop.nr;




CREATE VIEW apflora.v_qk_tpop_statusaktuellletztertpopbererloschen AS
 WITH lasttpopber AS (
         SELECT DISTINCT ON (tpopber.tpop_id) tpopber.tpop_id,
            tpopber.jahr,
            tpopber.entwicklung
           FROM apflora.tpopber
          WHERE (tpopber.jahr IS NOT NULL)
          ORDER BY tpopber.tpop_id, tpopber.jahr DESC
        )
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Teilpopulation: Status ist "aktuell" (ursprünglich oder angesiedelt) oder potentieller Wuchsort; der letzte Teilpopulations-Bericht meldet aber "erloschen" und es gab seither keine Ansiedlung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN lasttpopber ON ((tpop.id = lasttpopber.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((tpop.status = ANY (ARRAY[100, 200, 210, 300])) AND (lasttpopber.entwicklung = 8) AND (NOT (tpop.id IN ( SELECT tpopmassn.tpop_id
           FROM apflora.tpopmassn
          WHERE ((tpopmassn.tpop_id = tpop.id) AND ((tpopmassn.typ >= 1) AND (tpopmassn.typ <= 3)) AND (tpopmassn.jahr IS NOT NULL) AND (tpopmassn.jahr > lasttpopber.jahr))))));




CREATE VIEW apflora.v_tpop_letztertpopber0_overall AS
 SELECT tpopber.tpop_id,
    max(tpopber.jahr) AS tpopber_jahr
   FROM apflora.tpopber
  WHERE (tpopber.jahr IS NOT NULL)
  GROUP BY tpopber.tpop_id;




CREATE VIEW apflora.v_qk_tpop_statuserloschenletzterpopberaktuell AS
 SELECT DISTINCT ap.proj_id,
    pop.ap_id,
    'Teilpopulation: Status ist "erloschen", der letzte Teilpopulations-Bericht meldet aber "aktuell":'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN (apflora.tpopber
     JOIN apflora.v_tpop_letztertpopber0_overall ON (((v_tpop_letztertpopber0_overall.tpopber_jahr = tpopber.jahr) AND (v_tpop_letztertpopber0_overall.tpop_id = tpopber.tpop_id)))) ON ((tpopber.tpop_id = tpop.id))) ON ((tpop.pop_id = pop.id))) ON ((pop.ap_id = ap.id)))
  WHERE ((tpopber.entwicklung < 8) AND (tpop.status = ANY (ARRAY[101, 202, 211])) AND (NOT (tpop.id IN ( SELECT tpopmassn.tpop_id
           FROM apflora.tpopmassn
          WHERE ((tpopmassn.tpop_id = tpop.id) AND ((tpopmassn.typ >= 1) AND (tpopmassn.typ <= 3)) AND (tpopmassn.jahr IS NOT NULL) AND (tpopmassn.jahr > tpopber.jahr))))));




CREATE VIEW apflora.v_qk_tpop_statuserloschenletztertpopberabnehmend AS
 WITH lasttpopber AS (
         SELECT DISTINCT ON (tpopber.tpop_id) tpopber.tpop_id,
            tpopber.jahr,
            tpopber.entwicklung
           FROM apflora.tpopber
          WHERE (tpopber.jahr IS NOT NULL)
          ORDER BY tpopber.tpop_id, tpopber.jahr DESC
        )
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Teilpopulation: Status ist "erloschen" (ursprünglich oder angesiedelt), Ansaatversuch oder potentieller Wuchsort; der letzte Teilpopulations-Bericht meldet aber "abnehmend" und es gab seither keine Ansiedlung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN lasttpopber ON ((tpop.id = lasttpopber.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((tpop.status = ANY (ARRAY[101, 201, 202, 211, 300])) AND (lasttpopber.entwicklung = 1) AND (NOT (tpop.id IN ( SELECT tpopmassn.tpop_id
           FROM apflora.tpopmassn
          WHERE ((tpopmassn.tpop_id = tpop.id) AND ((tpopmassn.typ >= 1) AND (tpopmassn.typ <= 3)) AND (tpopmassn.jahr IS NOT NULL) AND (tpopmassn.jahr > lasttpopber.jahr))))));




CREATE VIEW apflora.v_qk_tpop_statuserloschenletztertpopbererloschenmitansiedlung AS
 WITH lasttpopber AS (
         SELECT DISTINCT ON (tpopber.tpop_id) tpopber.tpop_id,
            tpopber.jahr,
            tpopber.entwicklung
           FROM apflora.tpopber
          WHERE (tpopber.jahr IS NOT NULL)
          ORDER BY tpopber.tpop_id, tpopber.jahr DESC
        )
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Teilpopulation: Status ist "erloschen" (ursprünglich oder angesiedelt); der letzte Teilpopulations-Bericht meldet "erloschen". Seither gab es aber eine Ansiedlung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN lasttpopber ON ((tpop.id = lasttpopber.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((tpop.status = ANY (ARRAY[101, 202, 211])) AND (lasttpopber.entwicklung = 8) AND (tpop.id IN ( SELECT tpopmassn.tpop_id
           FROM apflora.tpopmassn
          WHERE ((tpopmassn.tpop_id = tpop.id) AND ((tpopmassn.typ >= 1) AND (tpopmassn.typ <= 3)) AND (tpopmassn.jahr IS NOT NULL) AND (tpopmassn.jahr > lasttpopber.jahr)))));




CREATE VIEW apflora.v_qk_tpop_statuserloschenletztertpopberstabil AS
 WITH lasttpopber AS (
         SELECT DISTINCT ON (tpopber.tpop_id) tpopber.tpop_id,
            tpopber.jahr,
            tpopber.entwicklung
           FROM apflora.tpopber
          WHERE (tpopber.jahr IS NOT NULL)
          ORDER BY tpopber.tpop_id, tpopber.jahr DESC
        )
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Teilpopulation: Status ist "erloschen" (ursprünglich oder angesiedelt), Ansaatversuch oder potentieller Wuchsort; der letzte Teilpopulations-Bericht meldet aber "stabil" und es gab seither keine Ansiedlung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN lasttpopber ON ((tpop.id = lasttpopber.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((tpop.status = ANY (ARRAY[101, 201, 202, 211, 300])) AND (lasttpopber.entwicklung = 2) AND (NOT (tpop.id IN ( SELECT tpopmassn.tpop_id
           FROM apflora.tpopmassn
          WHERE ((tpopmassn.tpop_id = tpop.id) AND ((tpopmassn.typ >= 1) AND (tpopmassn.typ <= 3)) AND (tpopmassn.jahr IS NOT NULL) AND (tpopmassn.jahr > lasttpopber.jahr))))));




CREATE VIEW apflora.v_qk_tpop_statuserloschenletztertpopberunsicher AS
 WITH lasttpopber AS (
         SELECT DISTINCT ON (tpopber.tpop_id) tpopber.tpop_id,
            tpopber.jahr,
            tpopber.entwicklung
           FROM apflora.tpopber
          WHERE (tpopber.jahr IS NOT NULL)
          ORDER BY tpopber.tpop_id, tpopber.jahr DESC
        )
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Teilpopulation: Status ist "erloschen" (ursprünglich oder angesiedelt) oder potentieller Wuchsort; der letzte Teilpopulations-Bericht meldet aber "unsicher" und es gab seither keine Ansiedlung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN lasttpopber ON ((tpop.id = lasttpopber.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((tpop.status = ANY (ARRAY[101, 202, 211, 300])) AND (lasttpopber.entwicklung = 4) AND (NOT (tpop.id IN ( SELECT tpopmassn.tpop_id
           FROM apflora.tpopmassn
          WHERE ((tpopmassn.tpop_id = tpop.id) AND ((tpopmassn.typ >= 1) AND (tpopmassn.typ <= 3)) AND (tpopmassn.jahr IS NOT NULL) AND (tpopmassn.jahr > lasttpopber.jahr))))));




CREATE VIEW apflora.v_qk_tpop_statuserloschenletztertpopberzunehmend AS
 WITH lasttpopber AS (
         SELECT DISTINCT ON (tpopber.tpop_id) tpopber.tpop_id,
            tpopber.jahr,
            tpopber.entwicklung
           FROM apflora.tpopber
          WHERE (tpopber.jahr IS NOT NULL)
          ORDER BY tpopber.tpop_id, tpopber.jahr DESC
        )
 SELECT projekt.id AS proj_id,
    ap.id AS ap_id,
    'Teilpopulation: Status ist "erloschen" (ursprünglich oder angesiedelt), Ansaatversuch oder potentieller Wuchsort; der letzte Teilpopulations-Bericht meldet aber "zunehmend" und es gab seither keine Ansiedlung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr)] AS text
   FROM (apflora.projekt
     JOIN (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN lasttpopber ON ((tpop.id = lasttpopber.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id))) ON ((projekt.id = ap.proj_id)))
  WHERE ((tpop.status = ANY (ARRAY[101, 201, 202, 211, 300])) AND (lasttpopber.entwicklung = 3) AND (NOT (tpop.id IN ( SELECT tpopmassn.tpop_id
           FROM apflora.tpopmassn
          WHERE ((tpopmassn.tpop_id = tpop.id) AND ((tpopmassn.typ >= 1) AND (tpopmassn.typ <= 3)) AND (tpopmassn.jahr IS NOT NULL) AND (tpopmassn.jahr > lasttpopber.jahr))))));




CREATE VIEW apflora.v_qk_tpop_statuspotentiellfuerapberrelevant AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Teilpopulation mit Status "potenzieller Wuchs-/Ansiedlungsort" und "Fuer AP-Bericht relevant?" = ja:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpop.status = 300) AND (tpop.apber_relevant = 1))
  ORDER BY ap.id, pop.nr, tpop.nr;




CREATE VIEW apflora.v_qk_tpopber_ohneentwicklung AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Teilpopulations-Bericht ohne Entwicklung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text, 'Kontroll-Berichte'::text, (tpopber.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr), concat('Teilpopulations-Bericht (Jahr): ', tpopber.jahr)] AS text,
    tpopber.jahr AS "Berichtjahr"
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN apflora.tpopber ON ((tpop.id = tpopber.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpopber.entwicklung IS NULL) AND (tpopber.jahr IS NOT NULL))
  ORDER BY pop.nr, tpop.nr, tpopber.jahr;




CREATE VIEW apflora.v_qk_tpopber_ohnejahr AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Teilpopulations-Bericht ohne Jahr:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text, 'Kontroll-Berichte'::text, (tpopber.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr), concat('Teilpopulations-Bericht (id): ', tpopber.id)] AS text
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN apflora.tpopber ON ((tpop.id = tpopber.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE (tpopber.jahr IS NULL)
  ORDER BY pop.nr, tpop.nr, tpopber.jahr;




CREATE VIEW apflora.v_qk_ziel_ohnejahr AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Ziel ohne Jahr:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Ziele'::text, (ziel.id)::text] AS url,
    ARRAY[concat('Ziel (id): ', ziel.id)] AS text
   FROM (apflora.ap
     JOIN apflora.ziel ON ((ap.id = ziel.ap_id)))
  WHERE ((ziel.jahr IS NULL) OR (ziel.jahr = 1))
  ORDER BY ziel.id;




CREATE VIEW apflora.v_qk_ziel_ohnetyp AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Ziel ohne Typ:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Ziele'::text, (ziel.id)::text] AS url,
    ARRAY[concat('Ziel (Jahr): ', ziel.jahr)] AS text
   FROM (apflora.ap
     JOIN apflora.ziel ON ((ap.id = ziel.ap_id)))
  WHERE (ziel.typ IS NULL)
  ORDER BY ziel.jahr;




CREATE VIEW apflora.v_qk_ziel_ohneziel AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Ziel ohne Ziel:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Ziele'::text, (ziel.id)::text] AS url,
    ARRAY[concat('Ziel (Jahr): ', ziel.jahr)] AS text
   FROM (apflora.ap
     JOIN apflora.ziel ON ((ap.id = ziel.ap_id)))
  WHERE (ziel.bezeichnung IS NULL)
  ORDER BY ziel.jahr;




CREATE VIEW apflora.v_qk_zielber_ohneentwicklung AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Ziel-Bericht ohne Entwicklung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Ziele'::text, (ziel.id)::text, 'Berichte'::text, (zielber.id)::text] AS url,
    ARRAY[concat('Ziel (Jahr): ', ziel.jahr), concat('Ziel-Bericht (Jahr): ', zielber.jahr)] AS text,
    zielber.jahr AS "Berichtjahr"
   FROM (apflora.ap
     JOIN (apflora.ziel
     JOIN apflora.zielber ON ((ziel.id = zielber.ziel_id))) ON ((ap.id = ziel.ap_id)))
  WHERE ((zielber.erreichung IS NULL) AND (zielber.jahr IS NOT NULL))
  ORDER BY ziel.jahr, ziel.id, zielber.jahr;




CREATE VIEW apflora.v_qk_zielber_ohnejahr AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Ziel-Bericht ohne Jahr:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Ziele'::text, (ziel.id)::text, 'Berichte'::text, (zielber.id)::text] AS url,
    ARRAY[concat('Ziel (Jahr): ', ziel.jahr), concat('Ziel-Bericht (Jahr): ', zielber.jahr)] AS text
   FROM (apflora.ap
     JOIN (apflora.ziel
     JOIN apflora.zielber ON ((ziel.id = zielber.ziel_id))) ON ((ap.id = ziel.ap_id)))
  WHERE (zielber.jahr IS NULL)
  ORDER BY ziel.jahr, ziel.id, zielber.jahr;




CREATE VIEW apflora.v_tpop AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.familie,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    adresse.name AS ap_bearbeiter,
    pop.id AS pop_id,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    pop_status_werte.text AS pop_status,
    pop.bekannt_seit AS pop_bekannt_seit,
    pop.status_unklar AS pop_status_unklar,
    pop.status_unklar_begruendung AS pop_status_unklar_begruendung,
    pop.x AS pop_x,
    pop.y AS pop_y,
    tpop.id,
    tpop.nr,
    tpop.gemeinde,
    tpop.flurname,
    pop_status_werte_2.text AS status,
    tpop.bekannt_seit,
    tpop.status_unklar,
    tpop.status_unklar_grund,
    tpop.x,
    tpop.y,
    tpop.radius,
    tpop.hoehe,
    tpop.exposition,
    tpop.klima,
    tpop.neigung,
    tpop.beschreibung,
    tpop.kataster_nr,
    tpop.apber_relevant,
    tpop.eigentuemer,
    tpop.kontakt,
    tpop.nutzungszone,
    tpop.bewirtschafter,
    tpop.bewirtschaftung,
    tpop.changed,
    tpop.changed_by
   FROM (((((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     LEFT JOIN apflora.pop_status_werte pop_status_werte_2 ON ((tpop.status = pop_status_werte_2.code)))
     LEFT JOIN apflora.adresse ON ((ap.bearbeiter = adresse.id)))
  WHERE (ae_eigenschaften.taxid > 150)
  ORDER BY ae_eigenschaften.artname, pop.nr, tpop.nr;




CREATE VIEW apflora.v_tpop_letztekontrid AS
 SELECT tpop.id,
    v_tpopkontr_letzteid."MaxTPopKontrId",
    v_tpopkontr_letzteid."AnzTPopKontr"
   FROM (apflora.tpop
     LEFT JOIN apflora.v_tpopkontr_letzteid ON ((tpop.id = v_tpopkontr_letzteid.id)));




CREATE VIEW apflora.v_tpopkontr AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.familie,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    apflora_adresse_1.name AS ap_bearbeiter,
    pop.id AS pop_id,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    pop_status_werte.text AS pop_status,
    pop.bekannt_seit AS pop_bekannt_seit,
    tpop.id AS tpop_id,
    tpop.nr AS tpop_nr,
    tpop.gemeinde AS tpop_gemeinde,
    tpop.flurname AS tpop_flurname,
    pop_status_werte_2.text AS tpop_status,
    tpop.bekannt_seit AS tpop_bekannt_seit,
    tpop.status_unklar AS tpop_status_unklar,
    tpop.status_unklar_grund AS tpop_status_unklar_grund,
    tpop.x AS tpop_x,
    tpop.y AS tpop_y,
    tpop.radius AS tpop_radius,
    tpop.hoehe AS tpop_hoehe,
    tpop.exposition AS tpop_exposition,
    tpop.klima AS tpop_klima,
    tpop.neigung AS tpop_neigung,
    tpop.beschreibung AS tpop_beschreibung,
    tpop.kataster_nr AS tpop_kataster_nr,
    tpop.apber_relevant AS tpop_apber_relevant,
    tpop.eigentuemer AS tpop_eigentuemer,
    tpop.kontakt AS tpop_kontakt,
    tpop.nutzungszone AS tpop_nutzungszone,
    tpop.bewirtschafter AS tpop_bewirtschafter,
    tpop.bewirtschaftung AS tpop_bewirtschaftung,
    tpopkontr.id,
    tpopkontr.jahr,
    tpopkontr.datum,
    tpopkontr_typ_werte.text AS typ,
    adresse.name AS bearbeiter,
    tpopkontr.ueberlebensrate,
    tpopkontr.vitalitaet,
    tpop_entwicklung_werte.text AS entwicklung,
    tpopkontr.ursachen,
    tpopkontr.erfolgsbeurteilung,
    tpopkontr.umsetzung_aendern,
    tpopkontr.kontrolle_aendern,
    tpopkontr.bemerkungen,
    tpopkontr.lr_delarze,
    tpopkontr.lr_umgebung_delarze,
    tpopkontr.vegetationstyp,
    tpopkontr.konkurrenz,
    tpopkontr.moosschicht,
    tpopkontr.krautschicht,
    tpopkontr.strauchschicht,
    tpopkontr.baumschicht,
    tpopkontr.boden_typ,
    tpopkontr.boden_kalkgehalt,
    tpopkontr.boden_durchlaessigkeit,
    tpopkontr.boden_humus,
    tpopkontr.boden_naehrstoffgehalt,
    tpopkontr.boden_abtrag,
    tpopkontr.wasserhaushalt,
    tpopkontr_idbiotuebereinst_werte.text AS idealbiotop_uebereinstimmung,
    tpopkontr.handlungsbedarf,
    tpopkontr.flaeche_ueberprueft,
    tpopkontr.flaeche,
    tpopkontr.plan_vorhanden,
    tpopkontr.deckung_vegetation,
    tpopkontr.deckung_nackter_boden,
    tpopkontr.deckung_ap_art,
    tpopkontr.jungpflanzen_vorhanden,
    tpopkontr.vegetationshoehe_maximum,
    tpopkontr.vegetationshoehe_mittel,
    tpopkontr.gefaehrdung,
    tpopkontr.changed,
    tpopkontr.changed_by,
    array_to_string(array_agg(tpopkontrzaehl.anzahl), ', '::text) AS zaehlung_anzahlen,
    string_agg((tpopkontrzaehl_einheit_werte.text)::text, ', '::text) AS zaehlung_einheiten,
    string_agg((tpopkontrzaehl_methode_werte.text)::text, ', '::text) AS zaehlung_methoden
   FROM (apflora.pop_status_werte pop_status_werte_2
     RIGHT JOIN (((((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN ((((((apflora.tpopkontr
     LEFT JOIN apflora.tpopkontr_typ_werte ON (((tpopkontr.typ)::text = (tpopkontr_typ_werte.text)::text)))
     LEFT JOIN apflora.adresse ON ((tpopkontr.bearbeiter = adresse.id)))
     LEFT JOIN apflora.tpop_entwicklung_werte ON ((tpopkontr.entwicklung = tpop_entwicklung_werte.code)))
     LEFT JOIN apflora.tpopkontrzaehl ON ((tpopkontr.id = tpopkontrzaehl.tpopkontr_id)))
     LEFT JOIN apflora.tpopkontrzaehl_einheit_werte ON ((tpopkontrzaehl.einheit = tpopkontrzaehl_einheit_werte.code)))
     LEFT JOIN apflora.tpopkontrzaehl_methode_werte ON ((tpopkontrzaehl.methode = tpopkontrzaehl_methode_werte.code))) ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     LEFT JOIN apflora.tpopkontr_idbiotuebereinst_werte ON ((tpopkontr.idealbiotop_uebereinstimmung = tpopkontr_idbiotuebereinst_werte.code)))
     LEFT JOIN apflora.adresse apflora_adresse_1 ON ((ap.bearbeiter = apflora_adresse_1.id))) ON ((pop_status_werte_2.code = tpop.status)))
  WHERE (ae_eigenschaften.taxid > 150)
  GROUP BY ap.id, ae_eigenschaften.familie, ae_eigenschaften.artname, ap_bearbstand_werte.text, ap.start_jahr, ap_umsetzung_werte.text, apflora_adresse_1.name, pop.id, pop.nr, pop.name, pop_status_werte.text, pop.bekannt_seit, tpop.id, tpop.nr, tpop.gemeinde, tpop.flurname, pop_status_werte_2.text, tpop.bekannt_seit, tpop.status_unklar, tpop.status_unklar_grund, tpop.x, tpop.y, tpop.radius, tpop.hoehe, tpop.exposition, tpop.klima, tpop.neigung, tpop.beschreibung, tpop.kataster_nr, tpop.apber_relevant, tpop.eigentuemer, tpop.kontakt, tpop.nutzungszone, tpop.bewirtschafter, tpop.bewirtschaftung, tpopkontr.id, tpopkontr.tpop_id, tpopkontr.jahr, tpopkontr.datum, tpopkontr_typ_werte.text, adresse.name, tpopkontr.ueberlebensrate, tpopkontr.vitalitaet, tpop_entwicklung_werte.text, tpopkontr.ursachen, tpopkontr.erfolgsbeurteilung, tpopkontr.umsetzung_aendern, tpopkontr.kontrolle_aendern, tpopkontr.bemerkungen, tpopkontr.lr_delarze, tpopkontr.lr_umgebung_delarze, tpopkontr.vegetationstyp, tpopkontr.konkurrenz, tpopkontr.moosschicht, tpopkontr.krautschicht, tpopkontr.strauchschicht, tpopkontr.baumschicht, tpopkontr.boden_typ, tpopkontr.boden_kalkgehalt, tpopkontr.boden_durchlaessigkeit, tpopkontr.boden_humus, tpopkontr.boden_naehrstoffgehalt, tpopkontr.boden_abtrag, tpopkontr.wasserhaushalt, tpopkontr_idbiotuebereinst_werte.text, tpopkontr.handlungsbedarf, tpopkontr.flaeche_ueberprueft, tpopkontr.flaeche, tpopkontr.plan_vorhanden, tpopkontr.deckung_vegetation, tpopkontr.deckung_nackter_boden, tpopkontr.deckung_ap_art, tpopkontr.jungpflanzen_vorhanden, tpopkontr.vegetationshoehe_maximum, tpopkontr.vegetationshoehe_mittel, tpopkontr.gefaehrdung, tpopkontr.changed, tpopkontr.changed_by
  ORDER BY ae_eigenschaften.artname, pop.nr, tpop.nr;




CREATE VIEW apflora.v_tpop_anzkontrinklletzter AS
 SELECT v_tpop.ap_id,
    v_tpop.familie,
    v_tpop.artname,
    v_tpop.ap_bearbeitung,
    v_tpop.ap_start_jahr,
    v_tpop.ap_umsetzung,
    v_tpop.ap_bearbeiter,
    v_tpop.pop_id,
    v_tpop.pop_nr,
    v_tpop.pop_name,
    v_tpop.pop_status,
    v_tpop.pop_bekannt_seit,
    v_tpop.pop_status_unklar,
    v_tpop.pop_status_unklar_begruendung,
    v_tpop.pop_x,
    v_tpop.pop_y,
    v_tpop.id,
    v_tpop.nr,
    v_tpop.gemeinde,
    v_tpop.flurname,
    v_tpop.status,
    v_tpop.bekannt_seit,
    v_tpop.status_unklar,
    v_tpop.status_unklar_grund,
    v_tpop.x,
    v_tpop.y,
    v_tpop.radius,
    v_tpop.hoehe,
    v_tpop.exposition,
    v_tpop.klima,
    v_tpop.neigung,
    v_tpop.beschreibung,
    v_tpop.kataster_nr,
    v_tpop.apber_relevant,
    v_tpop.eigentuemer,
    v_tpop.kontakt,
    v_tpop.nutzungszone,
    v_tpop.bewirtschafter,
    v_tpop.bewirtschaftung,
    v_tpop.changed,
    v_tpop.changed_by,
    v_tpop_letztekontrid."AnzTPopKontr" AS anzahl_kontrollen,
    v_tpopkontr.id AS kontr_id,
    v_tpopkontr.jahr AS kontr_jahr,
    v_tpopkontr.datum AS kontr_datum,
    v_tpopkontr.typ AS kontr_typ,
    v_tpopkontr.bearbeiter AS kontr_bearbeiter,
    v_tpopkontr.ueberlebensrate AS kontr_ueberlebensrate,
    v_tpopkontr.vitalitaet AS kontr_vitalitaet,
    v_tpopkontr.entwicklung AS kontr_entwicklung,
    v_tpopkontr.ursachen AS kontr_ursachen,
    v_tpopkontr.erfolgsbeurteilung AS kontr_erfolgsbeurteilung,
    v_tpopkontr.umsetzung_aendern AS kontr_umsetzung_aendern,
    v_tpopkontr.kontrolle_aendern AS kontr_kontrolle_aendern,
    v_tpopkontr.bemerkungen AS kontr_bemerkungen,
    v_tpopkontr.lr_delarze AS kontr_lr_delarze,
    v_tpopkontr.lr_umgebung_delarze AS kontr_lr_umgebung_delarze,
    v_tpopkontr.vegetationstyp AS kontr_vegetationstyp,
    v_tpopkontr.konkurrenz AS kontr_konkurrenz,
    v_tpopkontr.moosschicht AS kontr_moosschicht,
    v_tpopkontr.krautschicht AS kontr_krautschicht,
    v_tpopkontr.strauchschicht AS kontr_strauchschicht,
    v_tpopkontr.baumschicht AS kontr_baumschicht,
    v_tpopkontr.boden_typ AS kontr_boden_typ,
    v_tpopkontr.boden_kalkgehalt AS kontr_boden_kalkgehalt,
    v_tpopkontr.boden_durchlaessigkeit AS kontr_boden_durchlaessigkeit,
    v_tpopkontr.boden_humus AS kontr_boden_humus,
    v_tpopkontr.boden_naehrstoffgehalt AS kontr_boden_naehrstoffgehalt,
    v_tpopkontr.boden_abtrag AS kontr_boden_abtrag,
    v_tpopkontr.wasserhaushalt AS kontr_wasserhaushalt,
    v_tpopkontr.idealbiotop_uebereinstimmung AS kontr_idealbiotop_uebereinstimmung,
    v_tpopkontr.handlungsbedarf AS kontr_handlungsbedarf,
    v_tpopkontr.flaeche_ueberprueft AS kontr_flaeche_ueberprueft,
    v_tpopkontr.flaeche AS kontr_flaeche,
    v_tpopkontr.plan_vorhanden AS kontr_plan_vorhanden,
    v_tpopkontr.deckung_vegetation AS kontr_deckung_vegetation,
    v_tpopkontr.deckung_nackter_boden AS kontr_deckung_nackter_boden,
    v_tpopkontr.deckung_ap_art AS kontr_deckung_ap_art,
    v_tpopkontr.jungpflanzen_vorhanden AS kontr_jungpflanzen_vorhanden,
    v_tpopkontr.vegetationshoehe_maximum AS kontr_vegetationshoehe_maximum,
    v_tpopkontr.vegetationshoehe_mittel AS kontr_vegetationshoehe_mittel,
    v_tpopkontr.gefaehrdung AS kontr_gefaehrdung,
    v_tpopkontr.changed AS kontr_changed,
    v_tpopkontr.changed_by AS kontr_changed_by,
    v_tpopkontr.zaehlung_anzahlen,
    v_tpopkontr.zaehlung_einheiten,
    v_tpopkontr.zaehlung_methoden
   FROM ((apflora.v_tpop_letztekontrid
     LEFT JOIN apflora.v_tpopkontr ON ((v_tpop_letztekontrid."MaxTPopKontrId" = (v_tpopkontr.id)::text)))
     JOIN apflora.v_tpop ON ((v_tpop_letztekontrid.id = v_tpop.id)));




CREATE VIEW apflora.v_tpopber_letzteid AS
 SELECT tpopkontr.tpop_id,
    ( SELECT tpopber_1.id
           FROM apflora.tpopber tpopber_1
          WHERE (tpopber_1.tpop_id = tpopkontr.tpop_id)
          ORDER BY tpopber_1.changed DESC
         LIMIT 1) AS tpopber_letzte_id,
    max(tpopber.jahr) AS tpopber_jahr_max,
    count(tpopber.id) AS tpopber_anz
   FROM (apflora.tpopkontr
     JOIN apflora.tpopber ON ((tpopkontr.tpop_id = tpopber.tpop_id)))
  WHERE (((tpopkontr.typ)::text <> ALL (ARRAY[('Ziel'::character varying)::text, ('Zwischenziel'::character varying)::text])) AND (tpopber.jahr IS NOT NULL))
  GROUP BY tpopkontr.tpop_id;




CREATE VIEW apflora.v_tpopber_mitletzterid AS
 SELECT tpopber.tpop_id,
    v_tpopber_letzteid.tpopber_anz,
    tpopber.id,
    tpopber.jahr,
    tpop_entwicklung_werte.text AS entwicklung,
    tpopber.bemerkungen,
    tpopber.changed,
    tpopber.changed_by
   FROM ((apflora.v_tpopber_letzteid
     JOIN apflora.tpopber ON (((v_tpopber_letzteid.tpopber_letzte_id = tpopber.id) AND (v_tpopber_letzteid.tpop_id = tpopber.tpop_id))))
     LEFT JOIN apflora.tpop_entwicklung_werte ON ((tpopber.entwicklung = tpop_entwicklung_werte.code)));




CREATE VIEW apflora.v_tpop_anzkontrinklletzterundletztertpopber AS
 SELECT v_tpop_anzkontrinklletzter.ap_id,
    v_tpop_anzkontrinklletzter.familie,
    v_tpop_anzkontrinklletzter.artname,
    v_tpop_anzkontrinklletzter.ap_bearbeitung,
    v_tpop_anzkontrinklletzter.ap_start_jahr,
    v_tpop_anzkontrinklletzter.ap_umsetzung,
    v_tpop_anzkontrinklletzter.ap_bearbeiter,
    v_tpop_anzkontrinklletzter.pop_id,
    v_tpop_anzkontrinklletzter.pop_nr,
    v_tpop_anzkontrinklletzter.pop_name,
    v_tpop_anzkontrinklletzter.pop_status,
    v_tpop_anzkontrinklletzter.pop_bekannt_seit,
    v_tpop_anzkontrinklletzter.pop_status_unklar,
    v_tpop_anzkontrinklletzter.pop_status_unklar_begruendung,
    v_tpop_anzkontrinklletzter.pop_x,
    v_tpop_anzkontrinklletzter.pop_y,
    v_tpop_anzkontrinklletzter.id,
    v_tpop_anzkontrinklletzter.nr,
    v_tpop_anzkontrinklletzter.gemeinde,
    v_tpop_anzkontrinklletzter.flurname,
    v_tpop_anzkontrinklletzter.status,
    v_tpop_anzkontrinklletzter.bekannt_seit,
    v_tpop_anzkontrinklletzter.status_unklar,
    v_tpop_anzkontrinklletzter.status_unklar_grund,
    v_tpop_anzkontrinklletzter.x,
    v_tpop_anzkontrinklletzter.y,
    v_tpop_anzkontrinklletzter.radius,
    v_tpop_anzkontrinklletzter.hoehe,
    v_tpop_anzkontrinklletzter.exposition,
    v_tpop_anzkontrinklletzter.klima,
    v_tpop_anzkontrinklletzter.neigung,
    v_tpop_anzkontrinklletzter.beschreibung,
    v_tpop_anzkontrinklletzter.kataster_nr,
    v_tpop_anzkontrinklletzter.apber_relevant,
    v_tpop_anzkontrinklletzter.eigentuemer,
    v_tpop_anzkontrinklletzter.kontakt,
    v_tpop_anzkontrinklletzter.nutzungszone,
    v_tpop_anzkontrinklletzter.bewirtschafter,
    v_tpop_anzkontrinklletzter.bewirtschaftung,
    v_tpop_anzkontrinklletzter.changed,
    v_tpop_anzkontrinklletzter.changed_by,
    v_tpop_anzkontrinklletzter.anzahl_kontrollen,
    v_tpop_anzkontrinklletzter.kontr_id,
    v_tpop_anzkontrinklletzter.kontr_jahr,
    v_tpop_anzkontrinklletzter.kontr_datum,
    v_tpop_anzkontrinklletzter.kontr_typ,
    v_tpop_anzkontrinklletzter.kontr_bearbeiter,
    v_tpop_anzkontrinklletzter.kontr_ueberlebensrate,
    v_tpop_anzkontrinklletzter.kontr_vitalitaet,
    v_tpop_anzkontrinklletzter.kontr_entwicklung,
    v_tpop_anzkontrinklletzter.kontr_ursachen,
    v_tpop_anzkontrinklletzter.kontr_erfolgsbeurteilung,
    v_tpop_anzkontrinklletzter.kontr_umsetzung_aendern,
    v_tpop_anzkontrinklletzter.kontr_kontrolle_aendern,
    v_tpop_anzkontrinklletzter.kontr_bemerkungen,
    v_tpop_anzkontrinklletzter.kontr_lr_delarze,
    v_tpop_anzkontrinklletzter.kontr_lr_umgebung_delarze,
    v_tpop_anzkontrinklletzter.kontr_vegetationstyp,
    v_tpop_anzkontrinklletzter.kontr_konkurrenz,
    v_tpop_anzkontrinklletzter.kontr_moosschicht,
    v_tpop_anzkontrinklletzter.kontr_krautschicht,
    v_tpop_anzkontrinklletzter.kontr_strauchschicht,
    v_tpop_anzkontrinklletzter.kontr_baumschicht,
    v_tpop_anzkontrinklletzter.kontr_boden_typ,
    v_tpop_anzkontrinklletzter.kontr_boden_kalkgehalt,
    v_tpop_anzkontrinklletzter.kontr_boden_durchlaessigkeit,
    v_tpop_anzkontrinklletzter.kontr_boden_humus,
    v_tpop_anzkontrinklletzter.kontr_boden_naehrstoffgehalt,
    v_tpop_anzkontrinklletzter.kontr_boden_abtrag,
    v_tpop_anzkontrinklletzter.kontr_wasserhaushalt,
    v_tpop_anzkontrinklletzter.kontr_idealbiotop_uebereinstimmung,
    v_tpop_anzkontrinklletzter.kontr_handlungsbedarf,
    v_tpop_anzkontrinklletzter.kontr_flaeche_ueberprueft,
    v_tpop_anzkontrinklletzter.kontr_flaeche,
    v_tpop_anzkontrinklletzter.kontr_plan_vorhanden,
    v_tpop_anzkontrinklletzter.kontr_deckung_vegetation,
    v_tpop_anzkontrinklletzter.kontr_deckung_nackter_boden,
    v_tpop_anzkontrinklletzter.kontr_deckung_ap_art,
    v_tpop_anzkontrinklletzter.kontr_jungpflanzen_vorhanden,
    v_tpop_anzkontrinklletzter.kontr_vegetationshoehe_maximum,
    v_tpop_anzkontrinklletzter.kontr_vegetationshoehe_mittel,
    v_tpop_anzkontrinklletzter.kontr_gefaehrdung,
    v_tpop_anzkontrinklletzter.kontr_changed,
    v_tpop_anzkontrinklletzter.kontr_changed_by,
    v_tpop_anzkontrinklletzter.zaehlung_anzahlen,
    v_tpop_anzkontrinklletzter.zaehlung_einheiten,
    v_tpop_anzkontrinklletzter.zaehlung_methoden,
    v_tpopber_mitletzterid.tpopber_anz,
    v_tpopber_mitletzterid.id AS tpopber_id,
    v_tpopber_mitletzterid.jahr AS tpopber_jahr,
    v_tpopber_mitletzterid.entwicklung AS tpopber_entwicklung,
    v_tpopber_mitletzterid.bemerkungen AS tpopber_bemerkungen,
    v_tpopber_mitletzterid.changed AS tpopber_changed,
    v_tpopber_mitletzterid.changed_by AS tpopber_changed_by
   FROM (apflora.v_tpop_anzkontrinklletzter
     LEFT JOIN apflora.v_tpopber_mitletzterid ON ((v_tpop_anzkontrinklletzter.id = v_tpopber_mitletzterid.tpop_id)));




CREATE VIEW apflora.v_tpop_anzmassn AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.familie,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    pop.id AS pop_id,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    pop_status_werte.text AS pop_status,
    pop.bekannt_seit AS pop_bekannt_seit,
    pop.status_unklar AS pop_status_unklar,
    pop.status_unklar_begruendung AS pop_status_unklar_begruendung,
    pop.x AS pop_x,
    pop.y AS pop_y,
    tpop.id,
    tpop.nr,
    tpop.gemeinde,
    tpop.flurname,
    pop_status_werte_2.text AS status,
    tpop.bekannt_seit,
    tpop.status_unklar,
    tpop.status_unklar_grund,
    tpop.x,
    tpop.y,
    tpop.radius,
    tpop.hoehe,
    tpop.exposition,
    tpop.klima,
    tpop.neigung,
    tpop.beschreibung,
    tpop.kataster_nr,
    tpop.apber_relevant,
    tpop.eigentuemer,
    tpop.kontakt,
    tpop.nutzungszone,
    tpop.bewirtschafter,
    tpop.bewirtschaftung,
    count(tpopmassn.id) AS anzahl_massnahmen
   FROM (apflora.ae_eigenschaften
     JOIN (((apflora.ap
     JOIN ((apflora.pop
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     JOIN ((apflora.tpop
     LEFT JOIN apflora.tpopmassn ON ((tpop.id = tpopmassn.tpop_id)))
     LEFT JOIN apflora.pop_status_werte pop_status_werte_2 ON ((tpop.status = pop_status_werte_2.code))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code))) ON ((ae_eigenschaften.id = ap.art_id)))
  GROUP BY ap.id, ae_eigenschaften.familie, ae_eigenschaften.artname, ap_bearbstand_werte.text, ap.start_jahr, ap_umsetzung_werte.text, pop.id, pop.nr, pop.name, pop_status_werte.text, pop.bekannt_seit, pop.status_unklar, pop.status_unklar_begruendung, pop.x, pop.y, tpop.id, tpop.nr, tpop.gemeinde, tpop.flurname, pop_status_werte_2.text, tpop.bekannt_seit, tpop.status_unklar, tpop.status_unklar_grund, tpop.x, tpop.y, tpop.radius, tpop.hoehe, tpop.exposition, tpop.klima, tpop.neigung, tpop.beschreibung, tpop.kataster_nr, tpop.apber_relevant, tpop.eigentuemer, tpop.kontakt, tpop.nutzungszone, tpop.bewirtschafter, tpop.bewirtschaftung
  ORDER BY ae_eigenschaften.artname, pop.nr, tpop.nr;




CREATE VIEW apflora.v_tpop_for_ap AS
 SELECT tpop.id_old,
    tpop.nr,
    tpop.gemeinde,
    tpop.flurname,
    tpop.x,
    tpop.y,
    tpop.radius,
    tpop.hoehe,
    tpop.exposition,
    tpop.klima,
    tpop.neigung,
    tpop.beschreibung,
    tpop.kataster_nr,
    tpop.status,
    tpop.status_unklar_grund,
    tpop.apber_relevant,
    tpop.bekannt_seit,
    tpop.eigentuemer,
    tpop.kontakt,
    tpop.nutzungszone,
    tpop.bewirtschafter,
    tpop.bewirtschaftung,
    tpop.bemerkungen,
    tpop.changed,
    tpop.changed_by,
    tpop.id,
    tpop.pop_id,
    tpop.status_unklar,
    ap.id AS ap_id
   FROM ((apflora.ap
     JOIN apflora.pop ON ((ap.id = pop.ap_id)))
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)));




CREATE VIEW apflora.v_tpop_fuergis_read AS
 SELECT (ap.id)::text AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    (pop.id)::text AS pop_id,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    pop_status_werte.text AS pop_status,
    pop.bekannt_seit AS pop_bekannt_seit,
    pop.status_unklar AS pop_status_unklar,
    pop.status_unklar_begruendung AS pop_status_unklar_begruendung,
    (tpop.id)::text AS tpop_id,
    tpop.nr AS tpop_nr,
    tpop.gemeinde AS tpop_gemeinde,
    tpop.flurname AS tpop_flurname,
    pop_status_werte_2.text AS tpop_status,
    tpop.bekannt_seit AS tpop_bekannt_seit,
    tpop.status_unklar AS tpop_status_unklar,
    tpop.status_unklar_grund AS tpop_status_unklar_grund,
    tpop.x AS tpop_x,
    tpop.y AS tpop_y,
    tpop.radius AS tpop_radius,
    tpop.hoehe AS tpop_hoehe,
    tpop.exposition AS tpop_exposition,
    tpop.klima AS tpop_klima,
    tpop.neigung AS tpop_neigung,
    tpop.beschreibung AS tpop_beschreibung,
    tpop.kataster_nr AS tpop_kataster_nr,
    tpop.apber_relevant AS tpop_apber_relevant,
    tpop.eigentuemer AS tpop_eigentuemer,
    tpop.kontakt AS tpop_kontakt,
    tpop.nutzungszone AS tpop_nutzungszone,
    tpop.bewirtschafter AS tpop_bewirtschafter,
    tpop.bewirtschaftung AS tpop_bewirtschaftung,
    (tpop.changed)::timestamp without time zone AS tpop_changed,
    tpop.changed_by AS tpop_changed_by
   FROM ((((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     LEFT JOIN apflora.pop_status_werte pop_status_werte_2 ON ((tpop.status = pop_status_werte_2.code)))
  WHERE ((tpop.y > 0) AND (tpop.x > 0))
  ORDER BY ae_eigenschaften.artname, pop.nr, tpop.nr;




CREATE VIEW apflora.v_tpop_fuergis_write AS
 SELECT (tpop.pop_id)::text AS pop_id,
    (tpop.id)::text AS tpop_id,
    tpop.nr AS tpop_nr,
    tpop.gemeinde AS tpop_gemeinde,
    tpop.flurname AS tpop_flurname,
    tpop.status AS tpop_status,
    tpop.status_unklar AS tpop_status_unklar,
    tpop.status_unklar_grund AS tpop_status_unklar_grund,
    tpop.x AS tpop_x,
    tpop.y AS tpop_y,
    tpop.radius AS tpop_radius,
    tpop.hoehe AS tpop_hoehe,
    tpop.exposition AS tpop_exposition,
    tpop.klima AS tpop_klima,
    tpop.neigung AS tpop_neigung,
    tpop.beschreibung AS tpop_beschreibung,
    tpop.kataster_nr AS tpop_kataster_nr,
    tpop.apber_relevant AS tpop_apber_relevant,
    tpop.bekannt_seit AS tpop_bekannt_seit,
    tpop.eigentuemer AS tpop_eigentuemer,
    tpop.kontakt AS tpop_kontakt,
    tpop.nutzungszone AS tpop_nutzungszone,
    tpop.bewirtschafter AS tpop_bewirtschafter,
    tpop.bewirtschaftung AS tpop_bewirtschaftung,
    tpop.bemerkungen AS tpop_bemerkungen,
    (tpop.changed)::timestamp without time zone AS tpop_changed,
    tpop.changed_by AS tpop_changed_by
   FROM apflora.tpop;




CREATE VIEW apflora.v_tpop_kml AS
 SELECT ae_eigenschaften.artname AS "Art",
    concat(pop.nr, '/', tpop.nr) AS "Label",
    "substring"(concat('Population: ', pop.nr, ' ', pop.name, '<br /> Teilpopulation: ', tpop.nr, ' ', tpop.gemeinde, ' ', tpop.flurname), 1, 225) AS "Inhalte",
    round(((((((2.6779094 + (4.728982 * (((tpop.x - 600000))::numeric / (1000000)::numeric))) + ((0.791484 * (((tpop.x - 600000))::numeric / (1000000)::numeric)) * (((tpop.y - 200000))::numeric / (1000000)::numeric))) + (((0.1306 * (((tpop.x - 600000))::numeric / (1000000)::numeric)) * (((tpop.y - 200000))::numeric / (1000000)::numeric)) * (((tpop.y - 200000))::numeric / (1000000)::numeric))) - (((0.0436 * (((tpop.x - 600000))::numeric / (1000000)::numeric)) * (((tpop.x - 600000))::numeric / (1000000)::numeric)) * (((tpop.x - 600000))::numeric / (1000000)::numeric))) * (100)::numeric) / (36)::numeric), 10) AS "Laengengrad",
    round((((((((16.9023892 + (3.238272 * (((tpop.y - 200000))::numeric / (1000000)::numeric))) - ((0.270978 * (((tpop.x - 600000))::numeric / (1000000)::numeric)) * (((tpop.x - 600000))::numeric / (1000000)::numeric))) - ((0.002528 * (((tpop.y - 200000))::numeric / (1000000)::numeric)) * (((tpop.y - 200000))::numeric / (1000000)::numeric))) - (((0.0447 * (((tpop.x - 600000))::numeric / (1000000)::numeric)) * (((tpop.x - 600000))::numeric / (1000000)::numeric)) * (((tpop.y - 200000))::numeric / (1000000)::numeric))) - (((0.014 * (((tpop.y - 200000))::numeric / (1000000)::numeric)) * (((tpop.y - 200000))::numeric / (1000000)::numeric)) * (((tpop.y - 200000))::numeric / (1000000)::numeric))) * (100)::numeric) / (36)::numeric), 10) AS "Breitengrad",
    concat('http://www.apflora.ch/Projekte/4635372c-431c-11e8-bb30-e77f6cdd35a6/Aktionspläne/', ap.id, '/Populationen/', pop.id, '/Teil-Populationen/', tpop.id) AS url
   FROM ((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpop.y IS NOT NULL) AND (tpop.y IS NOT NULL))
  ORDER BY ae_eigenschaften.artname, pop.nr, pop.name, tpop.nr, tpop.gemeinde, tpop.flurname;




CREATE VIEW apflora.v_tpop_kmlnamen AS
 SELECT ae_eigenschaften.artname AS "Art",
    concat(ae_eigenschaften.artname, ' ', pop.nr, '/', tpop.nr) AS "Label",
    "substring"(concat('Population: ', pop.nr, ' ', pop.name, '<br /> Teilpopulation: ', tpop.nr, ' ', tpop.gemeinde, ' ', tpop.flurname), 1, 225) AS "Inhalte",
    round(((((((2.6779094 + (4.728982 * (((tpop.x - 600000))::numeric / (1000000)::numeric))) + ((0.791484 * (((tpop.x - 600000))::numeric / (1000000)::numeric)) * (((tpop.y - 200000))::numeric / (1000000)::numeric))) + (((0.1306 * (((tpop.x - 600000))::numeric / (1000000)::numeric)) * (((tpop.y - 200000))::numeric / (1000000)::numeric)) * (((tpop.y - 200000))::numeric / (1000000)::numeric))) - (((0.0436 * (((tpop.x - 600000))::numeric / (1000000)::numeric)) * (((tpop.x - 600000))::numeric / (1000000)::numeric)) * (((tpop.x - 600000))::numeric / (1000000)::numeric))) * (100)::numeric) / (36)::numeric), 10) AS "Laengengrad",
    round((((((((16.9023892 + (3.238272 * (((tpop.y - 200000))::numeric / (1000000)::numeric))) - ((0.270978 * (((tpop.x - 600000))::numeric / (1000000)::numeric)) * (((tpop.x - 600000))::numeric / (1000000)::numeric))) - ((0.002528 * (((tpop.y - 200000))::numeric / (1000000)::numeric)) * (((tpop.y - 200000))::numeric / (1000000)::numeric))) - (((0.0447 * (((tpop.x - 600000))::numeric / (1000000)::numeric)) * (((tpop.x - 600000))::numeric / (1000000)::numeric)) * (((tpop.y - 200000))::numeric / (1000000)::numeric))) - (((0.014 * (((tpop.y - 200000))::numeric / (1000000)::numeric)) * (((tpop.y - 200000))::numeric / (1000000)::numeric)) * (((tpop.y - 200000))::numeric / (1000000)::numeric))) * (100)::numeric) / (36)::numeric), 10) AS "Breitengrad",
    concat('http://www.apflora.ch/Projekte/4635372c-431c-11e8-bb30-e77f6cdd35a6/Aktionspläne/', ap.id, '/Populationen/', pop.id, '/Teil-Populationen/', tpop.id) AS url
   FROM ((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpop.y IS NOT NULL) AND (tpop.y IS NOT NULL))
  ORDER BY ae_eigenschaften.artname, pop.nr, pop.name, tpop.nr, tpop.gemeinde, tpop.flurname;




CREATE VIEW apflora.v_tpop_kontrjahrundberjahrundmassnjahr AS
 SELECT tpop.id,
    tpopber.jahr AS "Jahr"
   FROM (apflora.tpop
     JOIN apflora.tpopber ON ((tpop.id = tpopber.tpop_id)))
UNION
 SELECT tpop.id,
    tpopmassnber.jahr AS "Jahr"
   FROM (apflora.tpop
     JOIN apflora.tpopmassnber ON ((tpop.id = tpopmassnber.tpop_id)))
UNION
 SELECT tpop.id,
    tpopkontr.jahr AS "Jahr"
   FROM (apflora.tpop
     JOIN apflora.tpopkontr ON ((tpop.id = tpopkontr.tpop_id)))
  ORDER BY 2;




CREATE VIEW apflora.v_tpop_mitapaberohnestatus AS
 SELECT ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    pop_status_werte.text AS pop_status,
    tpop.nr,
    tpop.flurname,
    tpop.status
   FROM ((apflora.ap_bearbstand_werte
     JOIN (apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id))) ON ((ap_bearbstand_werte.code = ap.bearbeitung)))
     JOIN ((apflora.pop
     JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpop.status IS NULL) AND (ap.bearbeitung = 3))
  ORDER BY ae_eigenschaften.artname, pop.nr;




CREATE VIEW apflora.v_tpop_ohneapberichtrelevant AS
 SELECT ae_eigenschaften.artname AS "Artname",
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    tpop.id,
    tpop.nr,
    tpop.gemeinde,
    tpop.flurname,
    tpop.apber_relevant
   FROM (apflora.ae_eigenschaften
     JOIN (apflora.ap
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((tpop.pop_id = pop.id))) ON ((pop.ap_id = ap.id))) ON ((ae_eigenschaften.id = ap.art_id)))
  WHERE (tpop.apber_relevant IS NULL)
  ORDER BY ae_eigenschaften.artname, pop.nr, tpop.nr;




CREATE VIEW apflora.v_tpop_ohnebekanntseit AS
 SELECT ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    tpop.nr,
    tpop.gemeinde,
    tpop.flurname,
    tpop.bekannt_seit
   FROM (((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE ((tpop.bekannt_seit IS NULL) AND ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3)))
  ORDER BY ae_eigenschaften.artname, pop.nr, pop.name, tpop.nr, tpop.gemeinde, tpop.flurname;




CREATE VIEW apflora.v_tpop_ohnekoord AS
 SELECT ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    tpop.nr,
    tpop.gemeinde,
    tpop.flurname,
    tpop.x,
    tpop.y
   FROM (((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  WHERE (((tpop.x IS NULL) AND ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3))) OR ((tpop.y IS NULL) AND ((ap.bearbeitung >= 1) AND (ap.bearbeitung <= 3))))
  ORDER BY ae_eigenschaften.artname, pop.nr, pop.name, tpop.nr, tpop.gemeinde, tpop.flurname;




CREATE VIEW apflora.v_tpop_popberundmassnber AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    pop.id AS pop_id,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    pop_status_werte.text AS pop_status,
    pop.bekannt_seit AS pop_bekannt_seit,
    pop.status_unklar AS pop_status_unklar,
    pop.status_unklar_begruendung AS pop_status_unklar_begruendung,
    pop.x AS pop_x,
    pop.y AS pop_y,
    tpop.id AS tpop_id,
    tpop.nr AS tpop_nr,
    tpop.gemeinde AS tpop_gemeinde,
    tpop.flurname AS tpop_flurname,
    "domPopHerkunft_1".text AS tpop_status,
    tpop.bekannt_seit AS tpop_bekannt_seit,
    tpop.status_unklar AS tpop_status_unklar,
    tpop.status_unklar_grund AS tpop_status_unklar_grund,
    tpop.x AS tpop_x,
    tpop.y AS tpop_y,
    tpop.radius AS tpop_radius,
    tpop.hoehe AS tpop_hoehe,
    tpop.exposition AS tpop_exposition,
    tpop.klima AS tpop_klima,
    tpop.neigung AS tpop_neigung,
    tpop.beschreibung AS tpop_beschreibung,
    tpop.kataster_nr AS tpop_kataster_nr,
    tpop.apber_relevant AS tpop_apber_relevant,
    tpop.eigentuemer AS tpop_eigentuemer,
    tpop.kontakt AS tpop_kontakt,
    tpop.nutzungszone AS tpop_nutzungszone,
    tpop.bewirtschafter AS tpop_bewirtschafter,
    tpop.bewirtschaftung AS tpop_bewirtschaftung,
    tpopber.id AS tpopber_id,
    tpopber.jahr AS tpopber_jahr,
    tpop_entwicklung_werte.text AS tpopber_entwicklung,
    tpopber.bemerkungen AS tpopber_bemerkungen,
    tpopber.changed AS tpopber_changed,
    tpopber.changed_by AS tpopber_changed_by,
    tpopmassnber.id AS tpopmassnber_id,
    tpopmassnber.jahr AS tpopmassnber_jahr,
    tpopmassn_erfbeurt_werte.text AS tpopmassnber_entwicklung,
    tpopmassnber.bemerkungen AS tpopmassnber_bemerkungen,
    tpopmassnber.changed AS tpopmassnber_changed,
    tpopmassnber.changed_by AS tpopmassnber_changed_by
   FROM (((((((((((apflora.ae_eigenschaften
     RIGHT JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     RIGHT JOIN (apflora.pop
     RIGHT JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     LEFT JOIN apflora.pop_status_werte "domPopHerkunft_1" ON ((tpop.status = "domPopHerkunft_1".code)))
     LEFT JOIN apflora.v_tpop_berjahrundmassnjahr ON ((tpop.id = v_tpop_berjahrundmassnjahr.id)))
     LEFT JOIN apflora.tpopmassnber ON (((v_tpop_berjahrundmassnjahr.id = tpopmassnber.tpop_id) AND (v_tpop_berjahrundmassnjahr.jahr = tpopmassnber.jahr))))
     LEFT JOIN apflora.tpopmassn_erfbeurt_werte ON ((tpopmassnber.beurteilung = tpopmassn_erfbeurt_werte.code)))
     LEFT JOIN apflora.tpopber ON (((v_tpop_berjahrundmassnjahr.jahr = tpopber.jahr) AND (v_tpop_berjahrundmassnjahr.id = tpopber.tpop_id))))
     LEFT JOIN apflora.tpop_entwicklung_werte ON ((tpopber.entwicklung = tpop_entwicklung_werte.code)))
  ORDER BY ae_eigenschaften.artname, pop.nr, tpop.nr, v_tpop_berjahrundmassnjahr.jahr;




CREATE VIEW apflora.v_tpopber_letzterber AS
 SELECT tpopber.tpop_id,
    max(tpopber.jahr) AS jahr
   FROM apflora.tpopber
  GROUP BY tpopber.tpop_id;




CREATE VIEW apflora.v_tpop_statuswidersprichtbericht AS
 SELECT ae_eigenschaften.artname AS "Art",
    ap_bearbstand_werte.text AS "Bearbeitungsstand AP",
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    tpop.nr,
    tpop.gemeinde,
    tpop.flurname,
    tpop.status,
    tpopber.entwicklung AS "TPopBerEntwicklung",
    tpopber.jahr AS tpopber_jahr
   FROM (((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN (apflora.tpopber
     JOIN apflora.v_tpopber_letzterber ON (((tpopber.tpop_id = v_tpopber_letzterber.tpop_id) AND (tpopber.jahr = v_tpopber_letzterber.jahr)))) ON ((tpop.id = tpopber.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
     JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
  WHERE (((ap.bearbeitung < 4) AND ((tpop.status = 101) OR (tpop.status = 202)) AND (tpopber.entwicklung <> 8)) OR ((ap.bearbeitung < 4) AND (tpop.status <> ALL (ARRAY[101, 202])) AND (tpopber.entwicklung = 8)))
  ORDER BY ae_eigenschaften.artname, pop.nr, pop.name, tpop.nr, tpop.gemeinde, tpop.flurname;




CREATE VIEW apflora.v_tpop_webgisbun AS
 SELECT ap.id AS "APARTID",
    ae_eigenschaften.artname AS "APART",
    ap_bearbstand_werte.text AS "APSTATUS",
    ap.start_jahr AS "APSTARTJAHR",
    ap_umsetzung_werte.text AS "APSTANDUMSETZUNG",
    pop.id AS "POPGUID",
    pop.nr AS "POPNR",
    pop.name AS "POPNAME",
    pop_status_werte.text AS "POPSTATUS",
    pop.status_unklar AS "POPSTATUSUNKLAR",
    pop.status_unklar_begruendung AS "POPUNKLARGRUND",
    pop.bekannt_seit AS "POPBEKANNTSEIT",
    pop.x AS "POP_X",
    pop.y AS "POP_Y",
    tpop.id AS "TPOPID",
    tpop.id AS "TPOPGUID",
    tpop.nr AS "TPOPNR",
    tpop.gemeinde AS "TPOPGEMEINDE",
    tpop.flurname AS "TPOPFLURNAME",
    pop_status_werte_2.text AS "TPOPSTATUS",
    tpop.status_unklar AS "TPOPSTATUSUNKLAR",
    tpop.status_unklar_grund AS "TPOPUNKLARGRUND",
    tpop.x AS "TPOP_X",
    tpop.y AS "TPOP_Y",
    tpop.radius AS "TPOPRADIUS",
    tpop.hoehe AS "TPOPHOEHE",
    tpop.exposition AS "TPOPEXPOSITION",
    tpop.klima AS "TPOPKLIMA",
    tpop.neigung AS "TPOPHANGNEIGUNG",
    tpop.beschreibung AS "TPOPBESCHREIBUNG",
    tpop.kataster_nr AS "TPOPKATASTERNR",
    adresse.name AS "TPOPVERANTWORTLICH",
    tpop.apber_relevant AS "TPOPBERICHTSRELEVANZ",
    tpop.bekannt_seit AS "TPOPBEKANNTSEIT",
    tpop.eigentuemer AS "TPOPEIGENTUEMERIN",
    tpop.kontakt AS "TPOPKONTAKT_VO",
    tpop.nutzungszone AS "TPOP_NUTZUNGSZONE",
    tpop.bewirtschafter AS "TPOPBEWIRTSCHAFTER",
    tpop.bewirtschaftung AS "TPOPBEWIRTSCHAFTUNG",
    to_char((tpop.changed)::timestamp with time zone, 'DD.MM.YY'::text) AS "TPOPCHANGEDAT",
    tpop.changed_by AS "TPOPCHANGEBY"
   FROM (((((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     LEFT JOIN apflora.pop_status_werte pop_status_werte_2 ON ((tpop.status = pop_status_werte_2.code)))
     LEFT JOIN apflora.adresse ON ((ap.bearbeiter = adresse.id)))
  WHERE (ae_eigenschaften.taxid > 150)
  ORDER BY ae_eigenschaften.artname, pop.nr, tpop.nr;




CREATE VIEW apflora.v_tpopber AS
 SELECT ap.id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    pop.id AS pop_id,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    pop_status_werte.text AS pop_status,
    pop.bekannt_seit AS pop_bekannt_seit,
    pop.status_unklar AS pop_status_unklar,
    pop.status_unklar_begruendung AS pop_status_unklar_begruendung,
    pop.x AS pop_x,
    pop.y AS pop_y,
    tpop.id AS tpop_id,
    tpop.nr AS tpop_nr,
    tpop.gemeinde AS tpop_gemeinde,
    tpop.flurname AS tpop_flurname,
    tpop_status_werte.text AS tpop_status,
    tpop.bekannt_seit AS tpop_bekannt_seit,
    tpop.status_unklar AS tpop_status_unklar,
    tpop.status_unklar_grund AS tpop_status_unklar_grund,
    tpop.x AS tpop_x,
    tpop.y AS tpop_y,
    tpop.radius AS tpop_radius,
    tpop.hoehe AS tpop_hoehe,
    tpop.exposition AS tpop_exposition,
    tpop.klima AS tpop_klima,
    tpop.neigung AS tpop_neigung,
    tpop.beschreibung AS tpop_beschreibung,
    tpop.kataster_nr AS tpop_kataster_nr,
    tpop.apber_relevant AS tpop_apber_relevant,
    tpop.eigentuemer AS tpop_eigentuemer,
    tpop.kontakt AS tpop_kontakt,
    tpop.nutzungszone AS tpop_nutzungszone,
    tpop.bewirtschafter AS tpop_bewirtschafter,
    tpop.bewirtschaftung AS tpop_bewirtschaftung,
    tpopber.id AS tpopber_id,
    tpopber.jahr AS tpopber_jahr,
    tpop_entwicklung_werte.text AS tpopber_entwicklung,
    tpopber.bemerkungen AS tpopber_bemerkungen,
    tpopber.changed AS tpopber_changed,
    tpopber.changed_by AS tpopber_changed_by
   FROM (apflora.ae_eigenschaften
     JOIN (((apflora.ap
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     JOIN ((apflora.pop
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     JOIN ((apflora.tpop
     LEFT JOIN apflora.pop_status_werte tpop_status_werte ON ((tpop.status = tpop_status_werte.code)))
     RIGHT JOIN (apflora.tpopber
     LEFT JOIN apflora.tpop_entwicklung_werte ON ((tpopber.entwicklung = tpop_entwicklung_werte.code))) ON ((tpop.id = tpopber.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id))) ON ((ae_eigenschaften.id = ap.art_id)))
  ORDER BY ae_eigenschaften.artname, pop.nr, tpop.nr, tpopber.jahr, tpop_entwicklung_werte.text;




CREATE VIEW apflora.v_tpopkontr_fuergis_read AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS apherkunft,
    ap.start_jahr AS apjahr,
    ap_umsetzung_werte.text AS apumsetzung,
    (pop.id)::character varying(50) AS popid,
    pop.nr AS popnr,
    pop.name AS popname,
    pop_status_werte.text AS popherkunft,
    pop.bekannt_seit AS popbekanntseit,
    (tpop.id)::character varying(50) AS tpopid,
    tpop.nr AS tpopnr,
    tpop.gemeinde AS tpopgemeinde,
    tpop.flurname AS tpopflurname,
    tpop.x AS tpopxkoord,
    tpop.y AS tpopykoord,
    tpop.bekannt_seit AS tpopbekanntseit,
    (tpopkontr.id)::character varying(50) AS tpopkontrid,
    tpopkontr.jahr AS tpopkontrjahr,
    (tpopkontr.datum)::timestamp without time zone AS tpopkontrdatum,
    tpopkontr_typ_werte.text AS tpopkontrtyp,
    adresse.name AS tpopkontrbearb,
    tpopkontr.ueberlebensrate AS tpopkontrueberleb,
    tpopkontr.vitalitaet AS tpopkontrvitalitaet,
    tpop_entwicklung_werte.text AS tpopkontrentwicklung,
    tpopkontr.ursachen AS tpopkontrursach,
    tpopkontr.erfolgsbeurteilung AS tpopkontrurteil,
    tpopkontr.umsetzung_aendern AS tpopkontraendums,
    tpopkontr.kontrolle_aendern AS tpopkontraendkontr,
    tpopkontr.lr_delarze AS tpopkontrleb,
    tpopkontr.flaeche AS tpopkontrflaeche,
    tpopkontr.lr_umgebung_delarze AS tpopkontrlebumg,
    tpopkontr.vegetationstyp AS tpopkontrvegtyp,
    tpopkontr.konkurrenz AS tpopkontrkonkurrenz,
    tpopkontr.moosschicht AS tpopkontrmoosschicht,
    tpopkontr.krautschicht AS tpopkontrkrautschicht,
    tpopkontr.strauchschicht AS tpopkontrstrauchschicht,
    tpopkontr.baumschicht AS tpopkontrbaumschicht,
    tpopkontr.boden_typ AS tpopkontrbodentyp,
    tpopkontr.boden_kalkgehalt AS tpopkontrbodenkalkgehalt,
    tpopkontr.boden_durchlaessigkeit AS tpopkontrbodendurchlaessigkeit,
    tpopkontr.boden_humus AS tpopkontrbodenhumus,
    tpopkontr.boden_naehrstoffgehalt AS tpopkontrbodennaehrstoffgehalt,
    tpopkontr.boden_abtrag AS tpopkontrbodenabtrag,
    tpopkontr.wasserhaushalt AS tpopkontrwasserhaushalt,
    tpopkontr_idbiotuebereinst_werte.text AS tpopkontridealbiotopuebereinst,
    tpopkontr.flaeche_ueberprueft AS tpopkontruebflaeche,
    tpopkontr.plan_vorhanden AS tpopkontrplan,
    tpopkontr.deckung_vegetation AS tpopkontrveg,
    tpopkontr.deckung_nackter_boden AS tpopkontrnabo,
    tpopkontr.deckung_ap_art AS tpopkontruebpfl,
    tpopkontr.jungpflanzen_vorhanden AS tpopkontrjungpfljn,
    tpopkontr.vegetationshoehe_maximum AS tpopkontrveghoemax,
    tpopkontr.vegetationshoehe_mittel AS tpopkontrveghoemit,
    tpopkontr.gefaehrdung AS tpopkontrgefaehrdung,
    (tpopkontr.changed)::timestamp without time zone AS mutwann,
    tpopkontr.changed_by AS mutwer
   FROM ((((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN (((apflora.tpopkontr
     LEFT JOIN apflora.tpopkontr_typ_werte ON (((tpopkontr.typ)::text = (tpopkontr_typ_werte.text)::text)))
     LEFT JOIN apflora.adresse ON ((tpopkontr.bearbeiter = adresse.id)))
     LEFT JOIN apflora.tpop_entwicklung_werte ON ((tpopkontr.entwicklung = tpop_entwicklung_werte.code))) ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     LEFT JOIN apflora.tpopkontr_idbiotuebereinst_werte ON ((tpopkontr.idealbiotop_uebereinstimmung = tpopkontr_idbiotuebereinst_werte.code)))
  ORDER BY ae_eigenschaften.artname, pop.nr, tpop.nr, tpopkontr.jahr, tpopkontr.datum;




CREATE VIEW apflora.v_tpopkontr_fuergis_write AS
 SELECT (tpopkontr.id)::text AS id,
    tpopkontr.typ,
    tpopkontr.jahr,
    (tpopkontr.datum)::timestamp without time zone AS datum,
    tpopkontr.bearbeiter,
    tpopkontr.jungpflanzen_anzahl,
    tpopkontr.ueberlebensrate,
    tpopkontr.entwicklung,
    tpopkontr.vitalitaet,
    tpopkontr.ursachen,
    tpopkontr.erfolgsbeurteilung,
    tpopkontr.umsetzung_aendern,
    tpopkontr.kontrolle_aendern,
    tpopkontr.lr_delarze,
    tpopkontr.flaeche,
    tpopkontr.lr_umgebung_delarze,
    tpopkontr.vegetationstyp,
    tpopkontr.konkurrenz,
    tpopkontr.moosschicht,
    tpopkontr.krautschicht,
    tpopkontr.strauchschicht,
    tpopkontr.baumschicht,
    tpopkontr.boden_typ,
    tpopkontr.boden_kalkgehalt,
    tpopkontr.boden_durchlaessigkeit,
    tpopkontr.boden_humus,
    tpopkontr.boden_naehrstoffgehalt,
    tpopkontr.boden_abtrag,
    tpopkontr.wasserhaushalt,
    tpopkontr.idealbiotop_uebereinstimmung,
    tpopkontr.flaeche_ueberprueft,
    tpopkontr.plan_vorhanden,
    tpopkontr.deckung_vegetation,
    tpopkontr.deckung_nackter_boden,
    tpopkontr.deckung_ap_art,
    tpopkontr.jungpflanzen_vorhanden,
    tpopkontr.vegetationshoehe_maximum,
    tpopkontr.vegetationshoehe_mittel,
    tpopkontr.gefaehrdung,
    tpopkontr.bemerkungen,
    (tpopkontr.changed)::timestamp without time zone AS changed,
    tpopkontr.changed_by
   FROM apflora.tpopkontr;




CREATE VIEW apflora.v_tpopkontr_webgisbun AS
 SELECT ap.id AS "APARTID",
    ae_eigenschaften.artname AS "APART",
    pop.id AS "POPGUID",
    pop.nr AS "POPNR",
    tpop.id AS "TPOPGUID",
    tpop.nr AS "TPOPNR",
    tpopkontr.id AS "KONTRGUID",
    tpopkontr.jahr AS "KONTRJAHR",
    to_char((tpopkontr.datum)::timestamp with time zone, 'DD.MM.YY'::text) AS "KONTRDAT",
    tpopkontr_typ_werte.text AS "KONTRTYP",
    pop_status_werte_2.text AS "TPOPSTATUS",
    adresse.name AS "KONTRBEARBEITER",
    tpopkontr.ueberlebensrate AS "KONTRUEBERLEBENSRATE",
    tpopkontr.vitalitaet AS "KONTRVITALITAET",
    tpop_entwicklung_werte.text AS "KONTRENTWICKLUNG",
    tpopkontr.ursachen AS "KONTRURSACHEN",
    tpopkontr.erfolgsbeurteilung AS "KONTRERFOLGBEURTEIL",
    tpopkontr.umsetzung_aendern AS "KONTRAENDUMSETZUNG",
    tpopkontr.kontrolle_aendern AS "KONTRAENDKONTROLLE",
    tpop.x AS "KONTR_X",
    tpop.y AS "KONTR_Y",
    tpopkontr.bemerkungen AS "KONTRBEMERKUNGEN",
    tpopkontr.lr_delarze AS "KONTRLRMDELARZE",
    tpopkontr.lr_umgebung_delarze AS "KONTRDELARZEANGRENZ",
    tpopkontr.vegetationstyp AS "KONTRVEGTYP",
    tpopkontr.konkurrenz AS "KONTRKONKURRENZ",
    tpopkontr.moosschicht AS "KONTRMOOSE",
    tpopkontr.krautschicht AS "KONTRKRAUTSCHICHT",
    tpopkontr.strauchschicht AS "KONTRSTRAUCHSCHICHT",
    tpopkontr.baumschicht AS "KONTRBAUMSCHICHT",
    tpopkontr.boden_typ AS "KONTRBODENTYP",
    tpopkontr.boden_kalkgehalt AS "KONTRBODENKALK",
    tpopkontr.boden_durchlaessigkeit AS "KONTRBODENDURCHLAESSIGK",
    tpopkontr.boden_humus AS "KONTRBODENHUMUS",
    tpopkontr.boden_naehrstoffgehalt AS "KONTRBODENNAEHRSTOFF",
    tpopkontr.boden_abtrag AS "KONTROBERBODENABTRAG",
    tpopkontr.wasserhaushalt AS "KONTROBODENWASSERHAUSHALT",
    tpopkontr_idbiotuebereinst_werte.text AS "KONTRUEBEREINSTIMMUNIDEAL",
    tpopkontr.handlungsbedarf AS "KONTRHANDLUNGSBEDARF",
    tpopkontr.flaeche_ueberprueft AS "KONTRUEBERPRUFTFLAECHE",
    tpopkontr.flaeche AS "KONTRFLAECHETPOP",
    tpopkontr.plan_vorhanden AS "KONTRAUFPLAN",
    tpopkontr.deckung_vegetation AS "KONTRDECKUNGVEG",
    tpopkontr.deckung_nackter_boden AS "KONTRDECKUNGBODEN",
    tpopkontr.deckung_ap_art AS "KONTRDECKUNGART",
    tpopkontr.jungpflanzen_vorhanden AS "KONTRJUNGEPLANZEN",
    tpopkontr.vegetationshoehe_maximum AS "KONTRMAXHOEHEVEG",
    tpopkontr.vegetationshoehe_mittel AS "KONTRMITTELHOEHEVEG",
    tpopkontr.gefaehrdung AS "KONTRGEFAEHRDUNG",
    to_char((tpopkontr.changed)::timestamp with time zone, 'DD.MM.YY'::text) AS "KONTRCHANGEDAT",
    tpopkontr.changed_by AS "KONTRCHANGEBY",
    string_agg((tpopkontrzaehl_einheit_werte.text)::text, ', '::text) AS "ZAEHLEINHEITEN",
    array_to_string(array_agg(tpopkontrzaehl.anzahl), ', '::text) AS "ANZAHLEN",
    string_agg((tpopkontrzaehl_methode_werte.text)::text, ', '::text) AS "METHODEN"
   FROM (((((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN (apflora.pop
     JOIN ((apflora.tpop
     LEFT JOIN apflora.pop_status_werte pop_status_werte_2 ON ((tpop.status = pop_status_werte_2.code)))
     JOIN ((((((apflora.tpopkontr
     LEFT JOIN apflora.tpopkontr_typ_werte ON (((tpopkontr.typ)::text = (tpopkontr_typ_werte.text)::text)))
     LEFT JOIN apflora.adresse ON ((tpopkontr.bearbeiter = adresse.id)))
     LEFT JOIN apflora.tpop_entwicklung_werte ON ((tpopkontr.entwicklung = tpop_entwicklung_werte.code)))
     LEFT JOIN apflora.tpopkontrzaehl ON ((tpopkontr.id = tpopkontrzaehl.tpopkontr_id)))
     LEFT JOIN apflora.tpopkontrzaehl_einheit_werte ON ((tpopkontrzaehl.einheit = tpopkontrzaehl_einheit_werte.code)))
     LEFT JOIN apflora.tpopkontrzaehl_methode_werte ON ((tpopkontrzaehl.methode = tpopkontrzaehl_methode_werte.code))) ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     LEFT JOIN apflora.tpopkontr_idbiotuebereinst_werte ON ((tpopkontr.idealbiotop_uebereinstimmung = tpopkontr_idbiotuebereinst_werte.code)))
     LEFT JOIN apflora.adresse apflora_adresse_1 ON ((ap.bearbeiter = apflora_adresse_1.id)))
  WHERE (ae_eigenschaften.taxid > 150)
  GROUP BY ap.id, ae_eigenschaften.artname, pop.id, pop.nr, tpop.id, tpop.nr, tpopkontr.tpop_id, tpopkontr.id, tpopkontr.jahr, tpopkontr.datum, tpopkontr_typ_werte.text, pop_status_werte_2.text, adresse.name, tpopkontr.ueberlebensrate, tpopkontr.vitalitaet, tpop_entwicklung_werte.text, tpopkontr.ursachen, tpopkontr.erfolgsbeurteilung, tpopkontr.umsetzung_aendern, tpopkontr.kontrolle_aendern, tpop.x, tpop.y, tpopkontr.bemerkungen, tpopkontr.lr_delarze, tpopkontr.lr_umgebung_delarze, tpopkontr.vegetationstyp, tpopkontr.konkurrenz, tpopkontr.moosschicht, tpopkontr.krautschicht, tpopkontr.strauchschicht, tpopkontr.baumschicht, tpopkontr.boden_typ, tpopkontr.boden_kalkgehalt, tpopkontr.boden_durchlaessigkeit, tpopkontr.boden_humus, tpopkontr.boden_naehrstoffgehalt, tpopkontr.boden_abtrag, tpopkontr.wasserhaushalt, tpopkontr_idbiotuebereinst_werte.text, tpopkontr.handlungsbedarf, tpopkontr.flaeche_ueberprueft, tpopkontr.flaeche, tpopkontr.plan_vorhanden, tpopkontr.deckung_vegetation, tpopkontr.deckung_nackter_boden, tpopkontr.deckung_ap_art, tpopkontr.jungpflanzen_vorhanden, tpopkontr.vegetationshoehe_maximum, tpopkontr.vegetationshoehe_mittel, tpopkontr.gefaehrdung, tpopkontr.changed, tpopkontr.changed_by
  ORDER BY ae_eigenschaften.artname, pop.nr, tpop.nr;




CREATE VIEW apflora.v_tpopkoord AS
 SELECT DISTINCT pop.ap_id,
    pop.id AS pop_id,
    pop.nr AS pop_nr,
    tpop.id,
    tpop.nr,
    tpop.x,
    tpop.y,
    tpop.apber_relevant
   FROM (apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
  WHERE ((tpop.x IS NOT NULL) AND (tpop.y IS NOT NULL));




CREATE VIEW apflora.v_tpopmassn_0 AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname AS "Art",
    ap_bearbstand_werte.text AS "Aktionsplan Bearbeitungsstand",
    pop.id AS pop_id,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    tpop.id AS tpop_id,
    tpop.nr AS tpop_nr,
    tpop.flurname AS tpop_flurname,
    tpopmassn.id,
    tpopmassn.jahr AS "Jahr",
    tpopmassn_typ_werte.text AS "Massnahme",
    tpopmassn.beschreibung,
    tpopmassn.datum,
    adresse.name AS bearbeiter,
    tpopmassn.bemerkungen,
    tpopmassn.plan_vorhanden,
    tpopmassn.plan_bezeichnung,
    tpopmassn.flaeche,
    tpopmassn.markierung,
    tpopmassn.anz_triebe,
    tpopmassn.anz_pflanzen,
    tpopmassn.anz_pflanzstellen,
    tpopmassn.wirtspflanze,
    tpopmassn.herkunft_pop,
    tpopmassn.sammeldatum,
    tpopmassn.form,
    tpopmassn.pflanzanordnung
   FROM (((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     JOIN ((apflora.pop
     JOIN apflora.tpop ON ((pop.id = tpop.pop_id)))
     JOIN ((apflora.tpopmassn
     LEFT JOIN apflora.tpopmassn_typ_werte ON ((tpopmassn.typ = tpopmassn_typ_werte.code)))
     LEFT JOIN apflora.adresse ON ((tpopmassn.bearbeiter = adresse.id))) ON ((tpop.id = tpopmassn.tpop_id))) ON ((ap.id = pop.ap_id)))
  ORDER BY ae_eigenschaften.artname, pop.nr, tpop.nr, tpopmassn.jahr, tpopmassn_typ_werte.text;




CREATE VIEW apflora.v_tpopmassn_fueraktap0 AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname AS "Art",
    ap_bearbstand_werte.text AS "Aktionsplan-Status",
    ap.start_jahr AS "Aktionsplan-Jahr",
    ap_umsetzung_werte.text AS "Aktionsplan-Umsetzung",
    pop.id AS pop_id,
    pop.nr AS "Population-Nr",
    pop.name AS "Population-Name",
    pop_status_werte.text AS "Population-Herkunft",
    pop.bekannt_seit AS "Population - bekannt seit",
    tpop.id AS tpop_id,
    tpop.nr AS "Teilpopulation-Nr",
    tpop.gemeinde AS "Teilpopulation-Gemeinde",
    tpop.flurname AS "Teilpopulation-Flurname",
    tpop.x AS "Teilpopulation-X-Koodinate",
    tpop.y AS "Teilpopulation-Y-Koordinate",
    tpop.radius AS "Teilpopulation-Radius",
    tpop.hoehe AS "Teilpopulation-Höhe",
    tpop.beschreibung AS "Teilpopulation-Beschreibung",
    tpop.kataster_nr AS "Teilpopulation-Kataster-Nr",
    pop_status_werte_2.text AS "Teilpopulation-Herkunft",
    tpop.status_unklar AS "Teilpopulation - Herkunft unklar",
    tpop.status_unklar_grund AS "Teilpopulation - Herkunft unklar Begruendung",
    tpop_apberrelevant_werte.text AS "Teilpopulation - Fuer Bericht relevant",
    tpop.bekannt_seit AS "Teilpopulation - bekannt seit",
    tpop.eigentuemer AS "Teilpopulation-Eigentuemer",
    tpop.kontakt AS "Teilpopulation-Kontakt",
    tpop.nutzungszone AS "Teilpopulation-Nutzungszone",
    tpop.bewirtschafter AS "Teilpopulation-Bewirtschafter",
    tpop.bewirtschaftung AS "Teilpopulation-Bewirtschaftung",
    tpop.bemerkungen AS "Teilpopulation-Bemerkungen",
    tpopmassn.id,
    tpopmassn_typ_werte.text AS "Massnahme-Typ",
    tpopmassn.beschreibung AS "Massnahme-Beschreibung",
    tpopmassn.datum AS "Massnahme-Datum",
    adresse.name AS "Massnahme-BearbeiterIn",
    tpopmassn.bemerkungen AS "Massnahme-Bemerkungen",
    tpopmassn.plan_vorhanden AS "Massnahme-Plan",
    tpopmassn.plan_bezeichnung AS "Massnahme-Planbezeichnung",
    tpopmassn.flaeche AS "Massnahme-Flaeche",
    tpopmassn.markierung AS "Massnahme-Markierung",
    tpopmassn.anz_triebe AS "Massnahme - Ansiedlung Anzahl Triebe",
    tpopmassn.anz_pflanzen AS "Massnahme - Ansiedlung Anzahl Pflanzen",
    tpopmassn.anz_pflanzstellen AS "Massnahme - Ansiedlung Anzahl Pflanzstellen",
    tpopmassn.wirtspflanze AS "Massnahme - Ansiedlung Wirtspflanzen",
    tpopmassn.herkunft_pop AS "Massnahme - Ansiedlung Herkunftspopulation",
    tpopmassn.sammeldatum AS "Massnahme - Ansiedlung Sammeldatum",
    tpopmassn.form AS "Massnahme - Ansiedlung Form",
    tpopmassn.pflanzanordnung AS "Massnahme - Ansiedlung Pflanzordnung"
   FROM ((apflora.ae_eigenschaften
     JOIN ((apflora.ap
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code))) ON ((ae_eigenschaften.id = ap.art_id)))
     JOIN (((apflora.pop
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     JOIN ((apflora.tpop
     LEFT JOIN apflora.pop_status_werte pop_status_werte_2 ON ((tpop.status = pop_status_werte_2.code)))
     LEFT JOIN apflora.tpop_apberrelevant_werte ON ((tpop.apber_relevant = tpop_apberrelevant_werte.code))) ON ((pop.id = tpop.pop_id)))
     JOIN ((apflora.tpopmassn
     LEFT JOIN apflora.tpopmassn_typ_werte ON ((tpopmassn.typ = tpopmassn_typ_werte.code)))
     LEFT JOIN apflora.adresse ON ((tpopmassn.bearbeiter = adresse.id))) ON ((tpop.id = tpopmassn.tpop_id))) ON ((ap.id = pop.ap_id)))
  ORDER BY ae_eigenschaften.artname, pop.nr, tpop.nr, tpopmassn_typ_werte.text;




CREATE VIEW apflora.v_tpopmassnber AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    pop.id AS pop_id,
    pop.nr AS pop_nr,
    pop.name AS pop_name,
    pop_status_werte.text AS pop_status,
    pop.bekannt_seit AS pop_bekannt_seit,
    pop.status_unklar AS pop_status_unklar,
    pop.status_unklar_begruendung AS pop_status_unklar_begruendung,
    pop.x AS pop_x,
    pop.y AS pop_y,
    tpop.id AS tpop_id,
    tpop.nr AS tpop_nr,
    tpop.gemeinde AS tpop_gemeinde,
    tpop.flurname AS tpop_flurname,
    tpop_status_werte.text AS tpop_status,
    tpop.bekannt_seit AS tpop_bekannt_seit,
    tpop.status_unklar AS tpop_status_unklar,
    tpop.status_unklar_grund AS tpop_status_unklar_grund,
    tpop.x AS tpop_x,
    tpop.y AS tpop_y,
    tpop.radius AS tpop_radius,
    tpop.hoehe AS tpop_hoehe,
    tpop.exposition AS tpop_exposition,
    tpop.klima AS tpop_klima,
    tpop.neigung AS tpop_neigung,
    tpop.beschreibung AS tpop_beschreibung,
    tpop.kataster_nr AS tpop_kataster_nr,
    tpop.apber_relevant AS tpop_apber_relevant,
    tpop.eigentuemer AS tpop_eigentuemer,
    tpop.kontakt AS tpop_kontakt,
    tpop.nutzungszone AS tpop_nutzungszone,
    tpop.bewirtschafter AS tpop_bewirtschafter,
    tpop.bewirtschaftung AS tpop_bewirtschaftung,
    tpopmassnber.id,
    tpopmassnber.jahr,
    tpopmassn_erfbeurt_werte.text AS entwicklung,
    tpopmassnber.bemerkungen,
    tpopmassnber.changed,
    tpopmassnber.changed_by
   FROM (apflora.ae_eigenschaften
     JOIN (((apflora.ap
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     JOIN ((apflora.pop
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     JOIN ((apflora.tpop
     LEFT JOIN apflora.pop_status_werte tpop_status_werte ON ((tpop.status = tpop_status_werte.code)))
     JOIN (apflora.tpopmassnber
     LEFT JOIN apflora.tpopmassn_erfbeurt_werte ON ((tpopmassnber.beurteilung = tpopmassn_erfbeurt_werte.code))) ON ((tpop.id = tpopmassnber.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id))) ON ((ae_eigenschaften.id = ap.art_id)))
  ORDER BY ae_eigenschaften.artname, pop.nr, tpop.nr, tpopmassnber.jahr;




CREATE VIEW apflora.v_tpopmassnber_fueraktap0 AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname AS "Art",
    ap_bearbstand_werte.text AS "Aktionsplan-Status",
    ap.start_jahr AS "Aktionsplan-Jahr",
    ap_umsetzung_werte.text AS "Aktionsplan-Umsetzung",
    pop.nr AS "Population-Nr",
    pop.name AS "Population-Name",
    pop_status_werte.text AS "Population-Herkunft",
    pop.bekannt_seit AS "Population - bekannt seit",
    tpop.nr AS "Teilpopulation-Nr",
    tpop.gemeinde AS "Teilpopulation-Gemeinde",
    tpop.flurname AS "Teilpopulation-Flurname",
    tpop.x AS "Teilpopulation-X-Koodinate",
    tpop.y AS "Teilpopulation-Y-Koordinate",
    tpop.radius AS "Teilpopulation-Radius",
    tpop.hoehe AS "Teilpopulation-Hoehe",
    tpop.beschreibung AS "Teilpopulation-Beschreibung",
    tpop.kataster_nr AS "Teilpopulation-Kataster-Nr",
    pop_status_werte_2.text AS "Teilpopulation-Herkunft",
    tpop.status_unklar AS "Teilpopulation - Herkunft unklar",
    tpop.status_unklar_grund AS "Teilpopulation - Herkunft unklar Begruendung",
    tpop_apberrelevant_werte.text AS "Teilpopulation - Fuer Bericht relevant",
    tpop.bekannt_seit AS "Teilpopulation - bekannt seit",
    tpop.eigentuemer AS "Teilpopulation-Eigentuemer",
    tpop.kontakt AS "Teilpopulation-Kontakt",
    tpop.nutzungszone AS "Teilpopulation-Nutzungszone",
    tpop.bewirtschafter AS "Teilpopulation-Bewirtschafter",
    tpop.bewirtschaftung AS "Teilpopulation-Bewirtschaftung",
    tpop.bemerkungen AS "Teilpopulation-Bemerkungen",
    tpopmassnber.jahr AS "Massnahmenbericht-Jahr",
    tpopmassn_erfbeurt_werte.text AS "Massnahmenbericht-Erfolgsberuteilung",
    tpopmassnber.bemerkungen AS "Massnahmenbericht-Interpretation"
   FROM ((((apflora.ae_eigenschaften
     JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     JOIN (((apflora.pop
     LEFT JOIN apflora.pop_status_werte ON ((pop.status = pop_status_werte.code)))
     JOIN ((apflora.tpop
     LEFT JOIN apflora.pop_status_werte pop_status_werte_2 ON ((tpop.status = pop_status_werte_2.code)))
     LEFT JOIN apflora.tpop_apberrelevant_werte ON ((tpop.apber_relevant = tpop_apberrelevant_werte.code))) ON ((pop.id = tpop.pop_id)))
     JOIN (apflora.tpopmassnber
     JOIN apflora.tpopmassn_erfbeurt_werte ON ((tpopmassnber.beurteilung = tpopmassn_erfbeurt_werte.code))) ON ((tpop.id = tpopmassnber.tpop_id))) ON ((ap.id = pop.ap_id)))
  ORDER BY ae_eigenschaften.artname, pop.nr, tpop.nr, tpopmassnber.jahr;




CREATE VIEW apflora.v_ziel AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    adresse.name AS ap_bearbeiter,
    ziel.id,
    ziel.jahr,
    ziel_typ_werte.text AS typ,
    ziel.bezeichnung
   FROM ((((((apflora.ae_eigenschaften
     RIGHT JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.adresse ON ((ap.bearbeiter = adresse.id)))
     RIGHT JOIN apflora.ziel ON ((ap.id = ziel.ap_id)))
     LEFT JOIN apflora.ziel_typ_werte ON ((ziel.typ = ziel_typ_werte.code)))
  WHERE (ziel.typ = ANY (ARRAY[1, 2, 1170775556]))
  ORDER BY ae_eigenschaften.artname, ziel.jahr, ziel_typ_werte.text, ziel.typ;




CREATE VIEW apflora.v_zielber AS
 SELECT ap.id AS ap_id,
    ae_eigenschaften.artname,
    ap_bearbstand_werte.text AS ap_bearbeitung,
    ap.start_jahr AS ap_start_jahr,
    ap_umsetzung_werte.text AS ap_umsetzung,
    adresse.name AS ap_bearbeiter,
    ziel.id AS ziel_id,
    ziel.jahr AS ziel_jahr,
    ziel_typ_werte.text AS ziel_typ,
    ziel.bezeichnung AS ziel_bezeichnung,
    zielber.id,
    zielber.jahr,
    zielber.erreichung,
    zielber.bemerkungen,
    zielber.changed,
    zielber.changed_by
   FROM (((((((apflora.ae_eigenschaften
     RIGHT JOIN apflora.ap ON ((ae_eigenschaften.id = ap.art_id)))
     LEFT JOIN apflora.ap_bearbstand_werte ON ((ap.bearbeitung = ap_bearbstand_werte.code)))
     LEFT JOIN apflora.ap_umsetzung_werte ON ((ap.umsetzung = ap_umsetzung_werte.code)))
     LEFT JOIN apflora.adresse ON ((ap.bearbeiter = adresse.id)))
     RIGHT JOIN apflora.ziel ON ((ap.id = ziel.ap_id)))
     LEFT JOIN apflora.ziel_typ_werte ON ((ziel.typ = ziel_typ_werte.code)))
     RIGHT JOIN apflora.zielber ON ((ziel.id = zielber.ziel_id)))
  ORDER BY ae_eigenschaften.artname, ziel.jahr, ziel_typ_werte.text, ziel.typ, zielber.jahr;




CREATE SEQUENCE apflora."ziel_ZielId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora."ziel_ZielId_seq" OWNED BY apflora.ziel.id_old;



CREATE SEQUENCE apflora."zielber_ZielBerId_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




ALTER SEQUENCE apflora."zielber_ZielBerId_seq" OWNED BY apflora.zielber.id_old;



CREATE TABLE public.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT now()
);




ALTER TABLE ONLY apflora._variable ALTER COLUMN "KonstId" SET DEFAULT nextval('apflora."_variable_KonstId_seq"'::regclass);



ALTER TABLE ONLY apflora._variable
    ADD CONSTRAINT _variable_pkey PRIMARY KEY ("KonstId");



ALTER TABLE ONLY apflora.ae_eigenschaften
    ADD CONSTRAINT "adb_eigenschaften_TaxonomieId_key" UNIQUE (taxid);



ALTER TABLE ONLY apflora.ae_eigenschaften
    ADD CONSTRAINT adb_eigenschaften_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.ae_lrdelarze
    ADD CONSTRAINT adb_lr_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.adresse
    ADD CONSTRAINT adresse_id_key UNIQUE (id);



ALTER TABLE ONLY apflora.adresse
    ADD CONSTRAINT adresse_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.ap
    ADD CONSTRAINT ap_art_key UNIQUE (art_id);



ALTER TABLE ONLY apflora.ap_bearbstand_werte
    ADD CONSTRAINT ap_bearbstand_werte_code_key UNIQUE (code);



ALTER TABLE ONLY apflora.ap_bearbstand_werte
    ADD CONSTRAINT ap_bearbstand_werte_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.ap_erfbeurtkrit_werte
    ADD CONSTRAINT ap_erfbeurtkrit_werte_code_key UNIQUE (code);



ALTER TABLE ONLY apflora.ap_erfbeurtkrit_werte
    ADD CONSTRAINT ap_erfbeurtkrit_werte_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.ap_erfkrit_werte
    ADD CONSTRAINT ap_erfkrit_werte_code_key UNIQUE (code);



ALTER TABLE ONLY apflora.ap_erfkrit_werte
    ADD CONSTRAINT ap_erfkrit_werte_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.ap
    ADD CONSTRAINT ap_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.ap_umsetzung_werte
    ADD CONSTRAINT ap_umsetzung_werte_code_key UNIQUE (code);



ALTER TABLE ONLY apflora.ap_umsetzung_werte
    ADD CONSTRAINT ap_umsetzung_werte_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.apber
    ADD CONSTRAINT apber_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.apberuebersicht
    ADD CONSTRAINT apberuebersicht_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.assozart
    ADD CONSTRAINT assozart_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.beob
    ADD CONSTRAINT beob_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.beob_quelle_werte
    ADD CONSTRAINT beob_quelle_werte_id_key UNIQUE (id);



ALTER TABLE ONLY apflora.beob_quelle_werte
    ADD CONSTRAINT beob_quelle_werte_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.apart
    ADD CONSTRAINT beobart_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.ber
    ADD CONSTRAINT ber_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.erfkrit
    ADD CONSTRAINT erfkrit_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.evab_typologie
    ADD CONSTRAINT evab_typologie_pkey PRIMARY KEY ("TYPO");



ALTER TABLE ONLY apflora.gemeinde
    ADD CONSTRAINT gemeinde_id_key UNIQUE (id);



ALTER TABLE ONLY apflora.gemeinde
    ADD CONSTRAINT gemeinde_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.idealbiotop
    ADD CONSTRAINT idealbiotop_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.message
    ADD CONSTRAINT message_id_key UNIQUE (id);



ALTER TABLE ONLY apflora.message
    ADD CONSTRAINT message_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.pop
    ADD CONSTRAINT pop_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.pop_status_werte
    ADD CONSTRAINT pop_status_werte_code_key UNIQUE (code);



ALTER TABLE ONLY apflora.pop_status_werte
    ADD CONSTRAINT pop_status_werte_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.popber
    ADD CONSTRAINT popber_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.popmassnber
    ADD CONSTRAINT popmassnber_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.projekt
    ADD CONSTRAINT projekt_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.tpop_apberrelevant_werte
    ADD CONSTRAINT tpop_apberrelevant_werte_code_key UNIQUE (code);



ALTER TABLE ONLY apflora.tpop_apberrelevant_werte
    ADD CONSTRAINT tpop_apberrelevant_werte_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.tpop_entwicklung_werte
    ADD CONSTRAINT tpop_entwicklung_werte_code_key UNIQUE (code);



ALTER TABLE ONLY apflora.tpop_entwicklung_werte
    ADD CONSTRAINT tpop_entwicklung_werte_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.tpop
    ADD CONSTRAINT tpop_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.tpopber
    ADD CONSTRAINT tpopber_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.tpopkontr_idbiotuebereinst_werte
    ADD CONSTRAINT tpopkontr_idbiotuebereinst_werte_code_key UNIQUE (code);



ALTER TABLE ONLY apflora.tpopkontr_idbiotuebereinst_werte
    ADD CONSTRAINT tpopkontr_idbiotuebereinst_werte_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.tpopkontr
    ADD CONSTRAINT tpopkontr_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.tpopkontr_typ_werte
    ADD CONSTRAINT tpopkontr_typ_werte_code_key UNIQUE (code);



ALTER TABLE ONLY apflora.tpopkontr_typ_werte
    ADD CONSTRAINT tpopkontr_typ_werte_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.tpopkontr_typ_werte
    ADD CONSTRAINT tpopkontr_typ_werte_text_key UNIQUE (text);



ALTER TABLE ONLY apflora.tpopkontrzaehl_einheit_werte
    ADD CONSTRAINT tpopkontrzaehl_einheit_werte_code_key UNIQUE (code);



ALTER TABLE ONLY apflora.tpopkontrzaehl_einheit_werte
    ADD CONSTRAINT tpopkontrzaehl_einheit_werte_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.tpopkontrzaehl_methode_werte
    ADD CONSTRAINT tpopkontrzaehl_methode_werte_code_key UNIQUE (code);



ALTER TABLE ONLY apflora.tpopkontrzaehl_methode_werte
    ADD CONSTRAINT tpopkontrzaehl_methode_werte_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.tpopkontrzaehl
    ADD CONSTRAINT tpopkontrzaehl_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.tpopmassn_erfbeurt_werte
    ADD CONSTRAINT tpopmassn_erfbeurt_werte_code_key UNIQUE (code);



ALTER TABLE ONLY apflora.tpopmassn_erfbeurt_werte
    ADD CONSTRAINT tpopmassn_erfbeurt_werte_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.tpopmassn
    ADD CONSTRAINT tpopmassn_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.tpopmassn_typ_werte
    ADD CONSTRAINT tpopmassn_typ_werte_code_key UNIQUE (code);



ALTER TABLE ONLY apflora.tpopmassn_typ_werte
    ADD CONSTRAINT tpopmassn_typ_werte_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.tpopmassnber
    ADD CONSTRAINT tpopmassnber_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);



ALTER TABLE ONLY apflora."user"
    ADD CONSTRAINT user_name_key UNIQUE (name);



ALTER TABLE ONLY apflora."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.usermessage
    ADD CONSTRAINT usermessage_id_key UNIQUE (id);



ALTER TABLE ONLY apflora.usermessage
    ADD CONSTRAINT usermessage_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.ziel
    ADD CONSTRAINT ziel_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.ziel_typ_werte
    ADD CONSTRAINT ziel_typ_werte_code_key UNIQUE (code);



ALTER TABLE ONLY apflora.ziel_typ_werte
    ADD CONSTRAINT ziel_typ_werte_pkey PRIMARY KEY (id);



ALTER TABLE ONLY apflora.zielber
    ADD CONSTRAINT zielber_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);



ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);



CREATE INDEX "_variable_ApArtId_idx" ON apflora._variable USING btree ("ApArtId");



CREATE INDEX "_variable_JBerJahr_idx" ON apflora._variable USING btree (apber_jahr);



CREATE INDEX "adb_eigenschaften_Artname_idx" ON apflora.ae_eigenschaften USING btree (artname);



CREATE INDEX "adb_eigenschaften_TaxonomieId_idx" ON apflora.ae_eigenschaften USING btree (taxid);



CREATE INDEX adb_eigenschaften_id_idx ON apflora.ae_eigenschaften USING btree (id);



CREATE INDEX "adb_lr_Id_idx" ON apflora.ae_lrdelarze USING btree (sort);



CREATE INDEX "adb_lr_Label_idx" ON apflora.ae_lrdelarze USING btree (label);



CREATE INDEX adb_lr_id_idx ON apflora.ae_lrdelarze USING btree (id);



CREATE INDEX adresse_freiw_erfko_idx ON apflora.adresse USING btree (freiw_erfko);



CREATE INDEX adresse_id_idx ON apflora.adresse USING btree (id);



CREATE INDEX adresse_name_idx ON apflora.adresse USING btree (name);



CREATE INDEX ap_art_id_idx ON apflora.ap USING btree (art_id);



CREATE INDEX ap_bearbeiter_idx ON apflora.ap USING btree (bearbeiter);



CREATE INDEX ap_bearbeitung_idx ON apflora.ap USING btree (bearbeitung);



CREATE INDEX "ap_bearbstand_werte_DomainCode_idx" ON apflora.ap_bearbstand_werte USING btree (code);



CREATE INDEX "ap_bearbstand_werte_DomainOrd_idx" ON apflora.ap_bearbstand_werte USING btree (sort);



CREATE INDEX ap_bearbstand_werte_id_idx ON apflora.ap_bearbstand_werte USING btree (id);



CREATE INDEX "ap_erfbeurtkrit_werte_DomainCode_idx" ON apflora.ap_erfbeurtkrit_werte USING btree (code);



CREATE INDEX "ap_erfbeurtkrit_werte_DomainOrd_idx" ON apflora.ap_erfbeurtkrit_werte USING btree (sort);



CREATE INDEX ap_erfbeurtkrit_werte_id_idx ON apflora.ap_erfbeurtkrit_werte USING btree (id);



CREATE INDEX "ap_erfkrit_werte_BeurteilId_idx" ON apflora.ap_erfkrit_werte USING btree (code);



CREATE INDEX "ap_erfkrit_werte_BeurteilOrd_idx" ON apflora.ap_erfkrit_werte USING btree (sort);



CREATE INDEX ap_erfkrit_werte_id_idx ON apflora.ap_erfkrit_werte USING btree (id);



CREATE INDEX ap_id_idx ON apflora.ap USING btree (id);



CREATE INDEX ap_proj_id_idx ON apflora.ap USING btree (proj_id);



CREATE INDEX ap_start_jahr_idx ON apflora.ap USING btree (start_jahr);



CREATE INDEX ap_umsetzung_idx ON apflora.ap USING btree (umsetzung);



CREATE INDEX "ap_umsetzung_werte_DomainCode_idx" ON apflora.ap_umsetzung_werte USING btree (code);



CREATE INDEX "ap_umsetzung_werte_DomainOrd_idx" ON apflora.ap_umsetzung_werte USING btree (sort);



CREATE INDEX ap_umsetzung_werte_id_idx ON apflora.ap_umsetzung_werte USING btree (id);



CREATE INDEX apart_ap_id_idx ON apflora.apart USING btree (ap_id);



CREATE INDEX apart_art_id_idx ON apflora.apart USING btree (art_id);



CREATE INDEX apber_ap_id_idx ON apflora.apber USING btree (ap_id);



CREATE INDEX apber_bearbeiter_idx ON apflora.apber USING btree (bearbeiter);



CREATE INDEX apber_beurteilung_idx ON apflora.apber USING btree (beurteilung);



CREATE INDEX apber_id_idx ON apflora.apber USING btree (id);



CREATE INDEX apber_jahr_idx ON apflora.apber USING btree (jahr);



CREATE INDEX apberuebersicht_id_idx ON apflora.apberuebersicht USING btree (id);



CREATE INDEX apberuebersicht_jahr_idx ON apflora.apberuebersicht USING btree (jahr);



CREATE INDEX apberuebersicht_proj_id_idx ON apflora.apberuebersicht USING btree (proj_id);



CREATE INDEX assozart_ae_id_idx ON apflora.assozart USING btree (ae_id);



CREATE INDEX assozart_ap_id_idx ON apflora.assozart USING btree (ap_id);



CREATE INDEX assozart_id_idx ON apflora.assozart USING btree (id);



CREATE INDEX beob_art_id_idx ON apflora.beob USING btree (art_id);



CREATE INDEX beob_id_idx ON apflora.beob USING btree (id);



CREATE INDEX beob_nicht_zuordnen_idx ON apflora.beob USING btree (nicht_zuordnen);



CREATE INDEX beob_quelle_id_idx ON apflora.beob USING btree (quelle_id);



CREATE INDEX beob_quelle_werte_id_idx ON apflora.beob_quelle_werte USING btree (id);



CREATE INDEX beob_tpop_id_idx ON apflora.beob USING btree (tpop_id);



CREATE INDEX beob_x_idx ON apflora.beob USING btree (x);



CREATE INDEX beob_y_idx ON apflora.beob USING btree (y);



CREATE INDEX beobart_id_idx ON apflora.apart USING btree (id);



CREATE INDEX ber_ap_id_idx ON apflora.ber USING btree (ap_id);



CREATE INDEX ber_id_idx ON apflora.ber USING btree (id);



CREATE INDEX ber_jahr_idx ON apflora.ber USING btree (jahr);



CREATE INDEX erfkrit_ap_id_idx ON apflora.erfkrit USING btree (ap_id);



CREATE INDEX erfkrit_erfolg_idx ON apflora.erfkrit USING btree (erfolg);



CREATE INDEX erfkrit_id_idx ON apflora.erfkrit USING btree (id);



CREATE INDEX idealbiotop_ap_id_idx ON apflora.idealbiotop USING btree (ap_id);



CREATE INDEX idealbiotop_id_idx ON apflora.idealbiotop USING btree (id);



CREATE INDEX message_id_idx ON apflora.message USING btree (id);



CREATE INDEX message_time_idx ON apflora.message USING btree ("time");



CREATE INDEX pop_ap_id_idx ON apflora.pop USING btree (ap_id);



CREATE INDEX pop_bekannt_seit_idx ON apflora.pop USING btree (bekannt_seit);



CREATE INDEX pop_id_idx ON apflora.pop USING btree (id);



CREATE INDEX pop_name_idx ON apflora.pop USING btree (name);



CREATE INDEX pop_nr_idx ON apflora.pop USING btree (nr);



CREATE INDEX pop_status_idx ON apflora.pop USING btree (status);



CREATE INDEX "pop_status_werte_HerkunftId_idx" ON apflora.pop_status_werte USING btree (code);



CREATE INDEX "pop_status_werte_HerkunftOrd_idx" ON apflora.pop_status_werte USING btree (sort);



CREATE INDEX "pop_status_werte_HerkunftTxt_idx" ON apflora.pop_status_werte USING btree (text);



CREATE INDEX pop_status_werte_id_idx ON apflora.pop_status_werte USING btree (id);



CREATE INDEX pop_x_idx ON apflora.pop USING btree (x);



CREATE INDEX pop_y_idx ON apflora.pop USING btree (y);



CREATE INDEX popber_entwicklung_idx ON apflora.popber USING btree (entwicklung);



CREATE INDEX popber_id_idx ON apflora.popber USING btree (id);



CREATE INDEX popber_jahr_idx ON apflora.popber USING btree (jahr);



CREATE INDEX popber_pop_id_idx ON apflora.popber USING btree (pop_id);



CREATE INDEX popmassnber_beurteilung_idx ON apflora.popmassnber USING btree (beurteilung);



CREATE INDEX popmassnber_id_idx ON apflora.popmassnber USING btree (id);



CREATE INDEX popmassnber_jahr_idx ON apflora.popmassnber USING btree (jahr);



CREATE INDEX popmassnber_pop_id_idx ON apflora.popmassnber USING btree (pop_id);



CREATE INDEX projekt_id_idx ON apflora.projekt USING btree (id);



CREATE INDEX projekt_name_idx ON apflora.projekt USING btree (name);



CREATE INDEX tpop_apber_relevant_idx ON apflora.tpop USING btree (apber_relevant);



CREATE INDEX "tpop_apberrelevant_werte_DomainCode_idx" ON apflora.tpop_apberrelevant_werte USING btree (code);



CREATE INDEX "tpop_apberrelevant_werte_DomainTxt_idx" ON apflora.tpop_apberrelevant_werte USING btree (text);



CREATE INDEX tpop_apberrelevant_werte_id_idx ON apflora.tpop_apberrelevant_werte USING btree (id);



CREATE INDEX "tpop_entwicklung_werte_EntwicklungCode_idx" ON apflora.tpop_entwicklung_werte USING btree (code);



CREATE INDEX "tpop_entwicklung_werte_EntwicklungOrd_idx" ON apflora.tpop_entwicklung_werte USING btree (sort);



CREATE INDEX tpop_entwicklung_werte_id_idx ON apflora.tpop_entwicklung_werte USING btree (id);



CREATE INDEX tpop_flurname_idx ON apflora.tpop USING btree (flurname);



CREATE INDEX tpop_id_idx ON apflora.tpop USING btree (id);



CREATE INDEX tpop_nr_idx ON apflora.tpop USING btree (nr);



CREATE INDEX tpop_pop_id_idx ON apflora.tpop USING btree (pop_id);



CREATE INDEX tpop_status_idx ON apflora.tpop USING btree (status);



CREATE INDEX tpop_x_idx ON apflora.tpop USING btree (x);



CREATE INDEX tpop_y_idx ON apflora.tpop USING btree (y);



CREATE INDEX tpopber_entwicklung_idx ON apflora.tpopber USING btree (entwicklung);



CREATE INDEX tpopber_id_idx ON apflora.tpopber USING btree (id);



CREATE INDEX tpopber_jahr_idx ON apflora.tpopber USING btree (jahr);



CREATE INDEX tpopber_tpop_id_idx ON apflora.tpopber USING btree (tpop_id);



CREATE INDEX tpopkontr_bearbeiter_idx ON apflora.tpopkontr USING btree (bearbeiter);



CREATE INDEX tpopkontr_datum_idx ON apflora.tpopkontr USING btree (datum);



CREATE INDEX tpopkontr_entwicklung_idx ON apflora.tpopkontr USING btree (entwicklung);



CREATE INDEX tpopkontr_id_idx ON apflora.tpopkontr USING btree (id);



CREATE INDEX tpopkontr_idbiotuebereinst_werte_code_idx ON apflora.tpopkontr_idbiotuebereinst_werte USING btree (code);



CREATE INDEX tpopkontr_idbiotuebereinst_werte_id_idx ON apflora.tpopkontr_idbiotuebereinst_werte USING btree (id);



CREATE INDEX tpopkontr_idbiotuebereinst_werte_sort_idx ON apflora.tpopkontr_idbiotuebereinst_werte USING btree (sort);



CREATE INDEX tpopkontr_idealbiotop_uebereinstimmung_idx ON apflora.tpopkontr USING btree (idealbiotop_uebereinstimmung);



CREATE INDEX tpopkontr_jahr_idx ON apflora.tpopkontr USING btree (jahr);



CREATE INDEX tpopkontr_tpop_id_idx ON apflora.tpopkontr USING btree (tpop_id);



CREATE INDEX tpopkontr_typ_idx ON apflora.tpopkontr USING btree (typ);



CREATE INDEX tpopkontr_typ_werte_id_idx ON apflora.tpopkontr_typ_werte USING btree (id);



CREATE UNIQUE INDEX tpopkontr_zeit_id_idx ON apflora.tpopkontr USING btree (zeit_id);



CREATE INDEX tpopkontrzaehl_anzahl_idx ON apflora.tpopkontrzaehl USING btree (anzahl);



CREATE INDEX tpopkontrzaehl_einheit_idx ON apflora.tpopkontrzaehl USING btree (einheit);



CREATE INDEX tpopkontrzaehl_einheit_werte_code_idx ON apflora.tpopkontrzaehl_einheit_werte USING btree (code);



CREATE INDEX tpopkontrzaehl_einheit_werte_id_idx ON apflora.tpopkontrzaehl_einheit_werte USING btree (id);



CREATE INDEX tpopkontrzaehl_einheit_werte_sort_idx ON apflora.tpopkontrzaehl_einheit_werte USING btree (sort);



CREATE INDEX tpopkontrzaehl_id_idx ON apflora.tpopkontrzaehl USING btree (id);



CREATE INDEX tpopkontrzaehl_methode_idx ON apflora.tpopkontrzaehl USING btree (methode);



CREATE INDEX tpopkontrzaehl_methode_werte_code_idx ON apflora.tpopkontrzaehl_methode_werte USING btree (code);



CREATE INDEX tpopkontrzaehl_methode_werte_id_idx ON apflora.tpopkontrzaehl_methode_werte USING btree (id);



CREATE INDEX tpopkontrzaehl_methode_werte_sort_idx ON apflora.tpopkontrzaehl_methode_werte USING btree (sort);



CREATE INDEX tpopkontrzaehl_tpopkontr_id_idx2 ON apflora.tpopkontrzaehl USING btree (tpopkontr_id);



CREATE INDEX tpopmassn_bearbeiter_idx ON apflora.tpopmassn USING btree (bearbeiter);



CREATE INDEX tpopmassn_erfbeurt_werte_code_idx ON apflora.tpopmassn_erfbeurt_werte USING btree (code);



CREATE INDEX tpopmassn_erfbeurt_werte_id_idx ON apflora.tpopmassn_erfbeurt_werte USING btree (id);



CREATE INDEX tpopmassn_erfbeurt_werte_sort_idx ON apflora.tpopmassn_erfbeurt_werte USING btree (sort);



CREATE UNIQUE INDEX tpopmassn_id_idx ON apflora.tpopmassn USING btree (id);



CREATE INDEX tpopmassn_jahr_idx ON apflora.tpopmassn USING btree (jahr);



CREATE INDEX tpopmassn_tpop_id_idx ON apflora.tpopmassn USING btree (tpop_id);



CREATE INDEX tpopmassn_typ_idx ON apflora.tpopmassn USING btree (typ);



CREATE INDEX tpopmassn_typ_werte_code_idx ON apflora.tpopmassn_typ_werte USING btree (code);



CREATE INDEX tpopmassn_typ_werte_id_idx ON apflora.tpopmassn_typ_werte USING btree (id);



CREATE INDEX tpopmassn_typ_werte_sort_idx ON apflora.tpopmassn_typ_werte USING btree (sort);



CREATE INDEX tpopmassnber_beurteilung_idx ON apflora.tpopmassnber USING btree (beurteilung);



CREATE INDEX tpopmassnber_id_idx ON apflora.tpopmassnber USING btree (id);



CREATE INDEX tpopmassnber_jahr_idx ON apflora.tpopmassnber USING btree (jahr);



CREATE INDEX tpopmassnber_tpop_id_idx ON apflora.tpopmassnber USING btree (tpop_id);



CREATE INDEX user_id_idx ON apflora."user" USING btree (id);



CREATE INDEX user_name_idx ON apflora."user" USING btree (name);



CREATE INDEX usermessage_id_idx ON apflora.usermessage USING btree (id);



CREATE INDEX usermessage_message_id_idx ON apflora.usermessage USING btree (message_id);



CREATE INDEX usermessage_user_name_idx ON apflora.usermessage USING btree (user_name);



CREATE INDEX ziel_ap_id_idx ON apflora.ziel USING btree (ap_id);



CREATE INDEX ziel_id_idx ON apflora.ziel USING btree (id);



CREATE INDEX ziel_jahr_idx ON apflora.ziel USING btree (jahr);



CREATE INDEX ziel_typ_idx ON apflora.ziel USING btree (typ);



CREATE INDEX ziel_typ_werte_code_idx ON apflora.ziel_typ_werte USING btree (code);



CREATE INDEX ziel_typ_werte_id_idx ON apflora.ziel_typ_werte USING btree (id);



CREATE INDEX ziel_typ_werte_sort_idx ON apflora.ziel_typ_werte USING btree (sort);



CREATE INDEX zielber_id_idx ON apflora.zielber USING btree (id);



CREATE INDEX zielber_jahr_idx ON apflora.zielber USING btree (jahr);



CREATE INDEX zielber_ziel_id_idx ON apflora.zielber USING btree (ziel_id);



CREATE OR REPLACE VIEW apflora.v_exportevab_beob AS
 SELECT tpopkontr.zeit_id AS "fkZeitpunkt",
    tpopkontr.id AS "idBeobachtung",
    COALESCE(adresse.evab_id_person, 'a1146ae4-4e03-4032-8aa8-bc46ba02f468'::uuid) AS fkautor,
    ap.art_id AS fkart,
    18 AS fkartgruppe,
    1 AS fkaa1,
        CASE
            WHEN (tpop.status < 200) THEN 4
            WHEN (EXISTS ( SELECT tpopmassn.tpop_id
               FROM apflora.tpopmassn
              WHERE ((tpopmassn.tpop_id = tpopkontr.tpop_id) AND ((tpopmassn.typ >= 1) AND (tpopmassn.typ <= 3)) AND (tpopmassn.jahr <= tpopkontr.jahr)))) THEN 6
            WHEN (tpop.status_unklar = true) THEN 3
            ELSE 5
        END AS "fkAAINTRODUIT",
        CASE
            WHEN ((v_tpopkontr_maxanzahl.anzahl = 0) AND (EXISTS ( SELECT tpopber.tpop_id
               FROM apflora.tpopber
              WHERE ((tpopber.tpop_id = tpopkontr.tpop_id) AND (tpopber.entwicklung = 8) AND (tpopber.jahr = tpopkontr.jahr))))) THEN 2
            WHEN (v_tpopkontr_maxanzahl.anzahl = 0) THEN 3
            ELSE 1
        END AS "fkAAPRESENCE",
    "substring"(tpopkontr.gefaehrdung, 1, 244) AS "MENACES",
    "substring"(tpopkontr.vitalitaet, 1, 200) AS "VITALITE_PLANTE",
    "substring"(tpop.beschreibung, 1, 244) AS "STATION",
    "substring"(concat('Anzahlen: ', array_to_string(array_agg(tpopkontrzaehl.anzahl), ', '::text), ', Zaehleinheiten: ', string_agg((tpopkontrzaehl_einheit_werte.text)::text, ', '::text), ', Methoden: ', string_agg((tpopkontrzaehl_methode_werte.text)::text, ', '::text)), 1, 244) AS "ABONDANCE",
    'C'::text AS "EXPERTISE_INTRODUIT",
        CASE
            WHEN (apflora_adresse_2.evab_id_person IS NOT NULL) THEN "substring"(apflora_adresse_2.name, 1, 99)
            ELSE 'topos Marti & Müller AG Zürich'::text
        END AS "EXPERTISE_INTRODUITE_NOM"
   FROM (((apflora.ap
     LEFT JOIN apflora.adresse apflora_adresse_2 ON ((ap.bearbeiter = apflora_adresse_2.id)))
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN (((apflora.tpopkontr
     LEFT JOIN apflora.adresse ON ((tpopkontr.bearbeiter = adresse.id)))
     JOIN apflora.v_tpopkontr_maxanzahl ON ((v_tpopkontr_maxanzahl.id = tpopkontr.id)))
     LEFT JOIN ((apflora.tpopkontrzaehl
     LEFT JOIN apflora.tpopkontrzaehl_einheit_werte ON ((tpopkontrzaehl.einheit = tpopkontrzaehl_einheit_werte.code)))
     LEFT JOIN apflora.tpopkontrzaehl_methode_werte ON ((tpopkontrzaehl.methode = tpopkontrzaehl_methode_werte.code))) ON ((tpopkontr.id = tpopkontrzaehl.tpopkontr_id))) ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
     JOIN apflora.ae_eigenschaften ON ((ae_eigenschaften.id = ap.art_id)))
  WHERE ((ae_eigenschaften.taxid > 150) AND (ae_eigenschaften.taxid < 1000000) AND (tpop.x IS NOT NULL) AND (tpop.y IS NOT NULL) AND ((tpopkontr.typ)::text = ANY (ARRAY[('Ausgangszustand'::character varying)::text, ('Zwischenbeurteilung'::character varying)::text, ('Freiwilligen-Erfolgskontrolle'::character varying)::text])) AND (tpop.status <> 201) AND (tpopkontr.bearbeiter IS NOT NULL) AND (tpopkontr.bearbeiter <> 'a1146ae4-4e03-4032-8aa8-bc46ba02f468'::uuid) AND (tpopkontr.jahr IS NOT NULL) AND ((tpopkontr.jahr)::double precision <> date_part('year'::text, ('now'::text)::date)) AND (tpop.bekannt_seit IS NOT NULL) AND ((tpop.status = ANY (ARRAY[100, 101])) OR ((tpopkontr.jahr - tpop.bekannt_seit) > 5)) AND (tpop.flurname IS NOT NULL) AND (ap.id IN ( SELECT v_exportevab_projekt."idProjekt"
           FROM apflora.v_exportevab_projekt)) AND (pop.id IN ( SELECT v_exportevab_raum."idRaum"
           FROM apflora.v_exportevab_raum)) AND (tpop.id IN ( SELECT v_exportevab_ort."idOrt"
           FROM apflora.v_exportevab_ort)) AND (tpopkontr.zeit_id IN ( SELECT v_exportevab_zeit."idZeitpunkt"
           FROM apflora.v_exportevab_zeit)))
  GROUP BY tpopkontr.zeit_id, tpopkontr.tpop_id, tpopkontr.id, tpopkontr.jahr, adresse.evab_id_person, ap.id,
        CASE
            WHEN (tpop.status < 200) THEN 4
            WHEN (EXISTS ( SELECT tpopmassn.tpop_id
               FROM apflora.tpopmassn
              WHERE ((tpopmassn.tpop_id = tpopkontr.tpop_id) AND ((tpopmassn.typ >= 1) AND (tpopmassn.typ <= 3)) AND (tpopmassn.jahr <= tpopkontr.jahr)))) THEN 6
            WHEN (tpop.status_unklar = true) THEN 3
            ELSE 5
        END, v_tpopkontr_maxanzahl.anzahl, tpopkontr.gefaehrdung, tpopkontr.vitalitaet, tpop.beschreibung, apflora_adresse_2.evab_id_person, apflora_adresse_2.name;



CREATE OR REPLACE VIEW apflora.v_qk_apber_ohnejahr AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'AP-Bericht ohne Jahr:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'AP-Berichte'::text, (apber.id)::text] AS url,
    ARRAY[concat('AP-Bericht (id): ', apber.id)] AS text
   FROM (apflora.ap
     JOIN apflora.apber ON ((ap.id = apber.ap_id)))
  GROUP BY ap.id, apber.id
 HAVING (apber.jahr IS NULL)
  ORDER BY apber.id;



CREATE OR REPLACE VIEW apflora.v_qk_feldkontr_ohnezaehlung AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Feldkontrolle ohne Zaehlung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text, 'Feld-Kontrollen'::text, (tpopkontr.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr), concat('Feld-Kontrolle (Jahr): ', tpopkontr.jahr)] AS text,
    tpopkontr.jahr AS "Berichtjahr"
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN (apflora.tpopkontr
     LEFT JOIN apflora.tpopkontrzaehl ON ((tpopkontr.id = tpopkontrzaehl.tpopkontr_id))) ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  GROUP BY ap.id, pop.id, tpop.id, tpop.nr, tpopkontr.id, tpopkontrzaehl.id
 HAVING ((tpopkontrzaehl.id IS NULL) AND (tpopkontr.jahr IS NOT NULL) AND ((tpopkontr.typ)::text <> 'Freiwilligen-Erfolgskontrolle'::text))
  ORDER BY ap.id, pop.nr, tpop.nr, tpopkontr.jahr;



CREATE OR REPLACE VIEW apflora.v_qk_freiwkontr_ohnezaehlung AS
 SELECT ap.proj_id,
    ap.id AS ap_id,
    'Freiwilligen-Kontrolle ohne Zaehlung:'::text AS hw,
    ARRAY['Projekte'::text, '4635372c-431c-11e8-bb30-e77f6cdd35a6'::text, 'Aktionspläne'::text, (ap.id)::text, 'Populationen'::text, (pop.id)::text, 'Teil-Populationen'::text, (tpop.id)::text, 'Freiwilligen-Kontrollen'::text, (tpopkontr.id)::text] AS url,
    ARRAY[concat('Population (Nr.): ', pop.nr), concat('Teil-Population (Nr.): ', tpop.nr), concat('Feld-Kontrolle (Jahr): ', tpopkontr.jahr)] AS text,
    tpopkontr.jahr AS "Berichtjahr"
   FROM (apflora.ap
     JOIN (apflora.pop
     JOIN (apflora.tpop
     JOIN (apflora.tpopkontr
     LEFT JOIN apflora.tpopkontrzaehl ON ((tpopkontr.id = tpopkontrzaehl.tpopkontr_id))) ON ((tpop.id = tpopkontr.tpop_id))) ON ((pop.id = tpop.pop_id))) ON ((ap.id = pop.ap_id)))
  GROUP BY ap.id, pop.id, tpop.id, tpop.nr, tpopkontr.id, tpopkontrzaehl.id
 HAVING ((tpopkontrzaehl.id IS NULL) AND (tpopkontr.jahr IS NOT NULL) AND ((tpopkontr.typ)::text = 'Freiwilligen-Erfolgskontrolle'::text))
  ORDER BY ap.id, pop.nr, tpop.nr, tpopkontr.jahr;



CREATE TRIGGER adresse_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.adresse FOR EACH ROW EXECUTE PROCEDURE public.adresse_on_update_set_mut();



CREATE TRIGGER ap_bearbstand_werte_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.ap_bearbstand_werte FOR EACH ROW EXECUTE PROCEDURE public.ap_bearbstand_werte_on_update_set_mut();



CREATE TRIGGER ap_erfbeurtkrit_werte_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.ap_erfbeurtkrit_werte FOR EACH ROW EXECUTE PROCEDURE public.ap_erfbeurtkrit_werte_on_update_set_mut();



CREATE TRIGGER ap_erfkrit_werte_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.ap_erfkrit_werte FOR EACH ROW EXECUTE PROCEDURE public.ap_erfkrit_werte_on_update_set_mut();



CREATE TRIGGER ap_insert_add_apart AFTER INSERT ON apflora.ap FOR EACH ROW EXECUTE PROCEDURE apflora.ap_insert_add_apart();



CREATE TRIGGER ap_insert_add_idealbiotop AFTER INSERT ON apflora.ap FOR EACH ROW EXECUTE PROCEDURE apflora.ap_insert_add_idealbiotop();



CREATE TRIGGER ap_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.ap FOR EACH ROW EXECUTE PROCEDURE public.ap_on_update_set_mut();



CREATE TRIGGER ap_umsetzung_werte_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.ap_umsetzung_werte FOR EACH ROW EXECUTE PROCEDURE public.ap_umsetzung_werte_on_update_set_mut();



CREATE TRIGGER apber_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.apber FOR EACH ROW EXECUTE PROCEDURE public.apber_on_update_set_mut();



CREATE TRIGGER apberuebersicht_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.apberuebersicht FOR EACH ROW EXECUTE PROCEDURE public.apberuebersicht_on_update_set_mut();



CREATE TRIGGER assozart_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.assozart FOR EACH ROW EXECUTE PROCEDURE public.assozart_on_update_set_mut();



CREATE TRIGGER beob_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.beob FOR EACH ROW EXECUTE PROCEDURE public.beob_on_update_set_mut();



CREATE TRIGGER ber_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.ber FOR EACH ROW EXECUTE PROCEDURE public.ber_on_update_set_mut();



CREATE TRIGGER encrypt_pass BEFORE INSERT OR UPDATE ON apflora."user" FOR EACH ROW EXECUTE PROCEDURE auth.encrypt_pass();



CREATE CONSTRAINT TRIGGER ensure_user_role_exists AFTER INSERT OR UPDATE ON apflora."user" NOT DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE PROCEDURE auth.check_role_exists();



CREATE TRIGGER erfkrit_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.erfkrit FOR EACH ROW EXECUTE PROCEDURE public.erfkrit_on_update_set_mut();



CREATE TRIGGER idealbiotop_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.idealbiotop FOR EACH ROW EXECUTE PROCEDURE public.idealbiotop_on_update_set_mut();



CREATE TRIGGER pop_max_one_massnber_per_year BEFORE INSERT OR UPDATE ON apflora.popmassnber FOR EACH ROW EXECUTE PROCEDURE apflora.pop_max_one_massnber_per_year();



CREATE TRIGGER pop_max_one_popber_per_year BEFORE INSERT OR UPDATE ON apflora.popber FOR EACH ROW EXECUTE PROCEDURE apflora.pop_max_one_popber_per_year();



CREATE TRIGGER pop_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.pop FOR EACH ROW EXECUTE PROCEDURE public.pop_on_update_set_mut();



CREATE TRIGGER pop_status_werte_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.pop_status_werte FOR EACH ROW EXECUTE PROCEDURE public.pop_status_werte_on_update_set_mut();



CREATE TRIGGER popber_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.popber FOR EACH ROW EXECUTE PROCEDURE public.popber_on_update_set_mut();



CREATE TRIGGER popmassnber_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.popmassnber FOR EACH ROW EXECUTE PROCEDURE public.popmassnber_on_update_set_mut();



CREATE TRIGGER projekt_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.projekt FOR EACH ROW EXECUTE PROCEDURE public.projekt_on_update_set_mut();



CREATE TRIGGER tpop_apberrelevant_werte_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.tpop_apberrelevant_werte FOR EACH ROW EXECUTE PROCEDURE public.tpop_apberrelevant_werte_on_update_set_mut();



CREATE TRIGGER tpop_entwicklung_werte_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.tpop_entwicklung_werte FOR EACH ROW EXECUTE PROCEDURE public.tpop_entwicklung_werte_on_update_set_mut();



CREATE TRIGGER tpop_max_one_massnber_per_year BEFORE INSERT OR UPDATE ON apflora.tpopmassnber FOR EACH ROW EXECUTE PROCEDURE apflora.tpop_max_one_massnber_per_year();



CREATE TRIGGER tpop_max_one_tpopber_per_year BEFORE INSERT OR UPDATE ON apflora.tpopber FOR EACH ROW EXECUTE PROCEDURE apflora.tpop_max_one_tpopber_per_year();



CREATE TRIGGER tpop_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.tpop FOR EACH ROW EXECUTE PROCEDURE public.tpop_on_update_set_mut();



CREATE TRIGGER tpopber_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.tpopber FOR EACH ROW EXECUTE PROCEDURE public.tpopber_on_update_set_mut();



CREATE TRIGGER tpopkontr_idbiotuebereinst_werte_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.tpopkontr_idbiotuebereinst_werte FOR EACH ROW EXECUTE PROCEDURE public.tpopkontr_idbiotuebereinst_werte_on_update_set_mut();



CREATE TRIGGER tpopkontr_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.tpopkontr FOR EACH ROW EXECUTE PROCEDURE public.tpopkontr_on_update_set_mut();



CREATE TRIGGER tpopkontr_typ_werte_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.tpopkontr_typ_werte FOR EACH ROW EXECUTE PROCEDURE public.tpopkontr_typ_werte_on_update_set_mut();



CREATE TRIGGER tpopkontrzaehl_einheit_werte_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.tpopkontrzaehl_einheit_werte FOR EACH ROW EXECUTE PROCEDURE public.tpopkontrzaehl_einheit_werte_on_update_set_mut();



CREATE TRIGGER tpopkontrzaehl_methode_werte_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.tpopkontrzaehl_methode_werte FOR EACH ROW EXECUTE PROCEDURE public.tpopkontrzaehl_methode_werte_on_update_set_mut();



CREATE TRIGGER tpopkontrzaehl_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.tpopkontrzaehl FOR EACH ROW EXECUTE PROCEDURE public.tpopkontrzaehl_on_update_set_mut();



CREATE TRIGGER tpopmassn_erfbeurt_werte_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.tpopmassn_erfbeurt_werte FOR EACH ROW EXECUTE PROCEDURE public.tpopmassn_erfbeurt_werte_on_update_set_mut();



CREATE TRIGGER tpopmassn_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.tpopmassn FOR EACH ROW EXECUTE PROCEDURE public.tpopmassn_on_update_set_mut();



CREATE TRIGGER tpopmassn_typ_werte_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.tpopmassn_typ_werte FOR EACH ROW EXECUTE PROCEDURE public.tpopmassn_typ_werte_on_update_set_mut();



CREATE TRIGGER tpopmassnber_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.tpopmassnber FOR EACH ROW EXECUTE PROCEDURE public.tpopmassnber_on_update_set_mut();



CREATE TRIGGER ziel_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.ziel FOR EACH ROW EXECUTE PROCEDURE public.ziel_on_update_set_mut();



CREATE TRIGGER ziel_typ_werte_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.ziel_typ_werte FOR EACH ROW EXECUTE PROCEDURE public.ziel_typ_werte_on_update_set_mut();



CREATE TRIGGER zielber_on_update_set_mut BEFORE INSERT OR UPDATE ON apflora.zielber FOR EACH ROW EXECUTE PROCEDURE public.zielber_on_update_set_mut();



ALTER TABLE ONLY apflora.ap
    ADD CONSTRAINT ap_fk_adresse FOREIGN KEY (bearbeiter) REFERENCES apflora.adresse(id) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.ap
    ADD CONSTRAINT ap_fk_ae_eigenschaften FOREIGN KEY (art_id) REFERENCES apflora.ae_eigenschaften(id) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.ap
    ADD CONSTRAINT ap_fk_ap_bearbstand_werte FOREIGN KEY (bearbeitung) REFERENCES apflora.ap_bearbstand_werte(code) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.ap
    ADD CONSTRAINT ap_fk_ap_umsetzung_werte FOREIGN KEY (umsetzung) REFERENCES apflora.ap_umsetzung_werte(code) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.ap
    ADD CONSTRAINT ap_proj_id_fkey FOREIGN KEY (proj_id) REFERENCES apflora.projekt(id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.apart
    ADD CONSTRAINT apart_ap_id_fkey FOREIGN KEY (ap_id) REFERENCES apflora.ap(id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.apart
    ADD CONSTRAINT apart_fk_ae_eigenschaften FOREIGN KEY (art_id) REFERENCES apflora.ae_eigenschaften(id) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.apber
    ADD CONSTRAINT apber_ap_id_fkey FOREIGN KEY (ap_id) REFERENCES apflora.ap(id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.apber
    ADD CONSTRAINT apber_fk_adresse FOREIGN KEY (bearbeiter) REFERENCES apflora.adresse(id) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.apber
    ADD CONSTRAINT apber_fk_ap_erfkrit_werte FOREIGN KEY (beurteilung) REFERENCES apflora.ap_erfkrit_werte(code) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.apberuebersicht
    ADD CONSTRAINT apberuebersicht_proj_id_fkey FOREIGN KEY (proj_id) REFERENCES apflora.projekt(id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.assozart
    ADD CONSTRAINT assozart_ae_id_fkey FOREIGN KEY (ae_id) REFERENCES apflora.ae_eigenschaften(id) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.assozart
    ADD CONSTRAINT assozart_ap_id_fkey FOREIGN KEY (ap_id) REFERENCES apflora.ap(id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.assozart
    ADD CONSTRAINT assozart_fk_ae_eigenschaften FOREIGN KEY (ae_id) REFERENCES apflora.ae_eigenschaften(id) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.beob
    ADD CONSTRAINT beob_fk_ae_eigenschaften FOREIGN KEY (art_id) REFERENCES apflora.ae_eigenschaften(id) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.beob
    ADD CONSTRAINT beob_fk_beob_quelle_werte FOREIGN KEY (quelle_id) REFERENCES apflora.beob_quelle_werte(id) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.beob
    ADD CONSTRAINT beob_tpop_id_fkey FOREIGN KEY (tpop_id) REFERENCES apflora.tpop(id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.ber
    ADD CONSTRAINT ber_ap_id_fkey FOREIGN KEY (ap_id) REFERENCES apflora.ap(id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.erfkrit
    ADD CONSTRAINT erfkrit_ap_id_fkey FOREIGN KEY (ap_id) REFERENCES apflora.ap(id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.erfkrit
    ADD CONSTRAINT erfkrit_fk_ap_erfkrit_werte FOREIGN KEY (erfolg) REFERENCES apflora.ap_erfkrit_werte(code) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.usermessage
    ADD CONSTRAINT fk_user FOREIGN KEY (user_name) REFERENCES apflora."user"(name) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.idealbiotop
    ADD CONSTRAINT idealbiotop_ap_id_fkey FOREIGN KEY (ap_id) REFERENCES apflora.ap(id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.pop
    ADD CONSTRAINT pop_ap_id_fkey FOREIGN KEY (ap_id) REFERENCES apflora.ap(id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.pop
    ADD CONSTRAINT pop_fk_pop_status_werte FOREIGN KEY (status) REFERENCES apflora.pop_status_werte(code) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.popber
    ADD CONSTRAINT popber_fk_tpop_entwicklung_werte FOREIGN KEY (entwicklung) REFERENCES apflora.tpop_entwicklung_werte(code) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.popber
    ADD CONSTRAINT popber_pop_id_fkey FOREIGN KEY (pop_id) REFERENCES apflora.pop(id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.popmassnber
    ADD CONSTRAINT popmassnber_fk_tpopmassn_erfbeurt_werte FOREIGN KEY (beurteilung) REFERENCES apflora.tpopmassn_erfbeurt_werte(code) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.popmassnber
    ADD CONSTRAINT popmassnber_pop_id_fkey FOREIGN KEY (pop_id) REFERENCES apflora.pop(id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.tpop
    ADD CONSTRAINT tpop_fk_tpop_apberrelevant_werte FOREIGN KEY (apber_relevant) REFERENCES apflora.tpop_apberrelevant_werte(code) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.tpop
    ADD CONSTRAINT tpop_fk_tpop_status_werte FOREIGN KEY (status) REFERENCES apflora.pop_status_werte(code) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.tpop
    ADD CONSTRAINT tpop_pop_id_fkey FOREIGN KEY (pop_id) REFERENCES apflora.pop(id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.tpopber
    ADD CONSTRAINT tpopber_fk_tpop_entwicklung_werte FOREIGN KEY (entwicklung) REFERENCES apflora.tpop_entwicklung_werte(code) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.tpopber
    ADD CONSTRAINT tpopber_tpop_id_fkey FOREIGN KEY (tpop_id) REFERENCES apflora.tpop(id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.tpopkontr
    ADD CONSTRAINT tpopkontr_fk_adresse FOREIGN KEY (bearbeiter) REFERENCES apflora.adresse(id) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.tpopkontr
    ADD CONSTRAINT tpopkontr_fk_tpop_entwicklung_werte FOREIGN KEY (entwicklung) REFERENCES apflora.tpop_entwicklung_werte(code) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.tpopkontr
    ADD CONSTRAINT tpopkontr_fk_tpopkontr_idbiotuebereinst_werte FOREIGN KEY (idealbiotop_uebereinstimmung) REFERENCES apflora.tpopkontr_idbiotuebereinst_werte(code) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.tpopkontr
    ADD CONSTRAINT tpopkontr_fk_tpopkontr_typ_werte FOREIGN KEY (typ) REFERENCES apflora.tpopkontr_typ_werte(text) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.tpopkontr
    ADD CONSTRAINT tpopkontr_tpop_id_fkey FOREIGN KEY (tpop_id) REFERENCES apflora.tpop(id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.tpopkontrzaehl
    ADD CONSTRAINT tpopkontrzaehl_fk_tpopkontrzaehl_einheit_werte FOREIGN KEY (einheit) REFERENCES apflora.tpopkontrzaehl_einheit_werte(code) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.tpopkontrzaehl
    ADD CONSTRAINT tpopkontrzaehl_fk_tpopkontrzaehl_methode_werte FOREIGN KEY (methode) REFERENCES apflora.tpopkontrzaehl_methode_werte(code) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.tpopkontrzaehl
    ADD CONSTRAINT tpopkontrzaehl_tpopkontr_id_fkey FOREIGN KEY (tpopkontr_id) REFERENCES apflora.tpopkontr(id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.tpopmassn
    ADD CONSTRAINT tpopmassn_fk_adresse FOREIGN KEY (bearbeiter) REFERENCES apflora.adresse(id) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.tpopmassn
    ADD CONSTRAINT tpopmassn_fk_tpopmassn_typ_werte FOREIGN KEY (typ) REFERENCES apflora.tpopmassn_typ_werte(code) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.tpopmassn
    ADD CONSTRAINT tpopmassn_tpop_id_fkey FOREIGN KEY (tpop_id) REFERENCES apflora.tpop(id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.tpopmassnber
    ADD CONSTRAINT tpopmassnber_fk_tpopmassn_erfbeurt_werte FOREIGN KEY (beurteilung) REFERENCES apflora.tpopmassn_erfbeurt_werte(code) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.tpopmassnber
    ADD CONSTRAINT tpopmassnber_tpop_id_fkey FOREIGN KEY (tpop_id) REFERENCES apflora.tpop(id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.usermessage
    ADD CONSTRAINT usermessage_message_id_fkey FOREIGN KEY (message_id) REFERENCES apflora.message(id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.ziel
    ADD CONSTRAINT ziel_ap_id_fkey FOREIGN KEY (ap_id) REFERENCES apflora.ap(id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY apflora.ziel
    ADD CONSTRAINT ziel_fk_ziel_typ_werte FOREIGN KEY (typ) REFERENCES apflora.ziel_typ_werte(code) ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY apflora.zielber
    ADD CONSTRAINT zielber_ziel_id_fkey FOREIGN KEY (ziel_id) REFERENCES apflora.ziel(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE apflora."user" ENABLE ROW LEVEL SECURITY;


CREATE SCHEMA fuzzysearch;

-- Create many tables to test fuzzy string search
-- computing hints for non existing tables
DO
$$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT
      format('CREATE TABLE fuzzysearch.unknown_table_%s ()', n) AS ct
    FROM
      generate_series(1, 499) n
    LOOP
      EXECUTE r.ct;
    END LOOP;
END
$$;

DROP ROLE IF EXISTS postgrest_test_anonymous;
CREATE ROLE postgrest_test_anonymous;

GRANT postgrest_test_anonymous TO :"PGUSER";

GRANT USAGE ON SCHEMA apflora TO postgrest_test_anonymous;
GRANT USAGE ON SCHEMA fuzzysearch TO postgrest_test_anonymous;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA apflora
TO postgrest_test_anonymous;

create or replace function apflora.notify_pgrst() returns void as $$
  notify pgrst;
$$ language sql;
