-- |
-- Module      : PostgREST.Observation
-- Description : This module holds an Observation type which is the core of Observability for PostgREST.
--               The Observation and ObservationHandler (the observer) are abstractions that allow centralizing logging and metrics concerns,
--               only observer calls with an Observation constructor are applied at different parts in the codebase.
--               The Logger and Metrics modules then decide which observations to expose. Not all observations need to be logged nor all correspond to a metric.
module PostgREST.Observation
  ( Observation (..)
  , ObsFatalError (..)
  , ObservationHandler
  )
where

import Network.HTTP.Types.Status (Status)
import Protolude hiding (toList)

import Network.Wai qualified as Wai

import PostgREST.Config.PgVersion
import PostgREST.Query (MainQuery)
import PostgREST.SchemaCache (QueryTimings)

import Hasql.Connection qualified as SQL
import Hasql.Pool qualified as SQL
import Hasql.Pool.Observation qualified as SQL

data Observation
  = AdminStartObs Text
  | AdminServerCrashedObs SomeException
  | AppStartObs ByteString
  | AppServerAddressObs Text
  | ExitUnsupportedPgVersion PgVersion PgVersion
  | ExitDBNoRecoveryObs
  | ExitDBFatalError ObsFatalError SQL.UsageError
  | DBConnectedObs Text
  | SchemaCacheEmptyObs
  | SchemaCacheErrorObs (NonEmpty Text) [Text] SQL.UsageError
  | SchemaCacheQueriedObs Double (Maybe QueryTimings)
  | SchemaCacheLoadedObs Double Text
  | ConnectionRetryObs Int
  | DBListenStart (Maybe ByteString) (Maybe ByteString) Text Text -- host, port, version string, channel
  | DBListenFail Text (Either SQL.ConnectionError SomeException)
  | DBListenRetry Int
  | DBListenBugCallQueryFix
  | DBListenerGotSCacheMsg ByteString
  | DBListenerGotConfigMsg ByteString
  | DBListenerConnectionCleanupFail SomeException
  | QueryObs MainQuery Status
  | SchemaCacheQueryObs [ByteString]
  | LegacyTargetNameWarningObs (Text, Text) ByteString ByteString
  | ConfigReadErrorObs SQL.UsageError
  | ConfigInvalidObs Text
  | ConfigSucceededObs
  | QueryRoleSettingsErrorObs SQL.UsageError
  | QueryErrorCodeHighObs SQL.UsageError
  | QueryPgVersionError SQL.UsageError
  | PoolInit Int
  | PoolAcqTimeoutObs
  | HasqlPoolObs SQL.Observation
  | ResponseObs (Maybe ByteString) Wai.Request Status (Maybe Integer)
  | PoolRequest
  | PoolRequestFullfilled
  | PoolFlushed
  | JwtCacheLookup Bool
  | JwtCacheEviction
  | TerminationUnixSignalObs Text
  | WarpServerObs Text
  deriving (Generic)

data ObsFatalError = ServerAuthError | ServerPgrstBug | ServerError42P05 | ServerError08P01

type ObservationHandler = Observation -> IO ()
