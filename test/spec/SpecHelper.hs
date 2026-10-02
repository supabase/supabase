module SpecHelper where

import Control.Lens ((^?))
import Data.Aeson ((.=))
import Data.Aeson.Lens
import Data.CaseInsensitive (CI (..), original)
import Data.List (lookup)
import Data.List.NonEmpty (fromList)
import Data.Scientific (toRealFloat)
import Data.String (String)
import Data.Time.Clock.POSIX (getPOSIXTime)
import Network.HTTP.Types
import Network.Wai (Application)
import Network.Wai.Test (SResponse (simpleBody, simpleHeaders, simpleStatus))
import Protolude hiding (get, toS)
import Protolude.Conv (toS)
import System.IO.Unsafe (unsafePerformIO)
import Test.Hspec
import Test.Hspec.Wai
import Text.Regex.TDFA ((=~))

import Data.Aeson qualified as JSON
import Data.ByteString.Base64 qualified as B64 (decodeLenient)
import Data.ByteString.Char8 qualified as BS
import Data.ByteString.Lazy qualified as BL
import Data.Map.Strict qualified as M
import Data.Set qualified as S
import Jose.Jwa qualified as JWT
import Jose.Jws qualified as JWT
import Jose.Jwt qualified as JWT

import PostgREST.Catalog.Identifiers (QualifiedIdentifier (..))
import PostgREST.Config
  ( AppConfig (..)
  , LogLevel (..)
  , OpenAPIMode (..)
  , Verbosity (..)
  , defaultRoleJSPathKey
  , parseSecret
  )

filterAndMatchCT :: BS.ByteString -> MatchHeader
filterAndMatchCT val = MatchHeader $ \headers _ ->
  case filter (\(n, _) -> n == hContentType) headers of
    [(_, v)] ->
      if v == val then
        Nothing
      else
        Just $ "missing value:" <> toS val <> "\n"
    _ -> Just "unexpected header: zero or multiple headers present\n"

matchContentTypeJson :: MatchHeader
matchContentTypeJson =
  filterAndMatchCT "application/json; charset=utf-8"

matchContentTypeSingular :: MatchHeader
matchContentTypeSingular =
  filterAndMatchCT "application/vnd.pgrst.object+json; charset=utf-8"

matchCTArrayStrip :: MatchHeader
matchCTArrayStrip =
  filterAndMatchCT "application/vnd.pgrst.array+json;nulls=stripped; charset=utf-8"

matchCTSingularStrip :: MatchHeader
matchCTSingularStrip =
  filterAndMatchCT "application/vnd.pgrst.object+json;nulls=stripped; charset=utf-8"

matchHeaderValuePresent :: HeaderName -> BS.ByteString -> MatchHeader
matchHeaderValuePresent name val = MatchHeader $ \headers _ ->
  case lookup name headers of
    Just hdr -> if val `BS.isInfixOf` hdr then Nothing else Just $ "missing header value: " <> toS val <> "\n"
    Nothing -> Just $ "missing header: " <> toS (original name) <> "\n"

matchHeaderAbsent :: HeaderName -> MatchHeader
matchHeaderAbsent name = MatchHeader $ \headers _body ->
  case lookup name headers of
    Just _ -> Just $ "unexpected header: " <> toS (original name) <> "\n"
    Nothing -> Nothing

-- | Matches Server-Timing header has a well-formed metric with the given name
matchServerTimingHasTiming :: String -> MatchHeader
matchServerTimingHasTiming metric = MatchHeader $ \headers _body ->
  case lookup "Server-Timing" headers of
    Just hdr ->
      if hdr =~ (metric <> ";dur=[[:digit:]]+.[[:digit:]]+") then
        Nothing
      else
        Just $ "missing metric: " <> metric <> "\n"
    Nothing -> Just "missing Server-Timing header\n"

