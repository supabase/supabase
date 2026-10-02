{-# LANGUAGE DeriveAnyClass #-}
{-# OPTIONS_GHC -fno-warn-orphans #-}

module PostgREST.Catalog.Routine
  ( PgType (..)
  , Routine (..)
  , RoutineParam (..)
  , FuncVolatility (..)
  , FuncSettings
  , RoutineMap
  , RetType (..)
  , funcReturnsScalar
  , funcReturnsSetOfScalar
  , funcReturnsSingleComposite
  , funcReturnsVoid
  , funcTableName
  , funcReturnsSingle
  , MediaHandlerMap
  , ResolvedHandler
  , MediaHandler (..)
  )
where

import Protolude

import Data.Aeson qualified as JSON
import Data.HashMap.Strict qualified as HM

import PostgREST.Catalog.Identifiers
  ( QualifiedIdentifier (..)
  , RelIdentifier (..)
  , Schema
  , TableName
  )

import Hasql.Transaction.Sessions qualified as SQL
import PostgREST.MediaType qualified as MediaType

data PgType
  = Scalar QualifiedIdentifier
  | Composite QualifiedIdentifier Bool -- True if the composite is a domain alias(used to work around a bug in pg 11 and 12, see QueryBuilder.hs)
  deriving (Eq, Generic, JSON.ToJSON, Ord, Show)

data RetType
  = Single PgType
  | SetOf PgType
  deriving (Eq, Generic, JSON.ToJSON, Ord, Show)

data FuncVolatility
  = Volatile
  | Stable
  | Immutable
  deriving (Eq, Generic, JSON.ToJSON, Ord, Show)

type FuncSettings = [(Text, Text)]

data Routine = Function
  { pdSchema :: Schema
  , pdName :: Text
  , pdDescription :: Maybe Text
  , pdParams :: [RoutineParam]
  , pdReturnType :: RetType
  , pdVolatility :: FuncVolatility
  , pdHasVariadic :: Bool
  , pdIsoLvl :: Maybe SQL.IsolationLevel
  , pdFuncSettings :: FuncSettings
  }
  deriving (Eq, Generic, JSON.ToJSON, Show)

-- SQL.IsolationLevel doesn't have a default ToJSON instance, so we derive it.
deriving instance Generic SQL.IsolationLevel

deriving instance JSON.ToJSON SQL.IsolationLevel

data RoutineParam = RoutineParam
  { ppName :: Text
  , ppType :: Text
  , ppTypeMaxLength :: Text
  , ppReq :: Bool
  , ppVar :: Bool
  }
  deriving (Eq, Generic, JSON.ToJSON, Ord, Show)

-- Order by least number of params in the case of overloaded functions
instance Ord Routine where
  Function schema1 name1 des1 prms1 rt1 vol1 hasVar1 iso1 sets1 `compare` Function schema2 name2 des2 prms2 rt2 vol2 hasVar2 iso2 sets2
    | schema1 == schema2 && name1 == name2 && length prms1 < length prms2 = LT
    | schema1 == schema2 && name1 == name2 && length prms1 > length prms2 = GT
    | otherwise = (schema1, name1, des1, prms1, rt1, vol1, hasVar1, iso1, sets1) `compare` (schema2, name2, des2, prms2, rt2, vol2, hasVar2, iso2, sets2)

-- | A map of all procs, all of which can be overloaded(one entry will have more than one Routine).
-- | It uses a HashMap for a faster lookup.
type RoutineMap = HM.HashMap QualifiedIdentifier [Routine]

-- | A media handler can be an aggregate over a composite type or a function over a scalar
data MediaHandler
  = -- non overridable builtins
    BuiltinAggSingleJson Bool
  | BuiltinAggArrayJsonStrip
  | -- these builtins are overridable
    BuiltinOvAggJson
  | BuiltinOvAggGeoJson
  | BuiltinOvAggCsv
  | -- custom
    CustomFunc QualifiedIdentifier RelIdentifier
  | NoAgg
  deriving (Eq, Generic, JSON.ToJSON, Show)

funcReturnsSingle :: Routine -> Bool
funcReturnsSingle proc = case proc of
  Function{pdReturnType = Single _} -> True
  _ -> False

funcReturnsScalar :: Routine -> Bool
funcReturnsScalar proc = case proc of
  Function{pdReturnType = Single (Scalar{})} -> True
  _ -> False

funcReturnsSetOfScalar :: Routine -> Bool
funcReturnsSetOfScalar proc = case proc of
  Function{pdReturnType = SetOf (Scalar{})} -> True
  _ -> False

funcReturnsSingleComposite :: Routine -> Bool
funcReturnsSingleComposite proc = case proc of
  Function{pdReturnType = Single (Composite _ _)} -> True
  _ -> False

funcReturnsVoid :: Routine -> Bool
funcReturnsVoid proc = case proc of
  Function{pdReturnType = Single (Scalar (QualifiedIdentifier "pg_catalog" "void"))} -> True
  _ -> False

funcTableName :: Routine -> Maybe TableName
funcTableName proc = case pdReturnType proc of
  SetOf (Composite qi _) -> Just $ qiName qi
  Single (Composite qi _) -> Just $ qiName qi
  _ -> Nothing

-- the resolved handler also carries the media type because MTAny (*/*) is resolved to a different media type
type ResolvedHandler = (MediaHandler, MediaType.MediaType)

type MediaHandlerMap = HM.HashMap (RelIdentifier, MediaType.MediaType) ResolvedHandler
