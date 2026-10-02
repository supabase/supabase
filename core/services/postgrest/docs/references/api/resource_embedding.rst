.. _resource_embedding:

Resource Embedding
##################

PostgREST allows including related resources in a single API call. This reduces the need for many API requests.

.. _fk_join:

Foreign Key Joins
=================

The server uses **Foreign Keys** to determine which database objects can be joined together. It supports joining tables, views and
table-valued functions.

- For tables, it generates a join condition using the foreign keys columns (respecting composite keys).
- For views, it generates a join condition using the views' base tables foreign key columns.
- For table-valued functions, it generates a join condition based on the foreign key columns of the returned table type.

.. important::

  - Whenever foreign keys change you must do :ref:`schema_reloading` for this feature to work.

Relationships
=============

For example, consider a database of films and their awards:

.. _erd_film:

.. tabs::

  .. group-tab:: ERD

    .. image:: ../../_static/film.png

  .. code-tab:: postgresql SQL

    create table actors(
      id int primary key generated always as identity,
      first_name text,
      last_name text
    );

    create table directors(
      id int primary key generated always as identity,
      first_name text,
      last_name text
    );

    create table films(
      id int primary key generated always as identity,
      director_id int references directors(id),
      title text,
      year int,
      rating numeric(3,1),
      language text
    );

    create table technical_specs(
      film_id int references films(id) primary key,
      runtime time,
      camera text,
      sound text
    );

    create table roles(
      film_id int references films(id),
      actor_id int references actors(id),
      character text,
      primary key(film_id, actor_id)
    );

    create table competitions(
      id int primary key generated always as identity,
      name text,
      year int
    );

    create table nominations(
      competition_id int references competitions(id),
      film_id int references films(id),
      rank int,
      primary key (competition_id, film_id)
    );

.. _many-to-one:

Many-to-one relationships
-------------------------

Since ``films`` has a **foreign key** to ``directors``, this establishes a many-to-one relationship. This enables us to request all the films and the director for each film.

.. code-block:: bash

  curl "http://localhost:3000/films?select=title,directors(id,last_name)"

.. code-block:: json

  [
    { "title": "Workers Leaving The Lumière Factory In Lyon",
      "directors": {
        "id": 2,
        "last_name": "Lumière"
      }
    },
    { "title": "The Dickson Experimental Sound Film",
      "directors": {
        "id": 1,
        "last_name": "Dickson"
      }
    },
    { "title": "The Haunted Castle",
      "directors": {
        "id": 3,
        "last_name": "Méliès"
      }
    }
  ]

Note that the embedded ``directors`` is returned as a JSON object because of the "to-one" end.

Since the table name is plural, we can be more accurate by making it singular with an alias.

.. code-block:: bash

  curl "http://localhost:3000/films?select=title,director:directors(id,last_name)"

.. code-block:: json

  [
    { "title": "Workers Leaving The Lumière Factory In Lyon",
      "director": {
        "id": 2,
        "last_name": "Lumière"
      }
    },
    ".."
  ]

.. _one-to-many:

One-to-many relationships
-------------------------

The **foreign key reference** establishes the inverse one-to-many relationship. In this case, ``films`` returns as a JSON array because of the "to-many" end.

.. code-block:: bash

  curl "http://localhost:3000/directors?select=last_name,films(title)"

.. code-block:: json

  [
    { "last_name": "Lumière",
      "films": [
        {"title": "Workers Leaving The Lumière Factory In Lyon"}
      ]
    },
    { "last_name": "Dickson",
      "films": [
        {"title": "The Dickson Experimental Sound Film"}
      ]
    },
    { "last_name": "Méliès",
      "films": [
        {"title": "The Haunted Castle"}
      ]
    }
  ]

.. _many-to-many:

Many-to-many relationships
--------------------------

The join table determines many-to-many relationships. It must contain foreign keys to other two tables and they must be part of its composite key. In the :ref:`sample film database <erd_film>`, ``roles`` is taken as a join table.

The join table is also detected if the composite key has additional columns.

.. code-block:: postgres

  create table roles(
    id int generated always as identity,
  , film_id int references films(id)
  , actor_id int references actors(id)
  , character text,
  , primary key(id, film_id, actor_id)
  );

.. code-block:: bash

  curl "http://localhost:3000/actors?select=first_name,last_name,films(title)"

.. code-block:: json

  [
    { "first_name": "Willem",
      "last_name": "Dafoe",
      "films": [
        {"title": "The Lighthouse"}
      ]
    },
    ".."
  ]

.. _one-to-one:

One-to-one relationships
------------------------

