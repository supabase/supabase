module Feature.Query.SpreadQueriesSpec where

import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig baseCfg $
  describe "spread embeds" $ do
    it "works on a many-to-one relationship" $ do
      get "/projects?select=id,...clients(client_name:name)"
        `shouldRespondWith` [json|[
          {"id":1,"client_name":"Microsoft"},
          {"id":2,"client_name":"Microsoft"},
          {"id":3,"client_name":"Apple"},
          {"id":4,"client_name":"Apple"},
          {"id":5,"client_name":null}
        ]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }
      get "/grandchild_entities?select=name,...child_entities(parent_name:name,...entities(grandparent_name:name))&limit=3"
        `shouldRespondWith` [json|[
          {"name":"grandchild entity 1","parent_name":"child entity 1","grandparent_name":"entity 1"},
          {"name":"grandchild entity 2","parent_name":"child entity 1","grandparent_name":"entity 1"},
          {"name":"grandchild entity 3","parent_name":"child entity 2","grandparent_name":"entity 1"}
        ]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }
      get "/videogames?select=name,...computed_designers(designer_name:name)"
        `shouldRespondWith` [json|[
          {"name":"Civilization I","designer_name":"Sid Meier"},
          {"name":"Civilization II","designer_name":"Sid Meier"},
          {"name":"Final Fantasy I","designer_name":"Hironobu Sakaguchi"},
          {"name":"Final Fantasy II","designer_name":"Hironobu Sakaguchi"}
        ]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }

    it "works inside a normal embed" $
      get "/grandchild_entities?select=name,child_entity:child_entities(name,...entities(parent_name:name))&limit=1"
        `shouldRespondWith` [json|[
          {"name":"grandchild entity 1","child_entity":{"name":"child entity 1","parent_name":"entity 1"}}
        ]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }

    it "works on a one-to-one relationship" $
      get "/country?select=name,...capital(capital:name)"
        `shouldRespondWith` [json|[
          {"name":"Afghanistan","capital":"Kabul"},
          {"name":"Algeria","capital":"Algiers"}
        ]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }

    it "can include or exclude attributes of the junction on a m2m" $ do
      get "/users?select=*,tasks:users_tasks(*,...tasks(*))&limit=1"
        `shouldRespondWith` [json|[{
          "id":1,"name":"Angela Martin",
          "tasks": [
            {"user_id":1,"task_id":1,"id":1,"name":"Design w7","project_id":1},
            {"user_id":1,"task_id":2,"id":2,"name":"Code w7","project_id":1},
            {"user_id":1,"task_id":3,"id":3,"name":"Design w10","project_id":2},
            {"user_id":1,"task_id":4,"id":4,"name":"Code w10","project_id":2}
          ]
        }]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }
      get "/users?select=*,tasks:users_tasks(...tasks(*))&limit=1"
        `shouldRespondWith` [json|[{
          "id":1,"name":"Angela Martin",
          "tasks":[
            {"id":1,"name":"Design w7","project_id":1},
            {"id":2,"name":"Code w7","project_id":1},
            {"id":3,"name":"Design w10","project_id":2},
            {"id":4,"name":"Code w10","project_id":2}
          ]
        }]|]
          { matchStatus = 200
          , matchHeaders = [matchContentTypeJson]
          }

    context "one-to-many relationships" $ do
      it "should spread a column as a json array" $ do
        get "/factories?select=factory:name,...processes(name)&order=name"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","name":["Process A1", "Process A2"]},
            {"factory":"Factory B","name":["Process B1", "Process B2"]},
            {"factory":"Factory C","name":["Process C1", "Process C2", "Process XX", "Process YY"]},
            {"factory":"Factory D","name":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
        get "/factories?select=factory:name,...processes(processes:name)&order=name"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","processes":["Process A1", "Process A2"]},
            {"factory":"Factory B","processes":["Process B1", "Process B2"]},
            {"factory":"Factory C","processes":["Process C1", "Process C2", "Process XX", "Process YY"]},
            {"factory":"Factory D","processes":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should spread many columns as json arrays" $ do
        get "/factories?select=factory:name,...processes(name,category_id)&order=name"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","name":["Process A1", "Process A2"],"category_id":[1, 2]},
            {"factory":"Factory B","name":["Process B1", "Process B2"],"category_id":[1, 1]},
            {"factory":"Factory C","name":["Process C1", "Process C2", "Process XX", "Process YY"],"category_id":[2, 2, 2, 2]},
            {"factory":"Factory D","name":[],"category_id":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
        get "/factories?select=factory:name,...processes(processes:name,categories:category_id)&order=name"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","processes":["Process A1", "Process A2"],"categories":[1, 2]},
            {"factory":"Factory B","processes":["Process B1", "Process B2"],"categories":[1, 1]},
            {"factory":"Factory C","processes":["Process C1", "Process C2", "Process XX", "Process YY"],"categories":[2, 2, 2, 2]},
            {"factory":"Factory D","processes":[],"categories":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should return an empty array when no elements are found" $
        get "/factories?select=factory:name,...processes(processes:name)&processes=is.null"
          `shouldRespondWith` [json|[
            {"factory":"Factory D","processes":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should return a single null element array, not an empty one, when the row exists but the value happens to be null" $
        get "/managers?select=name,...organizations(organizations:name,referees:referee)&id=eq.1"
          `shouldRespondWith` [json|[
            {"name":"Referee Manager","organizations":["Referee Org"],"referees":[null]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should work when selecting all columns" $
        get "/factories?select=factory:name,...processes(*)&order=name"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","id":[1, 2],"name":["Process A1", "Process A2"],"factory_id":[1, 1],"category_id":[1, 2]},
            {"factory":"Factory B","id":[3, 4],"name":["Process B1", "Process B2"],"factory_id":[2, 2],"category_id":[1, 1]},
            {"factory":"Factory C","id":[5, 6, 7, 8],"name":["Process C1", "Process C2", "Process XX", "Process YY"],"factory_id":[3, 3, 3, 3],"category_id":[2, 2, 2, 2]},
            {"factory":"Factory D","id":[],"name":[],"factory_id":[],"category_id":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should select spread columns from a nested one-to-one relationship" $
        get "/factories?select=factory:name,...processes(process:name,...process_costs(process_costs:cost))&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","process":["Process A1", "Process A2"],"process_costs":[150.00, 200.00]},
            {"factory":"Factory B","process":["Process B1", "Process B2"],"process_costs":[180.00, 70.00]},
            {"factory":"Factory C","process":["Process C1", "Process C2", "Process XX", "Process YY"],"process_costs":[40.00, 70.00, null, 40.00]},
            {"factory":"Factory D","process":[],"process_costs":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should select spread columns from a nested many-to-one relationship" $
        get "/factories?select=factory:name,...processes(process:name,...process_categories(categories:name))&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","process":["Process A1", "Process A2"],"categories":["Batch", "Mass"]},
            {"factory":"Factory B","process":["Process B1", "Process B2"],"categories":["Batch", "Batch"]},
            {"factory":"Factory C","process":["Process C1", "Process C2", "Process XX", "Process YY"],"categories":["Mass", "Mass", "Mass", "Mass"]},
            {"factory":"Factory D","process":[],"categories":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should select spread columns from a nested one-to-many relationship" $
        get "/factories?select=factory:name,...processes(process:name,...process_supervisor(supervisor_ids:supervisor_id))&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","process":["Process A1", "Process A2"],"supervisor_ids":[[1], [2]]},
            {"factory":"Factory B","process":["Process B1", "Process B2"],"supervisor_ids":[[3, 4], [1, 2]]},
            {"factory":"Factory C","process":["Process C1", "Process C2", "Process XX", "Process YY"],"supervisor_ids":[[3], [3], [], []]},
            {"factory":"Factory D","process":[],"supervisor_ids":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should select spread columns from a nested many-to-many relationship" $ do
        get "/factories?select=factory:name,...processes(process:name,...supervisors(supervisors:name))&order=name&processes.order=name&processes.supervisors.order=name"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","process":["Process A1", "Process A2"],"supervisors":[["Mary"], ["John"]]},
            {"factory":"Factory B","process":["Process B1", "Process B2"],"supervisors":[["Peter", "Sarah"], ["John", "Mary"]]},
            {"factory":"Factory C","process":["Process C1", "Process C2", "Process XX", "Process YY"],"supervisors":[["Peter"], ["Peter"], [], []]},
            {"factory":"Factory D","process":[],"supervisors":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should show a nested non-spread one-to-one relationship as an array of objects" $ do
        get "/factories?select=factory:name,...processes(process:name,process_costs(cost))&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","process":["Process A1", "Process A2"],"process_costs":[{"cost": 150.00}, {"cost": 200.00}]},
            {"factory":"Factory B","process":["Process B1", "Process B2"],"process_costs":[{"cost": 180.00}, {"cost": 70.00}]},
            {"factory":"Factory C","process":["Process C1", "Process C2", "Process XX", "Process YY"],"process_costs":[{"cost": 40.00}, {"cost": 70.00}, null, {"cost": 40.00}]},
            {"factory":"Factory D","process":[],"process_costs":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should show a nested non-spread many-to-one relationship as an array of objects" $
        get "/factories?select=factory:name,...processes(process:name,process_categories(name))&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","process":["Process A1", "Process A2"],"process_categories":[{"name": "Batch"}, {"name": "Mass"}]},
            {"factory":"Factory B","process":["Process B1", "Process B2"],"process_categories":[{"name": "Batch"}, {"name": "Batch"}]},
            {"factory":"Factory C","process":["Process C1", "Process C2", "Process XX", "Process YY"],"process_categories":[{"name": "Mass"}, {"name": "Mass"}, {"name": "Mass"}, {"name": "Mass"}]},
            {"factory":"Factory D","process":[],"process_categories":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should show a nested non-spread one-to-many relationship as an array of arrays" $
        get "/factories?select=factory:name,...processes(process:name,process_supervisor(supervisor_id))&order=name&processes.order=name&processes.process_supervisor.order=supervisor_id"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","process":["Process A1", "Process A2"],"process_supervisor":[[{"supervisor_id": 1}], [{"supervisor_id": 2}]]},
            {"factory":"Factory B","process":["Process B1", "Process B2"],"process_supervisor":[[{"supervisor_id": 3}, {"supervisor_id": 4}], [{"supervisor_id": 1}, {"supervisor_id": 2}]]},
            {"factory":"Factory C","process":["Process C1", "Process C2", "Process XX", "Process YY"],"process_supervisor":[[{"supervisor_id": 3}], [{"supervisor_id": 3}], [], []]},
            {"factory":"Factory D","process":[],"process_supervisor":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should show a nested non-spread many-to-many relationship as an array of arrays" $
        get "/factories?select=factory:name,...processes(process:name,supervisors(name))&order=name&processes.order=name&processes.supervisors.order=name"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","process":["Process A1", "Process A2"],"supervisors":[[{"name": "Mary"}], [{"name": "John"}]]},
            {"factory":"Factory B","process":["Process B1", "Process B2"],"supervisors":[[{"name": "Peter"}, {"name": "Sarah"}], [{"name": "John"}, {"name": "Mary"}]]},
            {"factory":"Factory C","process":["Process C1", "Process C2", "Process XX", "Process YY"],"supervisors":[[{"name": "Peter"}], [{"name": "Peter"}], [], []]},
            {"factory":"Factory D","process":[],"supervisors":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should work when selecting all columns in a nested to-one resource" $
        get "/factories?select=factory:name,...processes(*,...process_costs(*))&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","id":[1, 2],"name":["Process A1", "Process A2"],"factory_id":[1, 1],"category_id":[1, 2],"process_id":[1, 2],"cost":[150.00, 200.00]},
            {"factory":"Factory B","id":[3, 4],"name":["Process B1", "Process B2"],"factory_id":[2, 2],"category_id":[1, 1],"process_id":[3, 4],"cost":[180.00, 70.00]},
            {"factory":"Factory C","id":[5, 6, 7, 8],"name":["Process C1", "Process C2", "Process XX", "Process YY"],"factory_id":[3, 3, 3, 3],"category_id":[2, 2, 2, 2],"process_id":[5, 6, null, 8],"cost":[40.00, 70.00, null, 40.00]},
            {"factory":"Factory D","id":[],"name":[],"factory_id":[],"category_id":[],"process_id":[],"cost":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "works when column filters are specified" $
        get "/factories?select=factory:name,...processes(*)&processes.name=not.like.*1&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","id":[2],"name":["Process A2"],"factory_id":[1],"category_id":[2]},
            {"factory":"Factory B","id":[4],"name":["Process B2"],"factory_id":[2],"category_id":[1]},
            {"factory":"Factory C","id":[6, 7, 8],"name":["Process C2", "Process XX", "Process YY"],"factory_id":[3, 3, 3],"category_id":[2, 2, 2]},
            {"factory":"Factory D","id":[],"name":[],"factory_id":[],"category_id":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "works with inner joins or not.is.null filters" $ do
        get "/factories?select=factory:name,...processes!inner(name)&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","name":["Process A1", "Process A2"]},
            {"factory":"Factory B","name":["Process B1", "Process B2"]},
            {"factory":"Factory C","name":["Process C1", "Process C2", "Process XX", "Process YY"]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
        get "/factories?select=factory:name,...processes(name)&processes=not.is.null&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","name":["Process A1", "Process A2"]},
            {"factory":"Factory B","name":["Process B1", "Process B2"]},
            {"factory":"Factory C","name":["Process C1", "Process C2", "Process XX", "Process YY"]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "orders all the resulting arrays according to the spread relationship ordering columns" $ do
        get "/factories?select=factory:name,...processes(*)&processes.order=category_id.asc,name.desc&order=name"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","id":[1, 2],"name":["Process A1", "Process A2"],"factory_id":[1, 1],"category_id":[1, 2]},
            {"factory":"Factory B","id":[4, 3],"name":["Process B2", "Process B1"],"factory_id":[2, 2],"category_id":[1, 1]},
            {"factory":"Factory C","id":[8, 7, 6, 5],"name":["Process YY", "Process XX", "Process C2", "Process C1"],"factory_id":[3, 3, 3, 3],"category_id":[2, 2, 2, 2]},
            {"factory":"Factory D","id":[],"name":[],"factory_id":[],"category_id":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
        get "/factories?select=factory:name,...factory_buildings(*)&factory_buildings.order=inspections->pending.asc.nullsfirst,inspections->ins.desc&order=name"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","id":[2, 1],"code":["A002", "A001"],"size":[200, 150],"type":["A", "A"],"factory_id":[1, 1],"inspections":[{"ins": "2025A", "pending": true}, {"ins": "2024C", "pending": true}]},
            {"factory":"Factory B","id":[4, 3],"code":["B002", "B001"],"size":[120, 50],"type":["C", "B"],"factory_id":[2, 2],"inspections":[{"ins": "2023A"}, {"ins": "2025A", "pending": true}]},
            {"factory":"Factory C","id":[5],"code":["C001"],"size":[240],"type":["B"],"factory_id":[3],"inspections":[{"ins": "2022B"}]},
            {"factory":"Factory D","id":[6],"code":["D001"],"size":[310],"type":["A"],"factory_id":[4],"inspections":[{"ins": "2024C", "pending": true}]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "orders all the resulting arrays according to the spread relationship ordering columns even if they aren't selected" $
        get "/factories?select=factory:name,...processes(name)&processes.order=category_id.asc,name.desc&order=name"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","name":["Process A1", "Process A2"]},
            {"factory":"Factory B","name":["Process B2", "Process B1"]},
            {"factory":"Factory C","name":["Process YY", "Process XX", "Process C2", "Process C1"]},
            {"factory":"Factory D","name":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "orders all the resulting arrays according to the related ordering columns in the spread relationship" $
        get "/factories?select=factory:name,...processes(name,...process_costs(cost))&processes.order=process_costs(cost)&order=name"
          `shouldRespondWith` [json|[
            {"factory":"Factory A","name":["Process A1", "Process A2"],"cost":[150.00, 200.00]},
            {"factory":"Factory B","name":["Process B2", "Process B1"],"cost":[70.00, 180.00]},
            {"factory":"Factory C","name":["Process C1", "Process YY", "Process C2", "Process XX"],"cost":[40.00, 40.00, 70.00, null]},
            {"factory":"Factory D","name":[],"cost":[]}
           ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }

    context "many-to-many relationships" $ do
      it "should spread a column as a json array" $ do
        get "/operators?select=operator:name,...processes(name)&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"operator":"Alfred","name":["Process C2", "Process XX"]},
            {"operator":"Anne","name":["Process A1", "Process A2", "Process B2"]},
            {"operator":"Jeff","name":["Process A2", "Process B1", "Process B2", "Process C2"]},
            {"operator":"Liz","name":[]},
            {"operator":"Louis","name":["Process A1", "Process A2"]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
        get "/operators?select=operator:name,...processes(processes:name)&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"operator":"Alfred","processes":["Process C2", "Process XX"]},
            {"operator":"Anne","processes":["Process A1", "Process A2", "Process B2"]},
            {"operator":"Jeff","processes":["Process A2", "Process B1", "Process B2", "Process C2"]},
            {"operator":"Liz","processes":[]},
            {"operator":"Louis","processes":["Process A1", "Process A2"]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should spread many columns as json arrays" $ do
        get "/operators?select=operator:name,...processes(name,category_id)&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"operator":"Alfred","name":["Process C2", "Process XX"],"category_id":[2, 2]},
            {"operator":"Anne","name":["Process A1", "Process A2", "Process B2"],"category_id":[1, 2, 1]},
            {"operator":"Jeff","name":["Process A2", "Process B1", "Process B2", "Process C2"],"category_id":[2, 1, 1, 2]},
            {"operator":"Liz","name":[],"category_id":[]},
            {"operator":"Louis","name":["Process A1", "Process A2"],"category_id":[1, 2]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
        get "/operators?select=operator:name,...processes(processes:name,categories:category_id)&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"operator":"Alfred","processes":["Process C2", "Process XX"],"categories":[2, 2]},
            {"operator":"Anne","processes":["Process A1", "Process A2", "Process B2"],"categories":[1, 2, 1]},
            {"operator":"Jeff","processes":["Process A2", "Process B1", "Process B2", "Process C2"],"categories":[2, 1, 1, 2]},
            {"operator":"Liz","processes":[],"categories":[]},
            {"operator":"Louis","processes":["Process A1", "Process A2"],"categories":[1, 2]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should return an empty array when no elements are found" $
        get "/operators?select=operator:name,...processes(processes:name)&processes=is.null"
          `shouldRespondWith` [json|[
            {"operator":"Liz","processes":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should return a single null element array, not an empty one, when the row exists but the value happens to be null" $
        get "/operators?select=name,...processes(process:name,...process_costs(cost)))&id=eq.5&processes.id=eq.7"
          `shouldRespondWith` [json|[
            {"name":"Alfred","process":["Process XX"],"cost":[null]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should work when selecting all columns" $
        get "/operators?select=operator:name,...processes(*)&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"operator":"Alfred","id":[6, 7],"name":["Process C2", "Process XX"],"factory_id":[3, 3],"category_id":[2, 2]},
            {"operator":"Anne","id":[1, 2, 4],"name":["Process A1", "Process A2", "Process B2"],"factory_id":[1, 1, 2],"category_id":[1, 2, 1]},
            {"operator":"Jeff","id":[2, 3, 4, 6],"name":["Process A2", "Process B1", "Process B2", "Process C2"],"factory_id":[1, 2, 2, 3],"category_id":[2, 1, 1, 2]},
            {"operator":"Liz","id":[],"name":[],"factory_id":[],"category_id":[]},
            {"operator":"Louis","id":[1, 2],"name":["Process A1", "Process A2"],"factory_id":[1, 1],"category_id":[1, 2]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should show spread columns from a nested one-to-one relationship" $
        get "/operators?select=operator:name,...processes(process:name,...process_costs(process_costs:cost))&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"operator":"Alfred","process":["Process C2", "Process XX"],"process_costs":[70.00, null]},
            {"operator":"Anne","process":["Process A1", "Process A2", "Process B2"],"process_costs":[150.00, 200.00, 70.00]},
            {"operator":"Jeff","process":["Process A2", "Process B1", "Process B2", "Process C2"],"process_costs":[200.00, 180.00, 70.00, 70.00]},
            {"operator":"Liz","process":[],"process_costs":[]},
            {"operator":"Louis","process":["Process A1", "Process A2"],"process_costs":[150.00, 200.00]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should show spread columns from a nested many-to-one relationship" $
        get "/operators?select=operator:name,...processes(process:name,...process_categories(categories:name))&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"operator":"Alfred","process":["Process C2", "Process XX"],"categories":["Mass", "Mass"]},
            {"operator":"Anne","process":["Process A1", "Process A2", "Process B2"],"categories":["Batch", "Mass", "Batch"]},
            {"operator":"Jeff","process":["Process A2", "Process B1", "Process B2", "Process C2"],"categories":["Mass", "Batch", "Batch", "Mass"]},
            {"operator":"Liz","process":[],"categories":[]},
            {"operator":"Louis","process":["Process A1", "Process A2"],"categories":["Batch", "Mass"]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should show spread columns from a nested one-to-many relationship" $
        get "/operators?select=operator:name,...processes(process:name,...process_supervisor(supervisor_ids:supervisor_id))&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"operator":"Alfred","process":["Process C2", "Process XX"],"supervisor_ids":[[3], []]},
            {"operator":"Anne","process":["Process A1", "Process A2", "Process B2"],"supervisor_ids":[[1], [2], [1, 2]]},
            {"operator":"Jeff","process":["Process A2", "Process B1", "Process B2", "Process C2"],"supervisor_ids":[[2], [3, 4], [1, 2], [3]]},
            {"operator":"Liz","process":[],"supervisor_ids":[]},
            {"operator":"Louis","process":["Process A1", "Process A2"],"supervisor_ids":[[1], [2]]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should show spread columns from a nested many-to-many relationship" $ do
        get "/operators?select=operator:name,...processes(process:name,...supervisors(supervisors:name))&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"operator":"Alfred","process":["Process C2", "Process XX"],"supervisors":[["Peter"], []]},
            {"operator":"Anne","process":["Process A1", "Process A2", "Process B2"],"supervisors":[["Mary"], ["John"], ["Mary", "John"]]},
            {"operator":"Jeff","process":["Process A2", "Process B1", "Process B2", "Process C2"],"supervisors":[["John"], ["Peter", "Sarah"], ["Mary", "John"], ["Peter"]]},
            {"operator":"Liz","process":[],"supervisors":[]},
            {"operator":"Louis","process":["Process A1", "Process A2"],"supervisors":[["Mary"], ["John"]]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should show a nested non-spread one-to-one relationship as an array of objects" $ do
        get "/operators?select=operator:name,...processes(process:name,process_costs(cost))&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"operator":"Alfred","process":["Process C2", "Process XX"],"process_costs":[{"cost": 70.00}, null]},
            {"operator":"Anne","process":["Process A1", "Process A2", "Process B2"],"process_costs":[{"cost": 150.00}, {"cost": 200.00}, {"cost": 70.00}]},
            {"operator":"Jeff","process":["Process A2", "Process B1", "Process B2", "Process C2"],"process_costs":[{"cost": 200.00}, {"cost": 180.00}, {"cost": 70.00}, {"cost": 70.00}]},
            {"operator":"Liz","process":[],"process_costs":[]},
            {"operator":"Louis","process":["Process A1", "Process A2"],"process_costs":[{"cost": 150.00}, {"cost": 200.00}]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should show a nested non-spread many-to-one relationship as an array of objects" $
        get "/operators?select=operator:name,...processes(process:name,process_categories(name))&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"operator":"Alfred","process":["Process C2", "Process XX"],"process_categories":[{"name": "Mass"}, {"name": "Mass"}]},
            {"operator":"Anne","process":["Process A1", "Process A2", "Process B2"],"process_categories":[{"name": "Batch"}, {"name": "Mass"}, {"name": "Batch"}]},
            {"operator":"Jeff","process":["Process A2", "Process B1", "Process B2", "Process C2"],"process_categories":[{"name": "Mass"}, {"name": "Batch"}, {"name": "Batch"}, {"name": "Mass"}]},
            {"operator":"Liz","process":[],"process_categories":[]},
            {"operator":"Louis","process":["Process A1", "Process A2"],"process_categories":[{"name": "Batch"}, {"name": "Mass"}]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should show a nested non-spread one-to-many relationship as an array of arrays" $
        get "/operators?select=operator:name,...processes(process:name,process_supervisor(supervisor_id))&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"operator":"Alfred","process":["Process C2", "Process XX"],"process_supervisor":[[{"supervisor_id": 3}], []]},
            {"operator":"Anne","process":["Process A1", "Process A2", "Process B2"],"process_supervisor":[[{"supervisor_id": 1}], [{"supervisor_id": 2}], [{"supervisor_id": 1}, {"supervisor_id": 2}]]},
            {"operator":"Jeff","process":["Process A2", "Process B1", "Process B2", "Process C2"],"process_supervisor":[[{"supervisor_id": 2}], [{"supervisor_id": 3}, {"supervisor_id": 4}], [{"supervisor_id": 1}, {"supervisor_id": 2}], [{"supervisor_id": 3}]]},
            {"operator":"Liz","process":[],"process_supervisor":[]},
            {"operator":"Louis","process":["Process A1", "Process A2"],"process_supervisor":[[{"supervisor_id": 1}], [{"supervisor_id": 2}]]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should show a nested non-spread many-to-many relationship as an array of arrays" $
        get "/operators?select=operator:name,...processes(process:name,supervisors(name))&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"operator":"Alfred","process":["Process C2", "Process XX"],"supervisors":[[{"name": "Peter"}], []]},
            {"operator":"Anne","process":["Process A1", "Process A2", "Process B2"],"supervisors":[[{"name": "Mary"}], [{"name": "John"}], [{"name": "Mary"}, {"name": "John"}]]},
            {"operator":"Jeff","process":["Process A2", "Process B1", "Process B2", "Process C2"],"supervisors":[[{"name": "John"}], [{"name": "Peter"}, {"name": "Sarah"}], [{"name": "Mary"}, {"name": "John"}], [{"name": "Peter"}]]},
            {"operator":"Liz","process":[],"supervisors":[]},
            {"operator":"Louis","process":["Process A1", "Process A2"],"supervisors":[[{"name": "Mary"}], [{"name": "John"}]]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "should work when selecting all columns in a nested to-one resource" $
        get "/operators?select=operator:name,...processes(*,...process_costs(*))&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"operator":"Alfred","id":[6, 7],"name":["Process C2", "Process XX"],"factory_id":[3, 3],"category_id":[2, 2],"process_id":[6, null],"cost":[70.00, null]},
            {"operator":"Anne","id":[1, 2, 4],"name":["Process A1", "Process A2", "Process B2"],"factory_id":[1, 1, 2],"category_id":[1, 2, 1],"process_id":[1, 2, 4],"cost":[150.00, 200.00, 70.00]},
            {"operator":"Jeff","id":[2, 3, 4, 6],"name":["Process A2", "Process B1", "Process B2", "Process C2"],"factory_id":[1, 2, 2, 3],"category_id":[2, 1, 1, 2],"process_id":[2, 3, 4, 6],"cost":[200.00, 180.00, 70.00, 70.00]},
            {"operator":"Liz","id":[],"name":[],"factory_id":[],"category_id":[],"process_id":[],"cost":[]},
            {"operator":"Louis","id":[1, 2],"name":["Process A1", "Process A2"],"factory_id":[1, 1],"category_id":[1, 2],"process_id":[1, 2],"cost":[150.00, 200.00]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "works when column filters are specified" $
        get "/supervisors?select=supervisor:name,...processes(*)&processes.name=not.like.*1&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"supervisor":"Jane","id":[],"name":[],"factory_id":[],"category_id":[]},
            {"supervisor":"John","id":[2, 4],"name":["Process A2", "Process B2"],"factory_id":[1, 2],"category_id":[2, 1]},
            {"supervisor":"Mary","id":[4],"name":["Process B2"],"factory_id":[2],"category_id":[1]},
            {"supervisor":"Peter","id":[6],"name":["Process C2"],"factory_id":[3],"category_id":[2]},
            {"supervisor":"Sarah","id":[],"name":[],"factory_id":[],"category_id":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "works with inner joins or not.is.null filters" $ do
        get "/supervisors?select=supervisor:name,...processes!inner(name)&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"supervisor":"John","name":["Process A2", "Process B2"]},
            {"supervisor":"Mary","name":["Process A1", "Process B2"]},
            {"supervisor":"Peter","name":["Process B1", "Process C1", "Process C2"]},
            {"supervisor":"Sarah","name":["Process B1"]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
        get "/supervisors?select=supervisor:name,...processes(name)&processes=not.is.null&order=name&processes.order=name"
          `shouldRespondWith` [json|[
            {"supervisor":"John","name":["Process A2", "Process B2"]},
            {"supervisor":"Mary","name":["Process A1", "Process B2"]},
            {"supervisor":"Peter","name":["Process B1", "Process C1", "Process C2"]},
            {"supervisor":"Sarah","name":["Process B1"]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "orders all the resulting arrays according to the spread relationship ordering columns" $ do
        get "/supervisors?select=supervisor:name,...processes(*)&processes.order=category_id.asc,name.desc&order=name"
          `shouldRespondWith` [json|[
            {"supervisor":"Jane","id":[],"name":[],"factory_id":[],"category_id":[]},
            {"supervisor":"John","id":[4, 2],"name":["Process B2", "Process A2"],"factory_id":[2, 1],"category_id":[1, 2]},
            {"supervisor":"Mary","id":[4, 1],"name":["Process B2", "Process A1"],"factory_id":[2, 1],"category_id":[1, 1]},
            {"supervisor":"Peter","id":[3, 6, 5],"name":["Process B1", "Process C2", "Process C1"],"factory_id":[2, 3, 3],"category_id":[1, 2, 2]},
            {"supervisor":"Sarah","id":[3],"name":["Process B1"],"factory_id":[2],"category_id":[1]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
        get "/processes?select=process:name,...operators(*)&operators.order=status->afk.asc.nullsfirst,status->id.desc&order=name"
          `shouldRespondWith` [json|[
            {"process":"Process A1","id":[2, 1],"name":["Louis", "Anne"],"status":[{"id": "012345"}, {"id": "543210", "afk": true}]},
            {"process":"Process A2","id":[2, 3, 1],"name":["Louis", "Jeff", "Anne"],"status":[{"id": "012345"}, {"id": "666666", "afk": true}, {"id": "543210", "afk": true}]},
            {"process":"Process B1","id":[3],"name":["Jeff"],"status":[{"id": "666666", "afk": true}]},
            {"process":"Process B2","id":[3, 1],"name":["Jeff", "Anne"],"status":[{"id": "666666", "afk": true}, {"id": "543210", "afk": true}]},
            {"process":"Process C1","id":[],"name":[],"status":[]},
            {"process":"Process C2","id":[5, 3],"name":["Alfred", "Jeff"],"status":[{"id": "000000"}, {"id": "666666", "afk": true}]},
            {"process":"Process XX","id":[5],"name":["Alfred"],"status":[{"id": "000000"}]},
            {"process":"Process YY","id":[],"name":[],"status":[]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "orders all the resulting arrays according to the spread relationship ordering columns even if they aren't selected" $
        get "/supervisors?select=supervisor:name,...processes(name)&processes.order=category_id.asc,name.desc&order=name"
          `shouldRespondWith` [json|[
            {"supervisor":"Jane","name":[]},
            {"supervisor":"John","name":["Process B2", "Process A2"]},
            {"supervisor":"Mary","name":["Process B2", "Process A1"]},
            {"supervisor":"Peter","name":["Process B1", "Process C2", "Process C1"]},
            {"supervisor":"Sarah","name":["Process B1"]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
      it "orders all the resulting arrays according to the related ordering columns in the spread relationship" $
        get "/supervisors?select=supervisor:name,...processes(name,...process_costs(cost))&processes.order=process_costs(cost)&order=name"
          `shouldRespondWith` [json|[
            {"supervisor":"Jane","name":[],"cost":[]},
            {"supervisor":"John","name":["Process B2", "Process A2"],"cost":[70.00, 200.00]},
            {"supervisor":"Mary","name":["Process B2", "Process A1"],"cost":[70.00, 150.00]},
            {"supervisor":"Peter","name":["Process C1", "Process C2", "Process B1"],"cost":[40.00, 70.00, 180.00]},
            {"supervisor":"Sarah","name":["Process B1"],"cost":[180.00]}
          ]|]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }

    context "empty spreads embeds" $
      it "should work return the same as empty embeddings" $ do
        get "/actors?select=*,...films()"
          `shouldRespondWith` [json| [{"id":1,"name":"john"}, {"id":2,"name":"mary"}] |]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }

        get "/grandchild_entities?select=name,...child_entities(parent_name:name,...entities())"
          `shouldRespondWith` [json|
            [{"name":"grandchild entity 1","parent_name":"child entity 1"},
             {"name":"grandchild entity 2","parent_name":"child entity 1"},
             {"name":"grandchild entity 3","parent_name":"child entity 2"},
             {"name":"(grandchild,entity,4)","parent_name":"child entity 2"},
             {"name":"(grandchild,entity,5)","parent_name":"child entity 2"}]
          |]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }

        get "/factories?select=factory:name,...processes()"
          `shouldRespondWith` [json|
            [{"factory":"Factory A"},
             {"factory":"Factory B"},
             {"factory":"Factory C"},
             {"factory":"Factory D"}]
          |]
            { matchStatus = 200
            , matchHeaders = [matchContentTypeJson]
            }
