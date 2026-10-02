module Feature.Query.Preferences.TimezoneSpec where

import Network.HTTP.Types
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig baseCfg $ do
  context "test Prefer: timezone=America/Los_Angeles" $ do
    it "should change timezone with handling=strict" $
      request
        methodGet
        "/timestamps"
        [("Prefer", "handling=strict, timezone=America/Los_Angeles")]
        ""
        `shouldRespondWith` [json|[{"t":"2023-10-18T05:37:59.611-07:00"}, {"t":"2023-10-18T07:37:59.611-07:00"}, {"t":"2023-10-18T09:37:59.611-07:00"}]|]
          { matchStatus = 200
          , matchHeaders =
              [ matchContentTypeJson
              , "Preference-Applied" <:> "handling=strict, timezone=America/Los_Angeles"
              ]
          }

    it "should change timezone without handling=strict" $
      request
        methodGet
        "/timestamps"
        [("Prefer", "timezone=America/Los_Angeles")]
        ""
        `shouldRespondWith` [json|[{"t":"2023-10-18T05:37:59.611-07:00"}, {"t":"2023-10-18T07:37:59.611-07:00"}, {"t":"2023-10-18T09:37:59.611-07:00"}]|]
          { matchStatus = 200
          , matchHeaders =
              [ matchContentTypeJson
              , "Preference-Applied" <:> "timezone=America/Los_Angeles"
              ]
          }

  context "test Prefer: timezone=Invalid/Timezone" $ do
    it "should throw error without handling" $
      request
        methodGet
        "/timestamps"
        [("Prefer", "timezone=Invalid/Timezone")]
        ""
        `shouldRespondWith` [json|{"code":"22023","details":null,"hint":null,"message":"invalid value for parameter \"TimeZone\": \"Invalid/Timezone\""}|]
          { matchStatus = 400
          }

    it "should throw error with handling=strict" $
      request
        methodGet
        "/timestamps"
        [("Prefer", "handling=strict, timezone=Invalid/Timezone")]
        ""
        `shouldRespondWith` [json|{"code":"22023","details":null,"hint":null,"message":"invalid value for parameter \"TimeZone\": \"Invalid/Timezone\""}|]
          { matchStatus = 400
          }

    it "should throw error with handling=lenient" $
      request
        methodGet
        "/timestamps"
        [("Prefer", "handling=lenient, timezone=Invalid/Timezone")]
        ""
        `shouldRespondWith` [json|{"code":"22023","details":null,"hint":null,"message":"invalid value for parameter \"TimeZone\": \"Invalid/Timezone\""}|]
          { matchStatus = 400
          }

  context "test Prefer: timezone offsets" $ do
    it "should change with positive offset" $
      request
        methodGet
        "/timestamps"
        [("Prefer", "timezone=+05:30")]
        ""
        `shouldRespondWith` [json|[{"t":"2023-10-18T07:07:59.611-05:30"}, {"t":"2023-10-18T09:07:59.611-05:30"}, {"t":"2023-10-18T11:07:59.611-05:30"}]|]
          { matchStatus = 200
          , matchHeaders =
              [ matchContentTypeJson
              , "Preference-Applied" <:> "timezone=+05:30"
              ]
          }

    it "should change with negative offset" $
      request
        methodGet
        "/timestamps"
        [("Prefer", "timezone=-4")]
        ""
        `shouldRespondWith` [json|[{"t":"2023-10-18T08:37:59.611-04:00"}, {"t":"2023-10-18T10:37:59.611-04:00"}, {"t":"2023-10-18T12:37:59.611-04:00"}]|]
          { matchStatus = 200
          , matchHeaders =
              [ matchContentTypeJson
              , "Preference-Applied" <:> "timezone=-4"
              ]
          }

    it "fails on leap seconds" $
      request
        methodGet
        "/timestamps"
        [("Prefer", "timezone=05:30:15")]
        ""
        `shouldRespondWith` [json|{"code":"22023","details":"PostgreSQL does not support leap seconds.","hint":null,"message":"time zone \"05:30:15\" appears to use leap seconds"}|]
          { matchStatus = 400
          }
