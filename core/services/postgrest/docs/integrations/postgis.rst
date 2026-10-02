.. _ww_postgis:

PostGIS
=======

To work with `PostGIS <https://postgis.net/>`_ data types such as ``geometry`` or ``geography``, you'll need to `install PostGIS <https://postgis.net/documentation/getting_started/>`_ first.

.. code-block:: postgres

  -- Activate the postgis module in the current database
  create extension if not exists postgis;

  create table coverage (
    id int primary key,
    name text unique,
    area geometry
  );

  insert into coverage (id, name, area) values
    (1, 'small', ST_GeomFromText('POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))',4326)),
    (2, 'big', ST_GeomFromText('POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))', 4326);

.. _application/geo+json:

``application/geo+json``
------------------------

PostgREST supports the `standard <https://www.iana.org/assignments/media-types/application/geo+json>`_ ``application/geo+json`` media type which can be used to get the output in `GeoJSON <https://geojson.org/>`_ format. This will work for PostGIS versions 3.0.0 and up and will return the output as a `FeatureCollection Object <https://www.rfc-editor.org/rfc/rfc7946#section-3.3>`_:

.. code-block:: bash

  curl "http://localhost:3000/coverage" \
    -H "Accept: application/geo+json"

.. code-block:: json

  {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [[0,0],[1,0],[1,1],[0,1],[0,0]]
          ]
        },
        "properties": {
          "id": 1,
          "name": "small"
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [[0,0],[10,0],[10,10],[0,10],[0,0]]
          ]
        },
        "properties": {
          "id": 2,
          "name": "big"
        }
      }
    ]
  }

Using generated columns
-----------------------

If you need to add an extra property, like the area in square units by using ``st_area(area)``, you could add a generated column to the table and it will appear in the ``properties`` key of each ``Feature``.

.. code-block:: postgres

  alter table coverage
    add square_units double precision generated always as ( st_area(area) ) stored;

In the case that you are using older PostGIS versions, then creating a function is your best option:

.. code-block:: postgres

  create or replace function coverage_geo_collection() returns json as $$
    select
      json_build_object(
        'type', 'FeatureCollection',
        'features', json_agg(
          json_build_object(
            'type', 'Feature',
            'geometry', st_AsGeoJSON(c.area)::json,
            'properties', json_build_object('id', c.id, 'name', c.name)
          )
        )
      )
    from coverage c;
  $$ language sql;

Now this query will return the same results:

.. code-block:: bash

  curl "http://localhost:3000/rpc/coverage_geo_collection"

.. code-block:: json

  {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [[0,0],[1,0],[1,1],[0,1],[0,0]]
          ]
        },
        "properties": {
          "id": 1,
          "name": "small"
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [[0,0],[10,0],[10,10],[0,10],[0,0]]
          ]
        },
        "properties": {
          "id": 2,
          "name": "big"
        }
      }
    ]
  }

Using string representation
---------------------------

To insert areas in polygon format, you can use string representation:

.. code-block:: bash

  curl "http://localhost:3000/coverage" \
    -X POST -H "Content-Type: application/json" \
    -d @- << EOF
    [
      { "id": 3, "name": "strip", "area": "SRID=4326;POLYGON((0 0, 50 0, 50 2, 0 2, 0 0))" },
      { "id": 4, "name": "diamond", "area": "SRID=4326;POLYGON((5 0, 10 5, 5 10, 0 5, 5 0))" }
    ]
  EOF

PostgREST will automatically cast the ``area`` column into a ``Polygon`` geometry type. 
