-- Snowflake Extension Initialization
-- Creates the snowflake extension for distributed unique ID generation
-- Required: snowflake.node must be set via SNOWFLAKE_NODE in .env (1-1023, unique per node)

CREATE EXTENSION IF NOT EXISTS snowflake;
