-- |
-- Module      : PostgREST.Config.JSPath
-- Description : Parsing and evaluation logic of JSPath
module PostgREST.Config.JSPath
  ( JSPath (..)
  , defaultRoleJSPathKey
  , dumpJSPath
  , pRoleClaimKey
  , evaluateJSPath
  )
where

import Data.Either.Combinators (mapLeft)
import Data.Either.Extra (fromRight')
import Protolude
import Text.ParserCombinators.Parsec ((<?>))

import Data.Aeson qualified as JSON
import Data.Aeson.JSONPath qualified as JSP
import Data.Aeson.JSONPath.Parser qualified as JSP
import Data.Aeson.JSONPath.Types qualified as JSP
import Data.Text qualified as T
import Data.Vector qualified as V
import Text.ParserCombinators.Parsec qualified as P

-- | full jspath, e.g. "$.property[0].attr.detail[?(@ == "role1")]"
newtype JSPath = JSPath JSP.Query

-- | Default value for "jwt-role-claim-key" config
defaultRoleJSPathKey :: JSPath
defaultRoleJSPathKey = fromRight' $ P.parse pJSPath "" "$.role"

-- | Dump JSPath
--   e.g. "$.property[0].attr.detail[?(@ == "role1")]"
dumpJSPath :: JSPath -> Text
dumpJSPath (JSPath query) = (escapeDollarChar . escapeDoubleQuotes) jsPathDump
  where
    jsPathDump = JSP.dumpQuery query
    escapeDoubleQuotes = T.replace "\"" "\\\""
    -- When dumping, $ must be escaped
    escapeDollarChar = T.replace "$" "$$"

-- |
-- Evaluate JSPath on a JSON
-- The result of JSON Path query is a Vector, we select the first
-- string element as the role.
evaluateJSPath :: Maybe JSON.Value -> JSPath -> Maybe JSON.Value
evaluateJSPath Nothing _ = Nothing
evaluateJSPath (Just json) (JSPath query) = JSP.queryQQ query json V.!? 0

-- Used for the config value "role-claim-key"
pRoleClaimKey :: Text -> Either Text JSPath
pRoleClaimKey selStr =
  mapLeft show $ P.parse pJSPath ("failed to parse role-claim-key value (" <> toS selStr <> ")") (toS selStr)

-- | Parse RFC 9535 JSPath: $.roles[0]
pJSPath :: P.Parser JSPath
pJSPath = JSPath <$> JSP.pQuery <?> "pJSPath: JSPath root query"