One-to-one relationships are detected in two ways. (We'll use the ``films`` and ``technical_specs`` tables from the :ref:`sample film database <erd_film>` as an example).

- When the foreign key is also a primary key.

  .. code-block:: postgres

    create table technical_specs(
      film_id int references films(id) primary key
    -- ...
    );

- Or when the foreign key has a unique constraint.

  .. code-block:: postgres

    create table technical_specs(
      id int primary key
    , film_id int references films(id) unique
    -- ...
    );

.. code-block:: bash

  curl "http://localhost:3000/films?select=title,technical_specs(camera)"

.. code-block:: json

  [
    {
      "title": "Pulp Fiction",
      "technical_specs": {"camera": "Arriflex 35-III"}
    },
    ".."
  ]

.. _computed_relationships:

Computed Relationships
======================

You can manually define relationships by using functions. This is useful for database objects that can't define foreign keys, like `Foreign Data Wrappers <https://wiki.postgresql.org/wiki/Foreign_data_wrappers>`_.

Computed relationships have good performance as their intended design enable `function inlining <https://wiki.postgresql.org/wiki/Inlining_of_SQL_functions#Inlining_conditions_for_table_functions>`_.

.. important::

  - Always use ``SETOF`` when creating computed relationships. Functions can return a table without using ``SETOF``, but bear in mind that PostgreSQL will not inline them. e.g. ``RETURNS <table_name>`` is not inlinable.

Assuming there's a foreign table ``premieres`` that we want to relate to ``films``.

.. code-block:: postgres

  create foreign table premieres (
    id integer,
    location text,
    "date" date,
    film_id integer
  ) server import_csv options ( filename '/tmp/directors.csv', format 'csv');

  create function film(premieres) returns setof films rows 1 as $$
    select * from films where id = $1.film_id
  $$ stable language sql;

The above function defines a relationship between ``premieres`` (the parameter) and ``films`` (the return type). Since there's a ``rows 1``, this defines a many-to-one relationship.
The name of the function ``film`` is arbitrary and can be used to do the embedding:

.. code-block:: bash

  curl "http://localhost:3000/premieres?select=location,film(name)"

.. code-block:: json

  [
    {
      "location": "Cannes Film Festival",
      "film": {"name": "Pulp Fiction"}
    },
    ".."
  ]

.. warning::

  - Make sure to correctly label the ``to-one`` part of the relationship. When using the ``ROWS 1`` estimation, PostgREST will expect a single row to be returned. If that is not the case, it will unnest the embedding and return repeated values for the top level resource.

Now let's define the opposite one-to-many relationship.

.. code-block:: postgres

  create function premieres(films) returns setof premieres as $$
    select * from premieres where film_id = $1.id
  $$ stable language sql;

In this case there's an implicit ``ROWS 1000`` defined by PostgreSQL(`search "result_rows" on this PostgreSQL doc <https://www.postgresql.org/docs/current/sql-createfunction.html>`_).
We consider any value greater than 1 as "many" so this defines a one-to-many relationship.

.. code-block:: bash

  curl "http://localhost:3000/films?select=name,premieres(name)"

.. code-block:: json

  [
    {
      "name": "Pulp Ficiton",
      "premieres": [{"location": "Cannes Festival"}]
    },
    ".."
  ]

Overriding Relationships
------------------------

Computed relationships also allow you to override the ones that PostgREST auto-detects.

For example, to override the :ref:`many-to-one relationship <many-to-one>` between ``films`` and ``directors``.

.. code-block:: postgres

  create function directors(films) returns setof directors rows 1 as $$
    select * from directors where id = $1.director_id
  $$ stable language sql;

Thanks to overloaded functions, you can use the same function name for different parameters. Thus define relationships from other tables/views to directors.

.. code-block:: postgres

  create function directors(film_schools) returns setof directors as $$
    select * from directors where film_school_id = $1.id
  $$ stable language sql;

Computed relationships have good performance as their intended design enable `function inlining <https://wiki.postgresql.org/wiki/Inlining_of_SQL_functions#Inlining_conditions_for_table_functions>`_.

.. _embed_disamb:
.. _target_disamb:
.. _hint_disamb:
.. _complex_rels:

Foreign Key Joins on Multiple Foreign Key Relationships
=======================================================

When there are multiple foreign keys between tables, :ref:`fk_join` need disambiguation to resolve which foreign key columns to use for the join.
To do this, you can specify a foreign key by using the ``!<fk>`` syntax.

.. _multiple_m2o:

Multiple Many-To-One
--------------------

For example, suppose you have the following ``orders`` and ``addresses`` tables:

.. tabs::

  .. group-tab:: ERD

    .. image:: ../../_static/orders.png

  .. code-tab:: postgresql SQL

    create table addresses (
      id int primary key generated always as identity,
      name text,
      city text,
      state text,
      postal_code char(5)
    );

    create table orders (
      id int primary key generated always as identity,
      name text,
      billing_address_id int,
      shipping_address_id int,
      constraint billing  foreign key(billing_address_id) references addresses(id),
      constraint shipping foreign key(shipping_address_id) references addresses(id)
    );

Since the ``orders`` table has two foreign keys to the ``addresses`` table, a foreign key join is ambiguous and PostgREST will respond with an error:

.. code-block:: bash

  curl "http://localhost:3000/orders?select=*,addresses(*)" -i


.. code-block:: http

   HTTP/1.1 300 Multiple Choices

.. code-block:: json

   {
     "code": "PGRST201",
     "details": [
       {
         "cardinality": "many-to-one",
         "embedding": "orders with addresses",
         "relationship": "billing using orders(billing_address_id) and addresses(id)"
       },
       {
         "cardinality": "many-to-one",
         "embedding": "orders with addresses",
         "relationship": "shipping using orders(shipping_address_id) and addresses(id)"
       }
     ],
     "hint": "Try changing 'addresses' to one of the following: 'addresses!billing', 'addresses!shipping'. Find the desired relationship in the 'details' key.",
     "message": "Could not embed because more than one relationship was found for 'orders' and 'addresses'"
   }

To successfully join ``orders`` with ``addresses``, we can follow the error ``hint`` which tells us to add the foreign key name as ``!billing`` or ``!shipping``.
Note that the foreign keys have been named explicitly in the :ref:`SQL definition above <multiple_m2o>`. To make the result clearer we'll also alias the tables:

.. code-block:: bash

  # curl "http://localhost:3000/orders?select=name,billing_address:addresses!billing(name),shipping_address:addresses!shipping(name)"

  curl --get "http://localhost:3000/orders" \
    -d "select=name,billing_address:addresses!billing(name),shipping_address:addresses!shipping(name)"

.. code-block:: json

   [
     {
       "name": "Personal Water Filter",
       "billing_address": {
         "name": "32 Glenlake Dr.Dearborn, MI 48124"
       },
       "shipping_address": {
         "name": "30 Glenlake Dr.Dearborn, MI 48124"
       }
     }
   ]

.. _multiple_o2m:

Multiple One-To-Many
--------------------

Let's take the tables from :ref:`multiple_m2o`. To get the opposite one-to-many relationship, we can also specify the foreign key name:

.. code-block:: bash

  # curl "http://localhost:3000/addresses?select=name,billing_orders:orders!billing(name),shipping_orders!shipping(name)&id=eq.1"

  curl --get "http://localhost:3000/addresses" \
    -d "select=name,billing_orders:orders!billing(name),shipping_orders!shipping(name)" \
    -d "id=eq.1"

.. code-block:: json

   [
     {
       "name": "32 Glenlake Dr.Dearborn, MI 48124",
       "billing_orders": [
         { "name": "Personal Water Filter" },
         { "name": "Coffee Machine" }
       ],
       "shipping_orders": [
         { "name": "Coffee Machine" }
       ]
     }
   ]

Recursive Relationships
-----------------------

To disambiguate recursive relationships, PostgREST requires :ref:`computed_relationships`.

.. _recursive_o2o_embed:

Recursive One-To-One
~~~~~~~~~~~~~~~~~~~~

.. tabs::

  .. group-tab:: ERD

    .. image:: ../../_static/presidents.png

  .. code-tab:: postgresql SQL

    create table presidents (
      id int primary key generated always as identity,
      first_name text,
      last_name text,
      predecessor_id int references presidents(id) unique
    );

To get either side of the Recursive One-To-One relationship, create the functions:

.. code-block:: postgres

  create or replace function predecessor(presidents) returns setof presidents rows 1 as $$
    select * from presidents where id = $1.predecessor_id
  $$ stable language sql;

  create or replace function successor(presidents) returns setof presidents rows 1 as $$
    select * from presidents where predecessor_id = $1.id
  $$ stable language sql;

Now, to query a president with their predecessor and successor:

.. code-block:: bash

  # curl "http://localhost:3000/presidents?select=last_name,predecessor(last_name),successor(last_name)&id=eq.2"

  curl --get "http://localhost:3000/presidents" \
    -d "select=last_name,predecessor(last_name),successor(last_name)" \
    -d "id=eq.2"

.. code-block:: json

  [
    {
      "last_name": "Adams",
      "predecessor": {
        "last_name": "Washington"
      },
      "successor": {
        "last_name": "Jefferson"
      }
    }
  ]

.. _recursive_o2m_embed:

Recursive One-To-Many
~~~~~~~~~~~~~~~~~~~~~

.. tabs::

  .. group-tab:: ERD

    .. image:: ../../_static/employees.png

  .. code-tab:: postgresql SQL

    create table employees (
      id int primary key generated always as identity,
      first_name text,
      last_name text,
      supervisor_id int references employees(id)
    );

To get the One-To-Many embedding, that is, the supervisors with their supervisees, create a function like this one:

.. code-block:: postgres

  create or replace function supervisees(employees) returns setof employees as $$
    select * from employees where supervisor_id = $1.id
  $$ stable language sql;

Now, the query would be:

.. code-block:: bash

  # curl "http://localhost:3000/employees?select=last_name,supervisees(last_name)&id=eq.1"

  curl --get "http://localhost:3000/employees" \
    -d "select=last_name,supervisees(last_name)" \
    -d "id=eq.1"

.. code-block:: json

  [
    {
      "name": "Taylor",
      "supervisees": [
        { "name": "Johnson" },
        { "name": "Miller" }
      ]
    }
  ]

.. _recursive_m2o_embed:

Recursive Many-To-One
~~~~~~~~~~~~~~~~~~~~~~

Let's take the same ``employees`` table from :ref:`recursive_o2m_embed`.
To get the Many-To-One relationship, that is, the employees with their respective supervisor, you need to create a function like this one:

.. code-block:: postgres

  create or replace function supervisor(employees) returns setof employees rows 1 as $$
    select * from employees where id = $1.supervisor_id
  $$ stable language sql;

Then, the query would be:

.. code-block:: bash

  # curl "http://localhost:3000/employees?select=last_name,supervisor(last_name)&id=eq.3"

  curl --get "http://localhost:3000/employees" \
    -d "select=last_name,supervisor(last_name)" \
    -d "id=eq.3"

.. code-block:: json

  [
    {
      "last_name": "Miller",
      "supervisor": {
        "last_name": "Taylor"
      }
    }
  ]

.. _recursive_m2m_embed:

Recursive Many-To-Many
~~~~~~~~~~~~~~~~~~~~~~

.. tabs::

  .. group-tab:: ERD

    .. image:: ../../_static/users.png

  .. code-tab:: postgresql SQL

    create table users (
      id int primary key generated always as identity,
      first_name text,
      last_name text,
      username text unique
    );

    create table subscriptions (
      subscriber_id int references users(id),
      subscribed_id int references users(id),
      type text,
      primary key (subscriber_id, subscribed_id)
    );

To get all the subscribers of a user as well as the ones they're following, define these functions:

.. code-block:: postgres

  create or replace function subscribers(users) returns setof users as $$
    select u.*
    from users u,
         subscriptions s
    where s.subscriber_id = u.id and
          s.subscribed_id = $1.id
  $$ stable language sql;

  create or replace function following(users) returns setof users as $$
    select u.*
    from users u,
         subscriptions s
    where s.subscribed_id = u.id and
          s.subscriber_id = $1.id
  $$ stable language sql;

Then, the request would be:

.. code-block:: bash

  # curl "http://localhost:3000/users?select=username,subscribers(username),following(username)&id=eq.4"

  curl --get "http://localhost:3000/users" \
    -d "select=username,subscribers(username),following(username)" \
    -d "id=eq.4"

.. code-block:: json

   [
     {
       "username": "the_top_artist",
       "subscribers": [
         { "username": "patrick109" },
         { "username": "alicia_smith" }
       ],
       "following": [
         { "username": "top_streamer" }
       ]
     }
   ]

.. _embedding_partitioned_tables:

Foreign Key Joins on Partitioned Tables
=======================================

Foreign Key joins can also be done between `partitioned tables <https://www.postgresql.org/docs/current/ddl-partitioning.html>`_ and other tables.

For example, let's create the ``box_office`` partitioned table that has the gross daily revenue of a film:

.. tabs::

  .. group-tab:: ERD

    .. image:: ../../_static/boxoffice.png

  .. code-tab:: postgresql SQL

    CREATE TABLE box_office (
      bo_date DATE NOT NULL,
      film_id INT REFERENCES films NOT NULL,
      gross_revenue DECIMAL(12,2) NOT NULL,
      PRIMARY KEY (bo_date, film_id)
    ) PARTITION BY RANGE (bo_date);

    -- Let's also create partitions for each month of 2021

    CREATE TABLE box_office_2021_01 PARTITION OF box_office
    FOR VALUES FROM ('2021-01-01') TO ('2021-01-31');

    CREATE TABLE box_office_2021_02 PARTITION OF box_office
    FOR VALUES FROM ('2021-02-01') TO ('2021-02-28');

    -- and so until december 2021

Since it contains the ``films_id`` foreign key, it is possible to join ``box_office`` and ``films``:

.. code-block:: bash

  # curl "http://localhost:3000/box_office?select=bo_date,gross_revenue,films(title)&gross_revenue=gte.1000000"

  curl --get "http://localhost:3000/box_office" \
    -d "select=bo_date,gross_revenue,films(title)" \
    -d "gross_revenue=gte.1000000"

.. note::

  * Foreign key joins on partitions is not allowed because it leads to ambiguity errors (see :ref:`embed_disamb`) between them and their parent partitioned table. More details at `#1783(comment) <https://github.com/PostgREST/postgrest/issues/1783#issuecomment-959823827>`_). :ref:`computed_relationships` can be used if this is needed.

  * Partitioned tables can reference other tables since PostgreSQL 11 but can only be referenced from any other table since PostgreSQL 12.

