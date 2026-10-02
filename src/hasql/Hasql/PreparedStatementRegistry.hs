module Hasql.PreparedStatementRegistry
  ( PreparedStatementRegistry
  , new
  , update
  , reset
  , LocalKey (..)
  )
where

import ByteString.StrictBuilder qualified as B
import Data.HashTable.IO qualified as A

import Hasql.Prelude hiding (lookup, reset)

import Hasql.LibPq14 qualified as Pq

data PreparedStatementRegistry
  = PreparedStatementRegistry !(A.BasicHashTable LocalKey ByteString) !(IORef Word)

{-# INLINEABLE new #-}
new :: IO PreparedStatementRegistry
new =
  PreparedStatementRegistry <$> A.new <*> newIORef 0

{-# INLINEABLE update #-}
update :: LocalKey -> (ByteString -> IO (Bool, a)) -> (ByteString -> IO a) -> PreparedStatementRegistry -> IO a
update localKey onNewRemoteKey onOldRemoteKey (PreparedStatementRegistry table counter) =
  lookup >>= maybe new old
  where
    lookup =
      A.lookup table localKey
    new =
      readIORef counter >>= onN
      where
        onN n =
          do
            (save, result) <- onNewRemoteKey remoteKey
            when save $ do
              A.insert table localKey remoteKey
              writeIORef counter (succ n)
            return result
          where
            remoteKey =
              B.builderBytes . B.asciiIntegral $ n
    old =
      onOldRemoteKey

reset :: PreparedStatementRegistry -> IO ()
reset (PreparedStatementRegistry table counter) = do
  -- TODO: This is a temporary measure.
  -- We should just move to a pure implementation.
  do
    entries <- A.toList table
    forM_ entries \(k, _) -> A.delete table k
  writeIORef counter 0

-- |
-- Local statement key.
data LocalKey
  = LocalKey !ByteString ![Pq.Oid]
  deriving (Eq, Show)

instance Hashable LocalKey where
  {-# INLINE hashWithSalt #-}
  hashWithSalt salt (LocalKey template _) =
    hashWithSalt salt template
