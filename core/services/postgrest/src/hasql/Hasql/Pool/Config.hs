-- | DSL for construction of configs.
module Hasql.Pool.Config
  ( Config.Config
  , settings
  , Setting.Setting
  , Setting.size
  , Setting.acquisitionTimeout
  , Setting.agingTimeout
  , Setting.idlenessTimeout
  , Setting.staticConnectionSettings
  , Setting.dynamicConnectionSettings
  , Setting.observationHandler
  , Setting.initSession
  )
where

import Hasql.Pool.Prelude

import Hasql.Pool.Config.Config qualified as Config
import Hasql.Pool.Config.Setting qualified as Setting

-- | Compile config from a list of settings.
-- Latter settings override the preceding in cases of conflicts.
settings :: [Setting.Setting] -> Config.Config
settings =
  foldr Setting.apply Config.defaults
