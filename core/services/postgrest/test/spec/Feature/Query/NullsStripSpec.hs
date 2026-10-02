module Feature.Query.NullsStripSpec where

import Network.HTTP.Types
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig baseCfg $
  describe "Stripping null values from JSON response" $ do
    let arrayStrip = ("Accept", "application/vnd.pgrst.array+json;nulls=stripped")
    let singularStrip = ("Accept", "application/vnd.pgrst.object+json;nulls=stripped")

    context "strip nulls from response" $ do
      it "strips nulls when Accept: application/vnd.pgrst.array+json;nulls=stripped" $ do
        request
          methodGet
          "/organizations?select=*"
          [arrayStrip]
          ""
          `shouldRespondWith` [json|[{"id":1,"name":"Referee Org","manager_id":1},{"id":2,"name":"Auditor Org","manager_id":2},{"id":3,"name":"Acme","referee":1,"auditor":2,"manager_id":3},{"id":4,"name":"Umbrella","referee":1,"auditor":2,"manager_id":4},{"id":5,"name":"Cyberdyne","referee":3,"auditor":4,"manager_id":5},{"id":6,"name":"Oscorp","referee":3,"auditor":4,"manager_id":6}]|]
            { matchStatus = 200
            , matchHeaders = [matchCTArrayStrip]
            }

        request
          methodPost
          "/organizations?select=*"
          [arrayStrip, ("Prefer", "return=representation")]
          [json|{"id":7,"name":"John","referee":null,"auditor":null,"manager_id":6}|]
          `shouldRespondWith` [json|[{"id":7,"name":"John","manager_id":6}]|]
            { matchStatus = 201
            , matchHeaders = [matchCTArrayStrip]
            }

        request
          methodPatch
          "/organizations?id=eq.3&select=*"
          [arrayStrip, ("Prefer", "return=representation")]
          [json|{"name":"John","referee":null}|]
          `shouldRespondWith` [json|[{"id":3,"name":"John","auditor":2,"manager_id":3}]|]
            { matchStatus = 200
            , matchHeaders = [matchCTArrayStrip]
            }

      it "strips nulls when Accept: application/vnd.pgrst.array;nulls=stripped" $
        request
          methodGet
          "/organizations?select=*"
          [("Accept", "application/vnd.pgrst.array;nulls=stripped")]
          ""
          `shouldRespondWith` [json|[{"id":1,"name":"Referee Org","manager_id":1},{"id":2,"name":"Auditor Org","manager_id":2},{"id":3,"name":"Acme","referee":1,"auditor":2,"manager_id":3},{"id":4,"name":"Umbrella","referee":1,"auditor":2,"manager_id":4},{"id":5,"name":"Cyberdyne","referee":3,"auditor":4,"manager_id":5},{"id":6,"name":"Oscorp","referee":3,"auditor":4,"manager_id":6}]|]
            { matchStatus = 200
            , matchHeaders = [matchCTArrayStrip]
            }

      it "strips nulls when Accept: application/vnd.pgrst.object+json;nulls=stripped" $
        request
          methodGet
          "/organizations?limit=1"
          [singularStrip]
          ""
          `shouldRespondWith` [json|{"id":1,"name":"Referee Org","manager_id":1}|]
            { matchStatus = 200
            , matchHeaders = [matchCTSingularStrip]
            }

      it "throws error when Accept: application/vnd.pgrst.object+json;nulls=stripped and result not singular" $
        request
          methodGet
          "/organizations?select=*"
          [singularStrip]
          ""
          `shouldRespondWith` [json|{"details":"The result contains 6 rows","message":"Cannot coerce the result to a single JSON object","code":"PGRST116","hint":null}|]
            { matchStatus = 406
            , matchHeaders = [matchContentTypeJson]
            }

    context "strip nulls from response even if explicitly selected" $ do
      it "strips nulls when Accept: application/vnd.pgrst.array+json;nulls=stripped" $ do
        request
          methodGet
          "/organizations?select=id,referee,auditor"
          [arrayStrip]
          ""
          `shouldRespondWith` [json|[{"id":1},{"id":2},{"id":3,"referee":1,"auditor":2},{"id":4,"referee":1,"auditor":2},{"id":5,"referee":3,"auditor":4},{"id":6,"referee":3,"auditor":4}]|]
            { matchStatus = 200
            , matchHeaders = [matchCTArrayStrip]
            }

        request
          methodPost
          "/organizations?select=id,referee,auditor"
          [arrayStrip, ("Prefer", "return=representation")]
          [json|{"id":7,"name":"John","referee":null,"auditor":null,"manager_id":6}|]
          `shouldRespondWith` [json|[{"id":7}]|]
            { matchStatus = 201
            , matchHeaders = [matchCTArrayStrip]
            }

        request
          methodPatch
          "/organizations?id=eq.3&select=id,name,referee,auditor"
          [arrayStrip, ("Prefer", "return=representation")]
          [json|{"name":"John","referee":null}|]
          `shouldRespondWith` [json|[{"id":3,"name":"John","auditor":2}]|]
            { matchStatus = 200
            , matchHeaders = [matchCTArrayStrip]
            }

      it "strips nulls when Accept: application/vnd.pgrst.object+json;nulls=stripped" $
        request
          methodGet
          "/organizations?select=id,referee,auditor&limit=1"
          [singularStrip]
          ""
          `shouldRespondWith` [json|{"id":1}|]
            { matchStatus = 200
            , matchHeaders = [matchCTSingularStrip]
            }

    context "doesn't strip nulls" $ do
      it "doesn't strips nulls when Accept: application/vnd.pgrst.array+json" $
        request
          methodGet
          "/organizations?select=id,referee,auditor"
          [("Accept", "application/vnd.pgrst.array+json")]
          ""
          `shouldRespondWith` [json|[{"id":1,"referee":null,"auditor":null},{"id":2,"referee":null,"auditor":null},{"id":3,"referee":1,"auditor":2},{"id":4,"referee":1,"auditor":2},{"id":5,"referee":3,"auditor":4},{"id":6,"referee":3,"auditor":4}]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
