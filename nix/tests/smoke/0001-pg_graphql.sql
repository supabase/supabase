-- Start transaction and plan the tests.
begin;
    select plan(1);

    create extension if not exists pg_graphql;

    create table account(
        id int primary key,
        is_verified bool,
        name text,
        phone text
    );

    insert into public.account(id, is_verified, name, phone)
    values
        (1, true, 'foo', '1111111111'),
        (2, true, 'bar', null),
        (3, false, 'baz', '33333333333');

    select is(
      graphql.resolve($$
        {
        accountCollection {
	        edges {
	          node {
		        id
	          }
	        }
          }
        }
        $$),
        '{
           "data": {
             "accountCollection": {
               "edges": [
                 {
                   "node": {
                     "id": 1
                    }
                 },
                 {
                   "node": {
                     "id": 2
                   }
                 },
                 {
                   "node": {
                     "id": 3
                   }
                 }
               ]
             }
           }
        }'::jsonb
    );


    select * from finish();
rollback;
