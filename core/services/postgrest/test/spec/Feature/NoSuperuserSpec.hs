module Feature.NoSuperuserSpec where

import Network.HTTP.Types
import Protolude
import Test.Hspec
import Test.Hspec.Wai

import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig baseCfg $
  describe "No Superuser" $ do
    it "proves that the authenticator role is not a superuser" $ do
      request
        methodGet
        "/rpc/is_superuser"
        mempty
        ""
        `shouldRespondWith` "false"
          { matchStatus = 200
          }
