{-# LANGUAGE NamedFieldPuns #-}
{-# LANGUAGE RecordWildCards #-}

-- |
-- Module      : PostgREST.MainTx
-- Description : PostgREST transaction executor
--
-- This module parametrizes, prepares, executes SQL queries and decodes their results.
module PostgREST.MainTx
  ( MainTx (..)
  , DbResult (..)
  , ResultSet (..)
  , mainTx
  )
where

import Control.Lens ((^?))
import Control.Monad.Extra (whenJust)
import Protolude hiding (Handler)

import Data.Aeson.Lens qualified as L
import Data.ByteString qualified as BS hiding (break)
import Data.ByteString.Char8 qualified as BS
import Data.HashMap.Strict qualified as HM
import Data.Set qualified as S

import PostgREST.ApiRequest (ApiRequest (..))
import PostgREST.ApiRequest.Preferences
  ( PreferCount (..)
  , PreferHandling (..)
  , PreferMaxAffected (..)
  , PreferTransaction (..)
  , Preferences (..)
  )
import PostgREST.ApiRequest.Types (Mutation (..))
import PostgREST.Auth.Types (AuthResult (..))
import PostgREST.Catalog.Identifiers (QualifiedIdentifier (..))
import PostgREST.Catalog.Routine (Routine (..), RoutineMap)
import PostgREST.Catalog.Table (TablesMap)
import PostgREST.Config (AppConfig (..), OpenAPIMode (..))
import PostgREST.Error (Error)
import PostgREST.MediaType (MediaType (..))
import PostgREST.Plan
  ( ActionPlan (..)
  , CrudPlan (..)
  , DbActionPlan (..)
  , InfoPlan (..)
  , InspectPlan (..)
  )
import PostgREST.Query (MainQuery (..))
import PostgREST.SchemaCache (SchemaCache (..))

import Hasql.Decoders qualified as HD
import Hasql.DynamicStatements.Statement qualified as SQL
import Hasql.Session qualified as SQL (Session)
import Hasql.Transaction qualified as SQL
import Hasql.Transaction.Sessions qualified as SQL
import PostgREST.Error qualified as Error
import PostgREST.SchemaCache qualified as SchemaCache

type DbHandler = ExceptT Error SQL.Transaction

data MainTx
  = DbTx (SQL.Session (Either Error DbResult))
  | NoDbTx DbResult

data DbResult
  = DbCrudResult CrudPlan ResultSet
  | DbPlanResult MediaType BS.ByteString
  | MaybeDbResult InspectPlan (Maybe (TablesMap, RoutineMap, Maybe Text))
  | NoDbResult InfoPlan

-- | Standard result set format used for the mqMain query
data ResultSet
  = RSStandard
  { rsTableTotal :: Maybe Int64
  -- ^ count of all the table rows
  , rsQueryTotal :: Int64
  -- ^ count of the query rows
  , rsLocation :: [(BS.ByteString, BS.ByteString)]
  -- ^ The Location header(only used for inserts) is represented as a list of strings containing
  -- variable bindings like @"k1=eq.42"@, or the empty list if there is no location header.
  , rsBody :: BS.ByteString
  -- ^ the aggregated body of the query
  , rsGucHeaders :: Maybe BS.ByteString
  -- ^ the HTTP headers to be added to the response
  , rsGucStatus :: Maybe Text
  -- ^ the HTTP status to be added to the response
  , rsInserted :: Maybe Int64
  -- ^ the number of rows inserted (Only used for upserts)
  }

mainTx :: MainQuery -> AppConfig -> AuthResult -> ApiRequest -> ActionPlan -> SchemaCache -> MainTx
mainTx _ _ _ _ (NoDb x) _ = NoDbTx $ NoDbResult x
mainTx genQ@MainQuery{..} conf@AppConfig{..} AuthResult{..} apiReq (Db plan) sCache =
  DbTx $ SQL.transactionNoRetry isoLvl txMode $ runExceptT dbHandler
  where
    isoLvl = planIsoLvl conf authRole plan
    txMode = planTxMode plan
    dbHandler = do
      lift $
        SQL.statement mempty $
          SQL.dynamicallyParameterized
            mqTxVars
            HD.noResult
            configDbPreparedStatements
      lift $ whenJust mqPreReq $ \q ->
        SQL.statement mempty $
          SQL.dynamicallyParameterized
            q
            HD.noResult
            configDbPreparedStatements
      actionResult genQ plan conf apiReq sCache

planTxMode :: DbActionPlan -> SQL.Mode
planTxMode (DbCrud _ x) = pTxMode x
planTxMode (MayUseDb x) = ipTxmode x

planIsoLvl :: AppConfig -> ByteString -> DbActionPlan -> SQL.IsolationLevel
planIsoLvl AppConfig{configRoleIsoLvl} role actPlan = case actPlan of
  DbCrud _ CallReadPlan{crProc} -> fromMaybe roleIsoLvl $ pdIsoLvl crProc
  _ -> roleIsoLvl
  where
    roleIsoLvl = HM.findWithDefault SQL.ReadCommitted role configRoleIsoLvl

actionResult :: MainQuery -> DbActionPlan -> AppConfig -> ApiRequest -> SchemaCache -> ExceptT Error SQL.Transaction DbResult
actionResult MainQuery{..} (DbCrud True plan) conf@AppConfig{..} apiReq _ = do
  explRes <- lift $ SQL.statement mempty $ SQL.dynamicallyParameterized mqMain planRow configDbPreparedStatements
  optionalRollback conf apiReq
  pure $ DbPlanResult (pMedia plan) explRes
actionResult MainQuery{..} (DbCrud _ plan@WrappedReadPlan{..}) conf@AppConfig{..} apiReq@ApiRequest{iPreferences = Preferences{..}} _ = do
  resultSet@RSStandard{rsTableTotal = tableTotal} <- lift $ SQL.statement mempty $ dynStmt (HD.singleRow $ standardRow True)
  failNotSingular pMedia resultSet
  optionalRollback conf apiReq
  explainTotal <-
    lift . fmap join $
      traverse
        ( \snip ->
            SQL.statement mempty $ SQL.dynamicallyParameterized snip decodeExplain configDbPreparedStatements
        )
        mqExplain

  pure $
    DbCrudResult
      plan
      resultSet
        { rsTableTotal = case preferCount of
            Just PlannedCount -> explainTotal
            Just EstimatedCount ->
              if tableTotal > (fromIntegral <$> configDbMaxRows) then
                max <$> tableTotal <*> explainTotal
              else
                tableTotal
            _ -> tableTotal
        }
  where
    dynStmt decod = SQL.dynamicallyParameterized mqMain decod configDbPreparedStatements

    decodeExplain :: HD.Result (Maybe Int64)
    decodeExplain =
      let row = HD.singleRow $ column HD.bytea
      in  (^? L.nth 0 . L.key "Plan" . L.key "Plan Rows" . L._Integral) <$> row
actionResult MainQuery{..} (DbCrud _ plan@MutateReadPlan{..}) conf@AppConfig{..} apiReq@ApiRequest{iPreferences = Preferences{..}} _ = do
  resultSet <- lift $ SQL.statement mempty $ dynStmt decodeRow
  failMutation resultSet
  optionalRollback conf apiReq
  pure $ DbCrudResult plan resultSet
  where
    dynStmt decod = SQL.dynamicallyParameterized mqMain decod configDbPreparedStatements
    failMutation resultSet = case mrMutation of
      MutationCreate -> do
        failNotSingular pMedia resultSet
      MutationUpdate -> do
        failNotSingular pMedia resultSet
        failExceedsMaxAffectedPref (preferMaxAffected, preferHandling) resultSet
      MutationSingleUpsert -> do
        failPut resultSet
      MutationDelete -> do
        failNotSingular pMedia resultSet
        failExceedsMaxAffectedPref (preferMaxAffected, preferHandling) resultSet
    decodeRow = fromMaybe (RSStandard Nothing 0 mempty mempty Nothing Nothing Nothing) <$> HD.rowMaybe (standardRow False)
actionResult MainQuery{..} (DbCrud _ plan@CallReadPlan{..}) conf@AppConfig{..} apiReq@ApiRequest{iPreferences = Preferences{..}} _ = do
  resultSet <- lift $ SQL.statement mempty $ dynStmt decodeRow
  optionalRollback conf apiReq
  failNotSingular pMedia resultSet
  failExceedsMaxAffectedPref (preferMaxAffected, preferHandling) resultSet
  pure $ DbCrudResult plan resultSet
  where
    dynStmt decod = SQL.dynamicallyParameterized mqMain decod configDbPreparedStatements
    decodeRow = fromMaybe (RSStandard (Just 0) 0 mempty mempty Nothing Nothing Nothing) <$> HD.rowMaybe (standardRow True)
actionResult MainQuery{mqOpenAPI = (tblsQ, funcsQ, schQ)} (MayUseDb plan@InspectPlan{ipSchema = tSchema}) AppConfig{..} _ sCache =
  mainActionQuery
  where
    mainActionQuery = lift $
      case configOpenApiMode of
        OAFollowPriv -> do
          tableAccess <- SQL.statement mempty $ SQL.dynamicallyParameterized tblsQ decodeAccessibleIdentifiers configDbPreparedStatements
          accFuncs <- SQL.statement mempty $ SQL.dynamicallyParameterized funcsQ SchemaCache.decodeFuncs configDbPreparedStatements
          schDesc <- SQL.statement mempty $ SQL.dynamicallyParameterized schQ decodeSchemaDesc configDbPreparedStatements
          let tbls = HM.filterWithKey (\qi _ -> S.member qi tableAccess) $ SchemaCache.dbTables sCache

          pure $ MaybeDbResult plan (Just (tbls, accFuncs, schDesc))
        OAIgnorePriv -> do
          schDesc <- SQL.statement mempty (SQL.dynamicallyParameterized schQ decodeSchemaDesc configDbPreparedStatements)

          let
            tbls = HM.filterWithKey (\(QualifiedIdentifier sch _) _ -> sch == tSchema) (SchemaCache.dbTables sCache)
            routs = HM.filterWithKey (\(QualifiedIdentifier sch _) _ -> sch == tSchema) (SchemaCache.dbRoutines sCache)

          pure $ MaybeDbResult plan (Just (tbls, routs, schDesc))
        OADisabled ->
          pure $ MaybeDbResult plan Nothing

    decodeSchemaDesc :: HD.Result (Maybe Text)
    decodeSchemaDesc = join <$> HD.rowMaybe (nullableColumn HD.text)

    decodeAccessibleIdentifiers :: HD.Result (S.Set QualifiedIdentifier)
    decodeAccessibleIdentifiers =
      let row =
            QualifiedIdentifier
              <$> column HD.text
              <*> column HD.text
      in  S.fromList <$> HD.rowList row

-- Makes sure the querystring pk matches the payload pk
-- e.g. PUT /items?id=eq.1 { "id" : 1, .. } is accepted,
-- PUT /items?id=eq.14 { "id" : 2, .. } is rejected.
-- If this condition is not satisfied then nothing is inserted,
-- check the WHERE for INSERT in QueryBuilder.hs to see how it's done
failPut :: ResultSet -> DbHandler ()
failPut RSStandard{rsQueryTotal = queryTotal} =
  when (queryTotal /= 1) $ do
    lift SQL.condemn
    throwError $ Error.ApiRequestErr Error.PutMatchingPkError

-- |
-- Fail a response if a single JSON object was requested and not exactly one
-- was found.
failNotSingular :: MediaType -> ResultSet -> DbHandler ()
failNotSingular mediaType RSStandard{rsQueryTotal = queryTotal} =
  when (elem mediaType [MTVndSingularJSON True, MTVndSingularJSON False] && queryTotal /= 1) $ do
    lift SQL.condemn
    throwError $ Error.ApiRequestErr . Error.SingularityError $ toInteger queryTotal

failExceedsMaxAffectedPref :: (Maybe PreferMaxAffected, Maybe PreferHandling) -> ResultSet -> DbHandler ()
failExceedsMaxAffectedPref (Nothing, _) _ = pure ()
failExceedsMaxAffectedPref (Just (PreferMaxAffected n), handling) RSStandard{rsQueryTotal = queryTotal} = when ((queryTotal > n) && (handling == Just Strict)) $ do
  lift SQL.condemn
  throwError $ Error.ApiRequestErr . Error.MaxAffectedViolationError $ toInteger queryTotal

-- | Set a transaction to roll back if requested
optionalRollback :: AppConfig -> ApiRequest -> DbHandler ()
optionalRollback AppConfig{..} ApiRequest{iPreferences = Preferences{..}} = do
  lift $ when (shouldRollback || (configDbTxRollbackAll && not shouldCommit)) $ do
    SQL.sql "SET CONSTRAINTS ALL IMMEDIATE"
    SQL.condemn
  where
    shouldCommit =
      preferTransaction == Just Commit
    shouldRollback =
      preferTransaction == Just Rollback

-- | We use rowList because when doing EXPLAIN (FORMAT TEXT), the result comes as many rows. FORMAT JSON comes as one.
planRow :: HD.Result BS.ByteString
planRow = BS.unlines <$> HD.rowList (column HD.bytea)

column :: HD.Value a -> HD.Row a
column = HD.column . HD.nonNullable

nullableColumn :: HD.Value a -> HD.Row (Maybe a)
nullableColumn = HD.column . HD.nullable

arrayColumn :: HD.Value a -> HD.Row [a]
arrayColumn = column . HD.listArray . HD.nonNullable

standardRow :: Bool -> HD.Row ResultSet
standardRow noLocation =
  RSStandard <$> nullableColumn HD.int8
    <*> column HD.int8
    <*> (if noLocation then pure mempty else fmap splitKeyValue <$> arrayColumn HD.bytea)
    <*> (fromMaybe mempty <$> nullableColumn HD.bytea)
    <*> nullableColumn HD.bytea
    <*> nullableColumn HD.text
    <*> nullableColumn HD.int8
  where
    splitKeyValue :: ByteString -> (ByteString, ByteString)
    splitKeyValue kv =
      let (k, v) = BS.break (== '=') kv
      in  (k, BS.tail v)
