/**
 * PostgreSQL keywords and function definitions
 */

/** PostgreSQL reserved keywords that require special handling */
export const POSTGRES_RESERVED_KEYWORDS = new Set([
  // SQL Standard reserved keywords
  'ALL', 'ANALYSE', 'ANALYZE', 'AND', 'ANY', 'ARRAY', 'AS', 'ASC', 'ASYMMETRIC',
  'AUTHORIZATION', 'BETWEEN', 'BINARY', 'BOTH', 'CASE', 'CAST', 'CHECK', 'COLLATE',
  'COLLATION', 'COLUMN', 'CONSTRAINT', 'CREATE', 'CROSS', 'CURRENT_CATALOG',
  'CURRENT_DATE', 'CURRENT_ROLE', 'CURRENT_SCHEMA', 'CURRENT_TIME', 'CURRENT_TIMESTAMP',
  'CURRENT_USER', 'DEFAULT', 'DEFERRABLE', 'DESC', 'DISTINCT', 'DO', 'ELSE', 'END',
  'EXCEPT', 'FALSE', 'FETCH', 'FOR', 'FOREIGN', 'FREEZE', 'FROM', 'FULL', 'GRANT',
  'GROUP', 'HAVING', 'ILIKE', 'IN', 'INITIALLY', 'INNER', 'INTERSECT', 'INTO',
  'IS', 'ISNULL', 'JOIN', 'LEADING', 'LEFT', 'LIKE', 'LIMIT', 'LOCALTIME',
  'LOCALTIMESTAMP', 'NATURAL', 'NOT', 'NOTNULL', 'NULL', 'OFFSET', 'ON', 'ONLY',
  'OR', 'ORDER', 'OUTER', 'OVERLAPS', 'PLACING', 'PRIMARY', 'REFERENCES', 'RETURNING',
  'RIGHT', 'SELECT', 'SESSION_USER', 'SIMILAR', 'SOME', 'SYMMETRIC', 'TABLE',
  'THEN', 'TO', 'TRAILING', 'TRUE', 'UNION', 'UNIQUE', 'USER', 'USING', 'VARIADIC',
  'VERBOSE', 'WHEN', 'WHERE', 'WINDOW', 'WITH'
])

/** DDL (Data Definition Language) keywords */
export const DDL_KEYWORDS = new Set([
  'CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'COMMENT'
])

/** DML (Data Manipulation Language) keywords */
export const DML_KEYWORDS = new Set([
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'WITH', 'VALUES'
])

/** DCL (Data Control Language) keywords */
export const DCL_KEYWORDS = new Set([
  'GRANT', 'REVOKE', 'DENY'
])

/** TCL (Transaction Control Language) keywords */
export const TCL_KEYWORDS = new Set([
  'BEGIN', 'COMMIT', 'ROLLBACK', 'SAVEPOINT', 'START'
])

/** Administrative/Utility keywords */
export const UTILITY_KEYWORDS = new Set([
  'VACUUM', 'ANALYZE', 'REINDEX', 'CLUSTER', 'EXPLAIN', 'COPY', 'LOAD'
])

