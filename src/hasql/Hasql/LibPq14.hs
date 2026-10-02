module Hasql.LibPq14
  ( module Base

    -- * Updated and new types
  , Mappings.ExecStatus (..)
  , Mappings.PipelineStatus (..)

    -- * Updated and new procedures
  , resultStatus
  , pipelineStatus
  , enterPipelineMode
  , exitPipelineMode
  , pipelineSync
  , sendFlushRequest
  )
where

import Database.PostgreSQL.LibPQ as Base hiding
  ( ExecStatus (..)
  , PipelineStatus (..)
  , enterPipelineMode
  , exitPipelineMode
  , pipelineStatus
  , pipelineSync
  , resultStatus
  , sendFlushRequest
  )

import Database.PostgreSQL.LibPQ.Internal qualified as BaseInternal

import Hasql.Prelude

import Hasql.LibPq14.Ffi qualified as Ffi
import Hasql.LibPq14.Mappings qualified as Mappings

resultStatus :: Result -> IO Mappings.ExecStatus
resultStatus result = do
  -- Unsafe-coercing because the constructor is not exposed by the lib,
  -- but it's implemented as a newtype over ForeignPtr.
  -- Since internal changes in the \"postgresql-lipbq\" may break this,
  -- it requires us to avoid using an open dependency range on it.
  ffiStatus <- withForeignPtr (unsafeCoerce result) Ffi.resultStatus
  decodeProcedureResult "resultStatus" Mappings.decodeExecStatus ffiStatus

pipelineStatus
  :: Connection
  -> IO Mappings.PipelineStatus
pipelineStatus =
  parameterlessProcedure "pipelineStatus" Ffi.pipelineStatus Mappings.decodePipelineStatus

enterPipelineMode
  :: Connection
  -> IO Bool
enterPipelineMode =
  parameterlessProcedure "enterPipelineMode" Ffi.enterPipelineMode Mappings.decodeBool

exitPipelineMode
  :: Connection
  -> IO Bool
exitPipelineMode =
  parameterlessProcedure "exitPipelineMode" Ffi.exitPipelineMode Mappings.decodeBool

pipelineSync
  :: Connection
  -> IO Bool
pipelineSync =
  parameterlessProcedure "pipelineSync" Ffi.pipelineSync Mappings.decodeBool

sendFlushRequest
  :: Connection
  -> IO Bool
sendFlushRequest =
  parameterlessProcedure "sendFlushRequest" Ffi.sendFlushRequest Mappings.decodeBool

parameterlessProcedure
  :: (Show a)
  => String
  -> (Ptr BaseInternal.PGconn -> IO a)
  -> (a -> Maybe b)
  -> Connection
  -> IO b
parameterlessProcedure label procedure decoder connection = do
  ffiResult <- BaseInternal.withConn connection procedure
  decodeProcedureResult label decoder ffiResult

decodeProcedureResult
  :: (Show a)
  => String
  -> (a -> Maybe b)
  -> a
  -> IO b
decodeProcedureResult label decoder ffiResult =
  case decoder ffiResult of
    Just res -> pure res
    Nothing -> fail ("Failed to decode result of " <> label <> " from: " <> show ffiResult)
