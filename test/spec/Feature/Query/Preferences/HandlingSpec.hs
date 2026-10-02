module Feature.Query.Preferences.HandlingSpec where

import Network.HTTP.Types
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig baseCfg $
  describe "test Prefer: handling" $ do
    context "check behaviour of Prefer: handling=strict" $ do
      it "throws error when handling=strict and invalid prefs are given" $
        request methodGet "/items" [("Prefer", "handling=strict, anything")] ""
          `shouldRespondWith` [json|{"details":"Invalid preferences: anything","message":"Invalid preferences given with handling=strict","code":"PGRST122","hint":null}|]
            { matchStatus = 400
            }

      it "throw error when handling=strict and invalid prefs are given with multiples in separate prefers" $
        request methodGet "/items" [("Prefer", "handling=strict"), ("Prefer", "something, else")] ""
          `shouldRespondWith` [json|{"details":"Invalid preferences: something, else","message":"Invalid preferences given with handling=strict","code":"PGRST122","hint":null}|]
            { matchStatus = 400
            }

      it "throws error with post request" $
        request
          methodPost
          "/organizations?select=*"
          [("Prefer", "return=representation, handling=strict, anything")]
          [json|{"id":7,"name":"John","referee":null,"auditor":null,"manager_id":6}|]
          `shouldRespondWith` [json|{"details":"Invalid preferences: anything","message":"Invalid preferences given with handling=strict","code":"PGRST122","hint":null}|]
            { matchStatus = 400
            }

      it "throws error with rpc" $
        request
          methodPost
          "/rpc/overloaded_unnamed_param"
          [("Content-Type", "application/json"), ("Prefer", "handling=strict, anything")]
          [json|{}|]
          `shouldRespondWith` [json|{"details":"Invalid preferences: anything","message":"Invalid preferences given with handling=strict","code":"PGRST122","hint":null}|]
            { matchStatus = 400
            }

    context "check behaviour of Prefer: handling=lenient" $ do
      it "does not throw error when handling=lenient and invalid prefs" $
        request methodGet "/items" [("Prefer", "handling=lenient, anything")] ""
          `shouldRespondWith` 200

      it "does not throw error when handling=lenient and invalid prefs in multiples prefers" $
        request methodGet "/items" [("Prefer", "handling=lenient"), ("Prefer", "anything")] ""
          `shouldRespondWith` 200

      it "does not throw error with post request" $
        request
          methodPost
          "/organizations?select=*"
          [("Prefer", "return=representation, handling=lenient, anything")]
          [json|{"id":7,"name":"John","referee":null,"auditor":null,"manager_id":6}|]
          `shouldRespondWith` [json|[{"id":7,"name":"John","referee":null,"auditor":null,"manager_id":6}]|]
            { matchStatus = 201
            , matchHeaders = [matchContentTypeJson]
            }

      it "does not throw error with rpc" $
        request
          methodPost
          "/rpc/overloaded_unnamed_param"
          [("Content-Type", "application/json"), ("Prefer", "handling=lenient, anything")]
          [json|{}|]
          `shouldRespondWith` [json| 1 |]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
