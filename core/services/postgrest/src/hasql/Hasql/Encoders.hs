-- |
-- A DSL for declaration of statement parameter encoders.
--
-- For compactness of names all the types defined here imply being an encoder.
-- E.g., the `Array` type is an __encoder__ of arrays, not the data-structure itself.
module Hasql.Encoders
  ( -- * Parameters product
    Params
  , noParams
  , param

    -- * Nullability
  , NullableOrNot
  , nonNullable
  , nullable

    -- * Value
  , Value
  , bool
  , int2
  , int4
  , int8
  , float4
  , float8
  , numeric
  , char
  , text
  , bytea
  , date
  , timestamp
  , timestamptz
  , time
  , timetz
  , interval
  , uuid
  , inet
  , macaddr
  , json
  , jsonBytes
  , jsonLazyBytes
  , jsonb
  , jsonbBytes
  , jsonbLazyBytes
  , int4range
  , int8range
  , numrange
  , tsrange
  , tstzrange
  , daterange
  , int4multirange
  , int8multirange
  , nummultirange
  , tsmultirange
  , tstzmultirange
  , datemultirange
  , name
  , oid
  , enum
  , unknownEnum
  , unknown
  , array
  , foldableArray
  , composite

    -- * Array
  , Array
  , element
  , dimension

    -- * Composite
  , Composite
  , field
  )
where

import Hasql.Encoders.All
