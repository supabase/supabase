module Hasql.Commands
  ( Commands
  , asBytes
  , setEncodersToUTF8
  , setMinClientMessagesToWarning
  )
where

import Data.ByteString.Builder qualified as BB
import Data.ByteString.Lazy qualified as BL

import Hasql.Prelude

newtype Commands
  = Commands (DList BB.Builder)
  deriving (Monoid, Semigroup)

asBytes :: Commands -> ByteString
asBytes (Commands list) =
  BL.toStrict $ BB.toLazyByteString $ foldMap (<> BB.char7 ';') list

setEncodersToUTF8 :: Commands
setEncodersToUTF8 =
  Commands (pure "SET client_encoding = 'UTF8'")

setMinClientMessagesToWarning :: Commands
setMinClientMessagesToWarning =
  Commands (pure "SET client_min_messages TO WARNING")
