module Main where

import Data.Function (id)
import Data.IORef (newIORef, readIORef)
import Protolude hiding (toList, toS)
import Test.Hspec

import ObsHelper
import PostgREST.App (postgrest)
import PostgREST.Config
  ( AppConfig (..)
  , toConnectionSettings
  )
import PostgREST.Config.Database (queryPgVersion)
import PostgREST.Observation (Observation (HasqlPoolObs))
import PostgREST.SchemaCache (querySchemaCache)

import Hasql.Pool qualified as P
import Hasql.Pool.Config qualified as P
import Hasql.Transaction.Sessions qualified as HT
import Observation.JwtCache qualified
import Observation.MetricsSpec qualified
import Observation.SchemaCacheSpec qualified
import PostgREST.AppState qualified as AppState
import PostgREST.Logger qualified as Logger
import PostgREST.Metrics qualified as Metrics

main :: IO ()
main = do
  poolChan <- newChan
  -- make sure poolChan is not growing indefinitely
  -- start a thread that drains the channel
  -- this is necessary because test cases operate on
  -- copies so poolChan is never read from
  -- this means we have another thread running for the entire duration of the spec but this shouldn't be a problem since Haskell green threads are lightweight
  void $ forkIO $ forever $ readChan poolChan
  metricsState <- Metrics.init (configDbPoolSize testCfg)
  pool <-
    P.acquire $
      P.settings
        [ P.size 3
        , P.acquisitionTimeout 10
        , P.agingTimeout 60
        , P.idlenessTimeout 60
        , P.staticConnectionSettings $ toConnectionSettings identity testCfg
        , -- make sure metrics are updated and pool observations published to poolChan
          P.observationHandler $ (writeChan poolChan <> Metrics.observationMetrics metricsState) . HasqlPoolObs
        ]

  actualPgVersion <- either (panic . show) id <$> P.use pool queryPgVersion

  -- cached schema cache so most tests run fast
  baseSchemaCache <- loadSCache pool actualPgVersion testCfg

  let initApp sCache config = do
        -- duplicate poolChan as a starting point
        confRef <- newIORef config
        loggerState <- Logger.init (configLogLevel <$> readIORef confRef)
        obsChan <- dupChan poolChan
        stateObsChan <- newObsChan obsChan
        appState <- AppState.initWithPool pool confRef loggerState metricsState (Metrics.observationMetrics metricsState <> writeChan obsChan) mempty
        AppState.putPgVersion appState actualPgVersion
        AppState.putSchemaCache appState (Just sCache)
        return (SpecState appState metricsState stateObsChan, postgrest appState)

  -- Run all test modules
  hspec $ do
    before (initApp baseSchemaCache testCfgJwtCache) $
      describe "Observation.JwtCacheObs" Observation.JwtCache.spec
    before (initApp baseSchemaCache testCfg) $
      describe "Feature.MetricsSpec" Observation.MetricsSpec.spec
    before (initApp baseSchemaCache testCfg) $
      describe "Feature.SchemaCacheSpec" Observation.SchemaCacheSpec.spec
  where
    loadSCache pool pgVersion conf =
      either (panic . show) fst <$> P.use pool (HT.transaction HT.ReadCommitted HT.Read $ querySchemaCache pgVersion conf)
