module Feature.OpenApi.OpenApiSpec where

import Control.Lens ((^?))
import Data.Aeson.Lens
import Data.Aeson.QQ
import Data.Aeson.Types (Value (..))
import Network.HTTP.Types
import Network.Wai.Test (SResponse (..))
import Protolude hiding (get)
import Test.Hspec hiding (pendingWith)
import Test.Hspec.Wai

import PostgREST.Version (docsVersion)
import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig baseCfg $ describe "OpenAPI" $ do
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

  it "should respond to openapi request on none root path with 406" $
    request
      methodGet
      "/items"
      (acceptHdrs "application/openapi+json")
      ""
      `shouldRespondWith` 406

  it "should respond to openapi request with unsupported media type with 406" $
    request
      methodGet
      "/"
      (acceptHdrs "text/csv")
      ""
      `shouldRespondWith` 406

  it "includes postgrest.org current version api docs" $ do
    r <- get "/"

    let
      headers = simpleHeaders r
      docsUrl = simpleBody r ^? key "externalDocs" . key "url"

    liftIO $ do
      headers `shouldSatisfy` notZeroContentLength
      docsUrl `shouldBe` Just (String ("https://postgrest.org/en/" <> docsVersion <> "/references/api.html"))

  describe "schema" $ do
    it "includes title and comments to schema" $ do
      r <- simpleBody <$> get "/"

      let childGetTitle = r ^? key "info" . key "title"
      let childGetDescription = r ^? key "info" . key "description"

      liftIO $ do
        childGetTitle `shouldBe` Just "My API title"

        childGetDescription `shouldBe` Just "My API description\nthat spans\nmultiple lines"

  describe "table" $ do
    it "includes paths to tables" $ do
      r <- simpleBody <$> get "/"

      let
        method s = key "paths" . key "/child_entities" . key s
        childGetSummary = r ^? method "get" . key "summary"
        childGetDescription = r ^? method "get" . key "description"
        getParameters = r ^? method "get" . key "parameters"
        postParameters = r ^? method "post" . key "parameters"
        postResponse = r ^? method "post" . key "responses" . key "201" . key "description"
        patchResponse = r ^? method "patch" . key "responses" . key "204" . key "description"
        deleteResponse = r ^? method "delete" . key "responses" . key "204" . key "description"

      let
        grandChildGet s = key "paths" . key "/grandchild_entities" . key "get" . key s
        grandChildGetSummary = r ^? grandChildGet "summary"
        grandChildGetDescription = r ^? grandChildGet "description"

      liftIO $ do
        childGetSummary `shouldBe` Just "child_entities comment"

        childGetDescription `shouldBe` Nothing

        grandChildGetSummary `shouldBe` Just "grandchild_entities summary"

        grandChildGetDescription `shouldBe` Just "grandchild_entities description\nthat spans\nmultiple lines"

        getParameters
          `shouldBe` Just
            [aesonQQ|
            [
              { "$ref": "#/parameters/rowFilter.child_entities.id" },
              { "$ref": "#/parameters/rowFilter.child_entities.name" },
              { "$ref": "#/parameters/rowFilter.child_entities.parent_id" },
              { "$ref": "#/parameters/select" },
              { "$ref": "#/parameters/order" },
              { "$ref": "#/parameters/range" },
              { "$ref": "#/parameters/rangeUnit" },
              { "$ref": "#/parameters/offset" },
              { "$ref": "#/parameters/limit" },
              { "$ref": "#/parameters/preferCount" }
            ]
          |]

        postParameters
          `shouldBe` Just
            [aesonQQ|
            [
              { "$ref": "#/parameters/body.child_entities" },
              { "$ref": "#/parameters/select" },
              { "$ref": "#/parameters/preferPost" }
            ]
          |]

        postResponse `shouldBe` Just "Created"

        patchResponse `shouldBe` Just "No Content"

        deleteResponse `shouldBe` Just "No Content"

    it "includes an array type for GET responses" $ do
      r <- simpleBody <$> get "/"

      let childGetSchema =
            r
              ^? key "paths"
                . key "/child_entities"
                . key "get"
                . key "responses"
                . key "200"
                . key "schema"

      liftIO $
        childGetSchema
          `shouldBe` Just
            [aesonQQ|
            {
              "items": {
                "$ref": "#/definitions/child_entities"
              },
              "type": "array"
            }
          |]

    it "includes definitions to tables" $ do
      r <- simpleBody <$> get "/"

      let def = r ^? key "definitions" . key "child_entities"

      liftIO $
        def
          `shouldBe` Just
            [aesonQQ|
            {
              "type": "object",
              "description": "child_entities comment",
              "properties": {
                "id": {
                  "description": "child_entities id comment\n\nNote:\nThis is a Primary Key.<pk/>",
                  "format": "int32",
                  "type": "integer"
                },
                "name": {
                  "description": "child_entities name comment. Can be longer than sixty-three characters long",
                  "format": "text",
                  "type": "string"
                },
                "parent_id": {
                  "description": "Note:\nThis is a Foreign Key to `entities.id`.<fk table='entities' column='id'/>",
                  "format": "int32",
                  "type": "integer"
                }
              },
              "required": [
                "id"
              ]
            }
          |]

    it "includes definitions to views" $ do
      r <- simpleBody <$> get "/"

      let def = r ^? key "definitions" . key "child_entities_view"

      liftIO $
        def
          `shouldBe` Just
            [aesonQQ|
            {
              "type": "object",
              "description": "child_entities_view comment",
              "properties": {
                "id": {
                  "description": "child_entities_view id comment\n\nNote:\nThis is a Primary Key.<pk/>",
                  "format": "int32",
                  "type": "integer"
                },
                "name": {
                  "description": "child_entities_view name comment. Can be longer than sixty-three characters long",
                  "format": "text",
                  "type": "string"
                },
                "parent_id": {
                  "description": "Note:\nThis is a Foreign Key to `entities.id`.<fk table='entities' column='id'/>",
                  "format": "int32",
                  "type": "integer"
                }
              }
            }
          |]

    it "doesn't include privileged table for anonymous" $ do
      r <- simpleBody <$> get "/"
      let tablePath = r ^? key "paths" . key "/authors_only"

      liftIO $ tablePath `shouldBe` Nothing

    it "includes table if user has permission" $ do
      let auth = authHeaderJWT "TEST_JWT_REDACTED"
      r <- simpleBody <$> request methodGet "/" [auth] ""
      let tableTag =
            r
              ^? key "paths"
                . key "/authors_only"
                . key "post"
                . key "tags"
                . nth 0
      liftIO $ tableTag `shouldBe` Just [aesonQQ|"authors_only"|]

    it "includes a fk description for a O2O relationship" $ do
      r <- simpleBody <$> get "/"

      let referralLink = r ^? key "definitions" . key "first" . key "properties" . key "second_id_1"

      liftIO $
        referralLink
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "int32",
              "type": "integer",
              "description": "Note:\nThis is a Foreign Key to `second.id`.<fk table='second' column='id'/>"
            }
          |]

  describe "Foreign table" $
    it "includes foreign table properties" $ do
      r <- simpleBody <$> get "/"

      let
        method s = key "paths" . key "/projects_dump" . key s
        getSummary = r ^? method "get" . key "summary"
        getDescription = r ^? method "get" . key "description"
        getParameters = r ^? method "get" . key "parameters"

      liftIO $ do
        getSummary `shouldBe` Just "A temporary projects dump"

        getDescription `shouldBe` Just "Just a test for foreign tables"

        getParameters
          `shouldBe` Just
            [aesonQQ|
            [
              { "$ref": "#/parameters/rowFilter.projects_dump.id" },
              { "$ref": "#/parameters/rowFilter.projects_dump.name" },
              { "$ref": "#/parameters/rowFilter.projects_dump.client_id" },
              { "$ref": "#/parameters/select" },
              { "$ref": "#/parameters/order" },
              { "$ref": "#/parameters/range" },
              { "$ref": "#/parameters/rangeUnit" },
              { "$ref": "#/parameters/offset" },
              { "$ref": "#/parameters/limit" },
              { "$ref": "#/parameters/preferCount" }
            ]
          |]

  describe "Partitioned table" $
    it "includes partitioned table properties" $ do
      r <- simpleBody <$> get "/"

      let
        method s = key "paths" . key "/car_models" . key s
        getSummary = r ^? method "get" . key "summary"
        getDescription = r ^? method "get" . key "description"
        getParameterName = r ^? method "get" . key "parameters" . nth 0 . key "$ref"
        getParameterYear = r ^? method "get" . key "parameters" . nth 1 . key "$ref"
        getParameterRef = r ^? method "get" . key "parameters" . nth 2 . key "$ref"

      liftIO $ do
        getSummary `shouldBe` Just "A partitioned table"

        getDescription `shouldBe` Just "A test for partitioned tables"

        getParameterName `shouldBe` Just "#/parameters/rowFilter.car_models.name"

        getParameterYear `shouldBe` Just "#/parameters/rowFilter.car_models.year"

        getParameterRef `shouldBe` Just "#/parameters/rowFilter.car_models.car_brand_name"

  describe "Materialized view" $
    it "includes materialized view properties" $ do
      r <- simpleBody <$> get "/"

      let
        method s = key "paths" . key "/materialized_projects" . key s
        summary = r ^? method "get" . key "summary"
        description = r ^? method "get" . key "description"
        parameters = r ^? method "get" . key "parameters"

      liftIO $ do
        summary `shouldBe` Just "A materialized view for projects"

        description `shouldBe` Just "Just a test for materialized views"

        parameters
          `shouldBe` Just
            [aesonQQ|
            [
              { "$ref": "#/parameters/rowFilter.materialized_projects.id" },
              { "$ref": "#/parameters/rowFilter.materialized_projects.name" },
              { "$ref": "#/parameters/rowFilter.materialized_projects.client_id" },
              { "$ref": "#/parameters/select" },
              { "$ref": "#/parameters/order" },
              { "$ref": "#/parameters/range" },
              { "$ref": "#/parameters/rangeUnit" },
              { "$ref": "#/parameters/offset" },
              { "$ref": "#/parameters/limit" },
              { "$ref": "#/parameters/preferCount" }
            ]
          |]

  describe "VIEW that has a source FK based on a UNIQUE key" $
    it "includes fk description" $ do
      r <- simpleBody <$> get "/"

      let referralLink = r ^? key "definitions" . key "referrals" . key "properties" . key "link"

      liftIO $
        referralLink
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "int32",
              "type": "integer",
              "description": "Note:\nThis is a Foreign Key to `pages.link`.<fk table='pages' column='link'/>"
            }
          |]

  describe "VIEW created for a TABLE with a O2M relationship" $ do
    it "fk points to destination TABLE instead of the VIEW" $ do
      r <- simpleBody <$> get "/"

      let referralLink = r ^? key "definitions" . key "projects" . key "properties" . key "client_id"

      liftIO $
        referralLink
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "int32",
              "type": "integer",
              "description": "Note:\nThis is a Foreign Key to `clients.id`.<fk table='clients' column='id'/>"
            }
          |]

  describe "PostgreSQL to Swagger Type Mapping" $ do
    it "character varying to string" $ do
      r <- simpleBody <$> get "/"

      let types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_character_varying"

      liftIO $
        types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "character varying",
              "type": "string"
            }
          |]
    it "character(1) to string" $ do
      r <- simpleBody <$> get "/"

      let types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_character"

      liftIO $
        types
          `shouldBe` Just
            [aesonQQ|
            {
              "maxLength": 1,
              "format": "character",
              "type": "string"
            }
          |]

    it "text to string" $ do
      r <- simpleBody <$> get "/"

      let types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_text"

      liftIO $
        types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "text",
              "type": "string"
            }
          |]

    it "boolean to boolean" $ do
      r <- simpleBody <$> get "/"

      let types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_boolean"

      liftIO $
        types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "boolean",
              "type": "boolean"
            }
          |]

    it "smallint to integer" $ do
      r <- simpleBody <$> get "/"

      let types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_smallint"

      liftIO $
        types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "int32",
              "type": "integer"
            }
          |]

    it "integer to integer" $ do
      r <- simpleBody <$> get "/"

      let types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_integer"

      liftIO $
        types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "int32",
              "type": "integer"
            }
          |]

    it "bigint to integer" $ do
      r <- simpleBody <$> get "/"

      let types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_bigint"

      liftIO $
        types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "int64",
              "type": "integer"
            }
          |]

    it "numeric to number" $ do
      r <- simpleBody <$> get "/"

      let types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_numeric"

      liftIO $
        types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "numeric",
              "type": "number"
            }
          |]

    it "real to number" $ do
      r <- simpleBody <$> get "/"

      let types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_real"

      liftIO $
        types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "real",
              "type": "number"
            }
          |]

    it "double_precision to number" $ do
      r <- simpleBody <$> get "/"

      let types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_double_precision"

      liftIO $
        types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "double precision",
              "type": "number"
            }
          |]

    it "json to any" $ do
      r <- simpleBody <$> get "/"

      let types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_json"

      liftIO $
        types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "json"
            }
          |]

    it "jsonb to any" $ do
      r <- simpleBody <$> get "/"

      let types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_jsonb"

      liftIO $
        types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "jsonb"
            }
          |]

    it "array types to array" $ do
      r <- simpleBody <$> get "/"

      let text_arr_types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_text_arr"
      let int_arr_types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_int_arr"
      let bool_arr_types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_bool_arr"
      let char_arr_types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_char_arr"
      let varchar_arr_types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_varchar_arr"
      let bigint_arr_types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_bigint_arr"
      let numeric_arr_types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_numeric_arr"
      let json_arr_types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_json_arr"
      let jsonb_arr_types = r ^? key "definitions" . key "openapi_types" . key "properties" . key "a_jsonb_arr"

      liftIO $ do
        text_arr_types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "text[]",
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          |]

        int_arr_types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "integer[]",
              "type": "array",
              "items": {
                "type": "integer"
              }
            }
          |]

        bool_arr_types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "boolean[]",
              "type": "array",
              "items": {
                "type": "boolean"
              }
            }
          |]

        char_arr_types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "character[]",
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          |]

        varchar_arr_types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "character varying[]",
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          |]

        bigint_arr_types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "bigint[]",
              "type": "array",
              "items": {
                "type": "integer"
              }
            }
          |]

        numeric_arr_types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "numeric[]",
              "type": "array",
              "items": {
                "type": "number"
              }
            }
          |]

        json_arr_types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "json[]",
              "type": "array",
              "items": {}
            }
          |]

        jsonb_arr_types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "jsonb[]",
              "type": "array",
              "items": {}
            }
          |]

  describe "Detects default values" $ do
    it "text" $ do
      r <- simpleBody <$> get "/"

      let defaultValue = r ^? key "definitions" . key "openapi_defaults" . key "properties" . key "text" . key "default"

      liftIO $
        defaultValue `shouldBe` Just "default"

    it "boolean" $ do
      r <- simpleBody <$> get "/"

      let types = r ^? key "definitions" . key "openapi_defaults" . key "properties" . key "boolean" . key "default"

      liftIO $
        types `shouldBe` Just (Bool False)

    it "integer" $ do
      r <- simpleBody <$> get "/"

      let types = r ^? key "definitions" . key "openapi_defaults" . key "properties" . key "integer" . key "default"

      liftIO $
        types `shouldBe` Just (Number 42)

    it "numeric" $ do
      r <- simpleBody <$> get "/"

      let types = r ^? key "definitions" . key "openapi_defaults" . key "properties" . key "numeric" . key "default"

      liftIO $
        types `shouldBe` Just (Number 42.2)

    it "date" $ do
      r <- simpleBody <$> get "/"

      let types = r ^? key "definitions" . key "openapi_defaults" . key "properties" . key "date" . key "default"

      liftIO $
        types `shouldBe` Just "1900-01-01"

    it "time" $ do
      r <- simpleBody <$> get "/"

      let types = r ^? key "definitions" . key "openapi_defaults" . key "properties" . key "time" . key "default"

      liftIO $
        types `shouldBe` Just "13:00:00"

    it "enum" $ do
      r <- simpleBody <$> get "/"

      let types = r ^? key "definitions" . key "menagerie" . key "properties" . key "enum"

      liftIO $
        types
          `shouldBe` Just
            [aesonQQ|
            {
              "format": "test.enum_menagerie_type",
              "type": "string",
              "enum": [
                "foo",
                "bar"
              ]
            }
          |]

  describe "RPC" $ do
    it "includes function summary/description and query parameters for arguments in the get path item" $ do
      r <- simpleBody <$> get "/"

      let
        method s = key "paths" . key "/rpc/varied_arguments_openapi" . key s
        args = r ^? method "get" . key "parameters"
        summary = r ^? method "get" . key "summary"
        description = r ^? method "get" . key "description"

      liftIO $ do
        summary `shouldBe` Just "An RPC function"

        description `shouldBe` Just "Just a test for RPC function arguments"

        args
          `shouldBe` Just
            [aesonQQ|
            [
              {
                "format": "double precision",
                "in": "query",
                "name": "double",
                "required": true,
                "type": "number"
              },
              {
                "format": "character varying",
                "in": "query",
                "name": "varchar",
                "required": true,
                "type": "string"
              },
              {
                "format": "boolean",
                "in": "query",
                "name": "boolean",
                "required": true,
                "type": "boolean"
              },
              {
                "format": "date",
                "in": "query",
                "name": "date",
                "required": true,
                "type": "string"
              },
              {
                "format": "money",
                "in": "query",
                "name": "money",
                "required": true,
                "type": "string"
              },
              {
                "format": "enum_menagerie_type",
                "in": "query",
                "name": "enum",
                "required": true,
                "type": "string"
              },
              {
                "format": "text[]",
                "in": "query",
                "name": "text_arr",
                "required": true,
                "type": "string"
              },
              {
                "format": "integer[]",
                "in": "query",
                "name": "int_arr",
                "required": true,
                "type": "string"
              },
              {
                "format": "boolean[]",
                "in": "query",
                "name": "bool_arr",
                "required": true,
                "type": "string"
              },
              {
                "format": "character[]",
                "in": "query",
                "name": "char_arr",
                "required": true,
                "type": "string"
              },
              {
                "format": "character varying[]",
                "in": "query",
                "name": "varchar_arr",
                "required": true,
                "type": "string"
              },
              {
                "format": "bigint[]",
                "in": "query",
                "name": "bigint_arr",
                "required": true,
                "type": "string"
              },
              {
                "format": "numeric[]",
                "in": "query",
                "name": "numeric_arr",
                "required": true,
                "type": "string"
              },
              {
                "format": "json[]",
                "in": "query",
                "name": "json_arr",
                "required": true,
                "type": "string"
              },
              {
                "format": "jsonb[]",
                "in": "query",
                "name": "jsonb_arr",
                "required": true,
                "type": "string"
              },
              {
                "format": "int32",
                "in": "query",
                "name": "integer",
                "required": false,
                "type": "integer"
              },
              {
                "format": "json",
                "in": "query",
                "name": "json",
                "required": false,
                "type": "string"
              },
              {
                "format": "jsonb",
                "in": "query",
                "name": "jsonb",
                "required": false,
                "type": "string"
              }
            ]
          |]

    it "includes function summary/description and body schema for arguments in the post path item" $ do
      r <- simpleBody <$> get "/"

      let
        method s = key "paths" . key "/rpc/varied_arguments_openapi" . key s
        args = r ^? method "post" . key "parameters" . nth 0 . key "schema"
        summary = r ^? method "post" . key "summary"
        description = r ^? method "post" . key "description"

      liftIO $ do
        summary `shouldBe` Just "An RPC function"

        description `shouldBe` Just "Just a test for RPC function arguments"

        args
          `shouldBe` Just
            [aesonQQ|
            {
              "required": [
                "double",
                "varchar",
                "boolean",
                "date",
                "money",
                "enum",
                "text_arr",
                "int_arr",
                "bool_arr",
                "char_arr",
                "varchar_arr",
                "bigint_arr",
                "numeric_arr",
                "json_arr",
                "jsonb_arr"
              ],
              "properties": {
                "double": {
                  "format": "double precision",
                  "type": "number"
                },
                "varchar": {
                  "format": "character varying",
                  "type": "string"
                },
                "boolean": {
                  "format": "boolean",
                  "type": "boolean"
                },
                "date": {
                  "format": "date",
                  "type": "string"
                },
                "money": {
                  "format": "money",
                  "type": "string"
                },
                "enum": {
                  "format": "enum_menagerie_type",
                  "type": "string"
                },
                "text_arr": {
                  "format": "text[]",
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "int_arr": {
                  "format": "integer[]",
                  "type": "array",
                  "items": {
                    "type": "integer"
                  }
                },
                "bool_arr": {
                  "format": "boolean[]",
                  "type": "array",
                  "items": {
                    "type": "boolean"
                  }
                },
                "char_arr": {
                  "format": "character[]",
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "varchar_arr": {
                  "format": "character varying[]",
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "bigint_arr": {
                  "format": "bigint[]",
                  "type": "array",
                  "items": {
                    "type": "integer"
                  }
                },
                "numeric_arr": {
                  "format": "numeric[]",
                  "type": "array",
                  "items": {
                    "type": "number"
                  }
                },
                "json_arr": {
                  "format": "json[]",
                  "type": "array",
                  "items": {}
                },
                "jsonb_arr": {
                  "format": "jsonb[]",
                  "type": "array",
                  "items": {}
                },
                "integer": {
                  "format": "int32",
                  "type": "integer"
                },
                "json": {
                  "format": "json"
                },
                "jsonb": {
                  "format": "jsonb"
                }
              },
              "type": "object",
              "description": "An RPC function\n\nJust a test for RPC function arguments"
            }
          |]

    it "doesn't include privileged function for anonymous" $ do
      r <- simpleBody <$> get "/"
      let funcPath = r ^? key "paths" . key "/rpc/privileged_hello"

      liftIO $ funcPath `shouldBe` Nothing

    it "includes function if user has permission" $ do
      let auth = authHeaderJWT "TEST_JWT_REDACTED"
      r <- simpleBody <$> request methodGet "/" [auth] ""
      let funcTag =
            r
              ^? key "paths"
                . key "/rpc/privileged_hello"
                . key "post"
                . key "tags"
                . nth 0

      liftIO $ funcTag `shouldBe` Just [aesonQQ|"(rpc) privileged_hello"|]

    it "doesn't include OUT params of function as required parameters" $ do
      r <- simpleBody <$> get "/"
      let params =
            r
              ^? key "paths"
                . key "/rpc/many_out_params"
                . key "post"
                . key "parameters"
                . nth 0
                . key "schema"
                . key "required"

      liftIO $ params `shouldBe` Nothing

    it "includes INOUT params(with no DEFAULT) of function as required parameters" $ do
      r <- simpleBody <$> get "/"
      let params =
            r
              ^? key "paths"
                . key "/rpc/many_inout_params"
                . key "post"
                . key "parameters"
                . nth 0
                . key "schema"
                . key "required"

      liftIO $ params `shouldBe` Just [aesonQQ|["num", "str"]|]

    it "uses a multi collection format when the function has a VARIADIC parameter" $ do
      r <- simpleBody <$> get "/"
      let param =
            r
              ^? key "paths"
                . key "/rpc/variadic_param"
                . key "get"
                . key "parameters"
                . nth 0

      liftIO $
        param
          `shouldBe` Just
            [aesonQQ|
          {
            "collectionFormat": "multi",
            "in": "query",
            "items": {
              "format": "text",
              "type": "string"
            },
            "name": "v",
            "required": false,
            "type": "array"
          }
        |]

    it "only includes POST method for volatile functions" $ do
      r <- simpleBody <$> get "/"
      let
        volatileGet = r ^? key "paths" . key "/rpc/reset_table" . key "get"
        volatilePost = r ^? key "paths" . key "/rpc/reset_table" . key "post"

      liftIO $ do
        volatileGet `shouldBe` Nothing
        volatilePost `shouldNotBe` Nothing

    it "includes GET and POST methods for stable functions" $ do
      r <- simpleBody <$> get "/"
      let
        stableGet = r ^? key "paths" . key "/rpc/getallusers" . key "get"
        stablePost = r ^? key "paths" . key "/rpc/getallusers" . key "post"

      liftIO $ do
        stableGet `shouldNotBe` Nothing
        stablePost `shouldNotBe` Nothing

    it "includes GET and POST methods for immutable functions" $ do
      r <- simpleBody <$> get "/"
      let
        immutableGet = r ^? key "paths" . key "/rpc/jwt_test" . key "get"
        immutablePost = r ^? key "paths" . key "/rpc/jwt_test" . key "post"

      liftIO $ do
        immutableGet `shouldNotBe` Nothing
        immutablePost `shouldNotBe` Nothing

    it "does not include empty enum in the preferParams parameter" $ do
      r <- simpleBody <$> get "/"
      let preferParams = r ^? key "parameters" . key "preferParams" . key "enum"

      liftIO $ do
        preferParams `shouldBe` Nothing

  describe "Security" $
    it "does not include security or security definitions by default" $ do
      r <- simpleBody <$> get "/"

      let
        sec = r ^? key "security"
        secDef = r ^? key "securityDefinitions"

      liftIO $ do
        sec `shouldBe` Nothing

        secDef `shouldBe` Nothing
