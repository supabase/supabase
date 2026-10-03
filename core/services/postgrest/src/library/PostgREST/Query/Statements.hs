{-# LANGUAGE NamedFieldPuns #-}

-- |
-- Module      : PostgREST.Query.Statements
-- Description : PostgREST main queries
module PostgREST.Query.Statements
  ( mainWrite
  , mainRead
  , mainCall
  , postExplain
  )
where

import Protolude

import PostgREST.ApiRequest.Preferences
import PostgREST.Catalog.Routine (MediaHandler (..), Routine)
import PostgREST.MediaType (MTVndPlanFormat (..), MediaType (..))
import PostgREST.Plan.CallPlan
import PostgREST.Plan.MutatePlan as MTPlan
import PostgREST.Plan.ReadPlan
import PostgREST.Query.QueryBuilder
import PostgREST.Query.SqlFragment
import PostgREST.RangeQuery (NonnegRange)

import Hasql.DynamicStatements.Snippet qualified as SQL

mainWrite
  :: ReadPlanTree
  -> MutatePlan
  -> MediaType
  -> MediaHandler
  -> Maybe PreferRepresentation
  -> Maybe PreferResolution
  -> SQL.Snippet
mainWrite rPlan mtplan mt handler rep resolution = mtSnippet mt snippet
  where
    checkUpsert snip = if isInsert && (isPut || resolution == Just MergeDuplicates) then snip else "''"
    pgrstInsertedF = checkUpsert "nullif(current_setting('pgrst.inserted', true),'')::int"
    snippet =
      "WITH "
        <> sourceCTE
        <> " AS ("
        <> mutateQuery
        <> ") "
        <> "SELECT "
        <> "'' AS total_result_set, "
        <> "pg_catalog.count(_postgrest_t) AS page_total, "
        <> locF
        <> " AS header, "
        <> handlerF Nothing handler
        <> " AS body, "
        <> responseHeadersF
        <> " AS response_headers, "
        <> responseStatusF
        <> " AS response_status, "
        <> pgrstInsertedF
        <> " AS response_inserted "
        <> "FROM ("
        <> selectF
        <> ") _postgrest_t"

    locF =
      if isInsert && rep == Just HeadersOnly then
        "CASE WHEN pg_catalog.count(_postgrest_t) = 1 "
          <> "THEN coalesce("
          <> locationF pkCols
          <> ", "
          <> noLocationF
          <> ") "
          <> "ELSE "
          <> noLocationF
          <> " "
          <> "END"
      else
        noLocationF

    selectF
      -- prevent using any of the column names in ?select= when no response is returned from the CTE
      | handler == NoAgg = "SELECT * FROM " <> sourceCTE
      | otherwise = selectQuery

    selectQuery = readPlanToQuery rPlan
    mutateQuery = mutatePlanToQuery mtplan
    (isPut, isInsert, pkCols) = case mtplan of
      MTPlan.Insert{MTPlan.where_, insPkCols} -> ((not . null) where_, True, insPkCols)
      _ -> (False, False, mempty)

mainRead
  :: ReadPlanTree
  -> SQL.Snippet
  -> Maybe PreferCount
  -> Maybe Integer
  -> NonnegRange
  -> MediaType
  -> MediaHandler
  -> SQL.Snippet
mainRead rPlan countQuery pCount maxRows range mt handler = mtSnippet mt snippet
  where
    snippet =
      "WITH "
        <> sourceCTE
        <> " AS ( "
        <> selectQuery
        <> " ) "
        <> countCTEF
        <> " "
        <> "SELECT "
        <> countResultF
        <> " AS total_result_set, "
        <> pageCountSelect
        <> " AS page_total, "
        <> handlerF Nothing handler
        <> " AS body, "
        <> responseHeadersF
        <> " AS response_headers, "
        <> responseStatusF
        <> " AS response_status, "
        <> "''"
        <> " AS response_inserted "
        <> "FROM ( SELECT * FROM "
        <> sourceCTE
        <> " ) _postgrest_t"

    (countCTEF, countResultF) = countF countQ pageCountSelect (shouldCount pCount) maxRows range
    selectQuery = readPlanToQuery rPlan
    pageCountSelect = pageCountSelectF Nothing
    countQ =
      if pCount == Just EstimatedCount then
        -- LIMIT maxRows + 1 so we can determine below that maxRows was surpassed
        limitedQuery countQuery ((+ 1) <$> maxRows)
      else
        countQuery

mainCall
  :: Routine
  -> CallPlan
  -> ReadPlanTree
  -> Maybe PreferCount
  -> Maybe Integer
  -> NonnegRange
  -> MediaType
  -> MediaHandler
  -> SQL.Snippet
mainCall rout cPlan rPlan pCount maxRows range mt handler = mtSnippet mt snippet
  where
    snippet =
      "WITH "
        <> sourceCTE
        <> " AS ("
        <> callProcQuery
        <> ") "
        <> countCTEF
        <> "SELECT "
        <> countResultF
        <> " AS total_result_set, "
        <> pageCountSelect
        <> " AS page_total, "
        <> handlerF (Just rout) handler
        <> " AS body, "
        <> responseHeadersF
        <> " AS response_headers, "
        <> responseStatusF
        <> " AS response_status, "
        <> "''"
        <> " AS response_inserted "
        <> "FROM ("
        <> selectQuery
        <> ") _postgrest_t"

    (countCTEF, countResultF) = countF countQuery pageCountSelect (shouldCount pCount) maxRows range
    selectQuery = readPlanToQuery rPlan
    callProcQuery = callPlanToQuery cPlan
    countQuery = readPlanToCountQuery rPlan
    pageCountSelect = pageCountSelectF (Just rout)

-- This occurs after the main query runs, that's why it's prefixed with "post"
postExplain :: SQL.Snippet -> SQL.Snippet
postExplain = explainF PlanJSON mempty

mtSnippet :: MediaType -> SQL.Snippet -> SQL.Snippet
mtSnippet mediaType snippet = case mediaType of
  MTVndPlan _ fmt opts -> explainF fmt opts snippet
  _ -> snippet
