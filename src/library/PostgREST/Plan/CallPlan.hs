{-# LANGUAGE NamedFieldPuns #-}

module PostgREST.Plan.CallPlan
  ( CallPlan (..)
  , CallParams (..)
  , CallArgs (..)
  , RpcParamValue (..)
  , toRpcParams
  )
where

import Protolude

import Data.Aeson qualified as JSON
import Data.ByteString.Lazy qualified as LBS
import Data.HashMap.Strict qualified as HM

import PostgREST.Catalog.Identifiers
  ( FieldName
  , QualifiedIdentifier
  )
import PostgREST.Catalog.Routine
  ( Routine (..)
  , RoutineParam (..)
  )

data CallPlan = FunctionCall
  { funCQi :: QualifiedIdentifier
  , funCParams :: CallParams
  , funCArgs :: CallArgs
  , funCScalar :: Bool
  , funCSetOfScalar :: Bool
  , funCFilterFields :: Set FieldName
  , funCReturning :: Set FieldName
  }

data CallParams
  = -- | Call with key params: func(a := val1, b:= val2)
    KeyParams [RoutineParam]
  | -- | Call with positional params(only one supported): func(val)
    OnePosParam RoutineParam

data CallArgs
  = DirectArgs (HM.HashMap Text RpcParamValue)
  | JsonArgs (Maybe LBS.ByteString)

-- | RPC query param value `/rpc/func?v=<value>`, used for VARIADIC functions on form-urlencoded POST and GETs
-- | It can be fixed `?v=1` or repeated `?v=1&v=2&v=3.
data RpcParamValue = Fixed Text | Variadic [Text]

instance JSON.ToJSON RpcParamValue where
  toJSON (Fixed v) = JSON.toJSON v
  -- Not possible to get here anymore. Variadic arguments are only supported for
  -- true variadic arguments, but the toJSON instance is only used for the "single unnamed json argument" case.
  toJSON (Variadic v) = JSON.toJSON v

-- | Convert rpc params `/rpc/func?a=val1&b=val2` to json `{"a": "val1", "b": "val2"}
toRpcParams :: Routine -> [(Text, Text)] -> HM.HashMap Text RpcParamValue
toRpcParams proc prms =
  if not $ pdHasVariadic proc then -- if proc has no variadic param, save steps and directly convert to map
    HM.fromList $ second Fixed <$> prms
  else
    HM.fromListWith mergeParams $ toRpcParamValue proc <$> prms
  where
    mergeParams :: RpcParamValue -> RpcParamValue -> RpcParamValue
    mergeParams (Variadic a) (Variadic b) = Variadic $ b ++ a
    mergeParams v _ = v -- repeated params for non-variadic parameters are not merged

toRpcParamValue :: Routine -> (Text, Text) -> (Text, RpcParamValue)
toRpcParamValue proc (k, v)
  | prmIsVariadic k = (k, Variadic [v])
  | otherwise = (k, Fixed v)
  where
    prmIsVariadic prm = isJust $ find (\RoutineParam{ppName, ppVar} -> ppName == prm && ppVar) $ pdParams proc
