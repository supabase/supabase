-- |
-- An API of low-level IO operations.
module Hasql.IO where

import Hasql.Errors
import Hasql.Prelude

import Hasql.Commands qualified as Commands
import Hasql.Decoders.Result qualified as ResultDecoders
import Hasql.Decoders.Results qualified as ResultsDecoders
import Hasql.Encoders.Params qualified as ParamsEncoders
import Hasql.LibPq14 qualified as LibPQ
import Hasql.PreparedStatementRegistry qualified as PreparedStatementRegistry

{-# INLINE acquireConnection #-}
acquireConnection :: ByteString -> IO LibPQ.Connection
acquireConnection =
  LibPQ.connectdb

{-# INLINE acquirePreparedStatementRegistry #-}
acquirePreparedStatementRegistry :: IO PreparedStatementRegistry.PreparedStatementRegistry
acquirePreparedStatementRegistry =
  PreparedStatementRegistry.new

{-# INLINE releaseConnection #-}
releaseConnection :: LibPQ.Connection -> IO ()
releaseConnection = LibPQ.finish

{-# INLINE checkConnectionStatus #-}
checkConnectionStatus :: LibPQ.Connection -> IO (Maybe (Maybe ByteString))
checkConnectionStatus c =
  do
    s <- LibPQ.status c
    case s of
      LibPQ.ConnectionOk -> return Nothing
      _ -> fmap Just (LibPQ.errorMessage c)

{-# INLINE checkServerVersion #-}
checkServerVersion :: LibPQ.Connection -> IO (Maybe Int)
checkServerVersion c =
  fmap (mfilter (< 80200) . Just) (LibPQ.serverVersion c)

{-# INLINE getIntegerDatetimes #-}
getIntegerDatetimes :: LibPQ.Connection -> IO Bool
getIntegerDatetimes c =
  decodeValue <$> LibPQ.parameterStatus c "integer_datetimes"
  where
    decodeValue =
      \case
        Just "on" -> True
        _ -> False

{-# INLINE initConnection #-}
initConnection :: LibPQ.Connection -> IO ()
initConnection c =
  void $ LibPQ.exec c (Commands.asBytes (Commands.setEncodersToUTF8 <> Commands.setMinClientMessagesToWarning))

{-# INLINE getResults #-}
getResults :: LibPQ.Connection -> Bool -> ResultsDecoders.Results a -> IO (Either CommandError a)
getResults connection integerDatetimes decoder =
  {-# SCC "getResults" #-}
  (<*) <$> get <*> dropRemainders
  where
    get =
      ResultsDecoders.run decoder connection integerDatetimes
    dropRemainders =
      ResultsDecoders.run ResultsDecoders.dropRemainders connection integerDatetimes

{-# INLINE getPreparedStatementKey #-}
getPreparedStatementKey
  :: LibPQ.Connection
  -> PreparedStatementRegistry.PreparedStatementRegistry
  -> ByteString
  -> [LibPQ.Oid]
  -> IO (Either CommandError ByteString)
getPreparedStatementKey connection registry template oidList =
  {-# SCC "getPreparedStatementKey" #-}
  PreparedStatementRegistry.update localKey onNewRemoteKey onOldRemoteKey registry
  where
    localKey =
      PreparedStatementRegistry.LocalKey template oidList
    onNewRemoteKey key =
      do
        sent <- LibPQ.sendPrepare connection key template (mfilter (not . null) (Just oidList))
        resultsMapping <$> getResults connection undefined (resultsDecoder sent)
      where
        resultsDecoder sent =
          if sent then
            ResultsDecoders.single ResultDecoders.noResult
          else
            ResultsDecoders.clientError
        resultsMapping =
          \case
            Left x -> (False, Left x)
            Right _ -> (True, Right key)
    onOldRemoteKey key =
      pure (pure key)

{-# INLINE checkedSend #-}
checkedSend :: LibPQ.Connection -> IO Bool -> IO (Either CommandError ())
checkedSend connection send =
  send >>= \case
    False -> Left . ClientError <$> LibPQ.errorMessage connection
    True -> pure (Right ())

{-# INLINE sendPreparedParametricStatement #-}
sendPreparedParametricStatement
  :: LibPQ.Connection
  -> PreparedStatementRegistry.PreparedStatementRegistry
  -> Bool
  -> ByteString
  -> ParamsEncoders.Params a
  -> a
  -> IO (Either CommandError ())
sendPreparedParametricStatement connection registry integerDatetimes template encoder input =
  runExceptT $ do
    key <- ExceptT $ getPreparedStatementKey connection registry template oidList
    ExceptT $ checkedSend connection $ LibPQ.sendQueryPrepared connection key valueAndFormatList LibPQ.Binary
  where
    (oidList, valueAndFormatList) =
      ParamsEncoders.compilePreparedStatementData encoder integerDatetimes input

{-# INLINE sendUnpreparedParametricStatement #-}
sendUnpreparedParametricStatement
  :: LibPQ.Connection
  -> Bool
  -> ByteString
  -> ParamsEncoders.Params a
  -> a
  -> IO (Either CommandError ())
sendUnpreparedParametricStatement connection integerDatetimes template encoder input =
  checkedSend connection
    $ LibPQ.sendQueryParams
      connection
      template
      (ParamsEncoders.compileUnpreparedStatementData encoder integerDatetimes input)
      LibPQ.Binary

{-# INLINE sendParametricStatement #-}
sendParametricStatement
  :: LibPQ.Connection
  -> Bool
  -> PreparedStatementRegistry.PreparedStatementRegistry
  -> ByteString
  -> ParamsEncoders.Params a
  -> Bool
  -> a
  -> IO (Either CommandError ())
sendParametricStatement connection integerDatetimes registry template encoder prepared params =
  {-# SCC "sendParametricStatement" #-}
  if prepared then
    sendPreparedParametricStatement connection registry integerDatetimes template encoder params
  else
    sendUnpreparedParametricStatement connection integerDatetimes template encoder params

{-# INLINE sendNonparametricStatement #-}
sendNonparametricStatement :: LibPQ.Connection -> ByteString -> IO (Either CommandError ())
sendNonparametricStatement connection sql =
  checkedSend connection $ LibPQ.sendQuery connection sql
