import { Hono } from 'hono';
import { getSupabase, supabaseMiddleware } from './middleware/auth.middleware';

const app = new Hono();
app.use('*', supabaseMiddleware());

const routes = app.get('/api/user', async (c) => {
  const supabase = getSupabase(c);
  const { data, error } = await supabase.auth.getUser();

  if (error) console.log('error', error);

  if (!data?.user) {
    return c.json({
      message: 'You are not logged in.',
    });
  }

  return c.json({
    message: 'You are logged in!',
    userId: data.user,
  });
});

app.get('/signout', async (c) => {
  const supabase = getSupabase(c);
  await supabase.auth.signOut();
  console.log('Signed out server-side!');
  return c.redirect('/');
});

app.get('/countries', async (c) => {
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('countries').select('*');
  if (error) console.log(error);
  return c.json(data);
});

export type AppType = typeof routes;

app.get('/', (c) => {
  return c.html(
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link
          rel="stylesheet"
          href="https://cdn.simplecss.org/simple.min.css"
        />
        {import.meta.env.PROD ? (
          <script type="module" src="/static/client.js" />
        ) : (
          <script type="module" src="/src/client.tsx" />
        )}
      </head>
      <body>
        <div id="root" />
      </body>
    </html>
  );
});

export default app;