.. _embedding_views:

Foreign Key Joins on Views
==========================

PostgREST will infer the foreign keys of a view using its base tables. Base tables are the ones referenced in the ``FROM`` and ``JOIN`` clauses of the view definition.
The foreign keys' columns must be present in the top ``SELECT`` clause of the view for this to work.

For instance, the following view has ``nominations``, ``films`` and ``competitions`` as base tables:

.. code-block:: postgres

  CREATE VIEW nominations_view AS
    SELECT
       films.title as film_title
     , competitions.name as competition_name
     , nominations.rank
     , nominations.film_id as nominations_film_id
     , films.id as film_id
    FROM nominations
    JOIN films ON films.id = nominations.film_id
    JOIN competitions ON competitions.id = nominations.competition_id;

Since this view contains ``nominations.film_id``, which has a **foreign key** relationship to ``films``, then we can join the ``films`` table. Similarly, because the view contains ``films.id``, then we can also join the ``roles`` and the ``actors`` tables (the last one in a many-to-many relationship):

.. code-block:: bash

  # curl "http://localhost:3000/nominations_view?select=film_title,films(language),roles(character),actors(last_name,first_name)&rank=eq.5"

  curl --get "http://localhost:3000/nominations_view" \
    -d "select=film_title,films(language),roles(character),actors(last_name,first_name)" \
    -d "rank=eq.5"

