module Feature.Query.UnicodeSpec where

import Data.List.NonEmpty (fromList)
import Network.HTTP.Types
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import PostgREST.Config (AppConfig (..))
import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig (baseCfg{configDbSchemas = fromList ["تست"]}) $
  describe "Reading and writing to unicode schema and table names" $
    it "Can read and write values" $ do
      get "/%D9%85%D9%88%D8%A7%D8%B1%D8%AF"
        `shouldRespondWith` "[]"

      request
        methodPost
        "/%D9%85%D9%88%D8%A7%D8%B1%D8%AF"
        [("Prefer", "tx=commit"), ("Prefer", "return=representation")]
        [json| { "هویت": 1 } |]
        `shouldRespondWith` [json| [{ "هویت": 1 }] |]
          { matchStatus = 201
          }

      get "/%D9%85%D9%88%D8%A7%D8%B1%D8%AF"
        `shouldRespondWith` [json| [{ "هویت": 1 }] |]

      request
        methodDelete
        "/%D9%85%D9%88%D8%A7%D8%B1%D8%AF"
        [("Prefer", "tx=commit")]
        ""
        `shouldRespondWith` ""
          { matchStatus = 204
          , matchHeaders = [matchHeaderAbsent hContentType]
          }
