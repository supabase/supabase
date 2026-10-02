// NOTE(Nyannyacha): This is the same test case as described in denoland/deno_core#762, but it is a
// minimal reproducible sample of what happens in the field.
//
// The point of this test case is that multiple specifiers of the same module
// graph are redirected concurrently. Version-less `deno.land/x` specifiers are
// used because they always answer with a redirect to the latest tag.
//
// It used to use `https://lib.deno.dev/x/grammy@1.x/...`, but that host no
// longer resolves any path, so the redirect never happened in the first place.

import * as A from "https://deno.land/x/grammy/mod.ts";
import * as B from "https://deno.land/x/grammy/types.ts";

console.log(A, B);

Deno.serve((_req) => new Response("meow"));
