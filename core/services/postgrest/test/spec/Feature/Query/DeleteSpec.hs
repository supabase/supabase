module Feature.Query.DeleteSpec where

import Network.HTTP.Types
import Protolude hiding (get)
import Test.Hspec hiding (pendingWith)
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig baseCfg $
  describe "Deleting" $ do
    context "existing record" $ do
      it "succeeds with 204 and deletion count" $
        request
          methodDelete
          "/items?id=eq.1"
          []
          ""
          `shouldRespondWith` ""
            { matchStatus = 204
            , matchHeaders =
                [ matchHeaderAbsent hContentType
                , matchHeaderAbsent hContentLength
                , "Content-Range" <:> "*/*"
                ]
            }

      it "returns the deleted item and count if requested" $
        request methodDelete "/items?id=eq.2" [("Prefer", "return=representation"), ("Prefer", "count=exact")] ""
          `shouldRespondWith` [json|[{"id":2}]|]
            { matchStatus = 200
            , matchHeaders =
                [ "Content-Range" <:> "*/1"
                , "Content-Length" <:> "10"
                , "Preference-Applied" <:> "return=representation, count=exact"
                ]
            }

      it "ignores ?select= when return not set or return=minimal" $ do
        request
          methodDelete
          "/items?id=eq.3&select=id"
          []
          ""
          `shouldRespondWith` ""
            { matchStatus = 204
            , matchHeaders =
                [ matchHeaderAbsent hContentType
                , matchHeaderAbsent hContentLength
                , "Content-Range" <:> "*/*"
                ]
            }
        request
          methodDelete
          "/items?id=eq.3&select=id"
          [("Prefer", "return=minimal")]
          ""
          `shouldRespondWith` ""
            { matchStatus = 204
            , matchHeaders =
                [ matchHeaderAbsent hContentType
                , matchHeaderAbsent hContentLength
                , "Content-Range" <:> "*/*"
                , "Preference-Applied" <:> "return=minimal"
                ]
            }

      it "returns the deleted item and shapes the response" $
        request methodDelete "/complex_items?id=eq.2&select=id,name" [("Prefer", "return=representation")] ""
          `shouldRespondWith` [json|[{"id":2,"name":"Two"}]|]
            { matchStatus = 200
            , matchHeaders =
                [ "Content-Range" <:> "*/*"
                , "Content-Length" <:> "23"
                ]
            }

      it "can rename and cast the selected columns" $
        request methodDelete "/complex_items?id=eq.3&select=ciId:id::text,ciName:name" [("Prefer", "return=representation")] ""
          `shouldRespondWith` [json|[{"ciId":"3","ciName":"Three"}]|]

      it "can embed (parent) entities" $
        request methodDelete "/tasks?id=eq.8&select=id,name,project:projects(id)" [("Prefer", "return=representation")] ""
          `shouldRespondWith` [json|[{"id":8,"name":"Code OSX","project":{"id":4}}]|]
            { matchStatus = 200
            , matchHeaders = ["Content-Range" <:> "*/*"]
            }

      it "embeds an O2O relationship after delete" $ do
        request
          methodDelete
          "/students?id=eq.1&select=name,students_info(address)"
          [("Prefer", "return=representation")]
          ""
          `shouldRespondWith` [json|[
            {
              "name": "John Doe",
              "students_info":{"address":"Street 1"}
            }
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
        request
          methodDelete
          "/students_info?id=eq.1&select=address,students(name)"
          [("Prefer", "return=representation")]
          ""
          `shouldRespondWith` [json|[
            {
              "address": "Street 1",
              "students":{"name": "John Doe"}
            }
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }

    context "known route, no records matched" $
      it "includes [] body if return=rep" $
        request
          methodDelete
          "/items?id=eq.101"
          [("Prefer", "return=representation")]
          ""
          `shouldRespondWith` "[]"
            { matchStatus = 200
            , matchHeaders = ["Content-Range" <:> "*/*"]
            }

    context "totally unknown route" $
      it "fails with 404" $
        request methodDelete "/foozle?id=eq.101" [] ""
          `shouldRespondWith` [json| {"code":"PGRST205","details":null,"hint":null,"message":"Could not find the table 'test.foozle' in the schema cache"} |]
            { matchStatus = 404
            , matchHeaders = []
            }

    context "table with limited privileges" $ do
      it "fails deleting the row when return=representation and selecting all the columns" $
        request methodDelete "/app_users?id=eq.1" [("Prefer", "return=representation")] mempty
          `shouldRespondWith` 401

      it "succeeds deleting the row when return=representation and selecting only the privileged columns" $
        request
          methodDelete
          "/app_users?id=eq.1&select=id,email"
          [("Prefer", "return=representation")]
          [json| { "password": "passxyz" } |]
          `shouldRespondWith` [json|[ { "id": 1, "email": "test@123.com" } ]|]
            { matchStatus = 200
            , matchHeaders = ["Content-Range" <:> "*/*"]
            }

      it "suceeds deleting the row with no explicit select when using return=minimal" $
        request
          methodDelete
          "/app_users?id=eq.2"
          [("Prefer", "return=minimal")]
          mempty
          `shouldRespondWith` ""
            { matchStatus = 204
            , matchHeaders =
                [ matchHeaderAbsent hContentType
                , matchHeaderAbsent hContentLength
                , "Preference-Applied" <:> "return=minimal"
                ]
            }

      it "suceeds deleting the row with no explicit select by default" $
        request
          methodDelete
          "/app_users?id=eq.3"
          []
          mempty
          `shouldRespondWith` ""
            { matchStatus = 204
            , matchHeaders =
                [ matchHeaderAbsent hContentType
                , matchHeaderAbsent hContentLength
                ]
            }

    context "with ordering" $
      it "works with request method DELETE and embedded resource" $ do
        request
          methodDelete
          "/artists?id=lt.3&select=id,name,albums(title)&order=id.desc"
          [("Prefer", "return=representation")]
          ""
          `shouldRespondWith` [json| [ {"id":2,"name":"black country, new road","albums":[{"title": "ants from up above"}]}, {"id":1,"name":"duster","albums":[{"title": "stratosphere"},{"title": "contemporary movement"}]}]
          |]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson, "Preference-Applied" <:> "return=representation"]
            }
