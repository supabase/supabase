.. _tables_views:

Tables and Views
################

All tables and views of the :ref:`exposed schema <schemas>` and accessible by the :ref:`active database role <roles>` are available for querying. They are exposed in one-level deep routes.

For instance the full contents of a table `people` is returned at

.. code-block:: bash

  curl "http://localhost:3000/people"

There are no deeply/nested/routes. Each route provides OPTIONS, GET, HEAD, POST, PATCH, and DELETE verbs depending entirely on database permissions.

.. note::

  Why not provide nested routes? Many APIs allow nesting to retrieve related information, such as :code:`/films/1/director`. We offer a more flexible mechanism (inspired by GraphQL) to embed related resources. This is covered on :ref:`resource_embedding`.

.. _read:

Read
====

.. _head_req:

GET and HEAD
------------

Using the GET method, you can retrieve tables and views rows. The default :ref:`res_format` is JSON.

A HEAD method will behave identically to GET except that no response body will be returned (`RFC 2616 <https://datatracker.ietf.org/doc/html/rfc2616#section-9.4>`_).
As an optimization, the generated query won't execute an aggregate (to avoid unnecessary data transfer).

.. _h_filter:

Horizontal Filtering
--------------------

You can filter result rows by adding conditions on columns. For instance, to return people aged under 13 years old:

.. code-block:: bash

  curl "http://localhost:3000/people?age=lt.13"

You can evaluate multiple conditions on columns by adding more query string parameters. For instance, to return people who are 18 or older **and** are students:

.. code-block:: bash

  curl "http://localhost:3000/people?age=gte.18&student=is.true"

.. _operators:

Operators
~~~~~~~~~

These operators are available:

============  ========================  ==================================================================================
Abbreviation  In PostgreSQL             Meaning
============  ========================  ==================================================================================
eq            :code:`=`                 equals
gt            :code:`>`                 greater than
gte           :code:`>=`                greater than or equal
lt            :code:`<`                 less than
lte           :code:`<=`                less than or equal
neq           :code:`<>` or :code:`!=`  not equal
like          :code:`LIKE`              LIKE operator (to avoid `URL encoding <https://en.wikipedia.org/wiki/Percent-encoding>`_ you can use ``*`` as an alias of the percent sign ``%`` for the pattern)
ilike         :code:`ILIKE`             ILIKE operator (to avoid `URL encoding <https://en.wikipedia.org/wiki/Percent-encoding>`_ you can use ``*`` as an alias of the percent sign ``%`` for the pattern)
match         :code:`~`                 ~ operator, see :ref:`pattern_matching`
imatch        :code:`~*`                ~* operator, see :ref:`pattern_matching`
in            :code:`IN`                one of a list of values, e.g. :code:`?a=in.(1,2,3)`
                                        – also supports commas in quoted strings like
                                        :code:`?a=in.("hi,there","yes,you")`
is            :code:`IS`                checking for exact equality (null,not_null,true,false,unknown)
isdistinct    :code:`IS DISTINCT FROM`  not equal, treating :code:`NULL` as a comparable value
fts           :code:`@@`                :ref:`fts` using to_tsquery
plfts         :code:`@@`                :ref:`fts` using plainto_tsquery
phfts         :code:`@@`                :ref:`fts` using phraseto_tsquery
wfts          :code:`@@`                :ref:`fts` using websearch_to_tsquery
cs            :code:`@>`                contains e.g. :code:`?tags=cs.{example, new}`
cd            :code:`<@`                contained in e.g. :code:`?values=cd.{1,2,3}`
ov            :code:`&&`                overlap (have points in common), e.g. :code:`?period=ov.[2017-01-01,2017-06-30]` –
                                        also supports array types, use curly braces instead of square brackets e.g.
                                        :code:`?arr=ov.{1,3}`
