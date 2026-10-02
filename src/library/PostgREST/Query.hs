{-# LANGUAGE RecordWildCards #-}

-- |
-- Module      : PostgREST.Query
-- Description : PostgREST query building
--
-- TODO: This module shouldn't depend on SchemaCache: once OpenAPI is removed, this can be done
module PostgREST.Query
  ( mainQuery
  , MainQuery (..)
  )
where

import Protolude hiding (Handler)

import PostgREST.ApiRequest (ApiRequest (..))
import PostgREST.ApiRequest.Preferences (Preferences (..), shouldExplainCount)
import PostgREST.Auth.Types (AuthResult (..))
import PostgREST.Catalog.Identifiers (QualifiedIdentifier (..))
import PostgREST.Config (AppConfig (..))
import PostgREST.Config.PgVersion (PgVersion)
import PostgREST.Plan
  ( ActionPlan (..)
  , CrudPlan (..)
  , DbActionPlan (..)
  , InspectPlan (..)
  )

import Hasql.DynamicStatements.Snippet qualified as SQL hiding (sql)
import PostgREST.Catalog.Query qualified as CatalogQuery
import PostgREST.Query.PreQuery qualified as PreQuery
import PostgREST.Query.QueryBuilder qualified as QueryBuilder
import PostgREST.Query.SqlFragment qualified as SqlFragment
import PostgREST.Query.Statements qualified as Statements

-- The Queries that run on every request
data MainQuery = MainQuery
  { mqTxVars :: SQL.Snippet
  -- ^ the transaction variables that always run on each query
  , mqPreReq :: Maybe SQL.Snippet
  -- ^ the pre-request function that runs if enabled
  -- TODO only one of the following queries actually runs on each request, once OpenAPI is removed from core it will be easier to refactor this
  , mqMain :: SQL.Snippet
  , mqOpenAPI :: (SQL.Snippet, SQL.Snippet, SQL.Snippet)
  , mqExplain :: Maybe SQL.Snippet
  -- ^ the explain query that gets generated for the "Prefer: count=estimated" case
  }

mainQuery :: PgVersion -> ActionPlan -> AppConfig -> ApiRequest -> AuthResult -> Maybe QualifiedIdentifier -> MainQuery
mainQuery _ (NoDb _) _ _ _ _ = MainQuery mempty Nothing mempty (mempty, mempty, mempty) mempty
mainQuery pgVer (Db plan) conf@AppConfig{..} apiReq@ApiRequest{iTopLevelRange = range, iPreferences = Preferences{..}} authRes preReq =
  let genQ = MainQuery (PreQuery.txVarQuery plan conf authRes apiReq) (PreQuery.preReqQuery <$> preReq)
  in  case plan of
        DbCrud _ WrappedReadPlan{..} ->
          let countQuery = QueryBuilder.readPlanToCountQuery wrReadPlan
          in  genQ
                (Statements.mainRead wrReadPlan countQuery preferCount configDbMaxRows range pMedia wrHandler)
                (mempty, mempty, mempty)
                (if shouldExplainCount preferCount then Just (Statements.postExplain countQuery) else Nothing)
        DbCrud _ MutateReadPlan{..} ->
          genQ (Statements.mainWrite mrReadPlan mrMutatePlan pMedia mrHandler preferRepresentation preferResolution) (mempty, mempty, mempty) mempty
        DbCrud _ CallReadPlan{..} ->
          genQ (Statements.mainCall crProc crCallPlan crReadPlan preferCount configDbMaxRows range pMedia crHandler) (mempty, mempty, mempty) mempty
        MayUseDb InspectPlan{ipSchema = tSchema} ->
          genQ mempty (CatalogQuery.accessibleTables tSchema, CatalogQuery.accessibleFuncs pgVer tSchema, SqlFragment.schemaDescription tSchema) mempty
