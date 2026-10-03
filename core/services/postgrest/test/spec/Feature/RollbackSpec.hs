module Feature.RollbackSpec where

import Network.HTTP.Types
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import PostgREST.Config (AppConfig (..))
import SpecHelper

-- two helpers functions to make sure that each test can setup and cleanup properly

-- creates Item to work with for PATCH and DELETE
postItem =
  request
    methodPost
    "/items"
    [("Prefer", "tx=commit"), ("Prefer", "resolution=ignore-duplicates")]
    [json|{"id":0}|]
    `shouldRespondWith` ""
      { matchStatus = 201
      , matchHeaders =
          [ matchHeaderAbsent hContentType
          , "Content-Length" <:> "0"
          ]
      }

-- removes Items left over from POST, PUT, and PATCH
deleteItems =
  request
    methodDelete
    "/items?id=lte.0"
    [("Prefer", "tx=commit")]
    ""
    `shouldRespondWith` ""
      { matchStatus = 204
      , matchHeaders =
          [ matchHeaderAbsent hContentType
          , matchHeaderAbsent hContentLength
          ]
      }

preferDefault = [("Prefer", "return=representation")]

preferCommit = [("Prefer", "return=representation"), ("Prefer", "tx=commit")]

preferRollback = [("Prefer", "return=representation"), ("Prefer", "tx=rollback")]

withoutPreferenceApplied = []

withPreferenceCommitApplied = [matchHeaderValuePresent "Preference-Applied" "tx=commit"]

withPreferenceRollbackApplied = [matchHeaderValuePresent "Preference-Applied" "tx=rollback"]

shouldRespondToReads reqHeaders respHeaders = do
  it "responds to GET" $ do
    request
      methodGet
      "/items?id=eq.1"
      reqHeaders
      ""
      `shouldRespondWith` [json|[{"id":1}]|]
        { matchHeaders = respHeaders
        }

  it "responds to HEAD" $ do
    request
      methodHead
      "/items?id=eq.1"
      reqHeaders
      ""
      `shouldRespondWith` ""
        { matchHeaders = matchContentTypeJson : respHeaders
        }

  it "responds to GET on RPC" $ do
    request
      methodGet
      "/rpc/search?id=1"
      reqHeaders
      ""
      `shouldRespondWith` [json|[{"id":1}]|]
        { matchHeaders = respHeaders
        }

  it "responds to POST on RPC" $ do
    request
      methodPost
      "/rpc/search"
      reqHeaders
      [json|{"id":1}|]
      `shouldRespondWith` [json|[{"id":1}]|]
        { matchHeaders = respHeaders
        }

shouldRaiseExceptions reqHeaders respHeaders = do
  it "raises immediate constraints" $ do
    request
      methodPost
      "/rpc/raise_constraint"
      reqHeaders
      ""
      `shouldRespondWith` [json|{
          "hint":null,
          "details":"Key (col)=(1) already exists.",
          "code":"23505",
          "message":"duplicate key value violates unique constraint \"deferrable_unique_constraint_col_key\""
        }|]
        { matchStatus = 409
        , matchHeaders = respHeaders
        }

  it "raises deferred constraints" $ do
    request
      methodPost
      "/rpc/raise_constraint"
      reqHeaders
      [json|{"deferred": true}|]
      `shouldRespondWith` [json|{
          "hint":null,
          "details":"Key (col)=(1) already exists.",
          "code":"23505",
          "message":"duplicate key value violates unique constraint \"deferrable_unique_constraint_col_key\""
        }|]
        { matchStatus = 409
        , matchHeaders = respHeaders
        }

shouldPersistMutations reqHeaders respHeaders = do
  it "does persist post" $ do
    request
      methodPost
      "/items"
      reqHeaders
      [json|{"id":0}|]
      `shouldRespondWith` [json|[{"id":0}]|]
        { matchStatus = 201
        , matchHeaders = respHeaders
        }
    get "/items?id=eq.0"
      `shouldRespondWith` [json|[{"id":0}]|]
    deleteItems

  it "does persist put" $ do
    request
      methodPut
      "/items?id=eq.0"
      reqHeaders
      [json|{"id":0}|]
      `shouldRespondWith` [json|[{"id":0}]|]
        { matchStatus = 201
        , matchHeaders = respHeaders
        }
    get "/items?id=eq.0"
      `shouldRespondWith` [json|[{"id":0}]|]
    deleteItems

  it "does persist patch" $ do
    postItem
    request
      methodPatch
      "/items?id=eq.0"
      reqHeaders
      [json|{"id":-1}|]
      `shouldRespondWith` [json|[{"id":-1}]|]
        { matchHeaders = respHeaders
        }
    get "/items?id=eq.0"
      `shouldRespondWith` [json|[]|]
    get "/items?id=eq.-1"
      `shouldRespondWith` [json|[{"id":-1}]|]
    deleteItems

  it "does persist delete" $ do
    postItem
    request
      methodDelete
      "/items?id=eq.0"
      reqHeaders
      ""
      `shouldRespondWith` [json|[{"id":0}]|]
        { matchHeaders = respHeaders
        }
    get "/items?id=eq.0"
      `shouldRespondWith` [json|[]|]

