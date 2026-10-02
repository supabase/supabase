{-# LANGUAGE DeriveAnyClass #-}
{-# LANGUAGE NamedFieldPuns #-}
{-# LANGUAGE QuasiQuotes #-}
{-# LANGUAGE RecordWildCards #-}

-- |
-- Module      : PostgREST.SchemaCache
-- Description : PostgREST schema cache
--
-- This module(used to be named DbStructure) contains queries that target PostgreSQL system catalogs, these are used to build the schema cache(SchemaCache).
--
-- The schema cache is necessary for resource embedding, foreign keys are used for inferring the relationships between tables.
--
-- These queries are executed once at startup or when PostgREST is reloaded.
module PostgREST.SchemaCache
  ( SchemaCache (..)
  , TablesFuzzyIndex
  , querySchemaCache
  , schemaCacheQueries
  , showSummary
  , decodeFuncs
  , QueryTimings (..)
  , queryTimingsWLabels
  )
where

import Control.Arrow ((&&&))
import Data.Aeson ((.=))
import Data.Functor.Contravariant ((>$<))
import NeatInterpolation (trimming)
import Protolude

import Data.Aeson qualified as JSON
import Data.ByteString.Char8 qualified as BS
import Data.FuzzySet qualified as Fuzzy
import Data.HashMap.Strict qualified as HM
import Data.HashMap.Strict.InsOrd qualified as HMI
import Data.Set qualified as S
import Data.Text qualified as T

import PostgREST.Catalog.Identifiers
  ( QualifiedIdentifier (..)
  , RelIdentifier (..)
  , Schema
  , escapeIdent
  , isAnyElement
  )
import PostgREST.Catalog.Query (baseTypesCte)
import PostgREST.Catalog.Relationship
  ( Cardinality (..)
  , Junction (..)
  , KeyDep (..)
  , Relationship (..)
  , RelationshipsMap
  , ViewKeyDependency (..)
  )
import PostgREST.Catalog.Representations
  ( DataRepresentation (..)
  , RepresentationsMap
  )
import PostgREST.Catalog.Routine
  ( FuncVolatility (..)
  , MediaHandler (..)
  , MediaHandlerMap
  , PgType (..)
  , RetType (..)
  , Routine (..)
  , RoutineMap
  , RoutineParam (..)
  )
import PostgREST.Catalog.Table
  ( Column (..)
  , ColumnMap
  , Table (..)
  , TablesMap
  )
import PostgREST.Config (AppConfig (..), LogLevel (..))
import PostgREST.Config.Database (toIsolationLevel)
import PostgREST.Config.PgVersion (PgVersion)

import Hasql.Decoders qualified as HD
import Hasql.Encoders qualified as HE
import Hasql.Statement qualified as SQL
import Hasql.Transaction qualified as SQL
import PostgREST.MediaType qualified as MediaType

type TablesFuzzyIndex = HM.HashMap Schema Fuzzy.FuzzySet

data SchemaCache = SchemaCache
  { dbTables :: TablesMap
  , dbRelationships :: RelationshipsMap
  , dbRoutines :: RoutineMap
  , dbRepresentations :: RepresentationsMap
  , dbMediaHandlers :: MediaHandlerMap
  , -- Memoized fuzzy index of table names per schema to support approximate matching
    -- Since index construction can be expensive, we build it once and store in the SchemaCache
    -- Haskell lazy evaluation ensures it's only built on first use and memoized afterwards
    dbTablesFuzzyIndex :: TablesFuzzyIndex
  }
  deriving (Show)

instance JSON.ToJSON SchemaCache where
  toJSON (SchemaCache tabs rels routs reps hdlers _) =
    JSON.object
      [ "dbTables" .= JSON.toJSON tabs
      , "dbRelationships" .= JSON.toJSON rels
      , "dbRoutines" .= JSON.toJSON routs
      , "dbRepresentations" .= JSON.toJSON reps
      , "dbMediaHandlers" .= JSON.toJSON hdlers
      ]

showSummary :: SchemaCache -> Text
showSummary (SchemaCache tbls rels routs reps mediaHdlrs _) =
  T.intercalate
    ", "
    [ show (HM.size tbls) <> " Relations"
    , show (HM.size rels) <> " Relationships"
    , show (HM.size routs) <> " RPCs"
    , show (HM.size reps) <> " Domain Representations"
    , show (HM.size mediaHdlrs) <> " Media Type Handlers"
    ]

-- | A SQL query that can be executed independently
type SqlQuery = ByteString

maxDbTablesForFuzzySearch :: Int
maxDbTablesForFuzzySearch = 500

-- keep this in the order they're executed on querySchemaCache for accurate logging
schemaCacheQueries :: PgVersion -> AppConfig -> [SqlQuery]
schemaCacheQueries pgVer AppConfig{configDbPreparedStatements} =
  [ statementSql $ allTables pgVer configDbPreparedStatements
  , statementSql allViewsKeyDependencies
  , statementSql allM2OandO2ORels
  , statementSql $ allFunctions pgVer configDbPreparedStatements
  , statementSql allComputedRels
  , statementSql dataRepresentations
  , statementSql mediaHandlers
  ]
  where
    statementSql (SQL.Statement sql _ _ _) = sql

querySchemaCache :: PgVersion -> AppConfig -> SQL.Transaction (SchemaCache, Maybe QueryTimings)
querySchemaCache pgVer conf@AppConfig{..} = do
  SQL.sql "set local schema ''" -- This voids the search path. The following queries need this for getting the fully qualified name(schema.name) of every db object
  for_ configInternalSCQuerySleepFst (`SQL.statement` sleepCall) -- only used for testing
  tabs <- sqlTimedStmt gucTbls conf (allTables pgVer configDbPreparedStatements)
  keyDeps <- sqlTimedStmt gucKDeps conf allViewsKeyDependencies
  m2oRels <- sqlTimedStmt gucRels mempty allM2OandO2ORels
  funcs <- sqlTimedStmt gucFuncs conf (allFunctions pgVer configDbPreparedStatements)
  cRels <- sqlTimedStmt gucCRels mempty allComputedRels
  reps <- sqlTimedStmt gucDReps conf dataRepresentations
  mHdlers <- sqlTimedStmt gucMHdrs conf mediaHandlers

  for_ configInternalSCQuerySleepSnd (`SQL.statement` sleepCall) -- only used for testing
  qsTime <-
    if isLogDebug then
      Just <$> SQL.statement mempty extractTimings
    else
      pure Nothing

  let
    tabsWViewsPks = addViewPrimaryKeys tabs keyDeps
    rels = addInverseRels $ addM2MRels tabsWViewsPks $ addViewM2OAndO2ORels keyDeps m2oRels

  return
    ( removeInternal schemas $
        SchemaCache
          { dbTables = tabsWViewsPks
          , dbRelationships = getOverrideRelationshipsMap rels cRels
          , dbRoutines = funcs
          , dbRepresentations = reps
          , dbMediaHandlers = HM.union mHdlers initialMediaHandlers -- the custom handlers will override the initial ones
          , dbTablesFuzzyIndex =
              -- Only build fuzzy index for schemas with a reasonable number of tables
              -- Fuzzy.FuzzySet is memory heavy we just don't use it for large schemas
              Fuzzy.fromList <$> HM.filter ((< maxDbTablesForFuzzySearch) . length) (HM.fromListWith (<>) ((qiSchema &&& pure . qiName) <$> HM.keys tabsWViewsPks))
          }
    , qsTime
    )
  where
    schemas = toList configDbSchemas
    isLogDebug = configLogLevel == LogDebug
    sqlTimedStmt = sqlTimedStatement isLogDebug
    sleepCall = SQL.Statement "select pg_sleep($1 / 1000.0)" (param HE.int4) HD.noResult True

-- | overrides detected relationships with the computed relationships and gets the RelationshipsMap
getOverrideRelationshipsMap :: [Relationship] -> [Relationship] -> RelationshipsMap
getOverrideRelationshipsMap rels cRels =
  sort <$> deformedRelMap patchedRels
  where
    -- there can only be a single (table_type, func_name) pair in a function definition `test.function(table_type)`, so we use HM.fromList to disallow duplicates
    computedRels = HM.fromList $ relMapKey <$> cRels
    -- here we override the detected relationships with the user computed relationships, HM.union makes sure computedRels prevail
    patchedRels = HM.union computedRels (relsMap rels)
    relsMap = HM.fromListWith (++) . fmap relMapKey
    relMapKey rel = case rel of
      Relationship{relTable, relForeignTable} -> ((relTable, relForeignTable), [rel])
      -- we use (relTable, relFunction) as key to override detected relationships with the function name
      ComputedRelationship{relTable, relFunction} -> ((relTable, relFunction), [rel])
    -- Since a relationship is between a table and foreign table, the logical way to index/search is by their table/ftable QualifiedIdentifier
    -- However, because we allow searching a relationship by the columns of the foreign key(using the "column as target" disambiguation) we lose the
    -- ability to index by the foreign table name, so we deform the key. TODO remove once support for "column as target" is gone.
    deformedRelMap = HM.fromListWith (++) . fmap addDeformedRelKey . HM.toList
    addDeformedRelKey ((relT, relFT), rls) = ((relT, qiSchema relFT), rls)

-- | Remove db objects that belong to an internal schema(not exposed through the API) from the SchemaCache.
removeInternal :: [Schema] -> SchemaCache -> SchemaCache
removeInternal schemas dbStruct =
  SchemaCache
    { dbTables = HM.filterWithKey (\(QualifiedIdentifier sch _) _ -> sch `elem` schemas) $ dbTables dbStruct
    , dbRelationships =
        filter (\r -> qiSchema (relForeignTable r) `elem` schemas && not (hasInternalJunction r))
          <$> HM.filterWithKey (\(QualifiedIdentifier sch _, _) _ -> sch `elem` schemas) (dbRelationships dbStruct)
    , dbRoutines = dbRoutines dbStruct -- procs are only obtained from the exposed schemas, no need to filter them.
    , dbRepresentations = dbRepresentations dbStruct -- no need to filter, not directly exposed through the API
    , dbMediaHandlers = dbMediaHandlers dbStruct
    , dbTablesFuzzyIndex = dbTablesFuzzyIndex dbStruct
    }
  where
    hasInternalJunction ComputedRelationship{} = False
    hasInternalJunction Relationship{relCardinality = card} = case card of
      M2M Junction{junTable} -> qiSchema junTable `notElem` schemas
      _ -> False

decodeTables :: HD.Result TablesMap
decodeTables =
  HM.fromList . map (\tbl@Table{tableSchema, tableName} -> (QualifiedIdentifier tableSchema tableName, tbl)) <$> HD.rowList tblRow
  where
    tblRow =
      Table
        <$> column HD.text
        <*> column HD.text
        <*> nullableColumn HD.text
        <*> column HD.bool
        <*> column HD.bool
        <*> column HD.bool
        <*> column HD.bool
        <*> arrayColumn HD.text
        <*> parseCols
          ( compositeArrayColumn
              ( Column
                  <$> compositeField HD.text
                  <*> nullableCompositeField HD.text
                  <*> compositeField HD.bool
                  <*> compositeField HD.text
                  <*> compositeField HD.text
                  <*> nullableCompositeField HD.int4
                  <*> nullableCompositeField HD.text
                  <*> compositeFieldArray HD.text
              )
          )

parseCols :: HD.Row [Column] -> HD.Row ColumnMap
parseCols = fmap (HMI.fromList . map (\col@Column{colName} -> (colName, col)))

decodeRels :: HD.Result [Relationship]
decodeRels =
  HD.rowList relRow
  where
    relRow = (\(qi1, qi2, isSelf, constr, cols, isOneToOne) -> Relationship qi1 qi2 isSelf (if isOneToOne then O2O constr cols False else M2O constr cols) False False) <$> row
    row =
      (,,,,,)
        <$> (QualifiedIdentifier <$> column HD.text <*> column HD.text)
        <*> (QualifiedIdentifier <$> column HD.text <*> column HD.text)
        <*> column HD.bool
        <*> column HD.text
        <*> compositeArrayColumn ((,) <$> compositeField HD.text <*> compositeField HD.text)
        <*> column HD.bool

decodeViewKeyDeps :: HD.Result [ViewKeyDependency]
decodeViewKeyDeps =
  map viewKeyDepFromRow <$> HD.rowList row
  where
    row =
      (,,,,,,)
        <$> column HD.text
        <*> column HD.text
        <*> column HD.text
        <*> column HD.text
        <*> column HD.text
        <*> column HD.text
        <*> compositeArrayColumn
          ( (,)
              <$> compositeField HD.text
              <*> compositeFieldArray HD.text
          )

viewKeyDepFromRow :: (Text, Text, Text, Text, Text, Text, [(Text, [Text])]) -> ViewKeyDependency
viewKeyDepFromRow (s1, t1, s2, v2, cons, consType, sCols) = ViewKeyDependency (QualifiedIdentifier s1 t1) (QualifiedIdentifier s2 v2) cons keyDep sCols
  where
    keyDep
      | consType == "p" = PKDep
      | consType == "f" = FKDep
      | otherwise = FKDepRef -- f_ref, we build this type in the query

decodeFuncs :: HD.Result RoutineMap
decodeFuncs =
  -- Duplicate rows for a function means they're overloaded, order these by least args according to Routine Ord instance
  map sort . HM.fromListWith (++) . map ((\(x, y) -> (x, [y])) . addKey) <$> HD.rowList funcRow
  where
    funcRow =
      Function
        <$> column HD.text
        <*> column HD.text
        <*> nullableColumn HD.text
        <*> compositeArrayColumn
          ( RoutineParam
              <$> compositeField HD.text
              <*> compositeField HD.text
              <*> compositeField HD.text
              <*> compositeField HD.bool
              <*> compositeField HD.bool
          )
        <*> ( parseRetType
                <$> column HD.text
                <*> column HD.text
                <*> column HD.bool
                <*> column HD.bool
                <*> column HD.bool
            )
        <*> (parseVolatility <$> column HD.char)
        <*> column HD.bool
        <*> nullableColumn (toIsolationLevel <$> HD.text)
        <*> compositeArrayColumn ((,) <$> compositeField HD.text <*> compositeField HD.text) -- function setting
    addKey :: Routine -> (QualifiedIdentifier, Routine)
    addKey pd = (QualifiedIdentifier (pdSchema pd) (pdName pd), pd)

    parseRetType :: Text -> Text -> Bool -> Bool -> Bool -> RetType
    parseRetType schema name isSetOf isComposite isCompositeAlias
      | isSetOf = SetOf pgType
      | otherwise = Single pgType
      where
        qi = QualifiedIdentifier schema name
        pgType
          | isComposite = Composite qi isCompositeAlias
          | otherwise = Scalar qi

    parseVolatility :: Char -> FuncVolatility
    parseVolatility v
      | v == 'i' = Immutable
      | v == 's' = Stable
      | otherwise = Volatile -- only 'v' can happen here

decodeRepresentations :: HD.Result RepresentationsMap
decodeRepresentations =
  HM.fromList . map (\rep@DataRepresentation{drSourceType, drTargetType} -> ((drSourceType, drTargetType), rep)) <$> HD.rowList row
  where
    row =
      DataRepresentation
        <$> column HD.text
        <*> column HD.text
        <*> column HD.text

-- Selects all potential data representation transformations. To qualify the cast must be
-- 1. to or from a domain
-- 2. implicit
-- For the time being it must also be to/from JSON or text, although one can imagine a future where we support special
-- cases like CSV specific representations.
dataRepresentations :: SQL.Statement AppConfig RepresentationsMap
dataRepresentations = SQL.Statement sql mempty decodeRepresentations True
  where
    sql =
      encodeUtf8
        [trimming|
    SELECT
      c.castsource::regtype::text,
      c.casttarget::regtype::text,
      c.castfunc::regproc::text
    FROM
      pg_catalog.pg_cast c
    JOIN pg_catalog.pg_type src_t
      ON c.castsource::oid = src_t.oid
    JOIN pg_catalog.pg_type dst_t
      ON c.casttarget::oid = dst_t.oid
    WHERE
      c.castcontext = 'i'
      AND c.castmethod = 'f'
      AND has_function_privilege(c.castfunc, 'execute')
      AND ((src_t.typtype = 'd' AND c.casttarget IN ('json'::regtype::oid , 'text'::regtype::oid))
       OR (dst_t.typtype = 'd' AND c.castsource IN ('json'::regtype::oid , 'text'::regtype::oid)))
    |]

allFunctions :: PgVersion -> Bool -> SQL.Statement AppConfig RoutineMap
allFunctions pgVer = SQL.Statement (funcsSqlQuery pgVer) params decodeFuncs
  where
    params =
      (map escapeIdent . toList . configDbSchemas >$< arrayParam HE.text)
        <> (configDbHoistedTxSettings >$< arrayParam HE.text)

funcsSqlQuery :: PgVersion -> SqlQuery
funcsSqlQuery pgVer =
  let baseCte = baseTypesCte pgVer
  in  encodeUtf8
        [trimming|
  WITH
  $baseCte,
  arguments AS (
    SELECT
      oid,
      array_agg((
        COALESCE(name, ''), /* name */
        type::regtype::text, /* type */
        CASE type
          WHEN 'bit'::regtype THEN 'bit varying'
          WHEN 'bit[]'::regtype THEN 'bit varying[]'
          WHEN 'character'::regtype THEN 'character varying'
          WHEN 'character[]'::regtype THEN 'character varying[]'
          ELSE type::regtype::text
        END, /* convert types that ignore the length and accept any value till maximum size */
        idx <= (pronargs - pronargdefaults), /* is_required */
        COALESCE(mode = 'v', FALSE) /* is_variadic */
      ) ORDER BY idx) AS args,
      CASE COUNT(*) - COUNT(name) /* number of unnamed arguments */
        WHEN 0 THEN true
        WHEN 1 THEN (array_agg(type))[1] IN ('bytea'::regtype, 'json'::regtype, 'jsonb'::regtype, 'text'::regtype, 'xml'::regtype)
        ELSE false
      END AS callable
    FROM pg_proc,
         unnest(proargnames, proargtypes, proargmodes)
           WITH ORDINALITY AS _ (name, type, mode, idx)
    WHERE type IS NOT NULL /* only input arguments */
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
     /* if any TABLE, INOUT or OUT arguments present, treat as composite */
     or COALESCE(proargmodes::text[] && '{t,b,o}', false)
    ) AS rettype_is_composite,
    bt.oid <> bt.base_type as rettype_is_composite_alias,
    p.provolatile,
    p.provariadic > 0 as hasvariadic,
    (regexp_split_to_array((regexp_split_to_array(iso_config, '='))[2], ','))[1] AS transaction_isolation_level,
    coalesce(func_settings.kvs, '{}') as kvs
  FROM pg_proc p
  LEFT JOIN arguments a ON a.oid = p.oid
  JOIN pg_namespace pn ON pn.oid = p.pronamespace
  JOIN base_types bt ON bt.oid = p.prorettype
  JOIN pg_type t ON t.oid = bt.base_type
  JOIN pg_namespace tn ON tn.oid = t.typnamespace
  LEFT JOIN pg_class comp ON comp.oid = t.typrelid
  LEFT JOIN pg_description as d ON d.objoid = p.oid AND d.classoid = 'pg_proc'::regclass
  LEFT JOIN LATERAL unnest(proconfig) iso_config ON iso_config LIKE 'default_transaction_isolation%'
  LEFT JOIN LATERAL (
    SELECT
      array_agg(row(
        substr(setting, 1, strpos(setting, '=') - 1),
        substr(setting, strpos(setting, '=') + 1)
      )) as kvs
    FROM unnest(proconfig) setting
    WHERE setting ~ ANY($$2)
  ) func_settings ON TRUE
  WHERE t.oid <> 'trigger'::regtype AND COALESCE(a.callable, true)
  AND prokind = 'f'
  AND p.pronamespace = ANY($$1::regnamespace[]) |]

{-
Adds M2O and O2O relationships for views to tables, tables to views, and views to views. The example below is taken from the test fixtures, but the views names/colnames were modified.

--allM2OandO2ORels sample query result--
private      | personnages          | private    | actors           | personnages_role_id_fkey   | {"(role_id,id)"}

--allViewsKeyDependencies sample query result--
private      | personnages          | test       | personnages_view | personnages_role_id_fkey   | f       | {"(role_id,roleId)"}
private      | actors               | test       | actors_view      | personnages_role_id_fkey   | f_ref   | {"(id,actorId)"}

--this function result--
test         | personnages_view     | private    | actors           | personnages_role_id_fkey   | f        | {"(roleId,id)"}       | viewTableM2O
private      | personnages          | test       | actors_view      | personnages_role_id_fkey   | f_ref    | {"(role_id,actorId)"} | tableViewM2O
test         | personnages_view     | test       | actors_view      | personnages_role_id_fkey   | f,r_ref  | {"(roleId,actorId)"}  | viewViewM2O
-}
addViewM2OAndO2ORels :: [ViewKeyDependency] -> [Relationship] -> [Relationship]
addViewM2OAndO2ORels keyDeps rels =
  rels ++ concatMap viewRels rels
  where
    isM2O card = case card of M2O _ _ -> True; _ -> False
    isO2O card = case card of O2O _ _ False -> True; _ -> False
    viewRels Relationship{relTable, relForeignTable, relCardinality = card}
      | isM2O card || isO2O card =
          let
            cons = relCons card
            relCols = relColumns card
            buildCard cns cls = if isM2O card then M2O cns cls else O2O cns cls False
            viewTableRels = fold $ HM.lookup (relTable, (cons, FKDep)) indexedKeyDeps
            tableViewRels = fold $ HM.lookup (relForeignTable, (cons, FKDepRef)) indexedKeyDeps
          in
            [ Relationship
                (keyDepView vwTbl)
                relForeignTable
                False
                (buildCard cons $ zipWith (\(_, vCol) (_, fCol) -> (vCol, fCol)) keyDepColsVwTbl relCols)
                True
                False
            | vwTbl <- viewTableRels
            , keyDepColsVwTbl <- expandKeyDepCols $ keyDepCols vwTbl
            ]
              ++ [ Relationship
                     relTable
                     (keyDepView tblVw)
                     False
                     (buildCard cons $ zipWith (\(tCol, _) (_, vCol) -> (tCol, vCol)) relCols keyDepColsTblVw)
                     False
                     True
                 | tblVw <- tableViewRels
                 , keyDepColsTblVw <- expandKeyDepCols $ keyDepCols tblVw
                 ]
              ++ [ let
                     vw1 = keyDepView vwTbl
                     vw2 = keyDepView tblVw
                   in
                     Relationship
                       vw1
                       vw2
                       (vw1 == vw2)
                       (buildCard cons $ zipWith (\(_, vcol1) (_, vcol2) -> (vcol1, vcol2)) keyDepColsVwTbl keyDepColsTblVw)
                       True
                       True
                 | vwTbl <- viewTableRels
                 , keyDepColsVwTbl <- expandKeyDepCols $ keyDepCols vwTbl
                 , tblVw <- tableViewRels
                 , keyDepColsTblVw <- expandKeyDepCols $ keyDepCols tblVw
                 ]
    viewRels _ = []
    expandKeyDepCols kdc = zip (fst <$> kdc) <$> traverse snd kdc
    indexedKeyDeps = HM.fromListWith (<>) $ fmap ((keyDepTable &&& keyDepCons &&& keyDepType) &&& pure) keyDeps

addInverseRels :: [Relationship] -> [Relationship]
addInverseRels rels =
  rels
    ++ [Relationship ft t isSelf (O2M cons (swap <$> cols)) fTableIsView tableIsView | Relationship t ft isSelf (M2O cons cols) tableIsView fTableIsView <- rels]
    ++ [Relationship ft t isSelf (O2O cons (swap <$> cols) (not isParent)) fTableIsView tableIsView | Relationship t ft isSelf (O2O cons cols isParent) tableIsView fTableIsView <- rels]

-- | Adds a m2m relationship if a table has FKs to two other tables and the FK columns are part of the PK columns
addM2MRels :: TablesMap -> [Relationship] -> [Relationship]
addM2MRels tbls rels =
  rels
    ++ catMaybes
      [ let
          jtCols = S.fromList $ (fst <$> cols) ++ (fst <$> fcols)
          pkCols = S.fromList $ maybe mempty tablePKCols $ HM.lookup jt1 tbls
        in
          if S.isSubsetOf jtCols pkCols then
            Just $ Relationship t ft (t == ft) (M2M $ Junction jt1 cons1 cons2 (swap <$> cols) (swap <$> fcols)) tblIsView fTblisView
          else
            Nothing
      | Relationship jt1 t _ (M2O cons1 cols) _ tblIsView <- rels
      , Relationship _ ft _ (M2O cons2 fcols) _ fTblisView <- fold $ HM.lookup jt1 indexedRels
      , cons1 /= cons2
      ]
  where
    indexedRels = HM.fromListWith (<>) $ fmap (relTable &&& pure) rels

addViewPrimaryKeys :: TablesMap -> [ViewKeyDependency] -> TablesMap
addViewPrimaryKeys tabs keyDeps =
  ( \tbl@Table{tableSchema, tableName, tableIsView} ->
      if tableIsView then
        tbl{tablePKCols = findViewPKCols tableSchema tableName}
      else
        tbl
  )
    <$> tabs
  where
    findViewPKCols sch vw =
      concatMap (\(ViewKeyDependency _ _ _ _ pkCols) -> takeFirstPK pkCols) $
        fold $
          HM.lookup (PKDep, QualifiedIdentifier sch vw) indexedDeps
    -- In the case of multiple reference to the same PK (see comment for ViewKeyDependency) we take the first reference available.
    -- We assume this to be safe to do, because:
    -- \* We don't have any logic that requires the client to name a PK column (compared to the column hints in embedding for FKs),
    --   so we don't need to know about the other references.
    -- \* We need to choose a single reference for each column, otherwise we'd output too many columns in location headers etc.
    takeFirstPK = mapMaybe (head . snd)
    indexedDeps = HM.fromListWith (++) $ fmap ((keyDepType &&& keyDepView) &&& pure) keyDeps

allTables :: PgVersion -> Bool -> SQL.Statement AppConfig TablesMap
allTables pgVer = SQL.Statement (tablesSqlQuery pgVer) params decodeTables
  where
    params = map escapeIdent . toList . configDbSchemas >$< arrayParam HE.text

-- | Gets tables with their PK cols
tablesSqlQuery :: PgVersion -> SqlQuery
tablesSqlQuery pgVer =
  -- the tbl_constraints/key_col_usage CTEs are based on the standard "information_schema.table_constraints"/"information_schema.key_column_usage" views,
  -- we cannot use those directly as they include the following privilege filter:
  -- (pg_has_role(ss.relowner, 'USAGE'::text) OR has_column_privilege(ss.roid, a.attnum, 'SELECT, INSERT, UPDATE, REFERENCES'::text));
  -- on the "columns" CTE, left joining on pg_depend and pg_class is used to obtain the sequence name as a column default in case there are GENERATED .. AS IDENTITY,
  -- generated columns are only available from pg >= 10 but the query is agnostic to versions. dep.deptype = 'i' is done because there are other 'a' dependencies on PKs
  let baseCte = baseTypesCte pgVer
  in  encodeUtf8
        [trimming|
  WITH
  $baseCte,
  columns AS (
      SELECT
          c.oid AS relid,
          a.attname::name AS column_name,
          d.description AS description,
          /* typbasetype and typdefaultbin handles `CREATE DOMAIN .. DEFAULT val`,  attidentity/attgenerated handles generated columns, pg_get_expr gets the default of a column */
          CASE
            WHEN (t.typbasetype != 0) AND (ad.adbin IS NULL) THEN pg_get_expr(t.typdefaultbin, 0)
            WHEN a.attidentity  = 'd' THEN format('nextval(%L)', seq.objid::regclass)
            WHEN a.attgenerated = 's' THEN null
            ELSE pg_get_expr(ad.adbin, ad.adrelid)::text
          END AS column_default,
          not (a.attnotnull OR t.typtype = 'd' AND t.typnotnull) AS is_nullable,
          CASE
              WHEN t.typtype = 'd' THEN
              CASE
                  WHEN bt.base_namespace = 'pg_catalog'::regnamespace THEN format_type(bt.base_type, NULL::integer)
                  ELSE format_type(a.atttypid, a.atttypmod)
              END
              ELSE
              CASE
                  WHEN t.typnamespace = 'pg_catalog'::regnamespace THEN format_type(a.atttypid, NULL::integer)
                  ELSE format_type(a.atttypid, a.atttypmod)
              END
          END::text AS data_type,
          format_type(a.atttypid, a.atttypmod)::text AS nominal_data_type,
          information_schema._pg_char_max_length(
              information_schema._pg_truetypid(a.*, t.*),
              information_schema._pg_truetypmod(a.*, t.*)
          )::integer AS character_maximum_length,
          bt.base_type,
          a.attnum::integer AS position
      FROM pg_attribute a
          LEFT JOIN pg_description AS d
              ON d.objoid = a.attrelid and d.objsubid = a.attnum and d.classoid = 'pg_class'::regclass
          LEFT JOIN pg_attrdef ad
              ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
          JOIN pg_class c
              ON a.attrelid = c.oid
          JOIN pg_type t
              ON a.atttypid = t.oid
          LEFT JOIN base_types bt
              ON t.oid = bt.oid
          LEFT JOIN pg_depend seq
              ON seq.refobjid = a.attrelid and seq.refobjsubid = a.attnum and seq.deptype = 'i'
      WHERE
          NOT pg_is_other_temp_schema(c.relnamespace)
          AND a.attnum > 0
          AND NOT a.attisdropped
          AND c.relkind in ('r', 'v', 'f', 'm', 'p')
          AND c.relnamespace = ANY($$1::regnamespace[])
  ),
  columns_agg AS (
    SELECT
      relid,
      array_agg(row(
        column_name,
        description,
        is_nullable::boolean,
        data_type,
        nominal_data_type,
        character_maximum_length,
        column_default,
        coalesce(
          (SELECT array_agg(enumlabel ORDER BY enumsortorder) FROM pg_enum WHERE enumtypid = base_type),
          '{}'
        )
      ) order by position) as columns
    FROM columns
    GROUP BY relid
  ),
  tbl_pk_cols AS (
    SELECT
      r.oid AS relid,
      array_agg(a.attname ORDER BY a.attname) AS pk_cols
    FROM pg_class r
    JOIN pg_constraint c
      ON r.oid = c.conrelid
    JOIN pg_attribute a
      ON a.attrelid = r.oid AND a.attnum = ANY (c.conkey)
    WHERE
      c.contype in ('p')
      AND r.relkind IN ('r', 'p')
      AND r.relnamespace NOT IN ('pg_catalog'::regnamespace, 'information_schema'::regnamespace)
      AND NOT pg_is_other_temp_schema(r.relnamespace)
      AND NOT a.attisdropped
    GROUP BY r.oid
  )
  SELECT
    n.nspname AS table_schema,
    c.relname AS table_name,
    d.description AS table_description,
    c.relkind IN ('v','m') as is_view,
    (
      c.relkind IN ('r','p')
      OR (
        c.relkind in ('v','f')
        /* The function `pg_relation_is_updateable` returns a bitmask where 8
           corresponds to `1 << CMD_INSERT` in the PostgreSQL source code, i.e.
           it's possible to insert into the relation. */
        AND (pg_relation_is_updatable(c.oid::regclass, TRUE) & 8) = 8
      )
    ) AS insertable,
    (
      c.relkind IN ('r','p')
      OR (
        c.relkind in ('v','f')
        /* CMD_UPDATE */
        AND (pg_relation_is_updatable(c.oid::regclass, TRUE) & 4) = 4
      )
    ) AS updatable,
    (
      c.relkind IN ('r','p')
      OR (
        c.relkind in ('v','f')
        /* CMD_DELETE */
        AND (pg_relation_is_updatable(c.oid::regclass, TRUE) & 16) = 16
      )
    ) AS deletable,
    coalesce(tpks.pk_cols, '{}') as pk_cols,
    coalesce(cols_agg.columns, '{}') as columns
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_description d on d.objoid = c.oid and d.objsubid = 0 and d.classoid = 'pg_class'::regclass
  LEFT JOIN tbl_pk_cols tpks ON c.oid = tpks.relid
  LEFT JOIN columns_agg cols_agg ON c.oid = cols_agg.relid
  WHERE c.relkind IN ('v','r','m','f','p')
  AND c.relnamespace NOT IN ('pg_catalog'::regnamespace, 'information_schema'::regnamespace)
  AND not c.relispartition
  ORDER BY table_schema, table_name|]

-- | Gets many-to-one relationships and one-to-one(O2O) relationships, which are a refinement of the many-to-one's
allM2OandO2ORels :: SQL.Statement () [Relationship]
allM2OandO2ORels =
  SQL.Statement sql HE.noParams decodeRels True
  where
    -- We use jsonb_agg for comparing the uniques/pks instead of array_agg to avoid the ERROR:  cannot accumulate arrays of different dimensionality
    sql =
      encodeUtf8
        [trimming|
    WITH
    pks_uniques_cols AS (
      SELECT
        conrelid,
        array_agg(key order by key) as cols
      FROM pg_constraint,
      LATERAL unnest(conkey) AS _(key)
      WHERE
        contype IN ('p', 'u')
        AND connamespace <> 'pg_catalog'::regnamespace
      GROUP BY oid, conrelid
    )
    SELECT
      ns1.nspname AS table_schema,
      tab.relname AS table_name,
      ns2.nspname AS foreign_table_schema,
      other.relname AS foreign_table_name,
      traint.conrelid = traint.confrelid AS is_self,
      traint.conname  AS constraint_name,
      column_info.cols_and_fcols,
      (column_info.cols IN (SELECT cols FROM pks_uniques_cols WHERE conrelid = traint.conrelid)) AS one_to_one
    FROM pg_constraint traint
    JOIN LATERAL (
      SELECT
        array_agg(row(cols.attname, refs.attname) order by ord) AS cols_and_fcols,
        array_agg(cols.attnum order by cols.attnum) AS cols
      FROM unnest(traint.conkey, traint.confkey) WITH ORDINALITY AS _(col, ref, ord)
      JOIN pg_attribute cols ON cols.attrelid = traint.conrelid AND cols.attnum = col
      JOIN pg_attribute refs ON refs.attrelid = traint.confrelid AND refs.attnum = ref
    ) AS column_info ON TRUE
    JOIN pg_namespace ns1 ON ns1.oid = traint.connamespace
    JOIN pg_class tab ON tab.oid = traint.conrelid
    JOIN pg_class other ON other.oid = traint.confrelid
    JOIN pg_namespace ns2 ON ns2.oid = other.relnamespace
    WHERE traint.contype = 'f'
    AND traint.conparentid = 0
    ORDER BY traint.conrelid, traint.conname|]

allComputedRels :: SQL.Statement () [Relationship]
allComputedRels =
  SQL.Statement sql HE.noParams (HD.rowList cRelRow) True
  where
    sql =
      encodeUtf8
        [trimming|
    with
    all_relations as (
      select reltype
      from pg_class
      where relkind in ('v','r','m','f','p')
    ),
    computed_rels as (
      select
        (parse_ident(p.pronamespace::regnamespace::text))[1] as schema,
        p.proname::text                  as name,
        arg_schema.nspname::text         as rel_table_schema,
        arg_name.typname::text           as rel_table_name,
        ret_schema.nspname::text         as rel_ftable_schema,
        ret_name.typname::text           as rel_ftable_name,
        not p.proretset or p.prorows = 1 as single_row
      from pg_proc p
        join pg_type      arg_name   on arg_name.oid = p.proargtypes[0]
        join pg_namespace arg_schema on arg_schema.oid = arg_name.typnamespace
        join pg_type      ret_name   on ret_name.oid = p.prorettype
        join pg_namespace ret_schema on ret_schema.oid = ret_name.typnamespace
      where
        p.pronargs = 1
        and p.proargtypes[0] in (select reltype from all_relations)
        and p.prorettype in (select reltype from all_relations)
    )
    select
      *,
      row(rel_table_schema, rel_table_name) = row(rel_ftable_schema, rel_ftable_name) as is_self
    from computed_rels;
  |]

    cRelRow =
      ComputedRelationship
        <$> (QualifiedIdentifier <$> column HD.text <*> column HD.text)
        <*> (QualifiedIdentifier <$> column HD.text <*> column HD.text)
        <*> (QualifiedIdentifier <$> column HD.text <*> column HD.text)
        <*> pure (QualifiedIdentifier mempty mempty)
        <*> column HD.bool
        <*> column HD.bool

-- | Returns all the views' primary keys and foreign keys dependencies
allViewsKeyDependencies :: SQL.Statement AppConfig [ViewKeyDependency]
allViewsKeyDependencies =
  SQL.Statement sql params decodeViewKeyDeps True
  where
    -- query explanation at:
    --  * rationale: https://gist.github.com/wolfgangwalther/5425d64e7b0d20aad71f6f68474d9f19
    --  * json transformation: https://gist.github.com/wolfgangwalther/3a8939da680c24ad767e93ad2c183089

    params =
      (map escapeIdent . toList . configDbSchemas >$< arrayParam HE.text)
        <> (map escapeIdent . toList . configDbExtraSearchPath >$< arrayParam HE.text)
    sql =
      encodeUtf8
        [trimming|
      with recursive
      pks_fks as (
        /* pk + fk referencing col */
        select
          contype::text as contype,
          conname,
          array_length(conkey, 1) as ncol,
          conrelid as resorigtbl,
          col as resorigcol,
          ord
        from pg_constraint
        left join lateral unnest(conkey) with ordinality as _(col, ord) on true
        where contype IN ('p', 'f')
        union
        /* fk referenced col */
        select
          concat(contype, '_ref') as contype,
          conname,
          array_length(confkey, 1) as ncol,
          confrelid,
          col,
          ord
        from pg_constraint
        left join lateral unnest(confkey) with ordinality as _(col, ord) on true
        where contype='f'
      ),
      views as (
        select
          c.oid          as view_id,
          c.relnamespace as view_schema_id,
          n.nspname      as view_schema,
          c.relname      as view_name,
          r.ev_action    as view_definition
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        join pg_rewrite r on r.ev_class = c.oid
        where c.relkind in ('v', 'm') and c.relnamespace = ANY($$1::regnamespace[] || $$2::regnamespace[])
      ),
      transform_json as (
        select
          view_id, view_schema_id, view_schema, view_name,
          /* the following formatting is without indentation on purpose
             to allow simple diffs, with less whitespace noise */
          replace(
            replace(
            replace(
            replace(
            replace(
            replace(
            replace(
            regexp_replace(
            replace(
            replace(
            replace(
            replace(
            replace(
            replace(
            replace(
            replace(
            replace(
            replace(
            replace(
              view_definition::text,
            /* This conversion to json is heavily optimized for performance.
               The general idea is to use as few regexp_replace() calls as possible.
               Simple replace() is a lot faster, so we jump through some hoops
               to be able to use regexp_replace() only once.
               This has been tested against a huge schema with 250+ different views.
               The unit tests do NOT reflect all possible inputs. Be careful when changing this!
               -----------------------------------------------
               pattern           | replacement         | flags
               -----------------------------------------------
               `<>` in pg_node_tree is the same as `null` in JSON, but due to very poor performance of json_typeof
               we need to make this an empty array here to prevent json_array_elements from throwing an error
               when the targetList is null.
               We'll need to put it first, to make the node protection below work for node lists that start with
               null: `(<> ...`, too. This is the case for coldefexprs, when the first column does not have a default value. */
               '<>'              , '()'
            /* `,` is not part of the pg_node_tree format, but used in the regex.
               This removes all `,` that might be part of column names. */
            ), ','               , ''
            /* The same applies for `{` and `}`, although those are used a lot in pg_node_tree.
               We remove the escaped ones, which might be part of column names again. */
            ), E'\\{'            , ''
            ), E'\\}'            , ''
            /* The fields we need are formatted as json manually to protect them from the regex. */
            ), ' :targetList '   , ',"targetList":'
            ), ' :resno '        , ',"resno":'
            ), ' :resorigtbl '   , ',"resorigtbl":'
            ), ' :resorigcol '   , ',"resorigcol":'
            /* Make the regex also match the node type, e.g. `{QUERY ...`, to remove it in one pass. */
            ), '{'               , '{ :'
            /* Protect node lists, which start with `({` or `((` from the greedy regex.
               The extra `{` is removed again later. */
            ), '(('              , '{(('
            ), '({'              , '{({'
            /* This regex removes all unused fields to avoid the need to format all of them correctly.
               This leads to a smaller json result as well.
               Removal stops at `,` for used fields (see above) and `}` for the end of the current node.
               Nesting can't be parsed correctly with a regex, so we stop at `{` as well and
               add an empty key for the following node. */
            ), ' :[^}{,]+'       , ',"":'              , 'g'
            /* For performance, the regex also added those empty keys when hitting a `,` or `}`.
               Those are removed next. */
            ), ',"":}'           , '}'
            ), ',"":,'           , ','
            /* This reverses the "node list protection" from above. */
            ), '{('              , '('
            /* Every key above has been added with a `,` so far. The first key in an object doesn't need it. */
            ), '{,'              , '{'
            /* pg_node_tree has `()` around lists, but JSON uses `[]` */
            ), '('               , '['
            ), ')'               , ']'
            /* pg_node_tree has ` ` between list items, but JSON uses `,` */
            ), ' '             , ','
          )::json as view_definition
        from views
      ),
      target_entries as(
        select
          view_id, view_schema_id, view_schema, view_name,
          json_array_elements(view_definition->0->'targetList') as entry
        from transform_json
      ),
      results as(
        select
          view_id, view_schema_id, view_schema, view_name,
          (entry->>'resno')::int as view_column,
          (entry->>'resorigtbl')::oid as resorigtbl,
          (entry->>'resorigcol')::int as resorigcol
        from target_entries
      ),
      /* CYCLE detection according to PG docs: https://www.postgresql.org/docs/current/queries-with.html#QUERIES-WITH-CYCLE
         Can be replaced with CYCLE clause once PG v13 is EOL. */
      recursion(view_id, view_schema_id, view_schema, view_name, view_column, resorigtbl, resorigcol, is_cycle, path) as(
        select
          r.*,
          false,
          ARRAY[resorigtbl]
        from results r
        where view_schema_id = ANY ($$1::regnamespace[])
        union all
        select
          view.view_id,
          view.view_schema_id,
          view.view_schema,
          view.view_name,
          view.view_column,
          tab.resorigtbl,
          tab.resorigcol,
          tab.resorigtbl = ANY(path),
          path || tab.resorigtbl
        from recursion view
        join results tab on view.resorigtbl=tab.view_id and view.resorigcol=tab.view_column
        where not is_cycle
      ),
      repeated_references as(
        select
          view_id,
          view_schema,
          view_name,
          resorigtbl,
          resorigcol,
          array_agg(attname) as view_columns
        from recursion
        join pg_attribute vcol on vcol.attrelid = view_id and vcol.attnum = view_column
        group by
          view_id,
          view_schema,
          view_name,
          resorigtbl,
          resorigcol
      )
      select
        sch.nspname as table_schema,
        tbl.relname as table_name,
        rep.view_schema,
        rep.view_name,
        pks_fks.conname as constraint_name,
        pks_fks.contype as constraint_type,
        array_agg(row(col.attname, view_columns) order by pks_fks.ord) as column_dependencies
      from repeated_references rep
      join pks_fks using (resorigtbl, resorigcol)
      join pg_class tbl on tbl.oid = rep.resorigtbl
      join pg_attribute col on col.attrelid = tbl.oid and col.attnum = rep.resorigcol
      join pg_namespace sch on sch.oid = tbl.relnamespace
      group by sch.nspname, tbl.relname, rep.view_schema, rep.view_name, pks_fks.conname, pks_fks.contype, pks_fks.ncol
      /* make sure we only return key for which all columns are referenced in the view - no partial PKs or FKs */
      having ncol = array_length(array_agg(row(col.attname, view_columns) order by pks_fks.ord), 1)
      |]

initialMediaHandlers :: MediaHandlerMap
initialMediaHandlers =
  HM.insert (RelAnyElement, MediaType.MTAny) (BuiltinOvAggJson, MediaType.MTApplicationJSON) $
    HM.insert (RelAnyElement, MediaType.MTApplicationJSON) (BuiltinOvAggJson, MediaType.MTApplicationJSON) $
      HM.insert (RelAnyElement, MediaType.MTTextCSV) (BuiltinOvAggCsv, MediaType.MTTextCSV) $
        HM.insert
          (RelAnyElement, MediaType.MTGeoJSON)
          (BuiltinOvAggGeoJson, MediaType.MTGeoJSON)
          HM.empty

mediaHandlers :: SQL.Statement AppConfig MediaHandlerMap
mediaHandlers =
  SQL.Statement sql params decodeMediaHandlers True
  where
    params = map escapeIdent . toList . configDbSchemas >$< arrayParam HE.text
    sql =
      encodeUtf8
        [trimming|
      with
      all_relations as (
        select reltype
        from pg_class
        where relkind in ('v','r','m','f','p')
        union
        select oid
        from pg_type
        where typname = 'anyelement'
      ),
      media_types as (
          SELECT
            t.oid,
            lower(t.typname) as typname,
            t.typnamespace,
            case t.typname
              when '*/*' then 'application/octet-stream'
              else t.typname
            end as resolved_media_type
          FROM pg_type t
          JOIN pg_type b ON t.typbasetype = b.oid
          WHERE
            t.typbasetype <> 0 and
            (t.typname ~* '^[A-Za-z0-9.-]+/[A-Za-z0-9.\+-]+$$' or t.typname = '*/*')
      )
      select
        proc_schema.nspname           as handler_schema,
        proc.proname                  as handler_name,
        arg_schema.nspname::text      as target_schema,
        arg_name.typname::text        as target_name,
        media_types.typname           as media_type,
        media_types.resolved_media_type
      from media_types
        join pg_proc      proc         on proc.prorettype = media_types.oid
        join pg_namespace proc_schema  on proc_schema.oid = proc.pronamespace
        join pg_aggregate agg          on agg.aggfnoid = proc.oid
        join pg_type      arg_name     on arg_name.oid = proc.proargtypes[0]
        join pg_namespace arg_schema   on arg_schema.oid = arg_name.typnamespace
      where
        proc.pronamespace = ANY($$1::regnamespace[]) and
        proc.pronargs = 1 and
        arg_name.oid in (select reltype from all_relations)
      union
      select
          typ_sch.nspname as handler_schema,
          mtype.typname   as handler_name,
          pro_sch.nspname as target_schema,
          proname         as target_name,
          mtype.typname   as media_type,
          mtype.resolved_media_type
      from pg_proc proc
        join pg_namespace pro_sch on pro_sch.oid = proc.pronamespace
        join media_types mtype on proc.prorettype = mtype.oid
        join pg_namespace typ_sch     on typ_sch.oid = mtype.typnamespace
      where
        proc.pronamespace = ANY($$1::regnamespace[]) and NOT proretset
        and prokind = 'f'|]

decodeMediaHandlers :: HD.Result MediaHandlerMap
decodeMediaHandlers =
  HM.fromList
    . fmap
      ( \(x, y, z, w) ->
          let rel = if isAnyElement y then RelAnyElement else RelId y
          in  ((rel, z), (CustomFunc x rel, w))
      )
    <$> HD.rowList caggRow
  where
    caggRow =
      (,,,)
        <$> (QualifiedIdentifier <$> column HD.text <*> column HD.text)
        <*> (QualifiedIdentifier <$> column HD.text <*> column HD.text)
        <*> (MediaType.decodeMediaType . encodeUtf8 <$> column HD.text)
        <*> (MediaType.decodeMediaType . encodeUtf8 <$> column HD.text)

param :: HE.Value a -> HE.Params a
param = HE.param . HE.nonNullable

arrayParam :: HE.Value a -> HE.Params [a]
arrayParam = param . HE.foldableArray . HE.nonNullable

compositeArrayColumn :: HD.Composite a -> HD.Row [a]
compositeArrayColumn = arrayColumn . HD.composite

compositeField :: HD.Value a -> HD.Composite a
compositeField = HD.field . HD.nonNullable

nullableCompositeField :: HD.Value a -> HD.Composite (Maybe a)
nullableCompositeField = HD.field . HD.nullable

compositeFieldArray :: HD.Value a -> HD.Composite [a]
compositeFieldArray = HD.field . HD.nonNullable . HD.listArray . HD.nonNullable

column :: HD.Value a -> HD.Row a
column = HD.column . HD.nonNullable

nullableColumn :: HD.Value a -> HD.Row (Maybe a)
nullableColumn = HD.column . HD.nullable

arrayColumn :: HD.Value a -> HD.Row [a]
arrayColumn = column . HD.listArray . HD.nonNullable

{-
 - Times a sql statement inside a transaction, for this:
 -
 - 1. We start a timer: select set_config('pgrst.tmp_x', clock_timestamp()::text, false);
 - 2. Run the statement: select ....
 - 3. End the timer:  select set_config('pgrst.tmp_x', (clock_timestamp() - current_setting('pgrst.tmp_x', false)::timestamptz)::text, false);
 -
 - We can do this for several statements inside the transaction. The timings are later captured at the end of the transaction with extractTimings.
 -}
sqlTimedStatement :: Bool -> ByteString -> a -> SQL.Statement a b -> SQL.Transaction b
sqlTimedStatement isLogDebug guc params stmt =
  if isLogDebug then
    SQL.sql sFrag >> SQL.statement params stmt <* SQL.sql eFrag
  else
    SQL.statement params stmt
  where
    sFrag = "select set_config('pgrst." <> guc <> "', clock_timestamp()::text, true)"
    eFrag = "select set_config('pgrst." <> guc <> "', (clock_timestamp() - current_setting('pgrst." <> guc <> "', false)::timestamptz)::text, true)"

-- Extract all the generated timings (see sqlTimedStatement) converting the value to milliseconds.
extractTimings :: SQL.Statement () QueryTimings
extractTimings = SQL.Statement sql HE.noParams decodeThem True
  where
    qFrag setting = "extract('milliseconds' from current_setting('pgrst." <> setting <> "', false)::interval)::text"
    sql =
      "SELECT "
        <> BS.intercalate
          ","
          [ qFrag gucTbls
          , qFrag gucKDeps
          , qFrag gucRels
          , qFrag gucFuncs
          , qFrag gucCRels
          , qFrag gucDReps
          , qFrag gucMHdrs
          ]
    decodeThem :: HD.Result QueryTimings
    decodeThem =
      HD.singleRow $
        QueryTimings
          <$> column HD.text
          <*> column HD.text
          <*> column HD.text
          <*> column HD.text
          <*> column HD.text
          <*> column HD.text
          <*> column HD.text

data QueryTimings = QueryTimings
  { qtTables :: Text
  , qtKeyDeps :: Text
  , qtRels :: Text
  , qtFuncs :: Text
  , qtCRels :: Text
  , qtDReps :: Text
  , qtMHdrs :: Text
  }
  deriving (Show)

queryTimingsWLabels :: QueryTimings -> [(ByteString, Text)]
queryTimingsWLabels qt =
  [ (gucTbls, qtTables qt)
  , (gucKDeps, qtKeyDeps qt)
  , (gucRels, qtRels qt)
  , (gucFuncs, qtFuncs qt)
  , (gucCRels, qtCRels qt)
  , (gucDReps, qtDReps qt)
  , (gucMHdrs, qtMHdrs qt)
  ]

gucTbls, gucKDeps, gucRels, gucFuncs, gucCRels, gucDReps, gucMHdrs :: ByteString
gucTbls = "tables"
gucKDeps = "keydeps"
gucRels = "rels"
gucFuncs = "funcs"
gucCRels = "comprels"
gucDReps = "dreps"
gucMHdrs = "mhandlers"
