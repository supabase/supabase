module Main where

import Prelude

import Control.Concurrent.Async qualified as F
import Main.Statements qualified as D
import Main.Transactions qualified as E

import Hasql.Connection qualified as A
import Hasql.Connection.Setting qualified as H
import Hasql.Connection.Setting.Connection qualified as I
import Hasql.Connection.Setting.Connection.Param qualified as J
import Hasql.Session qualified as B
import Hasql.Transaction qualified as C
import Hasql.Transaction.Sessions qualified as G

main :: IO ()
main =
  bracket acquire release use
  where
    acquire =
      (,) <$> acquire <*> acquire
      where
        acquire =
          either (fail . show) return =<< A.acquire connectionSettings
          where
            connectionSettings =
              [ H.connection
                  ( I.params
                      [ J.host "localhost"
                      , J.port 5432
                      , J.user "postgres"
                      , J.password "postgres"
                      , J.dbname "postgres"
                      ]
                  )
              ]
    release (connection1, connection2) =
      do
        transaction connection1 E.dropSchema
        A.release connection1
        A.release connection2
    use (connection1, connection2) =
      do
        try (transaction connection1 E.dropSchema) :: IO (Either SomeException ())
        transaction connection1 E.createSchema
        success <- fmap and (traverse runTest tests)
        if success then
          exitSuccess
        else
          exitFailure
      where
        runTest test =
          test connection1 connection2
        tests =
          [readAndWriteTransactionsTest, transactionsTest, transactionsNoRetryTest, transactionAndQueryTest]

session :: A.Connection -> B.Session a -> IO a
session connection session =
  B.run session connection
    >>= either (fail . show) return

transaction :: A.Connection -> C.Transaction a -> IO a
transaction connection transaction =
  session connection (G.transaction G.RepeatableRead G.Write transaction)

transactionNoRetry :: A.Connection -> C.Transaction a -> IO a
transactionNoRetry connection transaction =
  session connection (G.transactionNoRetry G.RepeatableRead G.Write transaction)

type Test =
  A.Connection -> A.Connection -> IO Bool

transactionsTest :: Test
transactionsTest connection1 connection2 =
  do
    id1 <- session connection1 (B.statement 0 D.createAccount)
    id2 <- session connection1 (B.statement 0 D.createAccount)
    async1 <- F.async (replicateM_ 1000 (transaction connection1 (E.transfer id1 id2 1)))
    async2 <- F.async (replicateM_ 1000 (transaction connection2 (E.transfer id1 id2 1)))
    F.wait async1
    F.wait async2
    balance1 <- session connection1 (B.statement id1 D.getBalance)
    balance2 <- session connection1 (B.statement id2 D.getBalance)
    traceShowM balance1
    traceShowM balance2
    return (balance1 == Just 2000 && balance2 == Just (-2000))

transactionsNoRetryTest :: Test
transactionsNoRetryTest connection1 connection2 =
  do
    id1 <- session connection1 (B.statement 0 D.createAccount)
    id2 <- session connection1 (B.statement 0 D.createAccount)
    async1 <- F.async (replicateM_ 1000 (transactionNoRetry connection1 (E.transfer id1 id2 1)))
    async2 <- F.async (replicateM_ 1000 (transactionNoRetry connection2 (E.transfer id1 id2 1)))
    result1 <- F.waitCatch async1
    result2 <- F.waitCatch async2
    let serialError = sequenceA [result1, result2]
    traceShowM serialError
    return $ either (("40001" `isInfixOf`) . show) (pure False) serialError

readAndWriteTransactionsTest :: Test
readAndWriteTransactionsTest connection1 connection2 =
  do
    id1 <- session connection1 (B.statement 0 D.createAccount)
    id2 <- session connection1 (B.statement 0 D.createAccount)
    async1 <- F.async (replicateM_ 1000 (transaction connection1 (E.transfer id1 id2 1)))
    async2 <- F.async (replicateM_ 1000 (transaction connection2 (C.statement id1 D.getBalance)))
    F.wait async1
    F.wait async2
    balance1 <- session connection1 (B.statement id1 D.getBalance)
    balance2 <- session connection1 (B.statement id2 D.getBalance)
    traceShowM balance1
    traceShowM balance2
    return (balance1 == Just 1000 && balance2 == Just (-1000))

transactionAndQueryTest :: Test
transactionAndQueryTest connection1 connection2 =
  do
    id1 <- session connection1 (B.statement 0 D.createAccount)
    id2 <- session connection1 (B.statement 0 D.createAccount)
    async1 <- F.async (transaction connection1 (E.transferTimes 200 id1 id2 1))
    async2 <- F.async (session connection2 (replicateM_ 200 (B.statement (id1, 1) D.modifyBalance)))
    F.wait async1
    F.wait async2
    balance1 <- session connection1 (B.statement id1 D.getBalance)
    balance2 <- session connection1 (B.statement id2 D.getBalance)
    traceShowM balance1
    traceShowM balance2
    return (balance1 == Just 400 && balance2 == Just (-200))