sl            :code:`<<`                strictly left of, e.g. :code:`?range=sl.(1,10)`
sr            :code:`>>`                strictly right of
nxr           :code:`&<`                does not extend to the right of, e.g. :code:`?range=nxr.(1,10)`
nxl           :code:`&>`                does not extend to the left of
adj           :code:`-|-`               is adjacent to, e.g. :code:`?range=adj.(1,10)`
not           :code:`NOT`               negates another operator, see :ref:`logical_operators`
or            :code:`OR`                logical :code:`OR`, see :ref:`logical_operators`
and           :code:`AND`               logical :code:`AND`, see :ref:`logical_operators`
all           :code:`ALL`               comparison matches all the values in the list, see :ref:`modifiers`
any           :code:`ANY`               comparison matches any value in the list, see :ref:`modifiers`
============  ========================  ==================================================================================

For more complicated filters you will have to create a new view in the database, or use a function. For instance, here's a view to show "today's stories" including possibly older pinned stories:

.. code-block:: postgres

  CREATE VIEW fresh_stories AS
  SELECT *
    FROM stories
   WHERE pinned = true
      OR published > now() - interval '1 day'
  ORDER BY pinned DESC, published DESC;

The view will provide a new endpoint:

.. code-block:: bash

  curl "http://localhost:3000/fresh_stories"

.. _logical_operators:

Logical operators
~~~~~~~~~~~~~~~~~

Multiple conditions on columns are evaluated using ``AND`` by default, but you can combine them using ``OR`` with the ``or`` operator. For example, to return people under 18 **or** over 21:

.. code-block:: bash

  curl "http://localhost:3000/people?or=(age.lt.18,age.gt.21)"

To **negate** any operator, you can prefix it with :code:`not` like :code:`?a=not.eq.2` or :code:`?not.and=(a.gte.0,a.lte.100)` .

You can also apply complex logic to the conditions:

.. code-block:: bash

  # curl "http://localhost:3000/people?grade=gte.90&student=is.true&or=(age.eq.14,not.and(age.gte.11,age.lte.17))"

  curl --get "http://localhost:3000/people" \
    -d "grade=gte.90" \
    -d "student=is.true" \
    -d "or=(age.eq.14,not.and(age.gte.11,age.lte.17))"

If the filter value has a :ref:`reserved character <reserved-chars>`, then you need to wrap it in double quotes:

.. code-block:: bash

  curl -g 'http://localhost:3000/survey?or=(age_range.adj."[18,21)",age_range.cs."[30,35]")'

.. _modifiers:

Operator Modifiers
~~~~~~~~~~~~~~~~~~

You may further simplify the logic using the ``any/all`` modifiers of ``eq,like,ilike,gt,gte,lt,lte,match,imatch``.

For instance, to avoid repeating the same column for ``or``, use ``any`` to get people with last names that start with O or P:

.. code-block:: bash

  curl -g "http://localhost:3000/people?last_name=like(any).{O*,P*}"

In a similar way, you can use ``all`` to avoid repeating the same column for ``and``. To get the people with last names that start with O and end with n:

.. code-block:: bash

  curl -g "http://localhost:3000/people?last_name=like(all).{O*,*n}"

.. _pattern_matching:

Pattern Matching
~~~~~~~~~~~~~~~~

The pattern-matching operators (:code:`like`, :code:`ilike`, :code:`match`, :code:`imatch`) exist to support filtering data using patterns instead of concrete strings, as described in the `PostgreSQL docs <https://www.postgresql.org/docs/current/functions-matching.html>`__.

To ensure best performance on larger data sets, an `appropriate index <https://www.postgresql.org/docs/current/pgtrgm.html#PGTRGM-INDEX>`__ should be used and even then, it depends on the pattern value and actual data statistics whether an existing index will be used by the query planner or not.

.. _fts:

Full-Text Search
~~~~~~~~~~~~~~~~

The :code:`fts` operator has a number of options to support flexible textual queries, namely the choice of plain vs phrase search and the language used for stemming.

The following examples illustrate the possibilities, assuming column :code:`my_tsv` is of type `tsvector <https://www.postgresql.org/docs/current/datatype-textsearch.html>`_.

.. code-block:: bash

  curl --get "http://localhost:3000/people" \
    -d "my_tsv=fts(french).amusant"

.. code-block:: bash

  curl --get "http://localhost:3000/people" \
    -d "my_tsv=plfts.The%20Fat%20Cats"

.. code-block:: bash

  curl --get "http://localhost:3000/people" \
    -d "my_tsv=not.phfts(english).The%20Fat%20Cats"

