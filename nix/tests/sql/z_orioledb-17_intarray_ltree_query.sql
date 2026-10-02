-- lquery: total length of one level's OR-variants overflows.
SELECT (repeat('x', 1000) || repeat('|' || repeat('x', 1000), 65))::lquery IS NOT NULL AS lq_totallen;
