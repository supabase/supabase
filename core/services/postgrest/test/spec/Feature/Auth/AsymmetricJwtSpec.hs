module Feature.Auth.AsymmetricJwtSpec where

import Network.HTTP.Types
import Protolude
import Test.Hspec
import Test.Hspec.Wai
import Text.Heredoc

import PostgREST.Config (AppConfig (..), parseSecret)
import SpecHelper

-- these tests will stop working 9999999999s after the UNIX EPOCH
spec :: SpecWithConfig
spec withConfig =
  let
    auth = authHeaderJWT "TEST_JWT_REDACTED"
    jwk = encodeUtf8 [str|{"alg":"RS256","e":"AQAB","key_ops":["verify"],"kty":"RSA","n":"0etQ2Tg187jb04MWfpuogYGV75IFrQQBxQaGH75eq_FpbkyoLcEpRUEWSbECP2eeFya2yZ9vIO5ScD-lPmovePk4Aa4SzZ8jdjhmAbNykleRPCxMg0481kz6PQhnHRUv3nF5WP479CnObJKqTVdEagVL66oxnX9VhZG9IZA7k0Th5PfKQwrKGyUeTGczpOjaPqbxlunP73j9AfnAt4XCS8epa-n3WGz1j-wfpr_ys57Aq-zBCfqP67UYzNpeI1AoXsJhD9xSDOzvJgFRvc3vm2wjAW4LEMwi48rCplamOpZToIHEPIaPzpveYQwDnB1HFTR1ove9bpKJsHmi-e2uzQ","use":"sig"}|]
    jwks = encodeUtf8 [str|{"keys": [{"alg":"RS256","e":"AQAB","key_ops":["verify"],"kty":"RSA","n":"0etQ2Tg187jb04MWfpuogYGV75IFrQQBxQaGH75eq_FpbkyoLcEpRUEWSbECP2eeFya2yZ9vIO5ScD-lPmovePk4Aa4SzZ8jdjhmAbNykleRPCxMg0481kz6PQhnHRUv3nF5WP479CnObJKqTVdEagVL66oxnX9VhZG9IZA7k0Th5PfKQwrKGyUeTGczpOjaPqbxlunP73j9AfnAt4XCS8epa-n3WGz1j-wfpr_ys57Aq-zBCfqP67UYzNpeI1AoXsJhD9xSDOzvJgFRvc3vm2wjAW4LEMwi48rCplamOpZToIHEPIaPzpveYQwDnB1HFTR1ove9bpKJsHmi-e2uzQ","use":"sig"}]}|]
  in
    describe "server started with asymmetric JWK" $ do
      context "secret provided as JWK"
        $ withConfig
          ( baseCfg
              { configJwtSecret = Just jwk
              , configJWKS = rightToMaybe $ parseSecret jwk
              }
          )
        $ it "succeeds with jwt token signed with an asymmetric key"
        $ request methodGet "/authors_only" [auth] ""
          `shouldRespondWith` 200

      context "secret provided as JWKSet"
        $ withConfig
          ( baseCfg
              { configJwtSecret = Just jwks
              , configJWKS = rightToMaybe $ parseSecret jwks
              }
          )
        $ it "succeeds with jwt token signed with an asymmetric key"
        $ request methodGet "/authors_only" [auth] ""
          `shouldRespondWith` 200
