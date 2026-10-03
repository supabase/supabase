module PostgREST.Response.GucHeader
  ( GucHeader
  , unwrapGucHeader
  )
where

import Network.HTTP.Types.Header (Header)
import Protolude

import Data.Aeson qualified as JSON
import Data.Aeson.Key qualified as K
import Data.Aeson.KeyMap qualified as KM
import Data.CaseInsensitive qualified as CI

-- |
--   Custom guc header, it's obtained by parsing the json in a:
--   `SET LOCAL "response.headers" = '[{"Set-Cookie": ".."}]'
newtype GucHeader = GucHeader (CI.CI ByteString, ByteString)

instance JSON.FromJSON GucHeader where
  parseJSON (JSON.Object o) =
    case KM.toList o of
      [(k, JSON.String s)] -> pure $ GucHeader (CI.mk $ toUtf8 $ K.toText k, toUtf8 s)
      _ -> mzero
  parseJSON _ = mzero

unwrapGucHeader :: GucHeader -> Header
unwrapGucHeader (GucHeader (k, v)) = (k, v)
