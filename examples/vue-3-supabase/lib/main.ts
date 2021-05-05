import { App } from "vue";
import { Params } from "./@types/index";
import { createClient } from "@supabase/supabase-js";
export interface IVueSupabase {
  install(app: App, params: Params): void;
}

export default {
  install: function (app: App, params: Params): void {
    const { supabaseUrl, supabaseKey, options = {} } = params;
    const supabase = createClient(supabaseUrl, supabaseKey, options);

    app.config.globalProperties.$supabase = supabase;
    app.provide("supabase", supabase);
  },
};
