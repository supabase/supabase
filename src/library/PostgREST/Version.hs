{-# LANGUAGE CPP #-}

module PostgREST.Version
  ( docsVersion
  , prettyVersion
  )
where

import Protolude

import Data.Text qualified as T

-- Somehow this is not defined in doctests, so when running them
-- on a file that includes Version.hs, compilation fails.
#ifndef VERSION_postgrest
#define VERSION_postgrest "0"
#endif

version :: [Text]
version = T.splitOn "." VERSION_postgrest

-- | User friendly version number such as '14.0'.
-- Pre-release versions are tagged as such, e.g., '15 (pre-release)'.
prettyVersion :: ByteString
prettyVersion =
  (encodeUtf8 . T.intercalate "." $ take 2 version) <> preRelease
  where
    preRelease = if isPreRelease then " (pre-release)" else mempty

-- | Version number used in docs.
-- Pre-release versions link to the latest docs
-- Uses only the first component of the version. Example: 'v1'
docsVersion :: Text
docsVersion
  | isPreRelease = "latest"
  | otherwise = "v" <> T.intercalate "." (take 1 version)

-- | Versions with one components (e.g., '15') are treated as pre-releases.
isPreRelease :: Bool
isPreRelease =
  length version == 1
