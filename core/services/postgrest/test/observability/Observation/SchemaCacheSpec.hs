{-# LANGUAGE DataKinds #-}
{-# LANGUAGE MonadComprehensions #-}
{-# LANGUAGE NamedFieldPuns #-}

module Observation.SchemaCacheSpec where

import Network.Wai (Application)
import Protolude
import Test.Hspec (SpecWith, describe, it)
import Test.Hspec.Wai (getState)

import ObsHelper
import PostgREST.Config (configDbSchemas)
import PostgREST.Observation

import PostgREST.AppState qualified as AppState

spec :: SpecWith (SpecState, Application)
spec = describe "Server started with metrics enabled" $ do
  it "Should emit PoolFlushed, SchemaCacheQueriedObs and SchemaCacheLoadedObs when schema cache is reloaded" $ do
    SpecState{specAppState = appState, specObsChan} <- getState
    let waitFor = waitForObs specObsChan

    liftIO $ do
      AppState.schemaCacheLoader appState

      waitFor (1 * sec) "PoolFlushed" $ \x -> [o | o@PoolFlushed <- pure x]
      waitFor (1 * sec) "SchemaCacheQueriedObs" $ \x -> [o | o@SchemaCacheQueriedObs{} <- pure x]
      waitFor (1 * sec) "SchemaCacheLoadedObs" $ \x -> [o | o@SchemaCacheLoadedObs{} <- pure x]

  it "Should flush pool once when schema reloading retries" $ do
    SpecState{specAppState = appState, specObsChan} <- getState
    let waitFor = waitForObs specObsChan

    liftIO $ do
      AppState.getConfig appState >>= \cfg -> do
        AppState.putConfig appState $ cfg{configDbSchemas = pure "bad_schema"}
        AppState.schemaCacheLoader appState

        waitFor (1 * sec) "SchemaCacheErrorObs" $ \x -> [o | o@SchemaCacheErrorObs{} <- pure x]

        -- Restore configuration
        AppState.putConfig appState cfg

      -- Wait for 2 seconds so that retry can happen
      waitFor (2 * sec) "PoolFlushed" $ \x -> [o | o@PoolFlushed <- pure x]
      waitFor (1 * sec) "SchemaCacheQueriedObs" $ \x -> [o | o@SchemaCacheQueriedObs{} <- pure x]
      waitFor (1 * sec) "SchemaCacheLoadedObs" $ \x -> [o | o@SchemaCacheLoadedObs{} <- pure x]
  where
    sec = 1_000_000
