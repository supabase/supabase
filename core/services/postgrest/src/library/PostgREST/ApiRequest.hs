{-# LANGUAGE LambdaCase #-}
{-# LANGUAGE NamedFieldPuns #-}

-- |
-- Module      : PostgREST.Request.ApiRequest
-- Description : PostgREST functions to translate HTTP request to a domain type called ApiRequest.
module PostgREST.ApiRequest
  ( ApiRequest (..)
  , userApiRequest
  , userPreferences
  , userBearerAuth
  )
where

import Data.List (lookup)
import Data.Ranged.Ranges
  ( emptyRange
  , rangeIntersection
  , rangeIsEmpty
  )
import Network.HTTP.Types.Header (RequestHeaders, hAuthorization, hCookie)
import Network.Wai (Request (..))
import Network.Wai.Middleware.HttpAuth (extractBearerAuth)
import Network.Wai.Parse (parseHttpAccept)
import Protolude
import Web.Cookie (parseCookies)

import Data.CaseInsensitive qualified as CI
import Data.HashMap.Strict qualified as HM
import Data.List.NonEmpty qualified as NonEmptyList
import Data.Set qualified as S
import Data.Text.Encoding qualified as T

import PostgREST.ApiRequest.Payload (getPayload)
import PostgREST.ApiRequest.QueryParams (QueryParams (..))
import PostgREST.ApiRequest.Types
  ( Action (..)
  , DbAction (..)
  , InvokeMethod (..)
  , Mutation (..)
  , Payload (..)
  , RequestBody
  , Resource (..)
  )
import PostgREST.Catalog.Identifiers
  ( FieldName
  , QualifiedIdentifier (..)
  , Schema
  )
import PostgREST.Config (AppConfig (..), OpenAPIMode (..))
import PostgREST.Error (ApiRequestError (..), RangeError (..))
import PostgREST.MediaType (MediaType (..))
import PostgREST.RangeQuery
  ( NonnegRange
  , allRange
  , convertToLimitZeroRange
  , hasLimitZero
  , rangeRequested
  )

import PostgREST.ApiRequest.Preferences qualified as Preferences
import PostgREST.ApiRequest.QueryParams qualified as QueryParams
import PostgREST.MediaType qualified as MediaType

-- |
--   Describes what the user wants to do. This data type is a
--   translation of the raw elements of an HTTP request into domain
--   specific language.  There is no guarantee that the intent is
--   sensible, it is up to a later stage of processing to determine
--   if it is an action we are able to perform.
data ApiRequest = ApiRequest
  { iAction :: Action
  -- ^ Action on the resource
  , iRange :: HM.HashMap Text NonnegRange
  -- ^ Requested range of rows within response
  , iTopLevelRange :: NonnegRange
  -- ^ Requested range of rows from the top level
  , iPayload :: Maybe Payload
  -- ^ Data sent by client and used for mutation actions
  , iPreferences :: Preferences.Preferences
  -- ^ Prefer header values
  , iQueryParams :: QueryParams.QueryParams
  , iColumns :: S.Set FieldName
  -- ^ parsed columns from &columns parameter and payload
  , iHeaders :: [(ByteString, ByteString)]
  -- ^ HTTP request headers
  , iCookies :: [(ByteString, ByteString)]
  -- ^ Request Cookies
  , iPath :: ByteString
  -- ^ Raw request path
  , iMethod :: ByteString
  -- ^ Raw request method
  , iSchema :: Schema
  -- ^ The request schema. Can vary depending on profile headers.
  , iNegotiatedByProfile :: Bool
  -- ^ If schema was was chosen according to the profile spec https://www.w3.org/TR/dx-prof-conneg/
  , iAcceptMediaType :: [MediaType]
  -- ^ The resolved media types in the Accept, considering quality(q) factors
  , iContentMediaType :: MediaType
  -- ^ The media type in the Content-Type header
  }

-- | Examines HTTP request and translates it into user intent.
userApiRequest :: AppConfig -> Preferences.Preferences -> Request -> RequestBody -> Either ApiRequestError ApiRequest
userApiRequest conf prefs req reqBody = do
  resource <- getResource conf $ pathInfo req
  (schema, negotiatedByProfile) <- getSchema conf hdrs method
  act <- getAction resource schema method
  qPrms <- first QueryParamError $ QueryParams.parse (actIsInvokeSafe act) $ rawQueryString req
  (topLevelRange, ranges) <- getRanges method qPrms hdrs
  (payload, columns) <- getPayload reqBody contentMediaType qPrms act
  return $
    ApiRequest
      { iAction = act
      , iRange = ranges
      , iTopLevelRange = topLevelRange
      , iPayload = payload
      , iPreferences = prefs
      , iQueryParams = qPrms
      , iColumns = columns
      , iHeaders = iHdrs
      , iCookies = iCkies
      , iPath = rawPathInfo req
      , iMethod = method
      , iSchema = schema
      , iNegotiatedByProfile = negotiatedByProfile
      , iAcceptMediaType = maybe [MTAny] (map MediaType.decodeMediaType . parseHttpAccept) $ lookupHeader "accept"
      , iContentMediaType = contentMediaType
      }
  where
    method = requestMethod req
    hdrs = requestHeaders req
    lookupHeader = flip lookup hdrs
    iHdrs = [(CI.foldedCase k, v) | (k, v) <- hdrs, k /= hCookie]
    iCkies = maybe [] parseCookies $ lookupHeader "Cookie"
    contentMediaType = maybe MTApplicationJSON MediaType.decodeMediaType $ lookupHeader "content-type"
    actIsInvokeSafe x = case x of ActDb (ActRoutine _ (InvRead _)) -> True; _ -> False

-- | Parses the Prefer header
userPreferences :: AppConfig -> Request -> Preferences.Preferences
userPreferences conf req = Preferences.fromHeaders (configDbTxAllowOverride conf) $ requestHeaders req

-- | Obtains the Bearer Auth
userBearerAuth :: Request -> Maybe ByteString
userBearerAuth req = extractBearerAuth =<< lookup hAuthorization (requestHeaders req)

getResource :: AppConfig -> [Text] -> Either ApiRequestError Resource
getResource AppConfig{configOpenApiMode, configDbRootSpec} = \case
  [] ->
    case (configOpenApiMode, configDbRootSpec) of
      (OADisabled, _) -> Left OpenAPIDisabled
      (_, Just qi) -> Right $ ResourceRoutine (qiName qi)
      (_, Nothing) -> Right ResourceSchema
  [table] -> Right $ ResourceRelation table
  ["rpc", pName] -> Right $ ResourceRoutine pName
  _ -> Left InvalidResourcePath

getAction :: Resource -> Schema -> ByteString -> Either ApiRequestError Action
getAction resource schema method =
  case (resource, method) of
    (ResourceRoutine rout, "HEAD") -> Right . ActDb $ ActRoutine (qi rout) $ InvRead True
    (ResourceRoutine rout, "GET") -> Right . ActDb $ ActRoutine (qi rout) $ InvRead False
    (ResourceRoutine rout, "POST") -> Right . ActDb $ ActRoutine (qi rout) Inv
    (ResourceRoutine rout, "OPTIONS") -> Right $ ActRoutineInfo (qi rout) $ InvRead True
    (ResourceRoutine _, _) -> Left $ InvalidRpcMethod method
    (ResourceRelation rel, "HEAD") -> Right . ActDb $ ActRelationRead (qi rel) True
    (ResourceRelation rel, "GET") -> Right . ActDb $ ActRelationRead (qi rel) False
    (ResourceRelation rel, "POST") -> Right . ActDb $ ActRelationMut (qi rel) MutationCreate
    (ResourceRelation rel, "PUT") -> Right . ActDb $ ActRelationMut (qi rel) MutationSingleUpsert
    (ResourceRelation rel, "PATCH") -> Right . ActDb $ ActRelationMut (qi rel) MutationUpdate
    (ResourceRelation rel, "DELETE") -> Right . ActDb $ ActRelationMut (qi rel) MutationDelete
    (ResourceRelation rel, "OPTIONS") -> Right $ ActRelationInfo (qi rel)
    (ResourceSchema, "HEAD") -> Right . ActDb $ ActSchemaRead schema True
    (ResourceSchema, "GET") -> Right . ActDb $ ActSchemaRead schema False
    (ResourceSchema, "OPTIONS") -> Right ActSchemaInfo
    _ -> Left $ UnsupportedMethod method
  where
    qi = QualifiedIdentifier schema

getSchema :: AppConfig -> RequestHeaders -> ByteString -> Either ApiRequestError (Schema, Bool)
getSchema AppConfig{configDbSchemas} hdrs method = do
  case profile of
    Just p
      | p `notElem` configDbSchemas -> Left $ UnacceptableSchema p $ toList configDbSchemas
      | otherwise -> Right (p, True)
    Nothing -> Right (defaultSchema, length configDbSchemas /= 1) -- if we have many schemas, assume the default schema was negotiated
  where
    defaultSchema = NonEmptyList.head configDbSchemas
    profile = case method of
      -- POST/PATCH/PUT/DELETE don't use the same header as per the spec
      "DELETE" -> contentProfile
      "PATCH" -> contentProfile
      "POST" -> contentProfile
      "PUT" -> contentProfile
      _ -> acceptProfile
    contentProfile = T.decodeUtf8 <$> lookupHeader "Content-Profile"
    acceptProfile = T.decodeUtf8 <$> lookupHeader "Accept-Profile"
    lookupHeader = flip lookup hdrs

getRanges :: ByteString -> QueryParams -> RequestHeaders -> Either ApiRequestError (NonnegRange, HM.HashMap Text NonnegRange)
getRanges method QueryParams{qsRanges} hdrs
  | isInvalidRange = Left $ InvalidRange (if rangeIsEmpty headerRange then LowerGTUpper else NegativeLimit)
  | method == "PUT" && topLevelRange /= allRange = Left PutLimitNotAllowedError
  | otherwise = Right (topLevelRange, ranges)
  where
    -- According to the RFC (https://www.rfc-editor.org/rfc/rfc9110.html#name-range),
    -- the Range header must be ignored for all methods other than GET
    headerRange = if method == "GET" then rangeRequested hdrs else allRange
    limitRange = fromMaybe allRange (HM.lookup "limit" qsRanges)
    headerAndLimitRange = rangeIntersection headerRange limitRange
    -- Bypass all the ranges and send only the limit zero range (0 <= x <= -1) if
    -- limit=0 is present in the query params (not allowed for the Range header)
    ranges = HM.insert "limit" (convertToLimitZeroRange limitRange headerAndLimitRange) qsRanges
    -- The only emptyRange allowed is the limit zero range
    isInvalidRange = topLevelRange == emptyRange && not (hasLimitZero limitRange)
    topLevelRange = fromMaybe allRange $ HM.lookup "limit" ranges -- if no limit is specified, get all the request rows
