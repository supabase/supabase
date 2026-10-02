-- like (negate=false)
select realtime.check_equality_op('like', 'text', 'hello world', '%world%', false);
select realtime.check_equality_op('like', 'text', 'hello world', '%xyz%',   false);

-- like negated (NOT LIKE)
select realtime.check_equality_op('like', 'text', 'hello world', '%xyz%',   true);
select realtime.check_equality_op('like', 'text', 'hello world', '%world%', true);

-- ilike (negate=false)
select realtime.check_equality_op('ilike', 'text', 'Hello World', '%world%', false);
select realtime.check_equality_op('ilike', 'text', 'Hello World', '%xyz%',   false);

-- ilike negated (NOT ILIKE)
select realtime.check_equality_op('ilike', 'text', 'Hello World', '%xyz%',   true);
select realtime.check_equality_op('ilike', 'text', 'Hello World', '%world%', true);

-- in (negate=false)
select realtime.check_equality_op('in', 'bigint', '2', '{1,2,3}', false);
select realtime.check_equality_op('in', 'bigint', '4', '{1,2,3}', false);

-- in negated (NOT IN)
select realtime.check_equality_op('in', 'bigint', '4', '{1,2,3}', true);
select realtime.check_equality_op('in', 'bigint', '2', '{1,2,3}', true);

-- is null
select realtime.check_equality_op('is', 'text', null,    'null', false);
select realtime.check_equality_op('is', 'text', 'value', 'null', false);

-- is not null (negate=true)
select realtime.check_equality_op('is', 'text', 'value', 'null', true);
select realtime.check_equality_op('is', 'text', null,    'null', true);

-- is true / false on boolean
select realtime.check_equality_op('is', 'boolean', 'true',  'true',  false);
select realtime.check_equality_op('is', 'boolean', 'false', 'true',  false);
select realtime.check_equality_op('is', 'boolean', 'false', 'true',  true);

-- match (regex)
select realtime.check_equality_op('match',  'text', 'hello world', 'hel+o',  false);
select realtime.check_equality_op('match',  'text', 'hello world', '^world', false);
select realtime.check_equality_op('match',  'text', 'hello world', 'hel+o',  true);

-- imatch (case-insensitive regex)
select realtime.check_equality_op('imatch', 'text', 'Hello World', 'hel+o',  false);
select realtime.check_equality_op('imatch', 'text', 'Hello World', '^world', false);
select realtime.check_equality_op('imatch', 'text', 'Hello World', 'hel+o',  true);

-- isdistinct (IS DISTINCT FROM — differs from neq in NULL handling)
select realtime.check_equality_op('isdistinct', 'text', 'aaa', 'bbb',  false);  -- true
select realtime.check_equality_op('isdistinct', 'text', 'aaa', 'aaa',  false);  -- false
select realtime.check_equality_op('isdistinct', 'text', null,  'aaa',  false);  -- true (NULL IS DISTINCT FROM 'aaa')
select realtime.check_equality_op('isdistinct', 'text', null,  'aaa',  true);   -- false (IS NOT DISTINCT FROM)
select realtime.check_equality_op('isdistinct', 'text', null,  null,   false);  -- false (NULL IS NOT DISTINCT FROM NULL)

-- negate works on all existing operators
select realtime.check_equality_op('eq',  'text',   'aaa', 'aaa',      true);  -- NOT eq  → false
select realtime.check_equality_op('neq', 'text',   'aaa', 'bbb',      true);  -- NOT neq → false
select realtime.check_equality_op('lt',  'bigint', '1',   '2',        true);  -- NOT lt  → false
select realtime.check_equality_op('gte', 'bigint', '5',   '3',        true);  -- NOT gte → false

-- negate defaults to false (existing callers unaffected)
select realtime.check_equality_op('eq', 'text', 'aaa', 'aaa');
select realtime.check_equality_op('in', 'bigint', '2', '{1,2,3}');
