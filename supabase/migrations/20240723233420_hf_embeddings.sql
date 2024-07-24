alter table public.page_section
add column hf_embedding vector(384);

create index "page_section_hf_embedding_hnsw"
on public.page_section
using hnsw (hf_embedding vector_ip_ops);