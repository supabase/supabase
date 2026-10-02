{-# LANGUAGE DuplicateRecordFields #-}
{-# LANGUAGE NamedFieldPuns #-}
{-# LANGUAGE RecordWildCards #-}

-- |
-- Module      : PostgREST.Query.QueryBuilder
-- Description : PostgREST SQL queries generating functions.
--
-- This module provides functions to consume data types that
-- represent database queries (e.g. ReadPlanTree, MutatePlan) and SqlFragment
-- to produce SqlQuery type outputs.
module PostgREST.Query.QueryBuilder
  ( readPlanToQuery
  , mutatePlanToQuery
  , readPlanToCountQuery
  , callPlanToQuery
  , limitedQuery
  )
where

import Data.Maybe (fromJust)
import Data.Tree (Tree (..))
import Protolude

import Data.Aeson qualified as JSON
import Data.ByteString.Char8 qualified as BS
import Data.HashMap.Strict qualified as HM
import Data.Set qualified as S

import PostgREST.ApiRequest.Preferences (PreferResolution (..))
import PostgREST.ApiRequest.Types
import PostgREST.Catalog.Identifiers (QualifiedIdentifier (..))
import PostgREST.Catalog.Relationship
  ( Cardinality (..)
  , Junction (..)
  , Relationship (..)
  )
import PostgREST.Catalog.Routine (RoutineParam (..))
import PostgREST.Plan.CallPlan
import PostgREST.Plan.MutatePlan
import PostgREST.Plan.ReadPlan
import PostgREST.Plan.Types
import PostgREST.Query.SqlFragment

import Hasql.DynamicStatements.Snippet qualified as SQL
import Hasql.Encoders qualified as HE

readPlanToQuery :: ReadPlanTree -> SQL.Snippet
readPlanToQuery node@(Node ReadPlan{select, from = mainQi, fromAlias, where_ = logicForest, order, range_ = readRange, relToParent, relJoinConds, relSelect, relSpread} forest) =
  "SELECT "
    <> intercalateSnippet ", " (selects ++ sprExtraSelects ++ joinsSelects)
    <> fromFrag
    <> intercalateSnippet " " joins
    <> ( if null logicForest && null relJoinConds then
           mempty
         else
           " WHERE " <> intercalateSnippet " AND " (map (pgFmtLogicTree qi) logicForest ++ map pgFmtJoinCondition relJoinConds)
       )
    <> " "
    <> groupF qi select relSelect
    <> " "
    <> orderF qi order
    <> " "
    <> limitOffsetF readRange
  where
    fromFrag = fromF relToParent mainQi fromAlias
    qi = getQualifiedIdentifier relToParent mainQi fromAlias
    -- gets all the columns in case of an empty select, ignoring/obtaining these columns is done at the aggregation stage
    defSelect = [CoercibleSelectField (unknownField "*" []) Nothing Nothing Nothing Nothing]
    joins = getJoins node
    selects = pgFmtSelectItem qi <$> (if null select && null forest then defSelect else select)
    joinsSelects = getJoinSelects node
    sprExtraSelects = case relSpread of
      Just (ToManySpread sels _) -> (\s -> pgFmtSelectItem (maybe qi (QualifiedIdentifier "") $ fst s) $ snd s) <$> sels
      _ -> mempty

getJoinSelects :: ReadPlanTree -> [SQL.Snippet]
getJoinSelects (Node ReadPlan{relSelect} _) =
  join $ map relSelectToSnippet relSelect
  where
    relSelectToSnippet :: RelSelectField -> [SQL.Snippet]
    relSelectToSnippet fld =
      let aggAlias = pgFmtIdent $ rsAggAlias fld
      in  case fld of
            JsonEmbed{rsEmptyEmbed = True} ->
              []
            JsonEmbed{rsSelName, rsEmbedMode = JsonObject} ->
              ["row_to_json(" <> aggAlias <> ".*)::jsonb AS " <> pgFmtIdent rsSelName]
            JsonEmbed{rsSelName, rsEmbedMode = JsonArray} ->
              ["COALESCE( " <> aggAlias <> "." <> aggAlias <> ", '[]') AS " <> pgFmtIdent rsSelName]
            Spread{rsSpreadSel, rsAggAlias} ->
              pgFmtSpreadSelectItem rsAggAlias <$> rsSpreadSel

getJoins :: ReadPlanTree -> [SQL.Snippet]
getJoins (Node _ []) = []
getJoins (Node ReadPlan{relSelect} forest) =
  map
    ( \fld ->
        let
          alias = rsAggAlias fld
          matchingNode = fromJust $ find (\(Node ReadPlan{relAggAlias} _) -> alias == relAggAlias) forest
        in
          getJoin fld matchingNode
    )
    relSelect

getJoin :: RelSelectField -> ReadPlanTree -> SQL.Snippet
getJoin fld node@(Node ReadPlan{relJoinType, relSpread} _) =
  let
    correlatedSubquery sub al cond =
      " " <> (if relJoinType == Just JTInner then "INNER" else "LEFT") <> " JOIN LATERAL ( " <> sub <> " ) AS " <> al <> " ON " <> cond
    subquery = readPlanToQuery node
    aggAlias = pgFmtIdent $ rsAggAlias fld
    selectSubqAgg = "SELECT json_agg(" <> aggAlias <> ")::jsonb AS " <> aggAlias
    fromSubqAgg = " FROM (" <> subquery <> " ) AS " <> aggAlias
    joinCondition = if relJoinType == Just JTInner then aggAlias <> " IS NOT NULL" else "TRUE"
  in
    case fld of
      JsonEmbed{rsEmbedMode = JsonObject} ->
        correlatedSubquery subquery aggAlias "TRUE"
      Spread{rsSpreadSel, rsAggAlias} ->
        case relSpread of
          Just (ToManySpread _ sprOrder) ->
            let selSpread = selectSubqAgg <> (if null rsSpreadSel then mempty else ", ") <> intercalateSnippet ", " (pgFmtSpreadJoinSelectItem rsAggAlias sprOrder <$> rsSpreadSel)
            in  correlatedSubquery (selSpread <> fromSubqAgg) aggAlias joinCondition
          _ ->
            correlatedSubquery subquery aggAlias "TRUE"
      JsonEmbed{rsEmbedMode = JsonArray} ->
        correlatedSubquery (selectSubqAgg <> fromSubqAgg) aggAlias joinCondition

mutatePlanToQuery :: MutatePlan -> SQL.Snippet
mutatePlanToQuery (Insert mainQi iCols body onConflict putConditions returnings _ applyDefaults) =
  "INSERT INTO "
    <> fromQi mainQi
    <> (if null iCols then " " else "(" <> cols <> ") ")
    <> fromJsonBodyF body iCols True False applyDefaults
    <>
    -- Only used for PUT
    (if null putConditions then mempty else "WHERE " <> addConfigPgrstInserted True <> " AND " <> intercalateSnippet " AND " (pgFmtLogicTree (QualifiedIdentifier mempty "pgrst_body") <$> putConditions))
    <> (if null putConditions && mergeDups then "WHERE " <> addConfigPgrstInserted True else mempty)
    <> maybe
      mempty
      ( \(oncDo, oncCols) ->
          if null oncCols then
            mempty
          else
            " ON CONFLICT(" <> intercalateSnippet ", " (pgFmtIdent <$> oncCols) <> ") " <> case oncDo of
              IgnoreDuplicates ->
                "DO NOTHING"
              MergeDuplicates ->
                if null iCols then
                  "DO NOTHING"
                else
                  "DO UPDATE SET " <> intercalateSnippet ", " ((pgFmtIdent . cfName) <> const " = EXCLUDED." <> (pgFmtIdent . cfName) <$> iCols) <> (if null putConditions && not mergeDups then mempty else "WHERE " <> addConfigPgrstInserted False)
      )
      onConflict
    <> " "
    <> returningF mainQi returnings
  where
    cols = intercalateSnippet ", " $ pgFmtIdent . cfName <$> iCols
    mergeDups = case onConflict of Just (MergeDuplicates, _) -> True; _ -> False
mutatePlanToQuery (Update mainQi uCols body logicForest returnings applyDefaults)
  | null uCols =
      -- if there are no columns we cannot do UPDATE table SET {empty}, it'd be invalid syntax
      -- selecting an empty resultset from mainQi gives us the column names to prevent errors when using &select=
      -- the select has to be based on "returnings" to make computed overloaded functions not throw
      "SELECT " <> emptyBodyReturnedColumns <> " FROM " <> fromQi mainQi <> " WHERE false"
  | otherwise =
      "UPDATE "
        <> mainTbl
        <> " SET "
        <> cols
        <> " "
        <> fromJsonBodyF body uCols False False applyDefaults
        <> whereLogic
        <> " "
        <> returningF mainQi returnings
  where
    whereLogic = if null logicForest then mempty else " WHERE " <> intercalateSnippet " AND " (pgFmtLogicTree mainQi <$> logicForest)
    mainTbl = fromQi mainQi
    emptyBodyReturnedColumns = if null returnings then "NULL" else intercalateSnippet ", " (pgFmtColumn (QualifiedIdentifier mempty $ qiName mainQi) <$> returnings)
    cols = intercalateSnippet ", " (pgFmtIdent . cfName <> const " = " <> pgFmtColumn (QualifiedIdentifier mempty "pgrst_body") . cfName <$> uCols)
mutatePlanToQuery (Delete mainQi logicForest returnings) =
  "DELETE FROM "
    <> fromQi mainQi
    <> " "
    <> whereLogic
    <> " "
    <> returningF mainQi returnings
  where
    whereLogic = if null logicForest then mempty else " WHERE " <> intercalateSnippet " AND " (pgFmtLogicTree mainQi <$> logicForest)

callPlanToQuery :: CallPlan -> SQL.Snippet
callPlanToQuery (FunctionCall qi params arguments returnsScalar returnsSetOfScalar filterFields returnings) =
  "SELECT "
    <> (if returnsScalar || returnsSetOfScalar then "pgrst_call.pgrst_scalar" else returnedColumns)
    <> " "
    <> fromCall
  where
    jsonArgs = case arguments of
      DirectArgs args -> Just $ JSON.encode args
      JsonArgs json -> json
    fromCall = case params of
      OnePosParam prm -> "FROM " <> callIt (singleParameter jsonArgs $ encodeUtf8 $ ppType prm)
      KeyParams [] -> "FROM " <> callIt mempty
      KeyParams prms -> case arguments of
        DirectArgs args -> "FROM " <> callIt (fmtArgs prms args)
        JsonArgs json ->
          fromJsonBodyF json ((\p -> CoercibleField (ppName p) mempty False Nothing (ppTypeMaxLength p) mempty Nothing Nothing False) <$> prms) False True False
            <> ", "
            <> "LATERAL "
            <> callIt (fmtParams prms)

    callIt :: SQL.Snippet -> SQL.Snippet
    callIt argument
      | returnsScalar || returnsSetOfScalar = "(SELECT " <> fromQi qi <> "(" <> argument <> ") pgrst_scalar) pgrst_call"
      | otherwise = fromQi qi <> "(" <> argument <> ") pgrst_call"

    fmtParams :: [RoutineParam] -> SQL.Snippet
    fmtParams prms =
      intercalateSnippet
        ", "
        ((\a -> (if ppVar a then "VARIADIC " else mempty) <> pgFmtIdent (ppName a) <> " := pgrst_body." <> pgFmtIdent (ppName a)) <$> prms)

    fmtArgs :: [RoutineParam] -> HM.HashMap Text RpcParamValue -> SQL.Snippet
    fmtArgs prms args = intercalateSnippet ", " $ fmtArg <$> prms
      where
        fmtArg RoutineParam{..} =
          (if ppVar then "VARIADIC " else mempty)
            <> pgFmtIdent ppName
            <> " := "
            <> encodeArg (HM.lookup ppName args)
            <> "::"
            <> SQL.sql (encodeUtf8 ppTypeMaxLength)
        encodeArg :: Maybe RpcParamValue -> SQL.Snippet
        encodeArg (Just (Variadic v)) = SQL.encoderAndParam (HE.nonNullable $ HE.foldableArray $ HE.nonNullable HE.text) v
        encodeArg (Just (Fixed v)) = SQL.encoderAndParam (HE.nonNullable HE.unknown) $ encodeUtf8 v
        -- Currently not supported: Calling functions without some of their arguments without DEFAULT.
        -- We could fallback to providing this NULL value in those cases.
        encodeArg Nothing = "NULL"

    -- the columns here would be the returnings + the columns that would later
    -- be used by a where clause filter, if they intersect, we remove the duplicates
    -- and if * is returned then no need to explicitly add filter columns
    returnedColumns :: SQL.Snippet
    returnedColumns = case S.toList returnings of
      [] -> "*"
      ["*"] -> pgFmtColumn (QualifiedIdentifier mempty "pgrst_call") "*"
      _ -> intercalateSnippet ", " (pgFmtColumn (QualifiedIdentifier mempty "pgrst_call") <$> returnedColumns')
        where
          returnedColumns' = S.toList $ returnings <> filterFields

-- | SQL query meant for COUNTing the root node of the Tree.
-- It only takes WHERE into account and doesn't include LIMIT/OFFSET because it would reduce the COUNT.
-- SELECT 1 is done instead of SELECT * to prevent doing expensive operations(like functions based on the columns)
-- inside the FROM target.
-- If the request contains INNER JOINs, then the COUNT of the root node will change.
-- For this case, we use a WHERE EXISTS instead of an INNER JOIN on the count query.
-- See https://github.com/PostgREST/postgrest/issues/2009#issuecomment-977473031
-- Only for the nodes that have an INNER JOIN linked to the root level.
readPlanToCountQuery :: ReadPlanTree -> SQL.Snippet
readPlanToCountQuery (Node ReadPlan{from = mainQi, fromAlias = tblAlias, where_ = logicForest, relToParent = rel, relJoinConds} forest) =
  "SELECT 1 "
    <> fromFrag
    <> ( if null logicForest && null relJoinConds && null subQueries then
           mempty
         else
           " WHERE "
       )
    <> intercalateSnippet
      " AND "
      ( map (pgFmtLogicTreeCount qi) logicForest
          ++ map pgFmtJoinCondition relJoinConds
          ++ subQueries
      )
  where
    qi = getQualifiedIdentifier rel mainQi tblAlias
    fromFrag = fromF rel mainQi tblAlias
    subQueries = foldr existsSubquery [] forest
    existsSubquery :: ReadPlanTree -> [SQL.Snippet] -> [SQL.Snippet]
    existsSubquery readReq@(Node ReadPlan{relJoinType = joinType} _) rest =
      if joinType == Just JTInner then
        ("EXISTS (" <> readPlanToCountQuery readReq <> " )") : rest
      else
        rest
    findNullEmbedRel fld = find (\(Node ReadPlan{relAggAlias} _) -> fld == relAggAlias) forest

    -- https://github.com/PostgREST/postgrest/pull/2930#discussion_r1325293698
    pgFmtLogicTreeCount :: QualifiedIdentifier -> CoercibleLogicTree -> SQL.Snippet
    pgFmtLogicTreeCount qiCount (CoercibleExpr hasNot op frst) = SQL.sql notOp <> " (" <> intercalateSnippet (opSql op) (pgFmtLogicTreeCount qiCount <$> frst) <> ")"
      where
        notOp = if hasNot then "NOT" else mempty
        opSql And = " AND "
        opSql Or = " OR "
    pgFmtLogicTreeCount _ (CoercibleStmnt (CoercibleFilterNullEmbed hasNot fld)) =
      maybe mempty (\x -> (if not hasNot then "NOT " else mempty) <> "EXISTS (" <> readPlanToCountQuery x <> ")") (findNullEmbedRel fld)
    pgFmtLogicTreeCount qiCount (CoercibleStmnt flt) = pgFmtFilter qiCount flt

limitedQuery :: SQL.Snippet -> Maybe Integer -> SQL.Snippet
limitedQuery query maxRows = query <> SQL.sql (maybe mempty (\x -> " LIMIT " <> BS.pack (show x)) maxRows)

-- TODO refactor so this function is unneeded and ComputedRelationship QualifiedIdentifier comes from the ReadPlan type
getQualifiedIdentifier :: Maybe Relationship -> QualifiedIdentifier -> Maybe Alias -> QualifiedIdentifier
getQualifiedIdentifier rel mainQi tblAlias = case rel of
  Just ComputedRelationship{relFunction} -> QualifiedIdentifier mempty $ fromMaybe (qiName relFunction) tblAlias
  _ -> maybe mainQi (QualifiedIdentifier mempty) tblAlias

-- FROM clause plus implicit joins
fromF :: Maybe Relationship -> QualifiedIdentifier -> Maybe Alias -> SQL.Snippet
fromF rel mainQi tblAlias =
  " FROM "
    <> ( case rel of
           -- Due to the use of CTEs on RPC, we need to cast the parameter to the table name in case of function overloading.
           -- See https://github.com/PostgREST/postgrest/issues/2963#issuecomment-1736557386
           Just ComputedRelationship{relFunction, relTableAlias, relTable} -> fromQi relFunction <> "(" <> pgFmtIdent (qiName relTableAlias) <> "::" <> fromQi relTable <> ")"
           _ -> fromQi mainQi
       )
    <> maybe mempty (\a -> " AS " <> pgFmtIdent a) tblAlias
    <> ( case rel of
           Just Relationship{relCardinality = M2M Junction{junTable = jt}} -> ", " <> fromQi jt
           _ -> mempty
       )
