{-# LANGUAGE DataKinds #-}
{-# LANGUAGE MonadComprehensions #-}
{-# LANGUAGE NamedFieldPuns #-}

module Observation.MetricsSpec where

import Data.List (lookup)
import Network.Wai (Application)
import Prometheus (getCounter, getVectorWith)
import Protolude
import Test.Hspec (SpecWith, describe, it)
import Test.Hspec.Wai (getState)

import ObsHelper
import PostgREST.Config (AppConfig (configDbSchemas))
import PostgREST.Metrics
  ( ConnStats (..)
  , MetricsState (..)
  , connectionCounts
  )
import PostgREST.Observation

import Hasql.Pool.Observation qualified as SQL
import PostgREST.AppState qualified as AppState

spec :: SpecWith (SpecState, Application)
spec = describe "Server started with metrics enabled" $ do
  it "Should update pgrst_schema_cache_loads_total[SUCCESS]" $ do
    SpecState{specAppState = appState, specMetrics = metrics, specObsChan} <- getState
    let waitFor = waitForObs specObsChan

    liftIO
      $ checkState'
        metrics
        [ schemaCacheLoads "SUCCESS" (+ 1)
        ]
      $ do
        AppState.schemaCacheLoader appState
        waitFor (1 * sec) "SchemaCacheLoadedObs" $ \x -> [o | o@(SchemaCacheLoadedObs{}) <- pure x]

  it "Should update pgrst_schema_cache_loads_total[ERROR]" $ do
    SpecState{specAppState = appState, specMetrics = metrics, specObsChan} <- getState
    let waitFor = waitForObs specObsChan

    liftIO
      $ checkState'
        metrics
        [ schemaCacheLoads "FAIL" (+ 1)
        , schemaCacheLoads "SUCCESS" (+ 1)
        ]
      $ do
        AppState.getConfig appState >>= \prev -> do
          AppState.putConfig appState $ prev{configDbSchemas = pure "bad_schema"}
          AppState.schemaCacheLoader appState
          waitFor (1 * sec) "SchemaCacheErrorObs" $ \x -> [o | o@(SchemaCacheErrorObs{}) <- pure x]
          AppState.putConfig appState prev

        -- wait up to 2 secs so that retry can happen
        waitFor (2 * sec) "SchemaCacheLoadedObs" $ \x -> [o | o@(SchemaCacheLoadedObs{}) <- pure x]

  it "Should debounce schema cache loads" $ do
    SpecState{specAppState = appState, specMetrics = metrics, specObsChan} <- getState
    let waitFor = waitForObs specObsChan

    liftIO
      $ checkState'
        metrics
        [ -- we expect exactly 2 successful schema cache loads
          schemaCacheLoads "FAIL" (+ 0)
        , schemaCacheLoads "SUCCESS" (+ 2)
        ]
      $ do
        AppState.schemaCacheLoader appState
        -- at this moment there is no dedicated observation emited
        -- when schema cache load starts
        -- so we wait for DBConnectedObs which is emited right after successful
        -- PostgreSQL version query during schema cache loading
        waitFor (1 * sec) "DBConnectedObs" $ \x -> [o | o@(DBConnectedObs{}) <- pure x]
        -- request schema cache load multiple times
        -- all of them should be handled by a single schema cache load
        replicateM_ 100 (AppState.schemaCacheLoader appState)
        -- wait for two expected SchemaCacheLoadedObs events
        replicateM_ 2 $ waitFor (1 * sec) "SchemaCacheLoadedObs" $ \x -> [o | o@(SchemaCacheLoadedObs{}) <- pure x]
        -- wait 1 sec to make sure we capture all potential schema cache loads
        -- (there should be none but we need to verify that)
        threadDelay $ 1 * sec

  -- The test verifies we properly count in use connections
  -- The idea is to fork a worker thread that
  -- borrows connection from the pool and waits for a signal to release it
  -- Main thread checks that
  -- in use connections counter is incremented by worker
  -- then it signals the worker to release the connection
  -- and finally verifies that in use connection counter is back to original value
  it "Should track in use connections" $ do
    SpecState{specAppState = appState, specMetrics = metrics, specObsChan} <- getState
    let waitFor = waitForObs specObsChan

    liftIO
      $ checkState'
        metrics
        [ -- we expect in use connections to be the same once finished
          inUseConnections (+ 0)
        ]
      $ do
        signal <- newEmptyMVar
        -- make sure waiting thread is signaled
        (`finally` tryPutMVar signal ())
          $
          -- expecting one more connection in use
          checkState'
            metrics
            [ inUseConnections (+ 1)
            ]
          $ do
            -- start a thread hanging on a single connection until signaled
            void $ forkIO $ void $ AppState.usePool appState $ liftIO (readMVar signal)
            -- main thread waits for ConnectionObservation with InUseConnectionStatus
            -- after which used connections count should be incremented
            waitFor (1 * sec) "InUseConnectionStatus" $ \x -> [o | o@(HasqlPoolObs (SQL.ConnectionObservation _ SQL.InUseConnectionStatus)) <- pure x]

        -- hanging thread was signaled and should return the connection
        waitFor (1 * sec) "ReadyForUseConnectionStatus" $ \x -> [o | o@(HasqlPoolObs (SQL.ConnectionObservation _ (SQL.ReadyForUseConnectionStatus _))) <- pure x]
  where
    -- prometheus-client api to handle vectors is convoluted
    schemaCacheLoads label =
      expectField @"schemaCacheLoads" $
        fmap (maybe (0 :: Int) round . lookup label) . (`getVectorWith` getCounter)
    inUseConnections = expectField @"connTrack" ((inUse <$>) . connectionCounts)
    sec = 1000000