parseServerTimingHeader :: [Header] -> M.Map BS.ByteString Double
parseServerTimingHeader [] = M.empty
parseServerTimingHeader (h : hs) =
  case h of
    ("Server-Timing", timingHeader) ->
      let timings = BS.split ',' timingHeader
      in  M.fromList $ mapMaybe splitEachTiming timings
    _ -> parseServerTimingHeader hs
  where
    splitEachTiming :: ByteString -> Maybe (BS.ByteString, Double)
    splitEachTiming t =
      case BS.split ';' t of
        [name, durationText] ->
          case BS.split '=' durationText of
            [_, duration] -> (name,) <$> readMaybe (BS.unpack duration)
            _ -> Nothing
        _ -> Nothing

validateOpenApiResponse :: [Header] -> WaiSession () ()
validateOpenApiResponse headers = do
  r <- request methodGet "/" headers ""
  liftIO $
    let respStatus = simpleStatus r
    in  respStatus
          `shouldSatisfy` \s -> s == Status{statusCode = 200, statusMessage = "OK"}
  liftIO $
    let respHeaders = simpleHeaders r
    in  respHeaders
          `shouldSatisfy` \hs -> ("Content-Type", "application/openapi+json; charset=utf-8") `elem` hs
  Just body <- pure $ JSON.decode (simpleBody r)
  Just schema <- liftIO $ JSON.decode <$> BL.readFile "test/spec/fixtures/openapi.json"
  let
    args :: M.Map Text JSON.Value
    args =
      M.fromList
        [ ("schema", schema)
        , ("data", body)
        ]
    hdrs = acceptHdrs "application/json"
  request methodPost "/rpc/validate_json_schema" hdrs (JSON.encode args)
    `shouldRespondWith` "true"
      { matchStatus = 200
      , matchHeaders = []
      }

type SpecWithConfig = (AppConfig -> SpecWith ((), Application) -> Spec) -> Spec

baseCfg :: AppConfig
baseCfg =
  let secret = encodeUtf8 "reallyreallyreallyreallyverysafe"
  in  AppConfig
        { configAppSettings = [("app.settings.app_host", "localhost"), ("app.settings.external_api_secret", "0123456789abcdef")]
        , configClientErrorVerbosity = Verbose
        , configDbAggregates = False
        , configDbAnonRole = Just "postgrest_test_anonymous"
        , configDbChannel = mempty
        , configDbChannelEnabled = True
        , configDbExtraSearchPath = []
        , configDbHoistedTxSettings = ["default_transaction_isolation", "plan_filter.statement_cost_limit", "statement_timeout"]
        , configDbMaxRows = Nothing
        , configDbPlanEnabled = False
        , configDbPoolSize = 10
        , configDbPoolAcquisitionTimeout = 10
        , configDbPoolMaxLifetime = 1800
        , configDbPoolMaxIdletime = 600
        , configDbPoolAutomaticRecovery = True
        , configDbPreRequest = Just $ QualifiedIdentifier "test" "switch_role"
        , configDbPreparedStatements = True
        , configDbRootSpec = Nothing
        , configDbSchemas = fromList ["test"]
        , configDbConfig = False
        , configDbPreConfig = Nothing
        , configDbUri = "postgresql://"
        , configFilePath = Nothing
        , configJWKS = rightToMaybe $ parseSecret secret
        , configJwtAudience = Nothing
        , configJwtRoleClaimKey = defaultRoleJSPathKey
        , configJwtSecret = Just secret
        , configJwtSecretIsBase64 = False
        , configJwtCacheMaxEntries = 10
        , configLogLevel = LogCrit
        , configLogQuery = False
        , configOpenApiMode = OAFollowPriv
        , configOpenApiSecurityActive = False
        , configOpenApiServerProxyUri = Nothing
        , configServerCorsAllowedOrigins = []
        , configServerHost = "localhost"
        , configServerPort = 3000
        , configServerReusePort = False
        , configServerTraceHeader = Nothing
        , configServerUnixSocket = Nothing
        , configServerUnixSocketMode = 432
        , configUrlUseLegacyTargetNames = True
        , configDbTxAllowOverride = True
        , configDbTxRollbackAll = True
        , configAdminServerHost = "localhost"
        , configAdminServerPort = Nothing
        , configAdminServerUnixSocket = Nothing
        , configAdminServerUnixSocketMode = 432
        , configRoleSettings = mempty
        , configRoleIsoLvl = mempty
        , configInternalSCQuerySleepFst = Nothing
        , configInternalSCQuerySleepSnd = Nothing
        , configServerTimingEnabled = True
        }

