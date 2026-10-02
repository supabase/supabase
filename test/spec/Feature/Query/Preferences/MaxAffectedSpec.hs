module Feature.Query.Preferences.MaxAffectedSpec where

import Network.HTTP.Types
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig baseCfg $ describe "test Prefer: max-affected" $ do
  context "test Prefer: max-affected with handling=strict" $ do
    it "should fail if items deleted more than 10" $
      request
        methodDelete
        "/items?id=lt.15"
        [("Prefer", "handling=strict, max-affected=10")]
        ""
        `shouldRespondWith` [json|{"code":"PGRST124","details":"The query affects 14 rows","hint":null,"message":"Query result exceeds max-affected preference constraint"}|]
          { matchStatus = 400
          }

    it "should succeed if items deleted less than 10" $
      request
        methodDelete
        "/items?id=lt.10"
        [("Prefer", "handling=strict, max-affected=10")]
        ""
        `shouldRespondWith` ""
          { matchStatus = 204
          , matchHeaders = ["Preference-Applied" <:> "handling=strict, max-affected=10"]
          }

    it "should fail if items updated more than 0" $
      request
        methodPatch
        "/tiobe_pls?name=eq.Java"
        [("Prefer", "handling=strict, max-affected=0")]
        [json| [{"name":"Java", "rank":19}] |]
        `shouldRespondWith` [json|{"code":"PGRST124","details":"The query affects 1 rows","hint":null,"message":"Query result exceeds max-affected preference constraint"}|]
          { matchStatus = 400
          }

    it "should succeed if items updated equal 1" $
      request
        methodDelete
        "/tiobe_pls?name=eq.Java"
        [("Prefer", "handling=strict, max-affected=1")]
        [json| [{"name":"Java", "rank":19}] |]
        `shouldRespondWith` ""
          { matchStatus = 204
          , matchHeaders = ["Preference-Applied" <:> "handling=strict, max-affected=1"]
          }

  context "test Prefer: max-affected with handling=lenient" $ do
    it "should not fail" $
      request
        methodDelete
        "/items?id=lt.15"
        [("Prefer", "handling=lenient, max-affected=10")]
        ""
        `shouldRespondWith` ""
          { matchStatus = 204
          , matchHeaders = ["Preference-Applied" <:> "handling=lenient"]
          }

    it "should succeed if items deleted less than 10" $
      request
        methodDelete
        "/items?id=lt.10"
        [("Prefer", "handling=lenient, max-affected=10")]
        ""
        `shouldRespondWith` ""
          { matchStatus = 204
          , matchHeaders = ["Preference-Applied" <:> "handling=lenient"]
          }

    it "should not fail" $
      request
        methodPatch
        "/tiobe_pls?name=eq.Java"
        [("Prefer", "handling=lenient, max-affected=0")]
        [json| [{"name":"Java", "rank":19}] |]
        `shouldRespondWith` ""
          { matchStatus = 204
          , matchHeaders = ["Preference-Applied" <:> "handling=lenient"]
          }

    it "should succeed if items updated equal 1" $
      request
        methodDelete
        "/tiobe_pls?name=eq.Java"
        [("Prefer", "handling=lenient, max-affected=1")]
        [json| [{"name":"Java", "rank":19}] |]
        `shouldRespondWith` ""
          { matchStatus = 204
          , matchHeaders = ["Preference-Applied" <:> "handling=lenient"]
          }

  context "test Prefer: max-affected with rpc" $ do
    it "should fail with rpc when deleting rows more than prefered with returns setof" $
      request
        methodPost
        "/rpc/delete_items_returns_setof"
        [("Prefer", "handling=strict, max-affected=10")]
        ""
        `shouldRespondWith` [json| {"code":"PGRST124","details":"The query affects 15 rows","hint":null,"message":"Query result exceeds max-affected preference constraint"} |]
          { matchStatus = 400
          }

    it "should fail with rpc when deleting rows more than prefered with returns table" $
      request
        methodPost
        "/rpc/delete_items_returns_table"
        [("Prefer", "handling=strict, max-affected=10")]
        ""
        `shouldRespondWith` [json| {"code":"PGRST124","details":"The query affects 15 rows","hint":null,"message":"Query result exceeds max-affected preference constraint"} |]
          { matchStatus = 400
          }

    it "should succeed with rpc deleting rows less than prefered with returns setof" $
      request
        methodPost
        "/rpc/delete_items_returns_setof"
        [("Prefer", "handling=strict, max-affected=20")]
        ""
        `shouldRespondWith` [json|[{"id":1},{"id":2},{"id":3},{"id":4},{"id":5},{"id":6},{"id":7},
                 {"id":8},{"id":9},{"id":10},{"id":11},{"id":12},{"id":13},
                 {"id":14},{"id":15}]|]
          { matchStatus = 200
          }

    it "should succeed with rpc deleting rows less than prefered with returns table" $
      request
        methodPost
        "/rpc/delete_items_returns_table"
        [("Prefer", "handling=strict, max-affected=20")]
        ""
        `shouldRespondWith` [json|[{"id":1},{"id":2},{"id":3},{"id":4},{"id":5},{"id":6},{"id":7},
                 {"id":8},{"id":9},{"id":10},{"id":11},{"id":12},{"id":13},
                 {"id":14},{"id":15}]|]
          { matchStatus = 200
          }

    it "should fail with rpc when returns void with handling=strict" $
      request
        methodPost
        "/rpc/delete_items_returns_void"
        [("Prefer", "handling=strict, max-affected=20")]
        ""
        `shouldRespondWith` [json| {"code":"PGRST128","details":null,"hint":null,"message":"Function must return SETOF or TABLE when max-affected preference is used with handling=strict"} |]
          { matchStatus = 400
          }