It's also possible to foreign key join `Materialized Views <https://www.postgresql.org/docs/current/rules-materializedviews.html>`_.

.. important::

  - It's not guaranteed that foreign key joins will work on all kinds of views. In particular, foreign key joins won't work on views that contain UNIONs.

    + Why? PostgREST detects base table foreign keys in the view by querying and parsing `pg_rewrite <https://www.postgresql.org/docs/current/catalog-pg-rewrite.html>`_.
      This may fail depending on the complexity of the view.
    + As a workaround, you can use :ref:`computed_relationships` to define manual relationships for views.

  - If view definitions change you must refresh PostgREST's schema cache for this to work properly. See the section :ref:`schema_reloading`.

.. _embedding_view_chains:

Foreign Key Joins on Chains of Views
------------------------------------

Views can also depend on other views, which in turn depend on the actual base table. For PostgREST to pick up those chains recursively to any depth, all the views must be in the search path, so either in the exposed schema (:ref:`db-schemas`) or in one of the schemas set in :ref:`db-extra-search-path`. This does not apply to the base table, which could be in a private schema as well. See :ref:`schema_isolation` for more details.

.. _function_embed:

Foreign Key Joins on Table-Valued Functions
===========================================

If you have a :ref:`Function <functions>` that returns a table type, you can do a Foreign Key join on the result.

