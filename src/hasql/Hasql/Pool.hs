module Hasql.Pool
  ( -- * Pool
    Pool
  , acquire
  , use
  , release

    -- * Errors
  , UsageError (..)
  )
where

import Data.Text.Encoding qualified as Text
import Data.Text.Encoding.Error qualified as Text
import Data.UUID.V4 qualified as Uuid

import Hasql.Connection (Connection)
import Hasql.Pool.Observation
import Hasql.Pool.Prelude

import Hasql.Connection qualified as Connection
import Hasql.Connection.Setting qualified as Connection.Setting
import Hasql.Pool.Config.Config qualified as Config
import Hasql.Pool.SessionErrorDestructors qualified as ErrorsDestruction
import Hasql.Session qualified as Session

-- | A connection tagged with metadata.
data Entry = Entry
  { entryConnection :: Connection
  , entryCreationTimeNSec :: Word64
  , entryUseTimeNSec :: Word64
  , entryId :: UUID
  }

entryIsAged :: Word64 -> Word64 -> Entry -> Bool
entryIsAged maxLifetime now Entry{..} =
  now > entryCreationTimeNSec + maxLifetime

entryIsIdle :: Word64 -> Word64 -> Entry -> Bool
entryIsIdle maxIdletime now Entry{..} =
  now > entryUseTimeNSec + maxIdletime

-- | Pool of connections to DB.
data Pool = Pool
  { poolSize :: Int
  -- ^ Pool size.
  , poolFetchConnectionSettings :: IO [Connection.Setting.Setting]
  -- ^ Connection settings.
  , poolAcquisitionTimeout :: Int
  -- ^ Acquisition timeout, in microseconds.
  , poolMaxLifetime :: Word64
  -- ^ Maximal connection lifetime, in nanoseconds.
  , poolMaxIdletime :: Word64
  -- ^ Maximal connection idle time, in nanoseconds.
  , poolConnectionQueue :: TQueue Entry
  -- ^ Avail connections.
  , poolCapacity :: TVar Int
  -- ^ Remaining capacity.
  -- The pool size limits the sum of poolCapacity, the length
  -- of poolConnectionQueue and the number of in-flight
  -- connections.
  , poolReuseVar :: TVar (TVar Bool)
  -- ^ Whether to return a connection to the pool.
  , poolReaperRef :: IORef ()
  -- ^ To stop the manager thread via garbage collection.
  , poolObserver :: Observation -> IO ()
  -- ^ Action for reporting the observations.
  , poolInitSession :: Session.Session ()
  -- ^ Initial session to execute upon every established connection.
  }

-- | Create a connection-pool.
--
-- No connections actually get established by this function. It is delegated
-- to 'use'.
--
-- If you want to ensure that the pool connects fine at the initialization phase, just run 'use' with an empty session (@pure ()@) and check for errors.
acquire :: Config.Config -> IO Pool
acquire config = do
  connectionQueue <- newTQueueIO
  capVar <- newTVarIO (Config.size config)
  reuseVar <- newTVarIO =<< newTVarIO True
  reaperRef <- newIORef ()

  managerTid <- forkIOWithUnmask $ \unmask -> unmask $ forever $ do
    threadDelay 1000000
    now <- getMonotonicTimeNSec
    join . atomically $ do
      entries <- flushTQueue connectionQueue
      let
        (agedEntries, unagedEntries) = partition (entryIsAged agingTimeoutNanos now) entries
        (idleEntries, liveEntries) = partition (entryIsIdle agingTimeoutNanos now) unagedEntries
      traverse_ (writeTQueue connectionQueue) liveEntries
      return $ do
        forM_ agedEntries $ \entry -> do
          Connection.release (entryConnection entry)
          atomically $ modifyTVar' capVar succ
          Config.observationHandler config (ConnectionObservation (entryId entry) (TerminatedConnectionStatus AgingConnectionTerminationReason))
        forM_ idleEntries $ \entry -> do
          Connection.release (entryConnection entry)
          atomically $ modifyTVar' capVar succ
          Config.observationHandler config (ConnectionObservation (entryId entry) (TerminatedConnectionStatus IdlenessConnectionTerminationReason))

  void . mkWeakIORef reaperRef $ do
    -- When the pool goes out of scope, stop the manager.
    killThread managerTid

  return $ Pool (Config.size config) (Config.connectionSettingsProvider config) acqTimeoutMicros agingTimeoutNanos maxIdletimeNanos connectionQueue capVar reuseVar reaperRef (Config.observationHandler config) (Config.initSession config)
  where
    acqTimeoutMicros =
      div (fromIntegral (diffTimeToPicoseconds (Config.acquisitionTimeout config))) 1_000_000
    agingTimeoutNanos =
      div (fromIntegral (diffTimeToPicoseconds (Config.agingTimeout config))) 1_000
    maxIdletimeNanos =
      div (fromIntegral (diffTimeToPicoseconds (Config.idlenessTimeout config))) 1_000

-- | Release all the idle connections in the pool, and mark the in-use connections
-- to be released after use. Any connections acquired after the call will be
-- freshly established.
--
-- The pool remains usable after this action.
-- So you can use this function to reset the connections in the pool.
-- Naturally, you can also use it to release the resources.
release :: Pool -> IO ()
release Pool{..} =
  join . atomically $ do
    prevReuse <- readTVar poolReuseVar
    writeTVar prevReuse False
    newReuse <- newTVar True
    writeTVar poolReuseVar newReuse
    entries <- flushTQueue poolConnectionQueue
    return $ forM_ entries $ \entry -> do
      Connection.release (entryConnection entry)
      atomically $ modifyTVar' poolCapacity succ
      poolObserver (ConnectionObservation (entryId entry) (TerminatedConnectionStatus ReleaseConnectionTerminationReason))

