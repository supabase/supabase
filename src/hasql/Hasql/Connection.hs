-- |
-- This module provides a low-level effectful API dealing with the connections to the database.
module Hasql.Connection
  ( Connection
  , ConnectionError
  , acquire
  , release
  , withLibPQConnection
  )
where

import Hasql.Connection.Core
