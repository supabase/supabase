# Query Supabase from Cloudflare Worker

**[📹 Video](https://egghead.io/lessons/cloudflare-query-supabase-from-cloudflare-worker?af=9qsk0a)**

Supabase JS is an NPM package which provides a simple interface from JavaScript to our Supabase project. It allows us to query and mutate data using its Object Relational Mapping (ORM) syntax, and subscribe to realtime events.

In this video, we install the Supabase JS package and create a new client using our project's URL and Anon Key. These can be found in the Supabase dashboard for our project, under `Settings > API`.

We store these values as secrets in our Cloudflare account, and use them to instantiate a new Supabase client.

Additionally, we write a query to select all of our articles from our Supabase instance, and send them back as the response from our Cloudflare Worker.

In order to send a JSON response, we first stringify the object we get back from Supabase, and then set a `Content-Type` header to notify the browser that this will be a type of `application/json`.

## Code Snippets

**Install Supabase JS**

```bash
npm i @supabase/supabase-js
```

**Create a Cloudflare secret**

```bash
npx wrangler secret put NAME
```

**Add a secret for SUPABASE_URL**

```bash
npx wrangler secret put SUPABASE_URL
```

**Run wrangler development server**

```bash
npx wrangler dev
```

**Add a secret for SUPABASE_ANON_KEY**

```bash
npx wrangler secret put SUPABASE_ANON_KEY
```

**Query data from Supabase**

```javascript
const { data } = await supabase.from("articles").select("*");
```

**Send JSON response**

```javascript
return new Response(JSON.stringify(data), {
  headers: {
    "Content-Type": "application/json",
  },
});
```

## Resources

- [Selecting data with Supabase JS](https://supabase.com/docs/reference/javascript/select)
- [Introducing Secrets and Environment Variables to Cloudflare Workers](https://blog.cloudflare.com/workers-secrets-environment/)
- [Cloudflare docs for sending JSON responses](https://developers.cloudflare.com/workers/examples/return-json/)

---

[👉 Next lesson](https://github.com/dijonmusters/supabase-data-at-the-edge/tree/main/04-proxy-supabase-requests-with-cloudflare-workers-and-itty-router)

---

Enjoying the course? Follow Jon Meyers on [Twitter](https://twitter.com/jonmeyers_io) and subscribe to the [YouTube channel](https://www.youtube.com/c/jonmeyers).
