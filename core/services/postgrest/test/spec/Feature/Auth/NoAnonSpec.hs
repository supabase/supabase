module Feature.Auth.NoAnonSpec where

import Network.HTTP.Types
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import PostgREST.Config (AppConfig (..))
import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig (baseCfg{configDbAnonRole = Nothing}) $ describe "server started without anonymous role" $ do
  it "behaves normally on attempted auth" $ do
    -- token body: { "role": "postgrest_test_author" }
    let auth = authHeaderJWT "TEST_JWT_REDACTED"
    request
      methodGet
      "/authors_only"
      [auth]
      ""
      `shouldRespondWith` 200

  it "responds with error when user does not attempt auth" $
    get "/items"
      `shouldRespondWith` [json|
          {"hint": null,
           "details": null,
           "code": "PGRST302",
           "message":"Anonymous access is disabled"}|]
        { matchStatus = 401
        , matchHeaders = ["WWW-Authenticate" <:> "Bearer"]
        }
