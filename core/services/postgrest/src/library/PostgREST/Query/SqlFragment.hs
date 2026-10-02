{-# LANGUAGE LambdaCase #-}
{-# LANGUAGE NamedFieldPuns #-}
{-# LANGUAGE QuasiQuotes #-}

-- |
-- Module      : PostgREST.Query.SqlFragment
-- Description : Helper functions for PostgREST.QueryBuilder.
module PostgREST.Query.SqlFragment
  ( addConfigPgrstInserted
  , countF
  , currentSettingF
  , escapeIdent
  , escapeIdentList
  , explainF
  , fromJsonBodyF
  , fromQi
  , groupF
  , handlerF
  , intercalateSnippet
  , limitOffsetF
  , locationF
  , noLocationF
  , orderF
  , pageCountSelectF
  , pgFmtColumn
  , pgFmtFilter
  , pgFmtIdent
  , pgFmtJoinCondition
  , pgFmtLogicTree
  , pgFmtOrderTerm
  , pgFmtSelectItem
  , pgFmtSpreadJoinSelectItem
  , pgFmtSpreadSelectItem
  , responseHeadersF
  , responseStatusF
  , returningF
  , schemaDescription
  , setConfigWithConstantName
  , setConfigWithConstantNameJSON
  , setConfigWithDynamicName
  , singleParameter
  , sourceCTE
  , sourceCTEName
  , unknownEncoder
  )
where

import Control.Arrow ((***))
import Data.Foldable (foldr1)
import NeatInterpolation (trimming)
import Protolude hiding (Sum, cast)

import Data.Aeson qualified as JSON
import Data.ByteString.Char8 qualified as BS
import Data.ByteString.Lazy qualified as LBS
import Data.HashMap.Strict qualified as HM
import Data.Text qualified as T
import Data.Text.Encoding qualified as T

import PostgREST.ApiRequest.Types
  ( AggregateFunction (..)
  , Alias
  , Cast
  , FtsOperator (..)
  , IsVal (..)
  , JsonOperand (..)
  , JsonOperation (..)
  , JsonPath
  , LogicOperator (..)
  , OpExpr (..)
  , OpQuantifier (..)
  , Operation (..)
  , OrderDirection (..)
  , OrderNulls (..)
  , QuantOperator (..)
  , SimpleOperator (..)
  )
import PostgREST.Catalog.Identifiers
  ( FieldName
  , QualifiedIdentifier (..)
  , RelIdentifier (..)
  , escapeIdent
  , trimNullChars
  )
import PostgREST.Catalog.Routine
  ( MediaHandler (..)
  , Routine (..)
  , funcReturnsScalar
  , funcReturnsSetOfScalar
  , funcReturnsSingle
  , funcReturnsSingleComposite
  )
import PostgREST.MediaType
  ( MTVndPlanFormat (..)
  , MTVndPlanOption (..)
  )
import PostgREST.Plan.ReadPlan (JoinCondition (..))
import PostgREST.Plan.Types
  ( CoercibleField (..)
  , CoercibleFilter (..)
  , CoercibleLogicTree (..)
  , CoercibleOrderTerm (..)
  , CoercibleSelectField (..)
  , RelSelectField (..)
  , SpreadSelectField (..)
  , ToTsVector (..)
  , unknownField
  )
import PostgREST.RangeQuery
  ( NonnegRange
  , allRange
  , rangeLimit
  , rangeOffset
  )

import Hasql.DynamicStatements.Snippet qualified as SQL
import Hasql.Encoders qualified as HE

sourceCTEName :: Text
sourceCTEName = "pgrst_source"

sourceCTE :: SQL.Snippet
sourceCTE = "pgrst_source"

noLocationF :: SQL.Snippet
noLocationF = "array[]::text[]"

simpleOperator :: SimpleOperator -> SQL.Snippet
simpleOperator = \case
  OpNotEqual -> "<>"
  OpContains -> "@>"
  OpContained -> "<@"
  OpOverlap -> "&&"
  OpStrictlyLeft -> "<<"
  OpStrictlyRight -> ">>"
  OpNotExtendsRight -> "&<"
  OpNotExtendsLeft -> "&>"
  OpAdjacent -> "-|-"

quantOperator :: QuantOperator -> SQL.Snippet
quantOperator = \case
  OpEqual -> "="
  OpGreaterThanEqual -> ">="
  OpGreaterThan -> ">"
  OpLessThanEqual -> "<="
  OpLessThan -> "<"
  OpLike -> "like"
  OpILike -> "ilike"
  OpMatch -> "~"
  OpIMatch -> "~*"

ftsOperator :: FtsOperator -> SQL.Snippet
ftsOperator = \case
  FilterFts -> "@@ to_tsquery"
  FilterFtsPlain -> "@@ plainto_tsquery"
  FilterFtsPhrase -> "@@ phraseto_tsquery"
  FilterFtsWebsearch -> "@@ websearch_to_tsquery"

singleParameter :: Maybe LBS.ByteString -> ByteString -> SQL.Snippet
singleParameter body typ =
  if typ == "bytea"
  -- TODO: Hasql fails when using HE.unknown with bytea(pg tries to utf8 encode).
  then
    SQL.encoderAndParam (HE.nullable HE.bytea) (LBS.toStrict <$> body)
  else
    SQL.encoderAndParam (HE.nullable HE.unknown) (LBS.toStrict <$> body) <> "::" <> SQL.sql typ

-- Here we build the pg array literal, e.g '{"Hebdon, John","Other","Another"}', manually.
-- This is necessary to pass an "unknown" array and let pg infer the type.
-- There are backslashes here, but since this value is parametrized and is not a string constant
-- https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-STRINGS
-- we don't need to use the E'string' form for C-style escapes
-- https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-STRINGS-ESCAPE
pgBuildArrayLiteral :: [Text] -> Text
pgBuildArrayLiteral vals =
  let
    trimmed = trimNullChars
    slashed = T.replace "\\" "\\\\" . trimmed
    escaped x = "\"" <> T.replace "\"" "\\\"" (slashed x) <> "\""
  in
    "{" <> T.intercalate "," (escaped <$> vals) <> "}"

-- TODO: refactor by following https://github.com/PostgREST/postgrest/pull/1631#issuecomment-711070833
pgFmtIdent :: Text -> SQL.Snippet
pgFmtIdent x = SQL.sql . encodeUtf8 $ escapeIdent x

-- Only use it if the input comes from the database itself, like on `jsonb_build_object('column_from_a_table', val)..`
pgFmtLit :: Text -> Text
pgFmtLit x =
  let
    trimmed = trimNullChars x
    escaped = "'" <> T.replace "'" "''" trimmed <> "'"
    slashed = T.replace "\\" "\\\\" escaped
  in
    if "\\" `T.isInfixOf` escaped then
      "E" <> slashed
    else
      slashed

-- |
-- Format a list of identifiers and separate them by commas.
--
-- >>> escapeIdentList ["schema_1", "schema_2", "SPECIAL \"@/\\#~_-"]
-- "\"schema_1\", \"schema_2\", \"SPECIAL \"\"@/\\#~_-\""
escapeIdentList :: [Text] -> ByteString
escapeIdentList schemas = BS.intercalate ", " $ encodeUtf8 . escapeIdent <$> schemas

asCsvF :: SQL.Snippet
asCsvF = asCsvHeaderF <> " || '\n' || " <> asCsvBodyF
  where
    asCsvHeaderF =
      "(SELECT coalesce(string_agg(a.k, ','), '')"
        <> "  FROM ("
        <> "    SELECT json_object_keys(r)::text as k"
        <> "    FROM ( "
        <> "      SELECT row_to_json(hh) as r from "
        <> sourceCTE
        <> " as hh limit 1"
        <> "    ) s"
        <> "  ) a"
        <> ")"
    asCsvBodyF = "coalesce(string_agg(substring(_postgrest_t::text, 2, length(_postgrest_t::text) - 2), '\n'), '')"

addNullsToSnip :: Bool -> SQL.Snippet -> SQL.Snippet
addNullsToSnip strip snip =
  if strip then "json_strip_nulls(" <> snip <> ")" else snip

asJsonSingleF :: Maybe Routine -> Bool -> SQL.Snippet
asJsonSingleF rout strip
  | returnsScalar = "coalesce(" <> addNullsToSnip strip "json_agg(_postgrest_t.pgrst_scalar)->0" <> ", 'null')"
  | otherwise = "coalesce(" <> addNullsToSnip strip "json_agg(_postgrest_t)->0" <> ", 'null')"
  where
    returnsScalar = maybe False funcReturnsScalar rout

asJsonF :: Maybe Routine -> Bool -> SQL.Snippet
asJsonF rout strip
  | returnsSingleComposite = "coalesce(" <> addNullsToSnip strip "json_agg(_postgrest_t)->0" <> ", 'null')"
  | returnsScalar = "coalesce(" <> addNullsToSnip strip "json_agg(_postgrest_t.pgrst_scalar)->0" <> ", 'null')"
  | returnsSetOfScalar = "coalesce(" <> addNullsToSnip strip "json_agg(_postgrest_t.pgrst_scalar)" <> ", '[]')"
  | otherwise = "coalesce(" <> addNullsToSnip strip "json_agg(_postgrest_t)" <> ", '[]')"
  where
    (returnsSingleComposite, returnsScalar, returnsSetOfScalar) = case rout of
      Just r -> (funcReturnsSingleComposite r, funcReturnsScalar r, funcReturnsSetOfScalar r)
      Nothing -> (False, False, False)

asGeoJsonF :: SQL.Snippet
asGeoJsonF = "json_build_object('type', 'FeatureCollection', 'features', coalesce(json_agg(ST_AsGeoJSON(_postgrest_t)::json), '[]'))"

customFuncF :: Maybe Routine -> QualifiedIdentifier -> RelIdentifier -> SQL.Snippet
customFuncF rout funcQi _
  | (funcReturnsScalar <$> rout) == Just True = fromQi funcQi <> "(_postgrest_t.pgrst_scalar)"
customFuncF _ funcQi RelAnyElement = fromQi funcQi <> "(_postgrest_t)"
customFuncF _ funcQi (RelId target) = fromQi funcQi <> "(_postgrest_t::" <> fromQi target <> ")"

locationF :: [Text] -> SQL.Snippet
locationF pKeys =
  SQL.sql $
    encodeUtf8
      [trimming|(
  WITH data AS (SELECT row_to_json(_) AS row FROM ${sourceCTEName} AS _ LIMIT 1)
  SELECT array_agg(json_data.key || '=' || coalesce('eq.' || json_data.value, 'is.null'))
  FROM data CROSS JOIN json_each_text(data.row) AS json_data
  WHERE json_data.key IN ('${fmtPKeys}')
)|]
  where
    fmtPKeys = T.intercalate "','" pKeys

fromQi :: QualifiedIdentifier -> SQL.Snippet
fromQi t = (if T.null s then mempty else pgFmtIdent s <> ".") <> pgFmtIdent n
  where
    n = qiName t
    s = qiSchema t

pgFmtColumn :: QualifiedIdentifier -> Text -> SQL.Snippet
pgFmtColumn table "*" = fromQi table <> ".*"
pgFmtColumn table c = fromQi table <> "." <> pgFmtIdent c

pgFmtCallUnary :: Text -> SQL.Snippet -> SQL.Snippet
pgFmtCallUnary f x = SQL.sql (encodeUtf8 f) <> "(" <> x <> ")"

pgFmtField :: QualifiedIdentifier -> CoercibleField -> SQL.Snippet
pgFmtField table cf = case cfToTsVector cf of
  Just (ToTsVector lang) -> "to_tsvector(" <> pgFmtFtsLang lang <> fmtFld <> ")"
  _ -> fmtFld
  where
    fmtFld = case cf of
      CoercibleField{cfFullRow = True} -> pgFmtIdent (qiName table)
      CoercibleField{cfName = fn, cfJsonPath = []} -> pgFmtColumn table fn
      CoercibleField{cfName = fn, cfToJson = doToJson, cfJsonPath = jp}
        | doToJson -> "to_jsonb(" <> pgFmtColumn table fn <> ")" <> pgFmtJsonPath jp
        | otherwise -> pgFmtColumn table fn <> pgFmtJsonPath jp

-- Select the value of a named element from a table, applying its optional coercion mapping if any.
pgFmtTableCoerce :: QualifiedIdentifier -> CoercibleField -> SQL.Snippet
pgFmtTableCoerce table fld@(CoercibleField{cfTransform = (Just formatterProc)}) = pgFmtCallUnary formatterProc (pgFmtField table fld)
pgFmtTableCoerce table f = pgFmtField table f

-- | Like the previous but now we just have a name so no namespace or JSON paths.
pgFmtCoerceNamed :: CoercibleField -> SQL.Snippet
pgFmtCoerceNamed CoercibleField{cfName = fn, cfTransform = (Just formatterProc)} = pgFmtCallUnary formatterProc (pgFmtIdent fn) <> " AS " <> pgFmtIdent fn
pgFmtCoerceNamed CoercibleField{cfName = fn} = pgFmtIdent fn

pgFmtSelectItem :: QualifiedIdentifier -> CoercibleSelectField -> SQL.Snippet
pgFmtSelectItem table CoercibleSelectField{csField = fld, csAggFunction = agg, csAggCast = aggCast, csCast = cast, csAlias = alias} =
  pgFmtApplyAggregate agg aggCast (pgFmtApplyCast cast (pgFmtTableCoerce table fld)) <> pgFmtAs alias

pgFmtSpreadSelectItem :: Alias -> SpreadSelectField -> SQL.Snippet
pgFmtSpreadSelectItem aggAlias SpreadSelectField{ssSelName, ssSelAggFunction, ssSelAggCast, ssSelAlias} =
  pgFmtApplyAggregate ssSelAggFunction ssSelAggCast (pgFmtFullSelName aggAlias ssSelName) <> pgFmtAs ssSelAlias

pgFmtApplyAggregate :: Maybe AggregateFunction -> Maybe Cast -> SQL.Snippet -> SQL.Snippet
pgFmtApplyAggregate Nothing _ snippet = snippet
pgFmtApplyAggregate (Just agg) aggCast snippet =
  pgFmtApplyCast aggCast aggregatedSnippet
  where
    convertAggFunction :: AggregateFunction -> SQL.Snippet
    -- Convert from e.g. Sum (the data type) to SUM
    convertAggFunction = SQL.sql . BS.map toUpper . BS.pack . show
    aggregatedSnippet = convertAggFunction agg <> "(" <> snippet <> ")"

pgFmtSpreadJoinSelectItem :: Alias -> [CoercibleOrderTerm] -> SpreadSelectField -> SQL.Snippet
pgFmtSpreadJoinSelectItem aggAlias order SpreadSelectField{ssSelName, ssSelAlias} =
  "COALESCE(json_agg(" <> fmtField <> " " <> fmtOrder <> "),'[]')::jsonb" <> " AS " <> fmtAlias
  where
    fmtField = pgFmtFullSelName aggAlias ssSelName
    fmtOrder = orderF (QualifiedIdentifier "" aggAlias) order
    fmtAlias = pgFmtIdent (fromMaybe ssSelName ssSelAlias)

pgFmtApplyCast :: Maybe Cast -> SQL.Snippet -> SQL.Snippet
pgFmtApplyCast Nothing snippet = snippet
-- Ideally we'd quote the cast with "pgFmtIdent cast". However, that would invalidate common casts such as "int", "bigint", etc.
-- Try doing: `select 1::"bigint"` - it'll err, using "int8" will work though. There's some parser magic that pg does that's invalidated when quoting.
-- Not quoting should be fine, we validate the input on Parsers.
pgFmtApplyCast (Just cast) snippet = "CAST( " <> snippet <> " AS " <> SQL.sql (encodeUtf8 cast) <> " )"

pgFmtFullSelName :: Alias -> FieldName -> SQL.Snippet
pgFmtFullSelName aggAlias fieldName = case fieldName of
  "*" -> pgFmtIdent aggAlias <> ".*"
  _ -> pgFmtIdent aggAlias <> "." <> pgFmtIdent fieldName

-- TODO: At this stage there shouldn't be a Maybe since ApiRequest should ensure that an INSERT/UPDATE has a body
fromJsonBodyF :: Maybe LBS.ByteString -> [CoercibleField] -> Bool -> Bool -> Bool -> SQL.Snippet
fromJsonBodyF body fields includeSelect includeLimitOne includeDefaults =
  selectClause <> fromClause <> defaultsClause <> lateralClause <> " pgrst_body "
  where
    selectClause = if includeSelect then "SELECT " <> namedCols <> " " else mempty
    fromClause = "FROM (SELECT " <> jsonPlaceHolder <> " AS json_data) pgrst_payload, "
    defaultsClause
      | includeDefaults && isJsonObject = "LATERAL (SELECT " <> defsJsonb <> " || pgrst_payload.json_data AS val) pgrst_json_defs, "
      | includeDefaults && not isJsonObject = "LATERAL (SELECT jsonb_agg(" <> defsJsonb <> " || elem) AS val from jsonb_array_elements(pgrst_payload.json_data) elem) pgrst_json_defs, "
      | otherwise = mempty
    lateralClause = "LATERAL (SELECT " <> parsedCols <> " FROM " <> lateralFieldsSource <> ")"

    namedCols = intercalateSnippet ", " $ fromQi . QualifiedIdentifier "pgrst_body" . cfName <$> fields
    parsedCols = intercalateSnippet ", " $ pgFmtCoerceNamed <$> fields
    typedCols = intercalateSnippet ", " $ pgFmtIdent . cfName <> const " " <> SQL.sql . encodeUtf8 . cfIRType <$> fields

    lateralFieldsSource = if null fields then emptyFieldsSource else nonEmptyFieldsSource
      where
        limitClause = if includeLimitOne then "LIMIT 1" else mempty
        nonEmptyFieldsSource = jsonToRecordsetF <> "(" <> finalBodyF <> ") AS _(" <> typedCols <> ") " <> limitClause
        -- when json keys are empty, e.g. when payload is `{}` or `[{}, {}]`
        emptyFieldsSource =
          if isJsonObject then
            "(values(1)) _ " -- only 1 row for an empty json object '{}'
          else
            jsonArrayElementsF <> "(" <> finalBodyF <> ") _ " -- extract rows of a json array of empty objects `[{}, {}]`
    defsJsonb = SQL.sql $ "jsonb_build_object(" <> BS.intercalate "," fieldsWDefaults <> ")"
    fieldsWDefaults = mapMaybe extractFieldDefault fields
      where
        extractFieldDefault CoercibleField{cfName = nam, cfDefault = Just def} = Just $ encodeUtf8 (pgFmtLit nam <> ", " <> def)
        extractFieldDefault CoercibleField{cfDefault = Nothing} = Nothing

    (finalBodyF, jsonArrayElementsF, jsonToRecordsetF) =
      if includeDefaults then
        ("pgrst_json_defs.val", "jsonb_array_elements", if isJsonObject then "jsonb_to_record" else "jsonb_to_recordset")
      else
        ("pgrst_payload.json_data", "json_array_elements", if isJsonObject then "json_to_record" else "json_to_recordset")

    jsonPlaceHolder = SQL.encoderAndParam (HE.nullable $ if includeDefaults then HE.jsonbLazyBytes else HE.jsonLazyBytes) body
    isJsonObject =
      -- light validation as pg's json_to_record(set) already validates that the body is valid JSON. We just need to know whether the body looks like an object or not.
      LBS.take 1 (LBS.dropWhile (`elem` insignificantWhitespace) (fromMaybe mempty body)) == "{"
      where
        insignificantWhitespace = [32, 9, 10, 13] -- " \t\n\r" [32,9,10,13] https://datatracker.ietf.org/doc/html/rfc8259#section-2

pgFmtOrderTerm :: QualifiedIdentifier -> CoercibleOrderTerm -> SQL.Snippet
pgFmtOrderTerm qi ot =
  fmtOTerm ot
    <> " "
    <> SQL.sql
      ( BS.unwords
          [ maybe mempty direction $ coDirection ot
          , maybe mempty nullOrder $ coNullOrder ot
          ]
      )
  where
    fmtOTerm = \case
      CoercibleOrderTerm{coField = cof} -> pgFmtField qi cof
      CoercibleOrderRelationTerm{coRelation, coRelTerm = (fn, jp)} -> pgFmtField (QualifiedIdentifier mempty coRelation) (unknownField fn jp)

    direction OrderAsc = "ASC"
    direction OrderDesc = "DESC"

    nullOrder OrderNullsFirst = "NULLS FIRST"
    nullOrder OrderNullsLast = "NULLS LAST"

-- | Interpret a literal in the way the planner indicated through the CoercibleField.
pgFmtUnknownLiteralForField :: SQL.Snippet -> CoercibleField -> SQL.Snippet
pgFmtUnknownLiteralForField value CoercibleField{cfTransform = (Just parserProc)} = pgFmtCallUnary parserProc value
-- But when no transform is requested, we just use the literal as-is.
pgFmtUnknownLiteralForField value _ = value

-- | Array version of the above, used by ANY().
pgFmtArrayLiteralForField :: [Text] -> CoercibleField -> SQL.Snippet
-- When a transformation is requested, we need to apply the transformation to each element of the array. This could be done by just making a query with `parser(value)` for each value, but may lead to huge query lengths. Imagine `data_representations.color_from_text('...'::text)` for repeated for a hundred values. Instead we use `unnest()` to unpack a standard array literal and then apply the transformation to each element, like a map.
-- Note the literals will be treated as text since in every case when we use ANY() the parameters are textual (coming from a query string). We want to rely on the `text->domain` parser to do the right thing.
pgFmtArrayLiteralForField values CoercibleField{cfTransform = (Just parserProc)} = SQL.sql "(SELECT " <> pgFmtCallUnary parserProc (SQL.sql "unnest(" <> unknownLiteral (pgBuildArrayLiteral values) <> "::text[])") <> ")"
-- When no transformation is requested, we don't need a subquery.
pgFmtArrayLiteralForField values _ = unknownLiteral (pgBuildArrayLiteral values)

pgFmtFilter :: QualifiedIdentifier -> CoercibleFilter -> SQL.Snippet
pgFmtFilter _ (CoercibleFilterNullEmbed hasNot fld) = pgFmtIdent fld <> " IS " <> (if not hasNot then "NOT " else mempty) <> "DISTINCT FROM NULL"
pgFmtFilter _ (CoercibleFilter _ (NoOpExpr _)) = mempty -- TODO unreachable because NoOpExpr is filtered on QueryParams
pgFmtFilter table (CoercibleFilter fld (OpExpr hasNot oper)) =
  notOp <> " " <> pgFmtField table fld <> case oper of
    Op op val -> " " <> simpleOperator op <> " " <> pgFmtUnknownLiteralForField (unknownLiteral val) fld
    OpQuant op quant val ->
      " " <> quantOperator op <> " " <> case op of
        OpLike -> fmtQuant quant $ unknownLiteral (T.map star val)
        OpILike -> fmtQuant quant $ unknownLiteral (T.map star val)
        _ -> fmtQuant quant $ pgFmtUnknownLiteralForField (unknownLiteral val) fld
    -- IS cannot be prepared. `PREPARE boolplan AS SELECT * FROM projects where id IS $1` will give a syntax error.
    -- The above can be fixed by using `PREPARE boolplan AS SELECT * FROM projects where id IS NOT DISTINCT FROM $1;`
    -- However that would not accept the TRUE/FALSE/NULL/"NOT NULL"/UNKNOWN keywords. See: https://stackoverflow.com/questions/6133525/proper-way-to-set-preparedstatement-parameter-to-null-under-postgres.
    -- This is why `IS` operands are whitelisted at the Parsers.hs level
    Is isVal ->
      " IS "
        <> case isVal of
          IsNull -> "NULL"
          IsNotNull -> "NOT NULL"
          IsTriTrue -> "TRUE"
          IsTriFalse -> "FALSE"
          IsTriUnknown -> "UNKNOWN"
    IsDistinctFrom val -> " IS DISTINCT FROM " <> unknownLiteral val
    -- We don't use "IN", we use "= ANY". IN has the following disadvantages:
    -- + No way to use an empty value on IN: "col IN ()" is invalid syntax. With ANY we can do "= ANY('{}')"
    -- + Can invalidate prepared statements: multiple parameters on an IN($1, $2, $3) will lead to using different prepared statements and not take advantage of caching.
    In vals ->
      " " <> case vals of
        [""] -> "= ANY('{}') "
        _ -> "= ANY (" <> pgFmtArrayLiteralForField vals fld <> ") "
    Fts op lang val -> " " <> ftsOperator op <> "(" <> pgFmtFtsLang lang <> unknownLiteral val <> ") "
  where
    notOp = if hasNot then "NOT" else mempty
    star c = if c == '*' then '%' else c
    fmtQuant q val = case q of
      Just QuantAny -> "ANY(" <> val <> ")"
      Just QuantAll -> "ALL(" <> val <> ")"
      Nothing -> val

pgFmtFtsLang :: Maybe Text -> SQL.Snippet
pgFmtFtsLang = maybe mempty (\l -> unknownLiteral l <> ", ")

pgFmtJoinCondition :: JoinCondition -> SQL.Snippet
pgFmtJoinCondition (JoinCondition (qi1, col1) (qi2, col2)) =
  pgFmtColumn qi1 col1 <> " = " <> pgFmtColumn qi2 col2

pgFmtLogicTree :: QualifiedIdentifier -> CoercibleLogicTree -> SQL.Snippet
pgFmtLogicTree qi (CoercibleExpr hasNot op forest) = SQL.sql notOp <> " (" <> intercalateSnippet (opSql op) (pgFmtLogicTree qi <$> forest) <> ")"
  where
    notOp = if hasNot then "NOT" else mempty

    opSql And = " AND "
    opSql Or = " OR "
pgFmtLogicTree qi (CoercibleStmnt flt) = pgFmtFilter qi flt

pgFmtJsonPath :: JsonPath -> SQL.Snippet
pgFmtJsonPath = \case
  [] -> mempty
  (JArrow x : xs) -> "->" <> pgFmtJsonOperand x <> pgFmtJsonPath xs
  (J2Arrow x : xs) -> "->>" <> pgFmtJsonOperand x <> pgFmtJsonPath xs
  where
    pgFmtJsonOperand (JKey k) = unknownLiteral k
    pgFmtJsonOperand (JIdx i) = unknownLiteral i <> "::int"

pgFmtAs :: Maybe Alias -> SQL.Snippet
pgFmtAs Nothing = mempty
pgFmtAs (Just alias) = " AS " <> pgFmtIdent alias

groupF :: QualifiedIdentifier -> [CoercibleSelectField] -> [RelSelectField] -> SQL.Snippet
groupF qi select relSelect
  | (noSelectsAreAggregated && noRelSelectsAreAggregated) || null groupTerms = mempty
  | otherwise = " GROUP BY " <> intercalateSnippet ", " groupTerms
  where
    noSelectsAreAggregated = null $ [s | s@(CoercibleSelectField{csAggFunction = Just _}) <- select]
    noRelSelectsAreAggregated = all (\case Spread sels _ -> all (isNothing . ssSelAggFunction) sels; _ -> True) relSelect
    groupTermsFromSelect = mapMaybe (pgFmtGroup qi) select
    groupTermsFromRelSelect = mapMaybe groupTermFromRelSelectField relSelect
    groupTerms = groupTermsFromSelect ++ groupTermsFromRelSelect

groupTermFromRelSelectField :: RelSelectField -> Maybe SQL.Snippet
groupTermFromRelSelectField (JsonEmbed{rsSelName}) =
  Just $ pgFmtIdent rsSelName
groupTermFromRelSelectField (Spread{rsSpreadSel, rsAggAlias}) =
  if null groupTerms then
    Nothing
  else
    Just $ intercalateSnippet ", " groupTerms
  where
    processField :: SpreadSelectField -> Maybe SQL.Snippet
    processField SpreadSelectField{ssSelAggFunction = Just _} = Nothing
    processField SpreadSelectField{ssSelName, ssSelAlias} =
      Just $ pgFmtIdent rsAggAlias <> "." <> pgFmtIdent (fromMaybe ssSelName ssSelAlias)
    groupTerms = mapMaybe processField rsSpreadSel

pgFmtGroup :: QualifiedIdentifier -> CoercibleSelectField -> Maybe SQL.Snippet
pgFmtGroup _ CoercibleSelectField{csAggFunction = Just _} = Nothing
pgFmtGroup _ CoercibleSelectField{csAlias = Just alias, csAggFunction = Nothing} = Just $ pgFmtIdent alias
pgFmtGroup qi CoercibleSelectField{csField = fld, csAlias = Nothing, csAggFunction = Nothing} = Just $ pgFmtField qi fld

countF :: SQL.Snippet -> SQL.Snippet -> Bool -> Maybe Integer -> NonnegRange -> (SQL.Snippet, SQL.Snippet)
countF countQuery pageCountSelect shouldCount maxRows range
  | shouldCount =
      if isJust maxRows || range /= allRange then
        ( ", pgrst_source_count AS (" <> countQuery <> ")"
        , "(SELECT pg_catalog.count(*) FROM pgrst_source_count)"
        )
      -- When there are no db-max-rows and limits/offsets, the total count will be the same as the page count,
      -- so we use the same page count here to avoid doing a separate aggregated count.
      else
        (mempty, pageCountSelect)
  | otherwise = (mempty, "null::bigint")

pageCountSelectF :: Maybe Routine -> SQL.Snippet
pageCountSelectF rout =
  if maybe False funcReturnsSingle rout then
    "1"
  else
    "pg_catalog.count(_postgrest_t)"

returningF :: QualifiedIdentifier -> [FieldName] -> SQL.Snippet
returningF qi returnings =
  if null returnings then
    "RETURNING 1" -- For mutation cases where there's no ?select, we return 1 to know how many rows were modified
  else
    "RETURNING " <> intercalateSnippet ", " (pgFmtColumn qi <$> returnings)

limitOffsetF :: NonnegRange -> SQL.Snippet
limitOffsetF range =
  if range == allRange then mempty else "LIMIT " <> limit <> " OFFSET " <> offset
  where
    limit = maybe "ALL" (\l -> unknownEncoder (BS.pack $ show l)) $ rangeLimit range
    offset = unknownEncoder (BS.pack . show $ rangeOffset range)

responseHeadersF :: SQL.Snippet
responseHeadersF = currentSettingF "response.headers"

responseStatusF :: SQL.Snippet
responseStatusF = currentSettingF "response.status"

addConfigPgrstInserted :: Bool -> SQL.Snippet
addConfigPgrstInserted add =
  let (symbol, num) = if add then ("+", "0") else ("-", "-1")
  in  "set_config('pgrst.inserted', (coalesce(" <> currentSettingF "pgrst.inserted" <> "::int, 0) " <> symbol <> " 1)::text, true) <> '" <> num <> "'"

currentSettingF :: SQL.Snippet -> SQL.Snippet
currentSettingF setting =
  -- nullif is used because of https://gist.github.com/steve-chavez/8d7033ea5655096903f3b52f8ed09a15
  "nullif(current_setting('" <> setting <> "', true), '')"

orderF :: QualifiedIdentifier -> [CoercibleOrderTerm] -> SQL.Snippet
orderF _ [] = mempty
orderF qi ordts = "ORDER BY " <> intercalateSnippet ", " (pgFmtOrderTerm qi <$> ordts)

-- Hasql Snippet utilities
unknownEncoder :: ByteString -> SQL.Snippet
unknownEncoder = SQL.encoderAndParam (HE.nonNullable HE.unknown)

unknownLiteral :: Text -> SQL.Snippet
unknownLiteral = unknownEncoder . encodeUtf8

intercalateSnippet :: ByteString -> [SQL.Snippet] -> SQL.Snippet
intercalateSnippet _ [] = mempty
intercalateSnippet frag snippets = foldr1 (\a b -> a <> SQL.sql frag <> b) snippets

explainF :: MTVndPlanFormat -> [MTVndPlanOption] -> SQL.Snippet -> SQL.Snippet
explainF fmt opts snip =
  "EXPLAIN ("
    <> SQL.sql (BS.intercalate ", " (fmtPlanFmt fmt : (fmtPlanOpt <$> opts)))
    <> ") "
    <> snip
  where
    fmtPlanOpt :: MTVndPlanOption -> BS.ByteString
    fmtPlanOpt PlanAnalyze = "ANALYZE"
    fmtPlanOpt PlanVerbose = "VERBOSE"
    fmtPlanOpt PlanSettings = "SETTINGS"
    fmtPlanOpt PlanBuffers = "BUFFERS"
    fmtPlanOpt PlanWAL = "WAL"

    fmtPlanFmt PlanText = "FORMAT TEXT"
    fmtPlanFmt PlanJSON = "FORMAT JSON"

-- | Do a pg set_config(setting, value, true) call. This is equivalent to a SET LOCAL.
setConfigLocal :: (SQL.Snippet, ByteString) -> SQL.Snippet
setConfigLocal (k, v) =
  "set_config(" <> k <> ", " <> unknownEncoder v <> ", true)"

-- | For when the settings are hardcoded and not parameterized
setConfigWithConstantName :: (SQL.Snippet, ByteString) -> SQL.Snippet
setConfigWithConstantName (k, v) = setConfigLocal ("'" <> k <> "'", v)

-- | For when the settings need to be parameterized
setConfigWithDynamicName :: (ByteString, ByteString) -> SQL.Snippet
setConfigWithDynamicName (k, v) =
  setConfigLocal (unknownEncoder k, v)

-- | Starting from PostgreSQL v14, some characters are not allowed for config names (mostly affecting headers with "-").
-- | A JSON format string is used to avoid this problem. See https://github.com/PostgREST/postgrest/issues/1857
setConfigWithConstantNameJSON :: SQL.Snippet -> [(ByteString, ByteString)] -> [SQL.Snippet]
setConfigWithConstantNameJSON prefix keyVals = [setConfigWithConstantName (prefix, gucJsonVal keyVals)]
  where
    gucJsonVal :: [(ByteString, ByteString)] -> ByteString
    gucJsonVal = LBS.toStrict . JSON.encode . HM.fromList . arrayByteStringToText
    arrayByteStringToText :: [(ByteString, ByteString)] -> [(Text, Text)]
    arrayByteStringToText keyVal = (T.decodeUtf8 *** T.decodeUtf8) <$> keyVal

handlerF :: Maybe Routine -> MediaHandler -> SQL.Snippet
handlerF rout = \case
  BuiltinAggArrayJsonStrip -> asJsonF rout True
  BuiltinAggSingleJson strip -> asJsonSingleF rout strip
  BuiltinOvAggJson -> asJsonF rout False
  BuiltinOvAggGeoJson -> asGeoJsonF
  BuiltinOvAggCsv -> asCsvF
  CustomFunc funcQi target -> customFuncF rout funcQi target
  NoAgg -> "''::text"

schemaDescription :: Text -> SQL.Snippet
schemaDescription schema =
  "SELECT pg_catalog.obj_description(quote_ident(" <> encoded <> ")::regnamespace, 'pg_namespace')"
  where
    encoded = SQL.encoderAndParam (HE.nonNullable HE.unknown) $ encodeUtf8 schema
