module Hasql.Encoders.Array where

import PostgreSQL.Binary.Encoding qualified as A
import TextBuilder qualified as C

import Hasql.Prelude

import Hasql.PostgresTypeInfo qualified as B

data Array a
  = Array B.OID B.OID (Bool -> a -> A.Array) (a -> C.TextBuilder)

instance Contravariant Array where
  contramap fn (Array valueOid arrayOid encoder renderer) =
    Array valueOid arrayOid (\intDateTimes -> encoder intDateTimes . fn) (renderer . fn)

{-# INLINE value #-}
value :: B.OID -> B.OID -> (Bool -> a -> A.Encoding) -> (a -> C.TextBuilder) -> Array a
value valueOID arrayOID encoder =
  Array valueOID arrayOID (\params -> A.encodingArray . encoder params)

{-# INLINE nullableValue #-}
nullableValue :: B.OID -> B.OID -> (Bool -> a -> A.Encoding) -> (a -> C.TextBuilder) -> Array (Maybe a)
nullableValue valueOID arrayOID encoder renderer =
  let
    maybeEncoder params =
      maybe A.nullArray (A.encodingArray . encoder params)
    maybeRenderer =
      maybe (C.string "null") renderer
  in
    Array valueOID arrayOID maybeEncoder maybeRenderer

{-# INLINE dimension #-}
dimension :: (forall a. (a -> b -> a) -> a -> c -> a) -> Array b -> Array c
dimension fold (Array valueOID arrayOID elEncoder elRenderer) =
  let
    encoder el =
      A.dimensionArray fold (elEncoder el)
    renderer els =
      let folded =
            let step builder el =
                  if C.isEmpty builder then
                    C.char '[' <> elRenderer el
                  else
                    builder <> C.string ", " <> elRenderer el
            in  fold step mempty els
      in  if C.isEmpty folded then
            C.string "[]"
          else
            folded <> C.char ']'
  in
    Array valueOID arrayOID encoder renderer
