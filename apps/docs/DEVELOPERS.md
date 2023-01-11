# Developing Supabase Docs

## Getting started

Thanks for your interest in [Supabase docs](https://supabase.com/docs) and for wanting to contribute! Before you begin, read the
[code of conduct](https://github.com/supabase/.github/blob/main/CODE_OF_CONDUCT.md) and check out the
[existing issues](https://github.com/supabase/supabase/issues).
This document describes how to set up your development environment to contribute to [Supabase docs](https://supabase.com/docs).

For a complete run-down on how all of our tools work together, see the main DEVELOPERS.md. That readme describes how to get set up locally in lots of detail, including minimum requirements, our Turborepo setup, installing packages, sharing components across projects, and more. This readme deals specifically with the docs site.

## Local setup

[supabase.com/docs](https://supabase.com/docs) is a Next.JS site. You can get setup by following the same steps for all of our other Next.JS projects:

1. Follow the steps outlined in the Local Development section of the main [DEVELOPERS.md](https://github.com/supabase/supabase/blob/master/DEVELOPERS.md)
2. Start the local docs site by navigating to `/apps/docs` and running `npm run dev`
3. Visit http://localhost:3001/docs in your browser - don't forget to append the `/docs` to the end
4. Your local site should look exactly like [https://supabase.com/docs](https://supabase.com/docs)

## Types of documentation

[https://supabase.com/docs](https://supabase.com/docs) has several different kinds of documentation, all coming from different sources.

### Guides

The primary, instructional type of content. Basically anything that lives on the `https://supabase.com/docs/guides` route. This includes Guides for Auth, Database, Storage, Realtime, Edge Functions, as well as general resources, self-hosting instructions, and integrations. These are all [`.mdx`](https://mdxjs.com/) files — a combination of Markdown and Javascript.

#### Things to know

Here's a simple [example](https://supabase.com/docs/guides/functions) `.mdx` Guide, and here is [the source on Github](https://raw.githubusercontent.com/supabase/supabase/master/apps/docs/pages/guides/functions.mdx).

Some things to note:

1. The files need to import a Layout at the top
2. The files need to export a `Page` at the bottom with the `<Layout>` component
3. The files frontmatter is stored in `const meta = {}`. You should always include `title` and `description`.
4. You can write Markdown as you normally would, but you can also write regular Javascript and JSX. Note the `examples` array that we iterate over.
5. Any Javascript variables you use in these files need to be exported in order to be used (i.e., `export const examples = []`).

##### Using components

You can use any standard React components in these `.mdx` files without having to explicitly import them in each file. All components get imported in a [common components](https://github.com/supabase/supabase/blob/master/apps/docs/components/index.tsx) file and can be used in any `.mdx` file. Components can also be "intercepted" and modified via this file. Note how we're intercepting the `h2`, `h3` and `code` tags and modifying them before converting the `mdx` to `html`.

### Reference docs for client libraries

We maintain client libraries for [Javascript](https://supabase.com/docs/reference/javascript) and [Flutter/Dart](https://supabase.com/docs/reference/dart) (with more to come). These reference docs document every object and method available for developers to use. The are assembled from different sources and work much differently than the `.mdx` Guides we just looked at.

The client libraries are essentially wrappers around the clients for the various tools we use — GoTrue, PostgREST, Storage, Functions, and Realtime. The easiest way to describe how the things fit together is to look at an example and trace where the various pieces of information are coming from.

#### Example

Let's look at the `updateUser()` function in the `supabase-js` library.

#### Common file

Several pieces of information for this function come from a [common file](https://github.com/supabase/supabase/blob/3d774b3b7bcdcb410e25726d832467584ebea686/spec/common-client-libs-sections.json#L548) where we store information shared by all libraries.

1. id — used to identify this function
2. title - the human-readable title
3. slug — the url slug
4. product - the Supabase tool or product that "owns" this function. Since `updateUser()` is an auth function, its product is `auth`
5. type — `updateUser()` is a function and marked as such, but we can also have sections of markdown interspersed with these function definitions.

When a new function is added, this info would need to be manually added to the common file.

#### Function Parameters

The `updateUser()` function takes one parameter: `attributes`. The details for this parameter live in the GoTrue client library, referenced via a `$ref` property in the `supabase-js` [spec file](https://github.com/supabase/supabase/blob/cb04d85262db6a371539dda7df9b00ba5a901e87/spec/supabase_js_v2.yml#L357). Here, the `$ref` property is pointing to the [actual function definition](https://github.com/supabase/gotrue-js/blob/2d60e79073b96ae8c97a6ce18e2601ed1e2a2712/src/GoTrueClient.ts#L590) in the `gotrue-js` library. The accepted values for the `attributes` parameter come from the [type definition](https://github.com/supabase/gotrue-js/blob/16d3deb822097e8640a3a15b94a5690b3beaf11b/src/lib/types.ts#L233).

These individual library spec files are fetched via this [Makefile](https://github.com/supabase/supabase/blob/master/spec/Makefile), and get [transformed](https://github.com/supabase/supabase/blob/master/spec/enrichments/tsdoc_v2/supabase_dereferenced.json) to combine the information we need (params, types, etc). Unless you're a library maintainer, you shouldn't need to worry about this part of the process.

If you are a library maintainer, the last important note about these library files is that the [Makefile](https://github.com/supabase/supabase/blob/master/spec/Makefile) pulls from the `gh-pages` branch of the client library repo. Here's an example of the [`realtime-js` spec file](https://github.com/supabase/realtime-js/blob/gh-pages/v2/spec.json). Updating something like function params or returns, the process is:

1. Get your changes merged to `master` in your library
2. This will kick off an action that automatically updates the spec file in the library's `gh-pages` branch
3. Run `make` in `/spec` of the `supabase/supabase` repo. This will regenerate all of the `tsdoc` files that the docs site uses
4. You should now see the changes you've made in the docs site locally

#### Function Examples

The `updateUser()` function has three examples listed with it. The examples are stored along with the `$ref` property in the [supabase_js_v2 spec file](https://github.com/supabase/supabase/blob/master/spec/supabase_js_v2.yml).

#### Rendering in Next.JS

These reference docs are rendered by Next.JS via a dynamic route using a [`[...slug.tsx]`](https://github.com/supabase/supabase/blob/master/apps/docs/pages/reference/javascript/%5B...slug%5D.tsx). Here, we use the library [spec file](https://github.com/supabase/supabase/blob/bd0514553c627db8f1e8d0b3ae440ccb6759d228/apps/docs/pages/reference/javascript/%5B...slug%5D.tsx#L4) and the [common file](https://github.com/supabase/supabase/blob/bd0514553c627db8f1e8d0b3ae440ccb6759d228/apps/docs/pages/reference/javascript/%5B...slug%5D.tsx#L1) to output the info you see on the page.

### Other reference docs

The reference docs for the [Supabase Management API](https://supabase.com/docs/reference/api) and the [Supabase CLI](https://supabase.com/docs/reference/cli) are a little more straightforward than the client libraries. Both files also have a [common file](https://github.com/supabase/supabase/blob/master/spec/common-cli-sections.json) which handles things like `title`, `id` and `slug`. Both also have a spec file detailing things like parameters, descriptions, and responses ([Management API](https://github.com/supabase/supabase/blob/master/spec/api_v0_openapi.json) / [CLI](https://github.com/supabase/supabase/blob/master/spec/cli_v1_commands.yaml))

On the Next.JS side of things, these work almost exactly the same as the client libaries with a dynamic [`[...slug.tsx]`](https://github.com/supabase/supabase/blob/master/apps/docs/pages/reference/cli/%5B...slug%5D.tsx).

### Misc

#### Search

Search is handled through Algolia. When the site is built, a [search script](https://github.com/supabase/supabase/blob/master/apps/docs/scripts/build-search.ts) runs through all of the types of content, generating search objects that are sent to Algolia to index.
