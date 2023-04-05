import { createServerComponentSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { headers, cookies } from "next/headers";

import type { Database } from "@/lib/database.types";
import RealtimePosts from "./realtime-posts";
import Login from "./login";
import NewPost from "./new-post";

// do not cache this page
export const revalidate = 0;

export default async function ServerComponent() {
  const supabase = createServerComponentSupabaseClient<Database>({
    headers,
    cookies,
  });
  const { data } = await supabase.from("posts").select("*");

  return (
    <>
      <Login />
      <NewPost />
      <RealtimePosts serverPosts={data ?? []} />
    </>
  );
}
