{-# LANGUAGE LambdaCase #-}
{-# LANGUAGE RecordWildCards #-}
{-# LANGUAGE RecursiveDo #-}

-- TODO log with buffering enabled to not lose throughput on logging levels higher than LogError

-- |
-- Module      : PostgREST.Logger
-- Description : Logging based on the Observation.hs module. Access logs get sent to stdout and server diagnostic get sent to stderr.
module PostgREST.Logger
  ( observationLogger
  , init
  , LoggerState
  )
where

import Data.Time (ZonedTime, defaultTimeLocale, formatTime, getZonedTime)
import Network.HTTP.Types.Status (Status, status400, status500)
import Numeric (showFFloat)
import Protolude

import Data.ByteString.Char8 qualified as BS
import Data.ByteString.Lazy qualified as LBS
import Data.Text qualified as T
import Data.Text.Encoding qualified as T

import PostgREST.Config (LogLevel (..), Verbosity (..))
import PostgREST.Config.PgVersion (pgvName)
import PostgREST.Debounce (makeDebouncer)
import PostgREST.Logger.Apache (apacheFormat)
import PostgREST.Observation
import PostgREST.Query (MainQuery (..))
import PostgREST.SchemaCache (queryTimingsWLabels)

import Hasql.Connection qualified as SQL
import Hasql.Decoders qualified as HD
import Hasql.DynamicStatements.Snippet qualified as SQL hiding (sql)
import Hasql.DynamicStatements.Statement qualified as SQL
import Hasql.Pool qualified as SQL
import Hasql.Pool.Observation qualified as SQL
import Hasql.Statement qualified as SQL
import PostgREST.Error qualified as Error

data LoggerState = LoggerState
  { stateLogDebouncePoolTimeout :: IO ()
  -- ^ Logs with a debounce
  , getLogLevel :: IO LogLevel
  -- ^ Get LogLevel from Config
  }

init :: IO LogLevel -> IO LoggerState
init getLogLvl = mdo
  let
    oneSecond = 1_000_000
    loggerState = LoggerState debouncePoolTimeout getLogLvl
  debouncePoolTimeout <-
    makeDebouncer $
      logWithZTime (observationMessages PoolAcqTimeoutObs) *> threadDelay (5 * oneSecond)
  pure loggerState

shouldLogResponse :: LogLevel -> Status -> Bool
shouldLogResponse logLevel = case logLevel of
  LogCrit -> const False
  LogError -> (>= status500)
  LogWarn -> (>= status400)
  LogInfo -> const True
  LogDebug -> const True

-- All observations are logged except some that depend on the log-level
observationLogger :: LoggerState -> ObservationHandler
observationLogger loggerState obs = do
  logLevel <- getLogLevel loggerState -- We need to do the IO action to read the "log-level" config value because it can be reloaded
  case obs of
    PoolAcqTimeoutObs -> do
      when (logLevel >= LogError) $
        stateLogDebouncePoolTimeout loggerState
    o@(QueryErrorCodeHighObs _) -> do
      when (logLevel >= LogError) $ do
        logWithZTime $ observationMessages o
    o@SchemaCacheEmptyObs ->
      when (logLevel >= LogError) $ do
        logWithZTime $ observationMessages o
    o@(HasqlPoolObs _) -> do
      when (logLevel >= LogDebug) $ do
        logWithZTime $ observationMessages o
    o@(QueryObs _ status) -> do
      when (shouldLogResponse logLevel status) $
        logWithZTime $
          observationMessages o
    o@(SchemaCacheQueryObs _) ->
      when (logLevel >= LogInfo) $
        logWithZTime $
          observationMessages o
    o@PoolRequest ->
      when (logLevel >= LogDebug) $ do
        logWithZTime $ observationMessages o
    o@PoolRequestFullfilled ->
      when (logLevel >= LogDebug) $ do
        logWithZTime $ observationMessages o
    ResponseObs maybeRole req status contentLen ->
      when (shouldLogResponse logLevel status) $ do
        zTime <- getZonedTime
        putStr $ apacheFormat maybeRole (BS.pack $ formatZonedTime zTime) req status contentLen -- putStr prints to stdout
    o@PoolFlushed ->
      when (logLevel >= LogDebug) $ do
        logWithZTime $ observationMessages o
    o@JwtCacheEviction ->
      when (logLevel >= LogDebug) $ do
        logWithZTime $ observationMessages o
    o@(JwtCacheLookup _) ->
      when (logLevel >= LogDebug) $ do
        logWithZTime $ observationMessages o
    o@(WarpServerObs _) ->
      when (logLevel >= LogDebug) $ do
        logWithZTime $ observationMessages o
    o ->
      logWithZTime $ observationMessages o

logWithZTime :: [Text] -> IO ()
logWithZTime txts = do
  zTime <- getZonedTime
  let prefix = toS (formatZonedTime zTime) <> ": "
  traverse_ (hPutStrLn stderr . (prefix <>)) txts

formatZonedTime :: ZonedTime -> [Char]
formatZonedTime = formatTime defaultTimeLocale "%d/%b/%Y:%T %z"

-- TODO: maybe patch upstream hasql-dynamic-statements so we have a less hackish way to convert
-- the SQL.Snippet or maybe don't use hasql-dynamic-statements and resort to plain strings for the queries and use regular hasql
renderSnippet :: SQL.Snippet -> ByteString
renderSnippet snippet =
  let
    SQL.Statement sql _ _ _ = SQL.dynamicallyParameterized snippet decoder False
    decoder = HD.noResult -- unused
  in
    sql

observationMessages :: Observation -> [Text]
observationMessages = \case
  AdminStartObs address ->
    pure $ "Admin server listening on " <> address
  AdminServerCrashedObs ex ->
    pure $ "Admin server crashed unexpectedly: " <> (showOnSingleLine '\t' . show) ex
  AppStartObs ver ->
    pure $ "Starting PostgREST " <> T.decodeUtf8 ver <> "..."
  AppServerAddressObs address ->
    pure $ "API server listening on " <> address
  DBConnectedObs ver ->
    pure $ "Successfully connected to " <> ver
  ExitUnsupportedPgVersion pgVer minPgVer ->
    pure $ "Cannot run in this PostgreSQL version (" <> pgvName pgVer <> "), PostgREST needs at least " <> pgvName minPgVer
  ExitDBNoRecoveryObs ->
    pure "Automatic recovery disabled, exiting."
  ExitDBFatalError ServerAuthError usageErr ->
    pure $ "Failed to establish a connection. " <> jsonMessage usageErr
  ExitDBFatalError ServerPgrstBug usageErr ->
    pure $ "This is probably a bug in PostgREST, please report it at https://github.com/PostgREST/postgrest/issues. " <> jsonMessage usageErr
  ExitDBFatalError ServerError42P05 usageErr ->
    pure $ "If you are using connection poolers in transaction mode, try setting db-prepared-statements to false. " <> jsonMessage usageErr
  ExitDBFatalError ServerError08P01 usageErr ->
    pure $ "Connection poolers in statement mode are not supported." <> jsonMessage usageErr
  SchemaCacheEmptyObs ->
    pure $ T.decodeUtf8 . LBS.toStrict . Error.errorPayload Verbose $ Error.NoSchemaCacheError
  SchemaCacheErrorObs dbSchemas extraPaths usageErr ->
    pure $
      "Failed to load the schema cache using "
        <> "db-schemas="
        <> T.intercalate "," (toList dbSchemas)
        <> " and "
        <> "db-extra-search-path="
        <> T.intercalate "," extraPaths
        <> ". "
        <> jsonMessage usageErr
  SchemaCacheQueriedObs resultTime timings ->
    ["Schema cache queried in " <> showMillis resultTime <> " milliseconds "]
      <> let showTimings qt = [T.intercalate ", " $ (\(l, v) -> T.decodeUtf8 l <> ": " <> v <> " ms") <$> queryTimingsWLabels qt]
         in  maybe mempty showTimings timings
  SchemaCacheLoadedObs resultTime summary ->
    [ "Schema cache loaded " <> summary
    , "Schema cache loaded in " <> showMillis resultTime <> " milliseconds"
    ]
  ConnectionRetryObs delay ->
    pure $ "Attempting to reconnect to the database in " <> (show delay :: Text) <> " seconds..."
  QueryPgVersionError usageErr ->
    pure $ "Failed to query the PostgreSQL version. " <> jsonMessage usageErr
  DBListenStart host port fullName channel -> do
    pure $ "Listener connected to " <> fullName <> " on " <> show (fold $ host <> fmap (":" <>) port) <> " and listening for database notifications on the " <> show channel <> " channel"
  DBListenFail channel listenErr ->
    pure $
      "Failed listening for database notifications on the "
        <> show channel
        <> " channel. "
        <> either showListenerConnError showListenerException listenErr
  DBListenRetry delay ->
    pure $ "Retrying listening for database notifications in " <> (show delay :: Text) <> " seconds..."
  DBListenBugCallQueryFix ->
    pure "This is likely a PostgreSQL bug in the notification queue, executing the following to try to solve it: SELECT pg_notification_queue_usage();"
  DBListenerGotSCacheMsg channel ->
    pure $ "Received a schema cache reload message on the " <> show channel <> " channel"
  DBListenerGotConfigMsg channel ->
    pure $ "Received a config reload message on the " <> show channel <> " channel"
  DBListenerConnectionCleanupFail ex ->
    pure $ "Failed during listener connection cleanup: " <> showOnSingleLine '\t' (show ex)
  (QueryObs MainQuery{mqOpenAPI = (x, y, z), ..} _) ->
    let snipts = renderSnippet <$> [mqTxVars, fromMaybe mempty mqPreReq, mqMain, x, y, z, fromMaybe mempty mqExplain]
    in  showOnSingleLine '\n' . T.decodeUtf8 <$> filter (/= mempty) snipts
  SchemaCacheQueryObs queries ->
    -- Queries are formatted with newlines for readability in SchemaCache.hs so we need to join them so each query appears on a single log line
    showOnSingleLine '\n' . T.decodeUtf8 <$> queries
  LegacyTargetNameWarningObs (warningMsg, warningHints) requestMethod requestTarget ->
    [ "WARNING: " <> warningMsg
    , "Update filters, orders or limits that use " <> warningHints <> " in " <> "`" <> T.decodeUtf8 (requestMethod <> " " <> requestTarget) <> "`"
    ]
  ConfigReadErrorObs usageErr ->
    pure $ "Failed to query database settings for the config parameters." <> jsonMessage usageErr
  QueryRoleSettingsErrorObs usageErr ->
    pure $ "Failed to query the role settings. " <> jsonMessage usageErr
  QueryErrorCodeHighObs usageErr ->
    pure $ jsonMessage usageErr
  ConfigInvalidObs err ->
    pure $ "Failed reloading config: " <> err
  ConfigSucceededObs ->
    pure "Config reloaded"
  PoolInit poolSize ->
    pure $ "Connection Pool initialized with a maximum size of " <> show poolSize <> " connections"
  PoolAcqTimeoutObs -> pure $ jsonMessage SQL.AcquisitionTimeoutUsageError
  HasqlPoolObs (SQL.ConnectionObservation uuid status) ->
    pure $
      "Connection "
        <> show uuid
        <> ( case status of
               SQL.ConnectingConnectionStatus -> " is being established"
               SQL.ReadyForUseConnectionStatus reason ->
                 " is available due to " <> case reason of
                   SQL.EstablishedConnectionReadyForUseReason -> "connection establishment"
                   SQL.SessionFailedConnectionReadyForUseReason _ -> "session failure"
                   SQL.SessionSucceededConnectionReadyForUseReason -> "session success"
               SQL.InUseConnectionStatus -> " is used"
               SQL.TerminatedConnectionStatus reason ->
                 " is terminated due to " <> case reason of
                   SQL.AgingConnectionTerminationReason -> "max lifetime"
                   SQL.IdlenessConnectionTerminationReason -> "max idletime"
                   SQL.ReleaseConnectionTerminationReason -> "release"
                   SQL.NetworkErrorConnectionTerminationReason _ -> "network error" -- usage error is already logged, no need to repeat the same message.
                   SQL.InitializationErrorTerminationReason _ -> "init failure"
           )
  PoolRequest ->
    pure "Trying to borrow a connection from pool"
  PoolRequestFullfilled ->
    pure "Borrowed a connection from the pool"
  PoolFlushed ->
    pure "Database connection pool flushed"
  JwtCacheLookup _ ->
    pure "Looked up a JWT in JWT cache"
  JwtCacheEviction ->
    pure "Evicted entry from JWT cache"
  TerminationUnixSignalObs signal ->
    pure $ "Received termination unix signal " <> signal
  WarpServerObs txt ->
    pure $ "Warp server: " <> txt
  ResponseObs{} ->
    mempty -- Control flow never reaches here, the observation message is returned in observationLogger function
  where
    showMillis :: Double -> Text
    showMillis x = toS $ showFFloat (Just 1) x ""

    jsonMessage err = T.decodeUtf8 . LBS.toStrict . Error.errorPayload Verbose $ Error.PgError False err

    showListenerConnError :: SQL.ConnectionError -> Text
    showListenerConnError = maybe "Connection error" (showOnSingleLine '\t' . T.decodeUtf8)

    showListenerException :: SomeException -> Text
    showListenerException = showOnSingleLine '\t' . show

showOnSingleLine :: Char -> Text -> Text
showOnSingleLine split txt = T.intercalate " " $ T.filter (/= split) <$> T.lines txt -- the errors from hasql-notifications come intercalated with "\t\n"
