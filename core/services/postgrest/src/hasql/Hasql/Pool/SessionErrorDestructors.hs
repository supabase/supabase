module Hasql.Pool.SessionErrorDestructors where

import Hasql.Pool.Prelude

import Hasql.Session qualified as Session

reset :: (Maybe ByteString -> x) -> x -> Session.SessionError -> x
reset onReset onNoReset = \case
  Session.QueryError _ _ (Session.ClientError details) -> onReset details
  Session.PipelineError (Session.ClientError details) -> onReset details
  _ -> onNoReset
