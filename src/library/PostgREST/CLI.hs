{-# LANGUAGE NamedFieldPuns #-}
{-# LANGUAGE RecordWildCards #-}

module PostgREST.CLI
  ( main
  , CLI (..)
  , Command (..)
  , readCLIShowHelp
  )
where

import Protolude

import Data.Aeson qualified as JSON
import Data.ByteString.Char8 qualified as BS
import Data.ByteString.Lazy qualified as LBS
import Options.Applicative qualified as O

import PostgREST.AppState (AppState)
import PostgREST.Config (AppConfig (..))
import PostgREST.Observation (Observation (..))
import PostgREST.SchemaCache (querySchemaCache, schemaCacheQueries)
import PostgREST.Version (prettyVersion)

import Hasql.Transaction.Sessions qualified as SQL
import PostgREST.App qualified as App
import PostgREST.AppState qualified as AppState
import PostgREST.Client qualified as Client
import PostgREST.Config qualified as Config

main :: CLI -> IO ()
main CLI{cliCommand, cliPath} = do
  conf <-
    either panic identity <$> Config.readAppConfig mempty cliPath Nothing mempty mempty
  case cliCommand of
    Client adminCmd -> runClientCommand conf adminCmd
    Run runCmd -> runAppCommand conf runCmd

-- | Run command using http-client to communicate with an already running postgrest
runClientCommand :: AppConfig -> ClientCommand -> IO ()
runClientCommand conf CmdReady = Client.ready conf

-- | Run postgrest with command
runAppCommand :: AppConfig -> RunCommand -> IO ()
runAppCommand conf@AppConfig{..} runCmd = do
  mainThreadId <- myThreadId
  mainThreadIdRef <- mkWeakThreadId mainThreadId
  -- Per https://github.com/PostgREST/postgrest/issues/268, we want to
  -- explicitly close the connections to PostgreSQL on shutdown.
  -- 'AppState.destroy' takes care of that.
  bracket
    (AppState.init conf (killThread mainThreadId))
    AppState.destroy
    ( \appState -> case runCmd of
        CmdDumpConfig -> do
          when configDbConfig $ AppState.readInDbConfig True appState
          putStr . Config.toText =<< AppState.getConfig appState
        CmdDumpSchema -> do
          when configDbConfig $ AppState.readInDbConfig True appState
          putStrLn =<< dumpSchema appState
        CmdRun -> App.run appState mainThreadIdRef
    )

-- | Dump SchemaCache schema to JSON
dumpSchema :: AppState -> IO LBS.ByteString
dumpSchema appState = do
  conf@AppConfig{..} <- AppState.getConfig appState
  pgVer <- AppState.getPgVersion appState
  result <-
    AppState.usePool appState (SQL.transactionNoRetry SQL.ReadCommitted SQL.Read $ querySchemaCache pgVer conf)
  when configLogQuery $
    AppState.getObserver appState $
      SchemaCacheQueryObs (schemaCacheQueries pgVer conf)
  case result of
    Left e -> do
      let observer = AppState.getObserver appState
      observer $ SchemaCacheErrorObs configDbSchemas configDbExtraSearchPath e
      exitFailure
    Right (sCache, _) -> return $ JSON.encode sCache

-- | Command line interface options
data CLI = CLI
  { cliCommand :: Command
  , cliPath :: Maybe FilePath
  }

data Command
  = Client ClientCommand
  | Run RunCommand

data ClientCommand
  = CmdReady

data RunCommand
  = CmdRun
  | CmdDumpConfig
  | CmdDumpSchema

-- | Read command line interface options. Also prints help.
readCLIShowHelp :: IO CLI
readCLIShowHelp =
  O.customExecParser prefs opts
  where
    prefs = O.prefs $ O.showHelpOnError <> O.showHelpOnEmpty
    opts = O.info parser $ O.fullDesc <> progDesc
    parser = O.helper <*> versionFlag <*> exampleParser <*> cliParser

    progDesc =
      O.progDesc $
        "PostgREST "
          <> BS.unpack prettyVersion
          <> " / create a REST API to an existing Postgres database"

    versionFlag =
      O.infoOption ("PostgREST " <> BS.unpack prettyVersion) $
        O.long "version"
          <> O.short 'v'
          <> O.help "Show the version information"

    exampleParser =
      O.infoOption Config.exampleConfigFile $
        O.long "example"
          <> O.short 'e'
          <> O.help "Show an example configuration file"

    cliParser :: O.Parser CLI
    cliParser =
      CLI
        <$> (dumpConfigFlag <|> dumpSchemaFlag <|> readyFlag)
        <*> O.optional configFileOption

    configFileOption =
      O.strArgument $
        O.metavar "FILENAME"
          <> O.help "Path to configuration file"

    dumpConfigFlag =
      O.flag (Run CmdRun) (Run CmdDumpConfig) $
        O.long "dump-config"
          <> O.help "Dump loaded configuration and exit"

    dumpSchemaFlag =
      O.flag (Run CmdRun) (Run CmdDumpSchema) $
        O.long "dump-schema"
          <> O.help "Dump loaded schema as JSON and exit (for debugging, output structure is unstable)"

    readyFlag =
      O.flag (Run CmdRun) (Client CmdReady) $
        O.long "ready"
          <> O.help "Checks the health of PostgREST by doing a request on the admin server /ready endpoint"
