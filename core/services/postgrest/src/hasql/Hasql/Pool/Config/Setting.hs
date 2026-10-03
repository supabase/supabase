module Hasql.Pool.Config.Setting where

import Hasql.Pool.Config.Config (Config)
import Hasql.Pool.Observation (Observation)
import Hasql.Pool.Prelude

import Hasql.Connection.Setting qualified as Connection.Setting
import Hasql.Pool.Config.Config qualified as Config
import Hasql.Session qualified as Session

apply :: Setting -> Config -> Config
apply (Setting run) = run

-- | A single setting of a config.
newtype Setting
  = Setting (Config -> Config)

-- | Pool size.
--
-- 3 by default.
size :: Int -> Setting
size x =
  Setting (\config -> config{Config.size = x})

-- | Connection acquisition timeout.
--
-- 10 seconds by default.
acquisitionTimeout :: DiffTime -> Setting
acquisitionTimeout x =
  Setting (\config -> config{Config.acquisitionTimeout = x})

-- | Maximal connection lifetime.
--
-- Determines how long is available for reuse.
-- After the timeout passes and an active session is finished the connection will be closed releasing a slot in the pool for a fresh connection to be established.
--
-- This is useful as a healthy measure for resetting the server-side caches.
--
-- 1 day by default.
agingTimeout :: DiffTime -> Setting
agingTimeout x =
  Setting (\config -> config{Config.agingTimeout = x})

-- | Maximal connection idle time.
--
-- How long to keep a connection open when it's not being used.
--
-- 10 minutes by default.
idlenessTimeout :: DiffTime -> Setting
idlenessTimeout x =
  Setting (\config -> config{Config.idlenessTimeout = x})

-- | Connection string.
--
-- By default it is:
--
-- > "postgresql://postgres:postgres@localhost:5432/postgres"
staticConnectionSettings :: [Connection.Setting.Setting] -> Setting
staticConnectionSettings x =
  Setting (\config -> config{Config.connectionSettingsProvider = pure x})

-- | Action providing connection settings.
--
-- Gets used each time a connection gets established by the pool.
-- This may be useful for some authorization models.
--
-- By default it is:
--
-- > pure "postgresql://postgres:postgres@localhost:5432/postgres"
dynamicConnectionSettings :: IO [Connection.Setting.Setting] -> Setting
dynamicConnectionSettings x =
  Setting (\config -> config{Config.connectionSettingsProvider = x})

-- | Observation handler.
--
-- Typically it's used for monitoring the state of the pool via metrics and logging.
--
-- If the provided action is not lightweight, it's recommended to use intermediate bufferring via channels like TBQueue to avoid occupying the pool management thread for too long.
-- E.g., if the action is @'atomically' . 'writeTBQueue' yourQueue@, then reading from it and processing can be done on a separate thread.
--
-- By default it is:
--
-- > const (pure ())
observationHandler :: (Observation -> IO ()) -> Setting
observationHandler x =
  Setting (\config -> config{Config.observationHandler = x})

-- | Initial session.
--
-- Gets executed on every connection upon acquisition.
-- Lets you specify the connection-wide settings.
initSession :: Session.Session () -> Setting
initSession x =
  Setting (\config -> config{Config.initSession = x})
