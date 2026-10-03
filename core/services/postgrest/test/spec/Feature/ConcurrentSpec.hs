{-# LANGUAGE TypeFamilies #-}
{-# LANGUAGE UndecidableInstances #-}
{-# OPTIONS_GHC -fno-warn-orphans #-}

module Feature.ConcurrentSpec where

import Control.Concurrent.Async (mapConcurrently)
import Control.Monad.Base
import Control.Monad.Trans.Control
import Network.Wai.Test (Session)
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.Internal
import Test.Hspec.Wai.JSON

import SpecHelper

spec :: SpecWithConfig
spec withConfig =
  withConfig baseCfg $
    describe "Querying in parallel" $
      it "should not raise 'transaction in progress' error" $
        raceTest 10 $
          get "/fakefake"
            `shouldRespondWith` [json| {"code":"PGRST205","details":null,"hint":null,"message":"Could not find the table 'test.fakefake' in the schema cache"} |]
              { matchStatus = 404
              , matchHeaders = []
              }

raceTest :: Int -> WaiExpectation st -> WaiExpectation st
raceTest times = liftBaseDiscard go
  where
    go test = void $ mapConcurrently (const test) [1 .. times]

instance MonadBaseControl IO (WaiSession st) where
  type StM (WaiSession st) a = StM Session a
  liftBaseWith f = WaiSession $
    liftBaseWith $ \runInBase ->
      f $ \k -> runInBase (unWaiSession k)
  restoreM = WaiSession . restoreM
  {-# INLINE liftBaseWith #-}
  {-# INLINE restoreM #-}

instance MonadBase IO (WaiSession st) where
  liftBase = liftIO
