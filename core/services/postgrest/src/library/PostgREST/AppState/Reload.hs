{-# LANGUAGE LambdaCase #-}
{-# LANGUAGE MultiWayIf #-}
{-# LANGUAGE NamedFieldPuns #-}
{-# LANGUAGE RecordWildCards #-}

module PostgREST.AppState.Reload
  ( isSchemaCacheLoaded
  , readInDbConfig
  , retryingSchemaCacheLoad
  , runListener
  , waitForSchemaCacheInit
  , waitForSchemaCacheLoaded
  )
where

import Control.Arrow ((&&&))
import Control.Concurrent.STM (putTMVar, readTMVar, tryReadTMVar, tryTakeTMVar)
import Control.Retry
  ( RetryPolicy
  , RetryStatus (..)
  , capDelay
  , exponentialBackoff
  , retrying
  , rsPreviousDelay
  )
import Data.Bitraversable (bisequence)
import Data.Either.Combinators (whenRight)
import Data.IORef (IORef, newIORef, readIORef, writeIORef)
import Protolude

import Data.ByteString.Char8 qualified as BS
import Data.Text qualified as T
import Database.PostgreSQL.LibPQ qualified as LibPQ

import PostgREST.AppState.Pool (flushPool, usePool)
import PostgREST.AppState.Types
import PostgREST.Auth.JwtCache (update)
import PostgREST.Catalog.Identifiers (quoteQi)
import PostgREST.Config (AppConfig (..), readAppConfig)
import PostgREST.Config.Database
  ( queryDbSettings
  , queryPgVersion
  , queryRoleSettings
  )
import PostgREST.Config.PgVersion (PgVersion (..), minimumPgVersion)
import PostgREST.Observation (Observation (..))
import PostgREST.SchemaCache
  ( SchemaCache (..)
  , querySchemaCache
  , schemaCacheQueries
  , showSummary
  )
import PostgREST.TimeIt (timeItT)

import Hasql.Connection qualified as SQL
import Hasql.Notifications qualified as SQL
import Hasql.Session qualified as SQL
import Hasql.Transaction.Sessions qualified as SQL
import PostgREST.Config qualified as Config

-- | Try to load the schema cache and retry if it fails.
--
-- This is done by repeatedly: 1) flushing the pool, 2) querying the version and validating that the postgres version is supported by us, and 3) loading the schema cache.
-- It's necessary to flush the pool:
--
-- + Because connections cache the pg catalog(see #2620)
-- + For rapid recovery. Otherwise, the pool idle or lifetime timeout would have to be reached for new healthy connections to be acquired.
retryingSchemaCacheLoad :: AppState -> IO ()
retryingSchemaCacheLoad appState@AppState{stateObserver = observer} =
  void $
    retrying
      retryPolicy
      shouldRetry
      ( \RetryStatus{rsIterNumber, rsPreviousDelay} -> do
          when (rsIterNumber > 0) $ do
            let delay = fromMaybe 0 rsPreviousDelay `div` oneSecondInUs
            observer $ ConnectionRetryObs delay

          (,) <$> qPgVersion <*> (qInDbConfig *> qSchemaCache)
      )
  where
    qPgVersion :: IO (Maybe PgVersion)
    qPgVersion = do
      AppConfig{..} <- getConfig appState
      pgVersion <- usePool appState queryPgVersion
      case pgVersion of
        Left e -> do
          observer $ QueryPgVersionError e
          unless configDbPoolAutomaticRecovery $ do
            observer ExitDBNoRecoveryObs
            killApp appState
          return Nothing
        Right actualPgVersion ->
          if actualPgVersion < minimumPgVersion then do
            observer $ ExitUnsupportedPgVersion actualPgVersion minimumPgVersion
            killApp appState
            return Nothing
          else do
            observer $ DBConnectedObs $ pgvFullName actualPgVersion
            observer $ PoolInit configDbPoolSize
            putPgVersion appState actualPgVersion
            return $ Just actualPgVersion

    qInDbConfig :: IO ()
    qInDbConfig = do
      AppConfig{..} <- getConfig appState
      when configDbConfig $ readInDbConfig False appState

    qSchemaCache :: IO (Maybe SchemaCache)
    qSchemaCache = do
      conf@AppConfig{..} <- getConfig appState
      pgVer <- getPgVersion appState
      (resultTime, result) <-
        timeItT $ usePool appState (SQL.transactionNoRetry SQL.ReadCommitted SQL.Read $ querySchemaCache pgVer conf)
      when configLogQuery $
        observer $
          SchemaCacheQueryObs (schemaCacheQueries pgVer conf)
      case result of
        Left e -> do
          markSchemaCachePending appState
          observer $ SchemaCacheErrorObs configDbSchemas configDbExtraSearchPath e
          return Nothing
        Right (sCache, queryTimings) -> do
          -- IMPORTANT: While the pending schema cache state starts from running the above querySchemaCache, only at this stage we block API requests due to the usage of an
          -- IORef on putSchemaCache. This is why schema cache status is marked as pending here to signal the Admin server (using isPending) that we're on a recovery state.
          markSchemaCachePending appState
          putSchemaCache appState $ Just sCache
          (loadTime, summary) <- timeItT (evaluate $ showSummary sCache)
          -- Flush the pool after loading the schema cache to reset any stale session cache entries
          -- We do it after successfully querying the schema cache (because this can fail and during retries we would flush the pool repeatedly unnecessarily)
          -- and after marking sCacheStatus as pending,
          flushPool appState
          observer $ SchemaCacheQueriedObs resultTime queryTimings
          observer $ SchemaCacheLoadedObs loadTime summary
          markSchemaCacheLoaded appState
          return $ Just sCache

    shouldRetry :: RetryStatus -> (Maybe PgVersion, Maybe SchemaCache) -> IO Bool
    shouldRetry _ (pgVer, sCache) = do
      AppConfig{..} <- getConfig appState
      let itShould = configDbPoolAutomaticRecovery && (isNothing pgVer || isNothing sCache)
      return itShould

    retryPolicy :: RetryPolicy
    retryPolicy =
      let delayMicroseconds = 32 * oneSecondInUs {-32 seconds-}
      in  capDelay delayMicroseconds $ exponentialBackoff oneSecondInUs

    oneSecondInUs = 1_000_000 -- one second in microseconds

markSchemaCachePending :: AppState -> IO ()
markSchemaCachePending = atomically . liftA2 (*>) tryTakeTMVar (`putTMVar` False) . getSCStatusTMVar . stateSCacheStatus

markSchemaCacheLoaded :: AppState -> IO ()
markSchemaCacheLoaded = atomically . liftA2 (*>) tryTakeTMVar (`putTMVar` True) . getSCStatusTMVar . stateSCacheStatus

isSchemaCacheLoaded :: AppState -> IO Bool
isSchemaCacheLoaded = atomically . (pure . fromMaybe False <=< tryReadTMVar) . getSCStatusTMVar . stateSCacheStatus

-- | Wait for initial schema cache load to either finish or retry
-- | We wait until scStatusTMVar is not empty.
waitForSchemaCacheInit :: AppState -> IO ()
waitForSchemaCacheInit = atomically . void . readTMVar . getSCStatusTMVar . stateSCacheStatus

waitForSchemaCacheLoaded :: AppState -> IO ()
waitForSchemaCacheLoaded = atomically . (check <=< readTMVar) . getSCStatusTMVar . stateSCacheStatus

-- | Reads the in-db config and reads the config file again
-- | We don't retry reading the in-db config after it fails immediately, because it could have user errors. We just report the error and continue.
readInDbConfig :: Bool -> AppState -> IO ()
readInDbConfig startingUp appState@AppState{stateObserver = observer} = do
  oldConf <- getConfig appState
  pgVer <- getPgVersion appState
  dbSettings <-
    if configDbConfig oldConf then do
      qDbSettings <- usePool appState (queryDbSettings (quoteQi <$> configDbPreConfig oldConf))
      case qDbSettings of
        Left e -> do
          observer $ ConfigReadErrorObs e
          pure mempty
        Right x -> pure x
    else
      pure mempty
  (roleSettings, roleIsolationLvl) <-
    if configDbConfig oldConf then do
      rSettings <- usePool appState (queryRoleSettings pgVer)
      case rSettings of
        Left e -> do
          observer $ QueryRoleSettingsErrorObs e
          pure (mempty, mempty)
        Right x -> pure x
    else
      pure mempty
  readAppConfig dbSettings (configFilePath oldConf) (Just $ configDbUri oldConf) roleSettings roleIsolationLvl >>= \case
    Left err ->
      if startingUp then
        panic err -- die on invalid config if the program is starting up
      else
        observer $ ConfigInvalidObs err
    Right newConf -> do
      putConfig appState newConf
      -- After the config has reloaded, jwt-secret might have changed, so
      -- if it has changed, it is important to invalidate the jwt cache
      -- entries, because they were cached using the old secret
      update (getJwtCacheState appState) newConf

      -- If db-channel-enabled is changed, then reload listener
      when (((/=) `on` configDbChannelEnabled) newConf oldConf) $ do
        -- 1. Kill the listener thread
        getListenerThreadId appState >>= mapM_ (`throwTo` ListenerRestart)
        putIsListenerOn appState False
        -- 2. Restart listener
        runListener appState

      if startingUp then
        pass
      else
        observer ConfigSucceededObs

-- | Starts the Listener in a thread
runListener :: AppState -> IO ()
runListener appState = do
  AppConfig{..} <- getConfig appState
  when configDbChannelEnabled $ do
    nextDelay <- newIORef 1
    listenerThreadId <- forkIO . void $ retryingListen appState nextDelay False
    putListenerThreadId appState (Just listenerThreadId)

-- | Starts a LISTEN connection and handles notifications. It recovers with exponential backoff with a cap of 32 seconds, if the LISTEN connection is lost.
-- | This function never returns (but can throw) and return type enforces that.
retryingListen :: AppState -> IORef Int -> Bool -> IO ()
retryingListen appState nextDelay hasDbListenerBug = do
  cfg@AppConfig{..} <- getConfig appState
  let
    dbChannel = toS configDbChannel

    onError err = case fromException err of
      Just ListenerRestart -> traverse_ killThread =<< getListenerThreadId appState
      Nothing -> do
        -- for any other exception
        putIsListenerOn appState False
        observer $ DBListenFail dbChannel (Right err)
        when (isDbListenerBug err) $
          observer DBListenBugCallQueryFix
        unless configDbPoolAutomaticRecovery $
          killApp appState

        -- retry the listener
        delay <- readIORef nextDelay
        observer $ DBListenRetry delay
        threadDelay (delay * oneSecondInMicro)
        unless (delay == maxDelay) $
          writeIORef nextDelay (delay * 2)
        -- loop running the listener
        retryingListen appState nextDelay (isDbListenerBug err)

  -- Execute the listener with error handling
  handle onError $ do
    -- Make sure we don't leak connections on errors
    bracket
      -- acquire connection
      ( SQL.acquire $
          Config.toConnectionSettings Config.addTargetSessionAttrs cfg
      )
      -- release connection
      (`whenRight` releaseConnection)
      $
      -- use connection
      \case
        Right db -> do
          (pqHost, pqPort) <- SQL.withLibPQConnection db $ bisequence . (LibPQ.host &&& LibPQ.port)
          pgFullName <- SQL.run queryPgVersion db >>= either throwIO (pure . pgvFullName)
          when hasDbListenerBug $ SQL.run callNotifQueryUsage db >>= either throwIO pure
          SQL.listen db $ SQL.toPgIdentifier dbChannel

          putIsListenerOn appState True

          delay <- readIORef nextDelay
          when (delay > 1) $ do
            -- if we did a retry
            -- assume we lost notifications, refresh the schema cache
            schemaCacheLoader appState
            -- reset the delay
            writeIORef nextDelay 1

          observer $ DBListenStart pqHost pqPort pgFullName dbChannel

          -- wait for notifications
          -- this will never return, in case of an error it will throw and be caught by onError
          forever $ SQL.waitForNotifications handleNotification db
        Left err -> do
          observer $ DBListenFail dbChannel (Left err)
          exitFailure
  where
    observer = getObserver appState
    oneSecondInMicro = 1_000_000
    maxDelay = 32

    handleNotification channel msg =
      if
        | BS.null msg -> observer (DBListenerGotSCacheMsg channel) >> cacheReloader
        | msg == "reload schema" -> observer (DBListenerGotSCacheMsg channel) >> cacheReloader
        | msg == "reload config" -> observer (DBListenerGotConfigMsg channel) >> readInDbConfig False appState
        | otherwise -> pure () -- Do nothing if anything else than an empty message is sent
    cacheReloader =
      schemaCacheLoader appState

    releaseConnection = void . forkIO . handle (observer . DBListenerConnectionCleanupFail) . SQL.release

    isDbListenerBug e = "could not access status of transaction" `T.isInfixOf` show e

    -- Used to fix a Postgres bug in the listener, see: https://github.com/PostgREST/postgrest/issues/3147#issuecomment-3494591361
    -- This query advances the async notification query tail, which solves this issue.
    callNotifQueryUsage :: SQL.Session ()
    callNotifQueryUsage = SQL.sql "SELECT pg_notification_queue_usage();"
