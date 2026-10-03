module Main where

import Test.Tasty
import Test.Tasty.HUnit
import Prelude hiding (assert)

import Data.ByteString qualified as ByteString
import Data.ByteString.Char8 qualified as ByteStringChar8

import Hasql.Connection qualified as Connection
import Hasql.Decoders qualified as Decoders
import Hasql.DynamicStatements.Session qualified as Session
import Hasql.DynamicStatements.Snippet qualified as Snippet
import Hasql.DynamicStatements.Statement qualified as Statement
import Hasql.Session qualified as Session
import Hasql.Statement qualified as Statement

main :: IO ()
main =
  defaultMain tree

tree :: TestTree
tree =
  testGroup
    "All tests"
    [ testCase "Select substring" $
        let sample string from to =
              let
                snippet =
                  "select substring("
                    <> Snippet.param @Text string
                    <> foldMap (mappend " from " . Snippet.param @Int32) from
                    <> foldMap (mappend " for " . Snippet.param @Int32) to
                    <> ")"
                decoder = Decoders.singleRow (Decoders.column (Decoders.nonNullable Decoders.text))
              in
                runSession (Session.dynamicallyParameterizedStatement snippet decoder True)
        in  do
              assertEqual "" (Right (Right "bc")) =<< sample "abcd" (Just 2) (Just 2)
              assertEqual "" (Right (Right "bcd")) =<< sample "abcd" (Just 2) (Just 3)
              assertEqual "" (Right (Right "abc")) =<< sample "abcd" Nothing (Just 3)
              assertEqual "" (Right (Right "bcd")) =<< sample "abcd" (Just 2) Nothing
    , testGroup
        "Regression"
        [ testCase "Missing $ for 1000th parameter string #2" $
            let
              snippet =
                "SELECT 1 " <> foldMap @[] ("," <>) (replicate 1001 $ Snippet.param (10 :: Int64))
              statement =
                Statement.dynamicallyParameterized snippet Decoders.noResult True
              sql =
                case statement of
                  Statement.Statement x _ _ _ -> x
            in
              do
                assertBool (ByteStringChar8.unpack sql) (ByteString.isInfixOf "$1000" sql)
        ]
    ]

runSession :: Session.Session a -> IO (Either Connection.ConnectionError (Either Session.SessionError a))
runSession = withConnection . Session.run

withConnection :: (Connection.Connection -> IO a) -> IO (Either Connection.ConnectionError a)
withConnection handler =
  runExceptT $ acquire >>= \connection -> use connection <* release connection
  where
    acquire =
      ExceptT $ Connection.acquire settings
      where
        settings =
          Connection.settings host port user password database
          where
            host = "localhost"
            port = 5432
            user = "postgres"
            password = "postgres"
            database = "postgres"
    use connection =
      lift $ handler connection
    release connection =
      lift $ Connection.release connection
