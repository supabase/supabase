{-# LANGUAGE CPP #-}

module Hasql.Implicits.Encoders where

import Data.Aeson qualified as Aeson

import Hasql.Encoders
import Hasql.Implicits.Prelude hiding (bool)

-- | Provides a default implementation of parameter encoder.
class DefaultParamEncoder a where
  -- | Default parameter encoder with nullability specified.
  defaultParam :: NullableOrNot Value a

#define INSTANCES(VALUE, ENCODER) \
instance DefaultParamEncoder VALUE where { \
  defaultParam = nonNullable ENCODER; \
}; \
instance DefaultParamEncoder [VALUE] where { \
  defaultParam = (nonNullable . array . dimension foldlStrict . element . nonNullable) ENCODER; \
}; \
instance DefaultParamEncoder [Maybe VALUE] where { \
  defaultParam = (nonNullable . array . dimension foldlStrict . element . nullable) ENCODER; \
}; \
instance DefaultParamEncoder [[VALUE]] where { \
  defaultParam = (nonNullable . array . dimension foldlStrict . dimension foldlStrict . element . nonNullable) ENCODER; \
}; \
instance DefaultParamEncoder [[Maybe VALUE]] where { \
  defaultParam = (nonNullable . array . dimension foldlStrict . dimension foldlStrict . element . nullable) ENCODER; \
}; \
instance DefaultParamEncoder (Vector VALUE) where { \
  defaultParam = (nonNullable . array . dimension foldlStrict . element . nonNullable) ENCODER; \
}; \
instance DefaultParamEncoder (Vector (Maybe VALUE)) where { \
  defaultParam = (nonNullable . array . dimension foldlStrict . element . nullable) ENCODER; \
}; \
instance DefaultParamEncoder (Vector (Vector VALUE)) where { \
  defaultParam = (nonNullable . array . dimension foldlStrict . dimension foldlStrict . element . nonNullable) ENCODER; \
}; \
instance DefaultParamEncoder (Vector (Vector (Maybe VALUE))) where { \
  defaultParam = (nonNullable . array . dimension foldlStrict . dimension foldlStrict . element . nullable) ENCODER; \
}; \
instance DefaultParamEncoder (Maybe VALUE) where { \
  defaultParam = nullable ENCODER; \
}; \
instance DefaultParamEncoder (Maybe [VALUE]) where { \
  defaultParam = (nullable . array . dimension foldlStrict . element . nonNullable) ENCODER; \
}; \
instance DefaultParamEncoder (Maybe [Maybe VALUE]) where { \
  defaultParam = (nullable . array . dimension foldlStrict . element . nullable) ENCODER; \
}; \
instance DefaultParamEncoder (Maybe [[VALUE]]) where { \
  defaultParam = (nullable . array . dimension foldlStrict . dimension foldlStrict . element . nonNullable) ENCODER; \
}; \
instance DefaultParamEncoder (Maybe [[Maybe VALUE]]) where { \
  defaultParam = (nullable . array . dimension foldlStrict . dimension foldlStrict . element . nullable) ENCODER; \
}; \
instance DefaultParamEncoder (Maybe (Vector VALUE)) where { \
  defaultParam = (nullable . array . dimension foldlStrict . element . nonNullable) ENCODER; \
}; \
instance DefaultParamEncoder (Maybe (Vector (Maybe VALUE))) where { \
  defaultParam = (nullable . array . dimension foldlStrict . element . nullable) ENCODER; \
}; \
instance DefaultParamEncoder (Maybe (Vector (Vector VALUE))) where { \
  defaultParam = (nullable . array . dimension foldlStrict . dimension foldlStrict . element . nonNullable) ENCODER; \
}; \
instance DefaultParamEncoder (Maybe (Vector (Vector (Maybe VALUE)))) where { \
  defaultParam = (nullable . array . dimension foldlStrict . dimension foldlStrict . element . nullable) ENCODER; \
}

{- ORMOLU_DISABLE -}
INSTANCES(Char, char)
INSTANCES(Double, float8)
INSTANCES(Float, float4)
INSTANCES(Int16, int2)
INSTANCES(Int32, int4)
INSTANCES(Int64, int8)
INSTANCES(ByteString, bytea)
INSTANCES(Scientific, numeric)
INSTANCES(Text, text)
INSTANCES(UTCTime, timestamptz)
INSTANCES(Aeson.Value, jsonb)
INSTANCES(UUID, uuid)
INSTANCES(Day, date)
INSTANCES(DiffTime, interval)
INSTANCES(TimeOfDay, time)
INSTANCES(LocalTime, timestamp)
INSTANCES((TimeOfDay, TimeZone), timetz)
INSTANCES(IPRange, inet)
INSTANCES(Bool, bool)
{- ORMOLU_ENABLE -}

#undef INSTANCES