.. code-block:: bash

  curl --get "http://localhost:3000/people" \
    -d "my_tsv=not.wfts(french).amusant"

.. _fts_to_tsvector:

Automatic ``tsvector`` conversion
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

If the filtered column is not of type ``tsvector``, then it will be automatically converted using `to_tsvector() <https://www.postgresql.org/docs/current/functions-textsearch.html#TEXTSEARCH-FUNCTIONS-TABLE>`_.
This allows using the ``fts`` operator on ``text`` and ``json`` types out of the box.

.. code-block:: bash

  curl --get "http://localhost:3000/people" \
    -d "my_text_column=fts(french).amusant"

.. code-block:: bash

  curl --get "http://localhost:3000/people" \
    -d "my_json_column=not.phfts(english).The%20Fat%20Cats"

.. important::

  To ensure this operation is fast, you need to create an index on the expression:

  .. code-block:: postgres

    CREATE INDEX idx_people_col ON people
    USING GIN (to_tsvector('french', my_text_column));

.. _v_filter:

Vertical Filtering
------------------

When certain columns are wide (such as those holding binary data), it is more efficient for the server to withhold them in a response. The client can specify which columns are required using the :code:`select` parameter.

.. code-block:: bash

  curl "http://localhost:3000/people?select=first_name,age"

.. code-block:: json

  [
    {"first_name": "John", "age": 30},
    {"first_name": "Jane", "age": 20}
  ]

The default is ``*``, meaning all columns. This value will become more important below in :ref:`resource_embedding`.

.. _renaming_columns:

Renaming Columns
~~~~~~~~~~~~~~~~

You can rename the columns by prefixing them with an alias followed by the colon ``:`` operator.

.. code-block:: bash

  curl "http://localhost:3000/people?select=fullName:full_name,birthDate:birth_date"

.. code-block:: json

  [
    {"fullName": "John Doe", "birthDate": "04/25/1988"},
    {"fullName": "Jane Doe", "birthDate": "01/12/1998"}
  ]

.. _json_columns:

JSON Columns
~~~~~~~~~~~~

To further reduce the data transferred, you can specify a path for a ``json`` or ``jsonb`` column using the arrow operators(``->`` or ``->>``) as per the `PostgreSQL docs <https://www.postgresql.org/docs/current/functions-json.html>`__.

.. code-block:: postgres

  CREATE TABLE people (
    id int,
    json_data json
  );

.. code-block:: bash

  curl "http://localhost:3000/people?select=id,json_data->>blood_type,json_data->phones"

.. code-block:: json

  [
    { "id": 1, "blood_type": "A-", "phones": [{"country_code": "61", "number": "917-929-5745"}] },
    { "id": 2, "blood_type": "O+", "phones": [{"country_code": "43", "number": "512-446-4988"}, {"country_code": "43", "number": "213-891-5979"}] }
  ]

.. code-block:: bash

  curl "http://localhost:3000/people?select=id,json_data->phones->0->>number"

.. code-block:: json

  [
    { "id": 1, "number": "917-929-5745"},
    { "id": 2, "number": "512-446-4988"}
  ]

This also works with filters:

.. code-block:: bash

  curl "http://localhost:3000/people?select=id,json_data->blood_type&json_data->>blood_type=eq.A-"

.. code-block:: json

  [
    { "id": 1, "blood_type": "A-" },
    { "id": 3, "blood_type": "A-" },
    { "id": 7, "blood_type": "A-" }
  ]

Note that ``->>`` is used to compare ``blood_type`` as ``text``. To compare with an integer value use ``->``:

.. code-block:: bash

  curl "http://localhost:3000/people?select=id,json_data->age&json_data->age=gt.20"

.. code-block:: json

  [
    { "id": 11, "age": 25 },
    { "id": 12, "age": 30 },
    { "id": 15, "age": 35 }
  ]

Ordering is also supported:

.. code-block:: bash

  curl "http://localhost:3000/people?select=id,json_data->age&order=json_data->>age.desc"

.. code-block:: json

  [
    { "id": 15, "age": 35 },
    { "id": 12, "age": 30 },
    { "id": 11, "age": 25 }
  ]

