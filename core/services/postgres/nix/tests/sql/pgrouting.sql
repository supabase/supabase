create schema v;

-- create the roads table
create table v.roads (
  id serial primary key,
  source integer,
  target integer,
  cost double precision
);

-- insert sample data into roads table
insert into v.roads (source, target, cost) values
(1, 2, 1.0),
(2, 3, 1.0),
(3, 4, 1.0),
(1, 3, 2.5),
(3, 5, 2.0);

-- create a function to use pgRouting to find the shortest path
select * from pgr_dijkstra(
  'select id, source, target, cost from v.roads',
  1, -- start node
  4  -- end node
);

drop schema v cascade;