Here's a sample function (notice the ``RETURNS SETOF films``).

.. code-block:: postgres

  CREATE FUNCTION getallfilms() RETURNS SETOF films AS $$
    SELECT * FROM films;
  $$ LANGUAGE SQL STABLE;

A request with ``directors`` embedded:

.. code-block:: bash

   # curl "http://localhost:3000/rpc/getallfilms?select=title,directors(id,last_name)&title=like.*Workers*"

   curl --get "http://localhost:3000/rpc/getallfilms" \
     -d "select=title,directors(id,last_name)" \
     -d "title=like.*Workers*"

.. code-block:: json

   [
     { "title": "Workers Leaving The Lumière Factory In Lyon",
       "directors": {
         "id": 2,
         "last_name": "Lumière"
       }
     }
   ]

.. _mutation_embed:

Foreign Key Joins on Writes
===========================

You can join related database objects after doing :ref:`insert`, :ref:`update` or :ref:`delete`.

Say you want to insert a **film** and then get some of its attributes plus join its **director**.

.. code-block:: bash

  curl "http://localhost:3000/films?select=title,year,director:directors(first_name,last_name)" \
    -H "Prefer: return=representation" \
    -d @- << EOF
    {
      "id": 100,
      "director_id": 40,
      "title": "127 hours",
      "year": 2010,
      "rating": 7.6,
      "language": "english"
    }
  EOF

Response:

.. code-block:: json

   {
    "title": "127 hours",
    "year": 2010,
    "director": {
      "first_name": "Danny",
      "last_name": "Boyle"
    }
   }

.. _nested_embedding:

Nested Embedding
================

