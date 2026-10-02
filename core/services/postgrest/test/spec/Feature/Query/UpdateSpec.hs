module Feature.Query.UpdateSpec where

import Network.HTTP.Types
import Protolude hiding (get)
import Test.Hspec hiding (pendingWith)
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig baseCfg $ do
  describe "Patching record" $ do
    context "to unknown uri" $
      it "indicates no table found by returning 404" $
        request
          methodPatch
          "/fake"
          []
          [json| { "real": false } |]
          `shouldRespondWith` [json| {"code":"PGRST205","details":null,"hint":null,"message":"Could not find the table 'test.fake' in the schema cache"} |]
            { matchStatus = 404
            , matchHeaders = ["Content-Length" <:> "115"]
            }

    context "on an empty table" $
      it "succeeds with status code 204" $
        request
          methodPatch
          "/empty_table"
          []
          [json| { "extra":20 } |]
          `shouldRespondWith` ""
            { matchStatus = 204
            , matchHeaders =
                [ matchHeaderAbsent hContentType
                , matchHeaderAbsent hContentLength
                ]
            }

    context "with invalid json payload" $
      it "fails with 400 and error" $
        request methodPatch "/simple_pk" [] "}{ x = 2"
          `shouldRespondWith` [json|{"message":"Empty or invalid json","code":"PGRST102","details":null,"hint":null}|]
            { matchStatus = 400
            , matchHeaders =
                [ matchContentTypeJson
                , "Content-Length" <:> "80"
                ]
            }

    context "with no payload" $
      it "fails with 400 and error" $
        request methodPatch "/items" [] ""
          `shouldRespondWith` [json|{"message":"Empty or invalid json","code":"PGRST102","details":null,"hint":null}|]
            { matchStatus = 400
            , matchHeaders = [matchContentTypeJson]
            }

    context "insignificant whitespace" $ do
      it "ignores it and successfuly updates with json payload" $ do
        request
          methodPatch
          "/items?id=eq.1"
          [("Prefer", "return=representation")]
          "\t \n \r { \"id\": 99 } \t \n \r "
          `shouldRespondWith` [json|[{"id":99}]|]
            { matchStatus = 200
            , matchHeaders = ["Content-Length" <:> "11"]
            }

    context "in a nonempty table" $ do
      it "can update a single item" $ do
        patch
          "/items?id=eq.2"
          [json| { "id":42 } |]
          `shouldRespondWith` ""
            { matchStatus = 204
            , matchHeaders =
                [ matchHeaderAbsent hContentType
                , matchHeaderAbsent hContentLength
                , "Content-Range" <:> "0-0/*"
                ]
            }

      it "returns empty array when no rows updated and return=rep" $
        request
          methodPatch
          "/items?id=eq.999999"
          [("Prefer", "return=representation")]
          [json| { "id":999999 } |]
          `shouldRespondWith` "[]"
            { matchStatus = 200
            , matchHeaders =
                [ "Preference-Applied" <:> "return=representation"
                , "Content-Length" <:> "2"
                ]
            }

      it "returns status code 200 when no rows updated" $
        request
          methodPatch
          "/items?id=eq.99999999"
          []
          [json| { "id": 42 } |]
          `shouldRespondWith` 204

      it "returns updated object as array when return=rep" $
        request
          methodPatch
          "/items?id=eq.2"
          [("Prefer", "return=representation")]
          [json| { "id":2 } |]
          `shouldRespondWith` [json|[{"id":2}]|]
            { matchStatus = 200
            , matchHeaders =
                [ "Content-Range" <:> "0-0/*"
                , "Preference-Applied" <:> "return=representation"
                ]
            }

      it "can update multiple items" $ do
        get "/no_pk?select=a&b=eq.1"
          `shouldRespondWith` [json|[]|]

        request
          methodPatch
          "/no_pk?b=eq.0"
          [("Prefer", "tx=commit")]
          [json| { b: "1" } |]
          `shouldRespondWith` ""
            { matchStatus = 204
            , matchHeaders =
                [ matchHeaderAbsent hContentType
                , matchHeaderAbsent hContentLength
                , "Content-Range" <:> "0-1/*"
                , "Preference-Applied" <:> "tx=commit"
                ]
            }

        -- check it really got updated
        get "/no_pk?select=a&b=eq.1"
          `shouldRespondWith` [json|[ { a: "1" }, { a: "2" } ]|]

        -- put value back for other tests
        request
          methodPatch
          "/no_pk?b=eq.1"
          [("Prefer", "tx=commit")]
          [json| { b: "0" } |]
          `shouldRespondWith` ""
            { matchStatus = 204
            , matchHeaders =
                [ matchHeaderAbsent hContentType
                , matchHeaderAbsent hContentLength
                ]
            }

      it "can set a column to NULL" $ do
        request
          methodPatch
          "/no_pk?a=eq.1"
          [("Prefer", "return=representation")]
          [json| { b: null } |]
          `shouldRespondWith` [json| [{ a: "1", b: null }] |]

      context "filtering by a computed column" $ do
        it "is successful" $
          request
            methodPatch
            "/items?is_first=eq.true"
            [("Prefer", "return=representation")]
            [json| { id: 100 } |]
            `shouldRespondWith` [json| [{ id: 100 }] |]
              { matchStatus = 200
              , matchHeaders =
                  [ matchContentTypeJson
                  , "Content-Range" <:> "0-0/*"
                  , "Preference-Applied" <:> "return=representation"
                  ]
              }

        it "returns empty array when no rows updated and return=rep" $
          request
            methodPatch
            "/items?always_true=eq.false"
            [("Prefer", "return=representation")]
            [json| { id: 100 } |]
            `shouldRespondWith` "[]"
              { matchStatus = 200
              , matchHeaders = ["Preference-Applied" <:> "return=representation"]
              }

      context "with representation requested" $ do
        it "can provide a representation" $ do
          _ <-
            post
              "/items"
              [json| { id: 1 } |]
          request
            methodPatch
            "/items?id=eq.1"
            [("Prefer", "return=representation")]
            [json| { id: 99 } |]
            `shouldRespondWith` [json| [{id:99}] |]
              { matchHeaders =
                  [ matchContentTypeJson
                  , "Preference-Applied" <:> "return=representation"
                  ]
              }
          -- put value back for other tests
          void $ request methodPatch "/items?id=eq.99" [] [json| { "id":1 } |]

        it "can return computed columns" $
          request
            methodPatch
            "/items?id=eq.1&select=id,always_true"
            [("Prefer", "return=representation")]
            [json| { id: 1 } |]
            `shouldRespondWith` [json| [{ id: 1, always_true: true }] |]
              { matchHeaders =
                  [ matchContentTypeJson
                  , "Preference-Applied" <:> "return=representation"
                  ]
              }

        it "can select overloaded computed columns" $ do
          request
            methodPatch
            "/items?id=eq.1&select=id,computed_overload"
            [("Prefer", "return=representation")]
            [json| { id: 1 } |]
            `shouldRespondWith` [json| [{ id: 1, computed_overload: true }] |]
              { matchHeaders =
                  [ matchContentTypeJson
                  , "Preference-Applied" <:> "return=representation"
                  ]
              }
          request
            methodPatch
            "/items2?id=eq.1&select=id,computed_overload"
            [("Prefer", "return=representation")]
            [json| { id: 1 } |]
            `shouldRespondWith` [json| [{ id: 1, computed_overload: true }] |]
              { matchHeaders =
                  [ matchContentTypeJson
                  , "Preference-Applied" <:> "return=representation"
                  ]
              }

      it "ignores ?select= when return not set or return=minimal" $ do
        request
          methodPatch
          "/items?id=eq.1&select=id"
          [("Prefer", "return=minimal")]
          [json| { id:1 } |]
          `shouldRespondWith` ""
            { matchStatus = 204
            , matchHeaders =
                [ matchHeaderAbsent hContentType
                , matchHeaderAbsent hContentLength
                , "Content-Range" <:> "0-0/*"
                , "Preference-Applied" <:> "return=minimal"
                ]
            }
        request
          methodPatch
          "/items?id=eq.1&select=id"
          [("Prefer", "return=minimal")]
          [json| { id:1 } |]
          `shouldRespondWith` ""
            { matchStatus = 204
            , matchHeaders =
                [ matchHeaderAbsent hContentType
                , matchHeaderAbsent hContentLength
                , "Content-Range" <:> "0-0/*"
                , "Preference-Applied" <:> "return=minimal"
                ]
            }

      context "when patching with an empty body" $ do
        it "makes no updates and returns 204 without return= and without ?select=" $ do
          request
            methodPatch
            "/items"
            []
            [json| {} |]
            `shouldRespondWith` ""
              { matchStatus = 204
              , matchHeaders =
                  [ matchHeaderAbsent hContentType
                  , matchHeaderAbsent hContentLength
                  , "Content-Range" <:> "*/*"
                  ]
              }

          request
            methodPatch
            "/items"
            []
            [json| [] |]
            `shouldRespondWith` ""
              { matchStatus = 204
              , matchHeaders =
                  [ matchHeaderAbsent hContentType
                  , matchHeaderAbsent hContentLength
                  , "Content-Range" <:> "*/*"
                  ]
              }

          request
            methodPatch
            "/items"
            []
            [json| [{}] |]
            `shouldRespondWith` ""
              { matchStatus = 204
              , matchHeaders =
                  [ matchHeaderAbsent hContentType
                  , matchHeaderAbsent hContentLength
                  , "Content-Range" <:> "*/*"
                  ]
              }

        it "makes no updates and returns 204 without return= and with ?select=" $ do
          request
            methodPatch
            "/items?select=id"
            []
            [json| {} |]
            `shouldRespondWith` ""
              { matchStatus = 204
              , matchHeaders =
                  [ matchHeaderAbsent hContentType
                  , matchHeaderAbsent hContentLength
                  , "Content-Range" <:> "*/*"
                  ]
              }

          request
            methodPatch
            "/items?select=id"
            []
            [json| [] |]
            `shouldRespondWith` ""
              { matchStatus = 204
              , matchHeaders =
                  [ matchHeaderAbsent hContentType
                  , matchHeaderAbsent hContentLength
                  , "Content-Range" <:> "*/*"
                  ]
              }

          request
            methodPatch
            "/items?select=id"
            []
            [json| [{}] |]
            `shouldRespondWith` ""
              { matchStatus = 204
              , matchHeaders =
                  [ matchHeaderAbsent hContentType
                  , matchHeaderAbsent hContentLength
                  , "Content-Range" <:> "*/*"
                  ]
              }

        it "makes no updates and returns 200 with return=rep and without ?select=" $
          request methodPatch "/items" [("Prefer", "return=representation")] [json| {} |]
            `shouldRespondWith` "[]"
              { matchStatus = 200
              , matchHeaders =
                  [ "Content-Range" <:> "*/*"
                  , "Preference-Applied" <:> "return=representation"
                  ]
              }

        it "makes no updates and returns 200 with return=rep and with ?select=" $
          request methodPatch "/items?select=id" [("Prefer", "return=representation")] [json| {} |]
            `shouldRespondWith` "[]"
              { matchStatus = 200
              , matchHeaders =
                  [ "Content-Range" <:> "*/*"
                  , "Preference-Applied" <:> "return=representation"
                  ]
              }

        it "makes no updates and returns 200 with return=rep and with ?select= for overloaded computed columns" $
          request methodPatch "/items?select=id,computed_overload" [("Prefer", "return=representation")] [json| {} |]
            `shouldRespondWith` "[]"
              { matchStatus = 200
              , matchHeaders =
                  [ "Content-Range" <:> "*/*"
                  , "Preference-Applied" <:> "return=representation"
                  ]
              }

    context "with unicode values" $
      it "succeeds and returns values intact" $ do
        request
          methodPatch
          "/no_pk?a=eq.1"
          [("Prefer", "return=representation")]
          [json| { "a":"圍棋", "b":"￥" } |]
          `shouldRespondWith` [json|[ { "a":"圍棋", "b":"￥" } ]|]

    context "PATCH with ?columns parameter" $ do
      it "ignores json keys not included in ?columns" $ do
        request
          methodPatch
          "/articles?id=eq.1&columns=body"
          [("Prefer", "return=representation")]
          [json| {"body": "Some real content", "smth": "here", "other": "stuff", "fake_id": 13} |]
          `shouldRespondWith` [json|[{"id": 1, "body": "Some real content", "owner": "postgrest_test_anonymous"}]|]

      it "ignores json keys and gives 200 if no record updated" $
        request
          methodPatch
          "/articles?id=eq.2001&columns=body"
          [("Prefer", "return=representation")]
          [json| {"body": "Some real content", "smth": "here", "other": "stuff", "fake_id": 13} |]
          `shouldRespondWith` 200

      it "disallows ?columns which don't exist" $ do
        request
          methodPatch
          "/articles?id=eq.1&columns=helicopter"
          [("Prefer", "return=representation")]
          [json|{"body": "yyy"}|]
          `shouldRespondWith` [json|{"code":"PGRST204","details":null,"hint":null,"message":"Could not find the 'helicopter' column of 'articles' in the schema cache"}|]
            { matchStatus = 400
            , matchHeaders = []
            }

      it "returns missing table error even if also has invalid ?columns" $ do
        request
          methodPatch
          "/garlic?columns=helicopter"
          [("Prefer", "return=representation")]
          [json|[
            {"id": 204, "body": "yyy"},
            {"id": 205, "body": "zzz"}]|]
          `shouldRespondWith` [json| {"code":"PGRST205","details":null,"hint":null,"message":"Could not find the table 'test.garlic' in the schema cache"} |]
            { matchStatus = 404
            , matchHeaders = ["Content-Length" <:> "117"]
            }

      context "apply defaults on missing values" $ do
        it "updates table using default values(field-with_sep) when json keys are undefined" $ do
          request
            methodPatch
            "/complex_items?id=eq.3&columns=name,field-with_sep"
            [("Prefer", "return=representation"), ("Prefer", "missing=default")]
            [json|{"name": "Tres"}|]
            `shouldRespondWith` [json|[
              {"id":3,"name":"Tres","settings":{"foo":{"int":1,"bar":"baz"}},"arr_data":[1,2,3],"field-with_sep":1}
            ]|]
              { matchStatus = 200
              , matchHeaders = ["Preference-Applied" <:> "missing=default, return=representation"]
              }

        it "updates table default values(field-with_sep) when json keys are undefined" $ do
          request
            methodPatch
            "/complex_items?id=eq.3&columns=name,field-with_sep"
            [("Prefer", "return=representation"), ("Prefer", "missing=default")]
            [json|{"name": "Tres"}|]
            `shouldRespondWith` [json|[
              {"id":3,"name":"Tres","settings":{"foo":{"int":1,"bar":"baz"}},"arr_data":[1,2,3],"field-with_sep":1}
            ]|]
              { matchStatus = 200
              , matchHeaders = ["Preference-Applied" <:> "missing=default, return=representation"]
              }

        it "updates view default values(field-with_sep) when json keys are undefined" $
          request
            methodPatch
            "/complex_items_view?id=eq.3&columns=arr_data,name"
            [("Prefer", "return=representation"), ("Prefer", "missing=default")]
            [json|
              {"arr_data":null}
            |]
            `shouldRespondWith` [json|[
              {"id":3,"name":"Default","settings":{"foo":{"int":1,"bar":"baz"}},"arr_data":null,"field-with_sep":3}
            ]|]
              { matchStatus = 200
              , matchHeaders = ["Preference-Applied" <:> "missing=default, return=representation"]
              }

    -- https://github.com/PostgREST/postgrest/issues/2861
    context "bit and char columns with length" $ do
      it "should update a bit column with length" $
        request
          methodPatch
          "/bitchar_with_length?select=bit,char&char=eq.aaaaa"
          [("Prefer", "return=representation")]
          [json|{"bit": "11100"}|]
          `shouldRespondWith` [json|[{ "bit": "11100", "char": "aaaaa" }]|]
            { matchStatus = 200
            , matchHeaders = ["Preference-Applied" <:> "return=representation"]
            }

      it "should update a char column with length" $
        request
          methodPatch
          "/bitchar_with_length?select=bit,char&bit=eq.00000"
          [("Prefer", "return=representation")]
          [json|{"char": "zzzyy"}|]
          `shouldRespondWith` [json|[{ "bit": "00000", "char": "zzzyy" }]|]
            { matchStatus = 200
            , matchHeaders = ["Preference-Applied" <:> "return=representation"]
            }

  context "tables with self reference foreign keys" $ do
    context "embeds children after update" $ do
      it "without filters" $
        request
          methodPatch
          "/web_content?id=eq.0&select=id,name,web_content(name)"
          [("Prefer", "return=representation")]
          [json|{"name": "tardis-patched"}|]
          `shouldRespondWith` [json|
            [ { "id": 0, "name": "tardis-patched", "web_content": [ { "name": "fezz" }, { "name": "foo" }, { "name": "bar" } ]} ]
          |]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson, "Preference-Applied" <:> "return=representation"]
            }

      it "with ordering on top-level resource" $
        request
          methodPatch
          "/no_pk?order=a.desc"
          [("Prefer", "return=representation")]
          [json|{ "b": "1" }|]
          `shouldRespondWith` [json|
            [ { "a": null, "b": "1" },
              { "a": "2", "b": "1" },
              { "a": "1", "b": "1" } ]
          |]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson, "Preference-Applied" <:> "return=representation"]
            }

      it "with filters" $
        request
          methodPatch
          "/web_content?id=eq.0&select=id,name,web_content(name)&web_content.name=like.f*"
          [("Prefer", "return=representation")]
          [json|{"name": "tardis-patched"}|]
          `shouldRespondWith` [json|
            [ { "id": 0, "name": "tardis-patched", "web_content": [ { "name": "fezz" }, { "name": "foo" } ]} ]
          |]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson, "Preference-Applied" <:> "return=representation"]
            }

    context "embeds parent, children and grandchildren after update" $ do
      it "without filters" $
        request
          methodPatch
          "/web_content?id=eq.0&select=id,name,web_content(name,web_content(name)),parent_content:p_web_id(name)"
          [("Prefer", "return=representation")]
          [json|{"name": "tardis-patched-2"}|]
          `shouldRespondWith` [json| [
            {
              "id": 0,
              "name": "tardis-patched-2",
              "parent_content": { "name": "wat" },
              "web_content": [
                  { "name": "fezz", "web_content": [ { "name": "wut" } ] },
                  { "name": "foo",  "web_content": [] },
                  { "name": "bar",  "web_content": [] }
              ]
            }
          ] |]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson, "Preference-Applied" <:> "return=representation"]
            }

      it "with filters" $
        request
          methodPatch
          "/web_content?id=eq.0&select=id,name,web_content(name,web_content(name)),parent_content:p_web_id(name)&web_content.name=like.f*&web_content.web_content.id=eq.4&parent_content.name=neq.wat"
          [("Prefer", "return=representation")]
          [json|{"name": "tardis-patched-2"}|]
          `shouldRespondWith` [json| [
            {
              "id": 0,
              "name": "tardis-patched-2",
              "parent_content": null,
              "web_content": [
                  { "name": "fezz", "web_content": [ { "name": "wut" } ] },
                  { "name": "foo",  "web_content": [] }
              ]
            }
          ] |]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson, "Preference-Applied" <:> "return=representation"]
            }

    context "embeds children after update without explicitly including the id in the ?select" $ do
      it "without filters" $
        request
          methodPatch
          "/web_content?id=eq.0&select=name,web_content(name)"
          [("Prefer", "return=representation")]
          [json|{"name": "tardis-patched"}|]
          `shouldRespondWith` [json|
            [ { "name": "tardis-patched", "web_content": [ { "name": "fezz" }, { "name": "foo" }, { "name": "bar" } ]} ]
          |]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson, "Preference-Applied" <:> "return=representation"]
            }

      it "with filters" $
        request
          methodPatch
          "/web_content?id=eq.0&select=name,web_content(name)&web_content.name=like.b*"
          [("Prefer", "return=representation")]
          [json|{"name": "tardis-patched"}|]
          `shouldRespondWith` [json|
            [ { "name": "tardis-patched", "web_content": [ { "name": "bar" } ]} ]
          |]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson, "Preference-Applied" <:> "return=representation"]
            }

  context "tables with foreign keys referencing other tables" $ do
    context "embeds an M2M relationship plus parent after update" $ do
      it "without filters" $
        request
          methodPatch
          "/users?id=eq.1&select=name,tasks(name,project:projects(name))"
          [("Prefer", "return=representation")]
          [json|{"name": "Kevin Malone"}|]
          `shouldRespondWith` [json|[
            {
              "name": "Kevin Malone",
              "tasks": [
                  { "name": "Design w7", "project": { "name": "Windows 7" } },
                  { "name": "Code w7", "project": { "name": "Windows 7" } },
                  { "name": "Design w10", "project": { "name": "Windows 10" } },
                  { "name": "Code w10", "project": { "name": "Windows 10" } }
              ]
            }
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson, "Preference-Applied" <:> "return=representation"]
            }

      it "with filters" $
        request
          methodPatch
          "/users?id=eq.1&select=name,tasks(name,project:projects(name))&tasks.name=ilike.code*&tasks.project.name=like.*10"
          [("Prefer", "return=representation")]
          [json|{"name": "Kevin Malone"}|]
          `shouldRespondWith` [json|[
            {
              "name": "Kevin Malone",
              "tasks": [
                  { "name": "Code w7", "project": null },
                  { "name": "Code w10", "project": { "name": "Windows 10" } }
              ]
            }
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson, "Preference-Applied" <:> "return=representation"]
            }

    context "embeds an O2O relationship after update" $ do
      it "without filters" $ do
        request
          methodPatch
          "/students?id=eq.1&select=name,students_info(address)"
          [("Prefer", "return=representation")]
          [json|{"name": "Johnny Doe"}|]
          `shouldRespondWith` [json|[
            {
              "name": "Johnny Doe",
              "students_info":{"address":"Street 1"}
            }
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson, "Preference-Applied" <:> "return=representation"]
            }
        request
          methodPatch
          "/students_info?id=eq.1&select=address,students(name)"
          [("Prefer", "return=representation")]
          [json|{"address": "New Street 1"}|]
          `shouldRespondWith` [json|[
            {
              "address": "New Street 1",
              "students":{"name": "John Doe"}
            }
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson, "Preference-Applied" <:> "return=representation"]
            }

      it "with filters" $ do
        request
          methodPatch
          "/students?id=eq.1&select=name,students_info(address)&students_info.code=like.0002"
          [("Prefer", "return=representation")]
          [json|{"name": "Johnny Doe"}|]
          `shouldRespondWith` [json|[
            {
              "name": "Johnny Doe",
              "students_info": null
            }
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson, "Preference-Applied" <:> "return=representation"]
            }

  context "table with limited privileges" $ do
    it "succeeds updating row and gives a 204 when using return=minimal" $
      request
        methodPatch
        "/app_users?id=eq.1"
        [("Prefer", "return=minimal")]
        [json| { "password": "passxyz" } |]
        `shouldRespondWith` ""
          { matchStatus = 204
          , matchHeaders =
              [ matchHeaderAbsent hContentType
              , matchHeaderAbsent hContentLength
              , "Preference-Applied" <:> "return=minimal"
              ]
          }

    it "can update without return=minimal and no explicit select" $
      request
        methodPatch
        "/app_users?id=eq.1"
        []
        [json| { "password": "passabc" } |]
        `shouldRespondWith` ""
          { matchStatus = 204
          , matchHeaders =
              [ matchHeaderAbsent hContentType
              , matchHeaderAbsent hContentLength
              ]
          }

  -- Data representations for payload parsing requires Postgres 10 or above.
  describe "Data representations" $ do
    context "for a single row" $ do
      it "parses values in payload" $
        request
          methodPatch
          "/datarep_todos_computed?id=eq.2"
          [("Prefer", "return=headers-only")]
          [json| {"label_color": "#221100", "due_at": "2019-01-03T11:00:00Z"} |]
          `shouldRespondWith` ""
            { matchStatus = 204
            , matchHeaders =
                [ matchHeaderAbsent hContentType
                , matchHeaderAbsent hContentLength
                , "Content-Range" <:> "0-0/*"
                ]
            }

      it "parses values in payload and formats individually selected values in return=representation" $
        request
          methodPatch
          "/datarep_todos_computed?id=eq.2&select=id,label_color"
          [("Prefer", "return=representation")]
          [json| {"label_color": "#221100", "due_at": "2019-01-03T11:00:00Z"} |]
          `shouldRespondWith` [json| [{"id":2, "label_color": "#221100"}] |]
            { matchStatus = 200
            , matchHeaders =
                [ "Content-Type" <:> "application/json; charset=utf-8"
                , "Content-Range" <:> "0-0/*"
                , "Preference-Applied" <:> "return=representation"
                ]
            }

      it "parses values in payload and formats values in return=representation" $
        request
          methodPatch
          "/datarep_todos_computed?id=eq.2"
          [("Prefer", "return=representation")]
          [json| {"label_color": "#221100", "due_at": "2019-01-03T11:00:20Z"} |]
          `shouldRespondWith` [json| [{"id":2, "name": "Essay", "label_color": "#221100", "dark_color":"#110880", "due_at":"2019-01-03T11:00:20Z"}] |]
            { matchStatus = 200
            , matchHeaders =
                [ "Content-Type" <:> "application/json; charset=utf-8"
                , "Content-Range" <:> "0-0/*"
                , "Preference-Applied" <:> "return=representation"
                ]
            }
    context "for multiple rows" $ do
      it "parses values in payload and formats individually selected values in return=representation" $
        request
          methodPatch
          "/datarep_todos_computed?id=lt.4&select=id,name,label_color,dark_color"
          [("Prefer", "return=representation")]
          [json| {"label_color": "#221100", "due_at": "2019-01-03T11:00:00Z"} |]
          `shouldRespondWith` [json| [
            {"id":1, "name": "Report", "label_color": "#221100", "dark_color":"#110880"},
            {"id":2, "name": "Essay", "label_color": "#221100", "dark_color":"#110880"},
            {"id":3, "name": "Algebra", "label_color": "#221100", "dark_color":"#110880"}
          ] |]
            { matchStatus = 200
            , matchHeaders =
                [ "Content-Type" <:> "application/json; charset=utf-8"
                , "Content-Range" <:> "0-2/*"
                , "Preference-Applied" <:> "return=representation"
                ]
            }

      it "parses values in payload and formats values in return=representation" $
        request
          methodPatch
          "/datarep_todos_computed?id=lt.4"
          [("Prefer", "return=representation")]
          [json| {"label_color": "#221100", "due_at": "2019-01-03T11:00:00Z"} |]
          `shouldRespondWith` [json| [
            {"id":1, "name": "Report", "label_color": "#221100", "dark_color":"#110880", "due_at":"2019-01-03T11:00:00Z"},
            {"id":2, "name": "Essay", "label_color": "#221100", "dark_color":"#110880", "due_at":"2019-01-03T11:00:00Z"},
            {"id":3, "name": "Algebra", "label_color": "#221100", "dark_color":"#110880", "due_at":"2019-01-03T11:00:00Z"}
          ] |]
            { matchStatus = 200
            , matchHeaders =
                [ "Content-Type" <:> "application/json; charset=utf-8"
                , "Content-Range" <:> "0-2/*"
                , "Preference-Applied" <:> "return=representation"
                ]
            }
    context "with ?columns parameter" $ do
      it "ignores json keys not included in ?columns; parses only the ones specified" $
        request
          methodPatch
          "/datarep_todos_computed?id=eq.2&columns=due_at"
          [("Prefer", "return=representation")]
          [json| {"due_at": "2019-01-03T11:00:00Z", "smth": "here", "label_color": "invalid", "fake_id": 13} |]
          `shouldRespondWith` [json| [
            {"id":2, "name": "Essay", "label_color": "#000100", "dark_color": "#000080", "due_at":"2019-01-03T11:00:00Z"}
          ] |]
            { matchStatus = 200
            , matchHeaders =
                [ "Content-Type" <:> "application/json; charset=utf-8"
                , "Content-Range" <:> "0-0/*"
                , "Preference-Applied" <:> "return=representation"
                ]
            }

      it "fails if at least one specified column doesn't exist" $
        request
          methodPatch
          "/datarep_todos_computed?id=eq.2&columns=label_color,helicopters"
          [("Prefer", "return=representation")]
          [json| {"due_at": "2019-01-03T11:00:00Z", "smth": "here", "label_color": "invalid", "fake_id": 13} |]
          `shouldRespondWith` [json| {"code":"PGRST204","details":null,"hint":null,"message":"Could not find the 'helicopters' column of 'datarep_todos_computed' in the schema cache"} |]
            { matchStatus = 400
            , matchHeaders = ["Content-Type" <:> "application/json; charset=utf-8"]
            }

      it "ignores json keys and gives 200 if no record updated" $
        request
          methodPatch
          "/datarep_todos_computed?id=eq.2001&columns=label_color"
          [("Prefer", "return=representation")]
          [json| {"due_at": "2019-01-03T11:00:00Z", "smth": "here", "label_color": "invalid", "fake_id": 13} |]
          `shouldRespondWith` 200

    context "with ordering" $
      it "works with request method PATCH and embedded resource" $
        request
          methodPatch
          "/web_content?id=eq.0&select=id,name,web_content(name)&web_content.order=name.asc"
          [("Prefer", "return=representation")]
          [json|{"name": "tardis-patched"}|]
          `shouldRespondWith` [json|
              [ { "id": 0, "name": "tardis-patched", "web_content": [ { "name": "bar" }, { "name": "fezz" }, { "name": "foo" } ]} ]
            |]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson, "Preference-Applied" <:> "return=representation"]
            }
