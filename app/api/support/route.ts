import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      artwork_id,
      user_id,
      amount,
      display_name,
      email,
      is_anonymous,
      message,
      payment_id,
    } = body;

    // Validate required fields
    if (!artwork_id || !amount || !display_name || !payment_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert supporter record
    const { data, error } = await supabase
      .from('supporters')
      .insert([{
        artwork_id,
        user_id: user_id || null,
        amount,
        display_name: is_anonymous ? 'Anonymous Patron' : display_name,
        email: email || null,
        is_anonymous: is_anonymous || false,
        message: message || null,
        payment_status: 'completed',
        payment_id,
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to record support' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, supporter: data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}