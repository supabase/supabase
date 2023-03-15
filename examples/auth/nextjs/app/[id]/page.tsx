import { Database } from "@/lib/database.types";
import { createServerComponentSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { notFound } from "next/navigation";
import RealtimePost from "./realtime-post";
import { headers, cookies } from "next/headers";

// do not cache this page
export const revalidate = 0;

export default async function Post({
  params: { id },
}: {
  params: { id: string };
}) {
  const supabase = createServerComponentSupabaseClient<Database>({
    headers,
    cookies,
  });
  const { data: post } = await supabase
    .from("posts")
    .select()
    .match({ id })
    .single();

  if (!post) {
    notFound();
  }

  return <RealtimePost serverPost={post} />;
}
