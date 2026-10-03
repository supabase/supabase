module Hasql.Decoders.Array where

import PostgreSQL.Binary.Decoding qualified as A

import Hasql.Prelude

newtype Array a
  = Array (ReaderT Bool A.Array a)
  deriving (Functor)

{-# INLINE run #-}
run :: Array a -> Bool -> A.Value a
run (Array imp) env =
  A.array (runReaderT imp env)

{-# INLINE dimension #-}
dimension :: (forall m. (Monad m) => Int -> m a -> m b) -> Array a -> Array b
dimension replicateM (Array imp) =
  Array $ ReaderT $ \env -> A.dimensionArray replicateM (runReaderT imp env)

{-# INLINE value #-}
value :: (Bool -> A.Value a) -> Array (Maybe a)
value decoder' =
  Array $ ReaderT $ A.nullableValueArray . decoder'

{-# INLINE nonNullValue #-}
nonNullValue :: (Bool -> A.Value a) -> Array a
nonNullValue decoder' =
  Array $ ReaderT $ A.valueArray . decoder'
