{-# LANGUAGE NamedFieldPuns #-}

-- |
-- Module      : PostgREST.Client
-- Description : PostgREST HTTP client
module PostgREST.Client
  ( ready
  )
where

import Network.HTTP.Client (HttpException (..))
import Protolude
import System.IO (hFlush)

import Data.Text qualified as T
import Network.HTTP.Client qualified as HC
import Network.HTTP.Types.Status qualified as HTTP

import PostgREST.Config (AppConfig (..))
import PostgREST.Network (isSpecialHostName)

data PgrstClientError
  = NoAdminServer
  | NoSpecialHostNamesAllowed Text
  | PostgRESTNotReady Text
  | HTTPConnectionRefused Text
  | HTTPExceptionInvalidURL Text

-- | This is invoked by the CLI "--ready" flag.
--   The http-client sends and a request to /ready endpoint
--   and exits with success or failure.
ready :: AppConfig -> IO ()
ready AppConfig{configAdminServerHost, configAdminServerPort} = do
  client <- HC.newManager HC.defaultManagerSettings
  readyURL <- getURL
  req <- HC.parseRequest (T.unpack readyURL) `catch` handleHttpException
  resp <- HC.httpLbs req client `catch` handleHttpException

  let status = HC.responseStatus resp

  if status >= HTTP.status200 && status < HTTP.status300 then
    printAndExitWithSuccess $ "OK: " <> readyURL
  else
    printAndExitWithFailure $ clientErrorMsg (PostgRESTNotReady readyURL)
  where
    getURL :: IO Text
    getURL =
      -- Here, we have three cases:
      -- 1. If the admin port config is not defined, we exit
      --      with "no admin server error"
      -- 2. Otherwise, if admin server is running, then we check if
      --      postgrest server-host is configured with special hostname like "*4",
      --      if it is, we fail with "no special hostname allowed with "--ready".
      --      The reason for this is that we can't know the actual address.
      -- 3. Finally, if we know the "actual" hostname and the port, then we
      --      construct the URL and return it.
      case configAdminServerPort of
        Nothing -> printAndExitWithFailure $ clientErrorMsg NoAdminServer
        Just port ->
          if isSpecialHostName configAdminServerHost then
            printAndExitWithFailure $ clientErrorMsg (NoSpecialHostNamesAllowed configAdminServerHost)
          else
            return $ makeReadyUrl port

    -- NOTE: http-client automatically resolves hostnames
    makeReadyUrl :: Int -> Text
    makeReadyUrl p = "http://" <> wrapIfIpv6 configAdminServerHost <> ":" <> (T.pack . show) p <> "/ready"
      where
        -- IPv6 needs to wrapped in [], it has ':' as separator
        wrapIfIpv6 :: Text -> Text
        wrapIfIpv6 s
          | T.any (== ':') s = "[" <> s <> "]"
          | otherwise = s

-- | Handle HTTP exception for "http-client" requests
handleHttpException :: HttpException -> IO a
handleHttpException (HttpExceptionRequest req _) = do
  let url = show (HC.getUri req)
  printAndExitWithFailure $ clientErrorMsg (HTTPConnectionRefused $ T.pack url)
handleHttpException (InvalidUrlException url _) = do
  printAndExitWithFailure $ clientErrorMsg (HTTPExceptionInvalidURL $ T.pack url)

-- | Print the message on stdout and exit with success
printAndExitWithSuccess :: Text -> IO a
printAndExitWithSuccess msg = putStrLn (T.unpack msg) >> hFlush stdout >> exitSuccess

-- | Print the message on stderr and exit with failure
printAndExitWithFailure :: Text -> IO a
printAndExitWithFailure msg = hPutStrLn stderr (T.unpack msg) >> hFlush stderr >> exitWith (ExitFailure 1)

-- | Pgrst client error to error message
clientErrorMsg :: PgrstClientError -> Text
clientErrorMsg err =
  "ERROR: "
    <> case err of
      NoAdminServer -> "Admin server is not running. Please check admin-server-port config."
      NoSpecialHostNamesAllowed host ->
        "The `--ready` flag cannot be used when server-host is configured as \""
          <> host
          <> "\". "
          <> "Please update your server-host config to \"localhost\"."
      PostgRESTNotReady url -> url
      HTTPConnectionRefused url -> "connection refused to " <> url
      HTTPExceptionInvalidURL url -> "invalid url - " <> url
