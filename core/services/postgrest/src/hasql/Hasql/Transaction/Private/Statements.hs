module Hasql.Transaction.Private.Statements where

import Hasql.Transaction.Config
import Hasql.Transaction.Private.Prelude

import Hasql.Decoders qualified as C
import Hasql.Encoders qualified as B
import Hasql.Statement qualified as A
import Hasql.Transaction.Private.SQL qualified as D

beginTransaction :: IsolationLevel -> Mode -> A.Statement () ()
beginTransaction isolation mode =
  A.Statement (D.beginTransaction isolation mode) B.noParams C.noResult True

commitTransaction :: A.Statement () ()
commitTransaction =
  A.Statement "COMMIT" B.noParams C.noResult True

abortTransaction :: A.Statement () ()
abortTransaction =
  A.Statement "ABORT" B.noParams C.noResult True
