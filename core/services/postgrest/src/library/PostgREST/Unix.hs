{-# LANGUAGE CPP #-}

module PostgREST.Unix
  ( installSignalHandlers
  , createAndBindDomainSocket
  )
where

#ifndef mingw32_HOST_OS
import qualified System.Posix.Signals as Signals
#endif
import Data.String (String)
import Protolude
import System.Directory (removeFile)
import System.IO.Error (isDoesNotExistError)
import System.Posix.Types (FileMode)
import System.PosixCompat.Files (setFileMode)

import Network.Socket qualified as NS

import PostgREST.Observation qualified as Observation

-- | Set signal handlers, only for systems with signals
installSignalHandlers :: Observation.ObservationHandler -> IO () -> IO () -> IO () -> IO ()
#ifndef mingw32_HOST_OS
installSignalHandlers observer interrupt usr1 usr2 = do
  install Signals.sigINT  $ observer (Observation.TerminationUnixSignalObs "SIGINT") >> interrupt
  install Signals.sigTERM $ observer (Observation.TerminationUnixSignalObs "SIGTERM") >> interrupt
  install Signals.sigUSR1 usr1
  install Signals.sigUSR2 usr2
  where
    install signal handler =
      void $ Signals.installHandler signal (Signals.Catch handler) Nothing
#else
installSignalHandlers _ _ _ _ = pass
#endif

-- | Create a unix domain socket and bind it to the given path.
-- | The socket file will be deleted if it already exists.
createAndBindDomainSocket :: String -> FileMode -> IO NS.Socket
createAndBindDomainSocket path mode = do
  unless NS.isUnixDomainSocketAvailable $
    panic "Cannot run with unix socket on non-unix platforms. Consider deleting the `server-unix-socket` config entry in order to continue."
  deleteSocketFileIfExist path
  sock <- NS.socket NS.AF_UNIX NS.Stream NS.defaultProtocol
  NS.bind sock $ NS.SockAddrUnix path
  NS.listen sock (max 2048 NS.maxListenQueue)
  setFileMode path mode
  return sock
  where
    deleteSocketFileIfExist path' =
      removeFile path' `catch` handleDoesNotExist
    handleDoesNotExist e
      | isDoesNotExistError e = return ()
      | otherwise = throwIO e
