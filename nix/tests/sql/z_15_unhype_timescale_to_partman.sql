/*

The purpose of this test is to validate the method of moving from Timescale Hypertables to Postgres native partitioned tables
managed by pg_partman

*/

CREATE SCHEMA ts;

-- Create a table for time-series data
CREATE TABLE ts.readings (
    time TIMESTAMPTZ NOT NULL,
    sensor_id INT NOT NULL,
    value DOUBLE PRECISION NOT NULL
);

-- Convert the table into a hypertable
SELECT create_hypertable('ts.readings',  by_range('time', INTERVAL '1 day'));

-- Convert default 7 day chunk interval
SELECT set_chunk_time_interval('ts.readings', INTERVAL '24 hours');

-- Insert sample data
INSERT INTO ts.readings (time, sensor_id, value)
SELECT 
    time_series AS time,
    FLOOR(RANDOM() * 10 + 1)::INT AS sensor_id, -- Random sensor_id between 1 and 10
    RANDOM() * 100 AS value -- Random value between 0 and 100
FROM 
    generate_series(
        '2023-01-19 00:00:00+00'::TIMESTAMPTZ, 
        '2025-03-26 03:00:00+00'::TIMESTAMPTZ, 
        INTERVAL '1 second'
    ) AS time_series
LIMIT 600000;

-- List hypertables
SELECT * FROM timescaledb_information.hypertables;

-- Rename hypertable
ALTER TABLE ts.readings RENAME TO ht_readings;

-- Create copy of hypertable with original name
CREATE TABLE ts.readings (LIKE ts.ht_readings) PARTITION BY RANGE(time);

-- Configure pg_partman for daily partitions on sensor_data
SELECT partman.create_parent(
    p_parent_table := 'ts.readings',
    p_control := 'time',
    p_type := 'range',
    p_interval := '1 day',
    p_premake := 7, -- Create partitions for the next 7 days
    p_start_partition := '2023-01-19 00:00:00+00' -- Start date for partitioning
);

INSERT INTO ts.readings SELECT * FROM ts.ht_readings;

DROP SCHEMA ts CASCADE;