If you want to embed through join tables but need more control on the intermediate resources, you can do nested embedding. For instance, you can request the Actors, their Roles and the Films for those Roles:

.. code-block:: bash

  curl "http://localhost:3000/actors?select=roles(character,films(title,year))"

.. _embed_filters:

Embedded Filters
================

Embedded resources can be shaped similarly to their top-level counterparts. To do so, prefix the query parameters with the name of the embedded resource. For instance, to order the actors in each film:

.. code-block:: bash

  # curl "http://localhost:3000/films?select=*,actors(*)&actors.order=last_name,first_name"

  curl --get "http://localhost:3000/films" \
    -d "select=*,actors(*)" \
    -d "actors.order=last_name,first_name"

This sorts the list of actors in each film but does *not* change the order of the films themselves. To filter the roles returned with each film:

.. code-block:: bash

  # curl "http://localhost:3000/films?select=*,roles(*)&roles.character=in.(Chico,Harpo,Groucho)"

  curl --get "http://localhost:3000/films" \
    -d "select=*,roles(*)" \
    -d "roles.character=in.(Chico,Harpo,Groucho)"

Once again, this restricts the roles included to certain characters but does not filter the films in any way. Films without any of those characters would be included along with empty character lists.

An ``or`` filter can be used for a similar operation:

.. code-block:: bash

  # curl "http://localhost:3000/films?select=*,roles(*)&roles.or=(character.eq.Gummo,character.eq.Zeppo)"

  curl --get "http://localhost:3000/films" \
   -d "select=*,roles(*)" \
   -d "roles.or=(character.eq.Gummo,character.eq.Zeppo)"

However, this only works for columns inside ``roles``. See :ref:`how to use "or" across multiple resources <or_embed_rels>`.

Limit and offset operations are possible:

.. code-block:: bash

  # curl "http://localhost:3000/films?select=*,actors(*)&actors.limit=10&actors.offset=2"

  curl --get "http://localhost:3000/films" \
    -d "select=*,actors(*)" \
    -d "actors.limit=10" \
    -d "actors.offset=2"

Embedded resources can be aliased and filters can be applied on these aliases:

.. code-block:: bash

  # curl "http://localhost:3000/films?select=*,actors(*)&actors.limit=10&actors.offset=2"

  curl --get "http://localhost:3000/films" \
    -d "select=*,90_comps:competitions(name),91_comps:competitions(name)" \
    -d "90_comps.year=eq.1990" \
    -d "91_comps.year=eq.1991"

Filters can also be applied on nested embedded resources:

.. code-block:: bash

  # curl "http://localhost:3000/films?select=*,roles(*,actors(*))&roles.actors.order=last_name&roles.actors.first_name=like.*Tom*"

  curl --get "http://localhost:3000/films" \
    -d "select=*,roles(*,actors(*))" \
    -d "roles.actors.order=last_name" \
    -d "roles.actors.first_name=like.*Tom*"

The result will show the nested actors named Tom and order them by last name. Aliases can also be used instead of the resource names to filter the nested tables.

.. _embedding_top_level_filter:

Top-level Filtering
===================

By default, :ref:`embed_filters` don't change the top-level resource(``films``) rows at all:

.. code-block:: bash

  # curl "http://localhost:3000/films?select=title,actors(first_name,last_name)&actors.first_name=eq.Jehanne

  curl --get "http://localhost:3000/films" \
    -d "select=title,actors(first_name,last_name)" \
    -d "actors.first_name=eq.Jehanne"

.. code-block:: json

  [
    {
      "title": "Workers Leaving The Lumière Factory In Lyon",
      "actors": []
    },
    {
      "title": "The Dickson Experimental Sound Film",
      "actors": []
    },
    {
      "title": "The Haunted Castle",
      "actors": [
        {
          "first_name": "Jehanne",
          "last_name": "d'Alcy"
        }
      ]
    }
  ]

In order to filter the top level rows you need to add ``!inner`` to the embedded resource. For instance, to get **only** the films that have an actor named ``Jehanne``:

.. code-block:: bash

  # curl "http://localhost:3000/films?select=title,actors!inner(first_name,last_name)&actors.first_name=eq.Jehanne"

  curl --get "http://localhost:3000/films" \
    -d "select=title,actors!inner(first_name,last_name)" \
    -d "actors.first_name=eq.Jehanne"

.. code-block:: json

  [
    {
      "title": "The Haunted Castle",
      "actors": [
        {
          "first_name": "Jehanne",
          "last_name": "d'Alcy"
        }
      ]
    }
  ]

.. _null_embed:

Null filtering on Embedded Resources
------------------------------------

Null filtering on the embedded resources can behave the same as ``!inner``. While providing more flexibility.

For example, doing ``actors=not.is.null`` returns the same result as ``actors!inner(*)``:

.. code-block:: bash

  # curl "http://localhost:3000/films?select=title,actors(*)&actors=not.is.null"

  curl --get "http://localhost:3000/films" \
    -d "select=title,actors(*)" \
    -d "actors=not.is.null"

The ``is.null`` filter can be used in embedded resources to perform an anti-join. To get all the films that do not have any nominations:

.. code-block:: bash

  # curl "http://localhost:3000/films?select=title,nominations()&nominations=is.null"

  curl --get "http://localhost:3000/films" \
    -d "select=title,nominations()" \
    -d "nominations=is.null"


Both ``is.null`` and ``not.is.null`` can be included inside the `or` operator. For instance, to get the films that have no actors **or** directors registered yet:

.. code-block:: bash

  # curl "http://localhost:3000/films?select=title,nominations()&nominations=is.null"

  curl --get "http://localhost:3000/films" \
    -d select=title,actors(*),directors(*)" \
    -d "or=(actors.is.null,directors.is.null)"

.. _or_embed_rels:

OR filtering across Embedded Resources
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

You can also use ``not.is.null`` to make an ``or`` filter across multiple resources.
For instance, to show the films with actors **or** directors named John:

.. code-block:: bash

  # curl "http://localhost:3000/films?select=title,actors(),directors()&directors.first_name=eq.John&actors.first_name=eq.John&or=(directors.not.is.null,actors.not.is.null)"

  curl --get "http://localhost:3000/films" \
    -d "select=title,actors(),directors()" \
    -d "directors.first_name=eq.John" \
    -d "actors.first_name=eq.John" \
    -d "or=(directors.not.is.null,actors.not.is.null)"

.. code-block:: json

  [
    { "title": "Pulp Fiction" },
    { "title": "The Thing" },
    ".."
  ]

Here, we use :ref:`empty embeds <empty_embed>` because retrieving their info would be restricted by the filters.
For example, the ``directors`` embedding would return ``null`` if its ``first_name`` is not John.
To solve this, you need to add extra embedded resources and use the empty ones for filtering.
From the above example:

.. code-block:: bash

  # curl "http://localhost:3000/films?select=title,act:actors(),dir:directors(),actors(first_name),directors(first_name)&dir.first_name=eq.John&act.first_name=eq.John&or=(dir.not.is.null,act.not.is.null)"

  curl --get "http://localhost:3000/films" \
    # We need to use aliases like "act" and "dir" to filter the empty embeds
    -d "select=title,act:actors(),dir:directors(),actors(first_name),directors(first_name)" \
    -d "dir.first_name=eq.John" \
    -d "act.first_name=eq.John" \
    -d "or=(dir.not.is.null,act.not.is.null)"

.. code-block:: json

  [
    {
      "title": "Pulp Fiction",
      "actors": [
        { "first_name": "John" },
        { "first_name": "Samuel" },
        { "first_name": "Uma" },
        ".."
      ]
      "directors": {
        "first_name": "Quentin"
      }
    },
    ".."
  ]

.. _empty_embed:

Empty Embed
-----------

You can leave an embedded resource empty, this helps with filtering in some cases.

To filter the films by actors but not include them:

.. code-block:: bash

  # curl "http://localhost:3000/films?select=title,actors()&actors.first_name=eq.Jehanne&actors=not.is.null"

  curl --get "http://localhost:3000/films" \
    -d "select=title,actors()" \
    -d "actors.first_name=eq.Jehanne" \
    -d "actors=not.is.null"

.. code-block:: json

  [
    {
      "title": "The Haunted Castle",
    }
  ]

.. _top_level_order:

Top-level Ordering
==================

On :ref:`Many-to-One <many-to-one>` and :ref:`One-to-One <one-to-one>` relationships, you can use a column of the "to-one" end to sort the top-level.

For example, to arrange the films in descending order using the director's last name.

.. code-block:: bash

  # curl "http://localhost:3000/films?select=title,directors(last_name)&order=directors(last_name).desc"

  curl --get "http://localhost:3000/films" \
    -d "select=title,directors(last_name)" \
    -d "order=directors(last_name).desc"

.. _spread_embed:

Spread embedded resource
========================

You can modify the shape of the embedded resources by using the spread syntax (``...``).

.. _spread_to_one_embed:

Spread To-One relationships
---------------------------

Spread on resources forming :ref:`one-to-one <one-to-one>` and :ref:`many-to-one <many-to-one>` relationships, will lift the embedded columns to the top object.

.. code-block:: bash

  curl --get "http://localhost:3000/films" \
    -d "select=title,...directors(director_first_name:first_name, director_last_name:last_name)" \
    -d "title=like.*Workers*"

.. code-block:: json

   [
     {
       "title": "Workers Leaving The Lumière Factory In Lyon",
       "director_first_name": "Louis",
       "director_last_name": "Lumière"
     }
   ]

