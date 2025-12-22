export type ValidationError =
  | { type: 'objects_depending_on_pg_cron'; dependents: string[] }
  | {
      type: 'indexes_referencing_ll_to_earth'
      schema_name: string
      table_name: string
      index_name: string
    }
  | {
      type: 'function_using_obsolete_lang'
      schema_name: string
      function_name: string
      lang_name: string
    }
  | { type: 'unsupported_extension'; extension_name: string }
  | { type: 'unsupported_fdw_handler'; fdw_name: string; fdw_handler_name: string }
  | {
      type: 'unlogged_table_with_persistent_sequence'
      schema_name: string
      table_name: string
      sequence_name: string
    }
  | {
      type: 'user_defined_objects_in_internal_schemas'
      obj_type: 'table' | 'function'
      schema_name: string
      obj_name: string
    }
  | { type: 'active_replication_slot'; slot_name: string }
