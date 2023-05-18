import { createMiddlewareSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";
import type { Database } from "./lib/database.types";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareSupabaseClient<Database>({ req, res });
    
  const { data: { session } } = await supabase.auth.getSession(); // destructure the data object to obtain the session object
  
  if (session === null) return NextResponse.redirect(new URL("/login", req.nextUrl));
  // instead of "/login" you can redirect to any other route in case the user is not logged in
    
  return res;
}
    
export const config = {
  matcher: [], // add the routes you wish the middleware to run in. You can also use regex
};