.. _composite_array_columns:

Composite / Array Columns
~~~~~~~~~~~~~~~~~~~~~~~~~

The arrow operators(``->``, ``->>``) can also be used for accessing composite fields and array elements.

.. code-block:: postgres

  CREATE TYPE coordinates (
    lat decimal(8,6),
    long decimal(9,6)
  );

  CREATE TABLE countries (
    id int,
    location coordinates,
    languages text[]
  );

.. code-block:: bash

  # curl "http://localhost:3000/countries?select=id,location->>lat,location->>long,primary_language:languages->0&location->lat=gte.19"

  curl --get "http://localhost:3000/countries" \
    -d "select=id,location->>lat,location->>long,primary_language:languages->0" \
    -d "location->lat=gte.19"

.. code-block:: json

  [
    {
      "id": 5,
      "lat": "19.741755",
      "long": "-155.844437",
      "primary_language": "en"
    }
  ]

.. important::

  When using the ``->`` and ``->>`` operators on composite and array columns, PostgREST uses a query like ``to_jsonb(<col>)->'field'``. To make filtering and ordering on those nested fields use an index, the index needs to be created on the same expression, including the ``to_jsonb(...)`` call:

  .. code-block:: postgres

    CREATE INDEX ON mytable ((to_jsonb(data) -> 'identification' ->> 'registration_number'));

.. _casting_columns:

Casting Columns
~~~~~~~~~~~~~~~

Casting the columns is possible by suffixing them with the double colon ``::`` plus the desired type.

.. code-block:: bash

  curl "http://localhost:3000/people?select=full_name,salary::text"

.. code-block:: json

  [
    {"full_name": "John Doe", "salary": "90000.00"},
    {"full_name": "Jane Doe", "salary": "120000.00"}
  ]

.. note::

  To prevent invalidating :ref:`index_usage`, casting on horizontal filtering is not allowed. To do this, you can use :ref:`computed_cols`.

.. _ordering:

Ordering
--------

The reserved word ``order`` reorders the response rows. It uses a comma-separated list of columns and directions:

.. code-block:: bash

  curl "http://localhost:3000/people?order=age.desc,height.asc"

If no direction is specified it defaults to ascending order:

.. code-block:: bash

  curl "http://localhost:3000/people?order=age"

If you care where nulls are sorted, add ``nullsfirst`` or ``nullslast``:

.. code-block:: bash

  curl "http://localhost:3000/people?order=age.nullsfirst"

.. code-block:: bash

  curl "http://localhost:3000/people?order=age.desc.nullslast"

You can also sort on fields of :ref:`composite_array_columns` or :ref:`json_columns`.

.. code-block:: bash

  curl "http://localhost:3000/countries?order=location->>lat"

.. _index_usage:

Index Usage
-----------

Indexes work transparently when using horizontal filtering, vertical filtering and ordering. For example, when having:

.. code-block:: postgresql

  create index salary_idx on employees (salary);

We can confirm that a filter on employees uses the index by getting the :ref:`explain_plan`.

.. code-block:: bash

  curl 'localhost:3000/employees?salary=eq.36000' -H "Accept: application/vnd.pgrst.plan"

  Aggregate  (cost=9.52..9.54 rows=1 width=144)
    ->  Bitmap Heap Scan on employees  (cost=4.16..9.50 rows=2 width=136)
          Recheck Cond: (salary = '$36,000.00'::money)
          ->  Bitmap Index Scan on salary_idx  (cost=0.00..4.16 rows=2 width=0)
                Index Cond: (salary = '$36,000.00'::money)

There we can see `"Index Cond" <https://www.pgmustard.com/docs/explain/index-cond>`_, which confirms the index is being used by the query planner.

.. _insert:

Insert
======

All tables and `auto-updatable views <https://www.postgresql.org/docs/current/sql-createview.html#SQL-CREATEVIEW-UPDATABLE-VIEWS>`_ can be modified through the API, subject to permissions of the requester's database role.

To create a row in a database table post a JSON object whose keys are the names of the columns you would like to create. Missing properties will be set to default values when applicable.

.. code-block:: bash

  curl "http://localhost:3000/table_name" \
    -X POST -H "Content-Type: application/json" \
    -d '{ "col1": "value1", "col2": "value2" }'

