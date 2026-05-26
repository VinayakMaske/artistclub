import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SALT = process.env.INSTAMOJO_SALT!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const data: Record<string, string> = {};
    formData.forEach((value, key) => { data[key] = value.toString(); });

    const macProvided = data.mac;
    if (!macProvided) return NextResponse.json({ error: 'No MAC' }, { status: 400 });

    delete data.mac;
    const sortedKeys = Object.keys(data).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    const message = sortedKeys.map(key => data[key]).join('|');
    const macCalculated = crypto.createHmac('sha1', SALT).update(message).digest('hex');

    if (macProvided !== macCalculated) {
      return NextResponse.json({ error: 'Invalid MAC' }, { status: 400 });
    }

    if (data.status === 'Credit') {
      const artworkId = data.purpose?.split('|')[1] || 'unknown';
      
      const { error } = await supabase.from('supporters').insert({
        artwork_id: artworkId,
        amount: parseFloat(data.amount),
        display_name: data.buyer_name || 'Anonymous',
        email: data.buyer || null,
        payment_status: 'completed',
        payment_id: data.payment_id,
        payment_request_id: data.payment_request_id,
        is_anonymous: false,
        message: null,
      });

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}