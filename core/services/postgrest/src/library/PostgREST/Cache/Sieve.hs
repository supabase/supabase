{-# LANGUAGE DataKinds #-}
{-# LANGUAGE GADTs #-}
{-# LANGUAGE LambdaCase #-}
{-# LANGUAGE NamedFieldPuns #-}
{-# LANGUAGE RecordWildCards #-}
{-# LANGUAGE RecursiveDo #-}
{-# LANGUAGE StrictData #-}

-- |
-- Module      : PostgREST.Cache.Sieve
-- Description : PostgREST cache implementation based on Sieve algorithm.
--
-- This module provides implementation of a mutable cache on Sieve algorithm.
module PostgREST.Cache.Sieve
  ( Cache
  , CacheConfig (..)
  , Discard (..)
  , alwaysValid
  , cache
  , cacheIO
  , cached
  )
where

import Control.Concurrent.STM
import Control.Monad.Extra (whileM)
import Data.Some
import Protolude hiding (elem, head)

import Focus qualified as F
import StmHamt.SizedHamt qualified as SH

data ListNode k v (b :: Bool) = ListNode
  { nextPtr :: NodePtr k v
  , prevNextPtrPtr :: NodePtrPtr k v
  , elem :: NodeElem k v b
  }

data NodeElem :: Type -> Type -> Bool -> Type where
  Head
    :: { entries :: SH.SizedHamt (HamtEntry k v)
       , finger :: NodePtrPtr k v
       }
    -> NodeElem k v False
  Entry
    :: (Hashable k)
    => { visited :: TVar Bool
       , ekey :: k
       , entryValue :: v
       }
    -> NodeElem k v True

type HamtEntry k v = ListNode k v True

type AnyNode k v = Some (ListNode k v)

type NodePtr k v = TVar (AnyNode k v)

type NodePtrPtr k v = TVar (NodePtr k v)

data Discard m v = Refresh (m ()) | Invalid (m v)

data Cache m k v = (Hashable k, MonadIO m) => Cache (ListNode k v False) (CacheConfig m k v)

data CacheConfig m k v = CacheConfig
  { maxSize :: STM Int
  , prepareKey :: k -> k
  -- ^ Prepare a key for storage, for example by copying a slice.
  -- Must preserve equality and hashing. Evaluated only on insertion.
  , load :: k -> m v
  , requestListener :: Bool -> m ()
  , evictionListener :: k -> v -> m ()
  , validator :: m (k -> v -> Maybe (Discard m v))
  }

alwaysValid :: (Applicative m) => m (k -> v -> Maybe (Discard m v))
alwaysValid = pure (const . const Nothing)

cacheIO :: (Hashable k, MonadIO m) => CacheConfig m k v -> IO (Cache m k v)
cacheIO = atomically . cache

cache :: (Hashable k, MonadIO m) => CacheConfig m k v -> STM (Cache m k v)
cache cacheConfig = mdo
  tail <- newTVar (Some head)
  entries <- SH.new
  finger <- newTVar tail
  head <- ListNode tail <$> newTVar tail <*> pure Head{..}
  pure $ Cache head cacheConfig

cached :: Cache m k v -> k -> m v
cached (Cache head@ListNode{prevNextPtrPtr = neck, elem = Head{..}} CacheConfig{..}) k = do
  checkValid <- validator
  tryMaybe
    -- Fast path: lookup value, update stats and return the value if found and valid
    ((liftIO . atomically) (lookup checkValid) >>= notify (requestListener . isJust) >>= validate)
    -- Slow path: load/calculate value and insert it (if still not found)
    ( do
        value <- load k
        whileM (not <$> tryInsert value)
        pure value
    )
  where
    tryMaybe f notFound = f >>= maybe notFound pure

    notify = ((<$) <*>)

    validate =
      fmap join
        . traverse
          ( \case
              -- valid value
              (Right v) -> pure $ Just v
              -- refresh value
              (Left (Refresh act)) -> act $> Nothing
              -- discard value and return alt result
              (Left (Invalid res)) -> Just <$> res
          )

    lookup checkValid = SH.focus focus (ekey . elem) k entries
      where
        focus =
          F.Focus
            -- not found
            (pure (Nothing, F.Leave))
            -- found
            -- check entry validity
            ( \e@ListNode{elem = Entry{visited, entryValue}} ->
                maybe
                  -- entry valid
                  (mark visited True $> (Just $ Right entryValue, F.Leave))
                  -- entry invalid
                  -- remove it
                  ((removeEntry e $>) . (,F.Remove) . Just . Left)
                  (checkValid k entryValue)
            )

    mark t b = whenM ((/= b) <$> readTVar t) (writeTVar t b)

    -- perform a single entry eviction and possibly insertion atomically
    -- returning False if could not insert
    -- (either because entry currently pointed by the finger was visited
    --  or because after this entry eviction the cache is still full)
    -- so that other threads don't have to wait when visiting entries.
    -- First check if entry is still not in the cache - this time inside transaction.
    --
    -- Execute evictionListener if an entry was evicted
    tryInsert value = do
      (result, evicted) <- liftIO . atomically $ do
        -- Use SH.focus to performa a single lookup instead of 2
        -- we cannot modify Hamt from inside focus
        -- so if there is any entry to remove
        -- we need to delete it after
        (res, evictedKey) <- SH.focus focus (ekey . elem) k entries
        case evictedKey of
          (Just Entry{ekey = entryKey, entryValue}) -> do
            SH.focus F.delete (ekey . elem) entryKey entries
            pure (res, evictionListener entryKey entryValue)
          Nothing -> pure (res, pure ())

      evicted $> result
      where
        focus =
          F.Focus
            ( do
                (hasSpace, evictedKey) <- evictionStep
                if hasSpace then do
                  entry <- newLinkedEntry value
                  -- done, maybe evicted, insert entry
                  pure ((True, evictedKey), F.Set entry)
                else
                  -- not done, maybe evicted, don't modify entries
                  pure ((False, evictedKey), F.Leave)
            )
            -- Entry found case
            ( \ListNode{elem = Entry{visited}} -> do
                -- mark as visited
                mark visited True
                -- done, no evictions, don't modify entries
                pure ((True, Nothing), F.Leave)
            )

    -- if the cache is full precoesses a single node
    -- removing it if it is marked as unvisited
    -- or clearing visited mark
    -- returns True if there is space in the cache
    -- puts evictionListener in state if an entry was evicted
    evictionStep = do
      currDiff <- liftA2 (-) (SH.size entries) (max 1 <$> maxSize)
      if currDiff >= 0 then do
        -- no space in the cache
        -- need to evict an entry
        (nextFinger, evictedKey) <- readTVar finger >>= evict
        writeTVar finger nextFinger
        -- return if enough space and evicted key if any
        pure (isJust evictedKey && currDiff == 0, evictedKey)
      else
        -- there is space in the cache
        pure (True, Nothing)

    evict :: TVar (Some (ListNode k v)) -> STM (NodePtr k v, Maybe (NodeElem k v True))
    evict =
      readTVar >=> \case
        (Some e@ListNode{nextPtr, prevNextPtrPtr, elem = elem@Entry{visited}}) -> do
          ifM
            (readTVar visited)
            (writeTVar visited False $> (nextPtr, Nothing))
            (unlinkEntry e *> fmap (,Just elem) (readTVar prevNextPtrPtr))
        -- skip head
        (Some ListNode{nextPtr, elem = Head{}}) -> evict nextPtr

    unlinkEntry :: HamtEntry k v -> STM ()
    unlinkEntry (ListNode{nextPtr, prevNextPtrPtr = currPrev}) = do
      nextEntry <- readTVar nextPtr
      withSome nextEntry $ \e -> do
        prevNextPtr <- readTVar currPrev
        writeTVar (prevNextPtrPtr e) prevNextPtr
        writeTVar prevNextPtr nextEntry

    newLinkedEntry v = do
      let !storedKey = prepareKey k
      oldNeckNextPtr <- readTVar neck
      newNeckNextPtr <- newTVar (Some head)
      newNeck <-
        ListNode newNeckNextPtr
          <$> newTVar oldNeckNextPtr
          <*> (Entry <$> newTVar False <*> pure storedKey <*> pure v)
      -- update pointers
      writeTVar oldNeckNextPtr (Some newNeck)
      writeTVar neck newNeckNextPtr
      -- return HAMT entry
      pure newNeck

    removeEntry = fmap (*>) unlinkEntry <*> adjustFinger

    adjustFinger ListNode{nextPtr, prevNextPtrPtr} =
      whenM ((nextPtr ==) <$> readTVar finger) $
        readTVar prevNextPtrPtr >>= writeTVar finger
