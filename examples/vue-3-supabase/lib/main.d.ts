import type { IVueSupabase } from "./main";
declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $supabase: IVueSupabase;
  }
}
