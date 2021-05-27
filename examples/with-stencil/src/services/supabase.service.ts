import { createClient } from '@supabase/supabase-js';

let instance = null;

/**
 * This class is a singleton service to handle Supabase connection.
 *
 * @class SupabaseService
 * @docs https://gist.github.com/ftonato/23585d6098490d0239feaeddb7f1e56c
 * @author Ademílson F. Tonato - ftonato
 *
 */
export default class SupabaseService {
  supabase: any;
  constructor(supabaseUrl: string, supabaseKey: string) {
    if (!supabaseUrl) throw new Error(`${SupabaseService.getClassName()} => supabaseUrl is required.`);
    if (!supabaseKey) throw new Error(`${SupabaseService.getClassName()} => supabaseKey is required.`);

    if (!instance) {
      instance = this;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);

    return instance;
  }

  static getClassName(): string {
    return SupabaseService.name;
  }
}
