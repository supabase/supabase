{-# LANGUAGE DeriveAnyClass #-}

module PostgREST.Config.PgVersion
  ( PgVersion (..)
  , minimumPgVersion
  , pgVersion150
  , pgVersion170
  , pgVersion180
  , pgVersion190
  )
where

import Protolude

import Data.Aeson qualified as JSON

data PgVersion = PgVersion
  { pgvNum :: Int32
  , pgvName :: Text
  , pgvFullName :: Text
  }
  deriving (Eq, Generic, JSON.ToJSON)

instance Ord PgVersion where
  (PgVersion v1 _ _) `compare` (PgVersion v2 _ _) = v1 `compare` v2

-- | Tells the minimum PostgreSQL version required by this version of PostgREST
minimumPgVersion :: PgVersion
minimumPgVersion = pgVersion140

pgVersion140 :: PgVersion
pgVersion140 = PgVersion 140000 "14.0" "14.0"

pgVersion150 :: PgVersion
pgVersion150 = PgVersion 150000 "15.0" "15.0"

pgVersion170 :: PgVersion
pgVersion170 = PgVersion 170000 "17.0" "17.0"

pgVersion180 :: PgVersion
pgVersion180 = PgVersion 180000 "18.0" "18.0"

pgVersion190 :: PgVersion
pgVersion190 = PgVersion 190000 "19.0" "19.0"
