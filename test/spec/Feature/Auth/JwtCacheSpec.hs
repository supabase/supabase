module Feature.Auth.JwtCacheSpec where

import Network.HTTP.Types
import Network.Wai.Test (SResponse (simpleHeaders, simpleStatus))
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import Data.Map qualified as M

import PostgREST.Config (AppConfig (..))
import SpecHelper

spec :: SpecWithConfig
spec withConfig = do
  withConfig baseCfg{configJwtCacheMaxEntries = 86400} $ do
    it "server-timing duration is exposed for JWT with expiry" $ do
      !currentTime <- liftIO $ relativeSeconds 1800 -- 30 minutes, evaluate strictly
      let
        jwtPayload = [json|{ "role": "postgrest_test_author", "exp": #{currentTime} }|]
        auth = authHeaderJWT $ generateJWT jwtPayload

      res1 <- request methodGet "/authors_only" [auth] ""
      let jwtDur1 = M.lookup "jwt" $ parseServerTimingHeader $ simpleHeaders res1
      res2 <- request methodGet "/authors_only" [auth] ""
      let jwtDur2 = M.lookup "jwt" $ parseServerTimingHeader $ simpleHeaders res2

      -- With jwt caching the parse time of second request with the same token
      -- should be at least as fast as the first one
      let dur2IsLessThanEq = fromMaybe False $ liftA2 (<=) jwtDur2 jwtDur1
      liftIO $ dur2IsLessThanEq `shouldBe` True

    it "server-timing duration is exposed for JWT without expiry" $ do
      let
        jwtPayload = [json|{ "role": "postgrest_test_author" }|]
        auth = authHeaderJWT $ generateJWT jwtPayload

      res1 <- request methodGet "/authors_only" [auth] ""
      let jwtDur1 = M.lookup "jwt" $ parseServerTimingHeader $ simpleHeaders res1
      res2 <- request methodGet "/authors_only" [auth] ""
      let jwtDur2 = M.lookup "jwt" $ parseServerTimingHeader $ simpleHeaders res2

      liftIO $ do
        simpleStatus res1 `shouldBe` status200
        simpleStatus res2 `shouldBe` status200

      let dur1Positive = maybe False (>= 0) jwtDur1
      let dur2Positive = maybe False (>= 0) jwtDur2
      liftIO $ do
        dur1Positive `shouldBe` True
        dur2Positive `shouldBe` True

  withConfig baseCfg{configServerTimingEnabled = False, configJwtCacheMaxEntries = 86400} $
    it "JWT cache does not break requests with server-timing disabled" $ do
      let
        jwtPayload = [json|{ "role": "postgrest_test_author" }|]
        auth = authHeaderJWT $ generateJWT jwtPayload

      request methodGet "/authors_only" [auth] "" `shouldRespondWith` 200
      request methodGet "/authors_only" [auth] "" `shouldRespondWith` 200
