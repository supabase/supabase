# Use waitUntil to perform work after Cloudflare Worker returns response

**[📹 Video](https://egghead.io/lessons/supabase-use-waituntil-to-perform-work-after-cloudflare-worker-returns-response?af=9qsk0a)**

The `waitUntil` function allows us to continue performing work in our Cloudflare Worker, after a response has been sent back to the client.

In this lesson, we modify the `revalidate` route to send a response immediately, and then continue on to fetch new data and refresh our KV store.

Finally, we use the Thunder Client extension to simulate a POST request to the `revalidate` route, and confirm that this receives a response before the cache is updated.

## Code Snippets

**Update Revalidate route to respond immediately**

```javascript
router.post(
  "/revalidate",
  withContent,
  async (request, { SUPABASE_URL, SUPABASE_ANON_KEY, ARTICLES }, context) => {
    const updateCache = async () => {
      const { type, record, old_record } = request.content;
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      if (type === "INSERT" || type === "UPDATE") {
        await writeTo(ARTICLES, `/articles/${record.id}`, record);
      }

      if (type === "DELETE") {
        await ARTICLES.delete(`/articles/${old_record.id}`);
      }

      const { data: articles } = await supabase.from("articles").select("*");
      await writeTo(ARTICLES, "/articles", articles);
      console.log("updated cache");
    };

    context.waitUntil(updateCache());

    console.log("sending response");

    return json({ received: true });
  }
);
```

**Run wrangler development server**

```bash
npx wrangler dev
```

## Resources

- [Cloudflare waitUntil docs](https://developers.cloudflare.com/workers/runtime-apis/scheduled-event/)
- [Supabase.js docs](https://github.com/supabase/supabase-js)
- [Wrangler CLI docs](https://developers.cloudflare.com/workers/wrangler/commands/)
- [KV Storage docs](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Thunder Client VS Code extension](https://marketplace.visualstudio.com/items?itemName=rangav.vscode-thunder-client)

---

Enjoying the course? Follow Jon Meyers on [Twitter](https://twitter.com/jonmeyers_io) and subscribe to the [YouTube channel](https://www.youtube.com/c/jonmeyers).
