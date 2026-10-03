module Feature.Query.PostGISSpec where

import Network.HTTP.Types
import Protolude hiding (get)
import Test.Hspec
import Test.Hspec.Wai
import Test.Hspec.Wai.JSON

import PostgREST.Config (AppConfig (..))
import SpecHelper

spec :: SpecWithConfig
spec withConfig = withConfig (baseCfg{configDbExtraSearchPath = ["public", "extensions"]}) $
  describe "PostGIS features" $
    context "GeoJSON output" $ do
      it "works for a table that has a geometry column" $
        request
          methodGet
          "/shops"
          [("Accept", "application/geo+json")]
          ""
          `shouldRespondWith` [json| {
          "type" : "FeatureCollection",
          "features" : [
            {"type": "Feature", "geometry": {"type":"Point","coordinates":[-71.10044,42.373695]}, "properties": {"id": 1, "address": "1369 Cambridge St"}}
          , {"type": "Feature", "geometry": {"type":"Point","coordinates":[-71.10543,42.366432]}, "properties": {"id": 2, "address": "757 Massachusetts Ave"}}
          , {"type": "Feature", "geometry": {"type":"Point","coordinates":[-71.081924,42.36437]}, "properties": {"id": 3, "address": "605 W Kendall St"}}
          ]} |]
            { matchHeaders = ["Content-Type" <:> "application/geo+json; charset=utf-8"]
            }

      it "fails for a table that doesn't have a geometry column" $
        request
          methodGet
          "/projects"
          [("Accept", "application/geo+json")]
          ""
          `shouldRespondWith` [json| {"hint":null,"details":null,"code":"22023","message":"geometry column is missing"} |]
            { matchStatus = 400
            , matchHeaders = [matchContentTypeJson]
            }

      it "gives an empty features array on no rows" $
        request
          methodGet
          "/shops?id=gt.3"
          [("Accept", "application/geo+json")]
          ""
          `shouldRespondWith` [json| {
          "type" : "FeatureCollection",
          "features" : []} |]
            { matchHeaders = ["Content-Type" <:> "application/geo+json; charset=utf-8"]
            }

      it "must include the geometry column when using ?select" $
        request
          methodGet
          "/shops?select=id,shop_geom&id=eq.1"
          [("Accept", "application/geo+json")]
          ""
          `shouldRespondWith` [json| {
          "type" : "FeatureCollection",
          "features" : [
            {"type": "Feature", "geometry": {"type":"Point","coordinates":[-71.10044,42.373695]}, "properties": {"id": 1}}
          ] }|]
            { matchHeaders = ["Content-Type" <:> "application/geo+json; charset=utf-8"]
            }

      it "works with resource embedding" $
        request
          methodGet
          "/shops?select=*,shop_bles(*)&id=eq.1"
          [("Accept", "application/geo+json")]
          ""
          `shouldRespondWith` [json| {
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "geometry": { "coordinates": [ -71.10044, 42.373695 ], "type": "Point" },
              "properties": {
                "address": "1369 Cambridge St", "id": 1,
                "shop_bles": [
                  { "id": 1, "name": "Beacon-1", "shop_id": 1 ,
                    "coords": { "coordinates": [ -71.10044, 42.373695 ], "crs": { "properties": { "name": "EPSG:4326" }, "type": "name" }, "type": "Point" },
                    "range_area": {
                      "coordinates": [ [ [ -71.10045254230499, 42.37387083326593 ], [ -71.10048070549963, 42.37377126199953 ], [ -71.10039688646793, 42.37375838212269 ], [ -71.10037006437777, 42.37385844878863 ], [ -71.10045254230499, 42.37387083326593 ] ] ],
                      "crs": { "properties": { "name": "EPSG:4326" }, "type": "name" }, "type": "Polygon" }
                  },
                  { "coords": { "coordinates": [ -71.10044, 42.373695 ], "crs": { "properties": { "name": "EPSG:4326" }, "type": "name" }, "type": "Point" },
                    "id": 2, "name": "Beacon-2", "shop_id": 1,
                    "range_area": {
                      "coordinates": [ [ [ -71.10034391283989, 42.37385299961788 ], [ -71.10036939382553, 42.373756895982865 ], [ -71.1002916097641, 42.373745997623224 ], [ -71.1002641171217, 42.37384408279195 ], [ -71.10034391283989, 42.37385299961788 ] ] ],
                      "crs": { "properties": { "name": "EPSG:4326" }, "type": "name" }, "type": "Polygon" }
                  }
                ]
              }
            }
          ]
        }|]
            { matchHeaders = ["Content-Type" <:> "application/geo+json; charset=utf-8"]
            }

      it "works with RPC" $
        request
          methodGet
          "/rpc/get_shop?id=1"
          [("Accept", "application/geo+json")]
          ""
          `shouldRespondWith` [json|{
          "type" : "FeatureCollection",
          "features" : [
            {"type": "Feature", "geometry": {"type":"Point","coordinates":[-71.10044,42.373695]}, "properties": {"id": 1, "address": "1369 Cambridge St"} }
          ]
        }|]
            { matchHeaders = ["Content-Type" <:> "application/geo+json; charset=utf-8"]
            }

      it "works with Prefer: return=representation after POST" $
        request
          methodPost
          "/shops"
          [("Accept", "application/geo+json"), ("Prefer", "return=representation")]
          [json|
          {"id": 4, "address": "1354 Massachusetts Ave", "shop_geom": "SRID=4326;POINT(-71.11834 42.373238)"}
        |]
          `shouldRespondWith` [json|{
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "geometry": { "coordinates": [ -71.11834, 42.373238 ], "type": "Point" },
              "properties": { "address": "1354 Massachusetts Ave", "id": 4 }
            }
          ]
        }|]
            { matchStatus = 201
            , matchHeaders = ["Content-Type" <:> "application/geo+json; charset=utf-8"]
            }

      it "works with Prefer: return=representation after PATCH" $
        request
          methodPatch
          "/shops?id=eq.3"
          [("Accept", "application/geo+json"), ("Prefer", "return=representation")]
          [json| { "address": "1354 Massachusetts Avenue"} |]
          `shouldRespondWith` [json|{
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "geometry": { "coordinates": [-71.081924,42.36437], "type": "Point" },
              "properties": { "address": "1354 Massachusetts Avenue", "id": 3 }
            }
          ]
        }|]
            { matchStatus = 200
            , matchHeaders = ["Content-Type" <:> "application/geo+json; charset=utf-8"]
            }

      it "works with Prefer: return=representation after PUT" $
        request
          methodPut
          "/shops?id=eq.3"
          [("Accept", "application/geo+json"), ("Prefer", "return=representation")]
          [json| { "id": 3, "address": "1354 Massachusetts Avenue"} |]
          `shouldRespondWith` [json|{
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "geometry": { "coordinates": [-71.081924,42.36437], "type": "Point" },
              "properties": { "address": "1354 Massachusetts Avenue", "id": 3 }
            }
          ]
        }|]
            { matchStatus = 200
            , matchHeaders = ["Content-Type" <:> "application/geo+json; charset=utf-8"]
            }

      it "works with Prefer: return=representation after DELETE" $
        request
          methodDelete
          "/shops?id=eq.3"
          [("Accept", "application/geo+json"), ("Prefer", "return=representation")]
          ""
          `shouldRespondWith` [json|{
          "type" : "FeatureCollection",
          "features" : [
            {"type": "Feature", "geometry": {"type":"Point","coordinates":[-71.081924,42.36437]}, "properties": {"id": 3, "address": "605 W Kendall St"}}
          ]
        }|]
            { matchStatus = 200
            , matchHeaders = ["Content-Type" <:> "application/geo+json; charset=utf-8"]
            }

      context "multiple geometry columns" $
        it "can select the geometry column to get as a feature with ?select" $ do
          request
            methodGet
            "/shop_bles?select=id,name,coords&id=eq.1"
            [("Accept", "application/geo+json")]
            ""
            `shouldRespondWith` [json|{
            "type" : "FeatureCollection",
            "features" : [
              {"type": "Feature",
               "geometry": {"type":"Point","coordinates":[-71.10044,42.373695]},
               "properties": {"id": 1, "name": "Beacon-1"}
              }
            ]}|]
              { matchHeaders = ["Content-Type" <:> "application/geo+json; charset=utf-8"]
              }

          request
            methodGet
            "/shop_bles?select=id,name,range_area&id=eq.1"
            [("Accept", "application/geo+json")]
            ""
            `shouldRespondWith` [json|{
            "type" : "FeatureCollection",
            "features" : [
              {"type": "Feature",
               "geometry": {"type":"Polygon","coordinates":[[[-71.100452542,42.373870833],[-71.100480705,42.373771262],[-71.100396886,42.373758382],[-71.100370064,42.373858449],[-71.100452542,42.373870833]]]},
               "properties": {"id": 1, "name": "Beacon-1"}}
            ]}|]
              { matchHeaders = ["Content-Type" <:> "application/geo+json; charset=utf-8"]
              }

      it "gets the geojson geometry object with the regular application/json output" $
        request methodGet "/shops?id=eq.1" [] ""
          `shouldRespondWith` [json|[{
          "id":1,"address":"1369 Cambridge St",
          "shop_geom":{"type":"Point","crs":{"type":"name","properties":{"name":"EPSG:4326"}},"coordinates":[-71.10044,42.373695]}
          }]|]
            { matchHeaders = [matchContentTypeJson]
            }
