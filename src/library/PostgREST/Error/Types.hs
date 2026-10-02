-- |
-- Module      : PostgREST.Error.Types
-- Description : PostgREST Error Data Types
module PostgREST.Error.Types
  ( ApiRequestError (..)
  , QPError (..)
  , RangeError (..)
  , RaiseError (..)
  , SchemaCacheError (..)
  , PgError (..)
  , Error (..)
  , JwtError (..)
  , JwtDecodeError (..)
  , JwtClaimsError (..)
  , PgRaiseErrMessage (..)
  , PgRaiseErrDetails (..)
  )
where

import Protolude

import PostgREST.Catalog.Identifiers (QualifiedIdentifier (..))
import PostgREST.Catalog.Relationship (Relationship (..), RelationshipsMap)
import PostgREST.Catalog.Routine (Routine (..))
import PostgREST.MediaType (MediaType (..))
import PostgREST.SchemaCache (SchemaCache (..))

import Hasql.Pool qualified as SQL

data Error
  = ApiRequestErr ApiRequestError
  | SchemaCacheErr SchemaCacheError
  | JwtErr JwtError
  | NoSchemaCacheError
  | PgErr PgError
  deriving (Show)

-- API REQUEST ERRORS: PGRST1XX
data ApiRequestError
  = AggregatesNotAllowed
  | MediaTypeError [ByteString]
  | InvalidBody ByteString
  | InvalidFilters
  | InvalidPreferences [ByteString]
  | InvalidRange RangeError
  | InvalidRpcMethod ByteString
  | NotEmbedded Text (Maybe (Text, Text))
  | NotImplemented Text
  | PutLimitNotAllowedError
  | QueryParamError QPError
  | RelatedOrderNotToOne Text Text
  | UnacceptableFilter Text
  | UnacceptableSchema Text [Text]
  | UnsupportedMethod ByteString
  | GucHeadersError
  | GucStatusError
  | PutMatchingPkError
  | SingularityError Integer
  | PGRSTParseError RaiseError
  | MaxAffectedViolationError Integer
  | InvalidResourcePath
  | OpenAPIDisabled
  | MaxAffectedRpcViolation
  deriving (Show)

data QPError = QPError Text Text
  deriving (Show)

data RaiseError
  = MsgParseError ByteString
  | DetParseError ByteString
  | NoDetail
  deriving (Show)

data RangeError
  = NegativeLimit
  | LowerGTUpper
  | OutOfBounds Text Text
  deriving (Show)

-- SCHEMA CACHE ERRORS: PGRST2XX
data SchemaCacheError
  = AmbiguousRelBetween Text Text [Relationship]
  | AmbiguousRpc [Routine]
  | NoRelBetween Text Text (Maybe Text) Text RelationshipsMap
  | NoRpc Text Text [Text] MediaType Bool [QualifiedIdentifier] [Routine]
  | ColumnNotFound Text Text
  | TableNotFound Text Text SchemaCache
  deriving (Show)

-- JWT ERRORS: PGRST3XX
data JwtError
  = JwtDecodeErr JwtDecodeError
  | JwtSecretMissing
  | JwtTokenRequired
  | JwtClaimsErr JwtClaimsError
  deriving (Show)

data JwtDecodeError
  = EmptyAuthHeader
  | UnexpectedParts Int
  | KeyError Text
  | BadAlgorithm Text
  | BadCrypto
  | UnsupportedTokenType
  | UnreachableDecodeError
  deriving (Show)

data JwtClaimsError
  = JWTExpired
  | JWTNotYetValid
  | JWTIssuedAtFuture
  | JWTNotInAudience
  | ParsingClaimsFailed
  | ExpClaimNotNumber
  | NbfClaimNotNumber
  | IatClaimNotNumber
  | AudClaimNotStringOrArray
  deriving (Show)

-- PG ERRORS
type Authenticated = Bool

data PgError = PgError Authenticated SQL.UsageError
  deriving (Show)

-- For parsing byteString to JSON Object, used for allowing full response control
data PgRaiseErrMessage = PgRaiseErrMessage
  { getCode :: Text
  , getMessage :: Text
  , getDetails :: Maybe Text
  , getHint :: Maybe Text
  }

data PgRaiseErrDetails = PgRaiseErrDetails
  { getStatus :: Int
  , getStatusText :: Maybe Text
  , getHeaders :: Map Text Text
  }
