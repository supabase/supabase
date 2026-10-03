module PostgREST.Auth.Types (AuthResult (..)) where

import Data.Aeson qualified as JSON
import Data.Aeson.KeyMap qualified as KM
import Data.ByteString qualified as BS

-- |
-- Parse and store result for JWT Claims. Can be accessed in
-- db through GUCs (for RLS etc)
data AuthResult = AuthResult
  { authClaims :: KM.KeyMap JSON.Value
  , authRole :: BS.ByteString
  }