/** PostgreSQL built-in functions that are considered safe for AI execution */
export const SAFE_BUILTIN_FUNCTIONS = new Set([
  // String functions
  'LENGTH', 'CHAR_LENGTH', 'CHARACTER_LENGTH', 'LOWER', 'UPPER', 'INITCAP',
  'SUBSTRING', 'SUBSTR', 'POSITION', 'STRPOS', 'LEFT', 'RIGHT', 'REVERSE',
  'REPEAT', 'REPLACE', 'TRANSLATE', 'TRIM', 'LTRIM', 'RTRIM', 'LPAD', 'RPAD',
  'CONCAT', 'CONCAT_WS', 'FORMAT', 'SPLIT_PART', 'REGEXP_REPLACE', 'REGEXP_SPLIT_TO_TABLE',
  
  // Numeric functions
  'ABS', 'CEIL', 'CEILING', 'FLOOR', 'ROUND', 'TRUNC', 'SIGN', 'SQRT', 'POWER', 'POW',
  'EXP', 'LN', 'LOG', 'SIN', 'COS', 'TAN', 'ASIN', 'ACOS', 'ATAN', 'ATAN2',
  'DEGREES', 'RADIANS', 'PI', 'RANDOM', 'WIDTH_BUCKET',
  
  // Date/Time functions
  'NOW', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'LOCALTIME', 'LOCALTIMESTAMP',
  'DATE_PART', 'EXTRACT', 'DATE_TRUNC', 'AGE', 'JUSTIFY_DAYS', 'JUSTIFY_HOURS',
  'JUSTIFY_INTERVAL', 'MAKE_DATE', 'MAKE_TIME', 'MAKE_TIMESTAMP', 'MAKE_TIMESTAMPTZ',
  'TO_TIMESTAMP', 'TO_DATE', 'TO_CHAR',
  
  // Aggregate functions
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'STDDEV', 'VARIANCE', 'CORR', 'COVAR_POP',
  'COVAR_SAMP', 'REGR_AVGX', 'REGR_AVGY', 'REGR_COUNT', 'REGR_INTERCEPT',
  'REGR_R2', 'REGR_SLOPE', 'REGR_SXX', 'REGR_SXY', 'REGR_SYY',
  
  // Window functions
  'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'PERCENT_RANK', 'CUME_DIST', 'NTILE',
  'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE', 'NTH_VALUE',
  
  // Conditional functions
  'COALESCE', 'NULLIF', 'GREATEST', 'LEAST', 'CASE',
  
  // Type conversion functions
  'CAST', 'CONVERT', 'TO_NUMBER', 'TO_CHAR', 'TO_DATE', 'TO_TIMESTAMP',
  
  // Array functions
  'ARRAY_LENGTH', 'ARRAY_DIMS', 'ARRAY_UPPER', 'ARRAY_LOWER', 'ARRAY_TO_STRING',
  'STRING_TO_ARRAY', 'ARRAY_APPEND', 'ARRAY_PREPEND', 'ARRAY_CAT', 'ARRAY_POSITION',
  'ARRAY_POSITIONS', 'ARRAY_REMOVE', 'ARRAY_REPLACE', 'CARDINALITY',
  
  // JSON functions (PostgreSQL 9.2+)
  'JSON_EXTRACT_PATH', 'JSON_EXTRACT_PATH_TEXT', 'JSON_OBJECT_KEYS',
  'JSON_POPULATE_RECORD', 'JSON_POPULATE_RECORDSET', 'JSON_ARRAY_ELEMENTS',
  'JSON_ARRAY_ELEMENTS_TEXT', 'JSON_TYPEOF', 'JSON_TO_RECORD', 'JSON_TO_RECORDSET',
  'JSONB_EXTRACT_PATH', 'JSONB_EXTRACT_PATH_TEXT', 'JSONB_OBJECT_KEYS',
  'JSONB_POPULATE_RECORD', 'JSONB_POPULATE_RECORDSET', 'JSONB_ARRAY_ELEMENTS',
  'JSONB_ARRAY_ELEMENTS_TEXT', 'JSONB_TYPEOF', 'JSONB_TO_RECORD', 'JSONB_TO_RECORDSET'
])

