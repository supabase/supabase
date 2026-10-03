module Feature.Query.RawOutputTypesSpec where

import Network.HTTP.Types
import Protolude
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig baseCfg $ describe "When raw-media-types config variable is missing or left empty" $ do
  let
    firefoxAcceptHdrs = acceptHdrs "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    chromeAcceptHdrs = acceptHdrs "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3"
  it "responds json to a GET request with Firefox Accept headers" $
    request methodGet "/items?id=eq.1" firefoxAcceptHdrs ""
      `shouldRespondWith` [json| [{"id":1}] |]
        { matchHeaders = ["Content-Type" <:> "application/json; charset=utf-8"]
        }
  it "responds json to a GET request with Chrome Accept headers" $
    request methodGet "/items?id=eq.1" chromeAcceptHdrs ""
      `shouldRespondWith` [json| [{"id":1}] |]
        { matchHeaders = ["Content-Type" <:> "application/json; charset=utf-8"]
        }

  it "responds json to a GET request to RPC with Firefox Accept headers" $
    request methodGet "/rpc/get_projects_below?id=3" firefoxAcceptHdrs ""
      `shouldRespondWith` [json|[{"id":1,"name":"Windows 7","client_id":1}, {"id":2,"name":"Windows 10","client_id":1}]|]
        { matchHeaders = ["Content-Type" <:> "application/json; charset=utf-8"]
        }
  it "responds json to a GET request to RPC with Chrome Accept headers" $
    request methodGet "/rpc/get_projects_below?id=3" chromeAcceptHdrs ""
      `shouldRespondWith` [json|[{"id":1,"name":"Windows 7","client_id":1}, {"id":2,"name":"Windows 10","client_id":1}]|]
        { matchHeaders = ["Content-Type" <:> "application/json; charset=utf-8"]
        }
