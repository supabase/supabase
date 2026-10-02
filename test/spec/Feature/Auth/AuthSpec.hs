module Feature.Auth.AuthSpec where

import Network.HTTP.Types
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig baseCfg $ describe "authorization" $ do
  let single = ("Accept", "application/vnd.pgrst.object+json")

  it "denies access to tables that anonymous does not own" $
    get "/authors_only"
      `shouldRespondWith` [json| {
        "hint":null,
        "details":null,
        "code":"42501",
        "message":"permission denied for table authors_only"} |]
        { matchStatus = 401
        , matchHeaders =
            [ "WWW-Authenticate" <:> "Bearer"
            , "Content-Length" <:> "96"
            ]
        }

  it "denies access to tables that postgrest_test_author does not own" $
    let auth = authHeaderJWT "TEST_JWT_REDACTED"
    in  request methodGet "/private_table" [auth] ""
          `shouldRespondWith` [json| {
        "hint":null,
        "details":null,
        "code":"42501",
        "message":"permission denied for table private_table"} |]
            { matchStatus = 403
            , matchHeaders = ["Content-Length" <:> "97"]
            }

  it "denies execution on functions that anonymous does not own" $
    post "/rpc/privileged_hello" [json|{"name": "anonymous"}|] `shouldRespondWith` 401

  it "allows execution on a function that postgrest_test_author owns" $
    let auth = authHeaderJWT "TEST_JWT_REDACTED"
    in  request methodPost "/rpc/privileged_hello" [auth] [json|{"name": "jdoe"}|]
          `shouldRespondWith` [json|"Privileged hello to jdoe"|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }

  it "returns jwt functions as jwt tokens" $
    request
      methodPost
      "/rpc/login"
      [single]
      [json| { "id": "jdoe", "pass": "1234" } |]
      `shouldRespondWith` [json| {"token":"TEST_JWT_REDACTED"} |]
        { matchStatus = 200
        , matchHeaders = [matchContentTypeSingular]
        }

  it "sql functions can encode custom and standard claims" $
    request methodPost "/rpc/jwt_test" [single] "{}"
      `shouldRespondWith` [json| {"token":"TEST_JWT_REDACTED"} |]
        { matchStatus = 200
        , matchHeaders = [matchContentTypeSingular]
        }

  it "sql functions can read custom and standard claims variables" $ do
    let auth = authHeaderJWT "TEST_JWT_REDACTED"
    request methodPost "/rpc/reveal_big_jwt" [auth] "{}"
      `shouldRespondWith` [json|[{"iss":"joe","sub":"fun","exp":9999999999,"nbf":1300819380,"iat":1300819380,"jti":"foo","http://postgrest.com/foo":true}]|]

  it "allows users with permissions to see their tables" $ do
    let auth = authHeaderJWT "TEST_JWT_REDACTED"
    request methodGet "/authors_only" [auth] ""
      `shouldRespondWith` 200

  it "works with tokens which have extra fields" $ do
    let auth = authHeaderJWT "TEST_JWT_REDACTED"
    request methodGet "/authors_only" [auth] ""
      `shouldRespondWith` 200

  -- this test will stop working 9999999999s after the UNIX EPOCH
  it "succeeds with an unexpired token" $ do
    let auth = authHeaderJWT "TEST_JWT_REDACTED"
    request methodGet "/authors_only" [auth] ""
      `shouldRespondWith` 200

  it "succeeds with a valid iat claim in jwt" $ do
    currentTime <- liftIO $ relativeSeconds 0
    let
      jwtPayload = [json|{ "role": "postgrest_test_author", "iat": #{currentTime} }|]
      auth = authHeaderJWT $ generateJWT jwtPayload
    request methodGet "/authors_only" [auth] ""
      `shouldRespondWith` 200

  it "fails when auth header is sent empty" $
    do
      let auth = authHeaderJWT ""
      request methodGet "/authors_only" [auth] ""
      `shouldRespondWith` [json| {"message":"Empty JWT is sent in Authorization header","code":"PGRST301","hint":null,"details":null} |]
        { matchStatus = 401
        , matchHeaders =
            [ "WWW-Authenticate"
                <:> "Bearer error=\"invalid_token\", error_description=\"Empty JWT is sent in Authorization header\""
            , "Content-Length" <:> "100"
            ]
        }

  it "fails with an expired token" $ do
    let
      jwtPayload = [json|{ "exp": 1446678149, "role": "postgrest_test_author", "id": "jdoe" }|]
      auth = authHeaderJWT $ generateJWT jwtPayload
    request methodGet "/authors_only" [auth] ""
      `shouldRespondWith` [json| {"message":"JWT expired","code":"PGRST303","hint":null,"details":null} |]
        { matchStatus = 401
        , matchHeaders =
            [ "WWW-Authenticate"
                <:> "Bearer error=\"invalid_token\", error_description=\"JWT expired\""
            ]
        }

  it "hides tables from users with invalid JWT" $ do
    let auth = authHeaderJWT "ey9zdGdyZXN0X3Rlc3RfYXV0aG9yIiwiaWQiOiJqZG9lIn0.y4vZuu1dDdwAl0-S00MCRWRYMlJ5YAMSir6Es6WtWx0"
    request methodGet "/authors_only" [auth] ""
      `shouldRespondWith` [json| {"message":"Expected 3 parts in JWT; got 2","code":"PGRST301","hint":null,"details":null} |]
        { matchStatus = 401
        , matchHeaders =
            [ "WWW-Authenticate"
                <:> "Bearer error=\"invalid_token\", error_description=\"Expected 3 parts in JWT; got 2\""
            ]
        }

  it "should fail when jwt contains no claims" $ do
    let auth = authHeaderJWT "TEST_JWT_REDACTED"
    request methodGet "/authors_only" [auth] ""
      `shouldRespondWith` 401

  it "hides tables from users with JWT that contain no claims about role" $ do
    let auth = authHeaderJWT "TEST_JWT_REDACTED"
    request methodGet "/authors_only" [auth] ""
      `shouldRespondWith` 401

  it "recovers after 401 error with logged in user" $ do
    _ <- post "/authors_only" [json| { "owner": "jdoe", "secret": "test content" } |]
    let auth = authHeaderJWT "TEST_JWT_REDACTED"
    _ <- request methodPost "/rpc/problem" [auth] ""
    request methodGet "/authors_only" [auth] ""
      `shouldRespondWith` 200

  it "fails when the exp claim is not a number" $ do
    let
      jwtPayload =
        [json|
          {
            "exp": "invalid",
            "role": "postgrest_test_author"
          }|]
      auth = authHeaderJWT $ generateJWT jwtPayload
    request methodGet "/authors_only" [auth] ""
      `shouldRespondWith` [json|{"code":"PGRST303","details":null,"hint":null,"message":"The JWT 'exp' claim must be a number"}|]
        { matchStatus = 401
        }

  it "fails when the nbf claim is not a number" $ do
    let
      jwtPayload =
        [json|
          {
            "nbf": "invalid",
            "role": "postgrest_test_author"
          }|]
      auth = authHeaderJWT $ generateJWT jwtPayload
    request methodGet "/authors_only" [auth] ""
      `shouldRespondWith` [json|{"code":"PGRST303","details":null,"hint":null,"message":"The JWT 'nbf' claim must be a number"}|]
        { matchStatus = 401
        }

  it "fails when the iat claim is not a number" $ do
    let
      jwtPayload =
        [json|
          {
            "iat": "invalid",
            "role": "postgrest_test_author"
          }|]
      auth = authHeaderJWT $ generateJWT jwtPayload
    request methodGet "/authors_only" [auth] ""
      `shouldRespondWith` [json|{"code":"PGRST303","details":null,"hint":null,"message":"The JWT 'iat' claim must be a number"}|]
        { matchStatus = 401
        }

  it "fails when the aud claim has a single value and it's not a string" $ do
    let
      jwtPayload =
        [json|
          {
            "aud": {"invalid": "value"},
            "role": "postgrest_test_author"
          }|]
      auth = authHeaderJWT $ generateJWT jwtPayload
    request methodGet "/authors_only" [auth] ""
      `shouldRespondWith` [json|{"code":"PGRST303","details":null,"hint":null,"message":"The JWT 'aud' claim must be a string or an array of strings"}|]
        { matchStatus = 401
        }

  it "fails when the aud claim is an array but it has non-string elements" $ do
    let
      jwtPayload =
        [json|
          {
            "aud": [{"invalid": "value"}, "test"],
            "role": "postgrest_test_author"
          }|]
      auth = authHeaderJWT $ generateJWT jwtPayload
    request methodGet "/authors_only" [auth] ""
      `shouldRespondWith` [json|{"code":"PGRST303","details":null,"hint":null,"message":"The JWT 'aud' claim must be a string or an array of strings"}|]
        { matchStatus = 401
        }

  describe "custom pre-request proc acting on id claim" $ do
    it "able to switch to postgrest_test_author role (id=1)" $
      let auth = authHeaderJWT "TEST_JWT_REDACTED"
      in  request
            methodPost
            "/rpc/get_current_user"
            [auth]
            [json| {} |]
            `shouldRespondWith` [json|"postgrest_test_author"|]
              { matchStatus = 200
              , matchHeaders = []
              }

    it "able to switch to postgrest_test_default_role (id=2)" $
      let auth = authHeaderJWT "TEST_JWT_REDACTED"
      in  request
            methodPost
            "/rpc/get_current_user"
            [auth]
            [json| {} |]
            `shouldRespondWith` [json|"postgrest_test_default_role"|]
              { matchStatus = 200
              , matchHeaders = []
              }

    it "raises error (id=3)" $
      let auth = authHeaderJWT "TEST_JWT_REDACTED"
      in  request
            methodPost
            "/rpc/get_current_user"
            [auth]
            [json| {} |]
            `shouldRespondWith` [json|{"hint":"Please contact administrator","details":null,"code":"P0001","message":"Disabled ID --> 3"}|]
              { matchStatus = 400
              , matchHeaders = []
              }

  it "allows 'Bearer' and 'bearer' as authentication schemes" $ do
    let token = "TEST_JWT_REDACTED"
    request methodGet "/authors_only" [authHeader "Bearer" token] ""
      `shouldRespondWith` 200
    request methodGet "/authors_only" [authHeader "bearer" token] ""
      `shouldRespondWith` 200