Note that there is no wrapping ``"directors"`` object, unlike regularly embedding :ref:`many-to-one <many-to-one>` relationships. Also note that embedded columns can be aliased normally.

.. _spread_to_many_embed:

Spread To-Many relationships
----------------------------

Spread on resources forming :ref:`one-to-many <one-to-many>` and :ref:`many-to-many <many-to-many>` relationships, will convert the embedded columns into correlated arrays.

.. code-block:: bash

  curl --get "http://localhost:3000/directors" \
    -d "select=first_name,...films(film_titles:title,film_years:year)" \
    -d "first_name=like.Quentin*"

.. code-block:: json

   [
     {
       "first_name": "Quentin",
       "film_titles": [
         "Pulp Fiction",
         "Reservoir Dogs"
       ],
       "film_years": [
         1994,
         1992
       ]
     }
   ]

Note that ``films`` is no longer an array of objects, unlike regularly embedding :ref:`one-to-many`. The embedded columns become arrays and they're correlated-in the above result, we can say that "Pulp Fiction" premiered in 1994 and "Reservoir Dogs" in 1992.

Order in spread to-many
~~~~~~~~~~~~~~~~~~~~~~~

In the above example, the order of the values inside the correlated arrays is unspecified, but all the values are guaranteed to be in the same unspecified order.

You can order the correlated arrays explicitly. For example, to order by the film year:

.. code-block:: bash

  curl --get "http://localhost:3000/directors" \
    -d "select=first_name,...films(film_titles:title,film_years:year)" \
    -d "first_name=like.Quentin*" \
    -d "films.order=year"

.. code-block:: json

   [
     {
       "first_name": "Quentin",
       "film_titles": [
         "Reservoir Dogs",
         "Pulp Fiction"
       ],
       "film_years": [
         1992,
         1994
       ]
     }
   ]

.. warning::

   Aliasing spread columns is recommended since JSON allows duplicate keys. Example:

   .. code-block:: bash

     curl --get "localhost:3000/projects" \
       -d "select=id,name,...clients(id,name)"

   .. code-block:: json

     [{"id":1,"name":"Windows 7","id":1,"name":"Microsoft"},
      {"id":2,"name":"Windows 10","id":1,"name":"Microsoft"},
      {"id":3,"name":"IOS","id":2,"name":"Apple"},
      {"id":4,"name":"OSX","id":2,"name":"Apple"},
      {"id":5,"name":"Orphan","id":null,"name":null}]

   This can be a problem in Javascript objects, since only the last duplicated key will be considered. To solve it do:

   .. code-block:: bash

     curl --get "localhost:3000/projects" \
       -d "select=id,name,...clients(client_id:id,client_name:name)"


Multiple Spreads
----------------

You can use multiple spreads at any level. For example, let's spread ``technical_specs`` and ``roles`` into ``films`` and then spread ``films`` into ``directors``:

.. code-block:: bash

  curl --get "http://localhost:3000/directors" \
    -d "select=first_name,...films(film_titles:title,film_years:year,...technical_specs(film_runtimes:runtime),...roles(film_characters:character))" \
    -d "first_name=like.Quentin*" \
    -d "films.order=year" \
    -d "films.roles.order=character"

.. code-block:: json

   [
     {
       "first_name": "Quentin",
       "film_titles": [
         "Reservoir Dogs",
         "Pulp Fiction"
       ],
       "film_years": [
         1992,
         1994
       ],
       "film_runtimes": [
         "01:39:00",
         "02:29:00"
       ]
       "film_characters": [
         [ "Mr. Pink", "Mr. White" ],
         [ "Mia Wallace", "Vincent Vega" ]
       ]
     }
   ]

Note that:

- All the ``film_*`` arrays are correlated-"Reservoir Dogs" premiered in 1992, its runtime is 1:39:00 and it has the following characters: ``[ "Mr. Pink", "Mr. White" ]``.
- The ``film_*`` arrays are ordered by ``year`` (due to ``films.order=year``).
- The bottom level array ``film_characters`` is ordered (due to ``films.roles.order=character``).

Spread a join table
-------------------

Spread can be used to move the columns of a join table in a :ref:`many-to-many <many-to-many>` to the top object. For instance, to get the ``character`` column of the ``roles`` join table into ``actors``:

.. code-block:: bash

  curl --get "http://localhost:3000/films" \
    -d "select=title,actors:roles(character,...actors(first_name,last_name))" \
    -d "title=like.*Lighthouse*"

.. code-block:: json

   [
     {
       "title": "The Lighthouse",
       "actors": [
          {
            "character": "Thomas Wake",
            "first_name": "Willem",
            "last_name": "Dafoe"
          }
       ]
     }
   ]


