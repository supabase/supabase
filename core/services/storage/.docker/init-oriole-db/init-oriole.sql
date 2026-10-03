-- Enable oriole extension and set it as the default for table creation
-- Without running this script oriole db defaults to creating heap tables
CREATE EXTENSION IF NOT EXISTS orioledb;
ALTER DATABASE postgres SET default_table_access_method = 'orioledb';