/** PostgreSQL functions that are potentially dangerous and should be restricted */
export const DANGEROUS_FUNCTIONS = new Set([
  // File system functions
  'PG_READ_FILE', 'PG_READ_BINARY_FILE', 'PG_LS_DIR', 'PG_STAT_FILE',
  
  // Administrative functions
  'PG_CANCEL_BACKEND', 'PG_TERMINATE_BACKEND', 'PG_RELOAD_CONF', 'PG_ROTATE_LOGFILE',
  'PG_CREATE_RESTORE_POINT', 'PG_START_BACKUP', 'PG_STOP_BACKUP',
  
  // System functions
  'VERSION', 'PG_BACKEND_PID', 'PG_CONF_LOAD_TIME', 'PG_IS_IN_RECOVERY',
  'PG_LAST_WAL_RECEIVE_LSN', 'PG_LAST_WAL_REPLAY_LSN', 'PG_LAST_XACT_REPLAY_TIMESTAMP',
  
  // Large object functions
  'LO_CREAT', 'LO_CREATE', 'LO_UNLINK', 'LO_IMPORT', 'LO_EXPORT',
  
  // COPY functions
  'COPY_FROM', 'COPY_TO',
  
  // Dynamic SQL
  'EXECUTE'
])

/** PostgreSQL system catalogs and information schema tables */
export const SYSTEM_CATALOGS = new Set([
  'PG_CLASS', 'PG_ATTRIBUTE', 'PG_PROC', 'PG_TYPE', 'PG_DATABASE', 'PG_USER',
  'PG_SHADOW', 'PG_GROUP', 'PG_ROLES', 'PG_AUTH_MEMBERS', 'PG_AUTHID',
  'PG_TABLESPACE', 'PG_NAMESPACE', 'PG_CONSTRAINT', 'PG_INDEX', 'PG_INHERITS',
  'PG_OPERATOR', 'PG_OPCLASS', 'PG_AM', 'PG_AMOP', 'PG_AMPROC', 'PG_LANGUAGE',
  'PG_LARGEOBJECT', 'PG_AGGREGATE', 'PG_STATISTIC', 'PG_REWRITE', 'PG_TRIGGER',
  'PG_LISTENER', 'PG_SETTING', 'PG_PREPARED_XACTS', 'PG_PREPARED_STATEMENTS',
  'PG_LOCKS', 'PG_CURSORS', 'PG_AVAILABLE_EXTENSIONS', 'PG_AVAILABLE_EXTENSION_VERSIONS',
  'INFORMATION_SCHEMA'
])

/** Schema names that are typically system-managed */
export const SYSTEM_SCHEMAS = new Set([
  'INFORMATION_SCHEMA', 'PG_CATALOG', 'PG_TOAST', 'PG_TEMP_1', 'PG_TOAST_TEMP_1'
])

/**
 * Check if a keyword is a PostgreSQL reserved word
 */
export function isReservedKeyword(keyword: string): boolean {
  return POSTGRES_RESERVED_KEYWORDS.has(keyword.toUpperCase())
}

/**
 * Check if a function is considered safe for AI execution
 */
export function isSafeFunction(functionName: string): boolean {
  return SAFE_BUILTIN_FUNCTIONS.has(functionName.toUpperCase())
}

/**
 * Check if a function is potentially dangerous
 */
export function isDangerousFunction(functionName: string): boolean {
  return DANGEROUS_FUNCTIONS.has(functionName.toUpperCase())
}

/**
 * Check if a table/view is a system catalog
 */
export function isSystemCatalog(tableName: string): boolean {
  return SYSTEM_CATALOGS.has(tableName.toUpperCase())
}

/**
 * Check if a schema is system-managed
 */
export function isSystemSchema(schemaName: string): boolean {
  return SYSTEM_SCHEMAS.has(schemaName.toUpperCase())
}

/**
 * Get the query category based on the main keyword
 */
export function getQueryCategoryFromKeyword(keyword: string): string {
  const upperKeyword = keyword.toUpperCase()
  
  if (DDL_KEYWORDS.has(upperKeyword)) return 'DDL'
  if (DML_KEYWORDS.has(upperKeyword)) return 'DML'
  if (DCL_KEYWORDS.has(upperKeyword)) return 'DCL'
  if (TCL_KEYWORDS.has(upperKeyword)) return 'TCL'
  if (UTILITY_KEYWORDS.has(upperKeyword)) return 'UTILITY'
  
  return 'UNKNOWN'
}