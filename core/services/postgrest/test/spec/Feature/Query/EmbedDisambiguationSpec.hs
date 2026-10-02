module Feature.Query.EmbedDisambiguationSpec where

import Protolude hiding (get)
import Test.Hspec hiding (pendingWith)
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig baseCfg $
  describe "resource embedding disambiguation" $ do
    context "ambiguous requests that give 300 Multiple Choices" $ do
      it "errs when there are o2m and m2m cardinalities to the target table" $
        get "/sites?select=*,big_projects(*)"
          `shouldRespondWith` [json|
            {
              "details": [
                {
                  "cardinality": "many-to-one",
                  "relationship": "main_project using sites(main_project_id) and big_projects(big_project_id)",
                  "embedding": "sites with big_projects"
                },
                {
                  "cardinality": "many-to-many",
                  "relationship": "jobs using jobs_site_id_fkey(site_id) and jobs_big_project_id_fkey(big_project_id)",
                  "embedding": "sites with big_projects"
                },
                {
                  "cardinality": "many-to-many",
                  "relationship": "main_jobs using jobs_site_id_fkey(site_id) and jobs_big_project_id_fkey(big_project_id)",
                  "embedding": "sites with big_projects"
                }
              ],
              "hint": "Try changing 'big_projects' to one of the following: 'big_projects!main_project', 'big_projects!jobs', 'big_projects!main_jobs'. Find the desired relationship in the 'details' key.",
              "message": "Could not embed because more than one relationship was found for 'sites' and 'big_projects'",
              "code": "PGRST201"
            }
          |]
            { matchStatus = 300
            , matchHeaders =
                [ matchContentTypeJson
                , "Content-Length" <:> "828"
                ]
            }

      it "errs on an ambiguous embed that has a circular reference" $
        get "/agents?select=*,departments(*)"
          `shouldRespondWith` [json|
            {
              "details": [
                {
                    "cardinality": "one-to-many",
                    "relationship": "departments_head_id_fkey using agents(id) and departments(head_id)",
                    "embedding": "agents with departments"
                },
                {
                    "cardinality": "many-to-one",
                    "relationship": "agents_department_id_fkey using agents(department_id) and departments(id)",
                    "embedding": "agents with departments"
                }
              ],
              "hint": "Try changing 'departments' to one of the following: 'departments!departments_head_id_fkey', 'departments!agents_department_id_fkey'. Find the desired relationship in the 'details' key.",
              "message": "Could not embed because more than one relationship was found for 'agents' and 'departments'",
              "code": "PGRST201"
            }
           |]
            { matchStatus = 300
            , matchHeaders = [matchContentTypeJson]
            }

      it "errs when there are more than two fks on a junction table but it can be disambiguated with spread embeds" $ do
        -- We have 4 possibilities for doing the junction JOIN here.
        get "/whatev_sites?select=*,whatev_projects(*)"
          `shouldRespondWith` [json|
            {
              "details": [
                {
                  "cardinality": "many-to-many",
                  "relationship": "whatev_jobs using whatev_jobs_site_id_1_fkey(site_id_1) and whatev_jobs_project_id_1_fkey(project_id_1)",
                  "embedding": "whatev_sites with whatev_projects"
                },
                {
                  "cardinality": "many-to-many",
                  "relationship": "whatev_jobs using whatev_jobs_site_id_1_fkey(site_id_1) and whatev_jobs_project_id_2_fkey(project_id_2)",
                  "embedding": "whatev_sites with whatev_projects"
                },
                {
                  "cardinality": "many-to-many",
                  "relationship": "whatev_jobs using whatev_jobs_site_id_2_fkey(site_id_2) and whatev_jobs_project_id_1_fkey(project_id_1)",
                  "embedding": "whatev_sites with whatev_projects"
                },
                {
                  "cardinality": "many-to-many",
                  "relationship": "whatev_jobs using whatev_jobs_site_id_2_fkey(site_id_2) and whatev_jobs_project_id_2_fkey(project_id_2)",
                  "embedding": "whatev_sites with whatev_projects"
                }
              ],
              "hint": "Try changing 'whatev_projects' to one of the following: 'whatev_projects!whatev_jobs', 'whatev_projects!whatev_jobs', 'whatev_projects!whatev_jobs', 'whatev_projects!whatev_jobs'. Find the desired relationship in the 'details' key.",
              "message": "Could not embed because more than one relationship was found for 'whatev_sites' and 'whatev_projects'",
              "code": "PGRST201"
            }
          |]
            { matchStatus = 300
            , matchHeaders = [matchContentTypeJson]
            }
        -- Each of those 4 possibilities can be done with spread embeds, by following the details in the error above
        get "/whatev_sites?select=*,whatev_jobs!site_id_1(...whatev_projects!project_id_1(*))" `shouldRespondWith` [json|[]|]
        get "/whatev_sites?select=*,whatev_jobs!site_id_1(...whatev_projects!project_id_2(*))" `shouldRespondWith` [json|[]|]
        get "/whatev_sites?select=*,whatev_jobs!site_id_2(...whatev_projects!project_id_1(*))" `shouldRespondWith` [json|[]|]
        get "/whatev_sites?select=*,whatev_jobs!site_id_2(...whatev_projects!project_id_2(*))" `shouldRespondWith` [json|[]|]

      it "can disambiguate a recursive m2m with spread embeds" $ do
        get "/posters?select=*,subscribers:subscriptions!subscribed(...posters!subscriber(*))&limit=1"
          `shouldRespondWith` [json| [ {"id":1,"name":"Mark","subscribers":[{"id":3,"name":"Bill"}, {"id":4,"name":"Jeff"}]}]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
        get "/posters?select=*,subscriptions!subscriber(...posters!subscribed(*))&limit=1"
          `shouldRespondWith` [json| [{"id":1,"name":"Mark","subscriptions":[{"id":2,"name":"Elon"}]}]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }

      it "errs on an ambiguous embed that has two one-to-one relationships" $
        get "/first?select=second(*)"
          `shouldRespondWith` [json| {
            "code":"PGRST201",
            "details":[
              {"cardinality":"one-to-one","embedding":"first with second","relationship":"first_second_id_1_fkey using first(second_id_1) and second(id)"},
              {"cardinality":"one-to-one","embedding":"first with second","relationship":"first_second_id_2_fkey using first(second_id_2) and second(id)"}
            ],
            "hint":"Try changing 'second' to one of the following: 'second!first_second_id_1_fkey', 'second!first_second_id_2_fkey'. Find the desired relationship in the 'details' key.","message":"Could not embed because more than one relationship was found for 'first' and 'second'"
            }|]
            { matchStatus = 300
            , matchHeaders = [matchContentTypeJson]
            }

      it "errs with multiple references to the same composite key columns in a view" $
        get "/i2459_composite_v2?select=*,i2459_composite_v1(*)"
          `shouldRespondWith` [json|
            {
              "code": "PGRST201",
              "details": [
                {
                  "cardinality": "many-to-one",
                  "embedding": "i2459_composite_v2 with i2459_composite_v1",
                  "relationship": "i2459_composite_t2_t1_a_t1_b_fkey using i2459_composite_v2(t1_a1, t1_b1) and i2459_composite_v1(a, b)"
                },
                {
                  "cardinality": "many-to-one",
                  "embedding": "i2459_composite_v2 with i2459_composite_v1",
                  "relationship": "i2459_composite_t2_t1_a_t1_b_fkey using i2459_composite_v2(t1_a1, t1_b2) and i2459_composite_v1(a, b)"
                },
                {
                  "cardinality": "many-to-one",
                  "embedding": "i2459_composite_v2 with i2459_composite_v1",
                  "relationship": "i2459_composite_t2_t1_a_t1_b_fkey using i2459_composite_v2(t1_a2, t1_b1) and i2459_composite_v1(a, b)"
                },
                {
                  "cardinality": "many-to-one",
                  "embedding": "i2459_composite_v2 with i2459_composite_v1",
                  "relationship": "i2459_composite_t2_t1_a_t1_b_fkey using i2459_composite_v2(t1_a2, t1_b2) and i2459_composite_v1(a, b)"
                }
              ],
              "hint": "Try changing 'i2459_composite_v1' to one of the following: 'i2459_composite_v1!i2459_composite_t2_t1_a_t1_b_fkey', 'i2459_composite_v1!i2459_composite_t2_t1_a_t1_b_fkey', 'i2459_composite_v1!i2459_composite_t2_t1_a_t1_b_fkey', 'i2459_composite_v1!i2459_composite_t2_t1_a_t1_b_fkey'. Find the desired relationship in the 'details' key.",
              "message": "Could not embed because more than one relationship was found for 'i2459_composite_v2' and 'i2459_composite_v1'"
            }
          |]
            { matchStatus = 300
            , matchHeaders = [matchContentTypeJson]
            }

    context "disambiguating requests with embed hints" $ do
      context "using FK to specify the relationship" $ do
        it "can embed by FK name" $
          get "/projects?id=in.(1,3)&select=id,name,client(id,name)"
            `shouldRespondWith` [json|[{"id":1,"name":"Windows 7","client":{"id":1,"name":"Microsoft"}},{"id":3,"name":"IOS","client":{"id":2,"name":"Apple"}}]|]
              { matchHeaders = [matchContentTypeJson]
              }

        it "can embed by FK name and select the FK column at the same time" $
          get "/projects?id=in.(1,3)&select=id,name,client_id,client(id,name)"
            `shouldRespondWith` [json|[{"id":1,"name":"Windows 7","client_id":1,"client":{"id":1,"name":"Microsoft"}},{"id":3,"name":"IOS","client_id":2,"client":{"id":2,"name":"Apple"}}]|]
              { matchHeaders = [matchContentTypeJson]
              }

        it "can embed parent with view!fk and grandparent by using fk" $
          get "/tasks?id=eq.1&select=id,name,projects_view!project(id,name,client(id,name))"
            `shouldRespondWith` [json|[{"id":1,"name":"Design w7","projects_view":{"id":1,"name":"Windows 7","client":{"id":1,"name":"Microsoft"}}}]|]

        it "can embed by using a composite FK name" $
          get "/unit_workdays?select=unit_id,day,fst_shift(car_id,schedule(name)),snd_shift(camera_id,schedule(name))"
            `shouldRespondWith` [json| [
              {
                "day": "2019-12-02",
                "fst_shift": {
                    "car_id": "CAR-349",
                    "schedule": {
                        "name": "morning"
                    }
                },
                "snd_shift": {
                    "camera_id": "CAM-123",
                    "schedule": {
                        "name": "night"
                    }
                },
                "unit_id": 1
              }
            ] |]
              { matchHeaders = [matchContentTypeJson]
              }

        it "embeds by using two fks pointing to the same table" $
          get "/orders?id=eq.1&select=id, name, billing(address), shipping(address)"
            `shouldRespondWith` [json|[{"id":1,"name":"order 1","billing":{"address": "address 1"},"shipping":{"address": "address 2"}}]|]
              { matchHeaders = [matchContentTypeJson]
              }

        it "fails if the fk is not known" $
          get "/message?select=id,sender:person!space(name)&id=lt.4"
            `shouldRespondWith` [json|{
              "hint":null,
              "message":"Could not find a relationship between 'message' and 'person' in the schema cache",
              "code": "PGRST200",
              "details":"Searched for a foreign key relationship between 'message' and 'person' using the hint 'space' in the schema 'test', but no matches were found."}|]
              { matchStatus = 400
              , matchHeaders = [matchContentTypeJson]
              }

        it "can request a parent with fk" $
          get "/comments?select=content,user(name)"
            `shouldRespondWith` [json|[ { "content": "Needs to be delivered ASAP", "user": { "name": "Angela Martin" } } ]|]
              { matchHeaders = [matchContentTypeJson]
              }

        it "can request two parents with fks" $
          get "/articleStars?select=createdAt,article:articles(id),user(name)&limit=1"
            `shouldRespondWith` [json|[{"createdAt":"2015-12-08T04:22:57.472738","article":{"id": 1},"user":{"name": "Angela Martin"}}]|]

        it "can specify a view!fk" $
          get "/message?select=id,body,sender:person_detail!message_sender_fkey(name,sent),recipient:person_detail!message_recipient_fkey(name,received)&id=lt.4&order=id"
            `shouldRespondWith` [json|
              [{"id":1,"body":"Hello Jane","sender":{"name":"John","sent":2},"recipient":{"name":"Jane","received":2}},
               {"id":2,"body":"Hi John","sender":{"name":"Jane","sent":1},"recipient":{"name":"John","received":1}},
               {"id":3,"body":"How are you doing?","sender":{"name":"John","sent":2},"recipient":{"name":"Jane","received":2}}] |]
              { matchHeaders = [matchContentTypeJson]
              }

        it "can specify a table!fk hint and request children 2 levels" $
          get "/clients?id=eq.1&select=id,projects:projects!client(id,tasks(id))"
            `shouldRespondWith` [json|[{"id":1,"projects":[{"id":1,"tasks":[{"id":1},{"id":2}]},{"id":2,"tasks":[{"id":3},{"id":4}]}]}]|]
              { matchHeaders = [matchContentTypeJson]
              }

        it "can disambiguate with the fk in case of an o2m and m2m relationship to the same table" $
          get "/sites?select=name,main_project(name)&site_id=eq.1"
            `shouldRespondWith` [json| [ { "name": "site 1", "main_project": { "name": "big project 1" } } ] |]
              { matchHeaders = [matchContentTypeJson]
              }

      context "using the column name of the FK to specify the relationship" $ do
        it "can embed by column" $
          get "/projects?id=in.(1,3)&select=id,name,client_id(id,name)"
            `shouldRespondWith` [json|[{"id":1,"name":"Windows 7","client_id":{"id":1,"name":"Microsoft"}},{"id":3,"name":"IOS","client_id":{"id":2,"name":"Apple"}}]|]
              { matchHeaders = [matchContentTypeJson]
              }

        it "can embed by column and select the column at the same time, if aliased" $
          get "/projects?id=in.(1,3)&select=id,name,client_id,client:client_id(id,name)"
            `shouldRespondWith` [json|[{"id":1,"name":"Windows 7","client_id":1,"client":{"id":1,"name":"Microsoft"}},{"id":3,"name":"IOS","client_id":2,"client":{"id":2,"name":"Apple"}}]|]
              { matchHeaders = [matchContentTypeJson]
              }

        it "can embed parent by using view!column and grandparent by using the column" $
          get "/tasks?id=eq.1&select=id,name,project:projects_view!project_id(id,name,client:client_id(id,name))"
            `shouldRespondWith` [json|[{"id":1,"name":"Design w7","project":{"id":1,"name":"Windows 7","client":{"id":1,"name":"Microsoft"}}}]|]

        it "can specify table!column" $
          get "/message?select=id,body,sender:person!sender(name),recipient:person!recipient(name)&id=lt.4"
            `shouldRespondWith` [json|
              [{"id":1,"body":"Hello Jane","sender":{"name":"John"},"recipient":{"name":"Jane"}},
               {"id":2,"body":"Hi John","sender":{"name":"Jane"},"recipient":{"name":"John"}},
               {"id":3,"body":"How are you doing?","sender":{"name":"John"},"recipient":{"name":"Jane"}}] |]
              { matchHeaders = [matchContentTypeJson]
              }

        it "will embed using a column that has uppercase chars" $
          get "/ghostBusters?select=escapeId(*)"
            `shouldRespondWith` [json| [{"escapeId":{"so6meIdColumn":1}},{"escapeId":{"so6meIdColumn":3}},{"escapeId":{"so6meIdColumn":5}}] |]
              { matchHeaders = [matchContentTypeJson]
              }

        it "embeds by using two columns pointing to the same table" $
          get "/orders?id=eq.1&select=id, name, billing_address_id(id), shipping_address_id(id)"
            `shouldRespondWith` [json|[{"id":1,"name":"order 1","billing_address_id":{"id":1},"shipping_address_id":{"id":2}}]|]
              { matchHeaders = [matchContentTypeJson]
              }

        it "can disambiguate with the column in case of an o2m and m2m relationship to the same table" $
          get "/sites?select=name,main_project_id(name)&site_id=eq.1"
            `shouldRespondWith` [json| [ { "name": "site 1", "main_project_id": { "name": "big project 1" } } ] |]
              { matchHeaders = [matchContentTypeJson]
              }

        it "can specify all view column names that reference the same base column" $ do
          get "/i2459_simple_v1?select=*,i2459_simple_v2!t1_id1(*)"
            `shouldRespondWith` [json| [] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/i2459_simple_v1?select=*,i2459_simple_v2!t1_id2(*)"
            `shouldRespondWith` [json| [] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/i2459_simple_v2?select=*,i2459_simple_v1!t1_id1(*)"
            `shouldRespondWith` [json| [] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/i2459_simple_v2?select=*,i2459_simple_v1!t1_id2(*)"
            `shouldRespondWith` [json| [] |]
              { matchHeaders = [matchContentTypeJson]
              }

      context "using the junction to disambiguate the request" $
        it "can specify the junction of an m2m relationship" $ do
          get "/sites?select=*,big_projects!jobs(name)&site_id=in.(1,2)"
            `shouldRespondWith` [json|
              [
                {
                  "big_projects": [
                    {
                      "name": "big project 1"
                    }
                  ],
                  "main_project_id": 1,
                  "name": "site 1",
                  "site_id": 1
                },
                {
                  "big_projects": [
                    {
                      "name": "big project 1"
                    },
                    {
                      "name": "big project 2"
                    }
                  ],
                  "main_project_id": null,
                  "name": "site 2",
                  "site_id": 2
                }
              ]
            |]
          get "/sites?select=*,big_projects!main_jobs(name)&site_id=in.(1,2)"
            `shouldRespondWith` [json|
              [
                {
                  "big_projects": [
                    {
                      "name": "big project 1"
                    }
                  ],
                  "main_project_id": 1,
                  "name": "site 1",
                  "site_id": 1
                },
                {
                  "big_projects": [],
                  "main_project_id": null,
                  "name": "site 2",
                  "site_id": 2
                }
              ]
            |]
              { matchHeaders = [matchContentTypeJson]
              }

      context "using a FK column and a FK to specify the relationship" $
        it "embeds by using a column and a fk pointing to the same table" $
          get "/orders?id=eq.1&select=id, name, billing_address_id(id), shipping(id)"
            `shouldRespondWith` [json|[{"id":1,"name":"order 1","billing_address_id":{"id":1},"shipping":{"id":2}}]|]
              { matchHeaders = [matchContentTypeJson]
              }

    context "tables with self reference foreign keys" $ do
      context "one self reference foreign key" $ do
        it "embeds parents recursively" $
          get "/family_tree?id=in.(3,4)&select=id,parent(id,name,parent(*))&order=id"
            `shouldRespondWith` [json|[
              { "id": "3", "parent": { "id": "1", "name": "Parental Unit", "parent": null } },
              { "id": "4", "parent": { "id": "2", "name": "Kid One", "parent": { "id": "1", "name": "Parental Unit", "parent": null } } }
            ]|]
              { matchHeaders = [matchContentTypeJson]
              }

        it "embeds children recursively" $
          get "/family_tree?id=eq.1&select=id,name, children:family_tree!parent(id,name,children:family_tree!parent(id,name))"
            `shouldRespondWith` [json|[{
              "id": "1", "name": "Parental Unit", "children": [
                { "id": "2", "name": "Kid One", "children": [ { "id": "4", "name": "Grandkid One" } ] },
                { "id": "3", "name": "Kid Two", "children": [ { "id": "5", "name": "Grandkid Two" } ] }
              ]
            }]|]
              { matchHeaders = [matchContentTypeJson]
              }

        it "embeds parent and then embeds children" $
          get "/family_tree?id=eq.2&select=id,name,parent(id,name,children:family_tree!parent(id,name))"
            `shouldRespondWith` [json|[{
              "id": "2", "name": "Kid One", "parent": {
                "id": "1", "name": "Parental Unit", "children": [ { "id": "2", "name": "Kid One" }, { "id": "3", "name": "Kid Two"} ]
              }
            }]|]
              { matchHeaders = [matchContentTypeJson]
              }

        it "embeds parent and then embeds children on a view" $
          get "/job?select=id,parent_id(*),children:job!parent_id(id,parent_id)&order=id"
            `shouldRespondWith` [json|[
              {
                "id": 1,
                "parent_id": null,
                "children": [ { "id": 2, "parent_id": 1 } ]
              },
              {
                "id": 2,
                "parent_id": { "id": 1, "parent_id": null },
                "children": []
              }
            ]|]
              { matchHeaders = [matchContentTypeJson]
              }

        it "can specify all view column names that reference the same base column" $ do
          get "/i2459_self_v1?select=*,parent(*),grandparent(*)"
            `shouldRespondWith` [json| [] |]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/i2459_self_v2?select=*,parent(*),grandparent(*)"
            `shouldRespondWith` [json| [] |]
              { matchHeaders = [matchContentTypeJson]
              }

      context "two self reference foreign keys" $ do
        it "embeds parents" $
          get "/organizations?select=id,name,referee(id,name),auditor(id,name)&id=eq.3"
            `shouldRespondWith` [json|[{
              "id": 3, "name": "Acme",
              "referee": {
                "id": 1,
                "name": "Referee Org"
              },
              "auditor": {
                "id": 2,
                "name": "Auditor Org"
              }
            }]|]
              { matchHeaders = [matchContentTypeJson]
              }

        it "embeds children" $ do
          get "/organizations?select=id,name,refereeds:organizations!referee(id,name)&id=eq.1"
            `shouldRespondWith` [json|[{
              "id": 1, "name": "Referee Org",
              "refereeds": [
                {
                  "id": 3,
                  "name": "Acme"
                },
                {
                  "id": 4,
                  "name": "Umbrella"
                }
              ]
            }]|]
              { matchHeaders = [matchContentTypeJson]
              }
          get "/organizations?select=id,name,auditees:organizations!auditor(id,name)&id=eq.2"
            `shouldRespondWith` [json|[{
              "id": 2, "name": "Auditor Org",
              "auditees": [
                {
                  "id": 3,
                  "name": "Acme"
                },
                {
                  "id": 4,
                  "name": "Umbrella"
                }
              ]
            }]|]
              { matchHeaders = [matchContentTypeJson]
              }

        it "embeds other relations(manager) besides the self reference" $ do
          get "/organizations?select=name,manager(name),referee(name,manager(name),auditor(name,manager(name))),auditor(name,manager(name),referee(name,manager(name)))&id=eq.5"
            `shouldRespondWith` [json|[{
              "name":"Cyberdyne",
              "manager":{"name":"Cyberdyne Manager"},
              "referee":{
                "name":"Acme",
                "manager":{"name":"Acme Manager"},
                "auditor":{
                  "name":"Auditor Org",
                  "manager":{"name":"Auditor Manager"}}},
              "auditor":{
                "name":"Umbrella",
                "manager":{"name":"Umbrella Manager"},
                "referee":{
                  "name":"Referee Org",
                  "manager":{"name":"Referee Manager"}}}
            }]|]
              { matchHeaders = [matchContentTypeJson]
              }

          get "/organizations?select=name,manager(name),auditees:organizations!auditor(name,manager(name),refereeds:organizations!referee(name,manager(name)))&id=eq.2"
            `shouldRespondWith` [json|[{
              "name":"Auditor Org",
              "manager":{"name":"Auditor Manager"},
              "auditees":[
                {"name":"Acme",
                 "manager":{"name":"Acme Manager"},
                 "refereeds":[
                   {"name":"Cyberdyne",
                    "manager":{"name":"Cyberdyne Manager"}},
                   {"name":"Oscorp",
                    "manager":{"name":"Oscorp Manager"}}]},
                {"name":"Umbrella",
                 "manager":{"name":"Umbrella Manager"},
                 "refereeds":[]}]
            }]|]
              { matchHeaders = [matchContentTypeJson]
              }

    context "m2m embed when there's a junction in an internal schema" $ do
      -- https://github.com/PostgREST/postgrest/issues/1736
      it "works with no ambiguity when there's an exposed view of the junction" $ do
        get "/screens?select=labels(name)"
          `shouldRespondWith` [json|[{"labels":[{"name":"fruit"}]}, {"labels":[{"name":"vehicles"}]}, {"labels":[{"name":"vehicles"}, {"name":"fruit"}]}]|]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/actors?select=*,films(*)"
          `shouldRespondWith` [json|[ {"id":1,"name":"john","films":[{"id":12,"title":"douze commandements"}]},
                  {"id":2,"name":"mary","films":[{"id":2001,"title":"odyssée de l'espace"}]}]|]
            { matchHeaders = [matchContentTypeJson]
            }
      it "doesn't work if the junction is only internal" $
        get "/end_1?select=end_2(*)"
          `shouldRespondWith` [json|{
            "hint": null,
            "message":"Could not find a relationship between 'end_1' and 'end_2' in the schema cache",
            "code":"PGRST200",
            "details": "Searched for a foreign key relationship between 'end_1' and 'end_2' in the schema 'test', but no matches were found."}|]
            { matchStatus = 400
            , matchHeaders = [matchContentTypeJson]
            }
      it "shouldn't try to embed if the private junction has an exposed homonym" $
        -- ensures the "invalid reference to FROM-clause entry for table "rollen" error doesn't happen.
        -- Ref: https://github.com/PostgREST/postgrest/issues/1587#issuecomment-734995669
        get "/schauspieler?select=filme(*)"
          `shouldRespondWith` [json|{
            "hint":null,
            "message":"Could not find a relationship between 'schauspieler' and 'filme' in the schema cache",
            "code":"PGRST200",
            "details":"Searched for a foreign key relationship between 'schauspieler' and 'filme' in the schema 'test', but no matches were found."}|]
            { matchStatus = 400
            , matchHeaders = [matchContentTypeJson]
            }

    context "embedding with col as a target doesn't consider views" $ do
      -- https://github.com/PostgREST/postgrest/issues/1643
      it "works with self reference both ways(m2o and o2m)" $ do
        get "/test?select=id,parent_id,parent:parent_id(id)&order=id"
          `shouldRespondWith` [json| [
            { "id": 1, "parent_id": null, "parent": null },
            { "id": 2, "parent_id": 1, "parent": { "id": 1 } }
          ] |]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/test?select=id,parent_id,childs:test(id)&order=id"
          `shouldRespondWith` [json| [
            { "id": 1, "parent_id": null, "childs": [ { "id": 2 } ] },
            { "id": 2, "parent_id": 1, "childs": [] }
          ]
          |]
            { matchHeaders = [matchContentTypeJson]
            }

      -- https://github.com/PostgREST/postgrest/issues/2238
      it "has to be explicit for a view embedding" $ do
        get "/adaptation_notifications?select=id,status,series(*)"
          `shouldRespondWith` [json| [] |]
            { matchHeaders = [matchContentTypeJson]
            }
        get "/adaptation_notifications?select=id,status,series_popularity(*)"
          `shouldRespondWith` [json| [] |]
            { matchHeaders = [matchContentTypeJson]
            }

      it "resolves when there's a table and view that point to the same col" $
        get "/message?select=id,body,sender(id,name)&id=eq.5"
          `shouldRespondWith` [json| [
              {
                "id": 5,
                "body": "What's up Jake",
                "sender": {
                  "id": 4,
                  "name": "Julie"
                }
              }
            ] |]
            { matchHeaders = [matchContentTypeJson]
            }

      it "resolves when there's a table and view that point to the same fk (composite pk)" $
        get "/activities?select=fst_shift(*)"
          `shouldRespondWith` [json| [
              {
                "fst_shift": [
                  { "unit_id": 1, "day": "2019-12-02", "fst_shift_activity_id": 1, "fst_shift_schedule_id": 1, "snd_shift_activity_id": 2, "snd_shift_schedule_id": 3 }
                ]
              },
              {
                "fst_shift": []
              }
            ]|]
            { matchHeaders = [matchContentTypeJson]
            }

    it "should not expose hidden FKs" $
      get "/va?select=vb(*)" `shouldRespondWith` 200
