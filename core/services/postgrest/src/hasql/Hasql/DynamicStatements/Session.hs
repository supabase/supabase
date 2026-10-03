module Hasql.DynamicStatements.Session where

import Hasql.DynamicStatements.Prelude
import Hasql.Session

import Hasql.Decoders qualified as Decoders
import Hasql.DynamicStatements.Snippet.Defs qualified as SnippetDefs
import Hasql.DynamicStatements.Statement qualified as Statement
import Hasql.Session qualified as Session

-- |
-- Execute a dynamically parameterized statement, providing a result decoder.
--
-- This is merely a shortcut, which immediately embeds
-- @Hasql.DynamicStatements.Statement.'Statement.dynamicallyParameterized'@
-- in @Session@.
-- For details see the docs on that function.
dynamicallyParameterizedStatement :: SnippetDefs.Snippet -> Decoders.Result result -> Bool -> Session result
dynamicallyParameterizedStatement snippet decoder prepared =
  Session.statement () (Statement.dynamicallyParameterized snippet decoder prepared)
