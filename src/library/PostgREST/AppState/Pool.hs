{-# LANGUAGE LambdaCase #-}
{-# LANGUAGE RecordWildCards #-}

module PostgREST.AppState.Pool
  ( destroy
  , initPool
  , flushPool
  , usePool
  )
where

import Data.Either.Combinators (whenLeft)
import Protolude

import Data.ByteString.Char8 qualified as BS
import Network.HTTP.Types.Status qualified as HTTP

import PostgREST.AppState.Types
import PostgREST.Config (AppConfig (..), toConnectionSettings)
import PostgREST.Observation

import Hasql.Pool qualified as SQL
import Hasql.Pool.Config qualified as SQL
import Hasql.Session qualified as SQL
import PostgREST.Error qualified as Error

-- | Destroy the pool on shutdown.
-- | Differs from flushPool in not emiting PoolFlushed observation.
destroy :: AppState -> IO ()
destroy AppState{..} = SQL.release statePool

initPool :: AppConfig -> ObservationHandler -> IO SQL.Pool
initPool cfg@AppConfig{..} observer = do
  SQL.acquire $
    SQL.settings
      [ SQL.size configDbPoolSize
      , SQL.acquisitionTimeout $ fromIntegral configDbPoolAcquisitionTimeout
      , SQL.agingTimeout $ fromIntegral configDbPoolMaxLifetime
      , SQL.idlenessTimeout $ fromIntegral configDbPoolMaxIdletime
      , SQL.staticConnectionSettings $ toConnectionSettings identity cfg
      , SQL.observationHandler $ observer . HasqlPoolObs
      ]

-- | Run an action with a database connection.
usePool :: AppState -> SQL.Session a -> IO (Either SQL.UsageError a)
usePool appState@AppState{stateObserver = observer, ..} sess = do
  observer PoolRequest

  res <- SQL.use statePool sess

  observer PoolRequestFullfilled

  whenLeft
    res
    ( \case
        SQL.AcquisitionTimeoutUsageError ->
          observer PoolAcqTimeoutObs
        err@(SQL.ConnectionUsageError e) ->
          let failureMessage = BS.unpack $ fromMaybe mempty e
          in  when (("FATAL:  password authentication failed" `isInfixOf` failureMessage) || ("no password supplied" `isInfixOf` failureMessage)) $ do
                observer $ ExitDBFatalError ServerAuthError err
                killApp appState
        err@(SQL.SessionUsageError (SQL.QueryError tpl _ (SQL.ResultError resultErr))) ->
          handleResultError err tpl resultErr
        err@(SQL.SessionUsageError (SQL.PipelineError (SQL.ResultError resultErr))) ->
          -- Passing the empty template will not work for schema cache queries, see TODO further below.
          handleResultError err mempty resultErr
        err@(SQL.SessionUsageError (SQL.QueryError _ _ (SQL.ClientError _))) ->
          -- An error on the client-side, usually indicates problems with connection
          observer $ QueryErrorCodeHighObs err
        SQL.SessionUsageError (SQL.PipelineError (SQL.ClientError _)) -> pure ()
    )

  return res
  where
    handleResultError err tpl resultErr = do
      case resultErr of
        SQL.UnexpectedResult{} -> do
          observer $ ExitDBFatalError ServerPgrstBug err
          killApp appState
        SQL.RowError{} -> do
          observer $ ExitDBFatalError ServerPgrstBug err
          killApp appState
        SQL.UnexpectedAmountOfRows{} -> do
          observer $ ExitDBFatalError ServerPgrstBug err
          killApp appState
        -- Check for a syntax error (42601 is the pg code) only for queries that don't have `WITH pgrst_source` as prefix.
        -- This would mean the error is on our schema cache queries, so we treat it as fatal.
        -- TODO have a better way to mark this as a schema cache query
        SQL.ServerError "42601" _ _ _ _ ->
          unless ("WITH pgrst_source" `BS.isPrefixOf` tpl) $ do
            observer $ ExitDBFatalError ServerPgrstBug err
            killApp appState
        -- Check for a "prepared statement <name> already exists" error (Code 42P05: duplicate_prepared_statement).
        -- This would mean that a connection pooler in transaction mode is being used
        -- while prepared statements are enabled in the PostgREST configuration,
        -- both of which are incompatible with each other.
        SQL.ServerError "42P05" _ _ _ _ -> do
          observer $ ExitDBFatalError ServerError42P05 err
          killApp appState
        -- Check for a "transaction blocks not allowed in statement pooling mode" error (Code 08P01: protocol_violation).
        -- This would mean that a connection pooler in statement mode is being used which is not supported in PostgREST.
        SQL.ServerError "08P01" "transaction blocks not allowed in statement pooling mode" _ _ _ -> do
          observer $ ExitDBFatalError ServerError08P01 err
          killApp appState
        SQL.ServerError{} ->
          when (Error.status (Error.PgError False err) >= HTTP.status500) $
            observer $
              QueryErrorCodeHighObs err

-- | Flush the connection pool so that any future use of the pool will
-- use connections freshly established after this call.
-- | Emits PoolFlushed observation
flushPool :: AppState -> IO ()
flushPool AppState{..} = do
  SQL.release statePool
  stateObserver PoolFlushed
