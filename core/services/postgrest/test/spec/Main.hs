module Main where

import Data.Function (id)
import Data.IORef (newIORef, readIORef)
import Protolude hiding (toList, toS)
import Test.Hspec

import PostgREST.App (postgrest)
import PostgREST.Config (AppConfig (..), toConnectionSettings)
import PostgREST.Config.Database (queryPgVersion)
import PostgREST.SchemaCache (querySchemaCache)
import SpecHelper

import Feature.Auth.AsymmetricJwtSpec qualified
import Feature.Auth.AudienceJwtSecretSpec qualified
import Feature.Auth.AuthSpec qualified
import Feature.Auth.BinaryJwtSecretSpec qualified
import Feature.Auth.JwtCacheSpec qualified
import Feature.Auth.NoAnonSpec qualified
import Feature.Auth.NoJwtSecretSpec qualified
import Feature.ConcurrentSpec qualified
import Feature.CorsSpec qualified
import Feature.ExtraSearchPathSpec qualified
import Feature.HttpHeaderSpec qualified
import Feature.NoSuperuserSpec qualified
import Feature.ObservabilitySpec qualified
import Feature.OpenApi.DisabledOpenApiSpec qualified
import Feature.OpenApi.IgnorePrivOpenApiSpec qualified
import Feature.OpenApi.OpenApiSpec qualified
import Feature.OpenApi.ProxySpec qualified
import Feature.OpenApi.RootSpec qualified
import Feature.OpenApi.SecurityOpenApiSpec qualified
import Feature.OptionsSpec qualified
import Feature.Query.AggregateFunctionsSpec qualified
import Feature.Query.AndOrParamsSpec qualified
import Feature.Query.ComputedRelsSpec qualified
import Feature.Query.CustomMediaSpec qualified
import Feature.Query.DeleteSpec qualified
import Feature.Query.EmbedDisambiguationSpec qualified
import Feature.Query.EmbedInnerJoinSpec qualified
import Feature.Query.ErrorSpec qualified
import Feature.Query.InsertSpec qualified
import Feature.Query.JsonOperatorSpec qualified
import Feature.Query.MultipleSchemaSpec qualified
import Feature.Query.NullsStripSpec qualified
import Feature.Query.PgSafeUpdateSpec qualified
import Feature.Query.PlanSpec qualified
import Feature.Query.PostGISSpec qualified
import Feature.Query.Preferences.HandlingSpec qualified
import Feature.Query.Preferences.MaxAffectedSpec qualified
import Feature.Query.Preferences.TimezoneSpec qualified
import Feature.Query.PreparedStatementsSpec qualified
import Feature.Query.QueryLimitedSpec qualified
import Feature.Query.QuerySpec qualified
import Feature.Query.RangeSpec qualified
import Feature.Query.RawOutputTypesSpec qualified
import Feature.Query.RelatedQueriesSpec qualified
import Feature.Query.RpcSpec qualified
import Feature.Query.ServerTimingSpec qualified
import Feature.Query.SingularSpec qualified
import Feature.Query.SpreadQueriesSpec qualified
import Feature.Query.UnicodeSpec qualified
import Feature.Query.UpdateSpec qualified
import Feature.Query.UpsertSpec qualified
import Feature.RollbackSpec qualified
import Feature.RpcPreRequestGucsSpec qualified
import Hasql.Pool qualified as P
import Hasql.Pool.Config qualified as P
import Hasql.Transaction.Sessions qualified as HT
import PostgREST.AppState qualified as AppState
import PostgREST.Logger qualified as Logger
import PostgREST.Metrics qualified as Metrics

