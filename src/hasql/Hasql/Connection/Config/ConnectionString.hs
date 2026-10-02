module Hasql.Connection.Config.ConnectionString where

import Data.ByteString qualified as B
import Data.ByteString.Char8 qualified as BC
import Data.Map.Strict qualified as Map
import Data.Text.Encoding qualified

import Hasql.Prelude

import Hasql.Connection.Config.ConnectionString.Params qualified as Params

type ConnectionString = ByteString

class Constructs a where
  construct :: a -> ConnectionString

fromText :: Text -> ConnectionString
fromText = Data.Text.Encoding.encodeUtf8

fromParams :: Params.Params -> ConnectionString
fromParams =
  B.intercalate " " . fmap renderParam . Map.toList
  where
    renderParam (k, v) = mconcat [k, "=", "'", escapeSingleQuote v, "'"]

    escapeSingleQuote =
      BC.concatMap
        ( \w ->
            case w of
              '\'' -> BC.pack "\\'"
              '\\' -> BC.pack "\\\\"
              _ -> BC.singleton w
        )
