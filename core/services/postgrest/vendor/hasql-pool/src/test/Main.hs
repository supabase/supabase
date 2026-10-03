module Main where

import Control.Concurrent.Async (race)
import Test.Hspec
import Prelude

import Data.Text qualified as Text
import System.Environment qualified
import System.Random.Stateful qualified as Random

import Hasql.Pool

import Hasql.Connection qualified as Connection
import Hasql.Connection.Setting qualified as Connection.Setting
import Hasql.Connection.Setting.Connection qualified as Connection.Setting.Connection
import Hasql.Decoders qualified as Decoders
import Hasql.Encoders qualified as Encoders
import Hasql.Pool.Config qualified as Config
import Hasql.Session qualified as Session
import Hasql.Statement qualified as Statement

main :: IO ()
main = do
  connectionString <- getConnectionString
  let
    withPool poolSize acqTimeout maxLifetime maxIdletime connectionString =
      bracket
        ( acquire
            ( Config.settings
                [ Config.size poolSize
                , Config.acquisitionTimeout acqTimeout
                , Config.agingTimeout maxLifetime
                , Config.idlenessTimeout maxIdletime
                , Config.staticConnectionSettings
                    [ Connection.Setting.connection
                        (Connection.Setting.Connection.string connectionString)
                    ]
                ]
            )
        )
        release
    withDefaultPool =
      withPool 3 10 1_800 1_800 connectionString

  hspec . describe "" $ do
    it "Releases a spot in the pool when there is a query error" $ withDefaultPool $ \pool -> do
      use pool badQuerySession `shouldNotReturn` Right ()
      use pool selectOneSession `shouldReturn` Right 1
    it "Simulation of connection error works" $ withDefaultPool $ \pool -> do
      res <- use pool $ closeConnSession >> selectOneSession
      shouldSatisfy res $ \case
        Left (SessionUsageError (Session.QueryError _ _ (Session.ClientError _))) -> True
        _ -> False
    it "Connection errors cause eviction of connection" $ withDefaultPool $ \pool -> do
      _ <- use pool $ closeConnSession >> selectOneSession
      _ <- use pool $ closeConnSession >> selectOneSession
      _ <- use pool $ closeConnSession >> selectOneSession
      res <- use pool selectOneSession
      shouldSatisfy res isRight
    it "Connection gets returned to the pool after normal use" $ withDefaultPool $ \pool -> do
      _ <- use pool selectOneSession
      _ <- use pool selectOneSession
      _ <- use pool selectOneSession
      _ <- use pool selectOneSession
      res <- use pool selectOneSession
      shouldSatisfy res isRight
    it "Connection gets returned to the pool after non-connection error" $ withDefaultPool $ \pool -> do
      _ <- use pool badQuerySession
      _ <- use pool badQuerySession
      _ <- use pool badQuerySession
      _ <- use pool badQuerySession
      res <- use pool selectOneSession
      shouldSatisfy res isRight
    it "The pool remains usable after release" $ withDefaultPool $ \pool -> do
      _ <- use pool selectOneSession
      release pool
      res <- use pool selectOneSession
      shouldSatisfy res isRight
    it "Getting and setting session variables works" $ withDefaultPool $ \pool -> do
      res <- use pool $ getSettingSession "testing.foo"
      res `shouldBe` Right Nothing
      res <- use pool $ do
        setSettingSession "testing.foo" "hello world"
        getSettingSession "testing.foo"
      res `shouldBe` Right (Just "hello world")
    it "Session variables stay set when a connection gets reused" $ withPool 1 10 1_800 1_800 connectionString $ \pool -> do
      res <- use pool $ setSettingSession "testing.foo" "hello world"
      res `shouldBe` Right ()
      res2 <- use pool $ getSettingSession "testing.foo"
      res2 `shouldBe` Right (Just "hello world")
    it "Releasing the pool resets session variables" $ withPool 1 10 1_800 1_800 connectionString $ \pool -> do
      res <- use pool $ setSettingSession "testing.foo" "hello world"
      res `shouldBe` Right ()
      release pool
      res <- use pool $ getSettingSession "testing.foo"
      res `shouldBe` Right Nothing
    it "Times out connection acquisition" $
      -- 1ms timeout
      -- 1ms timeout
      -- 1ms timeout
      withPool 1 0.001 1_800 1_800 connectionString $
        \pool -> do
          sleeping <- newEmptyMVar
          t0 <- getCurrentTime
          res <-
            race
              ( use pool $
                  liftIO $
                    do
                      putMVar sleeping ()
                      threadDelay 1_000_000 -- 1s
              )
              ( do
                  takeMVar sleeping
                  use pool selectOneSession
              )
          t1 <- getCurrentTime
          res `shouldBe` Right (Left AcquisitionTimeoutUsageError)
          diffUTCTime t1 t0 `shouldSatisfy` (< 0.5) -- 0.5s
    it "Passively times out old connections (maxLifetime)" $
      -- 0.5s connection lifetime
      -- 0.5s connection lifetime
      -- 0.5s connection lifetime
      withPool 1 10 0.5 1_800 connectionString $
        \pool -> do
          res <- use pool $ setSettingSession "testing.foo" "hello world"
          res `shouldBe` Right ()
          res2 <- use pool $ getSettingSession "testing.foo"
          res2 `shouldBe` Right (Just "hello world")
          threadDelay 1_000_000 -- 1s
          res3 <- use pool $ getSettingSession "testing.foo"
          res3 `shouldBe` Right Nothing
    it "Counts active connections" $ do
      (taggedConnectionSettings, appName) <- tagConnection connectionString
      withPool 3 10 1_800 1_800 taggedConnectionSettings $ \pool -> do
        res <- use pool $ countConnectionsSession appName
        res `shouldBe` Right 1

    it "Actively times out old connections (maxLifetime)" $ do
      withDefaultPool $ \countPool -> do
        (taggedConnectionSettings, appName) <- tagConnection connectionString
        withPool 3 10 0.5 1_800 taggedConnectionSettings $ \limitedPool -> do
          res <- use limitedPool selectOneSession
          res `shouldBe` Right 1
          res2 <- use countPool $ countConnectionsSession appName
          res2 `shouldBe` Right 1
          threadDelay 1_000_000 -- 1s
          res3 <- use countPool $ countConnectionsSession appName
          res3 `shouldBe` Right 0
    it "Times out old connections (maxIdletime)" $ do
      -- 0.5s connection idle time
      withPool 1 10 1_800 0.5 connectionString $ \pool -> do
        res <- use pool $ setSettingSession "testing.foo" "hello world"
        res `shouldBe` Right ()
        res2 <- use pool $ getSettingSession "testing.foo"
        res2 `shouldBe` Right (Just "hello world")
        -- busy sleep, to keep connection alive
        forM_ [1 :: Int .. 10] $ \_ -> do
          r <- use pool selectOneSession
          r `shouldBe` Right 1
          threadDelay 100_000 -- 0.1s
        res3 <- use pool $ getSettingSession "testing.foo"
        res3 `shouldBe` Right (Just "hello world")
        -- idle sleep, connection times out
        threadDelay 1_000_000 -- 1s
        res4 <- use pool $ getSettingSession "testing.foo"
        res4 `shouldBe` Right Nothing

