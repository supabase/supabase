module Hasql.TestingKit.Constants where

import Hasql.Connection.Setting qualified as Setting
import Hasql.Connection.Setting.Connection qualified as Setting.Connection
import Hasql.Connection.Setting.Connection.Param qualified as Setting.Connection.Component

localConnectionSettings :: [Setting.Setting]
localConnectionSettings =
  [ Setting.connection
      ( Setting.Connection.params
          [ Setting.Connection.Component.host "localhost"
          , Setting.Connection.Component.port 5432
          , Setting.Connection.Component.user "postgres"
          , Setting.Connection.Component.password "postgres"
          , Setting.Connection.Component.dbname "postgres"
          ]
      )
  ]
