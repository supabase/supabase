module Main where

import Prelude

import Main.Statements qualified as Statements

import Hasql.Connection qualified
import Hasql.Connection.Setting qualified
import Hasql.Connection.Setting.Connection qualified
import Hasql.Connection.Setting.Connection.Param qualified
import Hasql.Session qualified

main :: IO ()
main =
  acquire >>= use
  where
    acquire =
      (,) <$> acquire <*> acquire
      where
        acquire =
          either (fail . show) return =<< Hasql.Connection.acquire connectionSettings
          where
            connectionSettings =
              [ Hasql.Connection.Setting.connection
                  ( Hasql.Connection.Setting.Connection.params
                      [ Hasql.Connection.Setting.Connection.Param.host "localhost"
                      , Hasql.Connection.Setting.Connection.Param.port 5432
                      , Hasql.Connection.Setting.Connection.Param.user "postgres"
                      , Hasql.Connection.Setting.Connection.Param.password "postgres"
                      , Hasql.Connection.Setting.Connection.Param.dbname "postgres"
                      ]
                  )
              ]
    use (connection1, connection2) =
      do
        beginVar <- newEmptyMVar
        finishVar <- newEmptyMVar
        forkIO $ do
          traceM "1: in"
          putMVar beginVar ()
          session connection1 (Hasql.Session.statement 0.2 Statements.selectSleep)
          traceM "1: out"
          void (tryPutMVar finishVar False)
        forkIO $ do
          takeMVar beginVar
          traceM "2: in"
          session connection2 (Hasql.Session.statement 0.1 Statements.selectSleep)
          traceM "2: out"
          void (tryPutMVar finishVar True)
        bool exitFailure exitSuccess . traceShowId =<< takeMVar finishVar
      where
        session connection session =
          Hasql.Session.run session connection
            >>= either (fail . show) return
