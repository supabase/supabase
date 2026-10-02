module Feature.Query.AndOrParamsSpec where

import Network.HTTP.Types
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig baseCfg $
  describe "and/or params used for complex boolean logic" $ do
    context "used with GET" $ do
      context "or param" $ do
        it "can do simple logic" $
          get "/entities?or=(id.eq.1,id.eq.2)&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 2 }]|]{matchHeaders = [matchContentTypeJson]}
        it "can negate simple logic" $
          get "/entities?not.or=(id.eq.1,id.eq.2)&select=id"
            `shouldRespondWith` [json|[{ "id": 3 }, { "id": 4 }]|]{matchHeaders = [matchContentTypeJson]}
        it "can be combined with traditional filters" $
          get "/entities?or=(id.eq.1,id.eq.2)&name=eq.entity 1&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }]|]{matchHeaders = [matchContentTypeJson]}

      context "embedded levels" $ do
        it "can do logic on the second level" $
          get "/entities?child_entities.or=(id.eq.1,name.eq.child entity 2)&select=id,child_entities(id)"
            `shouldRespondWith` [json|[
              {"id": 1, "child_entities": [ { "id": 1 }, { "id": 2 } ] }, { "id": 2, "child_entities": []},
              {"id": 3, "child_entities": []}, {"id": 4, "child_entities": []}
            ]|]
              { matchHeaders = [matchContentTypeJson]
              }

        it "can do logic on the third level" $
          get "/entities?child_entities.grandchild_entities.or=(id.eq.1,id.eq.2)&select=id,child_entities(id,grandchild_entities(id))"
            `shouldRespondWith` [json|[
                {"id": 1, "child_entities": [
                  { "id": 1, "grandchild_entities": [ { "id": 1 }, { "id": 2 } ]},
                  { "id": 2, "grandchild_entities": []},
                  { "id": 4, "grandchild_entities": []},
                  { "id": 5, "grandchild_entities": []}
                ]},
                {"id": 2, "child_entities": [
                  { "id": 3, "grandchild_entities": []},
                  { "id": 6, "grandchild_entities": []}
                ]},
                {"id": 3, "child_entities": []},
                {"id": 4, "child_entities": []}
              ]|]

      context "and/or params combined" $ do
        it "can be nested inside the same expression" $
          get "/entities?or=(and(name.eq.entity 2,id.eq.2),and(name.eq.entity 1,id.eq.1))&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 2 }]|]{matchHeaders = [matchContentTypeJson]}
        it "can be negated while nested" $
          get "/entities?or=(not.and(name.eq.entity 2,id.eq.2),not.and(name.eq.entity 1,id.eq.1))&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 2 }, { "id": 3 }, { "id": 4 }]|]{matchHeaders = [matchContentTypeJson]}
        it "can be combined unnested" $
          get "/entities?and=(id.eq.1,name.eq.entity 1)&or=(id.eq.1,id.eq.2)&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }]|]{matchHeaders = [matchContentTypeJson]}

      context "operators inside and/or" $ do
        it "can handle eq and neq" $
          get "/entities?and=(id.eq.1,id.neq.2))&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }]|]{matchHeaders = [matchContentTypeJson]}
        it "can handle lt and gt" $
          get "/entities?or=(id.lt.2,id.gt.3)&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 4 }]|]{matchHeaders = [matchContentTypeJson]}
        it "can handle lte and gte" $
          get "/entities?or=(id.lte.2,id.gte.3)&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 2 }, { "id": 3 }, { "id": 4 }]|]{matchHeaders = [matchContentTypeJson]}
        it "can handle like and ilike" $
          get "/entities?or=(name.like.*1,name.ilike.*ENTITY 2)&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 2 }]|]{matchHeaders = [matchContentTypeJson]}
        it "can handle in" $
          get "/entities?or=(id.in.(1,2),id.in.(3,4))&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 2 }, { "id": 3 }, { "id": 4 }]|]{matchHeaders = [matchContentTypeJson]}
        it "can handle is" $
          get "/entities?and=(name.is.null,arr.is.null)&select=id"
            `shouldRespondWith` [json|[{ "id": 4 }]|]{matchHeaders = [matchContentTypeJson]}
        it "can handle fts on tsvector columns" $ do
          get "/entities?or=(text_search_vector.fts.bar,text_search_vector.fts.baz)&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 2 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/tsearch?or=(text_search_vector.plfts(german).Art%20Spass, text_search_vector.plfts(french).amusant%20impossible, text_search_vector.fts(english).impossible)"
            `shouldRespondWith` [json|[
              {"text_search_vector": "'fun':5 'imposs':9 'kind':3" },
              {"text_search_vector": "'amus':5 'fair':7 'impossibl':9 'peu':4" },
              {"text_search_vector": "'art':4 'spass':5 'unmog':7"}
            ]|]
              { matchHeaders = [matchContentTypeJson]
              }
        it "can handle fts on text and json columns" $ do
          get "/grandchild_entities?or=(jsonb_col.fts.bar,jsonb_col.fts.foo)&select=jsonb_col"
            `shouldRespondWith` [json|[
              { "jsonb_col": {"a": {"b":"foo"}} },
              { "jsonb_col": {"b":"bar"} }]
            |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?and=(text_search.not.plfts(german).Art%20Spass, text_search.not.plfts(french).amusant%20impossible, text_search.not.fts(english).impossible)&select=text_search"
            `shouldRespondWith` [json|[
              { "text_search": "But also fun to do what is possible" },
              { "text_search": "Fat cats ate rats" }]
            |]
              { matchHeaders = [matchContentTypeJson]
              }
        it "can handle isdistinct" $
          get "/entities?and=(id.gte.2,arr.isdistinct.{1,2})&select=id"
            `shouldRespondWith` [json|[{ "id": 3 }, { "id": 4 }]|]{matchHeaders = [matchContentTypeJson]}

        it "can handle wfts (websearch_to_tsquery)" $
          get "/tsearch?or=(text_search_vector.plfts(german).Art,text_search_vector.plfts(french).amusant,text_search_vector.not.wfts(english).impossible)"
            `shouldRespondWith` [json|[
                   {"text_search_vector": "'also':2 'fun':3 'possibl':8" },
                   {"text_search_vector": "'ate':3 'cat':2 'fat':1 'rat':4" },
                   {"text_search_vector": "'amus':5 'fair':7 'impossibl':9 'peu':4" },
                   {"text_search_vector": "'art':4 'spass':5 'unmog':7" }
            ]|]
              { matchHeaders = [matchContentTypeJson]
              }

        it "can handle cs and cd" $
          get "/entities?or=(arr.cs.{1,2,3},arr.cd.{1})&select=id"
            `shouldRespondWith` [json|[{ "id": 1 },{ "id": 3 }]|]{matchHeaders = [matchContentTypeJson]}

        it "can handle range operators" $ do
          get "/ranges?range=eq.[1,3]&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/ranges?range=neq.[1,3]&select=id"
            `shouldRespondWith` [json|[{ "id": 2 }, { "id": 3 }, { "id": 4 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/ranges?range=lt.[1,10]&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/ranges?range=gt.[8,11]&select=id"
            `shouldRespondWith` [json|[{ "id": 4 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/ranges?range=lte.[1,3]&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/ranges?range=gte.[2,3]&select=id"
            `shouldRespondWith` [json|[{ "id": 2 }, { "id": 3 }, { "id": 4 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/ranges?range=cs.[1,2]&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/ranges?range=cd.[1,6]&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 2 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/ranges?range=ov.[0,4]&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 2 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/ranges?range=sl.[9,10]&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 2 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/ranges?range=sr.[3,4]&select=id"
            `shouldRespondWith` [json|[{ "id": 3 }, { "id": 4 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/ranges?range=nxr.[4,7]&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 2 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/ranges?range=nxl.[4,7]&select=id"
            `shouldRespondWith` [json|[{ "id": 3 }, { "id": 4 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/ranges?range=adj.(3,10]&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/ranges?range=isdistinct.[1,3]&select=id"
            `shouldRespondWith` [json|[{ "id": 2 }, { "id": 3 }, { "id": 4 }, {"id": 5}]|]{matchHeaders = [matchContentTypeJson]}

        it "can handle array operators" $ do
          get "/entities?arr=eq.{1,2,3}&select=id"
            `shouldRespondWith` [json|[{ "id": 3 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/entities?arr=neq.{1,2}&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 3 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/entities?arr=lt.{2,3}&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 2 }, { "id": 3 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/entities?arr=lt.{2,0}&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 2 }, { "id": 3 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/entities?arr=gt.{1,1}&select=id"
            `shouldRespondWith` [json|[{ "id": 2 }, { "id": 3 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/entities?arr=gt.{3}&select=id"
            `shouldRespondWith` [json|[]|]{matchHeaders = [matchContentTypeJson]}
          get "/entities?arr=lte.{2,1}&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 2 }, { "id": 3 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/entities?arr=lte.{1,2,3}&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 2 }, { "id": 3 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/entities?arr=lte.{1,2}&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 2 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/entities?arr=cs.{1,2}&select=id"
            `shouldRespondWith` [json|[{ "id": 2 }, { "id": 3 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/entities?arr=cd.{1,2,6}&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 2 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/entities?arr=ov.{3}&select=id"
            `shouldRespondWith` [json|[{ "id": 3 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/entities?arr=ov.{2,3}&select=id"
            `shouldRespondWith` [json|[{ "id": 2 }, { "id": 3 }]|]{matchHeaders = [matchContentTypeJson]}
          get "/entities?arr=isdistinct.{1,2}&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 3 }, { "id": 4 }]|]{matchHeaders = [matchContentTypeJson]}

        context "operators with not" $ do
          it "eq, cs, like can be negated" $
            get "/entities?and=(arr.not.cs.{1,2,3},and(id.not.eq.2,name.not.like.*3))&select=id"
              `shouldRespondWith` [json|[{ "id": 1}]|]{matchHeaders = [matchContentTypeJson]}
          it "in, is, fts can be negated" $
            get "/entities?and=(id.not.in.(1,3),and(name.not.is.null,text_search_vector.not.fts.foo))&select=id"
              `shouldRespondWith` [json|[{ "id": 2}]|]{matchHeaders = [matchContentTypeJson]}
          it "lt, gte, cd can be negated" $
            get "/entities?and=(arr.not.cd.{1},or(id.not.lt.1,id.not.gte.3))&select=id"
              `shouldRespondWith` [json|[{"id": 2}, {"id": 3}]|]{matchHeaders = [matchContentTypeJson]}
          it "gt, lte, ilike can be negated" $
            get "/entities?and=(name.not.ilike.*ITY2,or(id.not.gt.4,id.not.lte.1))&select=id"
              `shouldRespondWith` [json|[{"id": 1}, {"id": 2}, {"id": 3}]|]{matchHeaders = [matchContentTypeJson]}
          it "isdistinct can be negated" $
            get "/entities?and=(id.not.eq.2,arr.not.isdistinct.{1,2,3})&select=id"
              `shouldRespondWith` [json|[{"id": 3}]|]{matchHeaders = [matchContentTypeJson]}

      context "and/or params with quotes" $ do
        it "eq can have quotes" $
          get "/grandchild_entities?or=(name.eq.\"(grandchild,entity,4)\",name.eq.\"(grandchild,entity,5)\")&select=id"
            `shouldRespondWith` [json|[{ "id": 4 }, { "id": 5 }]|]{matchHeaders = [matchContentTypeJson]}
        it "like and ilike can have quotes" $
          get "/grandchild_entities?or=(name.like.\"*ity,4*\",name.ilike.\"*ITY,5)\")&select=id"
            `shouldRespondWith` [json|[{ "id": 4 }, { "id": 5 }]|]{matchHeaders = [matchContentTypeJson]}
        it "in can have quotes" $
          get "/grandchild_entities?or=(id.in.(\"1\",\"2\"),id.in.(\"3\",\"4\"))&select=id"
            `shouldRespondWith` [json|[{ "id": 1 }, { "id": 2 }, { "id": 3 }, { "id": 4 }]|]{matchHeaders = [matchContentTypeJson]}

      it "allows whitespace" $
        get "/entities?and=( and ( id.in.( 1, 2, 3 ) , id.eq.3 ) , or ( id.eq.2 , id.eq.3 ) )&select=id"
          `shouldRespondWith` [json|[{ "id": 3 }]|]{matchHeaders = [matchContentTypeJson]}

      context "multiple and/or conditions" $ do
        it "cannot have zero conditions" $
          get "/entities?or=()"
            `shouldRespondWith` [json|{
              "details": "unexpected \")\" expecting field name (* or [a..z0..9_$]), negation operator (not) or logic operator (and, or)",
              "message": "\"failed to parse logic tree (())\" (line 1, column 4)",
              "code": "PGRST100",
              "hint": null
            }|]
              { matchStatus = 400
              , matchHeaders = [matchContentTypeJson]
              }
        it "can have a single condition" $ do
          get "/entities?or=(id.eq.1)&select=id"
            `shouldRespondWith` [json|[{"id":1}]|]{matchHeaders = [matchContentTypeJson]}
          get "/entities?and=(id.eq.1)&select=id"
            `shouldRespondWith` [json|[{"id":1}]|]{matchHeaders = [matchContentTypeJson]}
        it "can have three conditions" $ do
          get "/grandchild_entities?or=(id.eq.1, id.eq.2, id.eq.3)&select=id"
            `shouldRespondWith` [json|[{"id":1}, {"id":2}, {"id":3}]|]{matchHeaders = [matchContentTypeJson]}
          get "/grandchild_entities?and=(id.in.(1,2), id.in.(3,1), id.in.(1,4))&select=id"
            `shouldRespondWith` [json|[{"id":1}]|]{matchHeaders = [matchContentTypeJson]}
        it "can have four conditions combining and/or" $ do
          get "/grandchild_entities?or=( id.eq.1, id.eq.2, and(id.in.(1,3), id.in.(2,3)), id.eq.4 )&select=id"
            `shouldRespondWith` [json|[{"id":1}, {"id":2}, {"id":3}, {"id":4}]|]{matchHeaders = [matchContentTypeJson]}
          get "/grandchild_entities?and=( id.eq.1, not.or(id.eq.2, id.eq.3), id.in.(1,4), or(id.eq.1, id.eq.4) )&select=id"
            `shouldRespondWith` [json|[{"id":1}]|]{matchHeaders = [matchContentTypeJson]}

    context "used with POST" $
      it "includes related data with filters" $
        request
          methodPost
          "/child_entities?select=id,entities(id)&entities.or=(id.eq.2,id.eq.3)&entities.order=id"
          [("Prefer", "return=representation")]
          [json|[
              {"id":7,"name":"entity 4","parent_id":1},
              {"id":8,"name":"entity 5","parent_id":2},
              {"id":9,"name":"entity 6","parent_id":3}
            ]|]
          `shouldRespondWith` [json|[{"id": 7, "entities":null}, {"id": 8, "entities": {"id": 2}}, {"id": 9, "entities": {"id": 3}}]|]
            { matchStatus = 201
            }

    context "used with PATCH" $ do
      it "succeeds when using and/or params" $
        request
          methodPatch
          "/grandchild_entities?or=(id.eq.1,id.eq.2)&select=id,name"
          [("Prefer", "return=representation")]
          [json|{ name : "updated grandchild entity"}|]
          `shouldRespondWith` [json|[{ "id": 1, "name" : "updated grandchild entity"},{ "id": 2, "name" : "updated grandchild entity"}]|]
            { matchHeaders = [matchContentTypeJson]
            }
      it "succeeds when the filtered column is modified" $
        request
          methodPatch
          "/entities?select=id,name&or=(name.is.null,name.like.*test*)"
          [("Prefer", "return=representation")]
          [json|{ "name" : "updated entity" }|]
          `shouldRespondWith` [json|[{ "id": 4, "name": "updated entity" }]|]
            { matchHeaders = [matchContentTypeJson]
            }
      it "succeeds when the filtered column is not selected in the returned representation" $
        request
          methodPatch
          "/entities?select=id&or=(name.is.null,name.like.*test*)"
          [("Prefer", "return=representation")]
          [json|{ "name" : "updated entity" }|]
          `shouldRespondWith` [json|[{ "id": 4 }]|]
            { matchHeaders = [matchContentTypeJson]
            }

    context "used with DELETE" $ do
      it "succeeds when using and/or params" $
        request
          methodDelete
          "/grandchild_entities?or=(id.eq.1,id.eq.2)&select=id,name"
          [("Prefer", "return=representation")]
          ""
          `shouldRespondWith` [json|[{ "id": 1, "name" : "grandchild entity 1" },{ "id": 2, "name" : "grandchild entity 2" }]|]
      it "succeeds when the filtered column is not selected in the returned representation" $
        request
          methodDelete
          "/entities?select=id&or=(name.is.null,name.like.*test*)"
          [("Prefer", "return=representation")]
          ""
          `shouldRespondWith` [json|[{ "id": 4 }]|]

    it "can query columns that begin with and/or reserved words" $
      get "/grandchild_entities?or=(and_starting_col.eq.smth, or_starting_col.eq.smth)" `shouldRespondWith` 200