shouldNotPersistMutations reqHeaders respHeaders = do
  it "does not persist post" $ do
    request
      methodPost
      "/items"
      reqHeaders
      [json|{"id":0}|]
      `shouldRespondWith` [json|[{"id":0}]|]
        { matchStatus = 201
        , matchHeaders = respHeaders
        }
    get "/items?id=eq.0"
      `shouldRespondWith` [json|[]|]

  it "does not persist put" $ do
    request
      methodPut
      "/items?id=eq.0"
      reqHeaders
      [json|{"id":0}|]
      `shouldRespondWith` [json|[{"id":0}]|]
        { matchStatus = 201
        , matchHeaders = respHeaders
        }
    get "/items?id=eq.0"
      `shouldRespondWith` [json|[]|]

  it "does not persist patch" $ do
    request
      methodPatch
      "/items?id=eq.1"
      reqHeaders
      [json|{"id":0}|]
      `shouldRespondWith` [json|[{"id":0}]|]
        { matchHeaders = respHeaders
        }
    get "/items?id=eq.0"
      `shouldRespondWith` [json|[]|]
    get "items?id=eq.1"
      `shouldRespondWith` [json|[{"id":1}]|]

  it "does not persist delete" $ do
    request
      methodDelete
      "/items?id=eq.1"
      reqHeaders
      ""
      `shouldRespondWith` [json|[{"id":1}]|]
        { matchHeaders = respHeaders
        }
    get "/items?id=eq.1"
      `shouldRespondWith` [json|[{"id":1}]|]

allowed :: SpecWithConfig
allowed withConfig = withConfig baseCfg $ describe "tx-allow-override = true" $ do
  describe "without Prefer tx" $ do
    preferDefault `shouldRespondToReads` withoutPreferenceApplied
    preferDefault `shouldNotPersistMutations` withoutPreferenceApplied
    preferDefault `shouldRaiseExceptions` withoutPreferenceApplied

  describe "Prefer tx=commit" $ do
    preferCommit `shouldRespondToReads` withPreferenceCommitApplied
    preferCommit `shouldPersistMutations` withPreferenceCommitApplied
    -- Exceptions are always without preference applied,
    -- because they return before the end of the transaction.
    preferCommit `shouldRaiseExceptions` withoutPreferenceApplied

  describe "Prefer tx=rollback" $ do
    preferRollback `shouldRespondToReads` withPreferenceRollbackApplied
    preferRollback `shouldNotPersistMutations` withPreferenceRollbackApplied
    -- Exceptions are always without preference applied,
    -- because they return before the end of the transaction.
    preferRollback `shouldRaiseExceptions` withoutPreferenceApplied

disallowed :: SpecWithConfig
disallowed withConfig = withConfig
  ( baseCfg
      { configDbTxAllowOverride = False
      , configDbTxRollbackAll = False
      }
  )
  $ describe "tx-rollback-all = false, tx-allow-override = false"
  $ do
    describe "without Prefer tx" $ do
      preferDefault `shouldRespondToReads` withoutPreferenceApplied
      preferDefault `shouldPersistMutations` withoutPreferenceApplied
      preferDefault `shouldRaiseExceptions` withoutPreferenceApplied

    describe "Prefer tx=commit" $ do
      preferCommit `shouldRespondToReads` withoutPreferenceApplied
      preferCommit `shouldPersistMutations` withoutPreferenceApplied
      preferCommit `shouldRaiseExceptions` withoutPreferenceApplied

    describe "Prefer tx=rollback" $ do
      preferRollback `shouldRespondToReads` withoutPreferenceApplied
      preferRollback `shouldPersistMutations` withoutPreferenceApplied
      preferRollback `shouldRaiseExceptions` withoutPreferenceApplied

forced :: SpecWithConfig
forced withConfig = withConfig
  ( baseCfg
      { configDbTxAllowOverride = False
      , configDbTxRollbackAll = True
      }
  )
  $ describe "tx-rollback-all = true, tx-allow-override = false"
  $ do
    describe "without Prefer tx" $ do
      preferDefault `shouldRespondToReads` withoutPreferenceApplied
      preferDefault `shouldNotPersistMutations` withoutPreferenceApplied
      preferDefault `shouldRaiseExceptions` withoutPreferenceApplied

    describe "Prefer tx=commit" $ do
      preferCommit `shouldRespondToReads` withoutPreferenceApplied
      preferCommit `shouldNotPersistMutations` withoutPreferenceApplied
      preferCommit `shouldRaiseExceptions` withoutPreferenceApplied

    describe "Prefer tx=rollback" $ do
      preferRollback `shouldRespondToReads` withoutPreferenceApplied
      preferRollback `shouldNotPersistMutations` withoutPreferenceApplied
      preferRollback `shouldRaiseExceptions` withoutPreferenceApplied
