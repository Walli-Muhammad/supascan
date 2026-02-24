import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// ── Event types we care about ─────────────────────────────────────────────────

const PRO_EVENTS = new Set([
    'subscription_created',
    'subscription_updated',
    'subscription_payment_success',
]);

const CANCEL_EVENTS = new Set([
    'subscription_cancelled',
    'subscription_expired',
]);

// ── Lemon Squeezy body shape (partial) ───────────────────────────────────────

interface LemonPayload {
    meta: {
        event_name: string;
        custom_data?: {
            user_id?: string;
        };
    };
    data: {
        id: string; // subscription_id
        attributes: {
            customer_id: number;
            status: string;
        };
    };
}

// ── Signature verification ────────────────────────────────────────────────────

function verifySignature(rawBody: Buffer, signature: string, secret: string): boolean {
    const expected = createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

    try {
        // timingSafeEqual prevents timing attacks
        return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
    } catch {
        // If lengths differ, timingSafeEqual throws — treat as invalid
        return false;
    }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    // ── 1. Read raw body (needed for HMAC verification) ──────────────────────
    const rawBody = Buffer.from(await req.arrayBuffer());

    // ── 2. Verify signature ───────────────────────────────────────────────────
    const signature = req.headers.get('x-signature') ?? '';
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET ?? '';

    if (!secret) {
        console.error('[lemon-webhook] LEMON_SQUEEZY_WEBHOOK_SECRET is not set');
        return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (!verifySignature(rawBody, signature, secret)) {
        console.warn('[lemon-webhook] Signature mismatch — rejected');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // ── 3. Parse body ─────────────────────────────────────────────────────────
    let payload: LemonPayload;
    try {
        payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const eventName = payload.meta.event_name;
    const userId = payload.meta.custom_data?.user_id;
    const subscriptionId = payload.data.id;
    const customerId = String(payload.data.attributes.customer_id);

    console.log(`[lemon-webhook] Event: ${eventName} | user: ${userId} | sub: ${subscriptionId}`);

    // ── 4. We need a user_id to do anything meaningful ────────────────────────
    if (!userId) {
        console.warn('[lemon-webhook] No user_id in custom_data — skipping DB update');
        return NextResponse.json({ received: true, skipped: 'no user_id' });
    }

    // ── 5. Init Supabase admin client (bypasses RLS) ──────────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('[lemon-webhook] Missing Supabase env vars');
        return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 6. Update profiles based on event type ────────────────────────────────
    if (PRO_EVENTS.has(eventName)) {
        const { error } = await supabaseAdmin
            .from('profiles')
            .upsert(
                {
                    id: userId,
                    is_pro: true,
                    lemon_customer_id: customerId,
                    subscription_id: subscriptionId,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'id' }
            );

        if (error) {
            console.error('[lemon-webhook] DB upsert failed:', error.message);
            // Return 500 so Lemon Squeezy retries the webhook
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        console.log(`[lemon-webhook] ✅ User ${userId} upgraded to pro`);

    } else if (CANCEL_EVENTS.has(eventName)) {
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({
                is_pro: false,
                subscription_id: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        if (error) {
            console.error('[lemon-webhook] DB update (cancel) failed:', error.message);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        console.log(`[lemon-webhook] ⬇️ User ${userId} downgraded from pro`);

    } else {
        // Unhandled event — acknowledge without acting
        console.log(`[lemon-webhook] Unhandled event '${eventName}' — ack only`);
    }

    return NextResponse.json({ received: true });
}
