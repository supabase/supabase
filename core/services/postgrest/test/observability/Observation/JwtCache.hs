{-# LANGUAGE DataKinds #-}
{-# LANGUAGE NamedFieldPuns #-}

module Observation.JwtCache where

import Network.HTTP.Types
import Network.Wai (Application)
import Protolude
import Test.Hspec (SpecWith, describe, it)
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON (json)

import ObsHelper
import PostgREST.Metrics (MetricsState (..))

spec :: SpecWith (SpecState, Application)
spec = describe "Server started with JWT and metrics enabled" $ do
  it "Should not have JWT in cache" $ do
    expectCounters <- checkState' . specMetrics <$> getState

    let auth = genToken [json|{"exp": 9999999999, "role": "postgrest_test_author", "id": "jdoe1"}|]

    expectCounters
      [ requests (+ 1)
      , hits (+ 0)
      ]
      $ request methodGet "/authors_only" [auth] "" `shouldRespondWith` 200

  it "Should have JWT in cache" $ do
    expectCounters <- checkState' . specMetrics <$> getState

    let auth = genToken [json|{"exp": 9999999999, "role": "postgrest_test_author", "id": "jdoe2"}|]

    expectCounters
      [ requests (+ 2)
      , hits (+ 1)
      ]
      $ request methodGet "/authors_only" [auth] "" `shouldRespondWith` 200
        *> request methodGet "/authors_only" [auth] "" `shouldRespondWith` 200

  it "Should not cache invalid JWTs" $ do
    expectCounters <- checkState' . specMetrics <$> getState

    let auth = authHeaderJWT "some random bytes"

    expectCounters
      [ requests (+ 2)
      , hits (+ 0)
      ]
      $ request methodGet "/authors_only" [auth] "" `shouldRespondWith` 401
        *> request methodGet "/authors_only" [auth] "" `shouldRespondWith` 401

  it "Should cache expired JWTs" $ do
    expectCounters <- checkState' . specMetrics <$> getState

    let auth = genToken [json|{"exp": 1, "role": "postgrest_test_author", "id": "jdoe2"}|]

    expectCounters
      [ requests (+ 2)
      , hits (+ 1)
      ]
      $ request methodGet "/authors_only" [auth] "" `shouldRespondWith` 401
        *> request methodGet "/authors_only" [auth] "" `shouldRespondWith` 401

  it "Should evict entries from the JWT cache (jwt cache max is 2)" $ do
    expectCounters <- checkState' . specMetrics <$> getState

    let
      jwt1 = genToken [json|{"exp": 9999999999, "role": "postgrest_test_author", "id": "jdoe3"}|]
      jwt2 = genToken [json|{"exp": 9999999999, "role": "postgrest_test_author", "id": "jdoe4"}|]
      jwt3 = genToken [json|{"exp": 9999999999, "role": "postgrest_test_author", "id": "jdoe5"}|]

    expectCounters
      [ requests (+ 6)
      , hits (+ 0)
      , evictions (+ 4)
      ]
      $ request methodGet "/authors_only" [jwt1] ""
        *> request methodGet "/authors_only" [jwt2] ""
        *> request methodGet "/authors_only" [jwt3] ""
        *> request methodGet "/authors_only" [jwt1] ""
        *> request methodGet "/authors_only" [jwt2] ""
        *> request methodGet "/authors_only" [jwt3] ""

  it "Should not evict entries from the JWT cache in FIFO order" $ do
    expectCounters <- checkState' . specMetrics <$> getState

    let
      jwt1 = genToken [json|{"exp": 9999999999, "role": "postgrest_test_author", "id": "jdoe6"}|]
      jwt2 = genToken [json|{"exp": 9999999999, "role": "postgrest_test_author", "id": "jdoe7"}|]
      jwt3 = genToken [json|{"exp": 9999999999, "role": "postgrest_test_author", "id": "jdoe8"}|]

    expectCounters
      [ requests (+ 6)
      , hits (+ 3)
      , evictions (+ 1)
      ]
      $ request methodGet "/authors_only" [jwt1] ""
        *> request methodGet "/authors_only" [jwt2] ""
        -- this one should hit the cache
        *> request methodGet "/authors_only" [jwt1] ""
        -- this one should trigger eviction of jwt2 (not FIFO)
        *> request methodGet "/authors_only" [jwt3] ""
        -- these two should hit the cache
        *> request methodGet "/authors_only" [jwt1] ""
        *> request methodGet "/authors_only" [jwt3] ""

  -- This one makes sure we test the scenario when finger
  -- has to move through the whole list first and pass the head
  -- The test case was added based on coverage report
  -- showing this scenario was not covered by previous tests
  it "Should evict entries even though all were hit" $ do
    expectCounters <- checkState' . specMetrics <$> getState

    let
      jwt1 = genToken [json|{"exp": 9999999999, "role": "postgrest_test_author", "id": "jdoe9"}|]
      jwt2 = genToken [json|{"exp": 9999999999, "role": "postgrest_test_author", "id": "jdoe10"}|]
      jwt3 = genToken [json|{"exp": 9999999999, "role": "postgrest_test_author", "id": "jdoe11"}|]

    expectCounters
      [ requests (+ 7)
      , hits (+ 4)
      , evictions (+ 1)
      ]
      $ request methodGet "/authors_only" [jwt1] ""
        *> request methodGet "/authors_only" [jwt2] ""
        -- these two should hit the cache
        *> request methodGet "/authors_only" [jwt1] ""
        *> request methodGet "/authors_only" [jwt2] ""
        -- this one should trigger eviction of jwt1
        *> request methodGet "/authors_only" [jwt3] ""
        -- these two should hit the cache
        *> request methodGet "/authors_only" [jwt2] ""
        *> request methodGet "/authors_only" [jwt3] ""
  where
    genToken = authHeaderJWT . generateJWT
    requests = expectCounter @"jwtCacheRequests"
    hits = expectCounter @"jwtCacheHits"
    evictions = expectCounter @"jwtCacheEvictions"
