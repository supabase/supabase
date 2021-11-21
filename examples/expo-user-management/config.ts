if (!process.env.SUPABASE_URL) {
  console.log(
    "config.ts",
    "Make sure you have a `.env` file to populate your variables."
  );
}

export const SUPABASE_URL = process.env.REACT_NATIVE_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY =
  process.env.REACT_NATIVE_SUPABASE_ANON_KEY || "";
