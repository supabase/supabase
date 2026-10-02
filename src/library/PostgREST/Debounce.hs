module PostgREST.Debounce (makeDebouncer) where

import Protolude

-- | Make a new debouncer action. An internal "worker" thread runs forever
-- ensuring "action" runs when the "trigger" is called. The "action" is only
-- executed once over a burst of calls.
makeDebouncer :: IO () -> IO (IO ())
makeDebouncer action = do
  flag <- newEmptyMVar

  let
    worker = forever $ do
      takeMVar flag
      action
    trigger = void $ tryPutMVar flag ()

  void $ forkIO worker
  pure trigger
