create schema v;

-- create a table to store geographic points
create table v.places (
    id serial primary key,
    name text,
    geom geometry(point, 4326)  -- using WGS 84 coordinate system
);

-- insert some sample geographic points into the places table
insert into v.places (name, geom)
values
  ('place_a', st_setsrid(st_makepoint(-73.9857, 40.7484), 4326)),  -- latitude and longitude for a location
  ('place_b', st_setsrid(st_makepoint(-74.0060, 40.7128), 4326)),  -- another location
  ('place_c', st_setsrid(st_makepoint(-73.9687, 40.7851), 4326));  -- yet another location

-- calculate the distance between two points (in meters)
select
  a.name as place_a,
  b.name as place_b,
  st_distance(a.geom::geography, b.geom::geography) as distance_meters
from
  v.places a,
  v.places b
where
  a.name = 'place_a'
  and b.name = 'place_b';

-- find all places within a 5km radius of 'place_a'
select
  name,
  st_distance(
    geom::geography,
    (
      select
        geom
      from
        v.places
      where
        name = 'place_a'
    )::geography) as distance_meters
from
  v.places
where
  st_dwithin(
    geom::geography,
    (select geom from v.places where name = 'place_a')::geography,
    5000
  )
  and name != 'place_a';

drop schema v cascade;
