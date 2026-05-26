import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { artwork_id, bidder_name, email, phone, bid_amount, message } = body;

    // Validate required fields
    if (!artwork_id || !bidder_name || !email || !bid_amount) {
      return NextResponse.json(
        { error: 'Missing required fields: artwork_id, bidder_name, email, bid_amount' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate bid amount
    if (Number(bid_amount) <= 0) {
      return NextResponse.json(
        { error: 'Bid amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Insert bid
    const { data, error } = await supabase
      .from('auction_bids')
      .insert({
        artwork_id,
        bidder_name,
        email,
        phone: phone || null,
        bid_amount: Number(bid_amount),
        message: message || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to place bid: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bid: data,
      message: 'Bid placed successfully. Awaiting approval.',
    });

  } catch (error: any) {
    console.error('Auction bid error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}