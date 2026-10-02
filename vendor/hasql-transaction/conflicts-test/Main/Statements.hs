module Main.Statements where

import Prelude

import Hasql.Statement

import Hasql.Decoders qualified as D
import Hasql.Encoders qualified as E

createAccountTable :: Statement () ()
createAccountTable =
  Statement sql E.noParams D.noResult False
  where
    sql =
      "create table account (id serial not null, balance numeric not null, primary key (id))"

dropAccountTable :: Statement () ()
dropAccountTable =
  Statement
    "drop table account"
    E.noParams
    D.noResult
    False

createAccount :: Statement Scientific Int64
createAccount =
  Statement
    "insert into account (balance) values ($1) returning id"
    ((E.param . E.nonNullable) E.numeric)
    (D.singleRow ((D.column . D.nonNullable) D.int8))
    True

modifyBalance :: Statement (Int64, Scientific) Bool
modifyBalance =
  Statement
    "update account set balance = balance + $2 where id = $1"
    ((fst >$< (E.param . E.nonNullable) E.int8) <> (snd >$< (E.param . E.nonNullable) E.numeric))
    (fmap (> 0) D.rowsAffected)
    True

getBalance :: Statement Int64 (Maybe Scientific)
getBalance =
  Statement
    "select balance from account where id = $1"
    ((E.param . E.nonNullable) E.int8)
    (D.rowMaybe ((D.column . D.nonNullable) D.numeric))
    True
