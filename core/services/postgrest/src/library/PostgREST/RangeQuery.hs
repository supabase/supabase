-- |
-- Module      : PostgREST.RangeQuery
-- Description : Logic regarding the `Range`/`Content-Range` headers and `limit`/`offset` querystring arguments.
module PostgREST.RangeQuery
  ( rangeParse
  , rangeRequested
  , rangeLimit
  , rangeOffset
  , restrictRange
  , rangeGeq
  , allRange
  , limitZeroRange
  , hasLimitZero
  , convertToLimitZeroRange
  , NonnegRange
  , rangeStatusHeader
  , contentRangeH
  )
where

import Control.Applicative
import Data.List (lookup)
import Data.Ranged.Boundaries
import Data.Ranged.Ranges
import Network.HTTP.Types.Header
import Network.HTTP.Types.Status
import Protolude
import Text.Regex.TDFA ((=~))

import Data.ByteString.Char8 qualified as BS

type NonnegRange = Range Integer

rangeParse :: BS.ByteString -> NonnegRange
rangeParse range = do
  let rangeRegex = "^([0-9]+)-([0-9]*)$" :: BS.ByteString

  case range =~ rangeRegex :: [[BS.ByteString]] of
    [[_, l, u]] ->
      let
        lower = maybe emptyRange rangeGeq (readInteger l)
        upper = maybe allRange rangeLeq (readInteger u)
      in
        rangeIntersection lower upper
    _ -> allRange
  where
    readInteger = readMaybe . BS.unpack

rangeRequested :: RequestHeaders -> NonnegRange
rangeRequested headers = maybe allRange rangeParse $ lookup hRange headers

restrictRange :: Maybe Integer -> NonnegRange -> NonnegRange
restrictRange Nothing r = r
restrictRange (Just limit) r =
  rangeIntersection r $
    Range BoundaryBelowAll (BoundaryAbove $ rangeOffset r + limit - 1)

rangeLimit :: NonnegRange -> Maybe Integer
rangeLimit range =
  case [rangeLower range, rangeUpper range] of
    [BoundaryBelow lower, BoundaryAbove upper] -> Just (1 + upper - lower)
    _ -> Nothing

rangeOffset :: NonnegRange -> Integer
rangeOffset range =
  case rangeLower range of
    BoundaryBelow lower -> lower
    _ -> panic "range without lower bound" -- should never happen

rangeGeq :: Integer -> NonnegRange
rangeGeq n =
  Range (BoundaryBelow n) BoundaryAboveAll

allRange :: NonnegRange
allRange = rangeGeq 0

rangeLeq :: Integer -> NonnegRange
rangeLeq n =
  Range BoundaryBelowAll (BoundaryAbove n)

-- Special case to allow limit 0 queries
-- https://github.com/PostgREST/postgrest/issues/1121
-- 0 <= x <= -1
limitZeroRange :: Range Integer
limitZeroRange = Range (BoundaryBelow 0) (BoundaryAbove (-1))

hasLimitZero :: Range Integer -> Bool
hasLimitZero r = rangeUpper r == rangeUpper limitZeroRange

-- Used to convert a range into a special limitZeroRange if it has a
-- limit=0 in order to bypass validations for empty ranges.
convertToLimitZeroRange :: Range Integer -> Range Integer -> Range Integer
convertToLimitZeroRange range fallbackRange =
  if hasLimitZero range then limitZeroRange else fallbackRange

rangeStatusHeader :: NonnegRange -> Int64 -> Maybe Int64 -> (Status, Header)
rangeStatusHeader topLevelRange queryTotal tableTotal =
  let
    lower = rangeOffset topLevelRange
    upper = lower + toInteger queryTotal - 1
    contentRange = contentRangeH lower upper (toInteger <$> tableTotal)
    status = rangeStatus lower upper (toInteger <$> tableTotal)
  in
    (status, contentRange)
  where
    rangeStatus :: Integer -> Integer -> Maybe Integer -> Status
    rangeStatus _ _ Nothing = status200
    rangeStatus lower upper (Just total)
      | lower > total = status416 -- 416 Range Not Satisfiable
      | (1 + upper - lower) < total = status206 -- 206 Partial Content
      | otherwise = status200 -- 200 OK

contentRangeH :: (Integral a, Show a) => a -> a -> Maybe a -> Header
contentRangeH lower upper total =
  ("Content-Range", toUtf8 headerValue)
  where
    headerValue = rangeString <> "/" <> totalString :: Text
    rangeString
      | totalNotZero && fromInRange = show lower <> "-" <> show upper
      | otherwise = "*"
    totalString = maybe "*" show total
    totalNotZero = Just 0 /= total
    fromInRange = lower <= upper
