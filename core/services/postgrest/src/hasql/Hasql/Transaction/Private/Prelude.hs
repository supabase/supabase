module Hasql.Transaction.Private.Prelude
  ( module Exports
  , tryError
  )
where

import Control.Applicative as Exports
import Control.Arrow as Exports
import Control.Category as Exports
import Control.Concurrent as Exports
import Control.Exception as Exports
import Control.Monad as Exports hiding
  ( fail
  , forM
  , forM_
  , join
  , mapM
  , mapM_
  , msum
  , sequence
  , sequence_
  )
import Control.Monad.Error.Class as Exports (MonadError (..))
import Control.Monad.Fail as Exports
import Control.Monad.Fix as Exports hiding (fix)
import Control.Monad.IO.Class as Exports
import Control.Monad.ST as Exports
import Control.Monad.Trans.Class as Exports
import Control.Monad.Trans.Maybe as Exports hiding
  ( liftListen
  , liftPass
  )
import Control.Monad.Trans.Reader as Exports hiding
  ( liftCallCC
  , liftCatch
  )
import Control.Monad.Trans.State.Strict as Exports hiding
  ( liftCallCC
  , liftCatch
  , liftListen
  , liftPass
  )
import Data.Bits as Exports
import Data.Bool as Exports
import Data.ByteString as Exports (ByteString)
import Data.Char as Exports
import Data.Coerce as Exports
import Data.Complex as Exports
import Data.Data as Exports
import Data.Dynamic as Exports
import Data.Either as Exports
import Data.Fixed as Exports
import Data.Foldable as Exports hiding (toList)
import Data.Function as Exports hiding (id, (.))
import Data.Functor as Exports hiding (unzip)
import Data.Functor.Contravariant as Exports
import Data.Functor.Contravariant.Divisible as Exports
import Data.Functor.Identity as Exports
import Data.IORef as Exports
import Data.Int as Exports
import Data.Ix as Exports
import Data.List as Exports hiding
  ( all
  , and
  , any
  , concat
  , concatMap
  , elem
  , find
  , foldl
  , foldl'
  , foldl1
  , foldr
  , foldr1
  , isSubsequenceOf
  , mapAccumL
  , mapAccumR
  , maximum
  , maximumBy
  , minimum
  , minimumBy
  , notElem
  , or
  , product
  , sortOn
  , sum
  , uncons
  )
import Data.Maybe as Exports
import Data.Monoid as Exports hiding
  ( Alt
  , First (..)
  , Last (..)
  , (<>)
  )
import Data.Ord as Exports
import Data.Proxy as Exports
import Data.Ratio as Exports
import Data.STRef as Exports
import Data.Semigroup as Exports
import Data.String as Exports
import Data.Traversable as Exports
import Data.Tuple as Exports
import Data.Unique as Exports
import Data.Version as Exports
import Data.Word as Exports
import Debug.Trace as Exports
import Foreign.ForeignPtr as Exports
import Foreign.Ptr as Exports
import Foreign.StablePtr as Exports
import Foreign.Storable as Exports hiding
  ( alignment
  , sizeOf
  )
import GHC.Conc as Exports hiding
  ( threadWaitRead
  , threadWaitReadSTM
  , threadWaitWrite
  , threadWaitWriteSTM
  , withMVar
  )
import GHC.Exts as Exports
  ( IsList (..)
  , groupWith
  , inline
  , lazy
  , sortWith
  )
import GHC.Generics as Exports (Generic, Generic1)
import GHC.IO.Exception as Exports
import Numeric as Exports
import System.Environment as Exports
import System.Exit as Exports
import System.IO as Exports
import System.IO.Error as Exports
import System.IO.Unsafe as Exports
import System.Mem as Exports
import System.Mem.StableName as Exports
import System.Timeout as Exports
import Text.Printf as Exports (hPrintf, printf)
import Text.Read as Exports
  ( Read (..)
  , readEither
  , readMaybe
  )
import Unsafe.Coerce as Exports
import Prelude as Exports hiding
  ( all
  , and
  , any
  , concat
  , concatMap
  , elem
  , fail
  , foldl
  , foldl1
  , foldr
  , foldr1
  , id
  , mapM
  , mapM_
  , maximum
  , minimum
  , notElem
  , or
  , product
  , sequence
  , sequence_
  , sum
  , (.)
  )

tryError :: (MonadError e m) => m a -> m (Either e a)
tryError m =
  catchError (fmap Right m) (return . Left)
