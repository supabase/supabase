module Hasql.NotificationsSpec (main, spec) where

import Control.Concurrent (forkIO, killThread)
import Control.Concurrent.MVar
import Control.Monad (void)
import Data.ByteString
import System.Exit (die)
import Test.Hspec
import Test.QuickCheck

import Hasql.Connection
import Hasql.Connection.Setting
import Hasql.Connection.Setting.Connection
import Hasql.Notifications

-- `main` is here so that this module can be run from GHCi on its own.  It is
-- not needed for automatic spec discovery.
main :: IO ()
main = hspec spec

spec :: Spec
spec = do
  describe "send and receive notification" $
    describe "when I send a notification to channel my handler is listening to" $
      it "should call our notification handler" $ do
        dbOrError <- acquire [connection $ string "postgres://postgres:roottoor@localhost/hasql_notifications_test"]
        case dbOrError of
          Right db -> do
            let channelToListen = toPgIdentifier "test-channel"
            mailbox <- newEmptyMVar :: IO (MVar ByteString)
            listen db channelToListen
            threadId <- forkIO $ waitForNotifications (\channel payload -> putMVar mailbox $ "Just got notification on channel " <> channel <> ": " <> payload) db
            notify db (toPgIdentifier "test-channel") "Payload"
            takeMVar mailbox `shouldReturn` "Just got notification on channel test-channel: Payload"
          _ -> die "Could not open database connection"

  describe "FatalError show instance" $
    it "extracts message" $
      ( show $
          FatalError{fatalErrorMessage = "some message"}
      )
        `shouldBe` "some message"
  describe "toPgIdenfier" $
    it "enclose text in quotes doubling existing ones" $
      fromPgIdentifier (toPgIdentifier "some \"identifier\"") `shouldBe` "\"some \"\"identifier\"\"\""
