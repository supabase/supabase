module Feature.Query.RelatedQueriesSpec where

import Network.HTTP.Types
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig baseCfg $ describe "related queries" $ do
  context "related orders" $ do
    it "works on a many-to-one relationship" $ do
      get "/projects?select=id,clients(name)&order=clients(name).nullsfirst"
        `shouldRespondWith` [json|[
          {"id":5,"clients":null},
          {"id":3,"clients":{"name":"Apple"}},
          {"id":4,"clients":{"name":"Apple"}},
          {"id":1,"clients":{"name":"Microsoft"}},
          {"id":2,"clients":{"name":"Microsoft"}} ]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }
      get "/projects?select=id,client:clients(name)&order=client(name).asc"
        `shouldRespondWith` [json|[
          {"id":3,"client":{"name":"Apple"}},
          {"id":4,"client":{"name":"Apple"}},
          {"id":1,"client":{"name":"Microsoft"}},
          {"id":2,"client":{"name":"Microsoft"}},
          {"id":5,"client":null} ]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }
      get "/videogames?select=id,computed_designers(id)&order=computed_designers(id).desc"
        `shouldRespondWith` [json|[
          {"id":3,"computed_designers":{"id":2}},
          {"id":4,"computed_designers":{"id":2}},
          {"id":1,"computed_designers":{"id":1}},
          {"id":2,"computed_designers":{"id":1}}
        ]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }

    it "works on a one-to-one relationship and jsonb column" $ do
      get "/trash?select=id,trash_details(id,jsonb_col)&order=trash_details(jsonb_col->key).asc"
        `shouldRespondWith` [json|[
          {"id":2,"trash_details":{"id":2,"jsonb_col":{"key": 6}}},
          {"id":3,"trash_details":{"id":3,"jsonb_col":{"key": 8}}},
          {"id":1,"trash_details":{"id":1,"jsonb_col":{"key": 10}}}
        ]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }
      get "/trash?select=id,trash_details(id,jsonb_col)&order=trash_details(jsonb_col->key).desc"
        `shouldRespondWith` [json|[
          {"id":1,"trash_details":{"id":1,"jsonb_col":{"key": 10}}},
          {"id":3,"trash_details":{"id":3,"jsonb_col":{"key": 8}}},
          {"id":2,"trash_details":{"id":2,"jsonb_col":{"key": 6}}}
        ]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }

    it "works on an embedded resource" $ do
      get "/users?select=name,tasks(id,name,projects(id,name))&tasks.order=projects(id).desc&limit=1"
        `shouldRespondWith` [json| [{
          "name":"Angela Martin",
          "tasks":[
            {"id": 3, "name":"Design w10","projects":{"id":2,"name":"Windows 10"}},
            {"id": 4, "name":"Code w10","projects":{"id":2,"name":"Windows 10"}},
            {"id": 1, "name":"Design w7","projects":{"id":1,"name":"Windows 7"}},
            {"id": 2, "name":"Code w7","projects":{"id":1,"name":"Windows 7"}}
          ]
        }]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }
      get "/users?select=name,tasks(id,name,projects(id,name))&tasks.order=projects(id).desc,name&limit=1"
        `shouldRespondWith` [json| [{
          "name":"Angela Martin",
          "tasks":[
            {"id": 4, "name":"Code w10","projects":{"id":2,"name":"Windows 10"}},
            {"id": 3, "name":"Design w10","projects":{"id":2,"name":"Windows 10"}},
            {"id": 2, "name":"Code w7","projects":{"id":1,"name":"Windows 7"}},
            {"id": 1, "name":"Design w7","projects":{"id":1,"name":"Windows 7"}}
          ]
        }]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }
      get "/users?select=name,tasks(id,name,projects(id,name))&tasks.order=projects(id).asc&limit=1"
        `shouldRespondWith` [json|[{
          "name":"Angela Martin",
          "tasks":[
            {"id":1,"name":"Design w7","projects":{"id":1,"name":"Windows 7"}},
            {"id":2,"name":"Code w7","projects":{"id":1,"name":"Windows 7"}},
            {"id":3,"name":"Design w10","projects":{"id":2,"name":"Windows 10"}},
            {"id":4,"name":"Code w10","projects":{"id":2,"name":"Windows 10"}}
          ]
        }]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }

    it "fails when is not a to-one relationship" $ do
      get "/clients?select=*,projects(*)&order=projects(id)"
        `shouldRespondWith` [json|{
          "code":"PGRST118",
          "details":"'clients' and 'projects' do not form a many-to-one or one-to-one relationship",
          "hint":null,
          "message":"A related order on 'projects' is not possible"
        }|]
          { matchStatus = 400
          , matchHeaders = [matchContentTypeJson]
          }
      get "/clients?select=*,pros:projects(*)&order=pros(id)"
        `shouldRespondWith` [json|{
          "code":"PGRST118",
          "details":"'clients' and 'pros' do not form a many-to-one or one-to-one relationship",
          "hint":null,
          "message":"A related order on 'pros' is not possible"
        }|]
          { matchStatus = 400
          , matchHeaders = [matchContentTypeJson]
          }
      get "/designers?select=id,computed_videogames(id)&order=computed_videogames(id).desc"
        `shouldRespondWith` [json|{
          "code":"PGRST118",
          "details":"'designers' and 'computed_videogames' do not form a many-to-one or one-to-one relationship",
          "hint":null,
          "message":"A related order on 'computed_videogames' is not possible"
        }|]
          { matchStatus = 400
          , matchHeaders = [matchContentTypeJson]
          }

    it "fails when the resource is not embedded" $
      get "/projects?select=id,clients(name)&order=clientsx(name).nullsfirst"
        `shouldRespondWith` [json|{
          "code":"PGRST108",
          "details":null,
          "hint":"Verify that 'clientsx' is included in the 'select' query parameter.",
          "message":"'clientsx' is not an embedded resource in this request"
        }|]
          { matchStatus = 400
          , matchHeaders = [matchContentTypeJson]
          }

  context "related conditions through null operator on embed" $ do
    it "works on a many-to-one relationship" $ do
      get "/projects?select=name,clients()&clients=not.is.null"
        `shouldRespondWith` [json|[
          {"name":"Windows 7"},
          {"name":"Windows 10"},
          {"name":"IOS"},
          {"name":"OSX"}
        ]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }
      get "/projects?select=name,clients()&clients=is.null"
        `shouldRespondWith` [json|[{"name":"Orphan"}]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }
      get "/projects?select=name,computed_clients()&computed_clients=is.null"
        `shouldRespondWith` [json|[{"name":"Orphan"}]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }

    it "works on a one-to-many relationship" $ do
      get "/entities?select=name,child_entities()&child_entities=not.is.null"
        `shouldRespondWith` [json|[
          {"name":"entity 1"},
          {"name":"entity 2"}
        ]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }
      get "/entities?select=name,child_entities()&child_entities=is.null"
        `shouldRespondWith` [json|[
          {"name":"entity 3"},
          {"name":null}
        ]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }
      get "/entities?select=name,childs:child_entities()&childs=is.null"
        `shouldRespondWith` [json|[
          {"name":"entity 3"},
          {"name":null}
        ]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }

    it "works on a many-to-many relationship" $ do
      get "/users?select=name,tasks()&tasks.id=eq.1&tasks=not.is.null"
        `shouldRespondWith` [json|[
          {"name":"Angela Martin"},
          {"name":"Dwight Schrute"}
        ]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }
      get "/users?select=name,tasks()&tasks.id=eq.1&tasks=is.null"
        `shouldRespondWith` [json|[
          {"name":"Michael Scott"}
        ]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }

    it "works on nested embeds" $ do
      get "/entities?select=name,child_entities(name,grandchild_entities())&child_entities.grandchild_entities=not.is.null&child_entities=not.is.null"
        `shouldRespondWith` [json|[
          {"name":"entity 1","child_entities":[{"name":"child entity 1"}, {"name":"child entity 2"}]}]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }

    it "can do an or across embeds" $
      get "/client?select=*,clientinfo(),contact()&clientinfo.other=ilike.*main*&contact.name=ilike.*tabby*&or=(clientinfo.not.is.null,contact.not.is.null)"
        `shouldRespondWith` [json|[
          {"id":1,"name":"Walmart"},
          {"id":2,"name":"Target"}
        ]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }

    it "doesn't interfere filtering when embedding using the column name" $
      get "/projects?select=name,client_id,client:client_id(name)&client_id=eq.2"
        `shouldRespondWith` [json|[
          {"name":"IOS","client_id":2,"client":{"name":"Apple"}},
          {"name":"OSX","client_id":2,"client":{"name":"Apple"}}
        ]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }

    it "doesn't interfere filtering on column names used for disambiguation" $
      get "/user_friend?select=*,user1(*)&user1=eq.a02fb934-3a4d-469b-a6b6-4fcd88b973cf"
        `shouldRespondWith` [json|[]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }

    it "doesn't interfere filtering on column names that are the same as the relation name" $
      get "/tournaments?select=*,status(*)&status=eq.3"
        `shouldRespondWith` [json|[]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }

    -- "?table=not.is.null" does a "table IS DISTINCT FROM NULL" instead of a "table IS NOT NULL"
    -- https://github.com/PostgREST/postgrest/issues/2800#issuecomment-1720315818
    it "embeds verifying that the entire target table row is not null" $ do
      get "/table_b?select=name,table_a(name)&table_a=not.is.null"
        `shouldRespondWith` [json|[
          {"name":"Test 1","table_a":{"name":"Not null 1"}},
          {"name":"Test 2","table_a":{"name":null}}
        ]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }
      get "/table_b?select=name,table_a()&table_a=is.null"
        `shouldRespondWith` [json|[
          {"name":"Test 3"}
        ]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }

    it "works with count=exact" $ do
      request
        methodGet
        "/projects?select=name,clients(name)&clients=not.is.null"
        [("Prefer", "count=exact")]
        ""
        `shouldRespondWith` [json|[
          {"name":"Windows 7", "clients":{"name":"Microsoft"}},
          {"name":"Windows 10", "clients":{"name":"Microsoft"}},
          {"name":"IOS", "clients":{"name":"Apple"}},
          {"name":"OSX", "clients":{"name":"Apple"}}
        ]|]
          { matchStatus = 200
          , matchHeaders =
              [ matchContentTypeJson
              , "Content-Range" <:> "0-3/4"
              ]
          }
      request
        methodGet
        "/projects?select=name,clients()&clients=is.null"
        [("Prefer", "count=exact")]
        ""
        `shouldRespondWith` [json|[{"name":"Orphan"}]|]
          { matchStatus = 200
          , matchHeaders =
              [ matchContentTypeJson
              , "Content-Range" <:> "0-0/1"
              ]
          }
      request
        methodGet
        "/client?select=*,clientinfo(),contact()&clientinfo.other=ilike.*main*&contact.name=ilike.*tabby*&or=(clientinfo.not.is.null,contact.not.is.null)"
        [("Prefer", "count=exact")]
        ""
        `shouldRespondWith` [json|[
          {"id":1,"name":"Walmart"},
          {"id":2,"name":"Target"}
        ]|]
          { matchStatus = 200
          , matchHeaders =
              [ matchContentTypeJson
              , "Content-Range" <:> "0-1/2"
              ]
          }

    it "works with count=planned" $ do
      request
        methodGet
        "/projects?select=name,clients(name)&clients=not.is.null"
        [("Prefer", "count=planned")]
        ""
        `shouldRespondWith` [json|[
          {"name":"Windows 7", "clients":{"name":"Microsoft"}},
          {"name":"Windows 10", "clients":{"name":"Microsoft"}},
          {"name":"IOS", "clients":{"name":"Apple"}},
          {"name":"OSX", "clients":{"name":"Apple"}}
        ]|]
          { matchStatus = 206
          , matchHeaders =
              [ matchContentTypeJson
              , "Content-Range" <:> "0-3/5"
              ]
          }
      request
        methodGet
        "/projects?select=name,clients()&clients=is.null"
        [("Prefer", "count=planned")]
        ""
        `shouldRespondWith` [json|[{"name":"Orphan"}]|]
          { matchStatus = 200
          , matchHeaders =
              [ matchContentTypeJson
              , "Content-Range" <:> "0-0/1"
              ]
          }
      request
        methodGet
        "/client?select=*,clientinfo(),contact()&clientinfo.other=ilike.*main*&contact.name=ilike.*tabby*&or=(clientinfo.not.is.null,contact.not.is.null)"
        [("Prefer", "count=planned")]
        ""
        `shouldRespondWith` [json|[
          {"id":1,"name":"Walmart"},
          {"id":2,"name":"Target"}
        ]|]
          { matchStatus = 200
          , matchHeaders =
              [ matchContentTypeJson
              , "Content-Range" <:> "0-1/2"
              ]
          }

    it "works with count=estimated" $ do
      request
        methodGet
        "/projects?select=name,clients(name)&clients=not.is.null"
        [("Prefer", "count=estimated")]
        ""
        `shouldRespondWith` [json|[
          {"name":"Windows 7", "clients":{"name":"Microsoft"}},
          {"name":"Windows 10", "clients":{"name":"Microsoft"}},
          {"name":"IOS", "clients":{"name":"Apple"}},
          {"name":"OSX", "clients":{"name":"Apple"}}
        ]|]
          { matchStatus = 206
          , matchHeaders =
              [ matchContentTypeJson
              , "Content-Range" <:> "0-3/5"
              ]
          }
      request
        methodGet
        "/projects?select=name,clients()&clients=is.null"
        [("Prefer", "count=estimated")]
        ""
        `shouldRespondWith` [json|[{"name":"Orphan"}]|]
          { matchStatus = 200
          , matchHeaders =
              [ matchContentTypeJson
              , "Content-Range" <:> "0-0/1"
              ]
          }
      request
        methodGet
        "/client?select=*,clientinfo(),contact()&clientinfo.other=ilike.*main*&contact.name=ilike.*tabby*&or=(clientinfo.not.is.null,contact.not.is.null)"
        [("Prefer", "count=estimated")]
        ""
        `shouldRespondWith` [json|[
          {"id":1,"name":"Walmart"},
          {"id":2,"name":"Target"}
        ]|]
          { matchStatus = 200
          , matchHeaders =
              [ matchContentTypeJson
              , "Content-Range" <:> "0-1/2"
              ]
          }
