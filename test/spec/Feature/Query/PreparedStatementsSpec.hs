module Feature.Query.PreparedStatementsSpec where

import Network.HTTP.Types
import Protolude hiding (get)
import Test.Hspec hiding (pendingWith)
import Test.Hspec.Wai
import Text.Heredoc

import PostgREST.Config (AppConfig (..))
import SpecHelper

spec :: SpecWithConfig
spec withConfig = do
  withConfig baseCfg{configDbPreparedStatements = True} $
    it "should use prepared statements when the setting is enabled" $
      request
        methodPost
        "/rpc/uses_prepared_statements"
        []
        ""
        `shouldRespondWith` [str|true|]
          { matchStatus = 200
          }

  withConfig baseCfg{configDbPreparedStatements = False} $
    it "should not use any prepared statements when the setting is disabled" $ do
      request
        methodGet
        "/never_prepared"
        []
        ""
        `shouldRespondWith` 200

      request
        methodPost
        "/rpc/never_uses_prepared_statements"
        []
        ""
        `shouldRespondWith` [str|true|]
          { matchStatus = 200
          }
