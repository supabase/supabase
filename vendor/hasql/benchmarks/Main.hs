module Main where

import Criterion
import Criterion.Main
import Prelude

import Hasql.Connection qualified as A
import Hasql.Decoders qualified as D
import Hasql.Pipeline qualified as E
import Hasql.Session qualified as B
import Hasql.Statement qualified as C

main :: IO ()
main =
  do
    Right connection <- acquireConnection
    useConnection connection
  where
    acquireConnection =
      A.acquire []
    useConnection connection =
      defaultMain
        [ sessionBench "largeResultInVector" sessionWithSingleLargeResultInVector
        , sessionBench "largeResultInList" sessionWithSingleLargeResultInList
        , sessionBench "manyLargeResults" sessionWithManyLargeResults
        , sessionBench "manyLargeResultsViaPipeline" sessionWithManyLargeResultsViaPipeline
        , sessionBench "manySmallResults" sessionWithManySmallResults
        , sessionBench "manySmallResultsViaPipeline" sessionWithManySmallResultsViaPipeline
        ]
      where
        sessionBench :: (NFData a) => String -> B.Session a -> Benchmark
        sessionBench name session =
          bench name (nfIO (B.run session connection >>= either (fail . show) pure))

-- * Sessions

sessionWithSingleLargeResultInVector :: B.Session (Vector (Int64, Int64))
sessionWithSingleLargeResultInVector =
  B.statement () statementWithManyRowsInVector

sessionWithSingleLargeResultInList :: B.Session [(Int64, Int64)]
sessionWithSingleLargeResultInList =
  B.statement () statementWithManyRowsInList

sessionWithManyLargeResults :: B.Session [Vector (Int64, Int64)]
sessionWithManyLargeResults =
  replicateM 100 (B.statement () statementWithManyRowsInVector)

sessionWithManySmallResults :: B.Session [(Int64, Int64)]
sessionWithManySmallResults =
  replicateM 100 (B.statement () statementWithSingleRow)

sessionWithManyLargeResultsViaPipeline :: B.Session [Vector (Int64, Int64)]
sessionWithManyLargeResultsViaPipeline =
  B.pipeline (replicateM 100 (E.statement () statementWithManyRowsInVector))

sessionWithManySmallResultsViaPipeline :: B.Session [(Int64, Int64)]
sessionWithManySmallResultsViaPipeline =
  B.pipeline (replicateM 100 (E.statement () statementWithSingleRow))

-- * Statements

statementWithSingleRow :: C.Statement () (Int64, Int64)
statementWithSingleRow =
  C.Statement template encoder decoder True
  where
    template =
      "SELECT 1, 2"
    encoder =
      conquer
    decoder =
      D.singleRow row
      where
        row =
          tuple <$> (D.column . D.nonNullable) D.int8 <*> (D.column . D.nonNullable) D.int8
          where
            tuple !a !b =
              (a, b)

statementWithManyRows :: (D.Row (Int64, Int64) -> D.Result result) -> C.Statement () result
statementWithManyRows decoder =
  C.Statement template encoder (decoder rowDecoder) True
  where
    template =
      "SELECT generate_series(0,1000) as a, generate_series(1000,2000) as b"
    encoder =
      conquer
    rowDecoder =
      tuple <$> (D.column . D.nonNullable) D.int8 <*> (D.column . D.nonNullable) D.int8
      where
        tuple !a !b =
          (a, b)

statementWithManyRowsInVector :: C.Statement () (Vector (Int64, Int64))
statementWithManyRowsInVector =
  statementWithManyRows D.rowVector

statementWithManyRowsInList :: C.Statement () [(Int64, Int64)]
statementWithManyRowsInList =
  statementWithManyRows D.rowList
