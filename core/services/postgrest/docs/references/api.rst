.. _api:

API
###

PostgREST exposes three database objects of a schema as resources: tables, views and functions.

.. toctree::
   :glob:
   :maxdepth: 1

   api/tables_views.rst
   api/functions.rst
   api/schemas.rst
   api/computed_fields.rst
   api/domain_representations.rst
   api/pagination_count.rst
   api/resource_embedding.rst
   api/resource_representation.rst
   api/media_type_handlers.rst
   api/aggregate_functions.rst
   api/openapi.rst
   api/preferences.rst
   api/vary_header.rst
   api/*

.. raw:: html

  <script type="text/javascript">
    let hash = window.location.hash;

    const redirects = {
      // Tables and Views
      '#horizontal-filtering-rows': 'api/tables_views.html#horizontal-filtering',
      '#operators': 'api/tables_views.html#operators',
      '#logical-operators': 'api/tables_views.html#logical-operators',
      '#pattern-matching': 'api/tables_views.html#pattern-matching',
      '#full-text-search': 'api/tables_views.html#full-text-search',
      '#vertical-filtering-columns': 'api/tables_views.html#vertical-filtering',
      '#renaming-columns': 'api/tables_views.html#renaming-columns',
      '#casting-columns': 'api/tables_views.html#casting-columns',
      '#json-columns': 'api/tables_views.html#json-columns',
      '#composite-array-columns': 'api/tables_views.html#composite-array-columns',
      '#computed-virtual-columns': 'api/computed_fields.html',
      '#ordering': 'api/tables_views.html#ordering',
      '#limits-and-pagination': 'api/pagination_count.html',
      '#exact-count': 'api/pagination_count.html#exact-count',
      '#planned-count': 'api/pagination_count.html#planned-count',
      '#estimated-count': 'api/pagination_count.html#estimated-count',
      '#updates': 'api/tables_views.html#update',
      '#insertions': 'api/tables_views.html#insert',
      '#bulk-insert': 'api/tables_views.html#bulk-insert',
      '#specifying-columns': 'api/tables_views.html#specifying-columns',
      '#upsert': 'api/tables_views.html#upsert',
      '#on-conflict': 'api/tables_views.html#on-conflict',
      '#put': 'api/tables_views.html#put',
      '#deletions': 'api/tables_views.html#delete',
      '#limited-updates-deletions': 'api/tables_views.html#limited-update-delete',
      // Functions
      '#stored-procedures': 'api/functions.html',
      '#calling-functions-with-a-single-json-parameter': 'api/functions.html#functions-with-a-single-json-parameter',
      '#calling-functions-with-a-single-unnamed-parameter': 'api/functions.html#functions-with-a-single-unnamed-parameter',
      '#calling-functions-with-array-parameters': 'api/functions.html#functions-with-array-parameters',
      '#calling-variadic-functions': 'api/functions.html#variadic-functions',
      '#scalar-functions': 'api/functions.html#scalar-functions',
      '#function-filters': 'api/functions.html#table-valued-functions',
      '#overloaded-functions': 'api/functions.html#overloaded-functions',
      // Schemas
      '#switching-schemas': 'api/schemas.html',
      // Resource Embedding
      '#resource-embedding': 'api/resource_embedding.html#resource-embedding',
      '#many-to-one-relationships': 'api/resource_embedding.html#many-to-one-relationships',
      '#one-to-many-relationships': 'api/resource_embedding.html#one-to-many-relationships',
      '#many-to-many-relationships': 'api/resource_embedding.html#many-to-many-relationships',
      '#one-to-one-relationships': 'api/resource_embedding.html#one-to-one-relationships',
      '#computed-relationships': 'api/resource_embedding.html#computed-relationships',
      '#nested-embedding': 'api/resource_embedding.html#nested-embedding',
      '#embedded-filters': 'api/resource_embedding.html#embedded-filters',
      '#embedding-with-top-level-filtering': 'api/resource_embedding.html#top-level-filtering',
      '#embedding-partitioned-tables': 'api/resource_embedding.html#foreign-key-joins-on-partitioned-tables',
      '#embedding-views': 'api/resource_embedding.html#foreign-key-joins-on-views',
      '#embedding-chains-of-views': 'api/resource_embedding.html#foreign-key-joins-on-chains-of-views',
      '#embedding-on-stored-procedures': 'api/resource_embedding.html#foreign-key-joins-on-table-valued-functions',
      '#embedding-after-insertions-updates-deletions': 'api/resource_embedding.html#foreign-key-joins-on-writes',
      '#embedding-disambiguation': 'api/resource_embedding.html#foreign-key-joins-on-multiple-foreign-key-relationships',
      '#target-disambiguation': 'api/resource_embedding.html#foreign-key-joins-on-multiple-foreign-key-relationships',
      '#hint-disambiguation': 'api/resource_embedding.html#foreign-key-joins-on-multiple-foreign-key-relationships',
      "#embedding-through-join-tables": "api/resource_embedding.html#many-to-many-relationships",
      // OpenAPI
      '#openapi-support': 'api/openapi.html',
      // Resource Representation
      '#response-format': 'api/resource_representation.html#response-format',
      '#singular-or-plural': 'api/resource_representation.html#singular-or-plural',
      '#response-formats-for-scalar-responses': 'api/functions.html#scalar-functions',
      // CORS
      '#cors': 'api/cors.html',
      // OPTIONS
      '#options': 'api/options.html',
      // URL Grammar
      '#custom-queries': 'api/url_grammar.html#custom-queries',
      '#unicode-support': 'api/url_grammar.html#unicode-support',
      '#table-columns-with-spaces': 'api/url_grammar.html#table-columns-with-spaces',
      '#reserved-characters': 'api/url_grammar.html#reserved-characters',
      // Transactions
      '#immutable-and-stable-functions': 'transactions.html#access-mode',
      '#http-context': 'transactions.html#transaction-scoped-settings',
      '#accessing-request-headers-cookies-and-jwt-claims': 'transactions.html#request-headers-cookies-and-jwt-claims',
      '#legacy-guc-variable-names': 'transactions.html#transaction-scoped-settings',
      '#accessing-request-path-and-method': 'transactions.html#request-path-and-method',
      '#setting-response-headers': 'transactions.html#response-headers',
      '#setting-headers-via-pre-request': 'transactions.html#setting-headers-via-pre-request',
      '#setting-response-status-code': 'transactions.html#response-status-code',
      '#raise-errors-with-http-status-codes': 'errors.html#raise-errors-with-http-status-codes',
      // Admin
      '#execution-plan': 'observability.html#execution-plan',
      // Deprecated
      '#bulk-call': '../releases/v11.0.1.html#breaking-changes',
    };

    let willRedirectTo = redirects[hash];

    if (willRedirectTo) {
      window.location.href = willRedirectTo;
    }
  </script>
