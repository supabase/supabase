module Feature.Auth.AudienceJwtSecretSpec where

import Network.HTTP.Types
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import PostgREST.Config (AppConfig (..), parseSecret)
import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig
  ( baseCfg
      { configJwtSecret = Just generateSecret
      , configJwtAudience = Just "youraudience"
      , configJWKS = rightToMaybe $ parseSecret generateSecret
      }
  )
  $ describe "test handling of aud claims in JWT when the jwt-aud config is set"
  $ do
    context "when the audience claim is a string" $ do
      -- this test will stop working 9999999999s after the UNIX EPOCH
      it "succeeds when the audience claim matches" $ do
        let
          jwtPayload =
            [json|{
              "exp": 9999999999,
              "role": "postgrest_test_author",
              "id": "jdoe",
              "aud": "youraudience"
            }|]
          auth = authHeaderJWT $ generateJWT jwtPayload
        request methodGet "/authors_only" [auth] ""
          `shouldRespondWith` 200

      it "fails when the audience claim does not match" $ do
        let
          jwtPayload =
            [json|
            {
              "exp": 9999999999,
              "role": "postgrest_test_author",
              "id": "jdoe",
              "aud": "notyouraudience"
            }|]
          auth = authHeaderJWT $ generateJWT jwtPayload
        request methodGet "/authors_only" [auth] ""
          `shouldRespondWith` [json|{"code":"PGRST303","details":null,"hint":null,"message":"JWT not in audience"}|]
            { matchStatus = 401
            }

      it "fails when the audience claim is empty" $ do
        let
          jwtPayload =
            [json|
            {
              "exp": 9999999999,
              "role": "postgrest_test_author",
              "id": "jdoe",
              "aud": ""
            }|]
          auth = authHeaderJWT $ generateJWT jwtPayload
        request methodGet "/authors_only" [auth] ""
          `shouldRespondWith` [json|{"code":"PGRST303","details":null,"hint":null,"message":"JWT not in audience"}|]
            { matchStatus = 401
            }

    context "when the audience claim is an array of strings" $ do
      it "succeeds when the audience claim has 1 element and it matches" $ do
        let
          jwtPayload =
            [json|
            {
              "exp": 9999999999,
              "role": "postgrest_test_author",
              "id": "jdoe",
              "aud": ["youraudience"]
            }|]
          auth = authHeaderJWT $ generateJWT jwtPayload
        request methodGet "/authors_only" [auth] ""
          `shouldRespondWith` 200

      it "succeeds when the audience claim has more than 1 element and one matches" $ do
        let
          jwtPayload =
            [json|
            {
              "exp": 9999999999,
              "role": "postgrest_test_author",
              "id": "jdoe",
              "aud": ["notyouraudience", "youraudience", "anotheraudience"]
            }|]
          auth = authHeaderJWT $ generateJWT jwtPayload
        request methodGet "/authors_only" [auth] ""
          `shouldRespondWith` 200

      it "fails when the audience claim has 1 element and it doesn't match" $ do
        let
          jwtPayload =
            [json|
            {
              "exp": 9999999999,
              "role": "postgrest_test_author",
              "id": "jdoe",
              "aud": ["notyouraudience"]
            }|]
          auth = authHeaderJWT $ generateJWT jwtPayload
        request methodGet "/authors_only" [auth] ""
          `shouldRespondWith` [json|{"code":"PGRST303","details":null,"hint":null,"message":"JWT not in audience"}|]
            { matchStatus = 401
            }

      it "fails when the audience claim has more than 1 element and none matches" $ do
        let
          jwtPayload =
            [json|
            {
              "exp": 9999999999,
              "role": "postgrest_test_author",
              "id": "jdoe",
              "aud": ["notyouraudience", "stillnotyouraudience", "anotheraudience"]
            }|]
          auth = authHeaderJWT $ generateJWT jwtPayload
        request methodGet "/authors_only" [auth] ""
          `shouldRespondWith` [json|{"code":"PGRST303","details":null,"hint":null,"message":"JWT not in audience"}|]
            { matchStatus = 401
            }

      it "ignores the audience claim and succeeds when it's empty" $ do
        let
          jwtPayload =
            [json|
            {
              "exp": 9999999999,
              "role": "postgrest_test_author",
              "id": "jdoe",
              "aud": []
            }|]
          auth = authHeaderJWT $ generateJWT jwtPayload
        request methodGet "/authors_only" [auth] ""
          `shouldRespondWith` 200

      it "ignores the audience claim and succeeds when it's null" $ do
        let
          jwtPayload =
            [json|
            {
              "exp": 9999999999,
              "role": "postgrest_test_author",
              "id": "jdoe",
              "aud": null
            }|]
          auth = authHeaderJWT $ generateJWT jwtPayload
        request methodGet "/authors_only" [auth] ""
          `shouldRespondWith` 200

    context "when the audience claim is not present" $ do
      it "succeeds with a JWT with no audience claim" $ do
        let
          jwtPayload =
            [json|
            {
              "exp": 9999999999,
              "role": "postgrest_test_author",
              "id": "jdoe"
            }|]
          auth = authHeaderJWT $ generateJWT jwtPayload
        request methodGet "/authors_only" [auth] ""
          `shouldRespondWith` 200

      it "succeeds without a JWT" $
        get "/has_count_column" `shouldRespondWith` 200

