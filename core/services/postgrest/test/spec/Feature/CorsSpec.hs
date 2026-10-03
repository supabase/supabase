module Feature.CorsSpec where

import Network.HTTP.Types
import Protolude
import Test.Hspec
import Test.Hspec.Wai

import PostgREST.Config (AppConfig (..))
import SpecHelper

spec :: SpecWithConfig
spec withConfig = do
  withConfig baseCfg $ describe "CORS" $ do
    it "replies naively and permissively to preflight request" $
      request
        methodOptions
        "/"
        [ ("Accept", "*/*")
        , ("Origin", "http://example.com")
        , ("Access-Control-Request-Method", "POST")
        , ("Access-Control-Request-Headers", "Foo,Bar")
        ]
        ""
        `shouldRespondWith` ""
          { matchHeaders =
              [ "Access-Control-Allow-Origin" <:> "*"
              , "Access-Control-Allow-Methods" <:> "GET, POST, PATCH, PUT, DELETE, OPTIONS, HEAD"
              , "Access-Control-Allow-Headers" <:> "Authorization, Foo, Bar, Accept, Accept-Language, Content-Language"
              , "Access-Control-Max-Age" <:> "86400"
              ]
          }

    it "exposes necesssary response headers to regular request" $
      request
        methodGet
        "/items"
        [("Origin", "http://example.com")]
        ""
        `shouldRespondWith` ResponseMatcher
          { matchStatus = 200
          , matchBody = MatchBody (\_ _ -> Nothing) -- match any body
          , matchHeaders =
              [ "Access-Control-Expose-Headers"
                  <:> "Content-Encoding, Content-Location, Content-Range, Content-Type, \
                      \Date, Location, Server, Transfer-Encoding, Range-Unit"
              ]
          }

    it "allows INFO body through even with CORS request headers present to postflight request" $ do
      request
        methodOptions
        "/items"
        [ ("Host", "localhost:3000")
        , ("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:32.0) Gecko/20100101 Firefox/32.0")
        , ("Origin", "http://localhost:8000")
        , ("Accept", "text/csv, */*; q=0.01")
        , ("Accept-Language", "en-US,en;q=0.5")
        , ("Accept-Encoding", "gzip, deflate")
        , ("Referer", "http://localhost:8000/")
        , ("Connection", "keep-alive")
        ]
        ""
        `shouldRespondWith` ""
          { matchHeaders = ["Access-Control-Allow-Origin" <:> "*"]
          }

      request
        methodOptions
        "/items"
        [("Accept", "application/json")]
        ""
        `shouldRespondWith` ""
          { matchHeaders = ["Access-Control-Allow-Origin" <:> "*"]
          }

      request
        methodOptions
        "/shops"
        [("Accept", "application/geo+json")]
        ""
        `shouldRespondWith` ""
          { matchHeaders = ["Access-Control-Allow-Origin" <:> "*"]
          }

  withConfig baseCfg{configServerCorsAllowedOrigins = ["http://example.com", "http://example2.com"]} $
    describe "test preflight/non-preflight request and cors server allowed config" $ do
      it "OPTIONS preflight request should return Access-Control-Allow-Origin equal to origin" $
        request
          methodOptions
          "/items"
          [ ("Accept", "*/*")
          , ("Origin", "http://example.com")
          , ("Access-Control-Request-Method", "POST")
          , ("Access-Control-Request-Headers", "Content-Type")
          ]
          ""
          `shouldRespondWith` ResponseMatcher
            { matchStatus = 200
            , matchBody = MatchBody (\_ _ -> Nothing) -- match any body
            , matchHeaders =
                [ "Access-Control-Allow-Origin" <:> "http://example.com"
                , "Access-Control-Allow-Credentials" <:> "true"
                ]
            }

      it "GET no preflight request should return Access-Control-Allow-Origin equal to origin" $
        request
          methodGet
          "/items"
          [ ("Accept", "*/*")
          , ("Origin", "http://example.com")
          ]
          ""
          `shouldRespondWith` ResponseMatcher
            { matchStatus = 200
            , matchBody = MatchBody (\_ _ -> Nothing) -- match any body
            , matchHeaders = ["Access-Control-Allow-Origin" <:> "http://example.com"]
            }

      it "GET no preflight request should not return Access-Control-Allow-Origin" $
        request
          methodGet
          "/items"
          [ ("Accept", "*/*")
          , ("Origin", "http://invalid.com")
          ]
          ""
          `shouldRespondWith` ResponseMatcher
            { matchStatus = 200
            , matchBody = MatchBody (\_ _ -> Nothing) -- match any body
            , matchHeaders = [matchHeaderAbsent "Access-Control-Allow-Origin"]
            }

  withConfig baseCfg{configServerCorsAllowedOrigins = []} $
    describe "test preflight request with empty cors allowed origin config" $
      it "OPTIONS preflight request should allow all origins when config is not set or empty" $
        request
          methodOptions
          "/items"
          [ ("Accept", "*/*")
          , ("Origin", "http://anyorigin.com")
          , ("Access-Control-Request-Method", "POST")
          , ("Access-Control-Request-Headers", "Content-Type")
          ]
          ""
          `shouldRespondWith` ResponseMatcher
            { matchStatus = 200
            , matchBody = MatchBody (\_ _ -> Nothing) -- match any body
            , matchHeaders =
                [ "Access-Control-Allow-Origin" <:> "*"
                , matchHeaderValuePresent "Access-Control-Allow-Methods" "POST"
                ]
            }
