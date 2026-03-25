---
title: 'Matryoshka embeddings: faster OpenAI vector search using Adaptive Retrieval'
description: Use Adaptive Retrieval to improve query performance with OpenAI's new embedding models
author: gregnr,egor_romanov
imgSocial: 2024-02-13-matryoshka-embeddings/matryoshka-embeddings-og.png
imgThumb: 2024-02-13-matryoshka-embeddings/matryoshka-embeddings-thumb.png
categories:
  - engineering
tags:
  - AI
  - performance
  - postgres
date: '2024-02-13'
toc_depth: 3
---

At the end of January OpenAI released their third generation of text embeddings models:

- `text-embedding-3-small`
- `text-embedding-3-large`

Both models outperform their previous `text-embedding-ada-002` model on both [MTEB](https://github.com/embeddings-benchmark/mteb) and [MIRACL](https://github.com/project-miracl/miracl) benchmarks.

The most noteworthy update though _(in our opinion)_, is a new capability built into these embeddings: the ability to “shorten” their dimensions.

## Previous embedding models

If you're new to embeddings, you can think of an embedding as a way to capture the "relatedness" of text, images, audio, or other types of information. For an in-depth introduction to embeddings, check out [What are embeddings?](https://supabase.com/docs/guides/ai/concepts#what-are-embeddings)

Embeddings are represented using vectors (an array of floating point numbers) where the length of each vector represents the number of dimensions in the embedding. Up until now, embedding models always generated embeddings with a fixed number of dimensions. For example, OpenAI's previous `text-embedding-ada-002` produces 1536 dimensions. Alibaba DAMO Academy's open source [`gte-small`](https://huggingface.co/Supabase/gte-small) produces 384 dimensions.

Because these dimension sizes were fixed, our recommendation previously was to choose a model that produced as [few dimensions](https://supabase.com/blog/fewer-dimensions-are-better-pgvector) as possible in order to maximize query speeds and scale to a large number of records in a [vector database](https://supabase.com/docs/guides/ai). But does this still apply with OpenAI's new embedding models?

## Shortening embeddings

OpenAI's `text-embedding-3-large` produces 3072 dimensions by default. But with their new `dimensions` API parameter, you can shorten the number of dimensions to any size:

```tsx
import { OpenAI } from 'openai'

const openai = new OpenAI()

const {
  data: [{ embedding }],
} = await openai.embeddings.create({
  model: 'text-embedding-3-large',
  input: 'The cat chases the mouse',
  dimensions: 1024, // Generate an embedding with 1024 dimensions
})

console.log(embedding.length) // 1024
```

Here we shorten the number of dimensions from 3072 to 1024. It's important to recognize that there will be a slight loss in accuracy (understandably) when shortening the embedding. But importantly - the loss is gradual (more on this shortly).

### Diving deeper

You may be wondering if you can shorten embeddings to _any_ dimension size (ie. not just common multiples of 2 like 256, 384, 512, 1024, 1536).

The answer is: yes, technically - but it may not perform as well as you'd expect (more on this later). If you really wanted to though, nothing stops you from generating an embedding with say, 123 dimensions _(again, not recommended)_:

```tsx
const {
  data: [{ embedding }],
} = await openai.embeddings.create({
  model: 'text-embedding-3-large',
  input: 'The cat chases the mouse',
  dimensions: 123,
})

console.log(embedding.length) // 123
```

Naturally our next question was: how does this shortening _actually_ work under the hood?

## Truncating dimensions

As [hinted](https://openai.com/blog/new-embedding-models-and-api-updates#native-support-for-shortening-embeddings) by OpenAI in their blog post, dimensions are shortened simply by removing numbers from the end of vector. If this is true, we should theoretically be able to manually shorten an embedding ourselves by just removing numbers from the end of the vector.

Let's try this, and then compare it to a shortened embedding produced directly from OpenAI's API. First we'll use `text-embedding-3-large` to generate a full-size embedding containing all 3072 dimensions:

```tsx
const {
  data: [{ embedding: fullEmbedding }],
} = await openai.embeddings.create({
  model: 'text-embedding-3-large',
  input: 'The cat chases the mouse',
})
```

Next we generate a shortened embedding at 1024 dimensions using the API:

```tsx
const {
  data: [{ embedding: shortenedEmbedding }],
} = await openai.embeddings.create({
  model: 'text-embedding-3-large',
  input: 'The cat chases the mouse',
  dimensions: 1024,
})
```

Finally we'll truncate our full-size embedding to match the shortened embedding:

```tsx
const truncatedEmbedding = fullEmbedding.slice(0, 1024)
```

Now we compare `truncatedEmbedding` with `shortenedEmbedding`:

```tsx
console.log(truncatedEmbedding)

// [-0.023972103, -0.01711244, 0.003479407, ...]

console.log(shortenedEmbedding)

// [-0.03311979, -0.023642497, 0.0048071383, ...]
```

The outputs are… different. What happened?

We forgot to account for an important vector operation that OpenAI applies to all of their embeddings: normalization. Embeddings are normalized in order to make them compatible with similarity functions like dot product. A normalized vector means that its length (magnitude) is 1 - also referred to as a unit vector.

It's important to remember that as soon as we truncate a unit vector, that new vector is no longer normalized. If we expect to see the same output as OpenAI, we need to renormalize it:

```tsx
const truncatedEmbedding = normalize(fullEmbedding.slice(0, 1024))
```

<details>

<summary>Expand to see how `normalize()` is implemented.</summary>

```tsx
/**
 * Calculates the L2 norm (Euclidean norm) of a vector.
 */
function norm(vector: number[]): number {
  return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
}

/**
 * Normalizes a vector into a unit vector.
 */
function normalize(vector: number[]): number[] {
  const magnitude = norm(vector)

  if (magnitude === 0) {
    throw new Error('Cannot normalize a zero vector.')
  }

  return vector.map((val) => val / magnitude)
}
```

</details>

Let's compare them again:

```tsx
console.log(truncatedEmbedding)

// [ -0.03311979, -0.023642497, 0.0048071386, ...]

console.log(shortenedEmbedding)

// [ -0.03311979, -0.023642497, 0.0048071383, ... ]
```

They're the same! _(apart from minor floating point precision differences)_

It's worth noting that truncating and renormalizing embeddings has always been possible. But importantly, doing this on previous embedding models (ie. to save space or for faster processing) would have lost some, if not all, of the embedding's semantic meaning.

OpenAI explains that their new models have been trained with a technique that allows embeddings to be shortened without the embedding losing its concept-representing properties. How is this possible?

## 🪆 Matryoshka Representation Learning (MRL)

<div>
  <Img
    zoomable={false}
    alt="matryoshka embedding visual"
    src={{
      light: '/images/blog/2024-02-13-matryoshka-embeddings/matryoshka-embedding-visual.png',
      dark: '/images/blog/2024-02-13-matryoshka-embeddings/matryoshka-embedding-visual.png',
    }}
  />
</div>

Introducing [Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147) (MRL). MRL is a training technique inspired by the idea of Russian Matryoshka dolls. It embeds information at multiple granularity levels within a single high-dimensional vector. Information is embedded in a course-to-fine manner, meaning that even if you truncate the embedding at a lower dimension, it still retains useful information, unlike traditional embeddings which might lose their meaning completely.

Training begins with lower (coarser) dimensional sub-vectors and then progressively works upwards to the higher (finer) dimensions, ensuring that each of these sub-vectors is a meaningful representation on its own. This method allows the model to first capture more general, broader features of the data and then gradually refine these representations with more detailed, specific features as the dimensionality increases. It's akin to ensuring that each smaller doll within a Matryoshka set is well-crafted - not just the outermost one.

The choice of sizes for these sub-vectors usually follows a logarithmic pattern, starting at a lower limit then typically doubling each time until reaching the max dimension size. This approach is chosen because the change in accuracy relative to representation size was found to be more logarithmic than linear. It's a choice that ensures the lower-dimensional representations still capture a rich amount of information relative to their size.

The paper claims that high-dimensional embeddings produced using MRL still effectively compete with traditional approaches despite this modified training method. They were also found to work well across multiple modalities. If you're interested to learn more details on MRL, we highly recommend reading the [paper](https://arxiv.org/abs/2205.13147).

For the rest of this post, we'll refer to embeddings produced via MRL as “Matryoshka embeddings”.

## Speeding up vector search with Adaptive Retrieval

Is it possible to take advantage of `text-embedding-3-large`'s Matryoshka trait during vector search? Let's explore.

Querying embeddings with fewer dimensions, as noted in [pgvector: Fewer dimensions are better](https://supabase.com/blog/fewer-dimensions-are-better-pgvector), results in faster queries and less RAM usage. Knowing this, we could naively shorten our 3072 dimension embedding to say, 256 dimensions and observe a massive speed boost over the previous models like `text-embedding-ada-002` (1536 dimensions). And actually according to OpenAI's MTEB scores, `text-embedding-3-large` @ 256 dimensions still outperforms `text-embedding-ada-002` @ 1536 dimensions with an MTEB score of 62.0 vs 61.0.

However, we're still leaving a lot of accuracy on the table. Since we now have access to a hierarchy of meaningful sub-vectors within a single high-dimensional vector, let's adjust our search approach to take advantage of this.

Specifically we'll use a technique called Adaptive Retrieval (also proposed by the MRL paper) that works as follows:

1. **Store high-dimensions:** First store the full-size embeddings as records in the database.
2. **First pass:** Begin by performing similarity search using a low dimensional representation (ie. the first X dimensions of the embedding) to produce a shortlist of records. We're essentially casting a wide net that retrieves all relevant records quickly, but might not be ranked correctly and includes more records than we need.
3. **Second pass:** Next re-rank this shortlist by performing similarity search again, but this time using the high dimensional representation (ie. the entire embedding).
4. **Result:** We are left with a final shortlist of records. The final list is ranked using the highest dimension size (for maximum accuracy), but was produced in a fraction of the time than it would have taken using only the full-size embeddings in a single pass.

In summary - adaptive retrieval uses 2 passes:

- The first pass is less accurate, but fast since it operates on a low dimension. Because it's less accurate, we intentionally retrieve more records than we need.
- The second pass is very accurate, but slower since it operates on a high dimension. Overall though, sorting is faster than single pass approaches since it only has to re-rank a small subset of the total records.

In addition to this, we can also create an index on our first pass query to speed up the initial filtering even further - keep reading!

## Adaptive Retrieval performance

Vector search in the real world requires indexes so that queries remain fast as the number of records increases. The consequence of using a vector index though is that search is no longer exact: approximate nearest neighbor (ANN) search is used instead of exact nearest neighbor (KNN) search. This means that as we evaluate performance, we must consider both speed and accuracy.

To start, we first need to establish a baseline for accuracy. We will do this by comparing the results of the ANN search with those of the exact KNN search on full-sized 3072 dimension vectors. The accuracy metric will be based on the number of IDs that the ANN search returns matching the KNN search. Even though the ANN search will be conducted with vectors of smaller dimensions, we base our accuracy measure on the full-sized vectors because that is our primary area of interest.

For this test, we created 1 million embeddings using OpenAI's `text-embedding-3-large` with dbpedia texts. [The dataset can be found on Hugging Face](https://huggingface.co/datasets/Supabase/dbpedia-openai-3-large-1M). We utilized the code from [ann-filtering-benchmark-datasets](https://github.com/qdrant/ann-filtering-benchmark-datasets) to split our dataset _(thank you to the authors for providing this code)._ The storing dataset includes 975k vectors, and the testing dataset contains 25k vectors, along with the reference KNN results for the top 10 results. The vectors are 3072-dimensional.

### 1536 Dimensional Vectors without Second Pass

We initially attempted to shorten vectors to 1536 dimensions and conducted both KNN and ANN search without the second pass. We embarked on this to understand the maximum attainable accuracy without a second pass using `text-embedding-3-large` embeddings, noting that pgvector indexes max out at 2000 dimensions, and 1536 is a likely sub-vector granularity in `text-embedding-3-large`. The results are as follows:

- We obtained an accuracy of 89.5% with KNN search, signifying the maximum possible accuracy for vectors shortened to 1536 dimensions.
- We achieved an accuracy of 89.2% (HNSW index parameters: `ef_construction=200, m=16, ef_search=400`) with the ANN search, at a speed of 670 queries per second (QPS).

These results indicate that approximately 9 out of the 10 results returned by the ANN search for shortened 1536d vectors will coincide with the KNN search results for the most recent and best performing 3072d OpenAI embedding model. It's a highly encouraging outcome because it implies that we can use the ANN search to accelerate the retrieval process of a high-accuracy embedding model.

### Adaptive Retrieval with 256d vectors

But the question remains: can we boost accuracy by utilizing the adaptive retrieval approach? To discover that, we performed several experiments.

First we ran a single-pass ANN search with 256d vectors. We then compared the results with those from an ANN search at 1536d vectors and also the K-Nearest Neighbors (KNN) search at 3072d vectors.

<div>
  <Img
    alt="matryoshka embedding visual"
    src={{
      light: '/images/blog/2024-02-13-matryoshka-embeddings/performance-chart-1.png',
      dark: '/images/blog/2024-02-13-matryoshka-embeddings/performance-chart-1.png',
    }}
  />
</div>

Afterwards, we shifted to the adaptive retrieval method and carried out a two-pass ANN search with 256d vectors. The first pass was performed with 256d vectors indexed using HNSW, and the second with a KNN search using full 3072d vectors.

<div>
  <Img
    alt="matryoshka embedding visual"
    src={{
      light: '/images/blog/2024-02-13-matryoshka-embeddings/performance-chart-2.png',
      dark: '/images/blog/2024-02-13-matryoshka-embeddings/performance-chart-2.png',
    }}
  />
</div>

The biggest takeaway is that it is possible to achieve 99% accuracy while maintaining good performance in terms of QPS. But is this the best we can do? Let's try other dimension sizes.

### Adaptive Retrieval - Choosing the Optimal First Pass Dimensionality

Next, we conducted a series of benchmarks to determine the best first pass dimensionality for the adaptive retrieval approach. We ran the first pass vector lengths ranging from 256d to 768d. As done before, the second pass was executed using KNN search on the full 3072d vectors.

<div>
  <Img
    alt="matryoshka embedding visual"
    src={{
      light: '/images/blog/2024-02-13-matryoshka-embeddings/performance-chart-3.png',
      dark: '/images/blog/2024-02-13-matryoshka-embeddings/performance-chart-3.png',
    }}
  />
</div>

From this, we observed that the highest performance was achieved with 512d vectors in the first pass. In order to attain 99% accuracy, the following are required:

- 512d vectors in the first pass,
- index built with `ef_construction=400, m=32`,
- first pass search with `ef_search=200` and limit equal to `final_top_k * 8`.

<div>
  <Img
    alt="matryoshka embedding visual"
    src={{
      light: '/images/blog/2024-02-13-matryoshka-embeddings/performance-chart-4.png',
      dark: '/images/blog/2024-02-13-matryoshka-embeddings/performance-chart-4.png',
    }}
  />
</div>

With these parameters we achieved 99% accuracy (relative to 3072d KNN vector search) using Adaptive Retrieval and managed to process up to 580 queries per second.

## Adaptive Retrieval in SQL

Let's implement Adaptive Retrieval in Postgres using pgvector.

First enable the [pgvector extension](https://supabase.com/docs/guides/database/extensions/pgvector):

```sql
create extension vector
with
  schema extensions;
```

Then we'll create a table to store our documents and their embeddings:

```sql
create table documents (
  id bigint primary key generated always as identity,
  content text not null,
  embedding vector (3072)
);
```

Note that we are choosing to store all 3072 dimensions for each document - we'll talk more about this in a bit.

Next we'll create a new Postgres function called `sub_vector` that can shorten embeddings:

```sql
create or replace function sub_vector(v extensions.vector, dimensions int)
returns extensions.vector
language plpgsql
immutable
set search_path = ''
as $$
begin
  if dimensions > extensions.vector_dims(v) then
    raise exception 'dimensions must be less than or equal to the vector size';
  end if;

  return (
    with unnormed(elem) as (
      select x from unnest(v::float4[]) with ordinality v(x, ix)
      where ix <= dimensions
    ),
    norm(factor) as (
      select
        sqrt(sum(pow(elem, 2)))
      from
        unnormed
    )
    select
      array_agg(u.elem / r.factor)::extensions.vector
    from
      norm r, unnormed u
  );
end;
$$;
```

The `sub_vector` function does 2 things:

1. Truncates the vector at the specified number of dimensions
2. Re-normalizes it

It's worth pointing out that we must mark this function as `immutable` in order to use it in our index later. Postgres needs to ensure that the function will consistently return the same result for the same input.

Now we'll create an index on our `documents` table. Compared to previous indexes where we would create an index on the entire embedding vector, this index is built on a small subset of dimensions from the original embedding. We'll use this index later during our first pass shortlist.

```sql
create index on documents
using hnsw ((sub_vector(embedding, 512)::vector(512)) vector_ip_ops)
with (m = 32, ef_construction = 400);
```

This index has a few interesting properties:

- It's a [functional index](https://www.postgresql.org/docs/7.3/indexes-functional.html). We use the `sub_vector` function to dynamically shorten the embedding to 512 dimensions for this index. Because this is a functional index, we will need to be careful on how we later write our first pass query so that Postgres correctly uses this index.
- We need to recast the vector as a `vector(512)`. Indexes in pgvector require vectors to have an explicit dimension size, which our `sub_vector` function is unable to do dynamically on its own.

To learn more about how this type of index works, see [HNSW indexes](https://supabase.com/docs/guides/ai/vector-indexes/hnsw-indexes). To learn more about HNSW indexing options, see [Indexing Options](https://github.com/pgvector/pgvector#index-options) in the official pgvector docs.

It's important to remember that the number of dimensions we choose for this index must match the number of dimensions we later use in our first pass. Here we choose 512 dimensions because our above tests found it to produce the fastest queries at the highest accuracy.

Finally we can create our Adaptive Retrieval match function:

```sql
create or replace function match_documents_adaptive(
  query_embedding extensions.vector(3072),
  match_count int
)
returns setof public.documents
language sql
set search_path = ''
as $$
with shortlist as (
  select *
  from public.documents
  order by
    public.sub_vector(embedding, 512)::extensions.vector(512) operator(extensions.<#>) (
      select public.sub_vector(query_embedding, 512)::extensions.vector(512)
    ) asc
  limit match_count * 8
)
select *
from shortlist
order by embedding operator(extensions.<#>) query_embedding asc
limit least(match_count, 200);
$$;
```

Let's break it down:

- `match_documents_adaptive` accepts 2 parameters:
  1. **A query embedding:** the 3072 dimension embedding generated from the user's query
  2. **A match count:** how many records to return from the final pass
- The first pass is implemented as a [common table expression (CTE)](https://www.postgresql.org/docs/current/queries-with.html) via the `with` clause. It performs the first pass on 512 dimension sub-vectors and returns the top X results into a CTE called `shortlist`.
- We want the first pass to use the index we created earlier, so the syntax we use within `order by` is important:
  - **Left side:** On the left-side of the operator, we must use the exact same expression that we used earlier in our index (ie. `sub_vector()` + cast), otherwise Postgres won't correctly use the index and we'll end up doing a sequential scan over our `documents` table.
  - **Right side:** On the right-side of the operator, we wrap our sub-vector in a `(select ...)` which tells Postgres to cache the value for the rest of the query, otherwise this sub-vector gets recomputed unnecessarily.
- Our second pass simply re-orders our shortlist using the full-size embedding (3072 dimensions) and filters it further (based on `match_count`, with a hard limit of 200 for safety).
- We opted to use inner product (`<#>`) as our similarity operator since it requires less compute than cosine distance (`<=>`). It's important to remember though that inner product should only be used when the vectors you are comparing are normalized. Since our `sub_vector` function included this normalization step, we are safe to use inner product here.
- Regardless of which operator you choose, make sure that your index was also created using the same operator (ie. `vector_ip_ops` for inner product, `vector_cosine_ops` for cosine distance, etc), otherwise Postgres won't use your index.

To use this function in SQL, we can run:

```sql
select
  *
from match_documents_adaptive(query_embedding, 10);
```

Or from the Supabase client library (eg. `supabase-js`):

```tsx
// ... first initialize your supabase client
// and generate your query embedding

const { error: matchError, data: pageSections } = await supabase.rpc('match_documents_adaptive', {
  query_embedding: embedding,
  match_count: 10,
})
```

## Final discussion

<div>
  <Img
    zoomable={false}
    alt="matryoshka vector visual, courtesy of dall-e 3"
    src={{
      light: '/images/blog/2024-02-13-matryoshka-embeddings/matryoshka-hero.png',
      dark: '/images/blog/2024-02-13-matryoshka-embeddings/matryoshka-hero.png',
    }}
  />
</div>

The idea of a single high-dimensional embedding that contains meaningful sub-vectors opens the door to some interesting vector search optimizations. Let's finish by discussing some final questions.

### Can I shorten my embeddings to an arbitrary dimension size?

You can technically, but it may not perform as well as you'd hope. Remember that Matryoshka embedding models are trained on discrete dimension sizes.

For example, a MRL model could be trained on, let's say, 128, 256, 512, and 1024 dimension granularities (the final embedding being 1024 dimensions). Because of this, sub-vectors are most meaningful when they're truncated at exactly one of these discrete granularities.

Otherwise - in the same way that truncating a traditional embedding vector could potentially lose important information, truncating a Matryoshka representation at an untrained granularity may also lose information in unexpected ways.

### Which granularities were OpenAI's `text-embedding-3` models trained on?

As of the time of writing, we don't know yet. But we do know that they were likely trained on at least the following granularities (based on their [MTEB comparisons](https://openai.com/blog/new-embedding-models-and-api-updates#native-support-for-shortening-embeddings)):

- **text-embedding-3-small:** 512 and 1536
- **text-embedding-3-large:** 256, 1024, and 3072

So in theory 256 or 1024 dimensions should be safe to use for first-pass shortlisting on `text-embedding-3-large`, though our real world tests suggest that 512 dimensions in the first pass produce the fastest queries when maximizing accuracy. Based on this, chances are high that 512 was one of the sub-vector sizes used during training.

Assuming OpenAI's models were trained on more granularities than just those though, one method that might work to determine the remaining granularities is: run MTEB benchmarks at a number of different granularities (eg. 8, 16, 32, 64, 128, etc) and observe how the score changes between each. You could potentially infer which granularities were used during training based on plateaus or cliffs observed between dimensions. _(Let us know if you do this!)_

### Can you extend Adaptive Retrieval to more than 2 passes?

In theory yes. The MRL paper calls this approach Funnel Retrieval:

> Funnel thins out the initial shortlist by a repeated re-ranking and shortlisting with a series of increasing capacity representations. Funnel halves the shortlist size and doubles the representation size at every step of re-ranking.

So instead of 2 passes, you modify the algorithm to use N passes, where each pass repeatedly re-ranks and shortlists the results using increasingly larger dimension sizes.

How would this impact performance in pgvector? This needs more exploration, but here are some initial observations:

- The first pass is the most expensive, even with an index (as seen using `explain analyze`). It has to filter the entire table down to a much smaller number of records (relatively). This is why creating an index on the first pass is crucial.
- The second pass is very quick. Even at 3072d using KNN, the time taken to re-rank the initial shortlist is a small fraction of the time taken to complete the first pass.

So the performance gained by splitting the second pass into multiple passes is likely minimal. Finding ways to optimize the first pass will likely result in more gains.

### Why aren't shorter vectors in the first pass faster?

Shorter vectors are faster, but remember that shortening the first pass dimension will decrease accuracy, so we'll need to load more records to compensate (which is slower). Our current tests suggest that increasing the number of records in the first pass impacts speed more than increasing dimension size (hence why 512d with fewer records performed better than 256d with more records).

If you are willing to trade accuracy for speed, lowering the first pass dimension size (without changing the number of records) can certainly increase query speeds (as shown in the tests above). Smaller dimension indexes require less memory, so reducing dimensions keeps your index in memory longer while you scale.

## More pgvector and AI resources

- [Docs pgvector: Vector columns](https://supabase.com/docs/guides/ai/vector-columns)
- [Docs pgvector: Vector indexes](https://supabase.com/docs/guides/ai/vector-indexes)
- [How to build ChatGPT Plugin from scratch with Supabase Edge Runtime](https://supabase.com/blog/building-chatgpt-plugins-template)
- [Choosing Compute Add-on for AI workloads](https://supabase.com/docs/guides/ai/choosing-compute-addon)
- [pgvector 0.6.0: 30x faster with parallel index builds](https://supabase.com/blog/pgvector-fast-builds)
- [pgvector: Fewer dimensions are better](https://supabase.com/blog/fewer-dimensions-are-better-pgvector)
