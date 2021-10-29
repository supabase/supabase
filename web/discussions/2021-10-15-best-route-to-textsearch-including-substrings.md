---
title: "Best route to textSearch including substrings"
author: fergusmeiklejohn
tags: [Question]
author_image_url: https://avatars.githubusercontent.com/u/11864025?u=aaf0a27a9e98b054fa9e72ffbe4e172bf46d6e8c&v=4
author_url: https://github.com/fergusmeiklejohn
category: Q&A
upvoteCount: 2
commentCount: 1
-- image: https://i.imgur.com/mErPwqL.png
hide_table_of_contents: false
---

How do we do a textSearch where user inputs "supa" and we find "Supabase" in the target column?
At the moment the textSearch will find no matches on searching for "supa", while users used to google searches would expect substring search to find the full word.
I found this Trigram module that looks like it might work for this use case: https://www.postgresql.org/docs/current/pgtrgm.html

What do experts think about this? What should be our strategy to do full text search including substrings?

---

<a href="https://github.com/supabase/supabase/discussions/3542#discussioncomment-1490074" className="margin-bottom--md">Open on GitHub</a>

<details open style={{borderWidth: 1, borderColor: '#3ecf8e', backgroundColor: 'transparent'}}>
  <summary>
    <h2>Suggested Answer</h2>
  </summary>
  <div className="avatar">
  <a href="https://github.com/dthyresson" style={{display: 'flex'}} className="margin-vert--md">
  <span className="col--1 avatar ">
    <img className="avatar__photo avatar__photo--sm" src="https://avatars.githubusercontent.com/u/1051633?v=4"/>
  </span>
  <span style={{display: 'flex'}}>
    <span className="margin-horiz--sm">dthyresson</span>
    <span style={{ color: '#8b949e' }}>12 days ago</span>
  </span>
  </a>
  </div>
  Hi @fergusmeiklejohn Full text search on Postgres relies on lexemes -- little parts of words (English words) that in its smallest form can identify that word and related ones: plurals, adjective forms, cases, etc.

You can try this SQL to experiment with lexemes:

```sql
-- acheive lexeme

SELECT
  to_tsvector(w.word)
FROM (
  SELECT
    'achievement' AS word) AS w;


SELECT
  *
FROM (
  SELECT
    'achievement' AS word) AS w
WHERE
  to_tsvector(w.word) @@ to_tsquery('achieve');

SELECT
  *
FROM (
  SELECT
    'Achievements' AS word) AS w
WHERE
  to_tsvector(w.word) @@ to_tsquery('achieve');

SELECT
  *
FROM (
  SELECT
    'Achiever' AS word) AS w
WHERE
  to_tsvector(w.word) @@ to_tsquery('Achieve');

-- supabase

SELECT
  to_tsvector(w.word)
FROM (
  SELECT
    'Supabase' AS word) AS w;


SELECT
  *
FROM (
  SELECT
    'Supabase' AS word) AS w
WHERE
  to_tsvector(w.word) @@ to_tsquery('supabases');
```

You can see that "achievement" is `'achiev':1` and this can match `achievement`, `Achiever` `achievements` in a search query.

Supabase however is not a general English word, so its lexeme is `supabas:1` so it will also match a plural 'Supabases'.

You might want to explore fuzzy (enable the `FUZZYSTRMATCH` extension) search approaches instead of full text -- and also the trigram.

See: https://www.postgresql.org/docs/13/fuzzystrmatch.html

```sql
SELECT soundex('Supabase'), soundex('Supa'), difference('Supabase', 'Supa');
```

And if the difference in the sounded is within a threshold, it is a match.

Or

```sql
SELECT levenshtein('Supabase', 'Supa');
```

If you enable `PG_TRGM` you can as you note do:

```sql
SELECT word_similarity('Supabase', 'Supa');
```

  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
    <p>⬆️  <span className="margin-left--sm">2</span></p>
    <p>0 replies</p>
  </div>
</details> 
