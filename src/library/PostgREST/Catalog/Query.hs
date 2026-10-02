{-# LANGUAGE QuasiQuotes #-}

module PostgREST.Catalog.Query
  ( accessibleFuncs
  , accessibleTables
  , baseTypesCte
  )
where

import NeatInterpolation (trimming)
import Protolude

import PostgREST.Config.PgVersion (PgVersion, pgVersion170)

import Hasql.DynamicStatements.Snippet qualified as SQL
import Hasql.Encoders qualified as HE

baseTypesCte :: PgVersion -> Text
baseTypesCte pgVer
  | pgVer >= pgVersion170 =
      [trimming|
      /* Get base types using pg_basetype() (PG 17+) */
      base_types AS (
        SELECT
          t.oid,
          bt.typnamespace AS base_namespace,
          bt.oid AS base_type
        FROM pg_type t
        JOIN pg_type bt ON bt.oid = pg_basetype(t.oid)
      )
    |]
  | otherwise =
      [trimming|
      /* Recursively get the base types of domains (PG < 17) */
      base_types AS (
        WITH RECURSIVE
        recurse AS (
          SELECT
            oid,
            typbasetype,
            typnamespace AS base_namespace,
            COALESCE(NULLIF(typbasetype, 0), oid) AS base_type
          FROM pg_type
          UNION
          SELECT
            t.oid,
            b.typbasetype,
            b.typnamespace AS base_namespace,
            COALESCE(NULLIF(b.typbasetype, 0), b.oid) AS base_type
          FROM recurse t
          JOIN pg_type b ON t.typbasetype = b.oid
        )
        SELECT
          oid,
          base_namespace,
          base_type
        FROM recurse
        WHERE typbasetype = 0
      )
    |]

accessibleTables :: Text -> SQL.Snippet
accessibleTables schema =
  SQL.sql
    ( encodeUtf8
        [trimming|
  SELECT
    n.nspname AS table_schema,
    c.relname AS table_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('v','r','m','f','p')
  AND c.relnamespace = quote_ident(|]
    )
    <> encodedSchema
    <> SQL.sql
      ( encodeUtf8
          [trimming|
  )::regnamespace AND (
    pg_has_role(c.relowner, 'USAGE')
    or has_table_privilege(c.oid, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
    or has_any_column_privilege(c.oid, 'SELECT, INSERT, UPDATE, REFERENCES')
  )
  AND not c.relispartition
  ORDER BY table_schema, table_name|]
      )
  where
    encodedSchema = SQL.encoderAndParam (HE.nonNullable HE.text) schema

accessibleFuncs :: PgVersion -> Text -> SQL.Snippet
accessibleFuncs pgVer schema = baseFuncSqlQuery pgVer <> "AND p.pronamespace = quote_ident(" <> encodedSchema <> ")::regnamespace"
  where
    encodedSchema = SQL.encoderAndParam (HE.nonNullable HE.text) schema

-- | SQL query to get accessible functions for OpenAPI.
baseFuncSqlQuery :: PgVersion -> SQL.Snippet
baseFuncSqlQuery pgVer =
  let baseCte = baseTypesCte pgVer
  in  SQL.sql $
        encodeUtf8
          [trimming|
  WITH
  $baseCte,
  arguments AS (
    SELECT
      oid,
      array_agg((
        COALESCE(name, ''), /* name */
        type::regtype::text,
        CASE type
          WHEN 'bit'::regtype THEN 'bit varying'
          WHEN 'bit[]'::regtype THEN 'bit varying[]'
          WHEN 'character'::regtype THEN 'character varying'
          WHEN 'character[]'::regtype THEN 'character varying[]'
          ELSE type::regtype::text
        END,
        idx <= (pronargs - pronargdefaults),
        COALESCE(mode = 'v', FALSE)
      ) ORDER BY idx) AS args,
      CASE COUNT(*) - COUNT(name)
        WHEN 0 THEN true
        WHEN 1 THEN (array_agg(type))[1] IN ('bytea'::regtype, 'json'::regtype, 'jsonb'::regtype, 'text'::regtype, 'xml'::regtype)
        ELSE false
      END AS callable
    FROM pg_proc,
         unnest(proargnames, proargtypes, proargmodes)
           WITH ORDINALITY AS _ (name, type, mode, idx)
    WHERE type IS NOT NULL
    GROUP BY oid
  )
  SELECT
    pn.nspname AS proc_schema,
    p.proname AS proc_name,
    d.description AS proc_description,
    COALESCE(a.args, '{}') AS args,
    tn.nspname AS schema,
    COALESCE(comp.relname, t.typname) AS name,
    p.proretset AS rettype_is_setof,
    (t.typtype = 'c'
     or COALESCE(proargmodes::text[] && '{t,b,o}', false)
    ) AS rettype_is_composite,
    bt.oid <> bt.base_type as rettype_is_composite_alias,
    p.provolatile,
    p.provariadic > 0 as hasvariadic,
    'ignored' AS transaction_isolation_level,
    '{}'::text[] as kvs
  FROM pg_proc p
  LEFT JOIN arguments a ON a.oid = p.oid
  JOIN pg_namespace pn ON pn.oid = p.pronamespace
  JOIN base_types bt ON bt.oid = p.prorettype
  JOIN pg_type t ON t.oid = bt.base_type
  JOIN pg_namespace tn ON tn.oid = t.typnamespace
  LEFT JOIN pg_class comp ON comp.oid = t.typrelid
  LEFT JOIN pg_description as d ON d.objoid = p.oid AND d.classoid = 'pg_proc'::regclass
  WHERE t.oid <> 'trigger'::regtype AND COALESCE(a.callable, true)
  AND has_function_privilege(p.oid, 'execute')
  AND prokind = 'f' |]
