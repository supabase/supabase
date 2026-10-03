module PostgREST.Response.Performance
  ( ServerTiming (..)
  , serverTimingHeader
  )
where

import Numeric (showFFloat)
import Protolude

import Data.ByteString.Char8 qualified as BS
import Network.HTTP.Types qualified as HTTP

-- $setup
-- >>> import Protolude

-- | ServerTiming represents the timing data for a request, in seconds.
data ServerTiming
  = ServerTiming
  { jwt :: Maybe Double
  , parse :: Maybe Double
  , plan :: Maybe Double
  , transaction :: Maybe Double
  , response :: Maybe Double
  }
  deriving (Show)

-- | Render the Server-Timing header from a ServerTimingData
-- The duration precision is milliseconds, per the docs
--
-- >>> serverTimingHeader ServerTiming { plan=Just 0.1, transaction=Just 0.2, response=Just 0.3, jwt=Just 0.4, parse=Just 0.5}
-- ("Server-Timing","jwt;dur=0.4, parse;dur=0.5, plan;dur=0.1, transaction;dur=0.2, response;dur=0.3")
serverTimingHeader :: ServerTiming -> HTTP.Header
serverTimingHeader timing =
  ("Server-Timing", renderTiming)
  where
    renderMetric metric = maybe "" (\dur -> BS.concat [metric, BS.pack $ ";dur=" <> showFFloat (Just 1) dur ""])
    renderTiming =
      BS.intercalate ", " $
        (\(k, v) -> renderMetric k (v timing))
          <$> [ ("jwt", jwt)
              , ("parse", parse)
              , ("plan", plan)
              , ("transaction", transaction)
              , ("response", response)
              ]
