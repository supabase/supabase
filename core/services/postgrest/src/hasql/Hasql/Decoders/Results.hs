-- |
-- An API for retrieval of multiple results.
-- Can be used to handle:
--
-- * A single result,
--
-- * Individual results of a multi-statement query
-- with the help of "Applicative" and "Monad",
--
-- * Row-by-row fetching.
module Hasql.Decoders.Results where

import Hasql.Errors
import Hasql.Prelude hiding (many, maybe)

import Hasql.Decoders.Result qualified as Result
import Hasql.LibPq14 qualified as LibPQ
import Hasql.Prelude qualified as Prelude

newtype Results a
  = Results (ReaderT (Bool, LibPQ.Connection) (ExceptT CommandError IO) a)
  deriving (Applicative, Functor, Monad)

instance Filterable Results where
  {-# INLINE mapMaybe #-}
  mapMaybe fn =
    refine (Prelude.maybe (Left "Invalid result") Right . fn)

{-# INLINE run #-}
run :: Results a -> LibPQ.Connection -> Bool -> IO (Either CommandError a)
run (Results stack) conn idt =
  runExceptT (runReaderT stack (idt, conn))

{-# INLINE clientError #-}
clientError :: Results a
clientError =
  Results
    $ ReaderT
    $ \(_, connection) ->
      ExceptT
        $ fmap (Left . ClientError) (LibPQ.errorMessage connection)

-- |
-- Parse a single result.
{-# INLINE single #-}
single :: Result.Result a -> Results a
single resultDec =
  Results
    $ ReaderT
    $ \(integerDatetimes, connection) -> ExceptT $ do
      resultMaybe <- LibPQ.getResult connection
      case resultMaybe of
        Just result ->
          first ResultError <$> Result.run resultDec integerDatetimes result
        Nothing ->
          fmap (Left . ClientError) (LibPQ.errorMessage connection)

{-# INLINE dropRemainders #-}
dropRemainders :: Results ()
dropRemainders =
  {-# SCC "dropRemainders" #-}
  Results $ ReaderT $ uncurry loop
  where
    loop integerDatetimes connection =
      getResultMaybe >>= Prelude.maybe (pure ()) onResult
      where
        getResultMaybe =
          lift $ LibPQ.getResult connection
        onResult result =
          loop integerDatetimes connection <* checkErrors
          where
            checkErrors =
              ExceptT (first ResultError <$> Result.run Result.noResult integerDatetimes result)

refine :: (a -> Either Text b) -> Results a -> Results b
refine refiner (Results stack) = Results
  $ ReaderT
  $ \env -> ExceptT $ do
    resultEither <- runExceptT $ runReaderT stack env
    return $ resultEither >>= first (ResultError . UnexpectedResult) . refiner
