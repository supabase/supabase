---
title: 'Generate Vector Tiles with PostGIS'
description: 'Use PostGIS to programmatically generate Mapbox Vector Tiles and render them with MapLibre GL.'
author: bdon,thor_schaeff
imgSocial: postgis_vector_tiles/overture_postgis_mvt.png
imgThumb: postgis_vector_tiles/overture_postgis_mvt.png
categories:
  - developers
tags:
  - postgres
  - postgis
  - maps
date: '2024-06-26'
toc_depth: 3
---

<Admonition>

[Do you prefer audio-visual learning? Watch the video guide!](https://supabase.link/supa-gis-yt-docs)

[Or jump straight into the code](https://github.com/bdon/supabase-vector-tile)

</Admonition>

[Overture Maps Foundation](https://overturemaps.org/) is a [Joint Development Foundation Project](https://jointdevelopment.org/) initiated by Amazon, Meta, Microsoft, and tomtom, aiming to create reliable, easy-to-use, and interoperable open map data.

Overture Maps allows us to download open map data, like places of interest, as [GeoJSON](https://geojson.org/) which we can transform into SQL and ingest into our Postgres database on Supabase.

Using PostGIS we can then programmatically generate vector tiles and serve them to our MapLibre GL client using supabase-js.

<Admonition>

Vector tiles are packets of geographic data, packaged into pre-defined roughly-square shaped "tiles" for transfer over the web. Map data is requested by a client as a set of "tiles" corresponding to square areas of land of a pre-defined size and location.

Especially for large datasets, this has the benefit that the data transfer is greatly reduced because only data within the current viewport, and at the current zoom level needs to be transferred.

</Admonition>

In this tutorial, you will learn to

- Use Overture Maps to download open map places data in GeoJSON format.
- Use GDAL ogr2ogr to transform GeoJSON into SQL statements.
- Import location data and JSON metadata into your Supabase Postgres database using psql.
- Use PostGIS' `ST_AsMVT` to aggregate a set of rows corresponding to a tile layer into a binary vector tile representation.
- Use MapLibre's `addProtocol` to visualize large PostGIS tables by making remote procedure calls with supabase-js.
- Use supabase-js to fetch additional JSON metadata on demand

## Download open map data with Overture Maps

Overture Maps provides a [python command-line tool](https://docs.overturemaps.org/getting-data/overturemaps-py/) to download data within a region of interest and converts it to several common geospatial file formats.

We can download places in Singapore into a GeoJSON file with this command:

```bash
overturemaps download --bbox=103.570233,1.125077,104.115855,1.490957 -f geojson --type=place -o places.geojson
```

Depending on the size of the bounding box this can take quite some time!

## Transform GeoJSON into SQL

In the next step, we can use [GDAL ogr2ogr](https://gdal.org/programs/ogr2ogr.html) to transform the GeoJSON file into a PostGIS compatible SQL file.

You can install `GDAL` via `homebrew brew install gdal` or follow the [download instructions](https://gdal.org/download.html).

```bash
PG_USE_COPY=true ogr2ogr -f pgdump places.sql places.geojson
```

## Import location data into Supabase

Enable the PostGIS extension on your Supabase Database on a dedicated separate `gis` schema. To do so you can navigate to the [SQL Editor](/dashboard/project/_/sql/new) and run the following SQL, or you can enable the extension from the [Database Extensions Settings](/dashboard/project/_/database/extensions).

As PostGIS can be quite compute heavy, we recommend enabling it on a dedicated separate schema, for example, named `gis`!

```sql
CREATE SCHEMA IF NOT EXISTS "gis";
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "gis";
```

Import the open map data into a `places` table in Supabase:

```bash
psql -h aws-0-us-west-1.pooler.supabase.com -p 5432 -d postgres -U postgres.project-ref < places.sql
```

You can find the credentials in the [project connect page](/dashboard/project/_?showConnect=true) of your Supabase Dashboard.

### Enable RLS and create a public read policy

We want the places data to be available publicly, so we can create a row level security policy that enables public read access.

In your Supabase Dashboard, navigate to the [SQL Editor](/dashboard/project/_/sql/new) and run the following:

```sql
ALTER TABLE "public"."places" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON "public"."places" FOR SELECT USING (true);
```

## Generate vector tiles with PostGIS

To programmatically generate vector tiles on client-side request, we need to create a Postgres function that we can invoke via a [remote procedure call](/docs/reference/javascript/rpc). In your SQL Editor, run:

```sql
CREATE OR REPLACE FUNCTION mvt(z integer, x integer, y integer)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    mvt_output text;
BEGIN
    WITH
    -- Define the bounds of the tile using the provided Z, X, Y coordinates
    bounds AS (
        SELECT ST_TileEnvelope(z, x, y) AS geom
    ),
    -- Transform the geometries from EPSG:4326 to EPSG:3857 and clip them to the tile bounds
    mvtgeom AS (
        SELECT
            -- include the name and id only at zoom 13 to make low-zoom tiles smaller
            CASE
            WHEN z > 13 THEN id
            ELSE NULL
            END AS id,
            CASE
            WHEN z > 13 THEN names::json->>'primary'
            ELSE NULL
            END AS primary_name,
            categories::json->>'main' as main_category,
            ST_AsMVTGeom(
                ST_Transform(wkb_geometry, 3857), -- Transform the geometry to Web Mercator
                bounds.geom,
                4096, -- The extent of the tile in pixels (commonly 256 or 4096)
                0,    -- Buffer around the tile in pixels
                true  -- Clip geometries to the tile extent
            ) AS geom
        FROM
            places, bounds
        WHERE
            ST_Intersects(ST_Transform(wkb_geometry, 3857), bounds.geom)
    )
    -- Generate the MVT from the clipped geometries
    SELECT INTO mvt_output encode(ST_AsMVT(mvtgeom, 'places', 4096, 'geom'),'base64')
    FROM mvtgeom;

    RETURN mvt_output;
END;
$$;
```

To limit the amount of data sent over the wire, we limit the amount of metadata to include in the vector tile. For example we add a condition for the zoom level, and only return the place name when the user has zoomed in beyond level 13.

## Use supabase-js to fetch vector tiles from MapLibre GL client

You can find the full `index.html` code on [GitHub](https://github.com/bdon/supabase-vector-tile/blob/main/index.html). Here we'll highlight how to add a new protocol to MapLibreGL to fetch the bas64 encoded binary vector tile data via supabase-js so that MapLibre GL can fetch and render the data as your users interact with the map:

```js index.html
const client = supabase.createClient('your-supabase-api-url', 'your-supabase-anon-key')

function base64ToArrayBuffer(base64) {
  var binaryString = atob(base64)
  var bytes = new Uint8Array(binaryString.length)
  for (var i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

maplibregl.addProtocol('supabase', async (params, abortController) => {
  const re = new RegExp(/supabase:\/\/(.+)\/(\d+)\/(\d+)\/(\d+)/)
  const result = params.url.match(re)
  const { data, error } = await client.rpc('mvt', {
    z: result[2],
    x: result[3],
    y: result[4],
  })
  const encoded = base64ToArrayBuffer(data)
  if (!error) {
    return { data: encoded }
  } else {
    throw new Error(`Tile fetch error:`)
  }
})
```

With the supabase protocol registered, we can now add it to our MapLibre GL sources on top of a basemap like [Protomaps](https://protomaps.com/) for example:

```js index.html
// ...
const map = new maplibregl.Map({
  hash: true,
  container: 'map',
  style: {
    version: 8,
    glyphs: 'https://cdn.protomaps.com/fonts/pbf/{fontstack}/{range}.pbf',
    sources: {
      supabase: {
        type: 'vector',
        tiles: ['supabase://boston/{z}/{x}/{y}'],
        attribution: '© <a href="https://overturemaps.org">Overture Maps Foundation</a>',
      },
      protomaps: {
        type: 'vector',
        url: 'https://api.protomaps.com/tiles/v3.json?key=your-protomaps-api-key',
        attribution: 'Basemap © <a href="https://openstreetmap.org">OpenStreetMap</a>',
      },
    },
  },
})
// ...
```

## On demand fetch additional JSON metadata

To limit the amount of data sent over the wire, we don't encode all the metadata in the vector tile itself, but rather set up an onclick handler to fetch the additional metadata on demand within the MapLibre GL popup:

```js index.html
// ..
const popup = new maplibregl.Popup({
  closeButton: true,
  closeOnClick: false,
  maxWidth: 'none',
})

function loadDetails(element, id) {
  element.innerHTML = 'loading...'
  client
    .from('places')
    .select(
      `
          websites,
          socials,
          phones,
          addresses,
          source:  sources->0->dataset
        `
    )
    .eq('id', id)
    .single()
    .then(({ data, error }) => {
      if (error) return console.error(error)
      element.parentElement.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`
    })
}

map.on('click', 'overture-pois-text', async (e) => {
  if (e.features.length > 0) {
    const feature = e.features[0]
    console.log(feature)
    popup.setHTML(
      `
        <table style="font-size:12px">
            <tr>
                <td>id:</td>
                <td>${feature.properties.id}</td>
            </tr>
            <tr>
                <td>name:</td>
                <td>${feature.properties.primary_name}</td>
            </tr>
            <tr>
                <td>main_category:</td>
                <td>${feature.properties.main_category}</td>
            </tr>
            <tr>
                <td>details:</td>
                <td>
                  <span onclick="loadDetails(this, '${feature.properties.id}')">
                    load details
                  </span>
                </td>
            </tr>
        </table>
      `
    )
    popup.setLngLat(e.lngLat)
    popup.addTo(map)
  }
})
// ...
```

## Conclusion

PostGIS is incredibly powerful, allowing you to programmatically generate vector tiles from table rows stored in Postgres. Paired with Supabase's auto generated REST API and supabase-js client library you're able to build interactive geospatial applications with ease!

Want to learn more about Maps and PostGIS? Make sure to follow our [Twitter](https://x.com/supabase) and [YouTube](https://www.youtube.com/@Supabase) channels to not miss out! See you then!

## More Supabase

- [Watch the video guide](https://supabase.link/supa-gis-yt-docs)
- [Find the code](https://github.com/bdon/supabase-vector-tile)
- [Self-host Maps on Supabase Storage with Protomaps](https://supabase.link/protomaps-storage-yt)
- [Getting started with PostGIS](https://supabase.link/postgis-quickstart-yt)
- [PostGIS docs guide](/docs/guides/database/extensions/postgis)
