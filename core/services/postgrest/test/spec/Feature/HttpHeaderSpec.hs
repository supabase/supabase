module Feature.HttpHeaderSpec where

import Network.HTTP.Types
import Protolude
import Test.Hspec
import Test.Hspec.Wai

import PostgREST.Catalog.Identifiers (QualifiedIdentifier (..))
import PostgREST.Config (AppConfig (..))
import SpecHelper

spec :: SpecWithConfig
spec withConfig = do
  withConfig baseCfg{configDbPreRequest = Just $ QualifiedIdentifier "test" "custom_vary_hdr"} $
    describe "Test HTTP Custom Header" $
      it "Test default Vary header value is overridden in pre-request database function" $
        request
          methodGet
          "/projects"
          []
          ""
          `shouldRespondWith` ResponseMatcher
            { matchStatus = 200
            , matchBody = MatchBody (\_ _ -> Nothing) -- match any body
            , matchHeaders = ["Vary" <:> "X-Test-Accept"]
            }

  withConfig baseCfg $
    describe "Test HTTP Default Header" $
      it "Test default Vary header value matches default one" $
        request
          methodGet
          "/projects"
          []
          ""
          `shouldRespondWith` ResponseMatcher
            { matchStatus = 200
            , matchBody = MatchBody (\_ _ -> Nothing) -- match any body
            , matchHeaders = ["Vary" <:> "Accept, Prefer, Range"]
            }
