-- |
-- Module      : PostgREST.Cors
-- Description : Wai Middleware to set cors policy.
module PostgREST.Cors (middleware) where

import Data.List (lookup)
import Protolude

import Data.ByteString.Char8 qualified as BS
import Data.CaseInsensitive qualified as CI
import Data.Text.Encoding qualified as T
import Network.Wai qualified as Wai
import Network.Wai.Middleware.Cors qualified as Wai

import PostgREST.AppState (AppState, getConfig)
import PostgREST.Config (AppConfig (..))

middleware :: AppState -> Wai.Middleware
middleware appState app req res = do
  conf <- getConfig appState
  Wai.cors (corsPolicy $ configServerCorsAllowedOrigins conf) app req res

-- | CORS policy to be used in by Wai Cors middleware
corsPolicy :: [Text] -> Wai.Request -> Maybe Wai.CorsResourcePolicy
corsPolicy corsAllowedOrigins req = case lookup "origin" headers of
  Just _ ->
    Just
      Wai.CorsResourcePolicy
        { Wai.corsOrigins = case corsAllowedOrigins of
            [] -> Nothing
            origins -> Just (map T.encodeUtf8 origins, True)
        , Wai.corsMethods = ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
        , Wai.corsRequestHeaders = "Authorization" : accHeaders
        , Wai.corsExposedHeaders =
            Just
              [ "Content-Encoding"
              , "Content-Location"
              , "Content-Range"
              , "Content-Type"
              , "Date"
              , "Location"
              , "Server"
              , "Transfer-Encoding"
              , "Range-Unit"
              ]
        , Wai.corsMaxAge = Just $ 60 * 60 * 24
        , Wai.corsVaryOrigin = False
        , Wai.corsRequireOrigin = False
        , Wai.corsIgnoreFailures = True
        }
  Nothing -> Nothing
  where
    headers = Wai.requestHeaders req
    accHeaders = case lookup "access-control-request-headers" headers of
      Just hdrs -> map (CI.mk . BS.strip) $ BS.split ',' hdrs
      -- Impossible case, Middleware.Cors will not evaluate this when
      -- the Access-Control-Request-Headers header is not set.
      Nothing -> []
