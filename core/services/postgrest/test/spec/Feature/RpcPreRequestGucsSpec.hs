module Feature.RpcPreRequestGucsSpec where

import Network.HTTP.Types
import Protolude hiding (get, put)
import Test.Hspec hiding (pendingWith)
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import PostgREST.Catalog.Identifiers (QualifiedIdentifier (..))
import PostgREST.Config (AppConfig (..))
import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig (baseCfg{configDbPreRequest = Just $ QualifiedIdentifier mempty "custom_headers"}) $
  describe "GUC headers on all methods via pre-request" $ do
    it "succeeds setting the headers on POST" $
      post
        "/items"
        [json|[{"id": 11111}]|]
        `shouldRespondWith` ""
          { matchStatus = 201
          , matchHeaders =
              [ matchHeaderAbsent hContentType
              , "X-Custom-Header" <:> "mykey=myval"
              ]
          }

    it "succeeds setting the headers on GET and HEAD" $ do
      request
        methodGet
        "/items?id=eq.1"
        [("User-Agent", "MSIE 6.0")]
        ""
        `shouldRespondWith` [json|[{"id": 1}]|]
          { matchHeaders = ["Cache-Control" <:> "no-cache, no-store, must-revalidate"]
          }

      request
        methodHead
        "/items?id=eq.1"
        [("User-Agent", "MSIE 7.0")]
        ""
        `shouldRespondWith` ""
          { matchHeaders =
              [ matchContentTypeJson
              , "Cache-Control" <:> "no-cache, no-store, must-revalidate"
              ]
          }

      request
        methodHead
        "/projects"
        [("Accept", "text/csv")]
        ""
        `shouldRespondWith` ""
          { matchHeaders =
              [ "Content-Type" <:> "text/csv; charset=utf-8"
              , "Content-Disposition" <:> "attachment; filename=projects.csv"
              ]
          }

    it "succeeds setting the headers on PATCH" $
      patch
        "/items?id=eq.1"
        [json|[{"id": 11111}]|]
        `shouldRespondWith` ""
          { matchStatus = 204
          , matchHeaders =
              [ matchHeaderAbsent hContentType
              , matchHeaderAbsent hContentLength
              , "X-Custom-Header" <:> "mykey=myval"
              ]
          }

    it "succeeds setting the headers on PUT" $
      put
        "/items?id=eq.1"
        [json|[{"id": 1}]|]
        `shouldRespondWith` ""
          { matchStatus = 204
          , matchHeaders =
              [ matchHeaderAbsent hContentType
              , matchHeaderAbsent hContentLength
              , "X-Custom-Header" <:> "mykey=myval"
              ]
          }

    it "succeeds setting the headers on DELETE" $
      delete "/items?id=eq.1"
        `shouldRespondWith` ""
          { matchStatus = 204
          , matchHeaders =
              [ matchHeaderAbsent hContentType
              , matchHeaderAbsent hContentLength
              , "X-Custom-Header" <:> "mykey=myval"
              ]
          }
    it "can override the Content-Type header" $ do
      request
        methodHead
        "/clients?id=eq.1"
        []
        ""
        `shouldRespondWith` ""
          { matchStatus = 200
          , matchHeaders = ["Content-Type" <:> "application/custom+json"]
          }
      request
        methodHead
        "/rpc/getallprojects"
        []
        ""
        `shouldRespondWith` ""
          { matchStatus = 200
          , matchHeaders = ["Content-Type" <:> "application/custom+json"]
          }
