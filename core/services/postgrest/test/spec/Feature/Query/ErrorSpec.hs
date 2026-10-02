module Feature.Query.ErrorSpec where

import Network.HTTP.Types
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import PostgREST.Config (AppConfig (..), Verbosity (..))
import SpecHelper

spec :: SpecWithConfig
spec withConfig = do
  withConfig baseCfg $ describe "Test PostgreSQL and PostgREST errors" $ do
    it "should return 500 for cardinality_violation" $
      get "/bad_subquery" `shouldRespondWith` 500

    it "should return 500 for statement too complex" $
      request
        methodPost
        "/infinite_inserts"
        []
        [json|{"id": 3, "name": "qwer"}|]
        `shouldRespondWith` [json|
          {"code": "54001",
           "details": null,
           "hint": "Increase the configuration parameter \"max_stack_depth\" (currently 2048kB), after ensuring the platform's stack depth limit is adequate.",
            "message": "stack depth limit exceeded"}|]
          { matchStatus = 500
          , matchHeaders = ["Content-Length" <:> "217"]
          }

    context "includes the proxy-status header on the response" $ do
      it "works with ApiRequest error" $
        get "/invalid/nested/paths"
          `shouldRespondWith` [json| {"code":"PGRST125","details":null,"hint":null,"message":"Invalid path specified in request URL"} |]
            { matchStatus = 404
            , matchHeaders =
                [ "Proxy-Status" <:> "PostgREST; error=PGRST125"
                , "Content-Length" <:> "96"
                ]
            }

      it "works with SchemaCache error" $
        get "/non_existent_table"
          `shouldRespondWith` [json| {"code":"PGRST205","details":null,"hint":null,"message":"Could not find the table 'test.non_existent_table' in the schema cache"} |]
            { matchStatus = 404
            , matchHeaders =
                [ "Proxy-Status" <:> "PostgREST; error=PGRST205"
                , "Content-Length" <:> "129"
                ]
            }

      it "works with Jwt error" $ do
        let auth = authHeaderJWT "ey9zdGdyZXN0X3Rlc3RfYXV0aG9yIiwiaWQiOiJqZG9lIn0.y4vZuu1dDdwAl0-S00MCRWRYMlJ5YAMSir6Es6WtWx0"
        request methodGet "/authors_only" [auth] ""
          `shouldRespondWith` [json| {"message":"Expected 3 parts in JWT; got 2","code":"PGRST301","hint":null,"details":null} |]
            { matchStatus = 401
            , matchHeaders =
                [ "Proxy-Status" <:> "PostgREST; error=PGRST301"
                , "Content-Length" <:> "89"
                ]
            }

      it "works with raise sqlstate custom error" $
        get "/rpc/raise_pt402"
          `shouldRespondWith` [json| {"code":"PT402","details":"Quota exceeded","hint":"Upgrade your plan","message":"Payment Required"} |]
            { matchStatus = 402
            , matchHeaders =
                [ "Proxy-Status" <:> "PostgREST; error=PT402"
                , "Content-Length" <:> "99"
                ]
            }

      it "works with sqlstate PGRST custom error" $
        get "/rpc/raise_sqlstate_test1"
          `shouldRespondWith` [json| {"code":"123","details":"DEF","hint":"XYZ","message":"ABC"} |]
            { matchStatus = 332
            , matchHeaders =
                [ "Proxy-Status" <:> "PostgREST; error=123"
                , "Content-Length" <:> "59"
                ]
            }

    context "show hint on PGRST205 table not found error" $ do
      it "show hint when similarity score is at least 75%" $ do
        get "/projectx" -- at least 75% similar to "projects"
          `shouldRespondWith` [json| {"code":"PGRST205","details":null,"hint":"Perhaps you meant the table 'test.projects'","message":"Could not find the table 'test.projectx' in the schema cache"} |]
            { matchStatus = 404
            , matchHeaders =
                [ "Proxy-Status" <:> "PostgREST; error=PGRST205"
                , "Content-Length" <:> "160"
                ]
            }

        get "/projecxx" -- at least 75% similar to "projects"
          `shouldRespondWith` [json| {"code":"PGRST205","details":null,"hint":"Perhaps you meant the table 'test.projects'","message":"Could not find the table 'test.projecxx' in the schema cache"} |]
            { matchStatus = 404
            , matchHeaders =
                [ "Proxy-Status" <:> "PostgREST; error=PGRST205"
                , "Content-Length" <:> "160"
                ]
            }

      it "don't show hint when similarity score is less than 75%" $
        get "/projxxxx" -- less than 75% similar to "projects"
          `shouldRespondWith` [json| {"code":"PGRST205","details":null,"hint":null,"message":"Could not find the table 'test.projxxxx' in the schema cache"} |]
            { matchStatus = 404
            , matchHeaders =
                [ "Proxy-Status" <:> "PostgREST; error=PGRST205"
                , "Content-Length" <:> "119"
                ]
            }

    context "JWT Errors" $ do
      it "error on jwt encoded with wrong secret" $ do
        let
          jwtPayload = [json|{}|]
          auth = authHeaderJWT $ generateJWTWithSecret jwtPayload "wrong secret"
        request methodGet "/authors_only" [auth] ""
          `shouldRespondWith` [json|{
            "code":"PGRST301",
            "details":"None of the keys was able to decode the JWT",
            "hint":null,
            "message":"No suitable key or wrong key type"
          }|]
            { matchStatus = 401
            }

      it "when role does not exist" $ do
        let
          jwtPayload = [json|{ "role": "not existing" }|]
          auth = authHeaderJWT $ generateJWT jwtPayload
        request methodGet "/authors_only" [auth] ""
          `shouldRespondWith` [json|{
            "code":"22023",
            "details":null,
            "hint":null,
            "message":"role \"not existing\" does not exist"
          }|]
            { matchStatus = 401
            }

      context "we allow 30 seconds clock skew" $ do
        it "it should return error if expired" $ do
          currentTime <- liftIO $ relativeSeconds (-35)
          let
            jwtPayload = [json|{ "exp": #{currentTime} }|]
            auth = authHeaderJWT $ generateJWT jwtPayload
          request methodGet "/authors_only" [auth] ""
            `shouldRespondWith` [json|{
              "code":"PGRST303",
              "details":null,
              "hint":null,
              "message":"JWT expired"
            }|]
              { matchStatus = 401
              }

        it "it should return error if used before it is valid" $ do
          currentTime <- liftIO $ relativeSeconds 35
          let
            jwtPayload = [json|{ "nbf": #{currentTime} }|]
            auth = authHeaderJWT $ generateJWT jwtPayload
          request methodGet "/authors_only" [auth] ""
            `shouldRespondWith` [json|{
              "code":"PGRST303",
              "details":null,
              "hint":null,
              "message":"JWT not yet valid"
            }|]
              { matchStatus = 401
              }

        it "it should return error if issued at future" $ do
          currentTime <- liftIO $ relativeSeconds 35
          let
            jwtPayload = [json|{ "iat": #{currentTime} }|]
            auth = authHeaderJWT $ generateJWT jwtPayload
          request methodGet "/authors_only" [auth] ""
            `shouldRespondWith` [json|{
              "code":"PGRST303",
              "details":null,
              "hint":null,
              "message":"JWT issued at future"
            }|]
              { matchStatus = 401
              }

  withConfig baseCfg{configJwtAudience = Just "spec tests"} $ describe "Test JWT Audience error" $ do
    it "it should return error if JWT not in audience" $ do
      let
        jwtPayload = [json|{ "aud": "not set" }|]
        auth = authHeaderJWT $ generateJWT jwtPayload
      request methodGet "/authors_only" [auth] ""
        `shouldRespondWith` [json|{
          "code":"PGRST303",
          "details":null,
          "hint":null,
          "message":"JWT not in audience"
        }|]
          { matchStatus = 401
          }

  withConfig baseCfg $ describe "Test JWT Token format errors" $ do
    it "when partial token is provided" $ do
      let auth = authHeaderJWT "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.bm90IGFuIG9iamVjdA"
      request methodGet "/authors_only" [auth] ""
        `shouldRespondWith` [json|{
          "code":"PGRST301",
          "details":null,
          "hint":null,
          "message":"Expected 3 parts in JWT; got 2"
        }|]
          { matchStatus = 401
          }

    it "when token is complete but random characters" $ do
      let auth = authHeaderJWT "quifquirndsjagnrgniur.fonvoienqhhdj.iuqvnvhojah"
      request methodGet "/authors_only" [auth] ""
        `shouldRespondWith` [json|{
          "code":"PGRST301",
          "details":null,
          "hint":null,
          "message":"JWT cryptographic operation failed"
        }|]
          { matchStatus = 401
          }

    it "when token with algorithm 'none' is used" $ do
      let auth = authHeaderJWT "TEST_JWT_REDACTED"
      request methodGet "/authors_only" [auth] ""
        `shouldRespondWith` [json|{
          "code":"PGRST301",
          "details":"JWT is unsecured but expected 'alg' was not 'none'",
          "hint":null,
          "message":"Wrong or unsupported encoding algorithm"
        }|]
          { matchStatus = 401
          }

  -- By default, error verbosity is set to 'verbose', which returns all error
  -- fields. No need to test that explicitly.
  withConfig baseCfg{configClientErrorVerbosity = Minimal} $
    describe "Test client-error-verbosity config" $
      it "hides details and hint when set to 'minimal'" $
        request methodGet "/itemsx" [] ""
          `shouldRespondWith` [json|{
          "code":"PGRST205",
          "message":"Could not find the table 'test.itemsx' in the schema cache"
        }|]
            { matchStatus = 404
            }
