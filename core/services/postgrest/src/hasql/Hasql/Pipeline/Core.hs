module Hasql.Pipeline.Core where

import Hasql.Errors
import Hasql.Prelude

import Hasql.Decoders.All qualified as Decoders
import Hasql.Decoders.Result qualified as Decoders.Result
import Hasql.Decoders.Results qualified as Decoders.Results
import Hasql.Encoders.All qualified as Encoders
import Hasql.Encoders.Params qualified as Encoders.Params
import Hasql.LibPq14 qualified as Pq
import Hasql.PreparedStatementRegistry qualified as PreparedStatementRegistry
import Hasql.Statement qualified as Statement

run :: forall a. Pipeline a -> Bool -> Pq.Connection -> PreparedStatementRegistry.PreparedStatementRegistry -> Bool -> IO (Either SessionError a)
run (Pipeline sendQueriesInIO) usePreparedStatements connection registry integerDatetimes = do
  runExceptT do
    enterPipelineMode
    recvQueries <- sendQueries
    pipelineSync
    finallyE recvQueries do
      recvPipelineSync
      exitPipelineMode
  where
    enterPipelineMode :: ExceptT SessionError IO ()
    enterPipelineMode =
      runCommand $ Pq.enterPipelineMode connection

    exitPipelineMode :: ExceptT SessionError IO ()
    exitPipelineMode =
      runCommand $ Pq.exitPipelineMode connection

    sendQueries :: ExceptT SessionError IO (ExceptT SessionError IO a)
    sendQueries =
      fmap ExceptT $ ExceptT $ sendQueriesInIO usePreparedStatements connection registry integerDatetimes

    pipelineSync :: ExceptT SessionError IO ()
    pipelineSync =
      runCommand $ Pq.pipelineSync connection

    recvPipelineSync :: ExceptT SessionError IO ()
    recvPipelineSync =
      runResultsDecoder
        $ Decoders.Results.single Decoders.Result.pipelineSync

    runResultsDecoder :: forall a. Decoders.Results.Results a -> ExceptT SessionError IO a
    runResultsDecoder decoder =
      ExceptT (first PipelineError <$> Decoders.Results.run decoder connection integerDatetimes)

    runCommand :: IO Bool -> ExceptT SessionError IO ()
    runCommand action =
      lift action >>= \case
        True -> pure ()
        False -> ExceptT (Left . PipelineError . ClientError <$> Pq.errorMessage connection)

