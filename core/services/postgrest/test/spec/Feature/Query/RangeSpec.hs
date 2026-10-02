module Feature.Query.RangeSpec where

import Network.HTTP.Types
import Network.Wai.Test (SResponse (simpleHeaders, simpleStatus))
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig baseCfg $ do
  describe "GET /rpc/getitemrange" $ do
    context "without range headers" $ do
      context "with response under server size limit" $
        it "returns whole range with status 200" $
          get "/rpc/getitemrange?min=0&max=15" `shouldRespondWith` 200

      context "when I don't want the count" $ do
        it "returns range Content-Range with */* for empty range" $
          get "/rpc/getitemrange?min=2&max=2"
            `shouldRespondWith` [json| [] |]
              { matchHeaders =
                  [ "Content-Range" <:> "*/*"
                  , "Content-Length" <:> "2"
                  ]
              }

        it "returns range Content-Range with range/*" $
          get "/rpc/getitemrange?order=id&min=0&max=15"
            `shouldRespondWith` [json| [{"id":1},{"id":2},{"id":3},{"id":4},{"id":5},{"id":6},{"id":7},{"id":8},{"id":9},{"id":10},{"id":11},{"id":12},{"id":13},{"id":14},{"id":15}] |]
              { matchHeaders = ["Content-Range" <:> "0-14/*"]
              }

      context "of invalid range" $ do
        it "refuses a range with nonzero start when there are no items" $
          request
            methodGet
            "/rpc/getitemrange?offset=1&min=2&max=2"
            [("Prefer", "count=exact")]
            mempty
            `shouldRespondWith` [json| {
                "message":"Requested range not satisfiable",
                "code":"PGRST103",
                "details":"An offset of 1 was requested, but there are only 0 rows.",
                "hint":null
              }|]
              { matchStatus = 416
              , matchHeaders =
                  [ "Content-Range" <:> "*/0"
                  , "Content-Length" <:> "144"
                  ]
              }

        it "refuses a range requesting start past last item" $
          request
            methodGet
            "/rpc/getitemrange?offset=100&min=0&max=15"
            [("Prefer", "count=exact")]
            mempty
            `shouldRespondWith` [json| {
                "message":"Requested range not satisfiable",
                "code":"PGRST103",
                "details":"An offset of 100 was requested, but there are only 15 rows.",
                "hint":null
              }|]
              { matchStatus = 416
              , matchHeaders = ["Content-Range" <:> "*/15"]
              }

    context "with range headers" $ do
      context "of acceptable range" $ do
        it "succeeds with partial content" $ do
          r <-
            request
              methodGet
              "/rpc/getitemrange?min=0&max=15"
              (rangeHdrs $ ByteRangeFromTo 0 1)
              mempty
          liftIO $ do
            simpleHeaders r `shouldSatisfy` matchHeader "Content-Range" "0-1/*"
            simpleHeaders r `shouldSatisfy` matchHeader "Content-Length" "22"
            simpleStatus r `shouldBe` ok200

        it "understands open-ended ranges" $
          request
            methodGet
            "/rpc/getitemrange?min=0&max=15"
            (rangeHdrs $ ByteRangeFrom 0)
            mempty
            `shouldRespondWith` 200

        it "returns an empty body when there are no results" $
          request
            methodGet
            "/rpc/getitemrange?min=2&max=2"
            (rangeHdrs $ ByteRangeFromTo 0 1)
            mempty
            `shouldRespondWith` "[]"
              { matchStatus = 200
              , matchHeaders = ["Content-Range" <:> "*/*"]
              }

        it "allows one-item requests" $ do
          r <-
            request
              methodGet
              "/rpc/getitemrange?min=0&max=15"
              (rangeHdrs $ ByteRangeFromTo 0 0)
              mempty
          liftIO $ do
            simpleHeaders r
              `shouldSatisfy` matchHeader "Content-Range" "0-0/*"
            simpleStatus r `shouldBe` ok200

        it "handles ranges beyond collection length via truncation" $ do
          r <-
            request
              methodGet
              "/rpc/getitemrange?min=0&max=15"
              (rangeHdrs $ ByteRangeFromTo 10 100)
              mempty
          liftIO $ do
            simpleHeaders r
              `shouldSatisfy` matchHeader "Content-Range" "10-14/*"
            simpleStatus r `shouldBe` ok200

      context "of invalid range" $ do
        it "fails with 416 for offside range" $
          request
            methodGet
            "/rpc/getitemrange?min=2&max=2"
            (rangeHdrs $ ByteRangeFromTo 1 0)
            mempty
            `shouldRespondWith` [json| {
                "message":"Requested range not satisfiable",
                "code":"PGRST103",
                "details":"The lower boundary must be lower than or equal to the upper boundary in the Range header.",
                "hint":null
              }|]
              { matchStatus = 416
              }

        it "refuses a range with nonzero start when there are no items" $
          request
            methodGet
            "/rpc/getitemrange?min=2&max=2"
            (rangeHdrsWithCount $ ByteRangeFromTo 1 2)
            mempty
            `shouldRespondWith` [json| {
                "message":"Requested range not satisfiable",
                "code":"PGRST103",
                "details":"An offset of 1 was requested, but there are only 0 rows.",
                "hint":null
              }|]
              { matchStatus = 416
              , matchHeaders =
                  [ "Content-Range" <:> "*/0"
                  , "Content-Length" <:> "144"
                  ]
              }

        it "refuses a range requesting start past last item" $
          request
            methodGet
            "/rpc/getitemrange?min=0&max=15"
            (rangeHdrsWithCount $ ByteRangeFromTo 100 199)
            mempty
            `shouldRespondWith` [json| {
                "message":"Requested range not satisfiable",
                "code":"PGRST103",
                "details":"An offset of 100 was requested, but there are only 15 rows.",
                "hint":null
              }|]
              { matchStatus = 416
              , matchHeaders = ["Content-Range" <:> "*/15"]
              }

  describe "GET /items" $ do
    context "without range headers" $ do
      context "with response under server size limit" $
        it "returns whole range with status 200" $
          get "/items" `shouldRespondWith` 200

      context "count with an empty body" $ do
        it "returns empty body with Content-Range */0" $
          request
            methodGet
            "/items?id=eq.0"
            [("Prefer", "count=exact")]
            ""
            `shouldRespondWith` [json|[]|]
              { matchHeaders = ["Content-Range" <:> "*/0"]
              }

      context "when I don't want the count" $ do
        it "returns range Content-Range with /*" $
          request
            methodGet
            "/menagerie"
            [("Prefer", "count=none")]
            ""
            `shouldRespondWith` [json|[]|]
              { matchHeaders = ["Content-Range" <:> "*/*"]
              }

        it "returns range Content-Range with range/*" $
          request
            methodGet
            "/items?order=id"
            [("Prefer", "count=none")]
            ""
            `shouldRespondWith` [json| [{"id":1},{"id":2},{"id":3},{"id":4},{"id":5},{"id":6},{"id":7},{"id":8},{"id":9},{"id":10},{"id":11},{"id":12},{"id":13},{"id":14},{"id":15}] |]
              { matchHeaders = ["Content-Range" <:> "0-14/*"]
              }

        it "returns range Content-Range with range/* even using other filters" $
          request
            methodGet
            "/items?id=eq.1&order=id"
            [("Prefer", "count=none")]
            ""
            `shouldRespondWith` [json| [{"id":1}] |]
              { matchHeaders = ["Content-Range" <:> "0-0/*"]
              }

    context "with limit/offset parameters" $ do
      it "no parameters return everything" $
        get "/items?select=id&order=id.asc"
          `shouldRespondWith` [json|[{"id":1},{"id":2},{"id":3},{"id":4},{"id":5},{"id":6},{"id":7},{"id":8},{"id":9},{"id":10},{"id":11},{"id":12},{"id":13},{"id":14},{"id":15}]|]
            { matchStatus = 200
            , matchHeaders = ["Content-Range" <:> "0-14/*"]
            }
      it "top level limit with parameter" $
        get "/items?select=id&order=id.asc&limit=3"
          `shouldRespondWith` [json|[{"id":1},{"id":2},{"id":3}]|]
            { matchStatus = 200
            , matchHeaders = ["Content-Range" <:> "0-2/*"]
            }
      it "headers override get parameters" $
        request
          methodGet
          "/items?select=id&order=id.asc&limit=3"
          (rangeHdrs $ ByteRangeFromTo 0 1)
          ""
          `shouldRespondWith` [json|[{"id":1},{"id":2}]|]
            { matchStatus = 200
            , matchHeaders = ["Content-Range" <:> "0-1/*"]
            }

      it "limit works on all levels" $
        get "/clients?select=id,projects(id,tasks(id))&order=id.asc&limit=1&projects.order=id.asc&projects.limit=2&projects.tasks.order=id.asc&projects.tasks.limit=1"
          `shouldRespondWith` [json|[{"id":1,"projects":[{"id":1,"tasks":[{"id":1}]},{"id":2,"tasks":[{"id":3}]}]}]|]
            { matchStatus = 200
            , matchHeaders = ["Content-Range" <:> "0-0/*"]
            }

      it "limit and offset works on first level" $ do
        get "/items?select=id&order=id.asc&limit=3&offset=2"
          `shouldRespondWith` [json|[{"id":3},{"id":4},{"id":5}]|]
            { matchStatus = 200
            , matchHeaders = ["Content-Range" <:> "2-4/*"]
            }
        request
          methodHead
          "/items?select=id&order=id.asc&limit=3&offset=2"
          []
          mempty
          `shouldRespondWith` ""
            { matchStatus = 200
            , matchHeaders =
                [ matchContentTypeJson
                , "Content-Range" <:> "2-4/*"
                ]
            }

      it "works alongside order by with nulls order" $
        get "/clients?select=id,projects(id,tasks(id))&order=id.asc.nullslast&limit=1&projects.order=id.asc.nullsfirst&projects.limit=2"
          `shouldRespondWith` [json|[{"id":1,"projects":[{"id": 1, "tasks": [{"id": 1}, {"id": 2}]}, {"id": 2, "tasks": [{"id": 3}, {"id": 4}]}]}]|]
            { matchStatus = 200
            , matchHeaders = ["Content-Range" <:> "0-0/*"]
            }

      context "succeeds if offset equals 0 as a no-op" $ do
        it "no items" $ do
          get "/items?offset=0&id=eq.0"
            `shouldRespondWith` [json|[]|]
              { matchHeaders = ["Content-Range" <:> "*/*"]
              }

          request
            methodGet
            "/items?offset=0&id=eq.0"
            [("Prefer", "count=exact")]
            ""
            `shouldRespondWith` [json|[]|]
              { matchHeaders = ["Content-Range" <:> "*/0"]
              }

        it "one or more items" $
          get "/items?select=id&offset=0&order=id"
            `shouldRespondWith` [json|[{"id":1},{"id":2},{"id":3},{"id":4},{"id":5},{"id":6},{"id":7},{"id":8},{"id":9},{"id":10},{"id":11},{"id":12},{"id":13},{"id":14},{"id":15}]|]
              { matchHeaders = ["Content-Range" <:> "0-14/*"]
              }

      it "succeeds if offset is negative as a no-op" $
        get "/items?select=id&offset=-4&order=id"
          `shouldRespondWith` [json|[{"id":1},{"id":2},{"id":3},{"id":4},{"id":5},{"id":6},{"id":7},{"id":8},{"id":9},{"id":10},{"id":11},{"id":12},{"id":13},{"id":14},{"id":15}]|]
            { matchHeaders = ["Content-Range" <:> "0-14/*"]
            }

      it "succeeds and returns an empty array if limit equals 0" $
        get "/items?select=id&limit=0"
          `shouldRespondWith` [json|[]|]
            { matchStatus = 200
            , matchHeaders = ["Content-Range" <:> "*/*"]
            }

      it "fails if limit is negative" $
        get "/items?select=id&limit=-1"
          `shouldRespondWith` [json| {
              "message":"Requested range not satisfiable",
              "code":"PGRST103",
              "details":"Limit should be greater than or equal to zero.",
              "hint":null
            }|]
            { matchStatus = 416
            , matchHeaders = [matchContentTypeJson]
            }

      context "of invalid range" $ do
        it "refuses a range with nonzero start when there are no items" $
          request
            methodGet
            "/menagerie?offset=1"
            [("Prefer", "count=exact")]
            ""
            `shouldRespondWith` [json| {
                "message":"Requested range not satisfiable",
                "code":"PGRST103",
                "details":"An offset of 1 was requested, but there are only 0 rows.",
                "hint":null
              }|]
              { matchStatus = 416
              , matchHeaders =
                  [ "Content-Range" <:> "*/0"
                  , "Content-Length" <:> "144"
                  ]
              }

        it "refuses a range requesting start past last item" $
          request
            methodGet
            "/items?offset=100"
            [("Prefer", "count=exact")]
            ""
            `shouldRespondWith` [json| {
                "message":"Requested range not satisfiable",
                "code":"PGRST103",
                "details":"An offset of 100 was requested, but there are only 15 rows.",
                "hint":null
              }|]
              { matchStatus = 416
              , matchHeaders = ["Content-Range" <:> "*/15"]
              }

    context "when count=planned" $ do
      it "obtains a filtered range" $ do
        request
          methodGet
          "/items?select=id&id=gt.8"
          [("Prefer", "count=planned")]
          ""
          `shouldRespondWith` [json|[{"id":9}, {"id":10}, {"id":11}, {"id":12}, {"id":13}, {"id":14}, {"id":15}]|]
            { matchStatus = 206
            , matchHeaders = ["Content-Range" <:> "0-6/8"]
            }

        request
          methodGet
          "/child_entities?select=id&id=gt.3"
          [("Prefer", "count=planned")]
          ""
          `shouldRespondWith` [json|[{"id":4}, {"id":5}, {"id":6}]|]
            { matchStatus = 206
            , matchHeaders = ["Content-Range" <:> "0-2/4"]
            }

        request
          methodGet
          "/getallprojects_view?select=id&id=lt.3"
          [("Prefer", "count=planned")]
          ""
          `shouldRespondWith` [json|[{"id":1}, {"id":2}]|]
            { matchStatus = 206
            , matchHeaders = ["Content-Range" <:> "0-1/673"]
            }

      it "obtains the full range" $ do
        request
          methodHead
          "/items"
          [("Prefer", "count=planned")]
          ""
          `shouldRespondWith` ""
            { matchStatus = 200
            , matchHeaders =
                [ matchContentTypeJson
                , "Content-Range" <:> "0-14/15"
                ]
            }

        request
          methodHead
          "/child_entities"
          [("Prefer", "count=planned")]
          ""
          `shouldRespondWith` ""
            { matchStatus = 200
            , matchHeaders =
                [ matchContentTypeJson
                , "Content-Range" <:> "0-5/6"
                ]
            }

        request
          methodHead
          "/getallprojects_view"
          [("Prefer", "count=planned")]
          ""
          `shouldRespondWith` ""
            { matchStatus = 206
            , matchHeaders =
                [ matchContentTypeJson
                , "Content-Range" <:> "0-4/2019"
                ]
            }

      it "ignores limit/offset on the planned count" $ do
        request
          methodHead
          "/items?limit=2&offset=3"
          [("Prefer", "count=planned")]
          ""
          `shouldRespondWith` ""
            { matchStatus = 206
            , matchHeaders =
                [ matchContentTypeJson
                , "Content-Range" <:> "3-4/15"
                ]
            }

        request
          methodHead
          "/child_entities?limit=2"
          [("Prefer", "count=planned")]
          ""
          `shouldRespondWith` ""
            { matchStatus = 206
            , matchHeaders =
                [ matchContentTypeJson
                , "Content-Range" <:> "0-1/6"
                ]
            }

        request
          methodHead
          "/getallprojects_view?limit=2"
          [("Prefer", "count=planned")]
          ""
          `shouldRespondWith` ""
            { matchStatus = 206
            , matchHeaders =
                [ matchContentTypeJson
                , "Content-Range" <:> "0-1/2019"
                ]
            }

      it "works with two levels" $
        request
          methodHead
          "/child_entities?select=*,entities(*)"
          [("Prefer", "count=planned")]
          ""
          `shouldRespondWith` ""
            { matchStatus = 200
            , matchHeaders =
                [ matchContentTypeJson
                , "Content-Range" <:> "0-5/6"
                ]
            }

    context "with range headers" $ do
      context "of acceptable range" $ do
        it "succeeds with partial content" $ do
          r <-
            request
              methodGet
              "/items"
              (rangeHdrs $ ByteRangeFromTo 0 1)
              ""
          liftIO $ do
            simpleHeaders r
              `shouldSatisfy` matchHeader "Content-Range" "0-1/*"
            simpleStatus r `shouldBe` ok200

        it "understands open-ended ranges" $
          request
            methodGet
            "/items"
            (rangeHdrs $ ByteRangeFrom 0)
            ""
            `shouldRespondWith` 200

        it "returns an empty body when there are no results" $
          request
            methodGet
            "/menagerie"
            (rangeHdrs $ ByteRangeFromTo 0 1)
            ""
            `shouldRespondWith` "[]"
              { matchStatus = 200
              , matchHeaders = ["Content-Range" <:> "*/*"]
              }

        it "allows one-item requests" $ do
          r <-
            request
              methodGet
              "/items"
              (rangeHdrs $ ByteRangeFromTo 0 0)
              ""
          liftIO $ do
            simpleHeaders r
              `shouldSatisfy` matchHeader "Content-Range" "0-0/*"
            simpleStatus r `shouldBe` ok200

        it "handles ranges beyond collection length via truncation" $ do
          r <-
            request
              methodGet
              "/items"
              (rangeHdrs $ ByteRangeFromTo 10 100)
              ""
          liftIO $ do
            simpleHeaders r
              `shouldSatisfy` matchHeader "Content-Range" "10-14/*"
            simpleStatus r `shouldBe` ok200

      context "of invalid range" $ do
        it "fails with 416 for offside range" $
          request
            methodGet
            "/items"
            (rangeHdrs $ ByteRangeFromTo 1 0)
            ""
            `shouldRespondWith` [json| {
                "message":"Requested range not satisfiable",
                "code":"PGRST103",
                "details":"The lower boundary must be lower than or equal to the upper boundary in the Range header.",
                "hint":null
              }|]
              { matchStatus = 416
              }

        it "refuses a range with nonzero start when there are no items" $
          request
            methodGet
            "/menagerie"
            (rangeHdrsWithCount $ ByteRangeFromTo 1 2)
            ""
            `shouldRespondWith` [json| {
                "message":"Requested range not satisfiable",
                "code":"PGRST103",
                "details":"An offset of 1 was requested, but there are only 0 rows.",
                "hint":null
              }|]
              { matchStatus = 416
              , matchHeaders =
                  [ "Content-Range" <:> "*/0"
                  , "Content-Length" <:> "144"
                  ]
              }

        it "refuses a range requesting start past last item" $
          request
            methodGet
            "/items"
            (rangeHdrsWithCount $ ByteRangeFromTo 100 199)
            ""
            `shouldRespondWith` [json| {
                "message":"Requested range not satisfiable",
                "code":"PGRST103",
                "details":"An offset of 100 was requested, but there are only 15 rows.",
                "hint":null
              }|]
              { matchStatus = 416
              , matchHeaders = ["Content-Range" <:> "*/15"]
              }
