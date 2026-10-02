module Hasql.Transaction.Config where

import Hasql.Transaction.Private.Prelude

data Mode
  = -- |
    -- Read-only. No writes possible.
    Read
  | -- |
    -- Write and commit.
    Write
  deriving (Bounded, Enum, Eq, Ord, Show)

-- |
-- For reference see
-- <http://www.postgresql.org/docs/current/static/transaction-iso.html the Postgres' documentation>.
data IsolationLevel
  = ReadCommitted
  | RepeatableRead
  | Serializable
  deriving (Bounded, Enum, Eq, Ord, Show)
