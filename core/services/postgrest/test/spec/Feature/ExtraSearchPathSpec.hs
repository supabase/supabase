module Feature.ExtraSearchPathSpec where

import Network.HTTP.Types
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import PostgREST.Config (AppConfig (..))
import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig (baseCfg{configDbExtraSearchPath = ["public", "extensions", "EXTRA \"@/\\#~_-"]}) $ describe "extra search path" $ do
  it "finds the ltree <@ operator on the public schema" $
    request methodGet "/ltree_sample?path=cd.Top.Science.Astronomy" [] ""
      `shouldRespondWith` [json|[
        {"path":"Top.Science.Astronomy"},
        {"path":"Top.Science.Astronomy.Astrophysics"},
        {"path":"Top.Science.Astronomy.Cosmology"}]|]
        { matchHeaders = [matchContentTypeJson]
        }

  it "finds the ltree ~ operator on the public schema" $ do
    request methodGet "/ltree_sample?path=match.*.Science" [] ""
      `shouldRespondWith` [json|[
        {"path": "Top.Science"}]|]
        { matchHeaders = [matchContentTypeJson]
        }

    request methodGet "/ltree_sample?path=match.*.Astronomy.*" [] ""
      `shouldRespondWith` [json|[
        {"path": "Top.Science.Astronomy"},
        {"path": "Top.Science.Astronomy.Astrophysics"},
        {"path": "Top.Science.Astronomy.Cosmology"},
        {"path": "Top.Collections.Pictures.Astronomy"},
        {"path": "Top.Collections.Pictures.Astronomy.Stars"},
        {"path": "Top.Collections.Pictures.Astronomy.Galaxies"},
        {"path": "Top.Collections.Pictures.Astronomy.Astronauts"}]|]
        { matchHeaders = [matchContentTypeJson]
        }

    request methodGet "/ltree_sample?path=match.*.Collections.*{1,2}" [] ""
      `shouldRespondWith` [json|[
        {"path": "Top.Collections.Pictures"},
        {"path": "Top.Collections.Pictures.Astronomy"}]|]
        { matchHeaders = [matchContentTypeJson]
        }

  it "finds the ltree nlevel function on the public schema, used through a computed column" $
    request methodGet "/ltree_sample?select=number_of_labels&path=eq.Top.Science" [] ""
      `shouldRespondWith` [json|[{"number_of_labels":2}]|]
        { matchHeaders = [matchContentTypeJson]
        }

  it "finds the isn = operator on the extensions schema" $
    request methodGet "/isn_sample?id=eq.978-0-393-04002-9&select=name" [] ""
      `shouldRespondWith` [json|[{"name":"Mathematics: From the Birth of Numbers"}]|]
        { matchHeaders = [matchContentTypeJson]
        }

  it "finds the isn is_valid function on the extensions schema" $
    request methodGet "/rpc/is_valid_isbn?input=978-0-393-04002-9" [] ""
      `shouldRespondWith` [json|true|]
        { matchHeaders = [matchContentTypeJson]
        }

  it "finds a function on a schema with uppercase and special characters in its name" $
    request methodGet "/rpc/special_extended_schema?val=value" [] ""
      `shouldRespondWith` [json|"value"|]
        { matchHeaders = [matchContentTypeJson]
        }

  it "can detect fk relations through multiple views recursively when middle views are in extra search path" $
    get "/consumers_extra_view?select=*,orders_view(*)" `shouldRespondWith` 200
