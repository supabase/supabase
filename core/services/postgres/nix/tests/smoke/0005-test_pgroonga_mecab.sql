-- File: 0005-test_pgroonga_revised.sql

begin;
    -- Plan for 3 tests: extension, table, and index
    select plan(3);
    
    -- Create the PGroonga extension
    create extension if not exists pgroonga;
    
    -- -- Test 1: Check if PGroonga extension exists
    select has_extension('pgroonga', 'The pgroonga extension should exist.');
    
    -- Create the table
    create table notes(
        id integer primary key,
        content text
    );
    
    -- Test 2: Check if the table was created
    SELECT has_table('public', 'notes', 'The notes table should exist.');    
    -- Create the PGroonga index
    CREATE INDEX pgroonga_content_index
            ON notes
         USING pgroonga (content)
          WITH (tokenizer='TokenMecab');
    
    -- -- Test 3: Check if the index was created
    SELECT has_index('public', 'notes', 'pgroonga_content_index', 'The pgroonga_content_index should exist.');
    
    -- -- Cleanup (this won't affect the test results as they've already been checked)
    DROP INDEX IF EXISTS pgroonga_content_index;
    DROP TABLE IF EXISTS notes;
    
    -- Finish the test plan
    select * from finish();
rollback;