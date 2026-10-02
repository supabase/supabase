module Hasql.Decoders.Value where

import PostgreSQL.Binary.Decoding qualified as A

import Hasql.Prelude

newtype Value a
  = Value (Bool -> A.Value a)
  deriving (Functor)

instance Filterable Value where
  {-# INLINE mapMaybe #-}
  mapMaybe fn =
    refine (maybe (Left "Invalid value") Right . fn)

{-# INLINE run #-}
run :: Value a -> Bool -> A.Value a
run (Value imp) = imp

{-# INLINE decoder #-}
decoder :: (Bool -> A.Value a) -> Value a
decoder =
  {-# SCC "decoder" #-}
  Value

{-# INLINE decoderFn #-}
decoderFn :: (Bool -> ByteString -> Either Text a) -> Value a
decoderFn fn =
  Value $ \integerDatetimes -> A.fn $ fn integerDatetimes

-- |
-- Refine a value decoder, lifting the possible error to the session level.
{-# INLINE refine #-}
refine :: (a -> Either Text b) -> Value a -> Value b
refine fn (Value run) = Value (A.refine fn . run)
