/*
This test is excluded from the Postgres 17 suite because it does not ship
with the Supabase PG17 image
*/
create extension if not exists timescaledb;

-- Confirm we're running the apache version
show timescaledb.license;

-- Create schema v
create schema v;

-- Create a table in the v schema
create table v.sensor_data (
  time timestamptz not null,
  sensor_id int not null,
  temperature double precision not null,
  humidity double precision not null
);

-- Convert the table to a hypertable
select create_hypertable('v.sensor_data', 'time');

-- Insert some data into the hypertable
insert into v.sensor_data (time, sensor_id, temperature, humidity)
values 
  ('2024-08-09', 1, 22.5, 60.2),
  ('2024-08-08', 1, 23.0, 59.1),
  ('2024-08-07', 2, 21.7, 63.3);

-- Select data from the hypertable
select
  *
from
  v.sensor_data;

-- Drop schema v and all its entities
drop schema v cascade;

