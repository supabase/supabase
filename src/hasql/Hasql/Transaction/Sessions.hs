module Hasql.Transaction.Sessions
  ( transaction
  , transactionNoRetry

    -- * Transaction settings
  , C.Mode (..)
  , C.IsolationLevel (..)
  )
where

import Hasql.Transaction.Private.Prelude

import Hasql.Session qualified as B
import Hasql.Transaction.Config qualified as C
import Hasql.Transaction.Private.Transaction qualified as A

-- |
-- Execute the transaction using the provided isolation level and mode.
{-# INLINE transaction #-}
transaction :: C.IsolationLevel -> C.Mode -> A.Transaction a -> B.Session a
transaction isolation mode transaction =
  A.run transaction isolation mode True

-- |
-- Execute the transaction but do not retry it on errors.
{-# INLINE transactionNoRetry #-}
transactionNoRetry :: C.IsolationLevel -> C.Mode -> A.Transaction a -> B.Session a
transactionNoRetry isolation mode transaction =
  A.run transaction isolation mode False
