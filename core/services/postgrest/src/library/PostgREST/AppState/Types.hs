{-# LANGUAGE DeriveAnyClass #-}

-- |
-- Module      : PostgREST.AppState.Types
-- Description : AppState data type and stateful functions
module PostgREST.AppState.Types where

import Control.Concurrent.STM (TMVar)
import Data.IORef (IORef, atomicWriteIORef, readIORef)
import Data.Time.Clock (UTCTime)
import Protolude

import PostgREST.Auth.JwtCache (JwtCacheState)
import PostgREST.Config (AppConfig (..))
import PostgREST.Config.PgVersion (PgVersion (..))
import PostgREST.Observation
import PostgREST.SchemaCache (SchemaCache (..))

import Hasql.Pool qualified as SQL
import PostgREST.Auth.JwtCache qualified as JwtCache
import PostgREST.Logger qualified as Logger
import PostgREST.Metrics qualified as Metrics

data AppState = AppState
  { statePool :: SQL.Pool
  -- ^ Database connection pool
  , statePgVersion :: IORef PgVersion
  -- ^ Database server version
  , stateSchemaCache :: IORef (Maybe SchemaCache)
  -- ^ Schema cache
  , stateSCacheStatus :: SchemaCacheStatus
  -- ^ The schema cache status
  , stateIsListenerOn :: IORef Bool
  -- ^ State of the LISTEN channel
  , stateListenerThreadId :: IORef (Maybe ThreadId)
  -- ^ Listener Thread ID
  , debouncedSCacheLoader :: IO ()
  -- ^ starts the connection worker with a debounce
  , stateConf :: IORef AppConfig
  -- ^ Config that can change at runtime
  , stateGetTime :: IO UTCTime
  -- ^ Time used for verifying JWT expiration
  , stateKillApp :: IO ()
  -- ^ Used for killing the main thread in case a subthread fails
  , stateNextDelay :: IORef Int
  -- ^ Keeps track of the next delay for db connection retry
  , stateObserver :: ObservationHandler
  -- ^ Observation handler
  , stateJwtCache :: JwtCache.JwtCacheState
  -- ^ JWT Cache
  , stateLogger :: Logger.LoggerState
  , stateMetrics :: Metrics.MetricsState
  }

-- | Schema cache status.
-- Empty means initial loading on startup, False means pending and True means loaded.
-- "Initial" state is needed so that we can wait with application socket listening
-- until after initial schema cache querying.
newtype SchemaCacheStatus = SchemaCacheStatus
  { getSCStatusTMVar :: TMVar Bool
  }

-- |
-- We define a custom exception and throw this on listener reload. The
-- KillThread exception can occur in an unexpected scenario, so we should
-- avoid using that.
data ListenerException = ListenerRestart deriving (Exception, Show)

getPgVersion :: AppState -> IO PgVersion
getPgVersion = readIORef . statePgVersion

putPgVersion :: AppState -> PgVersion -> IO ()
putPgVersion = atomicWriteIORef . statePgVersion

getSchemaCache :: AppState -> IO (Maybe SchemaCache)
getSchemaCache = readIORef . stateSchemaCache

putSchemaCache :: AppState -> Maybe SchemaCache -> IO ()
putSchemaCache appState = atomicWriteIORef (stateSchemaCache appState)

schemaCacheLoader :: AppState -> IO ()
schemaCacheLoader = debouncedSCacheLoader

getNextDelay :: AppState -> IO Int
getNextDelay = readIORef . stateNextDelay

getConfig :: AppState -> IO AppConfig
getConfig = readIORef . stateConf

putConfig :: AppState -> AppConfig -> IO ()
putConfig = atomicWriteIORef . stateConf

getTime :: AppState -> IO UTCTime
getTime = stateGetTime

getJwtCacheState :: AppState -> JwtCacheState
getJwtCacheState = stateJwtCache

killApp :: AppState -> IO ()
killApp = stateKillApp

putIsListenerOn :: AppState -> Bool -> IO ()
putIsListenerOn = atomicWriteIORef . stateIsListenerOn

getListenerThreadId :: AppState -> IO (Maybe ThreadId)
getListenerThreadId = readIORef . stateListenerThreadId

putListenerThreadId :: AppState -> Maybe ThreadId -> IO ()
putListenerThreadId = atomicWriteIORef . stateListenerThreadId

getObserver :: AppState -> ObservationHandler
getObserver = stateObserver
