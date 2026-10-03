create schema v;

create table v.items(
  id serial primary key,
  embedding vector(3),
  half_embedding halfvec(3),
  bit_embedding bit(3),
  sparse_embedding sparsevec(3)
);

-- vector ops
create index on v.items using hnsw (embedding vector_l2_ops);
create index on v.items using hnsw (embedding vector_cosine_ops);
create index on v.items using hnsw (embedding vector_l1_ops);
create index on v.items using ivfflat (embedding vector_l2_ops);
create index on v.items using ivfflat (embedding vector_cosine_ops);

-- halfvec ops
create index on v.items using hnsw (half_embedding halfvec_l2_ops);
create index on v.items using hnsw (half_embedding halfvec_cosine_ops);
create index on v.items using hnsw (half_embedding halfvec_l1_ops);
create index on v.items using ivfflat (half_embedding halfvec_l2_ops);
create index on v.items using ivfflat (half_embedding halfvec_cosine_ops);

-- sparsevec
create index on v.items using hnsw (sparse_embedding sparsevec_l2_ops);
create index on v.items using hnsw (sparse_embedding sparsevec_cosine_ops);
create index on v.items using hnsw (sparse_embedding sparsevec_l1_ops);

-- bit ops
create index on v.items using hnsw (bit_embedding bit_hamming_ops);
create index on v.items using ivfflat (bit_embedding bit_hamming_ops);

-- Populate some records
insert into v.items(
    embedding,
    half_embedding,
    bit_embedding,
    sparse_embedding
)
values
  ('[1,2,3]', '[1,2,3]', '101', '{1:4}/3'),
  ('[2,3,4]', '[2,3,4]', '010', '{1:7,3:0}/3');

-- Test op types
select
  *
from
  v.items
order by
  embedding <-> '[2,3,5]',
  embedding <=> '[2,3,5]',
  embedding <+> '[2,3,5]',
  embedding <#> '[2,3,5]',
  half_embedding <-> '[2,3,5]',
  half_embedding <=> '[2,3,5]',
  half_embedding <+> '[2,3,5]',
  half_embedding <#> '[2,3,5]',
  sparse_embedding <-> '{2:4,3:1}/3',
  sparse_embedding <=> '{2:4,3:1}/3',
  sparse_embedding <+> '{2:4,3:1}/3',
  sparse_embedding <#> '{2:4,3:1}/3',
  bit_embedding <~> '011';

select
  avg(embedding),
  avg(half_embedding)
from
  v.items;

-- Cleanup
drop schema v cascade;
