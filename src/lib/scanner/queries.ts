/**
 * SQL Queries for Database Introspection
 * 
 * SAFETY: These queries ONLY access system catalogs (pg_catalog).
 * They NEVER query user data tables - Zero-Data Policy compliant.
 */

/**
 * Fetches all user tables with their RLS status
 * 
 * Queries:
 * - pg_class: Table metadata
 * - pg_namespace: Schema information
 * 
 * Filters:
 * - Only user schemas (excludes pg_%, information_schema, pg_toast)
 * - Only regular tables (relkind = 'r')
 */
export const QUERY_FETCH_TABLES = `
  SELECT 
    c.relname AS table_name,
    n.nspname AS schema,
    c.relrowsecurity AS rls_enabled
  FROM 
    pg_catalog.pg_class c
  INNER JOIN 
    pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE 
    n.nspname = 'public'
    AND c.relkind = 'r'
  ORDER BY 
    n.nspname, c.relname;
`;

/**
 * Fetches all RLS policies for tables
 * 
 * Queries:
 * - pg_policy: Policy definitions
 * - pg_class: Table metadata
 * - pg_namespace: Schema information
 * 
 * Returns policy details including:
 * - Policy name and command type (SELECT, INSERT, UPDATE, DELETE, ALL)
 * - Roles the policy applies to
 * - USING clause (qual) - the actual security condition
 */
export const QUERY_FETCH_POLICIES = `
  SELECT 
    p.polname AS policy_name,
    c.relname AS table_name,
    n.nspname AS schema,
    p.polcmd AS cmd,
    p.polroles AS roles,
    pg_get_expr(p.polqual, p.polrelid) AS qual,
    pg_get_expr(p.polwithcheck, p.polrelid) AS with_check
  FROM 
    pg_catalog.pg_policy p
  INNER JOIN 
    pg_catalog.pg_class c ON c.oid = p.polrelid
  INNER JOIN
    pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE
    n.nspname = 'public'
  ORDER BY 
    n.nspname, c.relname, p.polname;
`;

/**
 * Detects dangerous write permissions granted to public roles
 *
 * Checks information_schema.role_table_grants for INSERT, UPDATE,
 * DELETE, or TRUNCATE permissions granted to 'anon' or 'authenticated'
 * roles on public schema tables.
 *
 * SAFETY: Read-only query against information_schema (system catalog).
 */
export const QUERY_CHECK_DANGEROUS_GRANTS = `
  SELECT
    table_name,
    grantee,
    privilege_type
  FROM
    information_schema.role_table_grants
  WHERE
    grantee IN ('anon', 'authenticated')
    AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
    AND table_schema = 'public'
  ORDER BY
    table_name, grantee, privilege_type;
`;
