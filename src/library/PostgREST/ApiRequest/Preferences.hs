{-# LANGUAGE NamedFieldPuns #-}

-- |
-- Module: PostgREST.ApiRequest.Preferences
-- Description: Track client preferences to be employed when processing requests
--
-- Track client preferences set in HTTP 'Prefer' headers according to RFC7240[1].
--
-- [1] https://datatracker.ietf.org/doc/html/rfc7240
module PostgREST.ApiRequest.Preferences
  ( Preferences (..)
  , PreferCount (..)
  , PreferHandling (..)
  , PreferMissing (..)
  , PreferRepresentation (..)
  , PreferResolution (..)
  , PreferTransaction (..)
  , PreferTimezone (..)
  , PreferMaxAffected (..)
  , fromHeaders
  , shouldCount
  , shouldExplainCount
  , prefAppliedHeader
  , toHeaderValue
  )
where

import Protolude

import Data.ByteString.Char8 qualified as BS
import Data.Map qualified as Map
import Network.HTTP.Types.Header qualified as HTTP

-- $setup
-- Setup for doctests
-- >>> :set -XStandaloneDeriving
-- >>> import Text.Pretty.Simple (pPrint)
-- >>> import qualified Data.Set as S
-- >>> import Protolude
-- >>> deriving instance Show PreferResolution
-- >>> deriving instance Show PreferRepresentation
-- >>> deriving instance Show PreferCount
-- >>> deriving instance Show PreferTransaction
-- >>> deriving instance Show PreferMissing
-- >>> deriving instance Show PreferHandling
-- >>> deriving instance Show PreferTimezone
-- >>> deriving instance Show PreferMaxAffected
-- >>> deriving instance Show Preferences

-- | Preferences recognized by the application.
data Preferences
  = Preferences
  { preferResolution :: Maybe PreferResolution
  , preferRepresentation :: Maybe PreferRepresentation
  , preferCount :: Maybe PreferCount
  , preferTransaction :: Maybe PreferTransaction
  , preferMissing :: Maybe PreferMissing
  , preferHandling :: Maybe PreferHandling
  , preferTimezone :: Maybe PreferTimezone
  , preferMaxAffected :: Maybe PreferMaxAffected
  , invalidPrefs :: [ByteString]
  }

-- |
-- Parse HTTP headers based on RFC7240[1] to identify preferences.
--
-- One header with comma-separated values can be used to set multiple preferences:
-- >>> pPrint $ fromHeaders True [("Prefer", "resolution=ignore-duplicates, count=exact, timezone=America/Los_Angeles, max-affected=100")]
-- Preferences
--     { preferResolution = Just IgnoreDuplicates
--     , preferRepresentation = Nothing
--     , preferCount = Just ExactCount
--     , preferTransaction = Nothing
--     , preferMissing = Nothing
--     , preferHandling = Nothing
--     , preferTimezone = Just
--         ( PreferTimezone "America/Los_Angeles" )
--     , preferMaxAffected = Just
--         ( PreferMaxAffected 100 )
--     , invalidPrefs = []
--     }
--
-- Multiple headers can also be used:
--
-- >>> pPrint $ fromHeaders True [("Prefer", "resolution=ignore-duplicates"), ("Prefer", "count=exact"), ("Prefer", "missing=null"), ("Prefer", "handling=lenient"), ("Prefer", "invalid"), ("Prefer", "max-affected=5999")]
-- Preferences
--     { preferResolution = Just IgnoreDuplicates
--     , preferRepresentation = Nothing
--     , preferCount = Just ExactCount
--     , preferTransaction = Nothing
--     , preferMissing = Just ApplyNulls
--     , preferHandling = Just Lenient
--     , preferTimezone = Nothing
--     , preferMaxAffected = Just
--         ( PreferMaxAffected 5999 )
--     , invalidPrefs = [ "invalid" ]
--     }
--
-- If a preference is set more than once, only the first is used:
--
-- >>> preferTransaction $ fromHeaders True [("Prefer", "tx=commit, tx=rollback")]
-- Just Commit
--
-- This is also the case across multiple headers:
--
-- >>> :{
--   preferResolution . fromHeaders True $
--     [ ("Prefer", "resolution=ignore-duplicates")
--     , ("Prefer", "resolution=merge-duplicates")
--     ]
-- :}
-- Just IgnoreDuplicates
--
--
-- Preferences can be separated by arbitrary amounts of space, lower-case header is also recognized:
--
-- >>> pPrint $ fromHeaders True [("prefer", "count=exact,    tx=commit   ,return=representation , missing=default, handling=strict, anything")]
-- Preferences
--     { preferResolution = Nothing
--     , preferRepresentation = Just Full
--     , preferCount = Just ExactCount
--     , preferTransaction = Just Commit
--     , preferMissing = Just ApplyDefaults
--     , preferHandling = Just Strict
--     , preferTimezone = Nothing
--     , preferMaxAffected = Nothing
--     , invalidPrefs = [ "anything" ]
--     }
fromHeaders :: Bool -> [HTTP.Header] -> Preferences
fromHeaders allowTxDbOverride headers =
  Preferences
    { preferResolution = parsePrefs [MergeDuplicates, IgnoreDuplicates]
    , preferRepresentation = parsePrefs [Full, None, HeadersOnly]
    , preferCount = parsePrefs [ExactCount, PlannedCount, EstimatedCount]
    , preferTransaction = if allowTxDbOverride then parsePrefs [Commit, Rollback] else Nothing
    , preferMissing = parsePrefs [ApplyDefaults, ApplyNulls]
    , preferHandling = parsePrefs [Strict, Lenient]
    , preferTimezone = PreferTimezone <$> timezonePref
    , preferMaxAffected = PreferMaxAffected <$> maxAffectedPref
    , invalidPrefs = filter isUnacceptable prefs
    }
  where
    mapToHeadVal :: (ToHeaderValue a) => [a] -> [ByteString]
    mapToHeadVal = map toHeaderValue
    acceptedPrefs =
      mapToHeadVal [MergeDuplicates, IgnoreDuplicates]
        ++ mapToHeadVal [Full, None, HeadersOnly]
        ++ mapToHeadVal [ExactCount, PlannedCount, EstimatedCount]
        ++ mapToHeadVal [Commit, Rollback]
        ++ mapToHeadVal [ApplyDefaults, ApplyNulls]
        ++ mapToHeadVal [Strict, Lenient]

    prefHeaders = filter ((==) HTTP.hPrefer . fst) headers
    prefs = fmap BS.strip . concatMap (BS.split ',' . snd) $ prefHeaders

    listStripPrefix prefix prefList = listToMaybe $ mapMaybe (BS.stripPrefix prefix) prefList

    timezonePref = listStripPrefix "timezone=" prefs

    maxAffectedPref = listStripPrefix "max-affected=" prefs >>= readMaybe . BS.unpack

    isUnacceptable p =
      p `notElem` acceptedPrefs
        && isNothing (BS.stripPrefix "timezone=" p)
        && isNothing (BS.stripPrefix "max-affected=" p)

    parsePrefs :: (ToHeaderValue a) => [a] -> Maybe a
    parsePrefs vals =
      head $ mapMaybe (flip Map.lookup $ prefMap vals) prefs

    prefMap :: (ToHeaderValue a) => [a] -> Map.Map ByteString a
    prefMap = Map.fromList . fmap (\pref -> (toHeaderValue pref, pref))

prefAppliedHeader :: Preferences -> Maybe HTTP.Header
prefAppliedHeader Preferences{preferResolution, preferRepresentation, preferCount, preferTransaction, preferMissing, preferHandling, preferTimezone, preferMaxAffected} =
  if null prefsVals then
    Nothing
  else
    Just (HTTP.hPreferenceApplied, combined)
  where
    combined = BS.intercalate ", " prefsVals
    prefsVals =
      catMaybes
        [ toHeaderValue <$> preferResolution
        , toHeaderValue <$> preferMissing
        , toHeaderValue <$> preferRepresentation
        , toHeaderValue <$> preferCount
        , toHeaderValue <$> preferTransaction
        , toHeaderValue <$> preferHandling
        , toHeaderValue <$> preferTimezone
        , if preferHandling == Just Strict then toHeaderValue <$> preferMaxAffected else Nothing
        ]

-- |
-- Convert a preference into the value that we look for in the 'Prefer' headers.
--
-- >>> toHeaderValue MergeDuplicates
-- "resolution=merge-duplicates"
class ToHeaderValue a where
  toHeaderValue :: a -> ByteString

-- | How to handle duplicate values.
data PreferResolution
  = MergeDuplicates
  | IgnoreDuplicates
  deriving (Eq)

instance ToHeaderValue PreferResolution where
  toHeaderValue MergeDuplicates = "resolution=merge-duplicates"
  toHeaderValue IgnoreDuplicates = "resolution=ignore-duplicates"

-- |
-- How to return the mutated data.
--
-- From https://tools.ietf.org/html/rfc7240#section-4.2
data PreferRepresentation
  = -- | Return the body.
    Full
  | -- | Return the Location header(in case of POST). This needs a SELECT privilege on the pk.
    HeadersOnly
  | -- | Return nothing from the mutated data.
    None
  deriving (Eq)

instance ToHeaderValue PreferRepresentation where
  toHeaderValue Full = "return=representation"
  toHeaderValue None = "return=minimal"
  toHeaderValue HeadersOnly = "return=headers-only"

-- | How to determine the count of (expected) results
data PreferCount
  = -- | Exact count (slower).
    ExactCount
  | -- | PostgreSQL query planner rows count guess. Done by using EXPLAIN {query}.
    PlannedCount
  | -- | Use the query planner rows if the count is superior to max-rows, otherwise get the exact count.
    EstimatedCount
  deriving (Eq)

instance ToHeaderValue PreferCount where
  toHeaderValue ExactCount = "count=exact"
  toHeaderValue PlannedCount = "count=planned"
  toHeaderValue EstimatedCount = "count=estimated"

shouldCount :: Maybe PreferCount -> Bool
shouldCount prefCount =
  prefCount == Just ExactCount || prefCount == Just EstimatedCount

shouldExplainCount :: Maybe PreferCount -> Bool
shouldExplainCount prefCount =
  prefCount == Just PlannedCount || prefCount == Just EstimatedCount

-- | Whether to commit or roll back transactions.
data PreferTransaction
  = -- | Commit transaction - the default.
    Commit
  | -- | Rollback transaction after sending the response - does not persist changes, e.g. for running tests.
    Rollback
  deriving (Eq)

instance ToHeaderValue PreferTransaction where
  toHeaderValue Commit = "tx=commit"
  toHeaderValue Rollback = "tx=rollback"

-- |
-- How to handle the insertion/update when the keys specified in ?columns are not present
-- in the json body.
data PreferMissing
  = -- | Use the default column value for missing values.
    ApplyDefaults
  | -- | Use the null value for missing values.
    ApplyNulls
  deriving (Eq)

instance ToHeaderValue PreferMissing where
  toHeaderValue ApplyDefaults = "missing=default"
  toHeaderValue ApplyNulls = "missing=null"

-- |
-- Handling of unrecognised preferences
data PreferHandling
  = -- | Throw error on unrecognised preferences
    Strict
  | -- | Ignore unrecognised preferences
    Lenient
  deriving (Eq)

instance ToHeaderValue PreferHandling where
  toHeaderValue Strict = "handling=strict"
  toHeaderValue Lenient = "handling=lenient"

-- |
-- Change timezone
newtype PreferTimezone = PreferTimezone ByteString

instance ToHeaderValue PreferTimezone where
  toHeaderValue (PreferTimezone tz) = "timezone=" <> tz

-- |
-- Limit Affected Resources
newtype PreferMaxAffected = PreferMaxAffected Int64

instance ToHeaderValue PreferMaxAffected where
  toHeaderValue (PreferMaxAffected n) = "max-affected=" <> show n
