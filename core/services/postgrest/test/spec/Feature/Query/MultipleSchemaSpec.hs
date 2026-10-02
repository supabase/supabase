module Feature.Query.MultipleSchemaSpec where

import Control.Lens ((^?))
import Data.Aeson.Lens
import Data.Aeson.QQ
import Data.List.NonEmpty (fromList)
import Network.HTTP.Types
import Network.Wai.Test (SResponse (simpleHeaders), simpleBody)
import Protolude
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import PostgREST.Config (AppConfig (..))
import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig (baseCfg{configDbSchemas = fromList ["v1", "v2", "SPECIAL \"@/\\#~_-"]}) $
  describe "PostGIS features" $
    describe "multiple schemas in single instance" $ do
      context "Reading tables on different schemas" $ do
        it "succeeds in reading table from default schema v1 if no schema is selected via header" $
          request methodGet "/parents" [] ""
            `shouldRespondWith` [json|[
            {"id":1,"name":"parent v1-1"},
            {"id":2,"name":"parent v1-2"}
          ]|]
              { matchStatus = 200
              , matchHeaders = [matchContentTypeJson, "Content-Profile" <:> "v1"]
              }

        it "succeeds in reading table from default schema v1 after explicitly passing it in the header" $
          request methodGet "/parents" [("Accept-Profile", "v1")] ""
            `shouldRespondWith` [json|[
            {"id":1,"name":"parent v1-1"},
            {"id":2,"name":"parent v1-2"}
          ]|]
              { matchStatus = 200
              , matchHeaders = [matchContentTypeJson, "Content-Profile" <:> "v1"]
              }

        it "succeeds in reading table from schema v2" $
          request methodGet "/parents" [("Accept-Profile", "v2")] ""
            `shouldRespondWith` [json|[
            {"id":3,"name":"parent v2-3"},
            {"id":4,"name":"parent v2-4"}
          ]|]
              { matchStatus = 200
              , matchHeaders = [matchContentTypeJson, "Content-Profile" <:> "v2"]
              }

        it "succeeds in reading another_table from schema v2" $
          request methodGet "/another_table" [("Accept-Profile", "v2")] ""
            `shouldRespondWith` [json|[
            {"id":5,"another_value":"value 5"},
            {"id":6,"another_value":"value 6"}
          ]|]
              { matchStatus = 200
              , matchHeaders = [matchContentTypeJson, "Content-Profile" <:> "v2"]
              }

        it "doesn't find another_table in schema v1" $
          request
            methodGet
            "/another_table"
            [("Accept-Profile", "v1")]
            ""
            `shouldRespondWith` [json| {"code":"PGRST205","details":null,"hint":null,"message":"Could not find the table 'v1.another_table' in the schema cache"} |]
              { matchStatus = 404
              , matchHeaders = []
              }

        it "fails trying to read table from unknown schema" $
          request methodGet "/parents" [("Accept-Profile", "unknown")] ""
            `shouldRespondWith` [json|{"message":"Invalid schema: unknown","code":"PGRST106","details":null,"hint":"Only the following schemas are exposed: v1, v2, SPECIAL \"@/\\#~_-"}|]
              { matchStatus = 406
              }

        it "succeeds in reading a table from a schema with uppercase and special characters in its name" $
          request methodGet "/names?select=id,name" [("Accept-Profile", "SPECIAL \"@/\\#~_-")] ""
            `shouldRespondWith` [json|[
            {"id": 1, "name":"John"},
            {"id": 2, "name":"Mary"},
            {"id": 3, "name":"José"}
          ]|]
              { matchStatus = 200
              , matchHeaders = [matchContentTypeJson, "Content-Profile" <:> "SPECIAL \"@/\\#~_-"]
              }

        it "succeeds in embedding with FK when the schema name has special characters" $
          request methodGet "/names?select=name,languages(name)&id=in.(1,3)" [("Accept-Profile", "SPECIAL \"@/\\#~_-")] ""
            `shouldRespondWith` [json|[
            {"name": "John", languages: {"name": "English"}},
            {"name": "José", languages: {"name": "Spanish"}}
          ]|]
              { matchStatus = 200
              , matchHeaders = [matchContentTypeJson, "Content-Profile" <:> "SPECIAL \"@/\\#~_-"]
              }

        it "succeeds in embedding with computed relationships when the schema name has special characters" $
          request methodGet "/names?select=name,computed_languages(name)&id=in.(1,3)" [("Accept-Profile", "SPECIAL \"@/\\#~_-")] ""
            `shouldRespondWith` [json|[
            {"name": "John", computed_languages: {"name": "English"}},
            {"name": "José", computed_languages: {"name": "Spanish"}}
          ]|]
              { matchStatus = 200
              , matchHeaders = [matchContentTypeJson, "Content-Profile" <:> "SPECIAL \"@/\\#~_-"]
              }

      context "Inserting tables on different schemas" $ do
        it "succeeds inserting on default schema and returning it" $
          request
            methodPost
            "/children"
            [("Prefer", "return=representation")]
            [json|{"id": 0, "name": "child v1-1", "parent_id": 1}|]
            `shouldRespondWith` [json|[{"id": 0, "name": "child v1-1", "parent_id": 1}]|]
              { matchStatus = 201
              , matchHeaders = ["Content-Profile" <:> "v1"]
              }

        it "succeeds inserting on the v1 schema and returning its parent" $
          request
            methodPost
            "/children?select=id,parent(*)"
            [("Prefer", "return=representation"), ("Content-Profile", "v1")]
            [json|{"id": 0, "name": "child v1-2", "parent_id": 2}|]
            `shouldRespondWith` [json|[{"id": 0, "parent": {"id": 2, "name": "parent v1-2"}}]|]
              { matchStatus = 201
              , matchHeaders = ["Content-Profile" <:> "v1"]
              }

        it "succeeds inserting on the v2 schema and returning its parent" $
          request
            methodPost
            "/children?select=id,parent(*)"
            [("Prefer", "return=representation"), ("Content-Profile", "v2")]
            [json|{"id": 0, "name": "child v2-3", "parent_id": 3}|]
            `shouldRespondWith` [json|[{"id": 0, "parent": {"id": 3, "name": "parent v2-3"}}]|]
              { matchStatus = 201
              , matchHeaders = ["Content-Profile" <:> "v2"]
              }

        it "fails when inserting on an unknown schema" $
          request
            methodPost
            "/children"
            [("Content-Profile", "unknown")]
            [json|{"name": "child 4", "parent_id": 4}|]
            `shouldRespondWith` [json|{"message":"Invalid schema: unknown","code":"PGRST106","details":null,"hint":"Only the following schemas are exposed: v1, v2, SPECIAL \"@/\\#~_-"}|]
              { matchStatus = 406
              }

        it "succeeds in calling handler with a domain on another schema" $
          request methodGet "/another_table" [("Accept-Profile", "v2"), (hAccept, "text/plain")] ""
            `shouldRespondWith` "plain"
              { matchStatus = 200
              , matchHeaders = ["Content-Type" <:> "text/plain; charset=utf-8", "Content-Profile" <:> "v2"]
              }

        it "succeeds in calling handler with a domain on an exposed schema" $
          request methodGet "/another_table" [("Accept-Profile", "v2"), (hAccept, "text/special")] ""
            `shouldRespondWith` "special"
              { matchStatus = 200
              , matchHeaders = ["Content-Type" <:> "text/special", "Content-Profile" <:> "v2"]
              }

      context "calling procs on different schemas" $ do
        it "succeeds in calling the default schema proc" $
          request methodGet "/rpc/get_parents_below?id=6" [] ""
            `shouldRespondWith` [json|[{"id":1,"name":"parent v1-1"}, {"id":2,"name":"parent v1-2"}]|]
              { matchStatus = 200
              , matchHeaders = [matchContentTypeJson, "Content-Profile" <:> "v1"]
              }

        it "succeeds in calling the v1 schema proc and embedding" $
          request methodGet "/rpc/get_parents_below?id=6&select=id,name,children(id,name)" [("Accept-Profile", "v1")] ""
            `shouldRespondWith` [json| [
            {"id":1,"name":"parent v1-1","children":[{"id":1,"name":"child v1-1"}]},
            {"id":2,"name":"parent v1-2","children":[{"id":2,"name":"child v1-2"}]}] |]
              { matchStatus = 200
              , matchHeaders = [matchContentTypeJson, "Content-Profile" <:> "v1"]
              }

        it "succeeds in calling the v2 schema proc and embedding" $
          request methodGet "/rpc/get_parents_below?id=6&select=id,name,children(id,name)" [("Accept-Profile", "v2")] ""
            `shouldRespondWith` [json| [
            {"id":3,"name":"parent v2-3","children":[{"id":1,"name":"child v2-3"}]},
            {"id":4,"name":"parent v2-4","children":[]}] |]
              { matchStatus = 200
              , matchHeaders = [matchContentTypeJson, "Content-Profile" <:> "v2"]
              }

        it "succeeds in calling the v2 schema proc with POST by using Content-Profile" $
          request
            methodPost
            "/rpc/get_parents_below?select=id,name"
            [("Content-Profile", "v2")]
            [json|{"id": "6"}|]
            `shouldRespondWith` [json| [
            {"id":3,"name":"parent v2-3"},
            {"id":4,"name":"parent v2-4"}]|]
              { matchStatus = 200
              , matchHeaders = [matchContentTypeJson, "Content-Profile" <:> "v2"]
              }

        it "succeeds in calling handler with a domain on another schema" $
          request methodGet "/rpc/get_plain_text" [("Accept-Profile", "v2"), (hAccept, "text/plain")] ""
            `shouldRespondWith` "plain"
              { matchStatus = 200
              , matchHeaders = ["Content-Type" <:> "text/plain; charset=utf-8", "Content-Profile" <:> "v2"]
              }

        it "succeeds in calling handler with a domain on an exposed schema" $
          request methodGet "/rpc/get_special_text" [("Accept-Profile", "v2"), (hAccept, "text/special")] ""
            `shouldRespondWith` "special"
              { matchStatus = 200
              , matchHeaders = ["Content-Type" <:> "text/special", "Content-Profile" <:> "v2"]
              }

      context "Modifying tables on different schemas" $ do
        it "succeeds in patching on the v1 schema and returning its parent" $
          request
            methodPatch
            "/children?select=name,parent(name)&id=eq.1"
            [("Content-Profile", "v1"), ("Prefer", "return=representation")]
            [json|{"name": "child v1-1 updated"}|]
            `shouldRespondWith` [json|[{"name":"child v1-1 updated", "parent": {"name": "parent v1-1"}}]|]
              { matchStatus = 200
              , matchHeaders = [matchContentTypeJson, "Content-Profile" <:> "v1"]
              }

        it "succeeds in patching on the v2 schema and returning its parent" $
          request
            methodPatch
            "/children?select=name,parent(name)&id=eq.1"
            [("Content-Profile", "v2"), ("Prefer", "return=representation")]
            [json|{"name": "child v2-1 updated"}|]
            `shouldRespondWith` [json|[{"name":"child v2-1 updated", "parent": {"name": "parent v2-3"}}]|]
              { matchStatus = 200
              , matchHeaders = [matchContentTypeJson, "Content-Profile" <:> "v2"]
              }

        it "succeeds on deleting on the v2 schema" $ do
          request
            methodDelete
            "/children?id=eq.1"
            [("Content-Profile", "v2"), ("Prefer", "return=representation")]
            ""
            `shouldRespondWith` [json|[{"id": 1, "name": "child v2-3", "parent_id": 3}]|]
              { matchHeaders = ["Content-Profile" <:> "v2"]
              }

        it "succeeds on PUT on the v2 schema" $
          request
            methodPut
            "/children?id=eq.111"
            [("Content-Profile", "v2"), ("Prefer", "return=representation")]
            [json|[{"id": 111, "name": "child v2-111", "parent_id": null}]|]
            `shouldRespondWith` [json|[{"id": 111, "name": "child v2-111", "parent_id": null}]|]
              { matchStatus = 201
              , matchHeaders = [matchContentTypeJson, "Content-Profile" <:> "v2"]
              }

      context "OpenAPI output" $ do
        it "succeeds in reading table definition from default schema v1 if no schema is selected via header" $ do
          req <- request methodGet "/" [] ""

          liftIO $ do
            simpleHeaders req `shouldSatisfy` matchHeader "Content-Profile" "v1"

            let def = simpleBody req ^? key "definitions" . key "parents"

            def
              `shouldBe` Just
                [aesonQQ|
                  {
                    "type" : "object",
                    "properties" : {
                      "id" : {
                        "description" : "Note:\nThis is a Primary Key.<pk/>",
                        "format" : "int32",
                        "type" : "integer"
                      },
                      "name" : {
                        "format" : "text",
                        "type" : "string"
                      }
                    },
                    "required" : [
                      "id"
                    ]
                  }
                |]

        it "succeeds in reading table definition from default schema v1 after explicitly passing it in the header" $ do
          r <- request methodGet "/" [("Accept-Profile", "v1")] ""

          liftIO $ do
            simpleHeaders r `shouldSatisfy` matchHeader "Content-Profile" "v1"

            let def = simpleBody r ^? key "definitions" . key "parents"

            def
              `shouldBe` Just
                [aesonQQ|
                  {
                    "type" : "object",
                    "properties" : {
                      "id" : {
                        "description" : "Note:\nThis is a Primary Key.<pk/>",
                        "format" : "int32",
                        "type" : "integer"
                      },
                      "name" : {
                        "format" : "text",
                        "type" : "string"
                      }
                    },
                    "required" : [
                      "id"
                    ]
                  }
                |]

        it "succeeds in reading table definition from schema v2" $ do
          r <- request methodGet "/" [("Accept-Profile", "v2")] ""

          liftIO $ do
            simpleHeaders r `shouldSatisfy` matchHeader "Content-Profile" "v2"

            let def = simpleBody r ^? key "definitions" . key "parents"

            def
              `shouldBe` Just
                [aesonQQ|
                  {
                    "type" : "object",
                    "properties" : {
                      "id" : {
                        "description" : "Note:\nThis is a Primary Key.<pk/>",
                        "format" : "int32",
                        "type" : "integer"
                      },
                      "name" : {
                        "format" : "text",
                        "type" : "string"
                      }
                    },
                    "required" : [
                      "id"
                    ]
                  }
                |]

        it "succeeds in reading another_table definition from schema v2" $ do
          r <- request methodGet "/" [("Accept-Profile", "v2")] ""

          liftIO $ do
            simpleHeaders r `shouldSatisfy` matchHeader "Content-Profile" "v2"

            let def = simpleBody r ^? key "definitions" . key "another_table"

            def
              `shouldBe` Just
                [aesonQQ|
                  {
                    "type" : "object",
                    "properties" : {
                      "id" : {
                        "description" : "Note:\nThis is a Primary Key.<pk/>",
                        "format" : "int32",
                        "type" : "integer"
                      },
                      "another_value" : {
                        "format" : "text",
                        "type" : "string"
                      }
                    },
                    "required" : [
                      "id"
                    ]
                  }
                |]

        it "doesn't find another_table definition in schema v1" $ do
          r <- request methodGet "/" [("Accept-Profile", "v1")] ""

          liftIO $ do
            let def = simpleBody r ^? key "definitions" . key "another_table"
            def `shouldBe` Nothing

        it "fails trying to read definitions from unknown schema" $
          request methodGet "/" [("Accept-Profile", "unknown")] ""
            `shouldRespondWith` [json|{"message":"Invalid schema: unknown","code":"PGRST106","details":null,"hint":"Only the following schemas are exposed: v1, v2, SPECIAL \"@/\\#~_-"}|]
              { matchStatus = 406
              }
