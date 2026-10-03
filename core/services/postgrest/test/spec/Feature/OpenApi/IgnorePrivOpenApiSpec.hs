module Feature.OpenApi.IgnorePrivOpenApiSpec where

import Control.Lens ((^?))
import Data.Aeson.Lens
import Data.Aeson.QQ
import Data.List.NonEmpty (fromList)
import Network.HTTP.Types
import Network.Wai.Test (SResponse (..))
import Protolude hiding (get)
import Test.Hspec hiding (pendingWith)
import Test.Hspec.Wai

import PostgREST.Config (AppConfig (..), OpenAPIMode (..))
import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig
  ( baseCfg
      { configOpenApiMode = OAIgnorePriv
      , configDbSchemas = fromList ["test", "v1"]
      }
  )
  $ describe "OpenAPI Ignore Privileges"
  $ do
    it "root path returns a valid openapi spec" $ do
      validateOpenApiResponse [("Accept", "application/openapi+json")]
      request
        methodHead
        "/"
        (acceptHdrs "application/openapi+json")
        ""
        `shouldRespondWith` ""
          { matchStatus = 200
          , matchHeaders =
              [ "Content-Type" <:> "application/openapi+json; charset=utf-8"
              , matchHeaderAbsent hContentLength
              ]
          }

    describe "table" $ do
      it "includes privileged table even if user does not have permission" $ do
        r <- simpleBody <$> get "/"
        let tableTag =
              r
                ^? key "paths"
                  . key "/authors_only"
                  . key "post"
                  . key "tags"
                  . nth 0

        liftIO $ tableTag `shouldBe` Just [aesonQQ|"authors_only"|]

      it "only includes tables that belong to another schema if the Accept-Profile header is used" $ do
        r1 <- simpleBody <$> get "/"
        let tableKey1 = r1 ^? key "paths" . key "/children"

        liftIO $ tableKey1 `shouldBe` Nothing

        r2 <- simpleBody <$> request methodGet "/" [("Accept-Profile", "v1")] ""
        let tableKey2 = r2 ^? key "paths" . key "/children"

        liftIO $ tableKey2 `shouldNotBe` Nothing

      it "includes comments on tables" $ do
        r <- simpleBody <$> get "/"

        let
          grandChildGet s = key "paths" . key "/grandchild_entities" . key "get" . key s
          grandChildGetSummary = r ^? grandChildGet "summary"
          grandChildGetDescription = r ^? grandChildGet "description"

        liftIO $ do
          grandChildGetSummary `shouldBe` Just "grandchild_entities summary"
          grandChildGetDescription `shouldBe` Just "grandchild_entities description\nthat spans\nmultiple lines"

    describe "RPC" $ do
      it "includes privileged function even if user does not have permission" $ do
        r <- simpleBody <$> get "/"
        let funcTag =
              r
                ^? key "paths"
                  . key "/rpc/privileged_hello"
                  . key "post"
                  . key "tags"
                  . nth 0

        liftIO $ funcTag `shouldBe` Just [aesonQQ|"(rpc) privileged_hello"|]

      it "only includes functions that belong to another schema if the Accept-Profile header is used" $ do
        r1 <- simpleBody <$> get "/"
        let funcKey1 = r1 ^? key "paths" . key "/rpc/get_parents_below"

        liftIO $ funcKey1 `shouldBe` Nothing

        r2 <- simpleBody <$> request methodGet "/" [("Accept-Profile", "v1")] ""
        let funcKey2 = r2 ^? key "paths" . key "/rpc/get_parents_below"

        liftIO $ funcKey2 `shouldNotBe` Nothing
