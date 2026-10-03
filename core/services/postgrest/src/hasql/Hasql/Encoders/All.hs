-- |
-- A DSL for declaration of query parameter encoders.
module Hasql.Encoders.All where

import Data.Aeson qualified as Aeson
import Data.ByteString.Lazy qualified as LazyByteString
import Data.IP qualified as Iproute
import PostgreSQL.Binary.Encoding qualified as A
import PostgreSQL.Binary.Range qualified as R
import TextBuilder qualified as C

import Hasql.Prelude hiding (bool)

import Hasql.Encoders.Array qualified as Array
import Hasql.Encoders.Params qualified as Params
import Hasql.Encoders.Value qualified as Value
import Hasql.PostgresTypeInfo qualified as PTI
import Hasql.Prelude qualified as Prelude

-- * Parameters Product Encoder

-- |
-- Encoder of some representation of a parameters product.
--
-- Has instances of 'Contravariant', 'Divisible' and 'Monoid',
-- which you can use to compose multiple parameters together.
-- E.g.,
--
-- @
-- someParamsEncoder :: 'Params' (Int64, Maybe Text)
-- someParamsEncoder =
--   ('fst' '>$<' 'param' ('nonNullable' 'int8')) '<>'
--   ('snd' '>$<' 'param' ('nullable' 'text'))
-- @
--
-- As a general solution for tuples of any arity, instead of 'fst' and 'snd',
-- consider the functions of the @contrazip@ family
-- from the \"contravariant-extras\" package.
-- E.g., here's how you can achieve the same as the above:
--
-- @
-- someParamsEncoder :: 'Params' (Int64, Maybe Text)
-- someParamsEncoder =
--   'contrazip2' ('param' ('nonNullable' 'int8')) ('param' ('nullable' 'text'))
-- @
--
-- Here's how you can implement encoders for custom composite types:
--
-- @
-- data Person = Person { name :: Text, gender :: Gender, age :: Int }
--
-- data Gender = Male | Female
--
-- personParams :: 'Params' Person
-- personParams =
--   (name '>$<' 'param' ('nonNullable' 'text')) '<>'
--   (gender '>$<' 'param' ('nonNullable' genderValue)) '<>'
--   ('fromIntegral' . age '>$<' 'param' ('nonNullable' 'int8'))
--
-- genderValue :: 'Value' Gender
-- genderValue = 'enum' genderText 'text' where
--   genderText gender = case gender of
--     Male -> "male"
--     Female -> "female"
-- @
newtype Params a = Params (Params.Params a)
  deriving (Contravariant, Divisible, Monoid, Semigroup)

-- |
-- No parameters. Same as `mempty` and `conquered`.
noParams :: Params ()
noParams = mempty

-- |
-- Lift a single parameter encoder, with its nullability specified,
-- associating it with a single placeholder.
param :: NullableOrNot Value a -> Params a
param = \case
  NonNullable (Value valueEnc) -> Params (Params.value valueEnc)
  Nullable (Value valueEnc) -> Params (Params.nullableValue valueEnc)

-- * Nullability

-- |
-- Extensional specification of nullability over a generic encoder.
data NullableOrNot encoder a where
  NonNullable :: encoder a -> NullableOrNot encoder a
  Nullable :: encoder a -> NullableOrNot encoder (Maybe a)

-- |
-- Specify that an encoder produces a non-nullable value.
nonNullable :: encoder a -> NullableOrNot encoder a
nonNullable = NonNullable

-- |
-- Specify that an encoder produces a nullable value.
nullable :: encoder a -> NullableOrNot encoder (Maybe a)
nullable = Nullable

-- * Value

-- |
-- Value encoder.
newtype Value a = Value (Value.Value a)
  deriving (Contravariant)

