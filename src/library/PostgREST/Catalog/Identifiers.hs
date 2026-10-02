{-# LANGUAGE DeriveAnyClass #-}

module PostgREST.Catalog.Identifiers
  ( FieldName
  , QualifiedIdentifier (..)
  , RelIdentifier (..)
  , Schema
  , TableName
  , escapeIdent
  , isAnyElement
  , quoteQi
  , toQi
  , trimNullChars
  )
where

import Protolude

import Data.Aeson qualified as JSON
import Data.Text qualified as T

data RelIdentifier = RelId QualifiedIdentifier | RelAnyElement
  deriving (Eq, Generic, JSON.ToJSON, JSON.ToJSONKey, Ord, Show)

instance Hashable RelIdentifier

-- | Represents a pg identifier with a prepended schema name "schema.table".
-- When qiSchema is "", the schema is defined by the pg search_path.
-- TODO: Refactor this, we also use QI for procedure names
data QualifiedIdentifier = QualifiedIdentifier
  { qiSchema :: Schema
  , qiName :: TableName
  }
  deriving (Eq, Generic, JSON.ToJSON, JSON.ToJSONKey, Ord, Show)

instance Hashable QualifiedIdentifier

isAnyElement :: QualifiedIdentifier -> Bool
isAnyElement y = QualifiedIdentifier "pg_catalog" "anyelement" == y

-- |
-- Quote the qualified identifier when preparing the SQL. This avoids parse
-- errors by postgres, for example on pg reserved words like "true" or "select".
--
-- >>> quoteQi (QualifiedIdentifier "" "true")
-- "\"true\""
quoteQi :: QualifiedIdentifier -> Text
quoteQi (QualifiedIdentifier s i) =
  (if T.null s then mempty else escapeIdent s <> ".") <> escapeIdent i

-- TODO: Handle a case where the QI comes like this: "my.fav.schema"."my.identifier"
-- Right now it only handles the schema.identifier case
toQi :: Text -> QualifiedIdentifier
toQi txt = case T.drop 1 <$> T.breakOn "." txt of
  (i, "") -> QualifiedIdentifier mempty i
  (s, i) -> QualifiedIdentifier s i

escapeIdent :: Text -> Text
escapeIdent x = "\"" <> T.replace "\"" "\"\"" (trimNullChars x) <> "\""

trimNullChars :: Text -> Text
trimNullChars = T.takeWhile (/= '\x0')

type Schema = Text

type TableName = Text

type FieldName = Text
