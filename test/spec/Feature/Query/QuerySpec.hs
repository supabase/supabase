module Feature.Query.QuerySpec where

import Network.HTTP.Types
import Network.Wai.Test (SResponse (simpleHeaders))
import Protolude hiding (get)
import Test.Hspec hiding (pendingWith)
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import Data.ByteString.Char8 qualified as BS

import PostgREST.Config (AppConfig (..))
import PostgREST.Config.PgVersion (PgVersion, pgVersion190)
import PostgREST.Version (prettyVersion)
import SpecHelper

spec :: PgVersion -> SpecWithConfig
spec actualPgVersion withConfig = withConfig baseCfg $ do
  describe "Querying a table with a column called count" $
    it "should not confuse count column with pg_catalog.count aggregate" $
      get "/has_count_column" `shouldRespondWith` 200

  describe "Querying a table with a column called t" $
    it "should not conflict with internal postgrest table alias" $
      get "/clashing_column?select=t" `shouldRespondWith` 200

  describe "Querying a nonexistent table" $
    it "causes a 404" $
      get "/faketable"
        `shouldRespondWith` [json| {"code":"PGRST205","details":null,"hint":null,"message":"Could not find the table 'test.faketable' in the schema cache"} |]
          { matchStatus = 404
          , matchHeaders = ["Content-Length" <:> "120"]
          }

  describe "Filtering response" $ do
    it "matches with equality" $
      get "/items?id=eq.5"
        `shouldRespondWith` [json| [{"id":5}] |]
          { matchHeaders =
              [ "Content-Range" <:> "0-0/*"
              , "Content-Length" <:> "10"
              ]
          }

    it "matches with equality using not operator" $
      get "/items?id=not.eq.5&order=id"
        `shouldRespondWith` [json| [{"id":1},{"id":2},{"id":3},{"id":4},{"id":6},{"id":7},{"id":8},{"id":9},{"id":10},{"id":11},{"id":12},{"id":13},{"id":14},{"id":15}] |]
          { matchHeaders = ["Content-Range" <:> "0-13/*"]
          }

    it "matches with more than one condition using not operator" $
      get "/simple_pk?k=like.*yx&extra=not.eq.u" `shouldRespondWith` "[]"

    it "matches with inequality using not operator" $ do
      get "/items?id=not.lt.14&order=id.asc"
        `shouldRespondWith` [json| [{"id":14},{"id":15}] |]
          { matchHeaders = ["Content-Range" <:> "0-1/*"]
          }
      get "/items?id=not.gt.2&order=id.asc"
        `shouldRespondWith` [json| [{"id":1},{"id":2}] |]
          { matchHeaders = ["Content-Range" <:> "0-1/*"]
          }

    it "matches items IN" $
      get "/items?id=in.(1,3,5)"
        `shouldRespondWith` [json| [{"id":1},{"id":3},{"id":5}] |]
          { matchHeaders = ["Content-Range" <:> "0-2/*"]
          }

    it "matches items NOT IN using not operator" $
      get "/items?id=not.in.(2,4,6,7,8,9,10,11,12,13,14,15)"
        `shouldRespondWith` [json| [{"id":1},{"id":3},{"id":5}] |]
          { matchHeaders = ["Content-Range" <:> "0-2/*"]
          }

    it "matches nulls using not operator" $
      get "/no_pk?a=not.is.null"
        `shouldRespondWith` [json| [{"a":"1","b":"0"},{"a":"2","b":"0"}] |]
          { matchHeaders = [matchContentTypeJson]
          }

    it "matches not_null using is operator" $
      get "/no_pk?a=is.not_null"
        `shouldRespondWith` [json| [{"a":"1","b":"0"},{"a":"2","b":"0"}] |]
          { matchHeaders = [matchContentTypeJson]
          }

    it "matches nulls in varchar and numeric fields alike" $ do
      get "/no_pk?a=is.null"
        `shouldRespondWith` [json| [{"a": null, "b": null}] |]
          { matchHeaders = [matchContentTypeJson]
          }

    it "not.is.not_null is equivalent to is.null" $ do
      get "/no_pk?a=not.is.not_null"
        `shouldRespondWith` [json| [{"a": null, "b": null}] |]
          { matchHeaders = [matchContentTypeJson]
          }

      get "/nullable_integer?a=is.null" `shouldRespondWith` [json|[{"a":null}]|]

    it "matches with trilean values" $ do
      get "/chores?done=is.true"
        `shouldRespondWith` [json| [{"id": 1, "name": "take out the garbage", "done": true }] |]
          { matchHeaders = [matchContentTypeJson]
          }

      get "/chores?done=is.false"
        `shouldRespondWith` [json| [{"id": 2, "name": "do the laundry", "done": false }] |]
          { matchHeaders = [matchContentTypeJson]
          }

      get "/chores?done=is.unknown"
        `shouldRespondWith` [json| [{"id": 3, "name": "wash the dishes", "done": null }] |]
          { matchHeaders = [matchContentTypeJson]
          }

    it "matches with null and not_null values in upper or mixed case" $ do
      get "/chores?done=is.NULL"
        `shouldRespondWith` [json| [{"id": 3, "name": "wash the dishes", "done": null }] |]
          { matchHeaders = [matchContentTypeJson]
          }

      get "/chores?done=is.NoT_NuLl"
        `shouldRespondWith` [json| [{"id": 1, "name": "take out the garbage", "done": true }
               ,{"id": 2, "name": "do the laundry", "done": false }] |]
          { matchHeaders = [matchContentTypeJson]
          }

    it "matches with trilean values in upper or mixed case" $ do
      get "/chores?done=is.TRUE"
        `shouldRespondWith` [json| [{"id": 1, "name": "take out the garbage", "done": true }] |]
          { matchHeaders = [matchContentTypeJson]
          }

      get "/chores?done=is.FAlSe"
        `shouldRespondWith` [json| [{"id": 2, "name": "do the laundry", "done": false }] |]
          { matchHeaders = [matchContentTypeJson]
          }

      get "/chores?done=is.UnKnOwN"
        `shouldRespondWith` [json| [{"id": 3, "name": "wash the dishes", "done": null }] |]
          { matchHeaders = [matchContentTypeJson]
          }

    it "fails if 'is' used and there's no null or trilean value" $ do
      get "/chores?done=is.nil" `shouldRespondWith` 400
      get "/chores?done=is.ok" `shouldRespondWith` 400

    it "matches with like" $ do
      get "/simple_pk?k=like.*yx"
        `shouldRespondWith` [json|[{"k":"xyyx","extra":"u"}]|]
      get "/simple_pk?k=like.xy*"
        `shouldRespondWith` [json|[{"k":"xyyx","extra":"u"}]|]
      get "/simple_pk?k=like.*YY*"
        `shouldRespondWith` [json|[{"k":"xYYx","extra":"v"}]|]

    it "matches with like using not operator" $
      get "/simple_pk?k=not.like.*yx"
        `shouldRespondWith` [json|[{"k":"xYYx","extra":"v"}]|]

    it "matches with ilike" $ do
      get "/simple_pk?k=ilike.xy*&order=extra.asc"
        `shouldRespondWith` [json|[{"k":"xyyx","extra":"u"},{"k":"xYYx","extra":"v"}]|]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/simple_pk?k=ilike.*YY*&order=extra.asc"
        `shouldRespondWith` [json|[{"k":"xyyx","extra":"u"},{"k":"xYYx","extra":"v"}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "matches with ilike using not operator" $
      get "/simple_pk?k=not.ilike.xy*&order=extra.asc" `shouldRespondWith` "[]"

    it "matches with ~" $ do
      get "/simple_pk?k=match.yx$"
        `shouldRespondWith` [json|[{"k":"xyyx","extra":"u"}]|]
      get "/simple_pk?k=match.^xy"
        `shouldRespondWith` [json|[{"k":"xyyx","extra":"u"}]|]
      get "/simple_pk?k=match.YY"
        `shouldRespondWith` [json|[{"k":"xYYx","extra":"v"}]|]

    it "matches with ~ using not operator" $
      get "/simple_pk?k=not.match.yx$"
        `shouldRespondWith` [json|[{"k":"xYYx","extra":"v"}]|]

    it "matches with ~*" $ do
      get "/simple_pk?k=imatch.^xy&order=extra.asc"
        `shouldRespondWith` [json|[{"k":"xyyx","extra":"u"},{"k":"xYYx","extra":"v"}]|]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/simple_pk?k=imatch..*YY.*&order=extra.asc"
        `shouldRespondWith` [json|[{"k":"xyyx","extra":"u"},{"k":"xYYx","extra":"v"}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "matches with ~* using not operator" $
      get "/simple_pk?k=not.imatch.^xy&order=extra.asc" `shouldRespondWith` "[]"

    describe "Full text search operator" $ do
      context "tsvector columns" $ do
        it "finds matches with to_tsquery" $
          get "/tsearch?text_search_vector=fts.impossible"
            `shouldRespondWith` [json| [{"text_search_vector": "'fun':5 'imposs':9 'kind':3" }] |]
              { matchHeaders = [matchContentTypeJson]
              }

        it "can use lexeme boolean operators(&=%26, |=%7C, !) in to_tsquery" $ do
          get "/tsearch?text_search_vector=fts.fun%26possible"
            `shouldRespondWith` [json| [ {"text_search_vector": "'also':2 'fun':3 'possibl':8"}] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch?text_search_vector=fts.impossible%7Cpossible"
            `shouldRespondWith` [json| [
            {"text_search_vector": "'fun':5 'imposs':9 'kind':3"},
            {"text_search_vector": "'also':2 'fun':3 'possibl':8"}] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch?text_search_vector=fts.fun%26!possible"
            `shouldRespondWith` [json| [ {"text_search_vector": "'fun':5 'imposs':9 'kind':3"}] |]
              { matchHeaders = [matchContentTypeJson]
              }

        it "finds matches with plainto_tsquery" $
          get "/tsearch?text_search_vector=plfts.The%20Fat%20Rats"
            `shouldRespondWith` [json| [ {"text_search_vector": "'ate':3 'cat':2 'fat':1 'rat':4" }] |]
              { matchHeaders = [matchContentTypeJson]
              }

        it "finds matches with websearch_to_tsquery" $
          get "/tsearch?text_search_vector=wfts.The%20Fat%20Rats"
            `shouldRespondWith` [json| [ {"text_search_vector": "'ate':3 'cat':2 'fat':1 'rat':4" }] |]
              { matchHeaders = [matchContentTypeJson]
              }

        it "can use boolean operators(and, or, -) in websearch_to_tsquery" $ do
          get "/tsearch?text_search_vector=wfts.fun%20and%20possible"
            `shouldRespondWith` [json| [ {"text_search_vector": "'also':2 'fun':3 'possibl':8"}] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch?text_search_vector=wfts.impossible%20or%20possible"
            `shouldRespondWith` [json| [
                {"text_search_vector": "'fun':5 'imposs':9 'kind':3"},
                {"text_search_vector": "'also':2 'fun':3 'possibl':8"}]
                  |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch?text_search_vector=wfts.fun%20and%20-possible"
            `shouldRespondWith` [json| [ {"text_search_vector": "'fun':5 'imposs':9 'kind':3"}] |]
              { matchHeaders = [matchContentTypeJson]
              }

        it "finds matches with different dictionaries" $ do
          get "/tsearch?text_search_vector=fts(french).amusant"
            `shouldRespondWith` [json| [{"text_search_vector": "'amus':5 'fair':7 'impossibl':9 'peu':4" }] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch?text_search_vector=plfts(french).amusant%20impossible"
            `shouldRespondWith` [json| [{"text_search_vector": "'amus':5 'fair':7 'impossibl':9 'peu':4" }] |]
              { matchHeaders = [matchContentTypeJson]
              }

          get "/tsearch?text_search_vector=wfts(french).amusant%20impossible"
            `shouldRespondWith` [json| [{"text_search_vector": "'amus':5 'fair':7 'impossibl':9 'peu':4" }] |]
              { matchHeaders = [matchContentTypeJson]
              }

        it "can be negated with not operator" $ do
          get "/tsearch?text_search_vector=not.fts.impossible%7Cfat%7Cfun"
            `shouldRespondWith` [json| [
              {"text_search_vector": "'amus':5 'fair':7 'impossibl':9 'peu':4"},
              {"text_search_vector": "'art':4 'spass':5 'unmog':7"}]|]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch?text_search_vector=not.fts(english).impossible%7Cfat%7Cfun"
            `shouldRespondWith` [json| [
              {"text_search_vector": "'amus':5 'fair':7 'impossibl':9 'peu':4"},
              {"text_search_vector": "'art':4 'spass':5 'unmog':7"}]|]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch?text_search_vector=not.plfts.The%20Fat%20Rats"
            `shouldRespondWith` [json| [
              {"text_search_vector": "'fun':5 'imposs':9 'kind':3"},
              {"text_search_vector": "'also':2 'fun':3 'possibl':8"},
              {"text_search_vector": "'amus':5 'fair':7 'impossibl':9 'peu':4"},
              {"text_search_vector": "'art':4 'spass':5 'unmog':7"}]|]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch?text_search_vector=not.wfts(english).impossible%20or%20fat%20or%20fun"
            `shouldRespondWith` [json| [
                  {"text_search_vector": "'amus':5 'fair':7 'impossibl':9 'peu':4"},
                  {"text_search_vector": "'art':4 'spass':5 'unmog':7"}]|]
              { matchHeaders = [matchContentTypeJson]
              }

        context "Use of the phraseto_tsquery function" $ do
          it "finds matches" $
            get "/tsearch?text_search_vector=phfts.The%20Fat%20Cats"
              `shouldRespondWith` [json| [{"text_search_vector": "'ate':3 'cat':2 'fat':1 'rat':4" }] |]
                { matchHeaders = [matchContentTypeJson]
                }

          it "finds matches with different dictionaries" $
            get "/tsearch?text_search_vector=phfts(german).Art%20Spass"
              `shouldRespondWith` [json| [{"text_search_vector": "'art':4 'spass':5 'unmog':7" }] |]
                { matchHeaders = [matchContentTypeJson]
                }

          it "can be negated with not operator" $
            get "/tsearch?text_search_vector=not.phfts(english).The%20Fat%20Cats"
              `shouldRespondWith` [json| [
                {"text_search_vector": "'fun':5 'imposs':9 'kind':3"},
                {"text_search_vector": "'also':2 'fun':3 'possibl':8"},
                {"text_search_vector": "'amus':5 'fair':7 'impossibl':9 'peu':4"},
                {"text_search_vector": "'art':4 'spass':5 'unmog':7"}]|]
                { matchHeaders = [matchContentTypeJson]
                }

          it "can be used with or query param" $
            get "/tsearch?or=(text_search_vector.phfts(german).Art%20Spass, text_search_vector.phfts(french).amusant, text_search_vector.fts(english).impossible)"
              `shouldRespondWith` [json|[
                {"text_search_vector": "'fun':5 'imposs':9 'kind':3" },
                {"text_search_vector": "'amus':5 'fair':7 'impossibl':9 'peu':4" },
                {"text_search_vector": "'art':4 'spass':5 'unmog':7"}
              ]|]
                { matchHeaders = [matchContentTypeJson]
                }

          it "works with tsvector computed fields" $
            get "/tsearch_to_tsvector?select=text_search_vector&text_search_vector=fts(simple).of"
              `shouldRespondWith` [json| [
                {"text_search_vector":"'do':7 'fun':5 'impossible':9 'it':1 'kind':3 'of':4 's':2 'the':8 'to':6"}
              ]|]
                { matchHeaders = [matchContentTypeJson]
                }

          it "works when the column type is a tsvector domain" $ do
            get "tsearch_to_tsvector?select=text_search_domain&text_search_domain=fts(simple).of"
              `shouldRespondWith` [json| [
                {"text_search_domain":"'do':7 'fun':5 'impossible':9 'it':1 'kind':3 'of':4 's':2 'the':8 'to':6"}
              ]|]
                { matchHeaders = [matchContentTypeJson]
                }

          it "works when the column type is a recursive tsvector domain" $ do
            get "tsearch_to_tsvector?select=text_search_rec_domain&text_search_rec_domain=fts(simple).of"
              `shouldRespondWith` [json| [
                {"text_search_rec_domain":"'do':7 'fun':5 'impossible':9 'it':1 'kind':3 'of':4 's':2 'the':8 'to':6"}
              ]|]
                { matchHeaders = [matchContentTypeJson]
                }

      context "text and json columns" $ do
        it "finds matches with to_tsquery" $ do
          get "/tsearch_to_tsvector?select=text_search&text_search=fts.impossible"
            `shouldRespondWith` [json| [
              {"text_search": "It's kind of fun to do the impossible"},
              {"text_search": "C'est un peu amusant de faire l'impossible"}]
            |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=jsonb_search&jsonb_search=fts.impossible"
            `shouldRespondWith` [json| [
              {"jsonb_search" :{"text_search": "It's kind of fun to do the impossible"}},
              {"jsonb_search" :{"text_search": "C'est un peu amusant de faire l'impossible"}}]
            |]
              { matchHeaders = [matchContentTypeJson]
              }

        it "can use lexeme boolean operators(&=%26, |=%7C, !) in to_tsquery" $ do
          get "/tsearch_to_tsvector?select=text_search&text_search=fts.fun%26possible"
            `shouldRespondWith` [json| [{"text_search": "But also fun to do what is possible"}] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=jsonb_search&jsonb_search=fts.fun%26possible"
            `shouldRespondWith` [json| [{"jsonb_search" :{"text_search": "But also fun to do what is possible"}}] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=text_search&text_search=fts.impossible%7Cpossible"
            `shouldRespondWith` [json| [
              {"text_search": "It's kind of fun to do the impossible"},
              {"text_search": "But also fun to do what is possible"},
              {"text_search": "C'est un peu amusant de faire l'impossible"}]
            |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=jsonb_search&jsonb_search=fts.impossible%7Cpossible"
            `shouldRespondWith` [json| [
              {"jsonb_search" :{"text_search": "It's kind of fun to do the impossible"}},
              {"jsonb_search" :{"text_search": "But also fun to do what is possible"}},
              {"jsonb_search" :{"text_search": "C'est un peu amusant de faire l'impossible"}}]
            |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=text_search&text_search=fts.fun%26!possible"
            `shouldRespondWith` [json| [{"text_search": "It's kind of fun to do the impossible"}]|]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=jsonb_search&jsonb_search=fts.fun%26!possible"
            `shouldRespondWith` [json| [{"jsonb_search" :{"text_search": "It's kind of fun to do the impossible"}}] |]
              { matchHeaders = [matchContentTypeJson]
              }

        it "finds matches with plainto_tsquery" $ do
          get "/tsearch_to_tsvector?select=text_search&text_search=plfts.The%20Fat%20Rats"
            `shouldRespondWith` [json| [{"text_search": "Fat cats ate rats"}] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=jsonb_search&jsonb_search=plfts.The%20Fat%20Rats"
            `shouldRespondWith` [json| [{"jsonb_search" :{"text_search": "Fat cats ate rats"}}] |]
              { matchHeaders = [matchContentTypeJson]
              }

        it "finds matches with websearch_to_tsquery" $ do
          get "/tsearch_to_tsvector?select=text_search&text_search=wfts.The%20Fat%20Rats"
            `shouldRespondWith` [json| [{"text_search": "Fat cats ate rats"}] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=jsonb_search&jsonb_search=wfts.The%20Fat%20Rats"
            `shouldRespondWith` [json| [{"jsonb_search" :{"text_search": "Fat cats ate rats"}}] |]
              { matchHeaders = [matchContentTypeJson]
              }

        it "can use boolean operators(and, or, -) in websearch_to_tsquery" $ do
          get "/tsearch_to_tsvector?select=text_search&text_search=wfts.fun%20and%20possible"
            `shouldRespondWith` [json| [{"text_search": "But also fun to do what is possible"}] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=jsonb_search&jsonb_search=wfts.fun%20and%20possible"
            `shouldRespondWith` [json| [{"jsonb_search" :{"text_search": "But also fun to do what is possible"}}] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=text_search&text_search=wfts.impossible%20or%20possible"
            `shouldRespondWith` [json| [
              {"text_search": "It's kind of fun to do the impossible"},
              {"text_search": "But also fun to do what is possible"},
              {"text_search": "C'est un peu amusant de faire l'impossible"}]
            |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=jsonb_search&jsonb_search=wfts.impossible%20or%20possible"
            `shouldRespondWith` [json| [
              {"jsonb_search" :{"text_search": "It's kind of fun to do the impossible"}},
              {"jsonb_search" :{"text_search": "But also fun to do what is possible"}},
              {"jsonb_search" :{"text_search": "C'est un peu amusant de faire l'impossible"}}]
            |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=text_search&text_search=wfts.fun%20and%20-possible"
            `shouldRespondWith` [json| [{"text_search": "It's kind of fun to do the impossible"}] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=jsonb_search&jsonb_search=wfts.fun%20and%20-possible"
            `shouldRespondWith` [json| [{"jsonb_search" :{"text_search": "It's kind of fun to do the impossible"}}] |]
              { matchHeaders = [matchContentTypeJson]
              }

        it "finds matches with different dictionaries and uses them as configuration for to_tsvector()" $ do
          get "/tsearch_to_tsvector?select=text_search&text_search=fts(french).amusant"
            `shouldRespondWith` [json| [{"text_search": "C'est un peu amusant de faire l'impossible"}] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=jsonb_search&jsonb_search=fts(french).amusant"
            `shouldRespondWith` [json| [{"jsonb_search" :{"text_search": "C'est un peu amusant de faire l'impossible"}}] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=text_search&text_search=plfts(french).amusant%20impossible"
            `shouldRespondWith` [json| [{"text_search": "C'est un peu amusant de faire l'impossible"}] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=jsonb_search&jsonb_search=plfts(french).amusant%20impossible"
            `shouldRespondWith` [json| [{"jsonb_search" :{"text_search": "C'est un peu amusant de faire l'impossible"}}] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=text_search&text_search=wfts(french).amusant%20impossible"
            `shouldRespondWith` [json| [{"text_search": "C'est un peu amusant de faire l'impossible"}] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=jsonb_search&jsonb_search=wfts(french).amusant%20impossible"
            `shouldRespondWith` [json| [{"jsonb_search" :{"text_search": "C'est un peu amusant de faire l'impossible"}}] |]
              { matchHeaders = [matchContentTypeJson]
              }

        it "can be negated with not operator" $ do
          get "/tsearch_to_tsvector?select=text_search&text_search=not.fts.impossible%7Cfat%7Cfun"
            `shouldRespondWith` [json| [{"text_search": "Es ist eine Art Spaß, das Unmögliche zu machen"}] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=jsonb_search&jsonb_search=not.fts.impossible%7Cfat%7Cfun"
            `shouldRespondWith` [json| [{"jsonb_search" :{"text_search": "Es ist eine Art Spaß, das Unmögliche zu machen"}}] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=text_search&text_search=not.fts(english).impossible%7Cfat%7Cfun"
            `shouldRespondWith` [json| [{"text_search": "Es ist eine Art Spaß, das Unmögliche zu machen"}] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=jsonb_search&jsonb_search=not.fts(english).impossible%7Cfat%7Cfun"
            `shouldRespondWith` [json| [{"jsonb_search" :{"text_search": "Es ist eine Art Spaß, das Unmögliche zu machen"}}] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=text_search&text_search=not.plfts.The%20Fat%20Rats"
            `shouldRespondWith` [json| [
              {"text_search": "It's kind of fun to do the impossible"},
              {"text_search": "But also fun to do what is possible"},
              {"text_search": "C'est un peu amusant de faire l'impossible"},
              {"text_search": "Es ist eine Art Spaß, das Unmögliche zu machen"}]
            |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=jsonb_search&jsonb_search=not.plfts.The%20Fat%20Rats"
            `shouldRespondWith` [json| [
              {"jsonb_search" :{"text_search": "It's kind of fun to do the impossible"}},
              {"jsonb_search" :{"text_search": "But also fun to do what is possible"}},
              {"jsonb_search" :{"text_search": "C'est un peu amusant de faire l'impossible"}},
              {"jsonb_search" :{"text_search": "Es ist eine Art Spaß, das Unmögliche zu machen"}}]
            |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=text_search&text_search=not.wfts(english).impossible%20or%20fat%20or%20fun"
            `shouldRespondWith` [json| [{"text_search": "Es ist eine Art Spaß, das Unmögliche zu machen"}] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/tsearch_to_tsvector?select=jsonb_search&jsonb_search=not.wfts(english).impossible%20or%20fat%20or%20fun"
            `shouldRespondWith` [json| [{"jsonb_search" :{"text_search": "Es ist eine Art Spaß, das Unmögliche zu machen"}}] |]
              { matchHeaders = [matchContentTypeJson]
              }

        context "Use of the phraseto_tsquery function" $ do
          it "finds matches" $ do
            get "/tsearch_to_tsvector?select=text_search&text_search=phfts.The%20Fat%20Cats"
              `shouldRespondWith` [json| [{"text_search": "Fat cats ate rats"}] |]
                { matchHeaders = [matchContentTypeJson]
                }
            get "/tsearch_to_tsvector?select=jsonb_search&jsonb_search=phfts.The%20Fat%20Cats"
              `shouldRespondWith` [json| [{"jsonb_search" :{"text_search": "Fat cats ate rats"}}] |]
                { matchHeaders = [matchContentTypeJson]
                }

          it "finds matches with different dictionaries and uses them as configuration for to_tsvector()" $ do
            get "/tsearch_to_tsvector?select=text_search&text_search=phfts(german).Art%20Spass"
              `shouldRespondWith` [json| [{"text_search": "Es ist eine Art Spaß, das Unmögliche zu machen"}] |]
                { matchHeaders = [matchContentTypeJson]
                }
            get "/tsearch_to_tsvector?select=jsonb_search&jsonb_search=phfts(german).Art%20Spass"
              `shouldRespondWith` [json| [{"jsonb_search" :{"text_search": "Es ist eine Art Spaß, das Unmögliche zu machen"}}] |]
                { matchHeaders = [matchContentTypeJson]
                }

          it "can be negated with not operator" $ do
            get "/tsearch_to_tsvector?select=text_search&text_search=not.phfts(english).The%20Fat%20Cats"
              `shouldRespondWith` [json| [
                {"text_search": "It's kind of fun to do the impossible"},
                {"text_search": "But also fun to do what is possible"},
                {"text_search": "C'est un peu amusant de faire l'impossible"},
                {"text_search": "Es ist eine Art Spaß, das Unmögliche zu machen"}]
              |]
                { matchHeaders = [matchContentTypeJson]
                }
            get "/tsearch_to_tsvector?select=jsonb_search&jsonb_search=not.phfts(english).The%20Fat%20Cats"
              `shouldRespondWith` [json| [
                {"jsonb_search" :{"text_search": "It's kind of fun to do the impossible"}},
                {"jsonb_search" :{"text_search": "But also fun to do what is possible"}},
                {"jsonb_search" :{"text_search": "C'est un peu amusant de faire l'impossible"}},
                {"jsonb_search" :{"text_search": "Es ist eine Art Spaß, das Unmögliche zu machen"}}]
              |]
                { matchHeaders = [matchContentTypeJson]
                }

          it "can be used with or query param" $ do
            get "/tsearch_to_tsvector?select=text_search&or=(text_search.phfts(german).Art%20Spass, text_search.phfts(french).amusant, text_search.fts(english).impossible)"
              `shouldRespondWith` [json| [
                {"text_search": "It's kind of fun to do the impossible"},
                {"text_search": "C'est un peu amusant de faire l'impossible"},
                {"text_search": "Es ist eine Art Spaß, das Unmögliche zu machen"}]
              |]
                { matchHeaders = [matchContentTypeJson]
                }
            get "/tsearch_to_tsvector?select=jsonb_search&or=(jsonb_search.phfts(german).Art%20Spass, jsonb_search.phfts(french).amusant, jsonb_search.fts(english).impossible)"
              `shouldRespondWith` [json| [
                {"jsonb_search" :{"text_search": "It's kind of fun to do the impossible"}},
                {"jsonb_search" :{"text_search": "C'est un peu amusant de faire l'impossible"}},
                {"jsonb_search" :{"text_search": "Es ist eine Art Spaß, das Unmögliche zu machen"}}]
              |]
                { matchHeaders = [matchContentTypeJson]
                }

    it "matches with computed column" $
      get "/items?always_true=eq.true&order=id.asc"
        `shouldRespondWith` [json| [{"id":1},{"id":2},{"id":3},{"id":4},{"id":5},{"id":6},{"id":7},{"id":8},{"id":9},{"id":10},{"id":11},{"id":12},{"id":13},{"id":14},{"id":15}] |]
          { matchHeaders = [matchContentTypeJson]
          }

    it "order by computed column" $
      get "/items?order=anti_id.desc"
        `shouldRespondWith` [json| [{"id":1},{"id":2},{"id":3},{"id":4},{"id":5},{"id":6},{"id":7},{"id":8},{"id":9},{"id":10},{"id":11},{"id":12},{"id":13},{"id":14},{"id":15}] |]
          { matchHeaders = [matchContentTypeJson]
          }

    it "cannot access a computed column that is outside of the config schema" $
      get "/items?always_false=is.false" `shouldRespondWith` 400

    it "matches filtering nested items" $
      get "/clients?select=id,projects(id,tasks(id,name))&projects.tasks.name=like.Design*"
        `shouldRespondWith` [json|[{"id":1,"projects":[{"id":1,"tasks":[{"id":1,"name":"Design w7"}]},{"id":2,"tasks":[{"id":3,"name":"Design w10"}]}]},{"id":2,"projects":[{"id":3,"tasks":[{"id":5,"name":"Design IOS"}]},{"id":4,"tasks":[{"id":7,"name":"Design OSX"}]}]}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "errs when the embedded resource doesn't exist and an embedded filter is applied to it" $ do
      get "/clients?select=*&non_existent_projects.name=like.*NonExistent*"
        `shouldRespondWith` [json|
          {"hint":"Verify that 'non_existent_projects' is included in the 'select' query parameter.",
           "details":null,
           "code":"PGRST108",
           "message":"'non_existent_projects' is not an embedded resource in this request"}|]
          { matchStatus = 400
          , matchHeaders =
              [ "Content-Length" <:> "204"
              , matchContentTypeJson
              ]
          }
      get "/clients?select=*,amiga_projects:projects(*)&amiga_projectsss.name=ilike.*Amiga*"
        `shouldRespondWith` [json|
          {"hint":"Verify that 'amiga_projectsss' is included in the 'select' query parameter.",
           "details":null,
           "code":"PGRST108",
           "message":"'amiga_projectsss' is not an embedded resource in this request"}|]
          { matchStatus = 400
          , matchHeaders = [matchContentTypeJson]
          }
      get "/clients?select=id,projects(id,tasks(id,name))&projects.tasks2.name=like.Design*"
        `shouldRespondWith` [json|
          {"hint":"Verify that 'tasks2' is included in the 'select' query parameter.",
           "details":null,
           "code":"PGRST108",
           "message":"'tasks2' is not an embedded resource in this request"}|]
          { matchStatus = 400
          , matchHeaders = [matchContentTypeJson]
          }

    it "matches with cs operator" $
      get "/complex_items?select=id&arr_data=cs.{2}"
        `shouldRespondWith` [json|[{"id":2},{"id":3}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "matches with cd operator" $
      get "/complex_items?select=id&arr_data=cd.{1,2,4}"
        `shouldRespondWith` [json|[{"id":1},{"id":2}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "matches with IS DISTINCT FROM" $
      get "/no_pk?select=a&a=isdistinct.2"
        `shouldRespondWith` [json|[{"a":null},{"a":"1"}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "matches with IS DISTINCT FROM using not operator" $
      get "/no_pk?select=a&a=not.isdistinct.2"
        `shouldRespondWith` [json|[{"a":"2"}]|]
          { matchHeaders = [matchContentTypeJson]
          }

  describe "Shaping response with select parameter" $ do
    it "selectStar works in absense of parameter" $
      get "/complex_items?id=eq.3"
        `shouldRespondWith` [json|[{"id":3,"name":"Three","settings":{"foo":{"int":1,"bar":"baz"}},"arr_data":[1,2,3],"field-with_sep":3}]|]

    it "dash `-` in column names is accepted" $
      get "/complex_items?id=eq.3&select=id,field-with_sep"
        `shouldRespondWith` [json|[{"id":3,"field-with_sep":3}]|]

    it "one simple column" $
      get "/complex_items?select=id"
        `shouldRespondWith` [json| [{"id":1},{"id":2},{"id":3}] |]
          { matchHeaders = [matchContentTypeJson]
          }

    it "rename simple column" $
      get "/complex_items?id=eq.1&select=myId:id"
        `shouldRespondWith` [json| [{"myId":1}] |]
          { matchHeaders = [matchContentTypeJson]
          }

    it "one simple column with casting (text)" $
      get "/complex_items?select=id::text"
        `shouldRespondWith` [json| [{"id":"1"},{"id":"2"},{"id":"3"}] |]
          { matchHeaders = [matchContentTypeJson]
          }

    it "rename simple column with casting" $
      get "/complex_items?id=eq.1&select=myId:id::text"
        `shouldRespondWith` [json| [{"myId":"1"}] |]
          { matchHeaders = [matchContentTypeJson]
          }

    it "json column" $
      get "/complex_items?id=eq.1&select=settings"
        `shouldRespondWith` [json| [{"settings":{"foo":{"int":1,"bar":"baz"}}}] |]
          { matchHeaders = [matchContentTypeJson]
          }

    it "fails on bad casting (wrong cast type)" $
      get "/complex_items?select=id::fakecolumntype"
        `shouldRespondWith` [json| {"hint":null,"details":null,"code":"42704","message":"type \"fakecolumntype\" does not exist"} |]
          { matchStatus = 400
          , matchHeaders = ["Content-Length" <:> "94"]
          }

    it "can cast types with underscore and numbers" $
      get "/oid_test?select=id,oid_col::int,oid_array_col::_int4"
        `shouldRespondWith` [json|
          [{"id":1,"oid_col":12345,"oid_array_col":[1,2,3,4,5]}]
        |]
          { matchHeaders = [matchContentTypeJson]
          }

    it "requesting parents and children" $
      get "/projects?id=eq.1&select=id, name, clients(*), tasks(id, name)"
        `shouldRespondWith` [json|[{"id":1,"name":"Windows 7","clients":{"id":1,"name":"Microsoft"},"tasks":[{"id":1,"name":"Design w7"},{"id":2,"name":"Code w7"}]}]|]
          { matchHeaders =
              [ "Content-Length" <:> "141"
              , matchContentTypeJson
              ]
          }

    it "requesting parent and renaming primary key" $
      get "/projects?select=name,client:clients(clientId:id,name)"
        `shouldRespondWith` [json|[
          {"name":"Windows 7","client":{"name": "Microsoft", "clientId": 1}},
          {"name":"Windows 10","client":{"name": "Microsoft", "clientId": 1}},
          {"name":"IOS","client":{"name": "Apple", "clientId": 2}},
          {"name":"OSX","client":{"name": "Apple", "clientId": 2}},
          {"name":"Orphan","client":null}
        ]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "requesting parent and specifying/renaming one key of the composite primary key" $ do
      get "/comments?select=*,users_tasks(userId:user_id)"
        `shouldRespondWith` [json|[{"id":1,"commenter_id":1,"user_id":2,"task_id":6,"content":"Needs to be delivered ASAP","users_tasks":{"userId": 2}}]|]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/comments?select=*,users_tasks(taskId:task_id)"
        `shouldRespondWith` [json|[{"id":1,"commenter_id":1,"user_id":2,"task_id":6,"content":"Needs to be delivered ASAP","users_tasks":{"taskId": 6}}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "requesting parents and children while renaming them" $
      get "/projects?id=eq.1&select=myId:id, name, project_client:clients(*), project_tasks:tasks(id, name)"
        `shouldRespondWith` [json|[{"myId":1,"name":"Windows 7","project_client":{"id":1,"name":"Microsoft"},"project_tasks":[{"id":1,"name":"Design w7"},{"id":2,"name":"Code w7"}]}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "requesting parents and filtering parent columns" $
      get "/projects?id=eq.1&select=id, name, clients(id)"
        `shouldRespondWith` [json|[{"id":1,"name":"Windows 7","clients":{"id":1}}]|]

    it "rows with missing parents are included" $
      get "/projects?id=in.(1,5)&select=id,clients(id)"
        `shouldRespondWith` [json|[{"id":1,"clients":{"id":1}},{"id":5,"clients":null}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "rows with no children return [] instead of null" $
      get "/projects?id=in.(5)&select=id,tasks(id)"
        `shouldRespondWith` [json|[{"id":5,"tasks":[]}]|]

    it "requesting children 2 levels" $
      get "/clients?id=eq.1&select=id,projects(id,tasks(id))"
        `shouldRespondWith` [json|[{"id":1,"projects":[{"id":1,"tasks":[{"id":1},{"id":2}]},{"id":2,"tasks":[{"id":3},{"id":4}]}]}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "requesting many<->many relation" $
      get "/tasks?select=id,users(id)"
        `shouldRespondWith` [json|[{"id":1,"users":[{"id":1},{"id":3}]},{"id":2,"users":[{"id":1}]},{"id":3,"users":[{"id":1}]},{"id":4,"users":[{"id":1}]},{"id":5,"users":[{"id":2},{"id":3}]},{"id":6,"users":[{"id":2}]},{"id":7,"users":[{"id":2}]},{"id":8,"users":[]}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "requesting many<->many relation with rename" $
      get "/tasks?id=eq.1&select=id,theUsers:users(id)"
        `shouldRespondWith` [json|[{"id":1,"theUsers":[{"id":1},{"id":3}]}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "requesting many<->many relation reverse" $
      get "/users?select=id,tasks(id)"
        `shouldRespondWith` [json|[{"id":1,"tasks":[{"id":1},{"id":2},{"id":3},{"id":4}]},{"id":2,"tasks":[{"id":5},{"id":6},{"id":7}]},{"id":3,"tasks":[{"id":1},{"id":5}]}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "requesting many<->many relation using composite key" $
      get "/files?filename=eq.autoexec.bat&project_id=eq.1&select=filename,users_tasks(user_id,task_id)"
        `shouldRespondWith` [json|[{"filename":"autoexec.bat","users_tasks":[{"user_id":1,"task_id":1},{"user_id":3,"task_id":1}]}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "requesting data using many<->many relation defined by composite keys" $
      get "/users_tasks?user_id=eq.1&task_id=eq.1&select=user_id,files(filename,content)&files.order=filename"
        `shouldRespondWith` [json|[{"user_id":1,"files":[{"filename":"README.md","content":"# make $$$!"},{"filename":"autoexec.bat","content":"@ECHO OFF"},{"filename":"command.com","content":"#include <unix.h>"}]}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "requesting data using many<->many (composite keys) relation using hint" $
      get "/users_tasks?user_id=eq.1&task_id=eq.1&select=user_id,files!touched_files(filename,content)&files.order=filename"
        `shouldRespondWith` [json|[{"user_id":1,"files":[{"filename":"README.md","content":"# make $$$!"},{"filename":"autoexec.bat","content":"@ECHO OFF"},{"filename":"command.com","content":"#include <unix.h>"}]}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "requesting children with composite key" $
      get "/users_tasks?user_id=eq.2&task_id=eq.6&select=*, comments(content)"
        `shouldRespondWith` [json|[{"user_id":2,"task_id":6,"comments":[{"content":"Needs to be delivered ASAP"}]}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    -- https://github.com/PostgREST/postgrest/issues/2070
    it "one-to-many embeds without a disambiguation error due to wrongly generated many-to-many relationships" $
      get "/plate?select=*,well(*)"
        `shouldRespondWith` [json|[]|]
          { matchHeaders = [matchContentTypeJson]
          }

    context "one to one relationships" $ do
      it "works when having a pk as fk" $ do
        get "/students_info?select=address,students(name)"
          `shouldRespondWith` [json|[{"address":"Street 1","students":{"name":"John Doe"}}, {"address":"Street 2","students":{"name":"Jane Doe"}}]|]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/students?select=name,students_info(address)"
          `shouldRespondWith` [json|[{"name":"John Doe","students_info":{"address":"Street 1"}},{"name":"Jane Doe","students_info":{"address":"Street 2"}}]|]
            { matchHeaders = [matchContentTypeJson]
            }

      it "works when having a fk with a unique constraint" $ do
        get "/country?select=name,capital(name)"
          `shouldRespondWith` [json|[{"name":"Afghanistan","capital":{"name":"Kabul"}}, {"name":"Algeria","capital":{"name":"Algiers"}}]|]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/capital?select=name,country(name)"
          `shouldRespondWith` [json|[{"name":"Kabul","country":{"name":"Afghanistan"}}, {"name":"Algiers","country":{"name":"Algeria"}}]|]
            { matchHeaders = [matchContentTypeJson]
            }

      it "works when using column as target" $ do
        get "/capital?select=name,country_id(name)"
          `shouldRespondWith` [json|[{"name":"Kabul","country_id":{"name":"Afghanistan"}}, {"name":"Algiers","country_id":{"name":"Algeria"}}]|]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/capital?select=name,capital_country_id_fkey(name)"
          `shouldRespondWith` [json|[{"name":"Kabul","capital_country_id_fkey":{"name":"Afghanistan"}}, {"name":"Algiers","capital_country_id_fkey":{"name":"Algeria"}}]|]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/country?select=name,capital_country_id_fkey(name)"
          `shouldRespondWith` [json|[{"name":"Afghanistan","capital_country_id_fkey":{"name":"Kabul"}}, {"name":"Algeria","capital_country_id_fkey":{"name":"Algiers"}}]|]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/country?select=name,id(name)"
          `shouldRespondWith` [json|[{"name":"Afghanistan","id":{"name":"Kabul"}}, {"name":"Algeria","id":{"name":"Algiers"}}]|]
            { matchHeaders = [matchContentTypeJson]
            }

      it "works when using column as hint" $ do
        get "/country?select=name,capital!id(name)"
          `shouldRespondWith` [json|[{"name":"Afghanistan","capital":{"name":"Kabul"}}, {"name":"Algeria","capital":{"name":"Algiers"}}]|]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/country?select=name,capital!country_id(name)"
          `shouldRespondWith` [json|[{"name":"Afghanistan","capital":{"name":"Kabul"}}, {"name":"Algeria","capital":{"name":"Algiers"}}]|]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/capital?select=name,country!id(name)"
          `shouldRespondWith` [json|[{"name":"Kabul","country":{"name":"Afghanistan"}}, {"name":"Algiers","country":{"name":"Algeria"}}]|]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/capital?select=name,country!country_id(name)"
          `shouldRespondWith` [json|[{"name":"Kabul","country":{"name":"Afghanistan"}}, {"name":"Algiers","country":{"name":"Algeria"}}]|]
            { matchHeaders = [matchContentTypeJson]
            }

    describe "computed columns" $ do
      it "computed column on table" $
        get "/items?id=eq.1&select=id,always_true"
          `shouldRespondWith` [json|[{"id":1,"always_true":true}]|]
            { matchHeaders = [matchContentTypeJson]
            }

      it "computed column on rpc" $
        get "/rpc/search?id=1&select=id,always_true"
          `shouldRespondWith` [json|[{"id":1,"always_true":true}]|]
            { matchHeaders = [matchContentTypeJson]
            }

      it "overloaded computed columns on both tables" $ do
        get "/items?id=eq.1&select=id,computed_overload"
          `shouldRespondWith` [json|[{"id":1,"computed_overload":true}]|]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/items2?id=eq.1&select=id,computed_overload"
          `shouldRespondWith` [json|[{"id":1,"computed_overload":true}]|]
            { matchHeaders = [matchContentTypeJson]
            }

      it "overloaded computed column on rpc" $
        get "/rpc/search?id=1&select=id,computed_overload"
          `shouldRespondWith` [json|[{"id":1,"computed_overload":true}]|]
            { matchHeaders = [matchContentTypeJson]
            }

    describe "partitioned tables embedding" $ do
      it "can request a table as parent from a partitioned table" $
        get "/car_models?name=in.(DeLorean,Murcielago)&select=name,year,car_brands(name)&order=name.asc"
          `shouldRespondWith` [json|
            [{"name":"DeLorean","year":1981,"car_brands":{"name":"DMC"}},
             {"name":"Murcielago","year":2001,"car_brands":{"name":"Lamborghini"}}] |]
            { matchHeaders = [matchContentTypeJson]
            }

      it "can request partitioned tables as children from a table" $
        get "/car_brands?select=name,car_models(name,year)&order=name.asc&car_models.order=name.asc"
          `shouldRespondWith` [json|
            [{"name":"DMC","car_models":[{"name":"DeLorean","year":1981}]},
             {"name":"Ferrari","car_models":[{"name":"F310-B","year":1997}]},
             {"name":"Lamborghini","car_models":[{"name":"Murcielago","year":2001},{"name":"Veneno","year":2013}]}] |]
            { matchHeaders = [matchContentTypeJson]
            }

      it "can request tables as children from a partitioned table" $
        get "/car_models?name=in.(DeLorean,F310-B)&select=name,year,car_racers(name)&order=name.asc"
          `shouldRespondWith` [json|
            [{"name":"DeLorean","year":1981,"car_racers":[]},
             {"name":"F310-B","year":1997,"car_racers":[{"name":"Michael Schumacher"}]}] |]
            { matchHeaders = [matchContentTypeJson]
            }

      it "can request a partitioned table as parent from a table" $
        get "/car_racers?select=name,car_models(name,year)&order=name.asc"
          `shouldRespondWith` [json|
            [{"name":"Alain Prost","car_models":null},
             {"name":"Michael Schumacher","car_models":{"name":"F310-B","year":1997}}] |]
            { matchHeaders = [matchContentTypeJson]
            }

      it "can request partitioned tables as children from a partitioned table" $
        get "/car_models?name=in.(DeLorean,Murcielago,Veneno)&select=name,year,car_model_sales(date,quantity)&order=name.asc"
          `shouldRespondWith` [json|
            [{"name":"DeLorean","year":1981,"car_model_sales":[{"date":"2021-01-14","quantity":7},{"date":"2021-01-15","quantity":9}]},
             {"name":"Murcielago","year":2001,"car_model_sales":[{"date":"2021-02-11","quantity":1},{"date":"2021-02-12","quantity":3}]},
             {"name":"Veneno","year":2013,"car_model_sales":[]}] |]
            { matchHeaders = [matchContentTypeJson]
            }

      it "can request a partitioned table as parent from a partitioned table" $ do
        get "/car_model_sales?date=in.(2021-01-15,2021-02-11)&select=date,quantity,car_models(name,year)&order=date.asc"
          `shouldRespondWith` [json|
            [{"date":"2021-01-15","quantity":9,"car_models":{"name":"DeLorean","year":1981}},
             {"date":"2021-02-11","quantity":1,"car_models":{"name":"Murcielago","year":2001}}] |]
            { matchHeaders = [matchContentTypeJson]
            }

      it "can request many to many relationships between partitioned tables ignoring the intermediate table partitions" $
        get "/car_models?select=name,year,car_dealers(name,city)&order=name.asc&limit=4"
          `shouldRespondWith` [json|
            [{"name":"DeLorean","year":1981,"car_dealers":[{"name":"Springfield Cars S.A.","city":"Springfield"}]},
             {"name":"F310-B","year":1997,"car_dealers":[]},
             {"name":"Murcielago","year":2001,"car_dealers":[{"name":"The Best Deals S.A.","city":"Franklin"}]},
             {"name":"Veneno","year":2013,"car_dealers":[]}] |]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }

      it "cannot request partitions as children from a partitioned table" $
        get "/car_models?id=in.(1,2,4)&select=id,name,car_model_sales_202101(id)&order=id.asc"
          `shouldRespondWith` [json|
            {"hint":"Perhaps you meant 'car_model_sales' instead of 'car_model_sales_202101'.",
             "details":"Searched for a foreign key relationship between 'car_models' and 'car_model_sales_202101' in the schema 'test', but no matches were found.",
             "code":"PGRST200",
             "message":"Could not find a relationship between 'car_models' and 'car_model_sales_202101' in the schema cache"} |]
            { matchStatus = 400
            , matchHeaders = [matchContentTypeJson]
            }

      -- we only search for foreign key relationships after checking the
      -- the existence of first table, #3869
      it "table not found error if first table does not exist" $
        get "/car_model_sales_202101?select=id,name,car_models(id,name)&order=id.asc"
          `shouldRespondWith` [json| {"code":"PGRST205","details":null,"hint":null,"message":"Could not find the table 'test.car_model_sales_202101' in the schema cache"} |]
            { matchStatus = 404
            , matchHeaders = [matchContentTypeJson]
            }

      it "cannot request a partition as parent from a partitioned table" $
        get "/car_model_sales?id=in.(1,3,4)&select=id,name,car_models_default(id,name)&order=id.asc"
          `shouldRespondWith` [json|
            {"hint":"Perhaps you meant 'car_models' instead of 'car_models_default'.",
             "details":"Searched for a foreign key relationship between 'car_model_sales' and 'car_models_default' in the schema 'test', but no matches were found.",
             "code":"PGRST200",
             "message":"Could not find a relationship between 'car_model_sales' and 'car_models_default' in the schema cache"} |]
            { matchStatus = 400
            , matchHeaders = [matchContentTypeJson]
            }

      it "table not found error if first table does not exist" $
        get "/car_models_default?select=id,name,car_model_sales(id,name)&order=id.asc"
          `shouldRespondWith` [json| {"code":"PGRST205","details":null,"hint":null,"message":"Could not find the table 'test.car_models_default' in the schema cache"} |]
            { matchStatus = 404
            , matchHeaders = [matchContentTypeJson]
            }

    describe "view embedding" $ do
      it "can detect fk relations through views to tables in the public schema" $
        get "/consumers_view?select=*,orders_view(*)" `shouldRespondWith` 200

      it "can detect fk relations through materialized views to tables in the public schema" $
        get "/materialized_projects?select=*,users(*)" `shouldRespondWith` 200

      it "can request two parents" $
        get "/articleStars?select=createdAt,article:articles(id),user:users(name)&limit=1"
          `shouldRespondWith` [json|[{"createdAt":"2015-12-08T04:22:57.472738","article":{"id": 1},"user":{"name": "Angela Martin"}}]|]

      it "can detect relations in views from exposed schema that are based on tables in private schema and have columns renames" $
        get "/articles?id=eq.1&select=id,articleStars(users(*))"
          `shouldRespondWith` [json|[{"id":1,"articleStars":[{"users":{"id":1,"name":"Angela Martin"}},{"users":{"id":2,"name":"Michael Scott"}},{"users":{"id":3,"name":"Dwight Schrute"}}]}]|]
            { matchHeaders = [matchContentTypeJson]
            }

      it "works when requesting parents and children on views" $
        get "/projects_view?id=eq.1&select=id, name, clients(*), tasks(id, name)"
          `shouldRespondWith` [json|[{"id":1,"name":"Windows 7","clients":{"id":1,"name":"Microsoft"},"tasks":[{"id":1,"name":"Design w7"},{"id":2,"name":"Code w7"}]}]|]
            { matchHeaders = [matchContentTypeJson]
            }

      it "works when requesting parents and children on views with renamed keys" $
        get "/projects_view_alt?t_id=eq.1&select=t_id, name, clients(*), tasks(id, name)"
          `shouldRespondWith` [json|[{"t_id":1,"name":"Windows 7","clients":{"id":1,"name":"Microsoft"},"tasks":[{"id":1,"name":"Design w7"},{"id":2,"name":"Code w7"}]}]|]
            { matchHeaders = [matchContentTypeJson]
            }

      it "detects parent relations when having many views of a private table" $ do
        get "/books?select=title,author:authors(name)&id=eq.5"
          `shouldRespondWith` [json|[ { "title": "Farenheit 451", "author": { "name": "Ray Bradbury" } } ]|]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/forties_books?select=title,author:authors(name)&limit=1"
          `shouldRespondWith` [json|[ { "title": "1984", "author": { "name": "George Orwell" } } ]|]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/fifties_books?select=title,author:authors(name)&limit=1"
          `shouldRespondWith` [json|[ { "title": "The Catcher in the Rye", "author": { "name": "J.D. Salinger" } } ]|]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/sixties_books?select=title,author:authors(name)&limit=1"
          `shouldRespondWith` [json|[ { "title": "To Kill a Mockingbird", "author": { "name": "Harper Lee" } } ]|]
            { matchHeaders = [matchContentTypeJson]
            }

      it "can detect fk relations through multiple views recursively when all views are in api schema" $ do
        get "/consumers_view_view?select=*,orders_view(*)" `shouldRespondWith` 200

      it "works with views that have subselects" $
        get "/authors_books_number?select=*,books(title)&id=eq.1"
          `shouldRespondWith` [json|[ {"id":1, "name":"George Orwell","num_in_forties":1,"num_in_fifties":0,"num_in_sixties":0,"num_in_all_decades":1,
                   "books":[{"title":"1984"}]} ]|]
            { matchHeaders = [matchContentTypeJson]
            }

      it "works with views that have case subselects" $
        get "/authors_have_book_in_decade?select=*,books(title)&id=eq.3"
          `shouldRespondWith` [json|[ {"id":3,"name":"Antoine de Saint-Exupéry","has_book_in_forties":true,"has_book_in_fifties":false,"has_book_in_sixties":false,
                   "books":[{"title":"The Little Prince"}]} ]|]
            { matchHeaders = [matchContentTypeJson]
            }

      it "works with views that have subselect in the FROM clause" $
        get "/forties_and_fifties_books?select=title,first_publisher,author:authors(name)&id=eq.1"
          `shouldRespondWith` [json|[{"title":"1984","first_publisher":"Secker & Warburg","author":{"name":"George Orwell"}}]|]
            { matchHeaders = [matchContentTypeJson]
            }

      it "works with views that have subselects in a function call" $
        get "/authors_have_book_in_decade2?select=*,books(title)&id=eq.3"
          `shouldRespondWith` [json|[ {"id":3,"name":"Antoine de Saint-Exupéry","has_book_in_forties":true,"has_book_in_fifties":false,
                     "has_book_in_sixties":false,"books":[{"title":"The Little Prince"}]} ]|]

      it "works with views that have CTE" $
        get "/odd_years_publications?select=title,publication_year,first_publisher,author:authors(name)&id=in.(1,2,3)"
          `shouldRespondWith` [json|[
            {"title":"1984","publication_year":1949,"first_publisher":"Secker & Warburg","author":{"name":"George Orwell"}},
            {"title":"The Diary of a Young Girl","publication_year":1947,"first_publisher":"Contact Publishing","author":{"name":"Anne Frank"}},
            {"title":"The Little Prince","publication_year":1947,"first_publisher":"Reynal & Hitchcock","author":{"name":"Antoine de Saint-Exupéry"}} ]|]
            { matchHeaders = [matchContentTypeJson]
            }

      it "works when having a capitalized table name and camelCase fk column" $
        get "/foos?select=*,bars(*)" `shouldRespondWith` 200

      it "works when embedding a view with a table that has a long compound pk" $ do
        get "/player_view?select=id,contract(purchase_price)&id=in.(1,3,5,7)"
          `shouldRespondWith` [json|
            [{"id":1,"contract":[{"purchase_price":10}]},
             {"id":3,"contract":[{"purchase_price":30}]},
             {"id":5,"contract":[{"purchase_price":50}]},
             {"id":7,"contract":[]}] |]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/contract?select=tournament,player_view(first_name)&limit=3"
          `shouldRespondWith` [json|
            [{"tournament":"tournament_1","player_view":{"first_name":"first_name_1"}},
             {"tournament":"tournament_2","player_view":{"first_name":"first_name_2"}},
             {"tournament":"tournament_3","player_view":{"first_name":"first_name_3"}}] |]
            { matchHeaders = [matchContentTypeJson]
            }

      it "works when embedding a view with a view that referes to a table that has a long compound pk" $ do
        get "/player_view?select=id,contract_view(purchase_price)&id=in.(1,3,5,7)"
          `shouldRespondWith` [json|
            [{"id":1,"contract_view":[{"purchase_price":10}]},
             {"id":3,"contract_view":[{"purchase_price":30}]},
             {"id":5,"contract_view":[{"purchase_price":50}]},
             {"id":7,"contract_view":[]}] |]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/contract_view?select=tournament,player_view(first_name)&limit=3"
          `shouldRespondWith` [json|
            [{"tournament":"tournament_1","player_view":{"first_name":"first_name_1"}},
             {"tournament":"tournament_2","player_view":{"first_name":"first_name_2"}},
             {"tournament":"tournament_3","player_view":{"first_name":"first_name_3"}}] |]
            { matchHeaders = [matchContentTypeJson]
            }

      it "works when embedding two views that refer to tables with different column ordering" $
        get "/v1?select=v2(*)" `shouldRespondWith` 200

      it "can embed a view that has group by" $
        get "/projects_count_grouped_by?select=number_of_projects,client:clients(name)&order=number_of_projects"
          `shouldRespondWith` [json|
            [{"number_of_projects":1,"client":null},
             {"number_of_projects":2,"client":{"name":"Microsoft"}},
             {"number_of_projects":2,"client":{"name":"Apple"}}] |]
            { matchHeaders = [matchContentTypeJson]
            }

      it "can embed a view that has a subselect containing a select in a where" $
        get "/authors_w_entities?select=name,entities,books(title)&id=eq.1"
          `shouldRespondWith` [json| [{"name":"George Orwell","entities":[3, 4],"books":[{"title":"1984"}]}] |]
            { matchHeaders = [matchContentTypeJson]
            }

      it "works with one to one relationships" $ do
        get "/students_view?select=name,students_info(address)"
          `shouldRespondWith` [json| [{"name":"John Doe","students_info":{"address":"Street 1"}}, {"name":"Jane Doe","students_info":{"address":"Street 2"}}] |]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/students_view?select=name,students_info_view(address)"
          `shouldRespondWith` [json| [{"name":"John Doe","students_info_view":{"address":"Street 1"}}, {"name":"Jane Doe","students_info_view":{"address":"Street 2"}}] |]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/students_info_view?select=address,students(name)"
          `shouldRespondWith` [json| [{"address":"Street 1","students":{"name":"John Doe"}}, {"address":"Street 2","students":{"name":"Jane Doe"}}] |]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/students_info_view?select=address,students_view(name)"
          `shouldRespondWith` [json| [{"address":"Street 1","students_view":{"name":"John Doe"}}, {"address":"Street 2","students_view":{"name":"Jane Doe"}}] |]
            { matchHeaders = [matchContentTypeJson]
            }

    describe "aliased embeds" $ do
      it "works with child relation" $
        get "/space?select=id,zones:zone(id,name),stores:zone(id,name)&zones.zone_type_id=eq.2&stores.zone_type_id=eq.3"
          `shouldRespondWith` [json|[
            { "id":1,
              "zones": [ {"id":1,"name":"zone 1"}, {"id":2,"name":"zone 2"}],
              "stores": [ {"id":3,"name":"store 3"}, {"id":4,"name":"store 4"}]}
          ]|]
            { matchHeaders = [matchContentTypeJson]
            }

      it "works with many to many relation" $
        get "/users?select=id,designTasks:tasks(id,name),codeTasks:tasks(id,name)&designTasks.name=like.*Design*&codeTasks.name=like.*Code*"
          `shouldRespondWith` [json|[
             { "id":1,
               "designTasks":[ { "id":1, "name":"Design w7" }, { "id":3, "name":"Design w10" } ],
               "codeTasks":[ { "id":2, "name":"Code w7" }, { "id":4, "name":"Code w10" } ] },
             { "id":2,
               "designTasks":[ { "id":5, "name":"Design IOS" }, { "id":7, "name":"Design OSX" } ],
               "codeTasks":[ { "id":6, "name":"Code IOS" } ] },
             { "id":3,
               "designTasks":[ { "id":1, "name":"Design w7" }, { "id":5, "name":"Design IOS" } ],
               "codeTasks":[ ] }
          ]|]
            { matchHeaders = [matchContentTypeJson]
            }

      it "works with an aliased child plus non aliased child" $
        get "/projects?select=id,name,designTasks:tasks(name,users(id,name))&designTasks.name=like.*Design*&designTasks.users.id=in.(1,2)"
          `shouldRespondWith` [json|[
            {
              "id":1, "name":"Windows 7",
              "designTasks":[ { "name":"Design w7", "users":[ { "id":1, "name":"Angela Martin" } ] } ] },
            {
              "id":2, "name":"Windows 10",
              "designTasks":[ { "name":"Design w10", "users":[ { "id":1, "name":"Angela Martin" } ] } ] },
            {
              "id":3, "name":"IOS",
              "designTasks":[ { "name":"Design IOS", "users":[ { "id":2, "name":"Michael Scott" } ] } ] },
            {
              "id":4, "name":"OSX",
              "designTasks":[ { "name":"Design OSX", "users":[ { "id":2, "name":"Michael Scott" } ] } ] },
            {
              "id":5, "name":"Orphan",
              "designTasks":[ ] }
          ]|]
            { matchHeaders = [matchContentTypeJson]
            }

      it "works with two aliased children embeds plus and/or" $
        get "/entities?select=id,children:child_entities(id,gChildren:grandchild_entities(id))&children.and=(id.in.(1,2,3))&children.gChildren.or=(id.eq.1,id.eq.2)"
          `shouldRespondWith` [json|[
            { "id":1,
              "children":[
                {"id":1,"gChildren":[{"id":1}, {"id":2}]},
                {"id":2,"gChildren":[]}]},
            { "id":2,
              "children":[
                {"id":3,"gChildren":[]}]},
            { "id":3,"children":[]},
            { "id":4,"children":[]}
          ]|]
            { matchHeaders = [matchContentTypeJson]
            }

  describe "ordering response" $ do
    it "by a column asc" $
      get "/items?id=lte.2&order=id.asc"
        `shouldRespondWith` [json| [{"id":1},{"id":2}] |]
          { matchStatus = 200
          , matchHeaders = ["Content-Range" <:> "0-1/*"]
          }

    it "by a column desc" $
      get "/items?id=lte.2&order=id.desc"
        `shouldRespondWith` [json| [{"id":2},{"id":1}] |]
          { matchStatus = 200
          , matchHeaders = ["Content-Range" <:> "0-1/*"]
          }

    it "by a column with nulls first" $
      get "/no_pk?order=a.nullsfirst"
        `shouldRespondWith` [json| [{"a":null,"b":null},
                              {"a":"1","b":"0"},
                              {"a":"2","b":"0"}
                              ] |]
          { matchStatus = 200
          , matchHeaders = ["Content-Range" <:> "0-2/*"]
          }

    it "by a column asc with nulls last" $
      get "/no_pk?order=a.asc.nullslast"
        `shouldRespondWith` [json| [{"a":"1","b":"0"},
                              {"a":"2","b":"0"},
                              {"a":null,"b":null}] |]
          { matchStatus = 200
          , matchHeaders = ["Content-Range" <:> "0-2/*"]
          }

    it "by a column desc with nulls first" $
      get "/no_pk?order=a.desc.nullsfirst"
        `shouldRespondWith` [json| [{"a":null,"b":null},
                              {"a":"2","b":"0"},
                              {"a":"1","b":"0"}] |]
          { matchStatus = 200
          , matchHeaders = ["Content-Range" <:> "0-2/*"]
          }

    it "by a column desc with nulls last" $
      get "/no_pk?order=a.desc.nullslast"
        `shouldRespondWith` [json| [{"a":"2","b":"0"},
                              {"a":"1","b":"0"},
                              {"a":null,"b":null}] |]
          { matchStatus = 200
          , matchHeaders = ["Content-Range" <:> "0-2/*"]
          }

    it "by two columns with nulls and direction specified" $
      get "/projects?select=client_id,id,name&order=client_id.desc.nullslast,id.desc"
        `shouldRespondWith` [json|
          [{"client_id":2,"id":4,"name":"OSX"},
           {"client_id":2,"id":3,"name":"IOS"},
           {"client_id":1,"id":2,"name":"Windows 10"},
           {"client_id":1,"id":1,"name":"Windows 7"},
           {"client_id":null,"id":5,"name":"Orphan"}]
        |]
          { matchStatus = 200
          , matchHeaders = ["Content-Range" <:> "0-4/*"]
          }

    it "by a column with no direction or nulls specified" $
      get "/items?id=lte.2&order=id"
        `shouldRespondWith` [json| [{"id":1},{"id":2}] |]
          { matchStatus = 200
          , matchHeaders = ["Content-Range" <:> "0-1/*"]
          }

    it "without other constraints" $
      get "/items?order=id.asc" `shouldRespondWith` 200

    it "ordering embeded entities" $
      get "/projects?id=eq.1&select=id, name, tasks(id, name)&tasks.order=name.asc"
        `shouldRespondWith` [json|[{"id":1,"name":"Windows 7","tasks":[{"id":2,"name":"Code w7"},{"id":1,"name":"Design w7"}]}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "ordering embeded entities with alias" $
      get "/projects?id=eq.1&select=id, name, the_tasks:tasks(id, name)&the_tasks.order=name.asc"
        `shouldRespondWith` [json|[{"id":1,"name":"Windows 7","the_tasks":[{"id":2,"name":"Code w7"},{"id":1,"name":"Design w7"}]}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "ordering embeded entities, two levels" $
      get "/projects?id=eq.1&select=id, name, tasks(id, name, users(id, name))&tasks.order=name.asc&tasks.users.order=name.desc"
        `shouldRespondWith` [json|[{"id":1,"name":"Windows 7","tasks":[{"id":2,"name":"Code w7","users":[{"id":1,"name":"Angela Martin"}]},{"id":1,"name":"Design w7","users":[{"id":3,"name":"Dwight Schrute"},{"id":1,"name":"Angela Martin"}]}]}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "ordering embeded parents does not break things" $
      get "/projects?id=eq.1&select=id, name, clients(id, name)&clients.order=name.asc"
        `shouldRespondWith` [json|[{"id":1,"name":"Windows 7","clients":{"id":1,"name":"Microsoft"}}]|]

    it "gives meaningful error message on bad syntax" $ do
      get "/items?order=id.asc.nullslasttt"
        `shouldRespondWith` [json|{"details":"unexpected 't' expecting \",\" or end of input","message":"\"failed to parse order (id.asc.nullslasttt)\" (line 1, column 17)","code":"PGRST100","hint":null}|]
          { matchStatus = 400
          , matchHeaders =
              [ "Content-Length" <:> "169"
              , matchContentTypeJson
              ]
          }

    it "filters, orders and limits aliased embeded entities using the target name" $ do
      let pgrstVer = "PostgRESTv" <> BS.filter (/= ' ') prettyVersion
      get "/projects?id=eq.1&select=id, name, the_tasks:tasks(id, name)&tasks.name=like.Code*&tasks.order=name.asc&tasks.limit=1"
        `shouldRespondWith` [json|[{"id":1,"name":"Windows 7","the_tasks":[{"id":2,"name":"Code w7"}]}]|]
          { matchHeaders = ["Warning" <:> ("299 " <> pgrstVer <> " \"Embedded resource was referenced by relation name even though it has an alias. This is deprecated and will stop working in a future release. Update `tasks` to `the_tasks` in query string filters, orders or limits.\"")]
          }

  describe "Accept headers" $ do
    it "should respond an unknown accept type with 406" $
      request
        methodGet
        "/simple_pk"
        (acceptHdrs "text/unknowntype")
        ""
        `shouldRespondWith` [json|{"message":"None of these media types are available: text/unknowntype","code":"PGRST107","details":null,"hint":null}|]
          { matchStatus = 406
          , matchHeaders =
              [ "Content-Length" <:> "116"
              , matchContentTypeJson
              ]
          }

    it "should respond correctly to */* in accept header" $
      request
        methodGet
        "/simple_pk"
        (acceptHdrs "*/*")
        ""
        `shouldRespondWith` 200

    it "*/* should rescue an unknown type" $
      request
        methodGet
        "/simple_pk"
        (acceptHdrs "text/unknowntype, */*")
        ""
        `shouldRespondWith` 200

    it "specific available preference should override */*" $ do
      r <-
        request
          methodGet
          "/simple_pk"
          (acceptHdrs "text/csv, */*")
          ""
      liftIO $ do
        let respHeaders = simpleHeaders r
        respHeaders
          `shouldSatisfy` matchHeader
            "Content-Type"
            "text/csv; charset=utf-8"

    it "honors client preference even when opposite of server preference" $ do
      r <-
        request
          methodGet
          "/simple_pk"
          (acceptHdrs "text/csv, application/json")
          ""
      liftIO $ do
        let respHeaders = simpleHeaders r
        respHeaders
          `shouldSatisfy` matchHeader
            "Content-Type"
            "text/csv; charset=utf-8"

    it "should respond correctly to multiple types in accept header" $
      request
        methodGet
        "/simple_pk"
        (acceptHdrs "text/unknowntype, text/csv")
        ""
        `shouldRespondWith` 200

    it "should respond with CSV to 'text/csv' request" $
      request
        methodGet
        "/simple_pk?order=k.desc"
        (acceptHdrs "text/csv; version=1")
        ""
        `shouldRespondWith` "k,extra\nxyyx,u\nxYYx,v"
          { matchStatus = 200
          , matchHeaders =
              [ "Content-Type" <:> "text/csv; charset=utf-8"
              , "Content-Length" <:> "21"
              ]
          }

  describe "Canonical location" $ do
    it "Sets Content-Location with alphabetized params" $
      get "/no_pk?b=eq.1&a=eq.1"
        `shouldRespondWith` "[]"
          { matchStatus = 200
          , matchHeaders = ["Content-Location" <:> "/no_pk?a=eq.1&b=eq.1"]
          }

    it "Omits question mark when there are no params" $ do
      r <- get "/simple_pk"
      liftIO $ do
        let respHeaders = simpleHeaders r
        respHeaders
          `shouldSatisfy` matchHeader
            "Content-Location"
            "/simple_pk"

  describe "weird requests" $ do
    it "can query as normal" $ do
      get "/Escap3e;"
        `shouldRespondWith` [json| [{"so6meIdColumn":1},{"so6meIdColumn":2},{"so6meIdColumn":3},{"so6meIdColumn":4},{"so6meIdColumn":5}] |]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/ghostBusters"
        `shouldRespondWith` [json| [{"escapeId":1},{"escapeId":3},{"escapeId":5}] |]
          { matchHeaders = [matchContentTypeJson]
          }

    it "fails if an operator is not given" $
      get "/ghostBusters?id=0"
        `shouldRespondWith` [json| {"code":"PGRST100","details":"unexpected \"0\" expecting \"not\" or operator (eq, gt, ...)","hint":null,"message":"\"failed to parse filter (0)\" (line 1, column 1)"} |]
          { matchStatus = 400
          , matchHeaders = [matchContentTypeJson]
          }

    it "will embed a collection" $
      get "/Escap3e;?select=ghostBusters(*)"
        `shouldRespondWith` [json| [{"ghostBusters":[{"escapeId":1}]},{"ghostBusters":[]},{"ghostBusters":[{"escapeId":3}]},{"ghostBusters":[]},{"ghostBusters":[{"escapeId":5}]}] |]
          { matchHeaders = [matchContentTypeJson]
          }

    it "will select and filter a column that has spaces" $
      get "/Server%20Today?select=Just%20A%20Server%20Model&Just%20A%20Server%20Model=like.*91*"
        `shouldRespondWith` [json|[
          {"Just A Server Model":" IBM,9113-550 (P5-550)"},
          {"Just A Server Model":" IBM,9113-550 (P5-550)"},
          {"Just A Server Model":" IBM,9131-52A (P5-52A)"},
          {"Just A Server Model":" IBM,9133-55A (P5-55A)"}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "will select and filter a quoted column that has PostgREST reserved characters" $
      get "/pgrst_reserved_chars?select=%22:arr-%3Eow::cast%22,%22(inside,parens)%22,%22a.dotted.column%22,%22%20%20col%20%20w%20%20space%20%20%22&%22*id*%22=eq.1"
        `shouldRespondWith` [json|[{":arr->ow::cast":" arrow-1 ","(inside,parens)":" parens-1 ","a.dotted.column":" dotted-1 ","  col  w  space  ":" space-1"}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "will select and filter a column that has dollars in(without double quoting)" $
      get "/do$llar$s?select=a$num$&a$num$=eq.100"
        `shouldRespondWith` [json|[{"a$num$":100}]|]
          { matchHeaders = [matchContentTypeJson]
          }

  describe "values with quotes in IN and NOT IN" $ do
    it "succeeds when only quoted values are present" $ do
      get "/w_or_wo_comma_names?name=in.(\"Hebdon, John\")"
        `shouldRespondWith` [json| [{"name":"Hebdon, John"}] |]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/w_or_wo_comma_names?name=in.(\"Hebdon, John\",\"Williams, Mary\",\"Smith, Joseph\")"
        `shouldRespondWith` [json| [{"name":"Hebdon, John"},{"name":"Williams, Mary"},{"name":"Smith, Joseph"}] |]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/w_or_wo_comma_names?name=not.in.(\"Hebdon, John\",\"Williams, Mary\",\"Smith, Joseph\")&limit=3"
        `shouldRespondWith` [json| [ { "name": "David White" }, { "name": "Larry Thompson" }, { "name": "Double O Seven(007)" }] |]
          { matchHeaders = [matchContentTypeJson]
          }

    it "succeeds w/ and w/o quoted values" $ do
      get "/w_or_wo_comma_names?name=in.(David White,\"Hebdon, John\")"
        `shouldRespondWith` [json| [{"name":"Hebdon, John"},{"name":"David White"}] |]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/w_or_wo_comma_names?name=not.in.(\"Hebdon, John\",Larry Thompson,\"Smith, Joseph\")&limit=3"
        `shouldRespondWith` [json| [ { "name": "Williams, Mary" }, { "name": "David White" }, { "name": "Double O Seven(007)" }] |]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/w_or_wo_comma_names?name=in.(\"Double O Seven(007)\")"
        `shouldRespondWith` [json| [{"name":"Double O Seven(007)"}] |]
          { matchHeaders = [matchContentTypeJson]
          }

    context "escaped chars" $ do
      it "accepts escaped double quotes" $
        get "/w_or_wo_comma_names?name=in.(\"Double\\\"Quote\\\"McGraw\\\"\")"
          `shouldRespondWith` [json| [ { "name": "Double\"Quote\"McGraw\"" } ] |]
            { matchHeaders = [matchContentTypeJson]
            }

      it "accepts escaped backslashes" $ do
        get "/w_or_wo_comma_names?name=in.(\"\\\\\")"
          `shouldRespondWith` [json| [{ "name": "\\" }] |]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/w_or_wo_comma_names?name=in.(\"/\\\\Slash/\\\\Beast/\\\\\")"
          `shouldRespondWith` [json| [ { "name": "/\\Slash/\\Beast/\\" } ] |]
            { matchHeaders = [matchContentTypeJson]
            }

      it "passes any escaped char as the same char" $
        get "/w_or_wo_comma_names?name=in.(\"D\\a\\vid W\\h\\ite\")"
          `shouldRespondWith` [json| [{ "name": "David White" }] |]
            { matchHeaders = [matchContentTypeJson]
            }

  describe "IN values without quotes" $ do
    it "accepts single double quotes as values" $ do
      get "/w_or_wo_comma_names?name=in.(\")"
        `shouldRespondWith` [json| [{ "name": "\"" }] |]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/w_or_wo_comma_names?name=in.(Double\"Quote\"McGraw\")"
        `shouldRespondWith` [json| [ { "name": "Double\"Quote\"McGraw\"" } ] |]
          { matchHeaders = [matchContentTypeJson]
          }

    it "accepts backslashes as values" $ do
      get "/w_or_wo_comma_names?name=in.(\\)"
        `shouldRespondWith` [json| [{ "name": "\\" }] |]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/w_or_wo_comma_names?name=in.(/\\Slash/\\Beast/\\)"
        `shouldRespondWith` [json| [ { "name": "/\\Slash/\\Beast/\\" } ] |]
          { matchHeaders = [matchContentTypeJson]
          }

  describe "IN and NOT IN empty set" $ do
    context "returns an empty result for IN when no value is present" $ do
      it "works for integer" $
        get "/items_with_different_col_types?int_data=in.()"
          `shouldRespondWith` [json| [] |]{matchHeaders = [matchContentTypeJson]}
      it "works for text" $
        get "/items_with_different_col_types?text_data=in.()"
          `shouldRespondWith` [json| [] |]{matchHeaders = [matchContentTypeJson]}
      it "works for bool" $
        get "/items_with_different_col_types?bool_data=in.()"
          `shouldRespondWith` [json| [] |]{matchHeaders = [matchContentTypeJson]}
      it "works for bytea" $
        get "/items_with_different_col_types?bin_data=in.()"
          `shouldRespondWith` [json| [] |]{matchHeaders = [matchContentTypeJson]}
      it "works for char" $
        get "/items_with_different_col_types?char_data=in.()"
          `shouldRespondWith` [json| [] |]{matchHeaders = [matchContentTypeJson]}
      it "works for date" $
        get "/items_with_different_col_types?date_data=in.()"
          `shouldRespondWith` [json| [] |]{matchHeaders = [matchContentTypeJson]}
      it "works for real" $
        get "/items_with_different_col_types?real_data=in.()"
          `shouldRespondWith` [json| [] |]{matchHeaders = [matchContentTypeJson]}
      it "works for time" $
        get "/items_with_different_col_types?time_data=in.()"
          `shouldRespondWith` [json| [] |]{matchHeaders = [matchContentTypeJson]}

    it "returns all results for not.in when no value is present" $
      get "/items_with_different_col_types?int_data=not.in.()&select=int_data"
        `shouldRespondWith` [json| [{int_data: 1}] |]{matchHeaders = [matchContentTypeJson]}

    it "returns an empty result ignoring spaces" $
      get "/items_with_different_col_types?int_data=in.(    )"
        `shouldRespondWith` [json| [] |]{matchHeaders = [matchContentTypeJson]}

    it "only returns an empty result set if the in value is empty" $
      get "/items_with_different_col_types?int_data=in.( ,3,4)"
        `shouldRespondWith` [json| {"hint":null,"details":null,"code":"22P02","message":"invalid input syntax for type integer: \"\""} |]
          { matchStatus = 400
          , matchHeaders = [matchContentTypeJson]
          }

  describe "Embedding when column name = table name" $ do
    it "works with child embeds" $
      get "/being?select=*,descendant(*)&limit=1"
        `shouldRespondWith` [json|[{"being":1,"descendant":[{"descendant":1,"being":1},{"descendant":2,"being":1},{"descendant":3,"being":1}]}]|]
          { matchHeaders = [matchContentTypeJson]
          }
    it "works with many to many embeds" $
      get "/being?select=*,part(*)&limit=1"
        `shouldRespondWith` [json|[{"being":1,"part":[{"part":1}]}]|]
          { matchHeaders = [matchContentTypeJson]
          }

  describe "Foreign table" $ do
    it "can be queried by using regular filters" $
      get "/projects_dump?id=in.(1,2,3)"
        `shouldRespondWith` [json| [{"id":1,"name":"Windows 7","client_id":1}, {"id":2,"name":"Windows 10","client_id":1}, {"id":3,"name":"IOS","client_id":2}]|]
          { matchHeaders = [matchContentTypeJson]
          }
    it "can be queried with select, order and limit" $
      get "/projects_dump?select=id,name&order=id.desc&limit=3"
        `shouldRespondWith` [json| [{"id":5,"name":"Orphan"}, {"id":4,"name":"OSX"}, {"id":3,"name":"IOS"}] |]
          { matchHeaders = [matchContentTypeJson]
          }

  it "cannot use ltree(in public schema) extension operators if no extra search path added" $
    get "/ltree_sample?path=cd.Top.Science.Astronomy" `shouldRespondWith` 400

  context "VIEW that has a source FK based on a UNIQUE key" $
    it "can be embedded" $
      get "/referrals?select=site,link:pages(url)"
        `shouldRespondWith` [json| [
         {"site":"github.com",     "link":{"url":"http://postgrest.org/en/v6.0/api.html"}},
         {"site":"hub.docker.com", "link":{"url":"http://postgrest.org/en/v6.0/admin.html"}}
        ]|]
          { matchHeaders = [matchContentTypeJson]
          }

  it "shouldn't produce a Content-Profile header since only a single schema is exposed" $ do
    r <- get "/items"
    liftIO $ do
      let respHeaders = simpleHeaders r
      respHeaders `shouldSatisfy` noProfileHeader

  context "empty embed" $ do
    it "works on a many-to-one relationship" $ do
      get "/projects?select=id,name,clients()"
        `shouldRespondWith` [json| [
          {"id":1,"name":"Windows 7"},
          {"id":2,"name":"Windows 10"},
          {"id":3,"name":"IOS"},
          {"id":4,"name":"OSX"},
          {"id":5,"name":"Orphan"}]|]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/projects?select=id,name,clients!inner()&clients.id=eq.2"
        `shouldRespondWith` [json|[
          {"id":3,"name":"IOS"},
          {"id":4,"name":"OSX"}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "works on a one-to-many relationship" $ do
      get "/clients?select=id,name,projects()"
        `shouldRespondWith` [json| [{"id":1,"name":"Microsoft"}, {"id":2,"name":"Apple"}]|]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/clients?select=id,name,projects!inner()&projects.name=eq.IOS"
        `shouldRespondWith` [json|[{"id":2,"name":"Apple"}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "works on a many-to-many relationship" $ do
      get "/users?select=*,tasks!inner()"
        `shouldRespondWith` [json| [{"id":1,"name":"Angela Martin"}, {"id":2,"name":"Michael Scott"}, {"id":3,"name":"Dwight Schrute"}]|]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/users?select=*,tasks!inner()&tasks.id=eq.3"
        `shouldRespondWith` [json|[{"id":1,"name":"Angela Martin"}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "works on nested relationships" $ do
      get "/users?select=*,users_tasks(tasks(projects()))"
        `shouldRespondWith` [json| [{"id":1,"name":"Angela Martin"}, {"id":2,"name":"Michael Scott"}, {"id":3,"name":"Dwight Schrute"}]|]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/users?select=*,users_tasks!inner(tasks!inner(projects()))&users_tasks.tasks.id=eq.3"
        `shouldRespondWith` [json| [{"id":1,"name":"Angela Martin"}]|]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/users?select=*,tasks(projects(clients()),users_tasks())"
        `shouldRespondWith` [json| [{"id":1,"name":"Angela Martin"}, {"id":2,"name":"Michael Scott"}, {"id":3,"name":"Dwight Schrute"}]|]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/users?select=*,tasks!inner(projects(clients()),users_tasks(),name)&tasks.id=eq.3"
        `shouldRespondWith` [json| [{"id":1,"name":"Angela Martin","tasks":[{"name": "Design w10"}]}]|]
          { matchHeaders = [matchContentTypeJson]
          }

  context "empty root select" $
    it "gives all columns" $ do
      get "/projects?select="
        `shouldRespondWith` [json|[
          {"id":1,"name":"Windows 7","client_id":1},
          {"id":2,"name":"Windows 10","client_id":1},
          {"id":3,"name":"IOS","client_id":2},
          {"id":4,"name":"OSX","client_id":2},
          {"id":5,"name":"Orphan","client_id":null}]|]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/rpc/getallprojects?select="
        `shouldRespondWith` [json|[
          {"id":1,"name":"Windows 7","client_id":1},
          {"id":2,"name":"Windows 10","client_id":1},
          {"id":3,"name":"IOS","client_id":2},
          {"id":4,"name":"OSX","client_id":2},
          {"id":5,"name":"Orphan","client_id":null}]|]
          { matchHeaders = [matchContentTypeJson]
          }

  context "any/all quantifiers" $ do
    it "works with the eq operator" $
      get "/projects?id=eq(any).{3,4,5}"
        `shouldRespondWith` [json|[
          {"id":3,"name":"IOS","client_id":2},
          {"id":4,"name":"OSX","client_id":2},
          {"id":5,"name":"Orphan","client_id":null}
        ]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "works with the gt/gte operator" $ do
      get "/projects?id=gt(all).{4,3}"
        `shouldRespondWith` [json|[{"id":5,"name":"Orphan","client_id":null}]|]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/projects?id=gte(all).{4,3}"
        `shouldRespondWith` [json|[{"id":4,"name":"OSX","client_id":2}, {"id":5,"name":"Orphan","client_id":null}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "works with the lt/lte operator" $ do
      get "/projects?id=lt(all).{4,3}"
        `shouldRespondWith` [json|[{"id":1,"name":"Windows 7","client_id":1}, {"id":2,"name":"Windows 10","client_id":1}]|]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/projects?id=lte(all).{4,3}"
        `shouldRespondWith` [json|[{"id":1,"name":"Windows 7","client_id":1}, {"id":2,"name":"Windows 10","client_id":1}, {"id":3,"name":"IOS","client_id":2}]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "works with the like/ilike operator" $ do
      get "/articles?body=like(any).{%plan%,%brain%}&select=id"
        `shouldRespondWith` [json|[ {"id":1}, {"id":2} ]|]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/articles?body=ilike(all).{%plan%,%greatness%}&select=id"
        `shouldRespondWith` [json|[ {"id":1} ]|]
          { matchHeaders = [matchContentTypeJson]
          }

    it "works with the match/imatch operator" $ do
      get "/articles?body=match(any).{stop,thing}&select=id"
        `shouldRespondWith` [json|[{"id":1}]|]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/articles?body=imatch(any).{stop,thing}&select=id"
        `shouldRespondWith` [json|[{"id":1}, {"id":2}]|]
          { matchHeaders = [matchContentTypeJson]
          }

  describe "Data representations for customisable value formatting and parsing" $ do
    it "formats a single column" $
      get "/datarep_todos?select=id,label_color&id=lt.4"
        `shouldRespondWith` [json| [{"id":1,"label_color":"#000000"},{"id":2,"label_color":"#000100"},{"id":3,"label_color":"#01E240"}] |]
          { matchHeaders = [matchContentTypeJson]
          }
    it "formats two columns with different formatters" $
      get "/datarep_todos?select=id,label_color,due_at&id=lt.4"
        `shouldRespondWith` [json| [{"id":1,"label_color":"#000000","due_at":"2018-01-02T00:00:00Z"},{"id":2,"label_color":"#000100","due_at":"2018-01-03T00:00:00Z"},{"id":3,"label_color":"#01E240","due_at":"2018-01-01T14:12:34.123456Z"}] |]
          { matchHeaders = [matchContentTypeJson]
          }
    it "fails in some reasonable way when selecting fields that don't exist" $
      get "/datarep_todos?select=id,label_color,banana"
        `shouldRespondWith` [json| {"code":"42703","details":null,"hint":null,"message":"column datarep_todos.banana does not exist"} |]
          { matchStatus = 400
          , matchHeaders =
              [ "Content-Length" <:> "98"
              , matchContentTypeJson
              ]
          }
    it "formats columns in views including computed columns" $
      get "/datarep_todos_computed?select=id,label_color,dark_color"
        `shouldRespondWith` [json| [
          {"id":1, "label_color":"#000000", "dark_color":"#000000"},
          {"id":2, "label_color":"#000100", "dark_color":"#000080"},
          {"id":3, "label_color":"#01E240", "dark_color":"#00F120"},
          {"id":4, "label_color":"", "dark_color":""}
        ] |]
          { matchHeaders = [matchContentTypeJson]
          }
    it "formats and allows rename" $
      get "/datarep_todos?select=id,clr:label_color&id=lt.4"
        `shouldRespondWith` [json| [{"id":1,"clr":"#000000"},{"id":2,"clr":"#000100"},{"id":3,"clr":"#01E240"}] |]
          { matchHeaders = [matchContentTypeJson]
          }
    it "formats, renames and allows manual casting on top" $
      get "/datarep_todos?select=id,clr:label_color::text&id=lt.4"
        `shouldRespondWith` [json| [{"id":1,"clr":"\"#000000\""},{"id":2,"clr":"\"#000100\""},{"id":3,"clr":"\"#01E240\""}] |]
          { matchHeaders = [matchContentTypeJson]
          }
    it "formats nulls" $
      -- due_at is formatted as NULL but label_color NULLs become empty strings-- it's up to the formatting function.
      get "/datarep_todos?select=id,label_color,due_at&id=gt.2&id=lt.5"
        `shouldRespondWith` [json| [{"id":3,"label_color":"#01E240","due_at":"2018-01-01T14:12:34.123456Z"},{"id":4,"label_color":"","due_at":null}] |]
          { matchHeaders = [matchContentTypeJson]
          }
    it "formats star select" $
      get "/datarep_todos?select=*&id=lt.4"
        `shouldRespondWith` [json| [
          {"id":1,"name":"Report","label_color":"#000000","due_at":"2018-01-02T00:00:00Z","icon_image":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQAAAAA3bvkkAAAAABBJREFUeJxiYAEAAAAA//8DAAAABgAFBXv6vUAAAAAASUVORK5CYII=","created_at":1513213350,"budget":"12.50"},
           {"id":2,"name":"Essay","label_color":"#000100","due_at":"2018-01-03T00:00:00Z","icon_image":null,"created_at":1513213350,"budget":"100000000000000.13"},
           {"id":3,"name":"Algebra","label_color":"#01E240","due_at":"2018-01-01T14:12:34.123456Z","icon_image":null,"created_at":1513213350,"budget":"0.00"}
        ] |]
          { matchHeaders = [matchContentTypeJson]
          }
    it "formats implicit star select" $
      get "/datarep_todos?id=lt.4"
        `shouldRespondWith` [json| [
          {"id":1,"name":"Report","label_color":"#000000","due_at":"2018-01-02T00:00:00Z","icon_image":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQAAAAA3bvkkAAAAABBJREFUeJxiYAEAAAAA//8DAAAABgAFBXv6vUAAAAAASUVORK5CYII=","created_at":1513213350,"budget":"12.50"},
          {"id":2,"name":"Essay","label_color":"#000100","due_at":"2018-01-03T00:00:00Z","icon_image":null,"created_at":1513213350,"budget":"100000000000000.13"},
          {"id":3,"name":"Algebra","label_color":"#01E240","due_at":"2018-01-01T14:12:34.123456Z","icon_image":null,"created_at":1513213350,"budget":"0.00"}
        ] |]
          { matchHeaders = [matchContentTypeJson]
          }
    it "formats star and explicit mix" $
      get "/datarep_todos?select=due_at,*&id=lt.4"
        `shouldRespondWith` [json| [
          {"due_at":"2018-01-02T00:00:00Z","id":1,"name":"Report","label_color":"#000000","due_at":"2018-01-02T00:00:00Z","icon_image":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQAAAAA3bvkkAAAAABBJREFUeJxiYAEAAAAA//8DAAAABgAFBXv6vUAAAAAASUVORK5CYII=","created_at":1513213350,"budget":"12.50"},
           {"due_at":"2018-01-03T00:00:00Z","id":2,"name":"Essay","label_color":"#000100","due_at":"2018-01-03T00:00:00Z","icon_image":null,"created_at":1513213350,"budget":"100000000000000.13"},
           {"due_at":"2018-01-01T14:12:34.123456Z","id":3,"name":"Algebra","label_color":"#01E240","due_at":"2018-01-01T14:12:34.123456Z","icon_image":null,"created_at":1513213350,"budget":"0.00"}
        ] |]
          { matchHeaders = [matchContentTypeJson]
          }
    it "formats through join" $
      get "/datarep_next_two_todos?select=id,name,first_item:datarep_todos!datarep_next_two_todos_first_item_id_fkey(label_color,due_at)&order=id"
        `shouldRespondWith` [json| [{"id":1,"name":"school related","first_item":{"label_color":"#000100","due_at":"2018-01-03T00:00:00Z"}},{"id":2,"name":"do these first","first_item":{"label_color":"#000000","due_at":"2018-01-02T00:00:00Z"}}] |]
          { matchHeaders = [matchContentTypeJson]
          }
    it "formats through join with star select" $
      get "/datarep_next_two_todos?select=id,name,second_item:datarep_todos!datarep_next_two_todos_second_item_id_fkey(*)&order=id"
        `shouldRespondWith` [json| [
          {"id":1,"name":"school related","second_item":{"id":3,"name":"Algebra","label_color":"#01E240","due_at":"2018-01-01T14:12:34.123456Z","icon_image":null,"created_at":1513213350,"budget":"0.00"}},
          {"id":2,"name":"do these first","second_item":{"id":3,"name":"Algebra","label_color":"#01E240","due_at":"2018-01-01T14:12:34.123456Z","icon_image":null,"created_at":1513213350,"budget":"0.00"}}
        ] |]
          { matchHeaders = [matchContentTypeJson]
          }
    it "uses text parser on value for filter given through query parameters" $
      get "/datarep_todos?select=id,due_at&label_color=eq.000100"
        `shouldRespondWith` [json| [{"id":2,"due_at":"2018-01-03T00:00:00Z"}] |]
          { matchHeaders = [matchContentTypeJson]
          }
    it "in the absense of text parser, does not try to use the JSON parser for query parameters" $
      get "/datarep_todos?select=id,due_at&due_at=eq.Z"
        `shouldRespondWith`
        -- we prove the parser is not used because it'd replace the Z with `+00:00` and a different error message.
        [json| {"code":"22007","details":null,"hint":null,"message":"invalid input syntax for type timestamp with time zone: \"Z\""} |]
          { matchStatus = 400
          , matchHeaders =
              [ "Content-Length" <:> "117"
              , matchContentTypeJson
              ]
          }
    it "uses text parser for filter with 'IN' predicates" $
      get "/datarep_todos?select=id,due_at&label_color=in.(000100,01E240)"
        `shouldRespondWith` [json| [
          {"id":2, "due_at": "2018-01-03T00:00:00Z"},
          {"id":3, "due_at": "2018-01-01T14:12:34.123456Z"}
        ] |]
          { matchHeaders = [matchContentTypeJson]
          }
    it "uses text parser for filter with 'NOT IN' predicates" $
      get "/datarep_todos?select=id,due_at&label_color=not.in.(000000,01E240)"
        `shouldRespondWith` [json| [
          {"id":2, "due_at": "2018-01-03T00:00:00Z"}
        ] |]
          { matchHeaders = [matchContentTypeJson]
          }
    it "uses text parser on value for filter across relations" $
      get "/datarep_next_two_todos?select=id,name,datarep_todos!datarep_next_two_todos_first_item_id_fkey(label_color,due_at)&datarep_todos.label_color=neq.000100&order=id"
        `shouldRespondWith` [json| [{"id":1,"name":"school related","datarep_todos":null},{"id":2,"name":"do these first","datarep_todos":{"label_color":"#000000","due_at":"2018-01-02T00:00:00Z"}}] |]
          { matchHeaders = [matchContentTypeJson]
          }
    -- This is not supported by data reps (would be hard to make it work with high performance). So the test just
    -- verifies we don't panic or add inappropriate SQL to the filters.
    it "fails safely on user trying to use ilike operator on data reps column" $
      get "/datarep_todos?select=id,name&label_color=ilike.#*100"
        `shouldRespondWith` ( if actualPgVersion < pgVersion190 then
                                [json|
            {"code":"42883","details":null,"hint":"No operator matches the given name and argument types. You might need to add explicit type casts.","message":"operator does not exist: public.color ~~* unknown"}
          |]
                              else
                                [json|
            {"code":"42883","details":"No operator of that name accepts the given argument types.","hint":"You might need to add explicit type casts.","message":"operator does not exist: public.color ~~* unknown"}
          |]
                            )
          { matchStatus = 404
          , matchHeaders = [matchContentTypeJson]
          }

  context "searching for an empty string" $ do
    it "works with an empty eq filter" $
      get "/empty_string?string=eq.&select=id,string"
        `shouldRespondWith` [json|
          [{"id":1,"string":""}]
        |]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }

  context "test infinite recursion error 42P17" $
    it "return http status 500" $
      get "/infinite_recursion?select=*"
        `shouldRespondWith` [json|{"code":"42P17","message":"infinite recursion detected in rules for relation \"infinite_recursion\"","details":null,"hint":null}|]
          { matchStatus = 500
          , matchHeaders = ["Content-Length" <:> "128"]
          }

  context "invalid resource path" $ do
    it "return http status 404" $
      get "/first/second/third?select=*"
        `shouldRespondWith` [json| {"code":"PGRST125","details":null,"hint":null,"message":"Invalid path specified in request URL"} |]
          { matchStatus = 404
          , matchHeaders = ["Content-Length" <:> "96"]
          }

specLegacyTargetNames :: SpecWithConfig
specLegacyTargetNames withConfig = withConfig (baseCfg{configUrlUseLegacyTargetNames = False}) $
  context "disable legacy target names" $ do
    describe "Shaping response with select parameter" $ do
      it "works when embedding the same table more than once" $
        get "/places?select=name,visits(id,start_time,visit_type),work_visits:visits(id,start_time,visit_type)&id=eq.1&visits.visit_type=neq.work&visits.start_time=gt.20250101+00:00&work_visits.visit_type=eq.work&work_visits.start_time=gt.20250101+00:00"
          `shouldRespondWith` [json|[
            {
              "name":"Lake",
              "visits":[{"id": 1, "start_time": "2025-01-01T10:00:00", "visit_type": "vacation"}, {"id": 2, "start_time": "2025-01-01T15:00:00", "visit_type": "vacation"}],
              "work_visits":[{"id": 3, "start_time": "2025-01-01T20:00:00", "visit_type": "work"}]
            }
          ]|]
            { matchHeaders = [matchContentTypeJson]
            }
    describe "ordering response" $
      it "filters, orders or limits do not work with aliased embeded entities using the target name" $
        get "/projects?id=eq.1&select=id, name, the_tasks:tasks(id, name)&tasks.name=like.Code*&tasks.order=name.asc&tasks.limit=1"
          `shouldRespondWith` [json|
            {
              "code":"PGRST108",
              "details":"Target names are not allowed in filters if they have an alias",
              "hint":"Change 'tasks' to 'the_tasks' in filters, orders or limits.",
              "message":"'tasks' is not an embedded resource in this request"
            }
          |]
            { matchStatus = 400
            , matchHeaders = [matchContentTypeJson]
            }
