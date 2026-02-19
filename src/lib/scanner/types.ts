/**
 * Security finding severity levels
 * CRITICAL: Immediate action required (e.g., public tables with RLS disabled)
 * HIGH: Significant security risk
 * MEDIUM: Moderate security concern
 * LOW: Minor security improvement
 * INFO: Informational finding
 */
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

/**
 * Category of security findings — maps to "Inside-Out" audit domains
 */
export type FindingCategory =
  | 'RLS'           // Row Level Security issues
  | 'PITR'          // Point-in-Time Recovery / backup issues
  | 'AUTH'          // Authentication & MFA issues
  | 'NETWORK'       // Extension/network exposure issues
  | 'PERMISSIONS'   // Dangerous grants and privilege issues
  | 'MISCONFIGURATION'; // General misconfigurations

/**
 * Enterprise safeguard check result — for PITR, MFA, extensions etc.
 */
export interface SafeguardCheck {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'UNKNOWN';
  detail: string;
}

/**
 * Represents a single security finding from a scan
 */
export interface Finding {
  /** Unique identifier for this finding */
  id: string;

  /** Severity level of the security issue */
  severity: Severity;

  /** Category of the security finding */
  category: FindingCategory;

  /** Name of the affected table or system component */
  table: string;

  /** Human-readable description of the security issue */
  message: string;

  /** Plain-English explanation of WHY this is dangerous */
  risk: string;

  /** Business impact priority for triage */
  impact: 'HIGH' | 'MEDIUM' | 'LOW';

  /** SQL snippet or instructions to fix the issue */
  remediation: string;

  /** Optional: CLI / Supabase Dashboard command (when SQL isn't enough) */
  remediation_cli?: string;
}

/**
 * Security profile for a single database table
 * Contains RLS status and associated policies
 */
export interface TableSecurityProfile {
  /** Schema name (e.g., 'public', 'auth') */
  schema: string;

  /** Table name */
  name: string;

  /** Whether Row Level Security is enabled on this table */
  rls_enabled: boolean;

  /** List of RLS policy names applied to this table */
  policies: string[];

  /** Raw policy definitions (qual + with_check expressions) */
  policy_defs?: { name: string; qual: string | null; with_check: string | null }[];
}

/**
 * Complete scan result with security score and findings
 */
export interface ScanResult {
  /** Security score from 0-100 (100 = perfect security) */
  score: number;

  /** List of all security findings discovered during scan */
  findings: Finding[];

  /** Total number of tables analyzed */
  tables_scanned: number;

  /** Scan execution time in milliseconds */
  scan_duration_ms: number;

  /** ISO 8601 timestamp when scan completed */
  timestamp: string;

  /** Hostname of the scanned database (privacy-safe, no credentials) */
  target_host: string;

  /** List of security controls that were verified as safe */
  passed_checks: string[];

  /** Enterprise safeguard status checks (PITR, MFA, extensions) */
  enterprise_safeguards?: SafeguardCheck[];
}
