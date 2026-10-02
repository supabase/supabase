{-# LANGUAGE DuplicateRecordFields #-}

module PostgREST.ApiRequest.Types
  ( AggregateFunction (..)
  , Alias
  , Cast
  , Depth
  , EmbedParam (..)
  , EmbedPath
  , Field
  , Filter (..)
  , Hint
  , JoinType (..)
  , JsonOperand (..)
  , JsonOperation (..)
  , JsonPath
  , Language
  , ListVal
  , LogicOperator (..)
  , LogicTree (..)
  , NodeName
  , OpExpr (..)
  , Operation (..)
  , OpQuantifier (..)
  , OrderDirection (..)
  , OrderNulls (..)
  , OrderTerm (..)
  , SingleVal
  , IsVal (..)
  , SimpleOperator (..)
  , QuantOperator (..)
  , FtsOperator (..)
  , SelectItem (..)
  , Payload (..)
  , InvokeMethod (..)
  , Mutation (..)
  , Resource (..)
  , DbAction (..)
  , Action (..)
  , RequestBody
  )
where

import Protolude

import Data.ByteString.Lazy qualified as LBS
import Data.Set qualified as S

import PostgREST.Catalog.Identifiers
  ( FieldName
  , QualifiedIdentifier (..)
  , Schema
  )

data InvokeMethod = Inv | InvRead Bool
  deriving (Eq)

data Mutation
  = MutationCreate
  | MutationDelete
  | MutationSingleUpsert
  | MutationUpdate
  deriving (Eq)

data Resource
  = ResourceRelation Text
  | ResourceRoutine Text
  | ResourceSchema

data DbAction
  = ActRelationRead {dbActQi :: QualifiedIdentifier, actHeadersOnly :: Bool}
  | ActRelationMut {dbActQi :: QualifiedIdentifier, actMutation :: Mutation}
  | ActRoutine {dbActQi :: QualifiedIdentifier, actInvMethod :: InvokeMethod}
  | ActSchemaRead Schema Bool

data Action
  = ActDb DbAction
  | ActRelationInfo QualifiedIdentifier
  | ActRoutineInfo QualifiedIdentifier InvokeMethod
  | ActSchemaInfo

type RequestBody = LBS.ByteString

data Payload
  = -- | Cached attributes of a JSON payload
    ProcessedJSON
      { payRaw :: LBS.ByteString
      -- ^ This is the raw ByteString that comes from the request body.  We
      -- cache this instead of an Aeson Value because it was detected that for
      -- large payloads the encoding had high memory usage, see
      -- https://github.com/PostgREST/postgrest/pull/1005 for more details
      , payKeys :: S.Set Text
      -- ^ Keys of the object or if it's an array these keys are guaranteed to
      -- be the same across all its objects
      }
  | ProcessedUrlEncoded {payArray :: [(Text, Text)], payKeys :: S.Set Text}
  | RawJSON {payRaw :: LBS.ByteString}
  | RawPay {payRaw :: LBS.ByteString}

-- | The value in `/tbl?select=alias:field.aggregateFunction()::cast`
data SelectItem
  = SelectField
      { selField :: Field
      , selAggregateFunction :: Maybe AggregateFunction
      , selAggregateCast :: Maybe Cast
      , selCast :: Maybe Cast
      , selAlias :: Maybe Alias
      }
  | -- \| The value in `/tbl?select=alias:another_tbl(*)`
    SelectRelation
      { selRelation :: FieldName
      , selAlias :: Maybe Alias
      , selHint :: Maybe Hint
      , selJoinType :: Maybe JoinType
      }
  | -- \| The value in `/tbl?select=...another_tbl(*)`
    SpreadRelation
      { selRelation :: FieldName
      , selHint :: Maybe Hint
      , selJoinType :: Maybe JoinType
      }
  deriving (Eq, Show)

type NodeName = Text

type Depth = Integer

data OrderTerm
  = OrderTerm
      { otTerm :: Field
      , otDirection :: Maybe OrderDirection
      , otNullOrder :: Maybe OrderNulls
      }
  | OrderRelationTerm
      { otRelation :: FieldName
      , otRelTerm :: Field
      , otDirection :: Maybe OrderDirection
      , otNullOrder :: Maybe OrderNulls
      }
  deriving (Eq, Show)

data OrderDirection
  = OrderAsc
  | OrderDesc
  deriving (Eq, Show)

data OrderNulls
  = OrderNullsFirst
  | OrderNullsLast
  deriving (Eq, Show)

type Field = (FieldName, JsonPath)

type Cast = Text

type Alias = Text

type Hint = Text

data AggregateFunction = Sum | Avg | Max | Min | Count
  deriving (Eq, Show)

data EmbedParam
  = -- | Disambiguates an embedding operation when there's multiple relationships
    -- between two tables. Can be the name of a foreign key constraint, column
    -- name or the junction in an m2m relationship.
    EPHint Hint
  | EPJoinType JoinType

data JoinType
  = JTInner
  | JTLeft
  deriving (Eq, Show)

-- | Path of the embedded levels, e.g "clients.projects.name=eq.." gives Path
-- ["clients", "projects"]
type EmbedPath = [Text]

-- | Json path operations as specified in
-- https://www.postgresql.org/docs/current/static/functions-json.html
type JsonPath = [JsonOperation]

-- | Represents the single arrow `->` or double arrow `->>` operators
data JsonOperation
  = JArrow {jOp :: JsonOperand}
  | J2Arrow {jOp :: JsonOperand}
  deriving (Eq, Ord, Show)

-- | Represents the key(`->'key'`) or index(`->'1`::int`), the index is Text
-- because we reuse our escaping functions and let pg do the casting with
-- '1'::int
data JsonOperand
  = JKey {jVal :: Text}
  | JIdx {jVal :: Text}
  deriving (Eq, Ord, Show)

-- | Boolean logic expression tree e.g. "and(name.eq.N,or(id.eq.1,id.eq.2))" is:
--
--            And
--           /   \
--  name.eq.N     Or
--               /  \
--         id.eq.1   id.eq.2
data LogicTree
  = Expr Bool LogicOperator [LogicTree]
  | Stmnt Filter
  deriving (Eq, Show)

data LogicOperator
  = And
  | Or
  deriving (Eq, Show)

data Filter
  = Filter
  { field :: Field
  , opExpr :: OpExpr
  }
  deriving (Eq, Show)

data OpExpr
  = OpExpr Bool Operation
  | NoOpExpr Text
  deriving (Eq, Show)

data OpQuantifier = QuantAny | QuantAll
  deriving (Eq, Show)

data Operation
  = Op SimpleOperator SingleVal
  | OpQuant QuantOperator (Maybe OpQuantifier) SingleVal
  | In ListVal
  | Is IsVal
  | IsDistinctFrom SingleVal
  | Fts FtsOperator (Maybe Language) SingleVal
  deriving (Eq, Show)

type Language = Text

-- | Represents a single value in a filter, e.g. id=eq.singleval
type SingleVal = Text

-- | Represents a list value in a filter, e.g. id=in.(val1,val2,val3)
type ListVal = [Text]

data IsVal
  = IsNull
  | IsNotNull
  | -- Trilean values
    IsTriTrue
  | IsTriFalse
  | IsTriUnknown
  deriving (Eq, Show)

-- Operators that are quantifiable, i.e. they can be used with the any/all modifiers
data QuantOperator
  = OpEqual
  | OpGreaterThanEqual
  | OpGreaterThan
  | OpLessThanEqual
  | OpLessThan
  | OpLike
  | OpILike
  | OpMatch
  | OpIMatch
  deriving (Eq, Show)

data SimpleOperator
  = OpNotEqual
  | OpContains
  | OpContained
  | OpOverlap
  | OpStrictlyLeft
  | OpStrictlyRight
  | OpNotExtendsRight
  | OpNotExtendsLeft
  | OpAdjacent
  deriving (Eq, Show)

--

-- | Operators for full text search operators
data FtsOperator
  = FilterFts
  | FilterFtsPlain
  | FilterFtsPhrase
  | FilterFtsWebsearch
  deriving (Eq, Show)
