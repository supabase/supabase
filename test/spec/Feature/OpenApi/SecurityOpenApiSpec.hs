module Feature.OpenApi.SecurityOpenApiSpec where

import Control.Lens ((^?))
import Data.Aeson.Lens
import Data.Aeson.QQ
import Network.Wai.Test (SResponse (..))
import Protolude hiding (get)
import Test.Hspec hiding (pendingWith)
import Test.Hspec.Wai

import PostgREST.Config (AppConfig (..))
import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig (baseCfg{configOpenApiSecurityActive = True}) $
  describe "Security active" $
    it "includes security and security definitions" $ do
      r <- simpleBody <$> get "/"

      let
        sec = r ^? key "security"
        secDef = r ^? key "securityDefinitions"

      liftIO $ do
        sec
          `shouldBe` Just
            [aesonQQ|
            [
              { "JWT": [] }
            ]
          |]

        secDef
          `shouldBe` Just
            [aesonQQ|
            {
              "JWT": {
                "description": "Add the token prepending \"Bearer \" (without quotes) to it",
                "in": "header",
                "name": "Authorization",
                "type": "apiKey"
              }
            }
          |]
