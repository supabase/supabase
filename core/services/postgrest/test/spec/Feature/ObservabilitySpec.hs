module Feature.ObservabilitySpec where

import Data.CaseInsensitive (mk)
import Network.HTTP.Types
import Protolude
import Test.Hspec
import Test.Hspec.Wai

import PostgREST.Config (AppConfig (..))
import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig (baseCfg{configServerTraceHeader = Just $ mk "X-Request-Id"}) $
  describe "Observability" $ do
    it "includes the server trace header on the response" $ do
      request
        methodHead
        "/"
        [("X-Request-Id", "1")]
        ""
        `shouldRespondWith` ""
          { matchHeaders = ["X-Request-Id" <:> "1"]
          }

      request
        methodHead
        "/projects"
        [("X-Request-Id", "2")]
        ""
        `shouldRespondWith` ""
          { matchHeaders = ["X-Request-Id" <:> "2"]
          }

      request
        methodHead
        "/rpc/add_them?a=2&b=4"
        [("X-Request-Id", "3")]
        ""
        `shouldRespondWith` ""
          { matchHeaders = ["X-Request-Id" <:> "3"]
          }
