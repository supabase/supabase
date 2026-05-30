---
title: 'Use Supabase Auth with Astro'
subtitle: 'Learn how to configure Supabase Auth for Astro with server-side rendering.'
breadcrumb: 'Auth Quickstarts'
hideToc: true
---

<StepHikeCompact>

  <StepHikeCompact.Step step={1}>
    <StepHikeCompact.Details title="Create a new Supabase project">

    Head over to [database.new](https://database.new) and create a new Supabase project.

    Your new database has a table for storing your users. You can see that this table is currently empty by running some SQL in the [SQL Editor](/dashboard/project/_/sql/new).

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

     ```sql name=SQL_EDITOR
      select * from auth.users;
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={2}>

    <StepHikeCompact.Details title="Create an Astro app">

    Create a new Astro app using the `npm create` command.

    <$Partial path="uiLibCta.mdx" />

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```bash name=Terminal
      npm create astro@latest my-app
      cd my-app
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={3}>
    <StepHikeCompact.Details title="Install Supabase libraries and Node adapter">

    Install the `@supabase/supabase-js` client library, `@supabase/ssr` for server-side auth, and the `@astrojs/node` adapter to enable server-side rendering.

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```bash name=Terminal
      npm install @supabase/supabase-js @supabase/ssr @astrojs/node
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={4}>
    <StepHikeCompact.Details title="Configure Astro for SSR">

    Update your `astro.config.mjs` to enable server-side rendering with the Node adapter.

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```js name=astro.config.mjs
      import { defineConfig } from "astro/config";
      import node from "@astrojs/node";

      export default defineConfig({
        output: "server",
        adapter: node({
          mode: "standalone",
        }),
      });
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={5}>
    <StepHikeCompact.Details title="Declare Supabase Environment Variables">

    Create a `.env.local` file and populate with your Supabase connection variables:

    <ProjectConfigVariables variable="url" />
    <ProjectConfigVariables variable="publishable" />

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```text name=.env.local
      PUBLIC_SUPABASE_URL=your-project-url
      PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_key
      ```

      <$Partial path="api_settings_steps.mdx" variables={{ "framework": "astro", "tab": "frameworks" }} />

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={6}>
    <StepHikeCompact.Details title="Create a Supabase client helper">

    Create a utility file to initialize the Supabase client with SSR support:

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```ts name=src/lib/supabase.ts
      import { createServerClient, parseCookieHeader } from "@supabase/ssr";
      import type { AstroCookies } from "astro";

      const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
      const supabasePublishableKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY

      export function createClient({
        request,
        cookies,
      }: {
        request: Request;
        cookies: AstroCookies;
      }) {
        return createServerClient(
          supabaseUrl,
          supabasePublishableKey,
          {
            cookies: {
              getAll() {
                return parseCookieHeader(
                  request.headers.get("Cookie") ?? ""
                );
              },
              setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookies.set(name, value, options)
                );
              },
            },
          }
        );
      }
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={7}>
    <StepHikeCompact.Details title="Create authentication actions">

    Create a new file at `src/actions/index.ts` to define server-side authentication actions for signing up, signing in, and signing out:

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```ts name=src/actions/index.ts
      import { defineAction } from "astro:actions";
      import { z } from "astro/zod";
      import { createClient } from "../lib/supabase";

      export const server = {
        signUp: defineAction({
          accept: "form",
          input: z.object({
            email: z.string().email(),
            password: z.string().min(6),
          }),
          handler: async (input, context) => {
            try {
              const supabase = createClient({
                request: context.request,
                cookies: context.cookies,
              });

              const { error } = await supabase.auth.signUp({
                email: input.email,
                password: input.password,
                options: {
                  emailRedirectTo: "http://localhost:4321/auth/callback",
                },
              });

              if (error) {
                return {
                  success: false,
                  message: error.message,
                };
              }

              return {
                success: true,
                message: "Check your email to confirm your account",
              };
            } catch (err) {
              return {
                success: false,
                message: "Unexpected error",
              };
            }
          },
        }),
        signIn: defineAction({
          accept: "form",
          input: z.object({
            email: z.string().email(),
            password: z.string(),
          }),
          handler: async (input, context) => {
            try {
              const supabase = createClient({
                request: context.request,
                cookies: context.cookies,
              });

              const { error } = await supabase.auth.signInWithPassword({
                email: input.email,
                password: input.password,
              });

              if (error) {
                return {
                  success: false,
                  message: error.message,
                };
              }

              return {
                success: true,
                message: "Signed in successfully",
              };
            } catch (err) {
              return {
                success: false,
                message: "Unexpected error",
              };
            }
          },
        }),
        signOut: defineAction({
          handler: async (_, context) => {
            try {
              const supabase = createClient({
                request: context.request,
                cookies: context.cookies,
              });

              await supabase.auth.signOut();

              return {
                success: true,
              };
            } catch (err) {
              return {
                success: false,
                message: "Failed to sign out",
              };
            }
          },
        }),
      };
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={8}>
    <StepHikeCompact.Details title="Customize email template">

    Before users can confirm their email, update the Supabase email template to send the token hash to your callback URL.

    In your [Supabase project dashboard](/dashboard/project/_/auth/templates):
    - Go to **Auth** > **Email Templates**
    - Select the **Confirm signup** template
    - Change `{{ .ConfirmationURL }}` to `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email`.
    - Change your [Site URL](/dashboard/project/_/auth/url-configuration) to `http://localhost:4321`

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```html name=Email\ Template
      {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={9}>
    <StepHikeCompact.Details title="Create an auth callback page">

    Create a new file at `src/pages/auth/callback.astro` to handle the email confirmation callback. Extract the token from the URL and verify it with Supabase:

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```astro name=src/pages/auth/callback.astro
      ---
      import { createClient } from "../../lib/supabase";
      import type { EmailOtpType } from "@supabase/supabase-js";

      const supabase = createClient({
        request: Astro.request,
        cookies: Astro.cookies,
      });

      const requestUrl = new URL(Astro.request.url);
      const token_hash = requestUrl.searchParams.get('token_hash');
      const type = requestUrl.searchParams.get('type') as EmailOtpType | null;

      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type,
        });

        if (!error) {
          return Astro.redirect("/dashboard");
        }
      }

      return Astro.redirect("/auth/signin");
      ---

      <html>
        <head>
          <title>Email Confirmation</title>
        </head>
        <body>
          <p>Confirming your email...</p>
        </body>
      </html>
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={10}>
    <StepHikeCompact.Details title="Create a sign-up page">

    Create a new file at `src/pages/auth/signup.astro` with a sign-up form. Use a client-side event listener to handle form submission:

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```astro name=src/pages/auth/signup.astro
      ---
      import { createClient } from "../../lib/supabase";

      const supabase = createClient({
        request: Astro.request,
        cookies: Astro.cookies,
      });

      const { data } = await supabase.auth.getUser();

      if (data?.user) {
        return Astro.redirect("/dashboard");
      }
      ---

      <html>
        <head>
          <title>Sign Up</title>
        </head>
        <body>
          <h1>Sign Up</h1>

          <div id="message"></div>

          <form id="signup-form">
            <div>
              <label for="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label for="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="At least 6 characters"
                required
              />
            </div>
            <button type="submit" id="signup-btn">Sign Up</button>
          </form>
          <p>
            Already have an account? <a href="/auth/signin">Sign in</a>
          </p>
        </body>
      </html>

      <script>
        import { actions } from "astro:actions";

        const form = document.querySelector("#signup-form") as HTMLFormElement;
        const btn = document.getElementById("signup-btn") as HTMLButtonElement;
        const messageEl = document.getElementById("message") as HTMLDivElement;

        form?.addEventListener("submit", async (e) => {
          e.preventDefault();
          btn.disabled = true;
          btn.textContent = "Signing up...";
          messageEl.textContent = "";

          try {
            const formData = new FormData(form);
            const result = await actions.signUp(formData);

            if (!result.data?.success) {
              btn.disabled = false;
              btn.textContent = "Sign Up";
              messageEl.textContent = result.data?.message || "Sign up failed";
              messageEl.style.color = "red";
              return;
            }

            messageEl.textContent = result.data.message;
            messageEl.style.color = "green";
            btn.textContent = "Sign Up";
          } catch (error) {
            btn.disabled = false;
            btn.textContent = "Sign Up";
            messageEl.textContent = "An error occurred. Please try again.";
            messageEl.style.color = "red";
            console.error(error);
          }
        });
      </script>
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={11}>
    <StepHikeCompact.Details title="Create a sign-in page">

    Create a new file at `src/pages/auth/signin.astro` with a sign-in form. Use a client-side event listener to handle form submission:

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```astro name=src/pages/auth/signin.astro
      ---
      import { createClient } from "../../lib/supabase";

      const supabase = createClient({
        request: Astro.request,
        cookies: Astro.cookies,
      });

      const { data } = await supabase.auth.getUser();

      if (data?.user) {
        return Astro.redirect("/dashboard");
      }
      ---

      <html>
        <head>
          <title>Sign In</title>
        </head>
        <body>
          <h1>Sign In</h1>

          <div id="message"></div>

          <form id="signin-form">
            <div>
              <label for="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label for="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Your password"
                required
              />
            </div>
            <button type="submit" id="signin-btn">Sign In</button>
          </form>
          <p>
            Don't have an account? <a href="/auth/signup">Sign up</a>
          </p>
        </body>
      </html>

      <script>
        import { actions } from "astro:actions";

        const form = document.querySelector("#signin-form") as HTMLFormElement;
        const btn = document.getElementById("signin-btn") as HTMLButtonElement;
        const messageEl = document.getElementById("message") as HTMLDivElement;

        form?.addEventListener("submit", async (e) => {
          e.preventDefault();
          btn.disabled = true;
          btn.textContent = "Signing in...";
          messageEl.textContent = "";

          try {
            const formData = new FormData(form);
            const result = await actions.signIn(formData);

            if (!result.data?.success) {
              btn.disabled = false;
              btn.textContent = "Sign In";
              messageEl.textContent = result.data?.message || "Sign in failed";
              messageEl.style.color = "red";
              return;
            }

            // Redirect to dashboard on successful sign in
            window.location.href = "/dashboard";
          } catch (error) {
            btn.disabled = false;
            btn.textContent = "Sign In";
            messageEl.textContent = "An error occurred. Please try again.";
            messageEl.style.color = "red";
            console.error(error);
          }
        });
      </script>
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={12}>
    <StepHikeCompact.Details title="Create a dashboard page">

    Create a new file at `src/pages/dashboard.astro` to display the authenticated user's information. Use a client-side event listener for the sign-out button:

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```astro name=src/pages/dashboard.astro
      ---
      import { createClient } from "../lib/supabase";

      const supabase = createClient({
        request: Astro.request,
        cookies: Astro.cookies,
      });

      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        return Astro.redirect("/auth/signin");
      }
      ---

      <html>
        <head>
          <title>Dashboard</title>
        </head>
        <body>
          <h1>Welcome!</h1>
          <p>Email: {user.email}</p>
          <p>User ID: {user.id}</p>

          <button id="signout-btn">Sign Out</button>
        </body>
      </html>

      <script>
        import { actions } from "astro:actions";

        const btn = document.getElementById("signout-btn") as HTMLButtonElement;

        btn?.addEventListener("click", async (e) => {
          e.preventDefault();
          btn.disabled = true;
          btn.textContent = "Signing out...";

          try {
            const result = await actions.signOut();

            if (!result.data?.success) {
              btn.disabled = false;
              btn.textContent = "Sign Out";
              alert("Failed to sign out");
              return;
            }

            // Redirect to signin page
            window.location.href = "/auth/signin";
          } catch (error) {
            btn.disabled = false;
            btn.textContent = "Sign Out";
            console.error(error);
          }
        });
      </script>
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>

  <StepHikeCompact.Step step={13}>
    <StepHikeCompact.Details title="Start the app">

    Start the development server, then navigate to http://localhost:4321/auth/signup to test the authentication.

    </StepHikeCompact.Details>

    <StepHikeCompact.Code>

      ```bash name=Terminal
      npm run dev
      ```

    </StepHikeCompact.Code>

  </StepHikeCompact.Step>
</StepHikeCompact>

## Learn more

- [Supabase Auth docs](/docs/guides/auth#authentication) for more Supabase authentication methods