-- | Use a connection from the pool to run a session and return the connection
-- to the pool, when finished.
--
-- Session failing with a 'Session.ClientError' gets interpreted as a loss of
-- connection. In such case the connection does not get returned to the pool
-- and a slot gets freed up for a new connection to be established the next
-- time one is needed. The error still gets returned from this function.
--
-- __Warning:__ Due to the mechanism mentioned above you should avoid intercepting this error type from within sessions.
use :: Pool -> Session.Session a -> IO (Either UsageError a)
use Pool{..} sess = do
  timeout <- do
    delay <- registerDelay poolAcquisitionTimeout
    return $ readTVar delay
  join . atomically $ do
    reuseVar <- readTVar poolReuseVar
    asum
      [ readTQueue poolConnectionQueue <&> onConn reuseVar
      , do
          capVal <- readTVar poolCapacity
          if capVal > 0 then do
            writeTVar poolCapacity $! pred capVal
            return $ onNewConn reuseVar
          else
            retry
      , do
          timedOut <- timeout
          if timedOut then
            return . return . Left $ AcquisitionTimeoutUsageError
          else
            retry
      ]
  where
    onNewConn reuseVar = do
      settings <- poolFetchConnectionSettings
      now <- getMonotonicTimeNSec
      id <- Uuid.nextRandom
      poolObserver (ConnectionObservation id ConnectingConnectionStatus)
      Connection.acquire settings >>= \case
        Left connErr -> do
          poolObserver (ConnectionObservation id (TerminatedConnectionStatus (NetworkErrorConnectionTerminationReason (fmap (Text.decodeUtf8With Text.lenientDecode) connErr))))
          atomically $ modifyTVar' poolCapacity succ
          return $ Left $ ConnectionUsageError connErr
        Right connection -> do
          Session.run poolInitSession connection >>= \case
            Left err -> do
              Connection.release connection
              ErrorsDestruction.reset
                ( \details -> do
                    poolObserver (ConnectionObservation id (TerminatedConnectionStatus (NetworkErrorConnectionTerminationReason (fmap (Text.decodeUtf8With Text.lenientDecode) details))))
                )
                (poolObserver (ConnectionObservation id (TerminatedConnectionStatus (InitializationErrorTerminationReason err))))
                err
              return $ Left $ SessionUsageError err
            Right () -> do
              poolObserver (ConnectionObservation id (ReadyForUseConnectionStatus EstablishedConnectionReadyForUseReason))
              onLiveConn reuseVar (Entry connection now now id)

    onConn reuseVar entry = do
      now <- getMonotonicTimeNSec
      if entryIsAged poolMaxLifetime now entry then do
        Connection.release (entryConnection entry)
        poolObserver (ConnectionObservation (entryId entry) (TerminatedConnectionStatus AgingConnectionTerminationReason))
        onNewConn reuseVar
      else
        if entryIsIdle poolMaxIdletime now entry then do
          Connection.release (entryConnection entry)
          poolObserver (ConnectionObservation (entryId entry) (TerminatedConnectionStatus IdlenessConnectionTerminationReason))
          onNewConn reuseVar
        else do
          onLiveConn reuseVar entry{entryUseTimeNSec = now}

    onLiveConn reuseVar entry = do
      poolObserver (ConnectionObservation (entryId entry) InUseConnectionStatus)
      sessRes <- try @SomeException (Session.run sess (entryConnection entry))

      case sessRes of
        Left exc -> do
          returnConn
          throwIO exc
        Right (Left err) ->
          ErrorsDestruction.reset
            ( \details -> do
                Connection.release (entryConnection entry)
                atomically $ modifyTVar' poolCapacity succ
                poolObserver (ConnectionObservation (entryId entry) (TerminatedConnectionStatus (NetworkErrorConnectionTerminationReason (fmap (Text.decodeUtf8With Text.lenientDecode) details))))
                return $ Left $ SessionUsageError err
            )
            ( do
                returnConn
                poolObserver (ConnectionObservation (entryId entry) (ReadyForUseConnectionStatus (SessionFailedConnectionReadyForUseReason err)))
                return $ Left $ SessionUsageError err
            )
            err
        Right (Right res) -> do
          returnConn
          poolObserver (ConnectionObservation (entryId entry) (ReadyForUseConnectionStatus SessionSucceededConnectionReadyForUseReason))
          return $ Right res
      where
        returnConn =
          join . atomically $ do
            reuse <- readTVar reuseVar
            if reuse then
              writeTQueue poolConnectionQueue entry $> return ()
            else return $ do
              Connection.release (entryConnection entry)
              atomically $ modifyTVar' poolCapacity succ
              poolObserver (ConnectionObservation (entryId entry) (TerminatedConnectionStatus ReleaseConnectionTerminationReason))

-- | Union over all errors that 'use' can result in.
data UsageError
  = -- | Attempt to establish a connection failed.
    ConnectionUsageError Connection.ConnectionError
  | -- | Session execution failed.
    SessionUsageError Session.SessionError
  | -- | Timeout acquiring a connection.
    AcquisitionTimeoutUsageError
  deriving (Eq, Show)

instance Exception UsageError
