module Feature.Query.QueryLimitedSpec where

import Network.HTTP.Types
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import PostgREST.Config (AppConfig (..))
import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig (baseCfg{configDbMaxRows = Just 2}) $
  describe "Requesting many items with server limits(max-rows) enabled" $ do
    it "restricts results" $
      get "/items?order=id"
        `shouldRespondWith` [json| [{"id":1},{"id":2}] |]
          { matchHeaders = ["Content-Range" <:> "0-1/*"]
          }

    it "respects additional client limiting" $ do
      request
        methodGet
        "/items"
        (rangeHdrs $ ByteRangeFromTo 0 0)
        ""
        `shouldRespondWith` [json| [{"id":1}] |]
          { matchHeaders = ["Content-Range" <:> "0-0/*"]
          }

    it "works on all levels" $
      get "/users?select=id,tasks(id)&order=id.asc&tasks.order=id.asc"
        `shouldRespondWith` [json|[{"id":1,"tasks":[{"id":1},{"id":2}]},{"id":2,"tasks":[{"id":5},{"id":6}]}]|]
          { matchHeaders = ["Content-Range" <:> "0-1/*"]
          }

    it "succeeds in getting parent embeds despite the limit, see #647" $
      get "/tasks?select=id,project:projects(id)&id=gt.5"
        `shouldRespondWith` [json|[{"id":6,"project":{"id":3}},{"id":7,"project":{"id":4}}]|]
          { matchHeaders = ["Content-Range" <:> "0-1/*"]
          }

    it "can offset the parent embed, being consistent with the other embed types" $
      get "/tasks?select=id,project:projects(id)&id=gt.5&project.offset=1"
        `shouldRespondWith` [json|[{"id":6,"project":null}, {"id":7,"project":null}]|]
          { matchHeaders = ["Content-Range" <:> "0-1/*"]
          }

    context "count=estimated" $ do
      it "uses the query planner guess when query rows > maxRows" $
        request
          methodHead
          "/getallprojects_view"
          [("Prefer", "count=estimated")]
          ""
          `shouldRespondWith` ""
            { matchStatus = 206
            , matchHeaders =
                [ matchContentTypeJson
                , "Content-Range" <:> "0-1/2019"
                ]
            }

      it "gives exact count when query rows <= maxRows" $
        request
          methodHead
          "/getallprojects_view?id=lt.3"
          [("Prefer", "count=estimated")]
          ""
          `shouldRespondWith` ""
            { matchHeaders =
                [ matchContentTypeJson
                , "Content-Range" <:> "0-1/2"
                ]
            }

      it "only uses the query planner guess if it's indeed greater than the exact count" $
        request
          methodHead
          "/get_projects_above_view"
          [("Prefer", "count=estimated")]
          ""
          `shouldRespondWith` ""
            { matchStatus = 206
            , matchHeaders =
                [ matchContentTypeJson
                , "Content-Range" <:> "0-1/3"
                ]
            }

    context "max-rows=2 on mutations" $ do
      it "doesn't affect insertions" $
        request
          methodPost
          "/projects?select=id,name"
          [("Prefer", "return=representation")]
          [json| [
              { "id": 6, "name": "BeOS" },
              { "id": 7, "name": "PopOS" },
              { "id": 8, "name": "HaikuOS" } ]|]
          `shouldRespondWith` [json| [
              { "id": 6, "name": "BeOS" },
              { "id": 7, "name": "PopOS" },
              { "id": 8, "name": "HaikuOS" } ]|]
            { matchStatus = 201
            }

      it "doesn't affect updates(2 rows would be modified if it did)" $
        request
          methodPatch
          "/employees?select=first_name,last_name,occupation&order=last_name"
          [("Prefer", "return=representation")]
          [json| [{"occupation": "Barista"}] |]
          `shouldRespondWith` [json|[
                { "first_name": "Daniel B.", "last_name": "Lyon", "occupation": "Barista" },
                { "first_name": "Frances M.", "last_name": "Roe", "occupation": "Barista" },
                { "first_name": "Edwin S.", "last_name": "Smith", "occupation": "Barista" } ]|]
            { matchStatus = 200
            }

      it "doesn't affect deletions" $
        request
          methodDelete
          "/employees?select=first_name,last_name&order=last_name"
          [("Prefer", "return=representation")]
          mempty
          `shouldRespondWith` [json| [
              { "first_name": "Daniel B.", "last_name": "Lyon" },
              { "first_name": "Frances M.", "last_name": "Roe" },
              { "first_name": "Edwin S.", "last_name": "Smith" } ]|]
            { matchStatus = 200
            }

    context "max-rows is set and limits are requested" $ do
      it "should work with limit 0" $
        get "/items?limit=0"
          `shouldRespondWith` [json| [] |]
            { matchHeaders = ["Content-Range" <:> "*/*"]
            }
