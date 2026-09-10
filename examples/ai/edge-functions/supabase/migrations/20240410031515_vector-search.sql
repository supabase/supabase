-- Matches document sections using vector similarity search on embeddings
--
-- Returns a setof embeddings so that we can use PostgREST resource embeddings (joins with other tables)
-- Additional filtering like limits can be chained to this function call
create or replace function query_embeddings(embedding vector(384), match_threshold float)
returns setof embeddings
language plpgsql
as $$
#variable_conflict use_variable
begin
  return query
  select *
  from embeddings

  -- The inner product is negative, so we negate match_threshold
  where embeddings.embedding <#> embedding < -match_threshold

  -- Our embeddings are normalized to length 1, so cosine similarity
  -- and inner product will produce the same query results.
  -- Using inner product which can be computed faster.
  --
  -- For the different distance functions, see https://github.com/pgvector/pgvector
  order by embeddings.embedding <#> embedding;
end;
$$;