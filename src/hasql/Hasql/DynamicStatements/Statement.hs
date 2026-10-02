module Hasql.DynamicStatements.Statement where

import Ptr.ByteString qualified as ByteString
import Ptr.Poking qualified as Poking

import Hasql.DynamicStatements.Prelude
import Hasql.Statement

import Hasql.Decoders qualified as Decoders
import Hasql.DynamicStatements.Snippet.Defs qualified as SnippetDefs

-- |
-- Construct a statement dynamically, specifying the parameters in-place
-- in the declaration of snippet and providing a result decoder and
-- specifying whether the statement should be prepared.
--
-- The injection of the parameters is handled automatically,
-- generating parametric statements with binary encoders under the hood.
--
-- This is useful when the SQL of your statement depends on the parameters.
-- Here's an example:
--
-- @
-- selectSubstring :: Text -> Maybe Int32 -> Maybe Int32 -> 'Statement' () Text
-- selectSubstring string from to = let
--   snippet =
--     "select substring(" <> Snippet.'SnippetDefs.param' string <>
--     foldMap (mappend " from " . Snippet.'SnippetDefs.param') from <>
--     foldMap (mappend " for " . Snippet.'SnippetDefs.param') to <>
--     ")"
--   decoder = Decoders.'Decoders.singleRow' (Decoders.'Decoders.column' (Decoders.'Decoders.nonNullable' Decoders.'Decoders.text'))
--   in 'dynamicallyParameterized' snippet decoder True
-- @
--
-- Without the Snippet API you would have had to implement the same functionality thus:
--
-- @
-- selectSubstring' :: Text -> Maybe Int32 -> Maybe Int32 -> 'Statement' () Text
-- selectSubstring' string from to = let
--   sql = case (from, to) of
--     (Just _, Just _) -> "select substring($1 from $2 to $3)"
--     (Just _, Nothing) -> "select substring($1 from $2)"
--     (Nothing, Just _) -> "select substring($1 to $2)"
--     (Nothing, Nothing) -> "select substring($1)"
--   encoder =
--     Encoders.'Encoders.param' (string '>$' Encoders.'Encoders.text') <>
--     foldMap (\\ x -> Encoders.'Encoders.param' (x '>$' Encoders.'Encoders.int8')) from <>
--     foldMap (\\ x -> Encoders.'Encoders.param' (x '>$' Encoders.'Encoders.int8')) to
--   decoder = Decoders.'Decoders.singleRow' (Decoders.'Decoders.column' (Decoders.'Decoders.nonNullable' Decoders.'Decoders.text'))
--   in Statement sql encoder decoder True
-- @
--
-- As you can see, the Snippet API abstracts over placeholders and
-- matching encoder generation, thus also protecting you from all sorts of related bugs.
dynamicallyParameterized :: SnippetDefs.Snippet -> Decoders.Result result -> Bool -> Statement () result
dynamicallyParameterized (SnippetDefs.Snippet chunks) decoder prepared =
  let step (!paramId, !poking, !encoder) = \case
        SnippetDefs.StringSnippetChunk sql -> (paramId, poking <> Poking.bytes sql, encoder)
        SnippetDefs.ParamSnippetChunk paramEncoder ->
          let
            newParamId = paramId + 1
            newPoking = poking <> Poking.word8 36 <> Poking.asciiIntegral paramId
            newEncoder = encoder <> paramEncoder
          in
            (newParamId, newPoking, newEncoder)
  in  case foldl' step (1, mempty, mempty) chunks of
        (_, poking, encoder) -> Statement (ByteString.poking poking) encoder decoder prepared
