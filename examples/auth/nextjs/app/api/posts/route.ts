import { createRouteHandlerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";

import type { Database } from "@/lib/database.types";

export async function POST(request: Request) {
  const { content } = await request.json();

  const supabase = createRouteHandlerSupabaseClient<Database>({
    headers,
    cookies,
  });

  const { data } = await supabase.from("posts").insert({ content }).select();

  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const { id, content } = await request.json();

  const supabase = createRouteHandlerSupabaseClient<Database>({
    headers,
    cookies,
  });

  const { data } = await supabase
    .from("posts")
    .update({ content })
    .match({ id })
    .select();

  return NextResponse.json(data);
}