rangeHdrs :: ByteRange -> [Header]
rangeHdrs r = [rangeUnit, (hRange, renderByteRange r)]

rangeHdrsWithCount :: ByteRange -> [Header]
rangeHdrsWithCount r = ("Prefer", "count=exact") : rangeHdrs r

acceptHdrs :: BS.ByteString -> [Header]
acceptHdrs mime = [(hAccept, mime)]

planHdr :: Header
planHdr = (hAccept, "application/vnd.pgrst.plan+json")

rangeUnit :: Header
rangeUnit = ("Range-Unit" :: CI BS.ByteString, "items")

matchHeader :: CI BS.ByteString -> BS.ByteString -> [Header] -> Bool
matchHeader name valRegex headers =
  maybe False (=~ valRegex) $ lookup name headers

noBlankHeader :: [Header] -> Bool
noBlankHeader = notElem mempty

noProfileHeader :: [Header] -> Bool
noProfileHeader headers = isNothing $ find ((== "Content-Profile") . fst) headers

notZeroContentLength :: [Header] -> Bool
notZeroContentLength headers = maybe False (/= "0") $ lookup hContentLength headers

authHeader :: BS.ByteString -> BS.ByteString -> Header
authHeader typ creds =
  (hAuthorization, typ <> " " <> creds)

authHeaderJWT :: BS.ByteString -> Header
authHeaderJWT = authHeader "Bearer"

generateSecret :: ByteString
generateSecret = B64.decodeLenient "cmVhbGx5cmVhbGx5cmVhbGx5cmVhbGx5dmVyeXNhZmU="

generateJWT :: BL.ByteString -> ByteString
generateJWT claims =
  either mempty JWT.unJwt $ JWT.hmacEncode JWT.HS256 generateSecret (BL.toStrict claims)

generateJWTWithSecret :: BL.ByteString -> ByteString -> ByteString
generateJWTWithSecret claims secret =
  either mempty JWT.unJwt $ JWT.hmacEncode JWT.HS256 secret (BL.toStrict claims)

-- | Tests whether the text can be parsed as a json object containing
-- the key "message", and optional keys "details", "hint", "code",
-- and no extraneous keys
isErrorFormat :: BL.ByteString -> Bool
isErrorFormat s =
  "message" `S.member` keys
    && S.null (S.difference keys validKeys)
  where
    obj = JSON.decode s :: Maybe (M.Map Text JSON.Value)
    keys = maybe S.empty M.keysSet obj
    validKeys = S.fromList ["message", "details", "hint", "code"]

planCost :: SResponse -> Float
planCost resp =
  let res = simpleBody resp ^? nth 0 . key "Plan" . key "Total Cost"
  in  -- big value in case parsing fails
      fromMaybe 1_000_000_000.0 $ unbox =<< res
  where
    unbox :: JSON.Value -> Maybe Float
    unbox (JSON.Number n) = Just $ toRealFloat n
    unbox _ = Nothing

data TiobePlsRow = TiobePlsRow
  { name' :: Text
  , rank :: Int
  }
  deriving (Show)

instance JSON.ToJSON TiobePlsRow where
  toJSON (TiobePlsRow name'' rank') = JSON.object ["name" .= name'', "rank" .= rank']

getInsertDataForTiobePlsTable :: Int -> BL.ByteString
getInsertDataForTiobePlsTable rows =
  JSON.encode $ fromList $ [TiobePlsRow{name' = nm, rank = rk} | (nm, rk) <- nameRankList]
  where
    nameRankList = [("Lang " <> show i, i) | i <- [20 .. (rows + 20)]] :: [(Text, Int)]

readFixtureFile :: FilePath -> BL.ByteString
readFixtureFile file = unsafePerformIO $ BL.readFile $ "test/spec/fixtures/" <> file

relativeSeconds :: Integer -> IO Integer
relativeSeconds s = do
  currTime <- getPOSIXTime
  return $ floor currTime + s