-- |
-- Composable abstraction over the execution of queries in [the pipeline mode](https://www.postgresql.org/docs/current/libpq-pipeline-mode.html).
--
-- It allows you to issue multiple queries to the server in much fewer network transactions.
-- If the amounts of sent and received data do not surpass the buffer sizes in the driver and on the server it will be just a single roundtrip.
-- Typically the buffer size is 8KB.
--
-- This execution mode is much more efficient than running queries directly from 'Hasql.Session.Session', because in session every statement execution involves a dedicated network roundtrip.
-- An obvious question rises then: why not execute all queries like that?
--
-- In situations where the parameters depend on the result of another query it is impossible to execute them in parallel, because the client needs to receive the results of one query before sending the request to execute the next.
-- This reasoning is essentially the same as the one for the difference between 'Applicative' and 'Monad'.
-- That\'s why 'Pipeline' does not have the 'Monad' instance.
--
-- To execute 'Pipeline' lift it into 'Hasql.Session.Session' via 'Hasql.Session.pipeline'.
--
-- == __Examples__
--
-- === Insert-Many or Batch-Insert
--
-- You can use pipeline to turn a single-row insert query into an efficient multi-row insertion session.
-- In effect this should be comparable in performance to issuing a single multi-row insert statement.
--
-- Given the following definition in a Statements module:
--
-- @
-- insertOrder :: 'Hasql.Statement.Statement' OrderDetails OrderId
-- @
--
-- You can lift it into the following session
--
-- @
-- insertOrders :: [OrderDetails] -> 'Hasql.Session.Session' [OrderId]
-- insertOrders orders =
--   'Hasql.Session.pipeline' $
--     for orders $ \\order ->
--       'Hasql.Pipeline.statement' order Statements.insertOrder
-- @
--
-- === Combining Queries
--
-- Given the following definitions in a Statements module:
--
-- @
-- selectOrderDetails :: 'Hasql.Statement.Statement' OrderId (Maybe OrderDetails)
-- selectOrderProducts :: 'Hasql.Statement.Statement' OrderId [OrderProduct]
-- selectOrderFinancialTransactions :: 'Hasql.Statement.Statement' OrderId [FinancialTransaction]
-- @
--
-- You can combine them into a session using the `ApplicativeDo` extension as follows:
--
-- @
-- selectEverythingAboutOrder :: OrderId -> 'Hasql.Session.Session' (Maybe OrderDetails, [OrderProduct], [FinancialTransaction])
-- selectEverythingAboutOrder orderId =
--   'Hasql.Session.pipeline' $ do
--     details <- 'Hasql.Pipeline.statement' orderId Statements.selectOrderDetails
--     products <- 'Hasql.Pipeline.statement' orderId Statements.selectOrderProducts
--     transactions <- 'Hasql.Pipeline.statement' orderId Statements.selectOrderFinancialTransactions
--     pure (details, products, transactions)
-- @
newtype Pipeline a
  = Pipeline
      ( Bool
        -> Pq.Connection
        -> PreparedStatementRegistry.PreparedStatementRegistry
        -> Bool
        -> IO (Either SessionError (IO (Either SessionError a)))
      )
  deriving (Functor)

instance Applicative Pipeline where
  pure a =
    Pipeline (\_ _ _ _ -> pure (Right (pure (Right a))))

  Pipeline lSend <*> Pipeline rSend =
    Pipeline \usePreparedStatements conn reg integerDatetimes ->
      lSend usePreparedStatements conn reg integerDatetimes >>= \case
        Left sendErr ->
          pure (Left sendErr)
        Right lRecv ->
          rSend usePreparedStatements conn reg integerDatetimes <&> \case
            Left sendErr ->
              Left sendErr
            Right rRecv ->
              Right (liftA2 (<*>) lRecv rRecv)

-- |
-- Execute a statement in pipelining mode.
statement :: params -> Statement.Statement params result -> Pipeline result
statement params (Statement.Statement sql (Encoders.Params encoder) (Decoders.Result decoder) preparable) =
  Pipeline run
  where
    run usePreparedStatements connection registry integerDatetimes =
      if usePreparedStatements && preparable then
        runPrepared
      else
        runUnprepared
      where
        runPrepared = runExceptT do
          (key, keyRecv) <- ExceptT resolvePreparedStatementKey
          queryRecv <- ExceptT (sendQuery key)
          pure (keyRecv *> queryRecv)
          where
            (oidList, valueAndFormatList) =
              Encoders.Params.compilePreparedStatementData encoder integerDatetimes params

            resolvePreparedStatementKey =
              PreparedStatementRegistry.update localKey onNewRemoteKey onOldRemoteKey registry
              where
                localKey =
                  PreparedStatementRegistry.LocalKey sql oidList
                onNewRemoteKey key =
                  do
                    sent <- Pq.sendPrepare connection key sql (mfilter (not . null) (Just oidList))
                    if sent then
                      pure (True, Right (key, recv))
                    else
                      (False,) . Left . commandToSessionError . ClientError <$> Pq.errorMessage connection
                  where
                    recv =
                      fmap (first commandToSessionError)
                        $ (<*)
                        <$> Decoders.Results.run (Decoders.Results.single Decoders.Result.noResult) connection integerDatetimes
                        <*> Decoders.Results.run Decoders.Results.dropRemainders connection integerDatetimes
                onOldRemoteKey key =
                  pure (Right (key, pure (Right ())))

            sendQuery key =
              Pq.sendQueryPrepared connection key valueAndFormatList Pq.Binary >>= \case
                False -> Left . commandToSessionError . ClientError <$> Pq.errorMessage connection
                True -> pure (Right recv)
              where
                recv =
                  fmap (first commandToSessionError)
                    $ (<*)
                    <$> Decoders.Results.run decoder connection integerDatetimes
                    <*> Decoders.Results.run Decoders.Results.dropRemainders connection integerDatetimes

        runUnprepared =
          Pq.sendQueryParams connection sql (Encoders.Params.compileUnpreparedStatementData encoder integerDatetimes params) Pq.Binary >>= \case
            False -> Left . commandToSessionError . ClientError <$> Pq.errorMessage connection
            True -> pure (Right recv)
          where
            recv =
              fmap (first commandToSessionError)
                $ (<*)
                <$> Decoders.Results.run decoder connection integerDatetimes
                <*> Decoders.Results.run Decoders.Results.dropRemainders connection integerDatetimes

    commandToSessionError =
      QueryError sql (Encoders.Params.renderReadable encoder params)
