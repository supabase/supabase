module Hasql.LibPq14.Mappings where

#include "libpq-fe.h"

import Foreign.C.Types (CInt (..))
import Hasql.Prelude

data ExecStatus
  = EmptyQuery
  | CommandOk
  | TuplesOk
  | CopyOut
  | CopyIn
  | CopyBoth
  | BadResponse
  | NonfatalError
  | FatalError
  | SingleTuple
  | PipelineSync
  | PipelineAbort
  deriving (Eq, Show)

decodeExecStatus :: CInt -> Maybe ExecStatus
decodeExecStatus = \case
  (#const PGRES_EMPTY_QUERY) -> Just EmptyQuery
  (#const PGRES_COMMAND_OK) -> Just CommandOk
  (#const PGRES_TUPLES_OK) -> Just TuplesOk
  (#const PGRES_COPY_OUT) -> Just CopyOut
  (#const PGRES_COPY_IN) -> Just CopyIn
  (#const PGRES_COPY_BOTH) -> Just CopyBoth
  (#const PGRES_BAD_RESPONSE) -> Just BadResponse
  (#const PGRES_NONFATAL_ERROR) -> Just NonfatalError
  (#const PGRES_FATAL_ERROR) -> Just FatalError
  (#const PGRES_SINGLE_TUPLE) -> Just SingleTuple
  (#const PGRES_PIPELINE_SYNC) -> Just PipelineSync
  (#const PGRES_PIPELINE_ABORTED) -> Just PipelineAbort
  _ -> Nothing

encodeExecStatus :: ExecStatus -> CInt
encodeExecStatus = \case
  EmptyQuery -> #const PGRES_EMPTY_QUERY
  CommandOk -> #const PGRES_COMMAND_OK
  TuplesOk -> #const PGRES_TUPLES_OK
  CopyOut -> #const PGRES_COPY_OUT
  CopyIn -> #const PGRES_COPY_IN
  CopyBoth -> #const PGRES_COPY_BOTH
  BadResponse -> #const PGRES_BAD_RESPONSE
  NonfatalError -> #const PGRES_NONFATAL_ERROR
  FatalError -> #const PGRES_FATAL_ERROR
  SingleTuple -> #const PGRES_SINGLE_TUPLE
  PipelineSync -> #const PGRES_PIPELINE_SYNC
  PipelineAbort -> #const PGRES_PIPELINE_ABORTED

data PipelineStatus
  = PipelineOn
  | PipelineOff
  | PipelineAborted
  deriving (Eq, Show)

decodePipelineStatus :: CInt -> Maybe PipelineStatus
decodePipelineStatus = \case
  (#const PQ_PIPELINE_ON) -> Just PipelineOn
  (#const PQ_PIPELINE_OFF) -> Just PipelineOff
  (#const PQ_PIPELINE_ABORTED) -> Just PipelineAborted
  _ -> Nothing

decodeBool :: CInt -> Maybe Bool
decodeBool = \case
  0 -> Just False
  1 -> Just True
  _ -> Nothing
