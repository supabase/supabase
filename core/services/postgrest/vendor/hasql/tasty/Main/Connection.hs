module Main.Connection where

import Main.Prelude

import Hasql.TestingKit.Constants qualified as Constants

import Hasql.Connection qualified as HC

with :: (HC.Connection -> IO a) -> IO (Either HC.ConnectionError a)
with handler =
  runExceptT $ acquire >>= \connection -> use connection <* release connection
  where
    acquire =
      ExceptT $ HC.acquire Constants.localConnectionSettings
    use connection =
      lift $ handler connection
    release connection =
      lift $ HC.release connection
