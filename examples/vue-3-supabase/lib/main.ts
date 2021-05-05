import { App, inject, InjectionKey } from "vue";
import { Params } from "./@types/index";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
export interface IVueSupabase {
  install(app: App, params: Params): void;
}

const supabaseInjectionKey: InjectionKey<SupabaseClient> = Symbol();

export const useSupabase = (): typeof inject => inject(supabaseInjectionKey);

export default {
  install: function (app: App, params: Params): void {
    const { supabaseUrl, supabaseKey, options = {} } = params;
    const supabase = createClient(supabaseUrl, supabaseKey, options);

    app.config.globalProperties.$supabase = supabase;
    app.provide(supabaseInjectionKey, supabase);
  },
};