getConnectionString :: IO Text
getConnectionString =
  Text.unwords
    . catMaybes
    <$> sequence
      [ setting "host" $ defaultEnv "POSTGRES_HOST" "localhost"
      , setting "port" $ defaultEnv "POSTGRES_PORT" "5432"
      , setting "user" $ defaultEnv "POSTGRES_USER" "postgres"
      , setting "password" $ defaultEnv "POSTGRES_PASSWORD" "postgres"
      , setting "dbname" $ defaultEnv "POSTGRES_DBNAME" "postgres"
      ]
  where
    maybeEnv env = fmap Text.pack <$> System.Environment.lookupEnv env
    defaultEnv env val = Just . fromMaybe val <$> maybeEnv env
    setting label getEnv = do
      val <- getEnv
      return $ (\v -> label <> "=" <> v) <$> val

tagConnection :: Text -> IO (Text, Text)
tagConnection connectionString = do
  tag <- Random.uniformWord32 Random.globalStdGen
  let appName = "hasql-pool-test-" <> show tag
  return (connectionString <> " application_name=" <> Text.pack appName, Text.pack appName)

selectOneSession :: Session.Session Int64
selectOneSession =
  Session.statement () statement
  where
    statement = Statement.Statement "SELECT 1" Encoders.noParams decoder True
    decoder = Decoders.singleRow (Decoders.column (Decoders.nonNullable Decoders.int8))

badQuerySession :: Session.Session ()
badQuerySession =
  Session.statement () statement
  where
    statement = Statement.Statement "zzz" Encoders.noParams Decoders.noResult True

closeConnSession :: Session.Session ()
closeConnSession = do
  conn <- ask
  liftIO $ Connection.release conn

setSettingSession :: Text -> Text -> Session.Session ()
setSettingSession name value = do
  Session.statement (name, value) statement
  where
    statement = Statement.Statement "SELECT set_config($1, $2, false)" encoder Decoders.noResult True
    encoder =
      contramap fst (Encoders.param (Encoders.nonNullable Encoders.text))
        <> contramap snd (Encoders.param (Encoders.nonNullable Encoders.text))

getSettingSession :: Text -> Session.Session (Maybe Text)
getSettingSession name = do
  Session.statement name statement
  where
    statement = Statement.Statement "SELECT current_setting($1, true)" encoder decoder True
    encoder = Encoders.param (Encoders.nonNullable Encoders.text)
    decoder = Decoders.singleRow (Decoders.column (Decoders.nullable Decoders.text))

countConnectionsSession :: Text -> Session.Session Int64
countConnectionsSession appName = do
  Session.statement appName statement
  where
    statement = Statement.Statement "SELECT count(*) FROM pg_stat_activity WHERE application_name = $1" encoder decoder True
    encoder = Encoders.param (Encoders.nonNullable Encoders.text)
    decoder = Decoders.singleRow (Decoders.column (Decoders.nonNullable Decoders.int8))
