{-# LANGUAGE LambdaCase #-}
{-# LANGUAGE NamedFieldPuns #-}
{-# LANGUAGE RecordWildCards #-}
{-# OPTIONS_GHC -fno-warn-type-defaults #-}

-- |
-- Module      : PostgREST.Config
-- Description : Manages PostgREST configuration type and parser.
module PostgREST.Config
  ( AppConfig (..)
  , Environment
  , JSPath
  , defaultRoleJSPathKey
  , LogLevel (..)
  , OpenAPIMode (..)
  , Proxy (..)
  , toText
  , isMalformedProxyUri
  , readAppConfig
  , readPGRSTEnvironment
  , toURI
  , parseSecret
  , addFallbackAppName
  , addTargetSessionAttrs
  , toConnectionSettings
  , exampleConfigFile
  , audMatchesCfg
  , Verbosity (..)
  )
where

import Control.Monad (fail)
import Data.Either.Combinators (mapLeft)
import Data.List (lookup)
import Data.List.NonEmpty (fromList, toList)
import Data.Maybe (fromJust)
import Data.Scientific (floatingOrInteger)
import Jose.Jwk (Jwk, JwkSet)
import Network.URI
  ( escapeURIString
  , isURI
  , isUnescapedInURIComponent
  )
import Numeric (readOct, showOct)
import Protolude hiding (Proxy, toList)
import System.Environment (getEnvironment)
import System.Posix.Types (FileMode)

import Data.Aeson qualified as JSON
import Data.ByteString qualified as BS
import Data.ByteString.Base64 qualified as B64
import Data.CaseInsensitive qualified as CI
import Data.Configurator qualified as C
import Data.Map.Strict qualified as M
import Data.String qualified as S
import Data.Text qualified as T
import Data.Text.Encoding qualified as T
import Jose.Jwa qualified as JWT
import Jose.Jwk qualified as JWT

import PostgREST.Catalog.Identifiers (QualifiedIdentifier (..), toQi)
import PostgREST.Config.Database (RoleIsolationLvl, RoleSettings)
import PostgREST.Config.JSPath
  ( JSPath (..)
  , defaultRoleJSPathKey
  , dumpJSPath
  , pRoleClaimKey
  )
import PostgREST.Config.Proxy
  ( Proxy (..)
  , isMalformedProxyUri
  , toURI
  )
import PostgREST.Version (prettyVersion)

import Hasql.Connection.Setting qualified as SQL
import Hasql.Connection.Setting.Connection qualified as SQL

audMatchesCfg :: AppConfig -> Text -> Bool
audMatchesCfg = maybe (const True) (==) . configJwtAudience

data AppConfig = AppConfig
  { configAppSettings :: [(Text, Text)]
  , configClientErrorVerbosity :: Verbosity
  , configDbAggregates :: Bool
  , configDbAnonRole :: Maybe BS.ByteString
  , configDbChannel :: Text
  , configDbChannelEnabled :: Bool
  , configDbExtraSearchPath :: [Text]
  , configDbHoistedTxSettings :: [Text]
  , configDbMaxRows :: Maybe Integer
  , configDbPlanEnabled :: Bool
  , configDbPoolSize :: Int
  , configDbPoolAcquisitionTimeout :: Int
  , configDbPoolMaxLifetime :: Int
  , configDbPoolMaxIdletime :: Int
  , configDbPoolAutomaticRecovery :: Bool
  , configDbPreRequest :: Maybe QualifiedIdentifier
  , configDbPreparedStatements :: Bool
  , configDbRootSpec :: Maybe QualifiedIdentifier
  , configDbSchemas :: NonEmpty Text
  , configDbConfig :: Bool
  , configDbPreConfig :: Maybe QualifiedIdentifier
  , configDbTxAllowOverride :: Bool
  , configDbTxRollbackAll :: Bool
  , configDbUri :: Text
  , configFilePath :: Maybe FilePath
  , configJWKS :: Maybe JwkSet
  , configJwtAudience :: Maybe Text
  , configJwtRoleClaimKey :: JSPath
  , configJwtSecret :: Maybe BS.ByteString
  , configJwtSecretIsBase64 :: Bool
  , configJwtCacheMaxEntries :: Int
  , configLogLevel :: LogLevel
  , configLogQuery :: Bool
  , configOpenApiMode :: OpenAPIMode
  , configOpenApiSecurityActive :: Bool
  , configOpenApiServerProxyUri :: Maybe Text
  , configServerCorsAllowedOrigins :: [Text]
  , configServerHost :: Text
  , configServerPort :: Int
  , configServerReusePort :: Bool
  , configServerTraceHeader :: Maybe (CI.CI BS.ByteString)
  , configServerTimingEnabled :: Bool
  , configServerUnixSocket :: Maybe FilePath
  , configServerUnixSocketMode :: FileMode
  , configUrlUseLegacyTargetNames :: Bool
  , configAdminServerHost :: Text
  , configAdminServerPort :: Maybe Int
  , configAdminServerUnixSocket :: Maybe FilePath
  , configAdminServerUnixSocketMode :: FileMode
  , configRoleSettings :: RoleSettings
  , configRoleIsoLvl :: RoleIsolationLvl
  , configInternalSCQuerySleepFst :: Maybe Int32
  , configInternalSCQuerySleepSnd :: Maybe Int32
  }

data LogLevel = LogCrit | LogError | LogWarn | LogInfo | LogDebug
  deriving (Eq, Ord)

dumpLogLevel :: LogLevel -> Text
dumpLogLevel = \case
  LogCrit -> "crit"
  LogError -> "error"
  LogWarn -> "warn"
  LogInfo -> "info"
  LogDebug -> "debug"

data Verbosity
  = Minimal
  | Verbose

dumpClientErrorVerbosity :: Verbosity -> Text
dumpClientErrorVerbosity = \case
  Minimal -> "minimal"
  Verbose -> "verbose"

data OpenAPIMode = OAFollowPriv | OAIgnorePriv | OADisabled
  deriving (Eq)

dumpOpenApiMode :: OpenAPIMode -> Text
dumpOpenApiMode = \case
  OAFollowPriv -> "follow-privileges"
  OAIgnorePriv -> "ignore-privileges"
  OADisabled -> "disabled"

-- | Dump the config
toText :: AppConfig -> Text
toText conf =
  unlines $ sort $ (\(k, v) -> k <> " = " <> v) <$> pgrstSettings ++ appSettings
  where
    -- apply conf to all pgrst settings
    pgrstSettings =
      (\(k, v) -> (k, v conf))
        <$> [ ("client-error-verbosity", q . dumpClientErrorVerbosity . configClientErrorVerbosity)
            , ("db-aggregates-enabled", T.toLower . show . configDbAggregates)
            , ("db-anon-role", q . T.decodeUtf8 . fromMaybe "" . configDbAnonRole)
            , ("db-channel", q . configDbChannel)
            , ("db-channel-enabled", T.toLower . show . configDbChannelEnabled)
            , ("db-extra-search-path", q . T.intercalate "," . configDbExtraSearchPath)
            , ("db-hoisted-tx-settings", q . T.intercalate "," . configDbHoistedTxSettings)
            , ("db-max-rows", maybe "\"\"" show . configDbMaxRows)
            , ("db-plan-enabled", T.toLower . show . configDbPlanEnabled)
            , ("db-pool", show . configDbPoolSize)
            , ("db-pool-acquisition-timeout", show . configDbPoolAcquisitionTimeout)
            , ("db-pool-max-lifetime", show . configDbPoolMaxLifetime)
            , ("db-pool-max-idletime", show . configDbPoolMaxIdletime)
            , ("db-pool-automatic-recovery", T.toLower . show . configDbPoolAutomaticRecovery)
            , ("db-pre-request", q . maybe mempty dumpQi . configDbPreRequest)
            , ("db-prepared-statements", T.toLower . show . configDbPreparedStatements)
            , ("db-root-spec", q . maybe mempty dumpQi . configDbRootSpec)
            , ("db-schemas", q . T.intercalate "," . toList . configDbSchemas)
            , ("db-config", T.toLower . show . configDbConfig)
            , ("db-pre-config", q . maybe mempty dumpQi . configDbPreConfig)
            , ("db-tx-end", q . showTxEnd)
            , ("db-uri", q . configDbUri)
            , ("jwt-aud", q . fromMaybe mempty . configJwtAudience)
            , ("jwt-role-claim-key", q . dumpJSPath . configJwtRoleClaimKey)
            , ("jwt-secret", q . T.decodeUtf8 . showJwtSecret)
            , ("jwt-secret-is-base64", T.toLower . show . configJwtSecretIsBase64)
            , ("jwt-cache-max-entries", show . configJwtCacheMaxEntries)
            , ("log-level", q . dumpLogLevel . configLogLevel)
            , ("log-query", T.toLower . show . configLogQuery)
            , ("openapi-mode", q . dumpOpenApiMode . configOpenApiMode)
            , ("openapi-security-active", T.toLower . show . configOpenApiSecurityActive)
            , ("openapi-server-proxy-uri", q . fromMaybe mempty . configOpenApiServerProxyUri)
            , ("server-cors-allowed-origins", q . T.intercalate "," . configServerCorsAllowedOrigins)
            , ("server-host", q . configServerHost)
            , ("server-port", show . configServerPort)
            , ("server-reuseport", T.toLower . show . configServerReusePort)
            , ("server-trace-header", q . T.decodeUtf8 . maybe mempty CI.original . configServerTraceHeader)
            , ("server-timing-enabled", T.toLower . show . configServerTimingEnabled)
            , ("server-unix-socket", q . maybe mempty T.pack . configServerUnixSocket)
            , ("server-unix-socket-mode", q . T.pack . showSocketMode)
            , ("url-use-legacy-target-names", T.toLower . show . configUrlUseLegacyTargetNames)
            , ("admin-server-host", q . configAdminServerHost)
            , ("admin-server-port", maybe "\"\"" show . configAdminServerPort)
            , ("admin-server-unix-socket", q . maybe mempty T.pack . configAdminServerUnixSocket)
            , ("admin-server-unix-socket-mode", q . T.pack . showAdminSocketMode)
            ]

    -- quote all app.settings
    appSettings = second q <$> configAppSettings conf

    -- quote strings and replace " with \"
    q s = "\"" <> T.replace "\"" "\\\"" s <> "\""

    dumpQi :: QualifiedIdentifier -> Text
    dumpQi (QualifiedIdentifier s i) =
      (if T.null s then mempty else s <> ".") <> i

    showTxEnd c = case (configDbTxRollbackAll c, configDbTxAllowOverride c) of
      (False, False) -> "commit"
      (False, True) -> "commit-allow-override"
      (True, False) -> "rollback"
      (True, True) -> "rollback-allow-override"
    showJwtSecret c
      | configJwtSecretIsBase64 c = B64.encode secret
      | otherwise = secret
      where
        secret = fromMaybe mempty $ configJwtSecret c
    showSocketMode c = showOct (configServerUnixSocketMode c) mempty
    showAdminSocketMode c = showOct (configAdminServerUnixSocketMode c) mempty

-- This class is needed for the polymorphism of overrideFromDbOrEnvironment
-- because C.required and C.optional have different signatures
class JustIfMaybe a b where
  justIfMaybe :: a -> b

instance JustIfMaybe a a where
  justIfMaybe = identity

instance JustIfMaybe a (Maybe a) where
  justIfMaybe = Just

-- | Reads and parses the config and overrides its parameters from env vars,
-- files or db settings.
readAppConfig :: [(Text, Text)] -> Maybe FilePath -> Maybe Text -> RoleSettings -> RoleIsolationLvl -> IO (Either Text AppConfig)
readAppConfig dbSettings optPath prevDbUri roleSettings roleIsolationLvl = do
  env <- readPGRSTEnvironment
  -- if no filename provided, start with an empty map to read config from environment
  conf <- maybe (return $ Right M.empty) loadConfig optPath

  case C.runParser (parser optPath env dbSettings roleSettings roleIsolationLvl) =<< mapLeft show conf of
    Left err ->
      return . Left $ "Error in config " <> err
    Right parsedConfig ->
      mapLeft show <$> decodeLoadFiles parsedConfig
  where
    -- Both C.ParseError and IOError are shown here
    loadConfig :: FilePath -> IO (Either SomeException C.Config)
    loadConfig = try . C.load

    decodeLoadFiles :: AppConfig -> IO (Either IOException AppConfig)
    decodeLoadFiles parsedConfig =
      try $
        decodeJWKS
          =<< decodeSecret
          =<< readSecretFile
          =<< readDbUriFile prevDbUri parsedConfig

parser :: Maybe FilePath -> Environment -> [(Text, Text)] -> RoleSettings -> RoleIsolationLvl -> C.Parser C.Config AppConfig
parser optPath env dbSettings roleSettings roleIsolationLvl =
  AppConfig
    <$> parseAppSettings "app.settings"
    <*> parseErrorVerbosity "client-error-verbosity"
    <*> (fromMaybe False <$> optBool "db-aggregates-enabled")
    <*> (fmap encodeUtf8 <$> optString "db-anon-role")
    <*> (fromMaybe "pgrst" <$> optString "db-channel")
    <*> (fromMaybe True <$> optBool "db-channel-enabled")
    <*> (maybe ["public"] splitOnCommasEmptyable <$> optStringEmptyable "db-extra-search-path")
    <*> (maybe defaultHoistedAllowList splitOnCommas <$> optString "db-hoisted-tx-settings")
    <*> optWithAlias
      (optInt "db-max-rows")
      (optInt "max-rows")
    <*> (fromMaybe False <$> optBool "db-plan-enabled")
    <*> (fromMaybe 10 <$> optInt "db-pool")
    <*> (fromMaybe 10 <$> optInt "db-pool-acquisition-timeout")
    <*> (fromMaybe 1800 <$> optInt "db-pool-max-lifetime")
    <*> ( fromMaybe 30
            <$> optWithAlias
              (optInt "db-pool-timeout")
              (optInt "db-pool-max-idletime")
        )
    <*> (fromMaybe True <$> optBool "db-pool-automatic-recovery")
    <*> ( fmap toQi
            <$> optWithAlias
              (optString "db-pre-request")
              (optString "pre-request")
        )
    <*> (fromMaybe True <$> optBool "db-prepared-statements")
    <*> ( fmap toQi
            <$> optWithAlias
              (optString "db-root-spec")
              (optString "root-spec")
        )
    <*> parseDbSchemas "db-schemas" "db-schema"
    <*> (fromMaybe True <$> optBool "db-config")
    <*> (fmap toQi <$> optString "db-pre-config")
    <*> parseTxEnd "db-tx-end" snd
    <*> parseTxEnd "db-tx-end" fst
    <*> (fromMaybe "postgresql://" <$> optString "db-uri")
    <*> pure optPath
    <*> pure Nothing
    <*> optStringOrURI "jwt-aud"
    <*> parseRoleClaimKey "jwt-role-claim-key" "role-claim-key"
    <*> (fmap encodeUtf8 <$> optString "jwt-secret")
    <*> ( fromMaybe False
            <$> optWithAlias
              (optBool "jwt-secret-is-base64")
              (optBool "secret-is-base64")
        )
    <*> (fromMaybe 1000 <$> optInt "jwt-cache-max-entries")
    <*> parseLogLevel "log-level"
    <*> (fromMaybe False <$> optBool "log-query")
    <*> parseOpenAPIMode "openapi-mode"
    <*> (fromMaybe False <$> optBool "openapi-security-active")
    <*> parseOpenAPIServerProxyURI "openapi-server-proxy-uri"
    <*> parseCORSAllowedOrigins "server-cors-allowed-origins"
    <*> (defaultServerHost <$> optString "server-host")
    <*> parseServerPort "server-port"
    <*> (fromMaybe False <$> optBool "server-reuseport")
    <*> (fmap (CI.mk . encodeUtf8) <$> optString "server-trace-header")
    <*> (fromMaybe False <$> optBool "server-timing-enabled")
    <*> (fmap T.unpack <$> optString "server-unix-socket")
    <*> parseSocketFileMode "server-unix-socket-mode"
    <*> (fromMaybe True <$> optBool "url-use-legacy-target-names")
    <*> ( defaultServerHost
            <$> optWithAlias
              (optString "admin-server-host")
              (optString "server-host")
        )
    <*> parseAdminServerPort "admin-server-port"
    <*> (fmap T.unpack <$> optString "admin-server-unix-socket")
    <*> parseSocketFileMode "admin-server-unix-socket-mode"
    <*> pure roleSettings
    <*> pure roleIsolationLvl
    <*> optInt "internal-schema-cache-query-sleep-before-queries"
    <*> optInt "internal-schema-cache-query-sleep"
  where
    parseErrorVerbosity :: C.Key -> C.Parser C.Config Verbosity
    parseErrorVerbosity k =
      optString k >>= \case
        Nothing -> pure Verbose -- default
        Just "minimal" -> pure Minimal
        Just "verbose" -> pure Verbose
        Just _ -> fail "Invalid client-error-verbosity. Check your configuration."

    parseAppSettings :: C.Key -> C.Parser C.Config [(Text, Text)]
    parseAppSettings key = addFromEnv . fmap (fmap coerceText) <$> C.subassocs key C.value
      where
        addFromEnv f = M.toList $ M.union fromEnv $ M.fromList f
        fromEnv = M.mapKeys fromJust $ M.filterWithKey (\k _ -> isJust k) $ M.mapKeys normalize env
        normalize k = ("app.settings." <>) <$> T.stripPrefix "PGRST_APP_SETTINGS_" (toS k)

    parseServerPort :: C.Key -> C.Parser C.Config Int
    parseServerPort k = fromMaybe 3000 <$> optInt k

    parseAdminServerPort :: C.Key -> C.Parser C.Config (Maybe Int)
    parseAdminServerPort k = do
      serverPort <- parseServerPort "server-port"
      optInt k >>= \case
        Nothing -> pure Nothing
        Just asp
          | asp == serverPort -> fail "admin-server-port cannot be the same as server-port"
          | otherwise -> pure $ Just asp

    parseDbSchemas :: C.Key -> C.Key -> C.Parser C.Config (NonEmpty Text)
    parseDbSchemas k al =
      optWithAlias (optString k) (optString al) >>= \case
        Nothing -> pure $ fromList ["public"]
        Just s
          | "pg_catalog" `elem` schemas -> fail (errMsg "pg_catalog")
          | "information_schema" `elem` schemas -> fail (errMsg "information_schema")
          | otherwise -> pure $ fromList schemas
          where
            schemas = splitOnCommas s
            errMsg x = "db-schemas does not allow schema: '" <> x <> "'"

    parseSocketFileMode :: C.Key -> C.Parser C.Config FileMode
    parseSocketFileMode k =
      optString k >>= \case
        Nothing -> pure 432 -- return default 660 mode if no value was provided
        Just fileModeText ->
          case readOct $ T.unpack fileModeText of
            [] ->
              fail $ "Invalid " <> T.unpack k <> ": not an octal"
            (fileMode, _) : _ ->
              if fileMode < 384 || fileMode > 511 then
                fail $ "Invalid " <> T.unpack k <> ": needs to be between 600 and 777"
              else
                pure fileMode

    parseOpenAPIMode :: C.Key -> C.Parser C.Config OpenAPIMode
    parseOpenAPIMode k =
      optString k >>= \case
        Nothing -> pure OAFollowPriv
        Just "follow-privileges" -> pure OAFollowPriv
        Just "ignore-privileges" -> pure OAIgnorePriv
        Just "disabled" -> pure OADisabled
        Just _ -> fail "Invalid openapi-mode. Check your configuration."

    parseOpenAPIServerProxyURI :: C.Key -> C.Parser C.Config (Maybe Text)
    parseOpenAPIServerProxyURI k =
      optString k >>= \case
        Nothing -> pure Nothing
        Just val
          | isMalformedProxyUri val -> fail "Malformed proxy uri, a correct example: https://example.com:8443/basePath"
          | otherwise -> pure $ Just val

    parseLogLevel :: C.Key -> C.Parser C.Config LogLevel
    parseLogLevel k =
      optString k >>= \case
        Nothing -> pure LogError
        Just "crit" -> pure LogCrit
        Just "error" -> pure LogError
        Just "warn" -> pure LogWarn
        Just "info" -> pure LogInfo
        Just "debug" -> pure LogDebug
        Just _ -> fail "Invalid logging level. Check your configuration."

    parseTxEnd :: C.Key -> ((Bool, Bool) -> Bool) -> C.Parser C.Config Bool
    parseTxEnd k f =
      optString k >>= \case
        --                                          RollbackAll AllowOverride
        Nothing -> pure $ f (False, False)
        Just "commit" -> pure $ f (False, False)
        Just "commit-allow-override" -> pure $ f (False, True)
        Just "rollback" -> pure $ f (True, False)
        Just "rollback-allow-override" -> pure $ f (True, True)
        Just _ -> fail "Invalid transaction termination. Check your configuration."

    parseRoleClaimKey :: C.Key -> C.Key -> C.Parser C.Config JSPath
    parseRoleClaimKey k al =
      optWithAlias (optString k) (optString al) >>= \case
        Nothing -> pure defaultRoleJSPathKey
        Just rck -> either (fail . show) pure $ pRoleClaimKey rck

    parseCORSAllowedOrigins k =
      optString k >>= \case
        Nothing -> pure []
        Just orig -> pure (T.strip <$> T.splitOn "," orig)

    optWithAlias :: C.Parser C.Config (Maybe a) -> C.Parser C.Config (Maybe a) -> C.Parser C.Config (Maybe a)
    optWithAlias orig alias =
      orig >>= \case
        Just v -> pure $ Just v
        Nothing -> alias

    optString :: C.Key -> C.Parser C.Config (Maybe Text)
    optString k = mfilter (/= "") <$> overrideFromDbOrEnvironment C.optional k coerceText

    optStringEmptyable :: C.Key -> C.Parser C.Config (Maybe Text)
    optStringEmptyable k = overrideFromDbOrEnvironment C.optional k coerceText

    optStringOrURI :: C.Key -> C.Parser C.Config (Maybe Text)
    optStringOrURI k = do
      stringOrURI <- mfilter (/= "") <$> overrideFromDbOrEnvironment C.optional k coerceText
      -- If the string contains ':' then it should
      -- be a valid URI according to RFC 3986
      case stringOrURI of
        Just s -> if T.isInfixOf ":" s then validateURI s else return (Just s)
        Nothing -> return Nothing
      where
        validateURI :: Text -> C.Parser C.Config (Maybe Text)
        validateURI s =
          if isURI (T.unpack s) then
            return $ Just s
          else
            fail "jwt-aud should be a string or a valid URI"

    optInt :: (Integral i, Read i) => C.Key -> C.Parser C.Config (Maybe i)
    optInt k = join <$> overrideFromDbOrEnvironment C.optional k coerceInt

    optBool :: C.Key -> C.Parser C.Config (Maybe Bool)
    optBool k = join <$> overrideFromDbOrEnvironment C.optional k coerceBool

    overrideFromDbOrEnvironment
      :: (JustIfMaybe a b)
      => (C.Key -> C.Parser C.Value a -> C.Parser C.Config b)
      -> C.Key
      -> (C.Value -> a)
      -> C.Parser C.Config b
    overrideFromDbOrEnvironment necessity key coercion =
      case dbConf <|> M.lookup envVarName env of
        Just dbOrEnvVal -> pure $ justIfMaybe $ coercion $ C.String dbOrEnvVal
        Nothing -> necessity key (coercion <$> C.value)
      where
        dashToUnderscore '-' = '_'
        dashToUnderscore c = c
        envVarName = "PGRST_" <> (toUpper . dashToUnderscore <$> toS key)
        dbConf = lookup (T.pack $ dashToUnderscore <$> toS key) dbSettings

    coerceText :: C.Value -> Text
    coerceText (C.String s) = s
    coerceText v = show v

    coerceInt :: (Integral i, Read i) => C.Value -> Maybe i
    coerceInt (C.Number x) = rightToMaybe $ floatingOrInteger x
    coerceInt (C.String x) = readMaybe x
    coerceInt _ = Nothing

    coerceBool :: C.Value -> Maybe Bool
    coerceBool (C.Bool b) = Just b
    coerceBool (C.String s) =
      -- parse all kinds of text: True, true, TRUE, "true", ...
      case readMaybe $ T.toTitle $ T.filter isAlpha $ toS s of
        Just b -> Just b
        -- numeric instead?
        Nothing -> (> 0) <$> (readMaybe s :: Maybe Integer)
    coerceBool _ = Nothing

    splitOnCommas :: Text -> [Text]
    splitOnCommas s = T.strip <$> T.splitOn "," s

    splitOnCommasEmptyable :: Text -> [Text]
    splitOnCommasEmptyable "" = []
    splitOnCommasEmptyable s = T.strip <$> T.splitOn "," s

    defaultHoistedAllowList = ["statement_timeout", "plan_filter.statement_cost_limit", "default_transaction_isolation"]

    defaultServerHost :: Maybe Text -> Text
    defaultServerHost = fromMaybe "!4"

-- | Read the JWT secret from a file if configJwtSecret is actually a
-- filepath(has @ as its prefix). To check if the JWT secret is provided is
-- in fact a file path, it must be decoded as 'Text' to be processed.
readSecretFile :: AppConfig -> IO AppConfig
readSecretFile conf =
  maybe (return conf) readSecret maybeFilename
  where
    maybeFilename = T.stripPrefix "@" . decodeUtf8 =<< configJwtSecret conf
    readSecret filename = do
      jwtSecret <- chomp <$> BS.readFile (toS filename)
      return $ conf{configJwtSecret = Just jwtSecret}
    chomp bs = fromMaybe bs (BS.stripSuffix "\n" bs)

decodeSecret :: AppConfig -> IO AppConfig
decodeSecret conf@AppConfig{..} =
  case (configJwtSecretIsBase64, configJwtSecret) of
    (True, Just secret) ->
      either fail (return . updateSecret) $ decodeB64 secret
    _ -> return conf
  where
    updateSecret bs = conf{configJwtSecret = Just bs}
    decodeB64 = B64.decode . encodeUtf8 . T.strip . replaceUrlChars . decodeUtf8
    replaceUrlChars = T.replace "_" "/" . T.replace "-" "+" . T.replace "." "="

-- | Parse `jwt-secret` configuration option and turn into a JWKS.
--
-- There are three ways to specify `jwt-secret`: text secret, JSON Web Key
-- (JWK), or JSON Web Key Set (JWKS). The first two are converted into a JwkSet
-- with one key and the last is converted as is.
decodeJWKS :: AppConfig -> IO AppConfig
decodeJWKS conf = do
  jwks <- case configJwtSecret conf of
    Just s -> either fail (pure . Just) $ parseSecret s
    Nothing -> pure Nothing
  return $ conf{configJWKS = jwks}

parseSecret :: ByteString -> Either [Char] JwkSet
parseSecret bytes =
  case maybeJWKSet of
    Just jwk -> Right jwk
    Nothing -> maybe validateSecret (\jwk' -> Right $ JWT.JwkSet [jwk']) maybeJWK
  where
    maybeJWKSet = JSON.decodeStrict bytes :: Maybe JwkSet
    maybeJWK = JSON.decodeStrict bytes :: Maybe Jwk
    secret = JWT.JwkSet [JWT.SymmetricJwk bytes Nothing (Just JWT.Sig) (Just $ JWT.Signed JWT.HS256)]
    validateSecret
      | BS.length bytes < 32 = Left "The JWT secret must be at least 32 characters long."
      | otherwise = Right secret

-- | Read database uri from a separate file if `db-uri` is a filepath.
readDbUriFile :: Maybe Text -> AppConfig -> IO AppConfig
readDbUriFile maybeDbUri conf =
  case maybeDbUri of
    Just prevDbUri ->
      pure $ conf{configDbUri = prevDbUri}
    Nothing ->
      case T.stripPrefix "@" $ configDbUri conf of
        Nothing -> return conf
        Just filename -> do
          dbUri <- T.strip <$> readFile (toS filename)
          return $ conf{configDbUri = dbUri}

type Environment = M.Map [Char] Text

-- | Read environment variables that start with PGRST_
readPGRSTEnvironment :: IO Environment
readPGRSTEnvironment =
  M.map T.pack . M.fromList . filter (isPrefixOf "PGRST_" . fst) <$> getEnvironment

data PGConnString = PGURI | PGKeyVal

-- Uses same logic as libpq recognized_connection_string
-- https://github.com/postgres/postgres/blob/5eafacd2797dc0b04a0bde25fbf26bf79903e7c2/src/interfaces/libpq/fe-connect.c#L5923-L5936
pgConnString :: Text -> Maybe PGConnString
pgConnString conn
  | uriDesignator `T.isPrefixOf` conn || shortUriDesignator `T.isPrefixOf` conn = Just PGURI
  | "=" `T.isInfixOf` conn = Just PGKeyVal
  | otherwise = Nothing
  where
    uriDesignator = "postgresql://"
    shortUriDesignator = "postgres://"

-- | Adds a `fallback_application_name` value to the connection string. This allows querying the PostgREST version on pg_stat_activity.
--
-- >>> import Protolude
-- >>> let ver = "11.1.0 (5a04ec7)"::ByteString
-- >>> let strangeVer = "11'1&0@#$%,.:\"[]{}?+^()=asdfqwer"::ByteString
--
-- >>> addFallbackAppName ver "postgres://user:pass@host:5432/postgres"
-- "postgres://user:pass@host:5432/postgres?fallback_application_name=PostgREST%2011.1.0%20%285a04ec7%29"
--
-- >>> addFallbackAppName ver "postgres://user:pass@host:5432/postgres?"
-- "postgres://user:pass@host:5432/postgres?fallback_application_name=PostgREST%2011.1.0%20%285a04ec7%29"
--
-- >>> addFallbackAppName ver "postgres:///postgres?host=server&port=5432"
-- "postgres:///postgres?host=server&port=5432&fallback_application_name=PostgREST%2011.1.0%20%285a04ec7%29"
--
-- >>> addFallbackAppName ver "postgresql://"
-- "postgresql://?fallback_application_name=PostgREST%2011.1.0%20%285a04ec7%29"
--
-- >>> addFallbackAppName strangeVer "postgres:///postgres?host=server&port=5432"
-- "postgres:///postgres?host=server&port=5432&fallback_application_name=PostgREST%2011%271%260%40%23%24%25%2C.%3A%22%5B%5D%7B%7D%3F%2B%5E%28%29%3Dasdfqwer"
--
-- >>> addFallbackAppName ver "postgres://user:invalid_chars[]#@host:5432/postgres"
-- "postgres://user:invalid_chars[]#@host:5432/postgres?fallback_application_name=PostgREST%2011.1.0%20%285a04ec7%29"
--
-- >>> addFallbackAppName ver "host=localhost port=5432 dbname=postgres"
-- "host=localhost port=5432 dbname=postgres fallback_application_name='PostgREST 11.1.0 (5a04ec7)'"
--
-- >>> addFallbackAppName strangeVer "host=localhost port=5432 dbname=postgres"
-- "host=localhost port=5432 dbname=postgres fallback_application_name='PostgREST 11\\'1&0@#$%,.:\"[]{}?+^()=asdfqwer'"
--
-- works with passwords containing `?`
-- >>> addFallbackAppName ver "postgres://admin2:?pass?special?@localhost:5432/postgres"
-- "postgres://admin2:?pass?special?@localhost:5432/postgres?fallback_application_name=PostgREST%2011.1.0%20%285a04ec7%29"
--
-- >>> addFallbackAppName ver "postgresql://?dbname=postgres&host=/run/user/1000/postgrest/postgrest-with-postgresql-16-BuR/socket&user=some_protected_user&password=invalid_pass"
-- "postgresql://?dbname=postgres&host=/run/user/1000/postgrest/postgrest-with-postgresql-16-BuR/socket&user=some_protected_user&password=invalid_pass&fallback_application_name=PostgREST%2011.1.0%20%285a04ec7%29"
--
-- >>> addFallbackAppName ver "postgresql:///postgres?host=/run/user/1000/postgrest/postgrest-with-postgresql-16-BuR/socket&user=some_protected_user&password=invalid_pass"
-- "postgresql:///postgres?host=/run/user/1000/postgrest/postgrest-with-postgresql-16-BuR/socket&user=some_protected_user&password=invalid_pass&fallback_application_name=PostgREST%2011.1.0%20%285a04ec7%29"
addFallbackAppName :: ByteString -> Text -> Text
addFallbackAppName version dbUri = addConnStringOption dbUri "fallback_application_name" pgrstVer
  where
    pgrstVer = "PostgREST " <> T.decodeUtf8 version

-- | Adds `target_session_attrs=read-write` to the connection string. This allows using PostgREST listener when multiple hosts are specified in the connection string.
--
-- >>> addTargetSessionAttrs "postgres:///postgres?host=/dir/0kN/socket_replica_24378,/dir/0kN/socket"
-- "postgres:///postgres?host=/dir/0kN/socket_replica_24378,/dir/0kN/socket&target_session_attrs=read-write"
--
-- >>> addTargetSessionAttrs "postgresql://host1:123,host2:456/somedb"
-- "postgresql://host1:123,host2:456/somedb?target_session_attrs=read-write"
--
-- >>> addTargetSessionAttrs "postgresql://host1:123,host2:456/somedb?fallback_application_name=foo"
-- "postgresql://host1:123,host2:456/somedb?fallback_application_name=foo&target_session_attrs=read-write"
--
-- adds target_session_attrs despite one existing
-- >>> addTargetSessionAttrs "postgresql://host1:123,host2:456/somedb?target_session_attrs=read-only"
-- "postgresql://host1:123,host2:456/somedb?target_session_attrs=read-only&target_session_attrs=read-write"
--
-- >>> addTargetSessionAttrs "host=localhost port=5432 dbname=postgres"
-- "host=localhost port=5432 dbname=postgres target_session_attrs='read-write'"
addTargetSessionAttrs :: Text -> Text
addTargetSessionAttrs dbUri = addConnStringOption dbUri "target_session_attrs" "read-write"

toConnectionSettings :: (Text -> Text) -> AppConfig -> [SQL.Setting]
toConnectionSettings transformUri AppConfig{configDbUri, configDbPreparedStatements} =
  [ SQL.connection $ SQL.string $ transformUri . addFallbackAppName prettyVersion $ configDbUri
  , SQL.usePreparedStatements configDbPreparedStatements
  ]

addConnStringOption :: Text -> Text -> Text -> Text
addConnStringOption dbUri key val =
  dbUri
    <> case pgConnString dbUri of
      Nothing -> mempty
      Just PGKeyVal -> " " <> keyValFmt
      Just PGURI -> case lookAtOptions dbUri of
        (_, "") -> "?" <> uriFmt
        (_, "?") -> uriFmt
        (_, _) -> "&" <> uriFmt
  where
    uriFmt = key <> "=" <> toS (escapeURIString isUnescapedInURIComponent $ toS val)
    keyValFmt = key <> "=" <> "'" <> T.replace "'" "\\'" val <> "'"
    lookAtOptions x = T.breakOn "?" . snd $ T.breakOnEnd "@" x -- start from after `@` to not mess passwords that include `?`, see https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING-URIS

-- | Example config file displayed on postgrest "--example" flag
exampleConfigFile :: [Char]
exampleConfigFile =
  S.unlines
    [ "## Admin server used for checks. It's disabled by default unless a port is specified."
    , "# admin-server-port = 3001"
    , ""
    , "# PostgREST error json verbosity config"
    , "# client-error-verbosity = \"verbose\""
    , ""
    , "## The database role to use when no client authentication is provided"
    , "# db-anon-role = \"anon\""
    , ""
    , "## Notification channel for reloading the schema cache"
    , "db-channel = \"pgrst\""
    , ""
    , "## Enable or disable the notification channel"
    , "db-channel-enabled = true"
    , ""
    , "## Enable in-database configuration"
    , "db-config = true"
    , ""
    , "## Function for in-database configuration"
    , "## db-pre-config = \"postgrest.pre_config\""
    , ""
    , "## Extra schemas to add to the search_path of every request"
    , "db-extra-search-path = \"public\""
    , ""
    , "## Limit rows in response"
    , "# db-max-rows = 1000"
    , ""
    , "## Allow getting the EXPLAIN plan through the `Accept: application/vnd.pgrst.plan` header"
    , "# db-plan-enabled = false"
    , ""
    , "## Number of open connections in the pool"
    , "db-pool = 10"
    , ""
    , "## Time in seconds to wait to acquire a slot from the connection pool"
    , "# db-pool-acquisition-timeout = 10"
    , ""
    , "## Time in seconds after which to recycle pool connections"
    , "# db-pool-max-lifetime = 1800"
    , ""
    , "## Time in seconds after which to recycle unused pool connections"
    , "# db-pool-max-idletime = 30"
    , ""
    , "## Allow automatic database connection retrying"
    , "# db-pool-automatic-recovery = true"
    , ""
    , "## Stored proc to exec immediately after auth"
    , "# db-pre-request = \"stored_proc_name\""
    , ""
    , "## Enable or disable prepared statements. disabling is only necessary when behind a connection pooler."
    , "## When disabled, statements will be parametrized but won't be prepared."
    , "db-prepared-statements = true"
    , ""
    , "## The name of which database schema to expose to REST clients"
    , "db-schemas = \"public\""
    , ""
    , "## How to terminate database transactions"
    , "## Possible values are:"
    , "## commit (default)"
    , "##   Transaction is always committed, this can not be overridden"
    , "## commit-allow-override"
    , "##   Transaction is committed, but can be overridden with Prefer tx=rollback header"
    , "## rollback"
    , "##   Transaction is always rolled back, this can not be overridden"
    , "## rollback-allow-override"
    , "##   Transaction is rolled back, but can be overridden with Prefer tx=commit header"
    , "db-tx-end = \"commit\""
    , ""
    , "## The standard connection URI format, documented at"
    , "## https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING"
    , "db-uri = \"postgresql://\""
    , ""
    , "# jwt-aud = \"your_audience_claim\""
    , ""
    , "## Jspath to the role claim key"
    , "jwt-role-claim-key = \".role\""
    , ""
    , "## Choose a secret, JSON Web Key (or set) to enable JWT auth"
    , "## (use \"@filename\" to load from separate file)"
    , "# jwt-secret = \"secret_with_at_least_32_characters\""
    , "jwt-secret-is-base64 = false"
    , ""
    , "## Enables JWT Cache and sets its max size, disables caching with 0"
    , "# jwt-cache-max-entries = 0"
    , ""
    , "## Logging level, the admitted values are: crit, error, warn, info and debug."
    , "log-level = \"error\""
    , ""
    , "## Log the SQL query at the current log-level."
    , "log-query = false"
    , ""
    , "## Determine if the OpenAPI output should follow or ignore role privileges or be disabled entirely."
    , "## Admitted values: follow-privileges, ignore-privileges, disabled"
    , "openapi-mode = \"follow-privileges\""
    , ""
    , "## Base url for the OpenAPI output"
    , "openapi-server-proxy-uri = \"\""
    , ""
    , "## Configurable CORS origins"
    , "# server-cors-allowed-origins = \"\""
    , ""
    , "server-host = \"!4\""
    , "server-port = 3000"
    , "server-reuseport = false"
    , ""
    , "## Allow getting the request-response timing information through the `Server-Timing` header"
    , "server-timing-enabled = false"
    , ""
    , "## Unix socket location"
    , "## if specified it takes precedence over server-port"
    , "# server-unix-socket = \"/tmp/pgrst.sock\""
    , ""
    , "## Unix socket file mode"
    , "## When none is provided, 660 is applied by default"
    , "# server-unix-socket-mode = \"660\""
    , ""
    , "## Use legacy target names in relationship filters"
    , "## If active, allows using the target name of the relationship in filters even if it has an alias."
    , "## Otherwise it only allows the alias in filters"
    , "url-use-legacy-target-names = true"
    ]
