{-# LANGUAGE LambdaCase #-}
{-# LANGUAGE NamedFieldPuns #-}
{-# LANGUAGE StrictData #-}

-- |
-- Module      : PostgREST.Auth.JwtCache
-- Description : PostgREST JWT validation results Cache.
--
-- This module provides functions to deal with the JWT cache.
module PostgREST.Auth.JwtCache
  ( init
  , update
  , JwtCacheState
  , lookupJwtCache
  )
where

import Control.Concurrent.STM (newTVarIO, readTVar, writeTVar)
import Control.Concurrent.STM.TVar (TVar)
import Control.Monad.Error.Class (liftEither)
import Data.ByteString hiding (all, init)
import Data.IORef
  ( IORef
  , newIORef
  , readIORef
  , writeIORef
  )
import Jose.Jwk (JwkSet)
import Protolude

import Data.Aeson qualified as JSON
import Data.Aeson.KeyMap qualified as KM

import PostgREST.Auth.Jwt (parseAndDecodeClaims)
import PostgREST.Cache.Sieve (alwaysValid)
import PostgREST.Config (AppConfig (..))
import PostgREST.Error (Error (..), JwtError (JwtSecretMissing))
import PostgREST.Observation
  ( Observation (JwtCacheEviction, JwtCacheLookup)
  , ObservationHandler
  )

import PostgREST.Cache.Sieve qualified as SC

data JwtCacheState = JwtCacheState ObservationHandler (IORef JwtCache)

class CacheVariant m v where
  cached :: (MonadError Error n, MonadIO n) => SC.Cache m ByteString v -> ByteString -> n JSON.Object

-- |
-- Jwt caching can have three different configurations:
-- * missing JWT Key (no caching and throw error when JWT token present in the request)
-- * JWT cache turned off
-- * JWT cache turned on
--
-- All three options are represented by JwtCache data type.
--
-- Handling of reconfiguration is centralized in this module.
data JwtCache
  = JwtNoJwks
  | JwtNoCache JwkSet
  | forall m v. (CacheVariant m v) => JwtCache JwkSet (TVar Int) (SC.Cache m ByteString v)

instance CacheVariant IO (Either Error JSON.Object) where
  cached c = liftIO . SC.cached c >=> liftEither

instance CacheVariant (ExceptT Error IO) JSON.Object where
  cached c = liftIO . runExceptT . SC.cached c >=> liftEither

decode :: (MonadError Error m, MonadIO m) => JwtCache -> ByteString -> m JSON.Object
decode JwtNoJwks = const $ throwError (JwtErr JwtSecretMissing)
decode (JwtNoCache key) = parseAndDecodeClaims key
decode (JwtCache _ _ c) = cached c

-- | Reconfigure JWT caching and update JwtCacheState accordingly
update :: JwtCacheState -> AppConfig -> IO ()
update (JwtCacheState observationHandler jwtCacheState) config@AppConfig{configJWKS, configJwtCacheMaxEntries} =
  let reinitialize =
        newJwtCache config observationHandler
          >>= writeIORef jwtCacheState
  in  readIORef jwtCacheState >>= \case
        (JwtCache decodingKey maxSize _) ->
          if configJWKS /= Just decodingKey || configJwtCacheMaxEntries <= 0 then
            -- reinitialize if key changed or cache disabled
            reinitialize
          else
            -- max size changed - set it and let the cache shrink itself if necessary
            atomically $ writeTVar maxSize configJwtCacheMaxEntries
        _ -> reinitialize

init :: AppConfig -> ObservationHandler -> IO JwtCacheState
init config = fmap (<$>) JwtCacheState <*> (newJwtCache config >=> newIORef)

-- | Initialize JwtCacheState
newJwtCache :: AppConfig -> ObservationHandler -> IO JwtCache
newJwtCache AppConfig{configJWKS, configJwtCacheMaxEntries} observationHandler = do
  maybe (pure JwtNoJwks) initCache configJWKS
  where
    initCache key = if configJwtCacheMaxEntries <= 0 then pure (JwtNoCache key) else createCache key configJwtCacheMaxEntries

    createCache key maxSize = do
      maxSizeTVar <- newTVarIO maxSize
      JwtCache key maxSizeTVar
        <$> notCachingErrors (readTVar maxSizeTVar) key

    notCachingErrors :: STM Int -> JwkSet -> IO (SC.Cache (ExceptT Error IO) ByteString JSON.Object)
    notCachingErrors maxSize key =
      SC.cacheIO
        ( SC.CacheConfig
            maxSize
            copy
            (parseAndDecodeClaims key)
            (lift . observationHandler . JwtCacheLookup) -- lookup metrics
            (const . const $ lift $ observationHandler JwtCacheEviction) -- evictions metrics
            alwaysValid -- no invalidation for now
        )

lookupJwtCache :: (MonadError Error m, MonadIO m) => JwtCacheState -> Maybe ByteString -> m JSON.Object
lookupJwtCache (JwtCacheState _ cacheState) k = liftIO (readIORef cacheState) >>= flip (maybe (pure KM.empty)) k . decode
