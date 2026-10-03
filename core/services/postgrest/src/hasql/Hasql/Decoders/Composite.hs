module Hasql.Decoders.Composite where

import PostgreSQL.Binary.Decoding qualified as A

import Hasql.Prelude

newtype Composite a
  = Composite (ReaderT Bool A.Composite a)
  deriving (Applicative, Functor, Monad, MonadFail)

{-# INLINE run #-}
run :: Composite a -> Bool -> A.Value a
run (Composite imp) env =
  A.composite (runReaderT imp env)

{-# INLINE value #-}
value :: (Bool -> A.Value a) -> Composite (Maybe a)
value decoder' =
  Composite $ ReaderT $ A.nullableValueComposite . decoder'

{-# INLINE nonNullValue #-}
nonNullValue :: (Bool -> A.Value a) -> Composite a
nonNullValue decoder' =
  Composite $ ReaderT $ A.valueComposite . decoder'
