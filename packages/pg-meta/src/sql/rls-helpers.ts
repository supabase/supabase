/**
 * RLS Helper Functions for JWT Claims Workaround
 * 
 * Issue: https://github.com/supabase/supabase/issues/42235
 * 
 * These helper functions assist with creating RLS policies that work
 * around the limitation where JWT claims are not available in RLS
 * policy evaluation context.
 */

/**
 * Generate SQL for creating a workaround function
 * This function can be used in RLS policies to get the current user ID
 */
export function generateRLSWorkaroundFunctionSQL(functionName: string = 'get_current_user_id_rls'): string {
  return `
CREATE OR REPLACE FUNCTION public.${functionName}()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sub text;
BEGIN
  BEGIN
    v_sub := current_setting('request.jwt.claim.sub', true);
  EXCEPTION
    WHEN OTHERS THEN
      v_sub := NULL;
  END;

  IF v_sub IS NOT NULL AND v_sub != '' THEN
    RETURN v_sub::uuid;
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.${functionName}() TO authenticated, anon;
`.trim()
}

/**
 * Generate SQL for creating an enhanced workaround function
 * with multiple fallback methods
 */
export function generateEnhancedRLSWorkaroundFunctionSQL(functionName: string = 'get_current_user_id_enhanced'): string {
  return `
CREATE OR REPLACE FUNCTION public.${functionName}()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_sub text;
BEGIN
  -- Method 1: Try auth.uid()
  BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NOT NULL THEN
      RETURN v_user_id;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  -- Method 2: Try JWT claim 'sub'
  BEGIN
    v_sub := current_setting('request.jwt.claim.sub', true);
    IF v_sub IS NOT NULL AND v_sub != '' THEN
      RETURN v_sub::uuid;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  -- Method 3: Try JWT claims JSON
  BEGIN
    v_sub := (current_setting('request.jwt.claims', true)::jsonb ->> 'sub');
    IF v_sub IS NOT NULL AND v_sub != '' THEN
      RETURN v_sub::uuid;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.${functionName}() TO authenticated, anon;
`.trim()
}

/**
 * Generate RLS policy SQL using the workaround function
 */
export function generateRLSPolicySQL(options: {
  policyName: string
  tableName: string
  schema?: string
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  role?: string
  usingClause?: string
  withCheckClause?: string
  workaroundFunction?: string
}): string {
  const {
    policyName,
    tableName,
    schema = 'public',
    operation,
    role = 'authenticated',
    usingClause,
    withCheckClause,
    workaroundFunction = 'get_current_user_id_rls',
  } = options

  const fullTableName = `${schema}.${tableName}`
  const defaultUsing = `user_id = public.${workaroundFunction}()`
  const defaultWithCheck = `user_id = public.${workaroundFunction}()`

  let policySQL = `CREATE POLICY "${policyName}"\n`
  policySQL += `ON ${fullTableName}\n`
  policySQL += `AS PERMISSIVE\n`
  policySQL += `FOR ${operation}\n`
  policySQL += `TO ${role}\n`

  if (operation === 'SELECT' || operation === 'DELETE' || operation === 'UPDATE' || operation === 'ALL') {
    policySQL += `USING (${usingClause || defaultUsing})\n`
  }

  if (operation === 'INSERT' || operation === 'UPDATE' || operation === 'ALL') {
    policySQL += `WITH CHECK (${withCheckClause || defaultWithCheck})\n`
  }

  return policySQL.trim() + ';'
}

/**
 * Generate complete RLS setup SQL for a table
 * Creates workaround function and all standard RLS policies
 */
export function generateCompleteRLSSetupSQL(options: {
  tableName: string
  schema?: string
  userIdColumn?: string
  workaroundFunction?: string
  createFunction?: boolean
}): string {
  const {
    tableName,
    schema = 'public',
    userIdColumn = 'user_id',
    workaroundFunction = 'get_current_user_id_rls',
    createFunction = true,
  } = options

  const fullTableName = `${schema}.${tableName}`
  const functionCall = `public.${workaroundFunction}()`
  const userCondition = `${userIdColumn} = ${functionCall}`

  let sql = ''

  // Create workaround function if requested
  if (createFunction) {
    sql +=
      (workaroundFunction === 'get_current_user_id_enhanced'
        ? generateEnhancedRLSWorkaroundFunctionSQL(workaroundFunction)
        : generateRLSWorkaroundFunctionSQL(workaroundFunction)) + '\n\n'
  }

  // Enable RLS
  sql += `ALTER TABLE ${fullTableName} ENABLE ROW LEVEL SECURITY;\n\n`

  // Grant permissions
  sql += `GRANT SELECT, INSERT, UPDATE, DELETE ON ${fullTableName} TO authenticated;\n\n`

  // Create policies
  sql += generateRLSPolicySQL({
    policyName: `${tableName}_select_own`,
    tableName,
    schema,
    operation: 'SELECT',
    usingClause: userCondition,
  }) + '\n\n'

  sql += generateRLSPolicySQL({
    policyName: `${tableName}_insert_own`,
    tableName,
    schema,
    operation: 'INSERT',
    withCheckClause: userCondition,
  }) + '\n\n'

  sql += generateRLSPolicySQL({
    policyName: `${tableName}_update_own`,
    tableName,
    schema,
    operation: 'UPDATE',
    usingClause: userCondition,
    withCheckClause: userCondition,
  }) + '\n\n'

  sql += generateRLSPolicySQL({
    policyName: `${tableName}_delete_own`,
    tableName,
    schema,
    operation: 'DELETE',
    usingClause: userCondition,
  })

  return sql
}

/**
 * Check if a function exists and is the workaround function
 */
export function isRLSWorkaroundFunction(functionName: string): boolean {
  return functionName === 'get_current_user_id_rls' || functionName === 'get_current_user_id_enhanced'
}

/**
 * Get recommended function name for RLS policies
 * Returns the workaround function name if available, otherwise suggests auth.uid()
 */
export function getRecommendedRLSFunction(): string {
  // In a real implementation, this would check if the function exists
  // For now, return the workaround function name (without parentheses)
  return 'get_current_user_id_rls'
}
