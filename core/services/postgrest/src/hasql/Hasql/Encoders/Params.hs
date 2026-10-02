module Hasql.Encoders.Params where

import PostgreSQL.Binary.Encoding qualified as B
import TextBuilder qualified as E

import Hasql.Prelude

import Hasql.Encoders.Value qualified as C
import Hasql.LibPq14 qualified as A
import Hasql.PostgresTypeInfo qualified as D

renderReadable :: Params a -> a -> [Text]
renderReadable (Params _ _ _ printer) params =
  printer params
    & toList

compilePreparedStatementData :: Params a -> Bool -> a -> ([A.Oid], [Maybe (ByteString, A.Format)])
compilePreparedStatementData (Params _ columnsMetadata serializer _) integerDatetimes input =
  (oidList, valueAndFormatList)
  where
    (oidList, formatList) =
      columnsMetadata & toList & unzip
    valueAndFormatList =
      serializer integerDatetimes input
        & toList
        & zipWith (\format encoding -> (,format) <$> encoding) formatList

compileUnpreparedStatementData :: Params a -> Bool -> a -> [Maybe (A.Oid, ByteString, A.Format)]
compileUnpreparedStatementData (Params _ columnsMetadata serializer _) integerDatetimes input =
  zipWith
    ( \(oid, format) encoding ->
        ((,,) oid <$> encoding) <*> pure format
    )
    (toList columnsMetadata)
    (toList (serializer integerDatetimes input))

-- |
-- Encoder of some representation of a parameters product.
data Params a = Params
  { size :: !Int
  , columnsMetadata :: !(DList (A.Oid, A.Format))
  , serializer :: Bool -> a -> DList (Maybe ByteString)
  , printer :: a -> DList Text
  }

instance Contravariant Params where
  contramap fn (Params size columnsMetadata oldSerializer oldPrinter) = Params{..}
    where
      serializer idt = oldSerializer idt . fn
      printer = oldPrinter . fn

instance Divisible Params where
  divide
    divisor
    (Params leftSize leftColumnsMetadata leftSerializer leftPrinter)
    (Params rightSize rightColumnsMetadata rightSerializer rightPrinter) =
      Params
        { size = leftSize + rightSize
        , columnsMetadata = leftColumnsMetadata <> rightColumnsMetadata
        , serializer = \idt input -> case divisor input of
            (leftInput, rightInput) -> leftSerializer idt leftInput <> rightSerializer idt rightInput
        , printer = \input -> case divisor input of
            (leftInput, rightInput) -> leftPrinter leftInput <> rightPrinter rightInput
        }
  conquer =
    Params
      { size = 0
      , columnsMetadata = mempty
      , serializer = mempty
      , printer = mempty
      }

instance Semigroup (Params a) where
  Params leftSize leftColumnsMetadata leftSerializer leftPrinter <> Params rightSize rightColumnsMetadata rightSerializer rightPrinter =
    Params
      { size = leftSize + rightSize
      , columnsMetadata = leftColumnsMetadata <> rightColumnsMetadata
      , serializer = \idt input -> leftSerializer idt input <> rightSerializer idt input
      , printer = \input -> leftPrinter input <> rightPrinter input
      }

instance Monoid (Params a) where
  mempty = conquer

value :: C.Value a -> Params a
value (C.Value valueOID _ serialize print) =
  Params
    { size = 1
    , columnsMetadata = pure (pqOid, format)
    , serializer = \idt -> pure . Just . B.encodingBytes . serialize idt
    , printer = pure . E.toText . print
    }
  where
    D.OID _ pqOid format = valueOID

nullableValue :: C.Value a -> Params (Maybe a)
nullableValue (C.Value valueOID _ serialize print) =
  Params
    { size = 1
    , columnsMetadata = pure (pqOid, format)
    , serializer = \idt -> pure . fmap (B.encodingBytes . serialize idt)
    , printer = pure . maybe "null" (E.toText . print)
    }
  where
    D.OID _ pqOid format = valueOID
