module Feature.Auth.BinaryJwtSecretSpec where

import Network.HTTP.Types
import Protolude
import Test.Hspec
import Test.Hspec.Wai

import PostgREST.Config (AppConfig (..), parseSecret)
import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig
  ( baseCfg
      { configJwtSecret = Just generateSecret
      , configJWKS = rightToMaybe $ parseSecret generateSecret
      }
  )
  $ describe "server started with binary JWT secret"
  $
  -- this test will stop working 9999999999s after the UNIX EPOCH
  it "succeeds with jwt token encoded with a binary secret"
  $ do
    let auth = authHeaderJWT "TEST_JWT_REDACTED"
    request methodGet "/authors_only" [auth] ""
      `shouldRespondWith` 200
