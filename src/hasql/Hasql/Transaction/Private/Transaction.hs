module Hasql.Transaction.Private.Transaction where

import Hasql.Transaction.Config
import Hasql.Transaction.Private.Prelude

import Hasql.Session qualified as B
import Hasql.Statement qualified as A
import Hasql.Transaction.Private.Sessions qualified as D

-- |
-- A composable abstraction over the retryable transactions.
--
-- Executes multiple queries under the specified mode and isolation level,
-- while automatically retrying the transaction in case of conflicts.
-- Thus this abstraction closely reproduces the behaviour of 'STM'.
newtype Transaction a
  = Transaction (StateT Bool B.Session a)
  deriving (Applicative, Functor, Monad)

instance (Semigroup a) => Semigroup (Transaction a) where
  (<>) = liftA2 (<>)

instance (Monoid a) => Monoid (Transaction a) where
  mempty = pure mempty

-- |
-- Execute the transaction using the provided isolation level and mode.
{-# INLINE run #-}
run :: Transaction a -> IsolationLevel -> Mode -> Bool -> B.Session a
run (Transaction session) isolation mode retryOnError =
  D.inRetryingTransaction isolation mode retryOnError (runStateT session True)

-- |
-- Possibly a multi-statement query,
-- which however cannot be parameterized or prepared,
-- nor can any results of it be collected.
{-# INLINE sql #-}
sql :: ByteString -> Transaction ()
sql =
  Transaction . lift . B.sql

-- |
-- Parameters and a specification of the parametric query to apply them to.
{-# INLINE statement #-}
statement :: a -> A.Statement a b -> Transaction b
statement params statement =
  Transaction . lift $ B.statement params statement

-- |
-- Cause transaction to eventually roll back.
{-# INLINE condemn #-}
condemn :: Transaction ()
condemn =
  Transaction $ put False
