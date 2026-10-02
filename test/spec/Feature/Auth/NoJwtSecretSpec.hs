module Feature.Auth.NoJwtSecretSpec where

import Network.HTTP.Types
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import PostgREST.Config (AppConfig (..))
import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig
  ( baseCfg
      { configJwtSecret = Nothing
      , configJWKS = Nothing
      }
  )
  $ describe "server started without JWT secret"
  $ do
    it "responds with error on attempted auth" $ do
      -- token body: { "role": "postgrest_test_author" }
      let auth = authHeaderJWT "TEST_JWT_REDACTED"
      request
        methodGet
        "/authors_only"
        [auth]
        ""
        `shouldRespondWith` [json|
          {"hint": null,
           "details": null,
           "code": "PGRST300",
           "message": "Server lacks JWT secret"}|]
          { matchStatus = 500
          }

    it "behaves normally when user does not attempt auth" $
      get "/items" `shouldRespondWith` 200
