module Feature.Query.ComputedRelsSpec where

import Network.HTTP.Types
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig baseCfg $ describe "computed relationships" $ do
  it "can define a many-to-one relationship with SETOF and ROWS 1 and embed" $
    get "/videogames?select=name,designer:computed_designers(name)"
      `shouldRespondWith` [json|[
        {"name":"Civilization I","designer":{"name":"Sid Meier"}},
        {"name":"Civilization II","designer":{"name":"Sid Meier"}},
        {"name":"Final Fantasy I","designer":{"name":"Hironobu Sakaguchi"}},
        {"name":"Final Fantasy II","designer":{"name":"Hironobu Sakaguchi"}}
      ]|]
        { matchHeaders = [matchContentTypeJson]
        }

  it "can define a many-to-one relationship without SETOF and embed" $
    get "/videogames?select=name,designer:computed_designers_noset(name)"
      `shouldRespondWith` [json|[
        {"name":"Civilization I","designer":{"name":"Sid Meier"}},
        {"name":"Civilization II","designer":{"name":"Sid Meier"}},
        {"name":"Final Fantasy I","designer":{"name":"Hironobu Sakaguchi"}},
        {"name":"Final Fantasy II","designer":{"name":"Hironobu Sakaguchi"}}
      ]|]
        { matchHeaders = [matchContentTypeJson]
        }

  it "can define a one-to-many relationship and embed" $
    get "/designers?select=name,videogames:computed_videogames(name)"
      `shouldRespondWith` [json|[
        {"name":"Sid Meier","videogames":[{"name":"Civilization I"}, {"name":"Civilization II"}]},
        {"name":"Hironobu Sakaguchi","videogames":[{"name":"Final Fantasy I"}, {"name":"Final Fantasy II"}]}
      ]|]
        { matchHeaders = [matchContentTypeJson]
        }

  it "works with !inner and count=exact" $ do
    request
      methodGet
      "/designers?select=name,videogames:computed_videogames!inner(name)&videogames.name=eq.Civilization%20I"
      [("Prefer", "count=exact")]
      ""
      `shouldRespondWith` [json|[{"name":"Sid Meier","videogames":[{"name":"Civilization I"}]}]|]
        { matchStatus = 200
        , matchHeaders = ["Content-Range" <:> "0-0/1"]
        }
    request
      methodGet
      "/videogames?select=name,designer:computed_designers!inner(name)&designer.name=like.*Hironobu*"
      [("Prefer", "count=exact")]
      ""
      `shouldRespondWith` [json|[
          {"name":"Final Fantasy I","designer":{"name":"Hironobu Sakaguchi"}},
          {"name":"Final Fantasy II","designer":{"name":"Hironobu Sakaguchi"}}
        ]|]
        { matchStatus = 200
        , matchHeaders = ["Content-Range" <:> "0-1/2"]
        }
    request
      methodGet
      "/videogames?select=name,designer:computed_designers_noset!inner(name)&designer.name=like.*Hironobu*"
      [("Prefer", "count=exact")]
      ""
      `shouldRespondWith` [json|[
          {"name":"Final Fantasy I","designer":{"name":"Hironobu Sakaguchi"}},
          {"name":"Final Fantasy II","designer":{"name":"Hironobu Sakaguchi"}}
        ]|]
        { matchStatus = 200
        , matchHeaders = ["Content-Range" <:> "0-1/2"]
        }

  it "works with rpc" $ do
    get "/rpc/getallvideogames?select=name,designer:computed_designers(name)"
      `shouldRespondWith` [json|[
        {"name":"Civilization I","designer":{"name":"Sid Meier"}},
        {"name":"Civilization II","designer":{"name":"Sid Meier"}},
        {"name":"Final Fantasy I","designer":{"name":"Hironobu Sakaguchi"}},
        {"name":"Final Fantasy II","designer":{"name":"Hironobu Sakaguchi"}}
      ]|]
        { matchHeaders = [matchContentTypeJson]
        }
    get "/rpc/getalldesigners?select=name,videogames:computed_videogames(name)"
      `shouldRespondWith` [json|[
        {"name":"Sid Meier","videogames":[{"name":"Civilization I"}, {"name":"Civilization II"}]},
        {"name":"Hironobu Sakaguchi","videogames":[{"name":"Final Fantasy I"}, {"name":"Final Fantasy II"}]}
      ]|]
        { matchHeaders = [matchContentTypeJson]
        }

  it "works with mutations" $ do
    request
      methodPost
      "/videogames?select=name,designer:computed_designers(name)"
      [("Prefer", "return=representation")]
      [json| {"id": 5, "name": "Chrono Trigger", "designer_id": 2} |]
      `shouldRespondWith` [json|[ {"name":"Chrono Trigger","designer":{"name":"Hironobu Sakaguchi"}} ]|]
        { matchStatus = 201
        }
    request
      methodPatch
      "/designers?select=name,videogames:computed_videogames(name)&id=eq.1"
      [("Prefer", "return=representation")]
      [json| {"name": "Sidney K. Meier"} |]
      `shouldRespondWith` [json|[ { "name": "Sidney K. Meier", "videogames": [{"name":"Civilization I"}, {"name":"Civilization II"}] } ]|]
        { matchStatus = 200
        }
    request
      methodDelete
      "/videogames?select=name,designer:computed_designers(name)&id=eq.3"
      [("Prefer", "return=representation")]
      ""
      `shouldRespondWith` [json|[ {"name":"Final Fantasy I","designer":{"name":"Hironobu Sakaguchi"}} ]|]
        { matchStatus = 200
        }

  it "applies data representations to response" $ do
    -- A smoke test for data reps in the presence of computed relations.

    -- The data rep here title cases the designer name before presentation. So here the lowercase version will be saved,
    -- but the title case version returned. Pulling in a computed relation should not confuse this.
    request
      methodPatch
      "/designers?select=name,videogames:computed_videogames(name)&id=eq.1"
      [("Prefer", "return=representation"), ("Prefer", "tx=commit")]
      [json| {"name": "sidney k. meier"} |]
      `shouldRespondWith` [json|[{"name":"Sidney K. Meier","videogames":[{"name":"Civilization I"}, {"name":"Civilization II"}]}]|]
        { matchStatus = 200
        }

    -- Verify it was saved the way we requested (there's no text data rep for this column, so if we select with the wrong casing, it should fail.)
    get "/designers?select=id&name=eq.Sidney%20K.%20Meier"
      `shouldRespondWith` [json|[]|]
        { matchStatus = 200
        , matchHeaders = [matchContentTypeJson]
        }
    -- But with the right casing it works.
    get "/designers?select=id,name&name=eq.sidney%20k.%20meier"
      `shouldRespondWith` [json|[{"id": 1, "name":"Sidney K. Meier"}]|]
        { matchStatus = 200
        , matchHeaders = [matchContentTypeJson]
        }

    -- Most importantly, if you read it back even via a computed relation, the data rep should be applied.
    get "/videogames?select=name,designer:computed_designers(*)&id=eq.1"
      `shouldRespondWith` [json|[
        {"name":"Civilization I","designer":{"id": 1, "name":"Sidney K. Meier"}}
      ]|]
        { matchHeaders = [matchContentTypeJson]
        }

    -- reset the test fixture
    request
      methodPatch
      "/designers?id=eq.1"
      [("Prefer", "tx=commit")]
      [json| {"name": "Sid Meier"} |]
      `shouldRespondWith` 204
    -- need to poke the second one too to prevent inherent ordering from changing
    request
      methodPatch
      "/designers?id=eq.2"
      [("Prefer", "tx=commit")]
      [json| {"name": "Hironobu Sakaguchi"} |]
      `shouldRespondWith` 204

  it "works with self joins" $
    get "/web_content?select=name,child_web_content(name),parent_web_content(name)&id=in.(0,1)"
      `shouldRespondWith` [json|[
        {"name":"tardis","child_web_content":[{"name":"fezz"}, {"name":"foo"}, {"name":"bar"}],"parent_web_content":{"name":"wat"}},
        {"name":"fezz","child_web_content":[{"name":"wut"}],"parent_web_content":{"name":"tardis"}}
      ]|]
        { matchHeaders = [matchContentTypeJson]
        }

  it "can override many-to-one and one-to-many relationships" $ do
    get "/videogames?select=*,designers!inner(*)"
      `shouldRespondWith` [json|[]|]{matchHeaders = [matchContentTypeJson]}
    get "/designers?select=*,videogames!inner(*)"
      `shouldRespondWith` [json|[]|]{matchHeaders = [matchContentTypeJson]}

  it "can override one-to-one relationships(would give disambiguation errors otherwise)" $ do
    get "/first_1?select=*,second_1(*)"
      `shouldRespondWith` [json|[]|]{matchHeaders = [matchContentTypeJson]}
    get "/second_1?select=*,first_1(*)"
      `shouldRespondWith` [json|[]|]{matchHeaders = [matchContentTypeJson]}

  -- https://github.com/PostgREST/postgrest/issues/2455
  it "creates queries with the right aliasing" $ do
    get "/fee?select=*,jsbaz(*,janedoe(*))"
      `shouldRespondWith` [json|[]|]{matchHeaders = [matchContentTypeJson]}
    get "/fee?select=*,jsbaz(*,johnsmith(*, fee(*)))"
      `shouldRespondWith` [json|[]|]{matchHeaders = [matchContentTypeJson]}

  it "creates queries with the right aliasing when following a normal embed" $ do
    get "/projects?select=name,clients(name,computed_projects(name))&limit=1"
      `shouldRespondWith` [json|
        [{"name":"Windows 7","clients":{"name":"Microsoft","computed_projects":{"name":"Windows 7"}}}]
      |]
        { matchHeaders = [matchContentTypeJson]
        }
    get "/clients?select=name,projects(name,computed_clients(name))&limit=1"
      `shouldRespondWith` [json|[
        {"name":"Microsoft","projects":[
          {"name":"Windows 7","computed_clients":{"name":"Microsoft"}},
          {"name":"Windows 10","computed_clients":{"name":"Microsoft"}}
        ]}
      ]|]
        { matchHeaders = [matchContentTypeJson]
        }

  -- https://github.com/PostgREST/postgrest/issues/2963
  context "can be defined using overloaded functions" $ do
    it "tables" $ do
      get "/items?select=*,computed_rel_overload(*)&limit=1"
        `shouldRespondWith` [json|
          [{"id":1,"computed_rel_overload":[{"id":1}]}]
        |]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/items2?select=*,computed_rel_overload(*)&limit=1"
        `shouldRespondWith` [json|
          [{"id":1,"computed_rel_overload":[{"id":1},{"id":2}]}]
        |]
          { matchHeaders = [matchContentTypeJson]
          }

    it "rpc" $ do
      get "/rpc/search?id=1&select=*,computed_rel_overload(*)"
        `shouldRespondWith` [json|
          [{"id":1,"computed_rel_overload":[{"id":1}]}]
        |]
          { matchHeaders = [matchContentTypeJson]
          }
      get "/rpc/search2?id=1&select=*,computed_rel_overload(*)"
        `shouldRespondWith` [json|
          [{"id":1,"computed_rel_overload":[{"id":1},{"id":2}]}]
        |]
          { matchHeaders = [matchContentTypeJson]
          }
