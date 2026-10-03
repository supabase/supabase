-- Test for http extension
-- Basic HTTP functionality tests

-- Test basic HTTP GET request
SELECT status FROM http_get('http://localhost:' || (SELECT value FROM test_config WHERE key = 'http_mock_port') || '/get');

-- Test HTTP GET with headers
SELECT status, content_type
FROM http((
  'GET',
  'http://localhost:' || (SELECT value FROM test_config WHERE key = 'http_mock_port') || '/headers',
  ARRAY[http_header('User-Agent', 'pg_http_test')],
  NULL,
  NULL
)::http_request);

-- Test HTTP POST request with JSON body
SELECT status FROM http_post(
  'http://localhost:' || (SELECT value FROM test_config WHERE key = 'http_mock_port') || '/post',
  '{"test": "data"}',
  'application/json'
);

-- Test HTTP PUT request
SELECT status FROM http_put(
  'http://localhost:' || (SELECT value FROM test_config WHERE key = 'http_mock_port') || '/put',
  '{"update": "data"}',
  'application/json'
);

-- Test HTTP DELETE request
SELECT status FROM http_delete('http://localhost:' || (SELECT value FROM test_config WHERE key = 'http_mock_port') || '/delete');

-- Test HTTP PATCH request
SELECT status FROM http_patch(
  'http://localhost:' || (SELECT value FROM test_config WHERE key = 'http_mock_port') || '/patch',
  '{"patch": "data"}',
  'application/json'
);

-- Test HTTP HEAD request
SELECT status FROM http_head('http://localhost:' || (SELECT value FROM test_config WHERE key = 'http_mock_port') || '/get');

-- Test response headers parsing
WITH response AS (
  SELECT * FROM http_get('http://localhost:' || (SELECT value FROM test_config WHERE key = 'http_mock_port') || '/response-headers?Content-Type=text/plain')
)
SELECT
  status,
  content_type,
  headers IS NOT NULL as has_headers
FROM response;

-- Test timeout handling (using a delay endpoint)
-- This should complete successfully with reasonable timeout
SELECT status FROM http((
  'GET',
  'http://localhost:' || (SELECT value FROM test_config WHERE key = 'http_mock_port') || '/delay/1',
  ARRAY[]::http_header[],
  'application/json',
  2000  -- 2 second timeout
)::http_request);

-- Test URL encoding
SELECT status FROM http_get('http://localhost:' || (SELECT value FROM test_config WHERE key = 'http_mock_port') || '/anything?param=value%20with%20spaces&another=123');
