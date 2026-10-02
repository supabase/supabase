module PostgREST.TimeIt
  ( timeItT
  )
where

import GHC.Clock
import Protolude

{-
 - The signature is the same as https://hackage.haskell.org/package/timeit-2.0/docs/src/System-TimeIt.html#timeIt,
 - we vendor this functionality because it gave errors as shown on https://github.com/PostgREST/postgrest/issues/4522 plus
 - the function is small enough. This vendored function is different in that the result is in milliseconds.
 -}
timeItT :: (MonadIO m) => m a -> m (Double, a)
timeItT p = do
  s <- liftIO getMonotonicTime
  x <- p
  e <- liftIO getMonotonicTime
  let time = (e - s) * 1000
  return (time, x)
