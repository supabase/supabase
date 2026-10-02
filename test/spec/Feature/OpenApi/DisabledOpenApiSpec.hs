module Feature.OpenApi.DisabledOpenApiSpec where

import Network.HTTP.Types
import Protolude
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import PostgREST.Config (AppConfig (..), OpenAPIMode (..))
import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig (baseCfg{configOpenApiMode = OADisabled}) $
  describe "Disabled OpenApi" $ do
    it "responds with 404" $
      request
        methodGet
        "/"
        [("Accept", "application/openapi+json")]
        ""
        `shouldRespondWith` [json| {"code":"PGRST126","details":null,"hint":null,"message":"Root endpoint metadata is disabled"} |]
          { matchStatus = 404
          , matchHeaders = ["Content-Length" <:> "93"]
          }
