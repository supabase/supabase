---
id: auth-row-level-security
title: 'Part Two: Row Level Security'
description: Supabase Auth Deep Dive Part Two - Row Level Security
---

### About

Learn how to restrict access to your database tables by enabling Row Level Security and writing Postgres Policies in the Supabase Dashboard.

### Watch

<iframe className="w-full video-with-border" width="640" height="385" src="https://www.youtube-nocookie.com/embed/qY_iQ10IUhs" frameBorder="1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>

### Securing Your Tables

In Supabase, you can access your data directly from the client (often the web browser), you do this by passing your Supabase URL and Anon key to supabase-js like so:

```js
const supabase = createClient(
  'https://qwertyuiop.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
)
```

This raises an interesting question however: "if my anon key is in the client, then can't someone read my javascript and steal my key?", the answer is yes. And this is where Postgres policies come in.

Using Postgres's "Row-Level-Security" policies, we can set rules on what data the anon key is allowed or not allowed to access by default.

We can say for example that the anon key should only be able to read from a particular table, but not write, update, nor delete.

And these rules can be as complex as we want. We could say that the anon key can only delete rows which were inserted on a thursday afternoon between 4 and 6pm, and where the id column is an even number. Pretty strange, but it shows the power of policies.

Let's say we create a leaderboard table. We want people on our website to be able to read the leaderboard, but not write, update, or delete from it. We start by defining our table in SQL and adding some dummy data:

```sql
create table leaderboard (
    name text,
    score int
);

insert into leaderboard(name, score)
values ('Paul', 100), ('Leto', 50), ('Chani', 200);
```

Now let's set up a client to read the data, I've created a repl here to show a living example: [https://replit.com/@awalias/supabase-leaderboard-demo#index.js](https://replit.com/@awalias/supabase-leaderboard-demo#index.js). If you copy the snippet you can plug in your own Supabase URL and anon key.

You can see that it's possible to freely read from and write to the table by using:

```js
// Writing
let { data, error } = await supabase.from('leaderboard').insert({ name: 'Bob', score: 99999 })

// Reading
let { data, error } = await supabase
  .from('leaderboard')
  .select('name, score')
  .order('score', { ascending: false })
```

Now let's restrict access. We'll start by fully restricting the table. We can do this in the SQL editor by making a query:

```sql
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
```

or via the Supabase Dashboard, by navigating to Auth > Policies, and clicking the red padlock on the leaderboard table, so that it turns white.

![Enable row level security in Supabase](/img/auth-deep-dive-2.png)

You'll notice that both reading and writing now fail with an error like:

```jsx
{
  hint: null,
  details: null,
  code: '42501',
  message: 'new row violates row-level security policy for table "leaderboard"'
}
```

Now we need to add a policy to enable reading of the table, for everyone who sends the anon key (JWT) in the `Authorization: Bearer` header.

In SQL this can be done with:

```sql
CREATE POLICY anon_read_leaderboard ON leaderboard
    FOR SELECT
    USING (auth.role() = 'anon');
```

`anon_read_leaderboard` here is just a name that you choose for your policy. `leaderboard` is the table name. `FOR SELECT` says that we only want this policy to apply for reads (or rather "selects" in SQL). And finally the rule itself is `auth.role() = 'anon'`.

`auth.role()` is referring to a SQL function `role` that Supabase injects into the `auth` schema in your database. The function actually looks like this:

```sql
-- Gets the User Role from the request cookie
create or replace function auth.role() returns text as $$
  select nullif(current_setting('request.jwt.claim.role', true), '')::text;
$$ language sql stable;
```

The purpose of the function is to extract the `role` claim from any JWTs that are passed to your API via the `Authorization: Bearer` header.

Other available functions for use here include: `auth.email()` and `auth.uid()` which will fetch the `email` and `sub` claims respectively.

If you'd prefer to use the dashboard to add your policy you can do so by clicking "Add Policy" in the Policies tab and making a policy like this:

![Add a read only policy in Supabase](/img/auth-deep-dive-2-2.png)

You should now be able to read from your leaderboard, but will still not be able to write, update, or delete from it, which is exactly what we wanted!

A quick reminder that you can always use your `service_role` API key to bypass these row level security policies. But be extra careful that you don't leak this key by including it in the client. This can be useful if you're building internal admin tools, or if you need to bulk insert or delete data via the API.

In the next guide we will look at using Policies in combination with User Accounts, so that you can restrict access to data on a User by User basis: Watch [Part Three: Policies](/docs/learn/auth-deep-dive/auth-policies)

### Resources

- JWT debugger: https://jwt.io/
- RESTED: https://github.com/RESTEDClient/RESTED

### Next steps

- Watch [Part One: JWTs](/docs/learn/auth-deep-dive/auth-deep-dive-jwts)
<!-- - Watch [Part Two: Row Level Security](/docs/learn/auth-deep-dive/auth-row-level-security) -->
- Watch [Part Three: Policies](/docs/learn/auth-deep-dive/auth-policies)
- Watch [Part Four: GoTrue](/docs/learn/auth-deep-dive/auth-gotrue)
- Watch [Part Five: Google Oauth](/docs/learn/auth-deep-dive/auth-google-oauth)
- Sign up for Supabase: [app.supabase.io](https://app.supabase.io)
