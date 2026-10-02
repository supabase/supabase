{-# LANGUAGE NamedFieldPuns #-}
{-# LANGUAGE RecordWildCards #-}
{-# LANGUAGE RecursiveDo #-}

module PostgREST.AppState
  ( AppState
  , destroy
  , getConfig
  , getSchemaCache
  , getPgVersion
  , getNextDelay
  , getTime
  , getJwtCacheState
  , init
  , initWithPool
  , killApp
  , putConfig -- For tests TODO refactoring
  , putSchemaCache
  , putPgVersion
  , putIsListenerOn
  , usePool
  , readInDbConfig
  , schemaCacheLoader
  , getObserver
  , isLoaded
  , isPending
  , waitForSchemaCacheInit
  , waitForSchemaCacheLoaded
  )
where

import Control.Concurrent.STM (newEmptyTMVarIO)
import Data.IORef (IORef, newIORef, readIORef)
import Data.Time.Clock (getCurrentTime)
import Protolude

import PostgREST.AppState.Pool (destroy, initPool, usePool)
import PostgREST.AppState.Reload
  ( isSchemaCacheLoaded
  , readInDbConfig
  , retryingSchemaCacheLoad
  , waitForSchemaCacheInit
  , waitForSchemaCacheLoaded
  )
import PostgREST.AppState.Types
import PostgREST.Config (AppConfig (..))
import PostgREST.Config.PgVersion (minimumPgVersion)
import PostgREST.Debounce (makeDebouncer)
import PostgREST.Observation
import PostgREST.Version (prettyVersion)

import Hasql.Pool qualified as SQL
import Hasql.Session qualified as SQL
import PostgREST.Auth.JwtCache qualified as JwtCache
import PostgREST.Logger qualified as Logger
import PostgREST.Metrics qualified as Metrics

init :: AppConfig -> IO () -> IO AppState
init conf@AppConfig{configDbPoolSize} appKiller = do
  -- We need to create IORef first, so we can make its read action part of
  -- loggerState. This is needed for log-level config reloading.
  confRef <- newIORef conf
  loggerState <- Logger.init (configLogLevel <$> readIORef confRef)
  metricsState <- Metrics.init configDbPoolSize
  let observer = liftA2 (>>) (Logger.observationLogger loggerState) (Metrics.observationMetrics metricsState)

  observer $ AppStartObs prettyVersion

  pool <- initPool conf observer
  initWithPool pool confRef loggerState metricsState observer appKiller

initWithPool :: SQL.Pool -> IORef AppConfig -> Logger.LoggerState -> Metrics.MetricsState -> ObservationHandler -> IO () -> IO AppState
initWithPool pool confRef loggerState metricsState observer appKiller = mdo
  conf <- readIORef confRef
  appState <-
    AppState pool
      <$> newIORef minimumPgVersion -- assume we're in a supported version when starting, this will be corrected on a later step
      <*> newIORef Nothing
      <*> newSchemaCacheStatus
      <*> newIORef False
      <*> newIORef Nothing
      <*> makeDebouncer (retryingSchemaCacheLoad appState *> threadDelay 100000) -- 100ms cooldown
      <*> pure confRef
      <*> pure getCurrentTime
      <*> pure appKiller
      <*> newIORef 0
      <*> pure observer
      <*> JwtCache.init conf observer
      <*> pure loggerState
      <*> pure metricsState

  return appState

isConnEstablished :: AppState -> IO Bool
isConnEstablished appState = do
  AppConfig{..} <- getConfig appState
  if configDbChannelEnabled then -- if the listener is enabled, we can be sure the connection is up
    readIORef $ stateIsListenerOn appState
  else -- otherwise the only way to check the connection is to make a query
    isRight <$> usePool appState (SQL.sql "SELECT 1")

isLoaded :: AppState -> IO Bool
isLoaded x = do
  scacheLoaded <- isSchemaCacheLoaded x
  connEstablished <- isConnEstablished x
  return $ scacheLoaded && connEstablished

isPending :: AppState -> IO Bool
isPending x = do
  scacheLoaded <- isSchemaCacheLoaded x
  connEstablished <- isConnEstablished x
  return $ not scacheLoaded || not connEstablished

newSchemaCacheStatus :: IO SchemaCacheStatus
newSchemaCacheStatus = SchemaCacheStatus <$> newEmptyTMVarIO
