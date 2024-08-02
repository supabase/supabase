export const CREATE_VECTOR_EXTENSION = 'create extension if not exists vector;'

export const CREATE_PAGE_TABLE = `
create table if not exists page (
    id bigint primary key,
    path text,
    meta jsonb,
    type text,
    source text
)
`.trim()

export const CREATE_PAGE_SECTION_TABLE = `
create table if not exists page_section (
    id bigint primary key,
    page_id bigint references page (id) on delete cascade,
    slug text,
    heading text,
    rag_ignore boolean,
    hf_embedding vector(384)
)
`.trim()

export const INSERT_PAGES = `
insert into page (
    id,
    path,
    meta,
    type,
    source
) values (
    $1,
    $2,
    $3,
    $4,
    $5
)
`.trim()

export const INSERT_PAGE_SECTIONS = `
insert into page_section (
    id,
    page_id,
    slug,
    heading,
    rag_ignore,
    hf_embedding
) values (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6
)
`.trim()

export const SEARCH_EMBEDDINGS = `
with match as(
    select *
    from page_section
    where (page_section.hf_embedding <#> $1) * -1 > $2	
    order by page_section.hf_embedding <#> $1
    limit 10
  )
  select
    page.id,
    page.path,
    page.type,
    page.meta ->> 'title' as title,
    page.meta ->> 'subtitle' as subtitle,
    page.meta ->> 'description' as description,
    array_agg(match.heading) filter (where match.heading is not null) as headings,
    array_agg(match.slug) filter (where match.slug is not null) as slugs
  from page
  join match on match.page_id = page.id
  group by page.id;
`.trim()
