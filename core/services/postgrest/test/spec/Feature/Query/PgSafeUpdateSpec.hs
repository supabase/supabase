module Feature.Query.PgSafeUpdateSpec where

import Network.HTTP.Types
import Protolude hiding (get, put)
import Test.Hspec hiding (pendingWith)
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import PostgREST.Catalog.Identifiers (QualifiedIdentifier (..))
import PostgREST.Config (AppConfig (..))
import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig (baseCfg{configDbPreRequest = Just $ QualifiedIdentifier "test" "load_safeupdate"}) $
  describe "Enabling pg-safeupdate" $ do
    context "Full table update" $ do
      it "does not update and throws error if no condition is present" $
        request
          methodPatch
          "/safe_update_items"
          [("Prefer", "count=exact")]
          [json| {"name": "New name"} |]
          `shouldRespondWith` [json|{
              "code": "21000",
              "details": null,
              "hint": null,
              "message": "UPDATE requires a WHERE clause"
            }|]
            { matchStatus = 400
            }

      it "allows full table update if a filter is present" $
        request methodPatch "/safe_update_items?id=gt.0" mempty [json| {"name": "updated-item"} |]
          `shouldRespondWith` 204

    context "Full table delete" $ do
      it "does not delete and throws error if no condition is present" $
        request methodDelete "/safe_delete_items" [] mempty
          `shouldRespondWith` [json|{
              "code": "21000",
              "details": null,
              "hint": null,
              "message": "DELETE requires a WHERE clause"
            }|]
            { matchStatus = 400
            }

      it "allows full table delete if a filter is present" $
        request methodDelete "/safe_delete_items?id=gt.0" mempty mempty
          `shouldRespondWith` 204

disabledSpec :: SpecWithConfig
disabledSpec withConfig = withConfig baseCfg $
  describe "Disabling pg-safeupdate" $ do
    context "Full table update" $ do
      it "works if no condition is present" $
        request methodPatch "/unsafe_update_items" mempty [json| {"name": "updated-item"} |]
          `shouldRespondWith` 204

    context "Full table delete" $ do
      it "works if no condition is present" $
        request methodDelete "/unsafe_delete_items" mempty mempty
          `shouldRespondWith` 204