disabledSpec :: SpecWithConfig
disabledSpec withConfig = withConfig baseCfg $ describe "test handling of aud claims in JWT when the jwt-aud config is not set" $ do
  context "when the audience claim is a string" $ do
    it "ignores the audience claim and suceeds" $ do
      let
        jwtPayload =
          [json|{
              "exp": 9999999999,
              "role": "postgrest_test_author",
              "id": "jdoe",
              "aud": "youraudience"
            }|]
        auth = authHeaderJWT $ generateJWT jwtPayload
      request methodGet "/authors_only" [auth] ""
        `shouldRespondWith` 200

    it "ignores the audience claim and suceeds when it's empty" $ do
      let
        jwtPayload =
          [json|{
              "exp": 9999999999,
              "role": "postgrest_test_author",
              "id": "jdoe",
              "aud": ""
            }|]
        auth = authHeaderJWT $ generateJWT jwtPayload
      request methodGet "/authors_only" [auth] ""
        `shouldRespondWith` 200

  context "when the audience is an array of strings" $ do
    it "ignores the audience claim and suceeds when it has 1 element" $ do
      let
        jwtPayload =
          [json|
            {
              "exp": 9999999999,
              "role": "postgrest_test_author",
              "id": "jdoe",
              "aud": ["youraudience"]
            }|]
        auth = authHeaderJWT $ generateJWT jwtPayload
      request methodGet "/authors_only" [auth] ""
        `shouldRespondWith` 200

    it "ignores the audience claim and suceeds when it has more than 1 element" $ do
      let
        jwtPayload =
          [json|
            {
              "exp": 9999999999,
              "role": "postgrest_test_author",
              "id": "jdoe",
              "aud": ["notyouraudience", "youraudience", "anotheraudience"]
            }|]
        auth = authHeaderJWT $ generateJWT jwtPayload
      request methodGet "/authors_only" [auth] ""
        `shouldRespondWith` 200

    it "ignores the audience claim and suceeds when it's empty" $ do
      let
        jwtPayload =
          [json|
            {
              "exp": 9999999999,
              "role": "postgrest_test_author",
              "id": "jdoe",
              "aud": []
            }|]
        auth = authHeaderJWT $ generateJWT jwtPayload
      request methodGet "/authors_only" [auth] ""
        `shouldRespondWith` 200

    it "ignores the audience claim and succeeds when it's null" $ do
      let
        jwtPayload =
          [json|
            {
              "exp": 9999999999,
              "role": "postgrest_test_author",
              "id": "jdoe",
              "aud": null
            }|]
        auth = authHeaderJWT $ generateJWT jwtPayload
      request methodGet "/authors_only" [auth] ""
        `shouldRespondWith` 200

  context "when the audience claim is not present" $ do
    it "succeeds with a JWT with no audience claim" $ do
      let
        jwtPayload =
          [json|
            {
              "exp": 9999999999,
              "role": "postgrest_test_author",
              "id": "jdoe"
            }|]
        auth = authHeaderJWT $ generateJWT jwtPayload
      request methodGet "/authors_only" [auth] ""
        `shouldRespondWith` 200

    it "succeeds without a JWT" $
      get "/has_count_column" `shouldRespondWith` 200
