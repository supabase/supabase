-- |
-- Module      : PostgREST.Auth
-- Description : PostgREST authentication functions.
--
-- This module provides functions to deal with the JWT authentication (http://jwt.io).
-- It also can be used to define other authentication functions,
-- in the future Oauth, LDAP and similar integrations can be coded here.
--
-- Authentication should always be implemented in an external service.
-- In the test suite there is an example of simple login function that can be used for a
-- very simple authentication system inside the PostgreSQL database.
module PostgREST.Auth (getAuthResult) where

import Protolude

import PostgREST.AppState (AppState, getConfig, getJwtCacheState, getTime)
import PostgREST.Auth.Jwt (parseClaims)
import PostgREST.Auth.JwtCache (lookupJwtCache)
import PostgREST.Auth.Types (AuthResult)
import PostgREST.Error (Error)

-- | Perform authentication and authorization
--   Parse JWT and return AuthResult
getAuthResult :: (MonadError Error m, MonadIO m) => AppState -> Maybe ByteString -> m AuthResult
getAuthResult appState token = do
  conf <- liftIO $ getConfig appState
  time <- liftIO $ getTime appState

  parseClaims conf time =<< lookupJwtCache (getJwtCacheState appState) token