.. code::

  HTTP/1.1 201 Created

No response body will be returned by default but you can use :ref:`prefer_return` to get the affected resource and :ref:`resource_embedding` to add related resources.

x-www-form-urlencoded
---------------------

URL encoded payloads can be posted with ``Content-Type: application/x-www-form-urlencoded``.

.. code-block:: bash

  curl "http://localhost:3000/people" \
    -X POST -H "Content-Type: application/x-www-form-urlencoded" \
    -d "name=John+Doe&age=50&weight=80"

.. note::

  When inserting a row you must post a JSON object, not quoted JSON.

  .. code::

    Yes
    { "a": 1, "b": 2 }

    No
    "{ \"a\": 1, \"b\": 2 }"

  Some JavaScript libraries will post the data incorrectly if you're not careful. For best results try one of the :ref:`clientside_libraries` built for PostgREST.

.. important::

  It's recommended that you `use triggers instead of rules <https://wiki.postgresql.org/wiki/Don%27t_Do_This#Don.27t_use_rules>`_.
  Insertion on views with complex `rules <https://www.postgresql.org/docs/current/sql-createrule.html>`_ might not work out of the box with PostgREST due to its usage of CTEs.
  If you want to keep using rules, a workaround is to wrap the view insertion in a function and call it through the :ref:`functions` interface.
  For more details, see this `github issue <https://github.com/PostgREST/postgrest/issues/1283>`_.

.. _bulk_insert:

Bulk Insert
-----------

Bulk insert works exactly like single row insert except that you provide either a JSON array of objects having uniform keys, or lines in CSV format. This not only minimizes the HTTP requests required but uses a single INSERT statement on the back-end for efficiency.

To bulk insert CSV simply post to a table route with :code:`Content-Type: text/csv` and include the names of the columns as the first row. For instance

.. code-block:: bash

  curl "http://localhost:3000/people" \
    -X POST -H "Content-Type: text/csv" \
    --data-binary @- << EOF
  name,age,height
  J Doe,62,70
  Jonas,10,55
  EOF

An empty field (:code:`,,`) is coerced to an empty string and the reserved word :code:`NULL` is mapped to the SQL null value. Note that there should be no spaces between the column names and commas.

To bulk insert JSON post an array of objects having all-matching keys

.. code-block:: bash

  curl "http://localhost:3000/people" \
    -X POST -H "Content-Type: application/json" \
    -d @- << EOF
    [
      { "name": "J Doe", "age": 62, "height": 70 },
      { "name": "Janus", "age": 10, "height": 55 }
    ]
  EOF


.. _specify_columns:

Specifying Columns
------------------

By using the :code:`columns` query parameter it's possible to specify the payload keys that will be inserted and ignore the rest of the payload.

.. code-block:: bash

  curl "http://localhost:3000/datasets?columns=source,publication_date,figure" \
    -X POST -H "Content-Type: application/json" \
    -d @- << EOF
    {
      "source": "Natural Disaster Prevention and Control",
      "publication_date": "2015-09-11",
      "figure": 1100,
      "location": "...",
      "comment": "...",
      "extra": "...",
      "stuff": "..."
    }
  EOF

In this case, only **source**, **publication_date** and **figure** will be inserted. The rest of the JSON keys will be ignored.

Using this also has the side-effect of being more efficient for :ref:`bulk_insert` since PostgREST will not process the JSON and
it'll send it directly to PostgreSQL.

.. _update:

Update
======

To update a row or rows in a table, use the PATCH verb. Use :ref:`h_filter` to specify which record(s) to update. Here is an example query setting the :code:`category` column to child for all people below a certain age.

.. code-block:: bash

  curl "http://localhost:3000/people?age=lt.13" \
    -X PATCH -H "Content-Type: application/json" \
    -d '{ "category": "child" }'

Updates also support:

- :ref:`prefer_return`
- :ref:`resource_embedding`
- :ref:`v_filter`
- :ref:`Missing Preference <prefer_missing>`
- :ref:`specify_columns`

.. warning::

  Beware of accidentally updating every row in a table. To learn to prevent that see :ref:`block_fulltable`.