main :: IO ()
main = do
  pool <-
    P.acquire $
      P.settings
        [ P.size 3
        , P.acquisitionTimeout 10
        , P.agingTimeout 60
        , P.idlenessTimeout 60
        , P.staticConnectionSettings $ toConnectionSettings identity baseCfg
        ]

  actualPgVersion <- either (panic . show) id <$> P.use pool queryPgVersion

  -- cached schema cache so most tests run fast
  baseSchemaCache <- loadSCache pool actualPgVersion baseCfg
  metricsState <- Metrics.init (configDbPoolSize baseCfg)

  let
    initApp sCache config = do
      confRef <- newIORef config
      loggerState <- Logger.init (configLogLevel <$> readIORef confRef)
      appState <- AppState.initWithPool pool confRef loggerState metricsState (Metrics.observationMetrics metricsState) mempty
      AppState.putPgVersion appState actualPgVersion
      AppState.putSchemaCache appState (Just sCache)
      return ((), postgrest appState)

    -- For tests that run with the same schema cache
    app = initApp baseSchemaCache

    -- For tests that run with a different SchemaCache (depends on configSchemas)
    appDbs config = do
      customSchemaCache <- loadSCache pool actualPgVersion config
      initApp customSchemaCache config

    withConfig config = before (app config)
    withConfigDbs config = before (appDbs config)
    describeWithConfig label spec = describe label $ spec withConfig

  let specs =
        uncurry describeWithConfig
          <$> [ ("Feature.Auth.AsymmetricJwtSpec", Feature.Auth.AsymmetricJwtSpec.spec)
              , ("Feature.Auth.AudienceJwtSecretSpec", Feature.Auth.AudienceJwtSecretSpec.disabledSpec)
              , ("Feature.Auth.AudienceJwtSecretSpec", Feature.Auth.AudienceJwtSecretSpec.spec)
              , ("Feature.Auth.AuthSpec", Feature.Auth.AuthSpec.spec)
              , ("Feature.Auth.BinaryJwtSecretSpec", Feature.Auth.BinaryJwtSecretSpec.spec)
              , ("Feature.Auth.JwtCacheSpec", Feature.Auth.JwtCacheSpec.spec)
              , ("Feature.Auth.NoAnonSpec", Feature.Auth.NoAnonSpec.spec)
              , ("Feature.Auth.NoJwtSecretSpec", Feature.Auth.NoJwtSecretSpec.spec)
              , ("Feature.ConcurrentSpec", Feature.ConcurrentSpec.spec)
              , ("Feature.CorsSpec", Feature.CorsSpec.spec)
              , ("Feature.HttpHeaderSpec", Feature.HttpHeaderSpec.spec)
              , ("Feature.NoSuperuserSpec", Feature.NoSuperuserSpec.spec)
              , ("Feature.ObservabilitySpec", Feature.ObservabilitySpec.spec)
              , ("Feature.OpenApi.DisabledOpenApiSpec", Feature.OpenApi.DisabledOpenApiSpec.spec)
              , ("Feature.OpenApi.OpenApiSpec", Feature.OpenApi.OpenApiSpec.spec)
              , ("Feature.OpenApi.ProxySpec", Feature.OpenApi.ProxySpec.spec)
              , ("Feature.OpenApi.RootSpec", Feature.OpenApi.RootSpec.spec)
              , ("Feature.OpenApi.SecurityOpenApiSpec", Feature.OpenApi.SecurityOpenApiSpec.spec)
              , ("Feature.OptionsSpec", Feature.OptionsSpec.spec)
              , ("Feature.Query.AggregateFunctionsSpec.allowed", Feature.Query.AggregateFunctionsSpec.allowed)
              , ("Feature.Query.AggregateFunctionsSpec.disallowed", Feature.Query.AggregateFunctionsSpec.disallowed)
              , ("Feature.Query.AndOrParamsSpec", Feature.Query.AndOrParamsSpec.spec)
              , ("Feature.Query.ComputedRelsSpec", Feature.Query.ComputedRelsSpec.spec)
              , ("Feature.Query.CustomMediaSpec", Feature.Query.CustomMediaSpec.spec)
              , ("Feature.Query.DeleteSpec", Feature.Query.DeleteSpec.spec)
              , ("Feature.Query.EmbedDisambiguationSpec", Feature.Query.EmbedDisambiguationSpec.spec)
              , ("Feature.Query.EmbedInnerJoinSpec", Feature.Query.EmbedInnerJoinSpec.spec)
              , ("Feature.Query.ErrorSpec", Feature.Query.ErrorSpec.spec)
              , ("Feature.Query.InsertSpec", Feature.Query.InsertSpec.spec)
              , ("Feature.Query.JsonOperatorSpec", Feature.Query.JsonOperatorSpec.spec actualPgVersion)
              , ("Feature.Query.NullsStripSpec", Feature.Query.NullsStripSpec.spec)
              , ("Feature.Query.PgSafeUpdateSpec.disabledSpec", Feature.Query.PgSafeUpdateSpec.disabledSpec)
              , ("Feature.Query.PlanSpec.disabledSpec", Feature.Query.PlanSpec.disabledSpec)
              , ("Feature.Query.PlanSpec.spec", Feature.Query.PlanSpec.spec)
              , ("Feature.Query.Preferences.HandlingSpec", Feature.Query.Preferences.HandlingSpec.spec)
              , ("Feature.Query.Preferences.MaxAffectedSpec", Feature.Query.Preferences.MaxAffectedSpec.spec)
              , ("Feature.Query.Preferences.TimezoneSpec", Feature.Query.Preferences.TimezoneSpec.spec)
              , ("Feature.Query.PreparedStatementsSpec.spec", Feature.Query.PreparedStatementsSpec.spec)
              , ("Feature.Query.QueryLimitedSpec", Feature.Query.QueryLimitedSpec.spec)
              , ("Feature.Query.QuerySpec", Feature.Query.QuerySpec.spec actualPgVersion)
              , ("Feature.Query.QuerySpec.specLegacyTargetNames", Feature.Query.QuerySpec.specLegacyTargetNames)
              , ("Feature.Query.RangeSpec", Feature.Query.RangeSpec.spec)
              , ("Feature.Query.RawOutputTypesSpec", Feature.Query.RawOutputTypesSpec.spec)
              , ("Feature.Query.RelatedQueriesSpec", Feature.Query.RelatedQueriesSpec.spec)
              , ("Feature.Query.RpcSpec", Feature.Query.RpcSpec.spec actualPgVersion)
              , ("Feature.Query.ServerTimingSpec", Feature.Query.ServerTimingSpec.spec)
              , ("Feature.Query.SingularSpec", Feature.Query.SingularSpec.spec)
              , ("Feature.Query.SpreadQueriesSpec", Feature.Query.SpreadQueriesSpec.spec)
              , ("Feature.Query.UpdateSpec", Feature.Query.UpdateSpec.spec)
              , ("Feature.Query.UpsertSpec", Feature.Query.UpsertSpec.spec)
              , ("Feature.RpcPreRequestGucsSpec", Feature.RpcPreRequestGucsSpec.spec)
              ]

  hspec $ do
    mapM_ parallel specs

    parallel $ describe "Feature.Query.UnicodeSpec" $ Feature.Query.UnicodeSpec.spec withConfigDbs
    parallel $ describe "Feature.OpenApi.IgnorePrivOpenApiSpec" $ Feature.OpenApi.IgnorePrivOpenApiSpec.spec withConfigDbs
    parallel $ describe "Feature.ExtraSearchPathSpec" $ Feature.ExtraSearchPathSpec.spec withConfigDbs
    parallel $ describe "Feature.Query.PostGISSpec" $ Feature.Query.PostGISSpec.spec withConfigDbs
    parallel $ describe "Feature.Query.MultipleSchemaSpec" $ Feature.Query.MultipleSchemaSpec.spec withConfigDbs

    -- Note: the rollback tests can not run in parallel, because they test persistence and
    -- this results in race conditions
    describe "Feature.RollbackAllowedSpec" $ Feature.RollbackSpec.allowed withConfig
    describe "Feature.RollbackDisallowedSpec" $ Feature.RollbackSpec.disallowed withConfig
    describe "Feature.RollbackForcedSpec" $ Feature.RollbackSpec.forced withConfig

    -- This test runs with a pre request to enable the pg-safeupdate library per-session.
    -- This needs to run last, because once pg safe update is loaded, it can't be unloaded again.
    describe "Feature.Query.PgSafeUpdateSpec.spec" $ Feature.Query.PgSafeUpdateSpec.spec withConfig
  where
    loadSCache pool pgVersion conf =
      either (panic . show) fst <$> P.use pool (HT.transaction HT.ReadCommitted HT.Read $ querySchemaCache pgVersion conf)
