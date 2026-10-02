module PostgREST.Network
  ( resolveSocketToAddress
  , escapeHostName
  , isSpecialHostName
  )
where

import Data.String (IsString (..))
import Protolude

import Network.Socket qualified as NS

-- | Resolves the socket to an address depending on the socket type. The Show
--   instance of the socket types automatically resolves it to the correct
--   address. Example resolution:
-- -----------------------------------------------------
-- | IPv4         | IPv6             | Unix            |
-- -----------------------------------------------------
-- | 127.0.0.1:80 | [2001:db8::1]:80 | /tmp/pgrst.sock |
-- -----------------------------------------------------
resolveSocketToAddress :: NS.Socket -> IO Text
resolveSocketToAddress sock = do
  sn <- NS.getSocketName sock
  return $ fromString $ show sn

-- | When printing special addresses like !4 or *6, we use the following mapping.
--   These special addresses come from:
--     https://hackage.haskell.org/package/streaming-commons-0.2.3.0/docs/\
--     Data-Streaming-Network.html#t:HostPreference
-- TODO: "!6" should not be printed as "0.0.0.0" address.
escapeHostName :: Text -> Text
escapeHostName "*" = "0.0.0.0"
escapeHostName "*4" = "0.0.0.0"
escapeHostName "!4" = "0.0.0.0"
escapeHostName "*6" = "0.0.0.0"
escapeHostName "!6" = "0.0.0.0"
escapeHostName h = h

-- | Check if a hostname is special
isSpecialHostName :: Text -> Bool
isSpecialHostName "*" = True
isSpecialHostName "*4" = True
isSpecialHostName "!4" = True
isSpecialHostName "*6" = True
isSpecialHostName "!6" = True
isSpecialHostName _ = False
