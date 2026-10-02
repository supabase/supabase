module Feature.Query.CustomMediaSpec where

import Network.HTTP.Types
import Network.Wai.Test (SResponse (simpleBody, simpleHeaders, simpleStatus))
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON
import Text.Heredoc (str)

import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig baseCfg $ describe "custom media types" $ do
  context "for tables with aggregate" $ do
    it "can query if there's an aggregate defined for the table" $ do
      r <- request methodGet "/lines" (acceptHdrs "application/vnd.twkb") ""
      liftIO $ do
        simpleBody r `shouldBe` readFixtureFile "lines.twkb"
        simpleHeaders r `shouldContain` [("Content-Type", "application/vnd.twkb")]
        simpleHeaders r `shouldContain` [("Content-Length", "30")]

    it "can query by id if there's an aggregate defined for the table" $ do
      r <- request methodGet "/lines?id=eq.1" (acceptHdrs "application/vnd.twkb") ""
      liftIO $ do
        simpleBody r `shouldBe` readFixtureFile "1.twkb"
        simpleHeaders r `shouldContain` [("Content-Type", "application/vnd.twkb")]

    it "will fail if there's no aggregate defined for the table" $ do
      request methodGet "/lines" (acceptHdrs "text/plain") ""
        `shouldRespondWith` [json| {"code":"PGRST107","details":null,"hint":null,"message":"None of these media types are available: text/plain"} |]
          { matchStatus = 406
          , matchHeaders =
              [ matchContentTypeJson
              , "Content-Length" <:> "110"
              ]
          }

    it "can get raw xml output with Accept: text/xml if there's an aggregate defined" $ do
      request methodGet "/xmltest" (acceptHdrs "text/xml") ""
        `shouldRespondWith` "<myxml>foo</myxml>bar<foobar><baz/></foobar>"
          { matchStatus = 200
          , matchHeaders =
              [ "Content-Type" <:> "text/xml; charset=utf-8"
              , "Content-Length" <:> "44"
              ]
          }

  -- TODO SOH (start of heading) is being added to results
  context "for tables with anyelement aggregate" $ do
    it "will use the application/vnd.geo2+json media type for any table" $
      request methodGet "/lines" (acceptHdrs "application/vnd.geo2+json") ""
        `shouldRespondWith` "\SOH{\"type\": \"FeatureCollection\", \"hello\": \"world\"}"
          { matchStatus = 200
          , matchHeaders =
              [ "Content-Type" <:> "application/vnd.geo2+json"
              , "Content-Length" <:> "48"
              ]
          }

    it "will use the more specific application/vnd.geo2 handler for this table" $ do
      request methodGet "/shop_bles" (acceptHdrs "application/vnd.geo2+json") ""
        `shouldRespondWith` "\SOH\"anyelement overridden\""
          { matchStatus = 200
          , matchHeaders = ["Content-Type" <:> "application/vnd.geo2+json"]
          }

      request methodGet "/rpc/get_shop_bles" (acceptHdrs "application/vnd.geo2+json") ""
        `shouldRespondWith` "\SOH\"anyelement overridden\""
          { matchStatus = 200
          , matchHeaders = ["Content-Type" <:> "application/vnd.geo2+json"]
          }

  context "Proc that returns scalar" $ do
    it "can get raw output with Accept: text/html" $ do
      request methodGet "/rpc/welcome.html" (acceptHdrs "text/html") ""
        `shouldRespondWith` [str|
            |<html>
            |  <head>
            |    <title>PostgREST</title>
            |  </head>
            |  <body>
            |    <h1>Welcome to PostgREST</h1>
            |  </body>
            |</html>
            |]
          { matchStatus = 200
          , matchHeaders =
              [ "Content-Type" <:> "text/html"
              , "Content-Length" <:> "117"
              ]
          }

    it "can get raw output with Accept: text/plain" $ do
      request methodGet "/rpc/welcome" (acceptHdrs "text/plain") ""
        `shouldRespondWith` "Welcome to PostgREST"
          { matchStatus = 200
          , matchHeaders =
              [ "Content-Type" <:> "text/plain; charset=utf-8"
              , "Content-Length" <:> "20"
              ]
          }

    it "can get raw xml output with Accept: text/xml" $ do
      request methodGet "/rpc/return_scalar_xml" (acceptHdrs "text/xml") ""
        `shouldRespondWith` "<my-xml-tag/>"
          { matchStatus = 200
          , matchHeaders =
              [ "Content-Type" <:> "text/xml; charset=utf-8"
              , "Content-Length" <:> "13"
              ]
          }

    it "can get raw xml output with Accept: text/xml" $ do
      request methodGet "/rpc/welcome.xml" (acceptHdrs "text/xml") ""
        `shouldRespondWith` "<html>\n  <head>\n    <title>PostgREST</title>\n  </head>\n  <body>\n    <h1>Welcome to PostgREST</h1>\n  </body>\n</html>"
          { matchStatus = 200
          , matchHeaders = ["Content-Type" <:> "text/xml; charset=utf-8"]
          }

    it "should fail with function returning text and Accept: text/xml" $ do
      request methodGet "/rpc/welcome" (acceptHdrs "text/xml") ""
        `shouldRespondWith` [json|
          {"code":"PGRST107","details":null,"hint":null,"message":"None of these media types are available: text/xml"}
        |]
          { matchStatus = 406
          , matchHeaders = ["Content-Type" <:> "application/json; charset=utf-8"]
          }

    it "should not fail when the function doesn't return a row" $ do
      request methodGet "/rpc/get_line?id=777" (acceptHdrs "application/vnd.twkb") ""
        `shouldRespondWith` ""
          { matchStatus = 200
          , matchHeaders = ["Content-Type" <:> "application/vnd.twkb"]
          }

  context "Proc that returns scalar based on a table" $ do
    it "can get an image with Accept: image/png" $ do
      r <- request methodGet "/rpc/ret_image" (acceptHdrs "image/png") ""
      liftIO $ do
        simpleBody r `shouldBe` readFixtureFile "A.png"
        simpleHeaders r `shouldContain` [("Content-Type", "image/png")]
        simpleHeaders r `shouldContain` [("Content-Length", "138")]

  context "Proc that returns set of scalars and Accept: text/plain" $
    it "will err because only scalars work with media type domains" $ do
      request
        methodGet
        "/rpc/welcome_twice"
        (acceptHdrs "text/plain")
        ""
        `shouldRespondWith` [json|{"code":"PGRST107","details":null,"hint":null,"message":"None of these media types are available: text/plain"}|]
          { matchStatus = 406
          , matchHeaders =
              [ "Content-Type" <:> "application/json; charset=utf-8"
              , "Content-Length" <:> "110"
              ]
          }

  context "Proc that returns rows and accepts custom media type" $ do
    it "works if it has an aggregate defined" $ do
      r <- request methodGet "/rpc/get_lines" [("Accept", "application/vnd.twkb")] ""
      liftIO $ do
        simpleBody r `shouldBe` readFixtureFile "lines.twkb"
        simpleHeaders r `shouldContain` [("Content-Type", "application/vnd.twkb")]

    it "fails if doesn't have an aggregate defined" $ do
      request
        methodGet
        "/rpc/get_lines"
        (acceptHdrs "application/octet-stream")
        ""
        `shouldRespondWith` [json| {"code":"PGRST107","details":null,"hint":null,"message":"None of these media types are available: application/octet-stream"} |]
          { matchStatus = 406
          }

    -- TODO SOH (start of heading) is being added to results
    it "works if there's an anyelement aggregate defined" $ do
      request methodGet "/rpc/get_lines" (acceptHdrs "application/vnd.geo2+json") ""
        `shouldRespondWith` "\SOH{\"type\": \"FeatureCollection\", \"hello\": \"world\"}"
          { matchStatus = 200
          , matchHeaders = ["Content-Type" <:> "application/vnd.geo2+json"]
          }

  context "overriding" $ do
    it "will override the application/json handler for a single table" $
      request methodGet "/ov_json" (acceptHdrs "application/json") ""
        `shouldRespondWith` [json| {"overridden": "true"} |]
          { matchStatus = 200
          , matchHeaders =
              [ "Content-Type" <:> "application/json; charset=utf-8"
              , "Content-Length" <:> "22"
              ]
          }

    -- TODO SOH (start of heading) is being added to results
    it "will override the application/geo+json handler for a single table" $
      request methodGet "/lines?id=eq.1" (acceptHdrs "application/geo+json") ""
        `shouldRespondWith` "\SOH{\"crs\": {\"type\": \"name\", \"properties\": {\"name\": \"EPSG:4326\"}}, \"type\": \"FeatureCollection\", \"features\": [{\"type\": \"Feature\", \"geometry\": {\"type\": \"LineString\", \"coordinates\": [[1, 1], [5, 5]]}, \"properties\": {\"id\": 1, \"name\": \"line-1\"}}]}"
          { matchStatus = 200
          , matchHeaders =
              [ "Content-Type" <:> "application/geo+json; charset=utf-8"
              , "Content-Length" <:> "239"
              ]
          }

    it "will not override vendored media types like application/vnd.pgrst.object" $
      request methodGet "/projects?id=eq.1" (acceptHdrs "application/vnd.pgrst.object") ""
        `shouldRespondWith` [json|{"id":1,"name":"Windows 7","client_id":1}|]
          { matchStatus = 200
          , matchHeaders =
              [ "Content-Type" <:> "application/vnd.pgrst.object+json; charset=utf-8"
              , "Content-Length" <:> "41"
              ]
          }

  context "matches requested media type correctly" $ do
    -- https://github.com/PostgREST/postgrest/issues/1462
    it "will match image/png according to q values" $ do
      r1 <- request methodGet "/rpc/ret_image" (acceptHdrs "image/png, */*") ""
      liftIO $ do
        simpleBody r1 `shouldBe` readFixtureFile "A.png"
        simpleHeaders r1 `shouldContain` [("Content-Type", "image/png")]
        simpleHeaders r1 `shouldContain` [("Content-Length", "138")]

      r2 <- request methodGet "/rpc/ret_image" (acceptHdrs "text/html,application/xhtml+xml,application/xml;q=0.9,image/png,*/*;q=0.8") ""
      liftIO $ do
        simpleBody r2 `shouldBe` readFixtureFile "A.png"
        simpleHeaders r2 `shouldContain` [("Content-Type", "image/png")]
        simpleHeaders r2 `shouldContain` [("Content-Length", "138")]

    -- https://github.com/PostgREST/postgrest/issues/2170
    it "will match json in presence of text/plain" $ do
      r <- request methodGet "/projects?id=eq.1" (acceptHdrs "text/plain, application/json") ""
      liftIO $ do
        simpleStatus r `shouldBe` status200
        simpleHeaders r `shouldContain` [("Content-Type", "application/json; charset=utf-8")]

    -- https://github.com/PostgREST/postgrest/issues/1102
    it "will match a custom text/tab-separated-values" $ do
      request methodGet "/projects?id=in.(1,2)" (acceptHdrs "text/tab-separated-values") ""
        `shouldRespondWith` "id\tname\tclient_id\n1\tWindows 7\t1\n2\tWindows 10\t1\n"
          { matchStatus = 200
          , matchHeaders =
              [ "Content-Type" <:> "text/tab-separated-values"
              , "Content-Length" <:> "47"
              ]
          }

    -- https://github.com/PostgREST/postgrest/issues/1371#issuecomment-519248984
    it "will match a custom text/csv with BOM" $ do
      r <- request methodGet "/lines" (acceptHdrs "text/csv") ""
      liftIO $ do
        simpleBody r `shouldBe` readFixtureFile "lines.csv"
        simpleHeaders r `shouldContain` [("Content-Type", "text/csv; charset=utf-8")]
        simpleHeaders r `shouldContain` [("Content-Disposition", "attachment; filename=\"lines.csv\"")]
        simpleHeaders r `shouldContain` [("Content-Length", "216")]

  -- https://github.com/PostgREST/postgrest/issues/3160
  context "using select query parameter" $ do
    it "without select" $ do
      request methodGet "/projects?id=in.(1,2)" (acceptHdrs "pg/outfunc") ""
        `shouldRespondWith` [str|(1,"Windows 7",1)
            |(2,"Windows 10",1)
            |]
          { matchStatus = 200
          , matchHeaders =
              [ "Content-Type" <:> "pg/outfunc"
              , "Content-Length" <:> "37"
              ]
          }

    it "with fewer columns selected" $ do
      request methodGet "/projects?id=in.(1,2)&select=id,name" (acceptHdrs "pg/outfunc") ""
        `shouldRespondWith` [str|(1,"Windows 7")
            |(2,"Windows 10")
            |]
          { matchStatus = 200
          , matchHeaders = ["Content-Type" <:> "pg/outfunc"]
          }

    it "with columns in different order" $ do
      request methodGet "/projects?id=in.(1,2)&select=name,id,client_id" (acceptHdrs "pg/outfunc") ""
        `shouldRespondWith` [str|("Windows 7",1,1)
            |("Windows 10",2,1)
            |]
          { matchStatus = 200
          , matchHeaders = ["Content-Type" <:> "pg/outfunc"]
          }

    it "with computed columns" $ do
      request methodGet "/items?id=in.(1,2)&select=id,always_true" (acceptHdrs "pg/outfunc") ""
        `shouldRespondWith` [str|(1,t)
            |(2,t)
            |]
          { matchStatus = 200
          , matchHeaders = ["Content-Type" <:> "pg/outfunc"]
          }

    -- TODO: Embeddings should not return JSON. Arrays of record would be much better.
    it "with embedding" $ do
      request methodGet "/projects?id=in.(1,2)&select=*,clients(id)" (acceptHdrs "pg/outfunc") ""
        `shouldRespondWith` [str|(1,"Windows 7",1,"{""id"": 1}")
            |(2,"Windows 10",1,"{""id"": 1}")
            |]
          { matchStatus = 200
          , matchHeaders = ["Content-Type" <:> "pg/outfunc"]
          }

    it "will fail for specific aggregate with fewer columns" $ do
      request methodGet "/lines?select=id" (acceptHdrs "application/vnd.twkb") ""
        `shouldRespondWith` 406

    it "will fail for specific aggregate with more columns" $ do
      request methodGet "/lines?select=id,name,geom,id" (acceptHdrs "application/vnd.twkb") ""
        `shouldRespondWith` 406

    it "will fail for specific aggregate with columns in different order" $ do
      request methodGet "/lines?select=name,id,geom" (acceptHdrs "application/vnd.twkb") ""
        `shouldRespondWith` 406

    -- This is just because it would be hard to detect this case, so we better error in this case, too.
    it "will fail for specific aggregate with columns in same order" $ do
      request methodGet "/lines?select=id,name,geom" (acceptHdrs "application/vnd.twkb") ""
        `shouldRespondWith` 406

  context "any media type" $ do
    context "on functions" $ do
      it "returns application/json for */* if not explicitly set" $ do
        request methodGet "/rpc/ret_any_mt" (acceptHdrs "*/*") ""
          `shouldRespondWith` "any"
            { matchStatus = 200
            , matchHeaders = ["Content-Type" <:> "application/octet-stream"]
            }

      it "accepts any media type and sets the generic octet-stream as content type" $ do
        request methodGet "/rpc/ret_any_mt" (acceptHdrs "app/bingo") ""
          `shouldRespondWith` "any"
            { matchStatus = 200
            , matchHeaders = ["Content-Type" <:> "application/octet-stream"]
            }

        request methodGet "/rpc/ret_any_mt" (acceptHdrs "text/bango") ""
          `shouldRespondWith` "any"
            { matchStatus = 200
            , matchHeaders = ["Content-Type" <:> "application/octet-stream"]
            }

        request methodGet "/rpc/ret_any_mt" (acceptHdrs "image/boingo") ""
          `shouldRespondWith` "any"
            { matchStatus = 200
            , matchHeaders = ["Content-Type" <:> "application/octet-stream"]
            }

      it "returns custom media type for */* if explicitly set" $ do
        request methodGet "/rpc/ret_some_mt" (acceptHdrs "*/*") ""
          `shouldRespondWith` "groucho"
            { matchStatus = 200
            , matchHeaders = ["Content-Type" <:> "app/groucho"]
            }

      it "accepts some media types if there's conditional logic" $ do
        request methodGet "/rpc/ret_some_mt" (acceptHdrs "app/chico") ""
          `shouldRespondWith` "chico"
            { matchStatus = 200
            , matchHeaders = ["Content-Type" <:> "app/chico"]
            }

        request methodGet "/rpc/ret_some_mt" (acceptHdrs "app/harpo") ""
          `shouldRespondWith` "harpo"
            { matchStatus = 200
            , matchHeaders = ["Content-Type" <:> "app/harpo"]
            }

        request methodGet "/rpc/ret_some_mt" (acceptHdrs "text/csv") ""
          `shouldRespondWith` 406

    context "on tables" $ do
      it "returns application/json for */* if not explicitly set" $ do
        request methodGet "/some_numbers?val=eq.1" (acceptHdrs "*/*") ""
          `shouldRespondWith` "anything\n1"
            { matchStatus = 200
            , matchHeaders = ["Content-Type" <:> "application/octet-stream"]
            }

      it "accepts any media type and sets it as a header" $ do
        request methodGet "/some_numbers?val=eq.2" (acceptHdrs "magic/number") ""
          `shouldRespondWith` "magic\n2"
            { matchStatus = 200
            , matchHeaders = ["Content-Type" <:> "magic/number"]
            }
        request methodGet "/some_numbers?val=eq.3" (acceptHdrs "crazy/bingo") ""
          `shouldRespondWith` "crazy\n3"
            { matchStatus = 200
            , matchHeaders = ["Content-Type" <:> "crazy/bingo"]
            }
        request methodGet "/some_numbers?val=eq.4" (acceptHdrs "unknown/unknown") ""
          `shouldRespondWith` "anything\n4"
            { matchStatus = 200
            , matchHeaders = ["Content-Type" <:> "application/octet-stream"]
            }

  context "media type parser fails" $ do
    it "sends media type as is" $
      request methodGet "/items" (acceptHdrs "undefined") ""
        `shouldRespondWith` [json| {"code":"PGRST107","details":null,"hint":null,"message":"None of these media types are available: undefined"} |]
          { matchStatus = 406
          }

  context "media type parser allowed characters" $ do
    it "regression test allowing charset=utf-8" $
      request
        methodPost
        "/rpc/overloaded_default"
        [("Content-Type", "application/json; charset=utf-8")]
        [json|{"must_param":1}|]
        `shouldRespondWith` [json|{"val":1}|]
          { matchStatus = 200
          , matchHeaders = ["Content-Type" <:> "application/json; charset=utf-8"]
          }

    it "handle unrecognized parameters leniently" $ do
      request
        methodPost
        "/rpc/overloaded_default"
        [("Content-Type", "application/json; $$ unrecognized-chars=ignored $$")]
        [json|{"must_param":1}|]
        `shouldRespondWith` [json|{"val":1}|]
          { matchStatus = 200
          , matchHeaders = ["Content-Type" <:> "application/json; charset=utf-8"]
          }