.. _prefer_resolution:

.. _upsert:

Upsert
======

You can make an upsert with :code:`POST` and the :code:`Prefer: resolution=merge-duplicates` header:

.. code-block:: bash

  curl "http://localhost:3000/products" \
    -X POST -H "Content-Type: application/json" \
    -H "Prefer: resolution=merge-duplicates" \
    -d @- << EOF
    [
      { "sku": "CL2031", "name": "Existing T-shirt", "price": 35 },
      { "sku": "CL2040", "name": "Existing Hoodie", "price": 60 },
      { "sku": "AC1022", "name": "New Cap", "price": 30 }
    ]
  EOF

By default, upsert operates based on the primary key columns, so you must specify all of them.
You can also choose to ignore the duplicates with :code:`Prefer: resolution=ignore-duplicates`.
Upsert works best when the primary key is natural (e.g. ``sku``).
However, it can work with surrogate primary keys (e.g. ``id serial primary key``), if you also do a :ref:`bulk_insert` with :ref:`prefer_missing`:

.. code-block:: bash

  curl "http://localhost:3000/employees?columns=id,name,salary" \
    -X POST -H "Content-Type: application/json" \
    -H "Prefer: resolution=merge-duplicates, missing=default" \
    -d @- << EOF
    [
      { "id": 1, "name": "Existing employee 1", "salary": 30000 },
      { "id": 2, "name": "Existing employee 2", "salary": 42000 },
      { "name": "New employee 3", "salary": 50000 }
    ]
  EOF

.. important::
  After creating a table or changing its primary key, you must refresh PostgREST schema cache for upsert to work properly. To learn how to refresh the cache see :ref:`schema_reloading`.

.. _on_conflict:

On Conflict
-----------

By specifying the ``on_conflict`` query parameter, you can make upsert work on a column(s) that has a UNIQUE constraint.

.. code-block:: bash

  curl "http://localhost:3000/employees?on_conflict=name" \
    -X POST -H "Content-Type: application/json" \
    -H "Prefer: resolution=merge-duplicates" \
    -d @- << EOF
    [
      { "name": "Old employee 1", "salary": 40000 },
      { "name": "Old employee 2", "salary": 52000 },
      { "name": "New employee 3", "salary": 60000 }
    ]
  EOF

.. _upsert_put:

PUT
---

A single row upsert can be done by using :code:`PUT` and filtering the primary key columns with :code:`eq`:

.. code-block:: bash

  curl "http://localhost/employees?id=eq.4" \
    -X PUT -H "Content-Type: application/json" \
    -d '{ "id": 4, "name": "Sara B.", "salary": 60000 }'

All the columns must be specified in the request body, including the primary key columns.

.. _delete:

Delete
======

To delete rows in a table, use the DELETE verb plus :ref:`h_filter`. For instance deleting inactive users:

.. code-block:: bash

  curl "http://localhost:3000/user?active=is.false" -X DELETE

Deletions also support :ref:`prefer_return`, :ref:`resource_embedding` and :ref:`v_filter`.

.. code-block:: bash

  curl "http://localhost:3000/user?id=eq.1" -X DELETE \
    -H "Prefer: return=representation"

.. code-block:: json

  {"id": 1, "email": "johndoe@email.com"}

.. warning::

  Beware of accidentally deleting all rows in a table. To learn to prevent that see :ref:`block_fulltable`.

.. raw:: html

  <script type="text/javascript">
    let hash = window.location.hash;

    const redirects = {
      // Tables and Views
      '#computed-virtual-columns': 'computed_fields.html#computed-fields',
      '#limits-and-pagination': 'pagination_count.html#limits-and-pagination',
      '#exact-count': 'pagination_count.html#exact-count',
      '#planned-count': 'pagination_count.html#planned-count',
      '#estimated-count': 'pagination_count.html#estimated-count',
      '#prefer-return-headers-only': 'preferences.html#headers-only',
      '#prefer-return-representation': 'preferences.html#full',
      '#bulk-insert-default': 'preferences.html#prefer-missing',
    };

    let willRedirectTo = redirects[hash];

    if (willRedirectTo) {
      window.location.href = willRedirectTo;
    }
  </script>
