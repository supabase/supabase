-- testing sql found in https://supabase.com/docs/guides/database/arrays

create table arraytest (
  id integer not null,
  textarray text array
);

INSERT INTO arraytest (id, textarray) VALUES (1, ARRAY['Harry', 'Larry', 'Moe']);;

select * from arraytest;

SELECT textarray[1], array_length(textarray, 1) FROM arraytest;

drop table arraytest cascade;