-- |
-- Encoder of @BOOL@ values.
{-# INLINEABLE bool #-}
bool :: Value Bool
bool = Value (Value.unsafePTIWithShow PTI.bool (const A.bool))

-- |
-- Encoder of @INT2@ values.
{-# INLINEABLE int2 #-}
int2 :: Value Int16
int2 = Value (Value.unsafePTIWithShow PTI.int2 (const A.int2_int16))

-- |
-- Encoder of @INT4@ values.
{-# INLINEABLE int4 #-}
int4 :: Value Int32
int4 = Value (Value.unsafePTIWithShow PTI.int4 (const A.int4_int32))

-- |
-- Encoder of @INT8@ values.
{-# INLINEABLE int8 #-}
int8 :: Value Int64
int8 = Value (Value.unsafePTIWithShow PTI.int8 (const A.int8_int64))

-- |
-- Encoder of @FLOAT4@ values.
{-# INLINEABLE float4 #-}
float4 :: Value Float
float4 = Value (Value.unsafePTIWithShow PTI.float4 (const A.float4))

-- |
-- Encoder of @FLOAT8@ values.
{-# INLINEABLE float8 #-}
float8 :: Value Double
float8 = Value (Value.unsafePTIWithShow PTI.float8 (const A.float8))

-- |
-- Encoder of @NUMERIC@ values.
{-# INLINEABLE numeric #-}
numeric :: Value Scientific
numeric = Value (Value.unsafePTIWithShow PTI.numeric (const A.numeric))

-- |
-- Encoder of @CHAR@ values.
--
-- Note that it supports Unicode values and
-- identifies itself under the @TEXT@ OID because of that.
{-# INLINEABLE char #-}
char :: Value Char
char = Value (Value.unsafePTIWithShow PTI.text (const A.char_utf8))

-- |
-- Encoder of @TEXT@ values.
{-# INLINEABLE text #-}
text :: Value Text
text = Value (Value.unsafePTIWithShow PTI.text (const A.text_strict))

-- |
-- Encoder of @BYTEA@ values.
{-# INLINEABLE bytea #-}
bytea :: Value ByteString
bytea = Value (Value.unsafePTIWithShow PTI.bytea (const A.bytea_strict))

-- |
-- Encoder of @DATE@ values.
{-# INLINEABLE date #-}
date :: Value Day
date = Value (Value.unsafePTIWithShow PTI.date (const A.date))

-- |
-- Encoder of @TIMESTAMP@ values.
{-# INLINEABLE timestamp #-}
timestamp :: Value LocalTime
timestamp = Value (Value.unsafePTIWithShow PTI.timestamp (Prelude.bool A.timestamp_float A.timestamp_int))

-- |
-- Encoder of @TIMESTAMPTZ@ values.
{-# INLINEABLE timestamptz #-}
timestamptz :: Value UTCTime
timestamptz = Value (Value.unsafePTIWithShow PTI.timestamptz (Prelude.bool A.timestamptz_float A.timestamptz_int))

-- |
-- Encoder of @TIME@ values.
{-# INLINEABLE time #-}
time :: Value TimeOfDay
time = Value (Value.unsafePTIWithShow PTI.time (Prelude.bool A.time_float A.time_int))

-- |
-- Encoder of @TIMETZ@ values.
{-# INLINEABLE timetz #-}
timetz :: Value (TimeOfDay, TimeZone)
timetz = Value (Value.unsafePTIWithShow PTI.timetz (Prelude.bool A.timetz_float A.timetz_int))

-- |
-- Encoder of @INTERVAL@ values.
{-# INLINEABLE interval #-}
interval :: Value DiffTime
interval = Value (Value.unsafePTIWithShow PTI.interval (Prelude.bool A.interval_float A.interval_int))

-- |
-- Encoder of @UUID@ values.
{-# INLINEABLE uuid #-}
uuid :: Value UUID
uuid = Value (Value.unsafePTIWithShow PTI.uuid (const A.uuid))

-- |
-- Encoder of @INET@ values.
{-# INLINEABLE inet #-}
inet :: Value Iproute.IPRange
inet = Value (Value.unsafePTIWithShow PTI.inet (const A.inet))

-- |
-- Encoder of @MACADDR@ values.
--
-- Represented as a 6-tuple of Word8 values in big endian order. If
-- you use `ip` library consider using it with `toOctets`.
--
-- > toOctets >$< macaddr
{-# INLINEABLE macaddr #-}
macaddr :: Value (Word8, Word8, Word8, Word8, Word8, Word8)
macaddr = Value (Value.unsafePTIWithShow PTI.macaddr (const A.macaddr))

-- |
-- Encoder of @JSON@ values from JSON AST.
{-# INLINEABLE json #-}
json :: Value Aeson.Value
json = Value (Value.unsafePTIWithShow PTI.json (const A.json_ast))

-- |
-- Encoder of @JSON@ values from raw JSON.
{-# INLINEABLE jsonBytes #-}
jsonBytes :: Value ByteString
jsonBytes = Value (Value.unsafePTIWithShow PTI.json (const A.json_bytes))

-- |
-- Encoder of @JSON@ values from raw JSON as lazy ByteString.
{-# INLINEABLE jsonLazyBytes #-}
jsonLazyBytes :: Value LazyByteString.ByteString
jsonLazyBytes = Value (Value.unsafePTIWithShow PTI.json (const A.json_bytes_lazy))

-- |
-- Encoder of @JSONB@ values from JSON AST.
{-# INLINEABLE jsonb #-}
jsonb :: Value Aeson.Value
jsonb = Value (Value.unsafePTIWithShow PTI.jsonb (const A.jsonb_ast))

-- |
-- Encoder of @JSONB@ values from raw JSON.
{-# INLINEABLE jsonbBytes #-}
jsonbBytes :: Value ByteString
jsonbBytes = Value (Value.unsafePTIWithShow PTI.jsonb (const A.jsonb_bytes))

-- |
-- Encoder of @JSONB@ values from raw JSON as lazy ByteString.
{-# INLINEABLE jsonbLazyBytes #-}
jsonbLazyBytes :: Value LazyByteString.ByteString
jsonbLazyBytes = Value (Value.unsafePTIWithShow PTI.jsonb (const A.jsonb_bytes_lazy))

-- |
-- Encoder of @OID@ values.
{-# INLINEABLE oid #-}
oid :: Value Int32
oid = Value (Value.unsafePTIWithShow PTI.oid (const A.int4_int32))

-- |
-- Encoder of @NAME@ values.
{-# INLINEABLE name #-}
name :: Value Text
name = Value (Value.unsafePTIWithShow PTI.name (const A.text_strict))

-- |
-- Encoder of @INT4RANGE@ values.
{-# INLINEABLE int4range #-}
int4range :: Value (R.Range Int32)
int4range = Value (Value.unsafePTIWithShow PTI.int4range (const A.int4range))

-- |
-- Encoder of @INT8RANGE@ values.
{-# INLINEABLE int8range #-}
int8range :: Value (R.Range Int64)
int8range = Value (Value.unsafePTIWithShow PTI.int8range (const A.int8range))

-- |
-- Encoder of @NUMRANGE@ values.
{-# INLINEABLE numrange #-}
numrange :: Value (R.Range Scientific)
numrange = Value (Value.unsafePTIWithShow PTI.numrange (const A.numrange))

-- |
-- Encoder of @TSRANGE@ values.
{-# INLINEABLE tsrange #-}
tsrange :: Value (R.Range LocalTime)
tsrange = Value (Value.unsafePTIWithShow PTI.tsrange (Prelude.bool A.tsrange_float A.tsrange_int))

-- |
-- Encoder of @TSTZRANGE@ values.
{-# INLINEABLE tstzrange #-}
tstzrange :: Value (R.Range UTCTime)
tstzrange = Value (Value.unsafePTIWithShow PTI.tstzrange (Prelude.bool A.tstzrange_float A.tstzrange_int))

-- |
-- Encoder of @DATERANGE@ values.
{-# INLINEABLE daterange #-}
daterange :: Value (R.Range Day)
daterange = Value (Value.unsafePTIWithShow PTI.daterange (const A.daterange))

-- |
-- Encoder of @INT4MULTIRANGE@ values.
{-# INLINEABLE int4multirange #-}
int4multirange :: Value (R.Multirange Int32)
int4multirange = Value (Value.unsafePTIWithShow PTI.int4multirange (const A.int4multirange))

-- |
-- Encoder of @INT8MULTIRANGE@ values.
{-# INLINEABLE int8multirange #-}
int8multirange :: Value (R.Multirange Int64)
int8multirange = Value (Value.unsafePTIWithShow PTI.int8multirange (const A.int8multirange))

-- |
-- Encoder of @NUMMULTIRANGE@ values.
{-# INLINEABLE nummultirange #-}
nummultirange :: Value (R.Multirange Scientific)
nummultirange = Value (Value.unsafePTIWithShow PTI.nummultirange (const A.nummultirange))

-- |
-- Encoder of @TSMULTIRANGE@ values.
{-# INLINEABLE tsmultirange #-}
tsmultirange :: Value (R.Multirange LocalTime)
tsmultirange = Value (Value.unsafePTIWithShow PTI.tsmultirange (Prelude.bool A.tsmultirange_float A.tsmultirange_int))

-- |
-- Encoder of @TSTZMULTIRANGE@ values.
{-# INLINEABLE tstzmultirange #-}
tstzmultirange :: Value (R.Multirange UTCTime)
tstzmultirange = Value (Value.unsafePTIWithShow PTI.tstzmultirange (Prelude.bool A.tstzmultirange_float A.tstzmultirange_int))

-- |
-- Encoder of @DATEMULTIRANGE@ values.
{-# INLINEABLE datemultirange #-}
datemultirange :: Value (R.Multirange Day)
datemultirange = Value (Value.unsafePTIWithShow PTI.datemultirange (const A.datemultirange))

-- |
-- Given a function,
-- which maps a value into a textual enum label used on the DB side,
-- produces an encoder of that value.
{-# INLINEABLE enum #-}
enum :: (a -> Text) -> Value a
enum mapping = Value (Value.unsafePTI PTI.text (const (A.text_strict . mapping)) (C.text . mapping))

-- |
-- Variation of 'enum' with unknown OID.
-- This function does not identify the type to Postgres,
-- so Postgres must be able to derive the type from context.
-- When you find yourself in such situation just provide an explicit type in the query
-- using the :: operator.
{-# INLINEABLE unknownEnum #-}
unknownEnum :: (a -> Text) -> Value a
unknownEnum mapping = Value (Value.unsafePTI PTI.binaryUnknown (const (A.text_strict . mapping)) (C.text . mapping))

-- |
-- Identifies the value with the PostgreSQL's \"unknown\" type,
-- thus leaving it up to Postgres to infer the actual type of the value.
--
-- The value transimitted is any value encoded in the Postgres' Text data format.
-- For reference, see the
-- <https://www.postgresql.org/docs/10/static/protocol-overview.html#PROTOCOL-FORMAT-CODES Formats and Format Codes>
-- section of the Postgres' documentation.
--
-- __Warning:__ Do not use this as part of composite encoders like 'array' since
-- it is the only encoder that doesn't use the binary format.
{-# INLINEABLE unknown #-}
unknown :: Value ByteString
unknown = Value (Value.unsafePTIWithShow PTI.textUnknown (const A.bytea_strict))

-- |
-- Lift an array encoder into a value encoder.
array :: Array a -> Value a
array (Array (Array.Array valueOID arrayOID arrayEncoder renderer)) =
  let encoder env input = A.array (PTI.oidWord32 valueOID) (arrayEncoder env input)
  in  Value (Value.Value arrayOID arrayOID encoder renderer)

-- |
-- Lift a composite encoder into a value encoder.
composite :: Composite a -> Value a
composite (Composite encode print) =
  Value (Value.unsafePTI PTI.binaryUnknown encodeValue printValue)
  where
    encodeValue idt val =
      A.composite $ encode val idt
    printValue val =
      "ROW (" <> C.intercalate ", " (print val) <> ")"

-- |
-- Lift a value encoder of element into a unidimensional array encoder of a foldable value.
--
-- This function is merely a shortcut to the following expression:
--
-- @
-- ('array' . 'dimension' 'foldl'' . 'element')
-- @
--
-- You can use it like this:
--
-- @
-- vectorOfInts :: Value (Vector Int64)
-- vectorOfInts = 'foldableArray' ('nonNullable' 'int8')
-- @
--
-- Please notice that in case of multidimensional arrays nesting 'foldableArray' encoder
-- won't work. You have to explicitly construct the array encoder using 'array'.
{-# INLINE foldableArray #-}
foldableArray :: (Foldable foldable) => NullableOrNot Value element -> Value (foldable element)
foldableArray = array . dimension foldl' . element

-- * Array

-- |
-- Generic array encoder.
--
-- Here's an example of its usage:
--
-- @
-- someParamsEncoder :: 'Params' [[Int64]]
-- someParamsEncoder = 'param' ('nonNullable' ('array' ('dimension' 'foldl'' ('dimension' 'foldl'' ('element' ('nonNullable' 'int8'))))))
-- @
--
-- Please note that the PostgreSQL @IN@ keyword does not accept an array, but rather a syntactical list of
-- values, thus this encoder is not suited for that. Use a @value = ANY($1)@ condition instead.
newtype Array a = Array (Array.Array a)
  deriving (Contravariant)

-- |
-- Lifts a 'Value' encoder into an 'Array' encoder.
element :: NullableOrNot Value a -> Array a
element = \case
  NonNullable (Value (Value.Value elementOID arrayOID encoder renderer)) ->
    Array (Array.value elementOID arrayOID encoder renderer)
  Nullable (Value (Value.Value elementOID arrayOID encoder renderer)) ->
    Array (Array.nullableValue elementOID arrayOID encoder renderer)

-- |
-- Encoder of an array dimension,
-- which thus provides support for multidimensional arrays.
--
-- Accepts:
--
-- * An implementation of the left-fold operation,
-- such as @Data.Foldable.'foldl''@,
-- which determines the input value.
--
-- * A component encoder, which can be either another 'dimension' or 'element'.
{-# INLINEABLE dimension #-}
dimension :: (forall a. (a -> b -> a) -> a -> c -> a) -> Array b -> Array c
dimension foldl (Array imp) = Array (Array.dimension foldl imp)

-- * Composite

-- |
-- Composite or row-types encoder.
data Composite a
  = Composite
      (a -> Bool -> A.Composite)
      (a -> [C.TextBuilder])

instance Contravariant Composite where
  contramap f (Composite encode print) =
    Composite (encode . f) (print . f)

instance Divisible Composite where
  divide f (Composite encodeL printL) (Composite encodeR printR) =
    Composite
      (\val idt -> case f val of (lVal, rVal) -> encodeL lVal idt <> encodeR rVal idt)
      (\val -> case f val of (lVal, rVal) -> printL lVal <> printR rVal)
  conquer = mempty

instance Semigroup (Composite a) where
  Composite encodeL printL <> Composite encodeR printR =
    Composite
      (\val idt -> encodeL val idt <> encodeR val idt)
      (\val -> printL val <> printR val)

instance Monoid (Composite a) where
  mempty = Composite mempty mempty

-- | Single field of a row-type.
field :: NullableOrNot Value a -> Composite a
field = \case
  NonNullable (Value (Value.Value elementOID _ encode print)) ->
    Composite
      (\val idt -> A.field (PTI.oidWord32 elementOID) (encode idt val))
      (\val -> [print val])
  Nullable (Value (Value.Value elementOID _ encode print)) ->
    Composite
      ( \val idt -> case val of
          Nothing -> A.nullField (PTI.oidWord32 elementOID)
          Just val -> A.field (PTI.oidWord32 elementOID) (encode idt val)
      )
      ( \case
          Nothing -> ["NULL"]
          Just val -> [print val]
      )
