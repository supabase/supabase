begin;
    comment on schema public is '@graphql({"inflect_names": true})';

    create table account(
        id serial primary key,
        email varchar(255) not null,
        priority int,
        status text default 'active'
    );

    create table blog(
        id serial primary key,
        owner_id integer not null references account(id)
    );
    comment on table blog is e'@graphql({"totalCount": {"enabled": true}})';

    -- Make sure functions still work
    create function _echo_email(account)
        returns text
        language sql
    as $$ select $1.email $$;

    /*
        Literals
    */

    select graphql.resolve($$
    mutation {
      insertIntoAccountCollection(objects: [
        { email: "foo@barsley.com", priority: 1 },
        { email: "bar@foosworth.com" }
      ]) {
        affectedCount
        records {
          id
          status
          echoEmail
          blogCollection {
            totalCount
          }
        }
      }
    }
    $$);

    select graphql.resolve($$
    mutation {
      insertIntoBlogCollection(objects: [{
        ownerId: 1
      }]) {
        records {
          id
          owner {
            id
          }
        }
      }
    }
    $$);


    -- Override a default on status with null
    select graphql.resolve($$
    mutation {
      insertIntoAccountCollection(objects: [
        { email: "baz@baz.com", status: null },
      ]) {
        affectedCount
        records {
          email
          status
        }
      }
    }
    $$);


    /*
        Variables
    */

    select graphql.resolve($$
    mutation newAccount($emailAddress: String) {
       xyz: insertIntoAccountCollection(objects: [
        { email: $emailAddress },
        { email: "other@email.com" }
       ]) {
        affectedCount
        records {
          id
          email
        }
      }
    }
    $$,
    variables := '{"emailAddress": "foo@bar.com"}'::jsonb
    );


    -- Variable override of default with null results in null
    select graphql.resolve($$
    mutation newAccount($status: String) {
       xyz: insertIntoAccountCollection(objects: [
        { email: "1@email.com", status: $status}
       ]) {
        affectedCount
        records {
          email
          status
        }
      }
    }
    $$,
    variables := '{"status": null}'::jsonb
    );

    -- Skipping variable override of default results in default
    select graphql.resolve($$
    mutation newAccount($status: String) {
       xyz: insertIntoAccountCollection(objects: [
        { email: "x@y.com", status: $status},
       ]) {
        affectedCount
        records {
          email
          status
        }
      }
    }
    $$,
    variables := '{}'::jsonb
    );


    select graphql.resolve($$
    mutation newAccount($acc: AccountInsertInput!) {
       insertIntoAccountCollection(objects: [$acc]) {
        affectedCount
        records {
          id
          email
        }
      }
    }
    $$,
    variables := '{"acc": {"email": "bar@foo.com"}}'::jsonb
    );

    select graphql.resolve($$
    mutation newAccounts($acc: [AccountInsertInput!]!) {
       insertIntoAccountCollection(objects: $accs) {
        affectedCount
        records {
          id
          email
        }
      }
    }
    $$,
    variables := '{"accs": [{"email": "bar@foo.com"}]}'::jsonb
    );

    -- Single object coerces to a list
    select graphql.resolve($$
    mutation {
      insertIntoBlogCollection(objects: {ownerId: 1}) {
        affectedCount
      }
    }
    $$);


    /*
        Errors
    */

    -- Field does not exist
    select graphql.resolve($$
    mutation createAccount($acc: AccountInsertInput) {
       insertIntoAccountCollection(objects: [$acc]) {
        affectedCount
        records {
          id
          email
        }
      }
    }
    $$,
    variables := '{"acc": {"doesNotExist": "other"}}'::jsonb
    );

    -- Wrong input type (list of string, not list of object)
    select graphql.resolve($$
    mutation {
      insertIntoBlogCollection(objects: ["not an object"]) {
        affectedCount
      }
    }
    $$);

    -- objects argument is missing
    select graphql.resolve($$
    mutation {
      insertIntoBlogCollection {
        affectedCount
      }
    }
    $$);

    -- Empty call
    select graphql.resolve($$
    mutation {
      insertIntoBlogCollection(objects: []) {
        affectedCount
      }
    }
    $$);

rollback;
