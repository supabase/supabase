module Hasql.Transaction.Private.Sessions where

import Hasql.Session
import Hasql.Transaction.Config
import Hasql.Transaction.Private.Prelude

import Hasql.Transaction.Private.Statements qualified as Statements

{-
We may want to
do one transaction retry in case of the 23505 error, and fail if an identical
error is seen.
-}
inRetryingTransaction :: IsolationLevel -> Mode -> Bool -> Session (a, Bool) -> Session a
inRetryingTransaction level mode retryOnError session =
  fix $ \retry -> do
    attemptRes <- tryTransaction level mode retryOnError session
    maybe retry return attemptRes

tryTransaction :: IsolationLevel -> Mode -> Bool -> Session (a, Bool) -> Session (Maybe a)
tryTransaction level mode retryOnError body = do
  statement () (Statements.beginTransaction level mode)

  bodyRes <- catchError (fmap Just body) $ \error -> do
    statement () Statements.abortTransaction
    handleTransactionError error retryOnError $ return Nothing

  case bodyRes of
    Just (res, commit) -> catchError (commitOrAbort commit $> Just res) $ \error -> do
      handleTransactionError error retryOnError $ return Nothing
    Nothing -> return Nothing

commitOrAbort :: Bool -> Session ()
commitOrAbort commit =
  if commit then
    statement () Statements.commitTransaction
  else
    statement () Statements.abortTransaction

handleTransactionError :: SessionError -> Bool -> Session a -> Session a
handleTransactionError error retryOnError onTransactionError = case error of
  QueryError _ _ clientError -> onCommandError clientError
  PipelineError clientError -> onCommandError clientError
  where
    retryOrThrow = if retryOnError then onTransactionError else throwError error
    onCommandError = \case
      ResultError (ServerError code _ _ _ _) ->
        case code of
          "40001" -> retryOrThrow
          "40P01" -> retryOrThrow
          _ -> throwError error
      _ -> throwError error
