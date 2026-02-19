import { z } from 'zod';

/**
 * Zod schema for validating Postgres/Supabase connection strings
 * Ensures the string is a valid postgres:// or postgresql:// URL
 */
export const ConnectionStringSchema = z
    .string()
    .url('Invalid connection string format')
    .refine(
        (val) => val.startsWith('postgres://') || val.startsWith('postgresql://'),
        {
            message: 'Connection string must start with postgres:// or postgresql://',
        }
    );

/**
 * Standardized response type for validation
 */
type ValidationResult =
    | { success: true; data: string }
    | { success: false; error: string };

/**
 * Validates a Postgres connection string format
 * 
 * This function only validates the string format - it does NOT
 * attempt to connect to the database (Zero-Trust Policy).
 * 
 * @param connString - The connection string to validate
 * @returns Standardized result object with success status
 * 
 * @example
 * ```ts
 * const result = validateConnectionString('postgres://user:pass@host/db');
 * if (result.success) {
 *   console.log('Valid connection string:', result.data);
 * } else {
 *   console.error('Validation error:', result.error);
 * }
 * ```
 */
export function validateConnectionString(connString: string): ValidationResult {
    try {
        const validatedString = ConnectionStringSchema.parse(connString);
        return {
            success: true,
            data: validatedString,
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Extract error messages from Zod validation (Zod v4 API)
            const formatted = error.format();
            const errorMessage = formatted._errors?.[0] || 'Invalid connection string';
            return {
                success: false,
                error: errorMessage,
            };
        }

        return {
            success: false,
            error: 'Unexpected validation error occurred',
        };
    }
}
