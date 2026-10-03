\ir ../spec/fixtures/load.sql

ALTER TABLE test.complex_items
    DROP CONSTRAINT complex_items_pkey;

ALTER TABLE test.complex_items
    ALTER COLUMN "field-with_sep" DROP NOT NULL;
