'use server';

import { createClient } from '@/lib/supabase/server';

type CheckoutResult =
    | { url: string; error?: never }
    | { error: string; url?: never };

/**
 * Returns a Lemon Squeezy checkout URL with the authenticated user's ID
 * embedded as custom data so the webhook can identify which account to upgrade.
 */
export async function getCheckoutUrl(): Promise<CheckoutResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to upgrade.' };
    }

    const baseUrl = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL;

    if (!baseUrl) {
        console.error('[billing] NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL is not set');
        return { error: 'Checkout is not configured. Please contact support.' };
    }

    // Append user_id as custom checkout data
    // Lemon Squeezy reads this in the webhook as meta.custom_data.user_id
    const url = `${baseUrl}?checkout[custom][user_id]=${encodeURIComponent(user.id)}`;

    return { url };
}
