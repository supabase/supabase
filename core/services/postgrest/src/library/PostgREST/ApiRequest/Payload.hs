{-# LANGUAGE LambdaCase #-}
{-# LANGUAGE NamedFieldPuns #-}

-- |
-- Module      : PostgREST.ApiRequest.Payload
-- Description : Parser for PostgREST Request Body
--
-- This module is in charge of parsing the request body (payload)
module PostgREST.ApiRequest.Payload
  ( getPayload
  )
where

import Control.Arrow ((***))
import Data.Aeson.Types (emptyArray, emptyObject)
import Data.Either.Combinators (mapBoth)
import Network.HTTP.Types.URI (parseSimpleQuery)
import Protolude

import Data.Aeson qualified as JSON
import Data.Aeson.Key qualified as K
import Data.Aeson.KeyMap qualified as KM
import Data.ByteString.Char8 qualified as BS
import Data.ByteString.Lazy qualified as LBS
import Data.Csv qualified as CSV
import Data.HashMap.Strict qualified as HM
import Data.Map.Strict qualified as M
import Data.Set qualified as S
import Data.Text.Encoding qualified as T
import Data.Vector qualified as V

import PostgREST.ApiRequest.QueryParams (QueryParams (..))
import PostgREST.ApiRequest.Types
import PostgREST.Catalog.Identifiers (FieldName)
import PostgREST.Error (ApiRequestError (..))
import PostgREST.MediaType (MediaType (..))

import PostgREST.MediaType qualified as MediaType

getPayload :: RequestBody -> MediaType -> QueryParams -> Action -> Either ApiRequestError (Maybe Payload, S.Set FieldName)
getPayload reqBody contentMediaType QueryParams{qsColumns} action = do
  checkedPayload <- if shouldParsePayload then payload else Right Nothing
  let cols = case (checkedPayload, columns) of
        (Just ProcessedJSON{payKeys}, _) -> payKeys
        (Just ProcessedUrlEncoded{payKeys}, _) -> payKeys
        (Just RawJSON{}, Just cls) -> cls
        _ -> S.empty
  return (checkedPayload, cols)
  where
    payload :: Either ApiRequestError (Maybe Payload)
    payload = mapBoth InvalidBody Just $ case (contentMediaType, isProc) of
      (MTApplicationJSON, _) ->
        if isJust columns then
          Right $ RawJSON reqBody
        else
          note "All object keys must match"
            . payloadAttributes reqBody
            =<< if LBS.null reqBody && isProc then
              Right emptyObject
            else
              first BS.pack $
                -- Drop parsing error message in favor of generic one (https://github.com/PostgREST/postgrest/issues/2344)
                maybe (Left "Empty or invalid json") Right $
                  JSON.decode reqBody
      (MTTextCSV, _) -> do
        json <- csvToJson <$> first BS.pack (CSV.decodeByName reqBody)
        note "All lines must have same number of fields" $ payloadAttributes (JSON.encode json) json
      (MTUrlEncoded, True) ->
        Right $ ProcessedUrlEncoded params (S.fromList $ fst <$> params)
      (MTUrlEncoded, False) ->
        let paramsMap = HM.fromList $ (identity *** JSON.String) <$> params
        in  Right $ ProcessedJSON (JSON.encode paramsMap) $ S.fromList (HM.keys paramsMap)
      (MTTextPlain, True) -> Right $ RawPay reqBody
      (MTTextXML, True) -> Right $ RawPay reqBody
      (MTOctetStream, True) -> Right $ RawPay reqBody
      (ct, _) -> Left $ "Content-Type not acceptable: " <> MediaType.toMime ct

    shouldParsePayload = case action of
      ActDb (ActRelationMut _ MutationDelete) -> False
      ActDb (ActRelationMut _ _) -> True
      ActDb (ActRoutine _ Inv) -> True
      _ -> False

    columns = case action of
      ActDb (ActRelationMut _ MutationCreate) -> qsColumns
      ActDb (ActRelationMut _ MutationUpdate) -> qsColumns
      ActDb (ActRoutine _ Inv) -> qsColumns
      _ -> Nothing

    isProc = case action of
      ActDb (ActRoutine _ _) -> True
      _ -> False
    params = (T.decodeUtf8 *** T.decodeUtf8) <$> parseSimpleQuery (LBS.toStrict reqBody)

type CsvData = V.Vector (M.Map Text LBS.ByteString)

-- |
--   Converts CSV like
--   a,b
--   1,hi
--   2,bye
--
--   into a JSON array like
--   [ {"a": "1", "b": "hi"}, {"a": 2, "b": "bye"} ]
--
--   The reason for its odd signature is so that it can compose
--   directly with CSV.decodeByName
csvToJson :: (CSV.Header, CsvData) -> JSON.Value
csvToJson (_, vals) =
  JSON.Array $ V.map rowToJsonObj vals
  where
    rowToJsonObj =
      JSON.Object
        . KM.fromMapText
        . M.map
          ( \str ->
              if str == "NULL" then
                JSON.Null
              else
                JSON.String . T.decodeUtf8 $ LBS.toStrict str
          )

payloadAttributes :: RequestBody -> JSON.Value -> Maybe Payload
payloadAttributes raw json =
  -- Test that Array contains only Objects having the same keys
  case json of
    JSON.Array arr ->
      case arr V.!? 0 of
        Just (JSON.Object o) ->
          let
            canonicalKeys = S.fromList $ K.toText <$> KM.keys o
            areKeysUniform =
              all
                ( \case
                    JSON.Object x -> S.fromList (K.toText <$> KM.keys x) == canonicalKeys
                    _ -> False
                )
                arr
          in
            if areKeysUniform then
              Just $ ProcessedJSON raw canonicalKeys
            else
              Nothing
        Just _ -> Nothing
        Nothing -> Just emptyPJArray
    JSON.Object o -> Just $ ProcessedJSON raw (S.fromList $ K.toText <$> KM.keys o)
    -- truncate everything else to an empty array.
    _ -> Just emptyPJArray
  where
    emptyPJArray = ProcessedJSON (JSON.encode emptyArray) S.empty
